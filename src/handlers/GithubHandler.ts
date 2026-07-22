import { QuestionDifficulty } from '../types/Question';
import { Submission } from '../types/Submission';
import type { CodeforcesSubmission } from '../types/CodeforcesSubmission';
import { getCodeforcesExtension } from './CodeforcesHandler';

type GithubUser = {
  id: number;
  avatar_url?: string | null;
  url: string;
  login: string;
};

type RepositoryVisibilityKey =
  | 'github_repo_visibility'
  | 'github_codeforces_repo_visibility';

const languagesToExtensions: Record<string, string> = {
  Python: '.py',
  Python3: '.py',
  'C++': '.cpp',
  C: '.c',
  Java: '.java',
  'C#': '.cs',
  JavaScript: '.js',
  Javascript: '.js',
  Ruby: '.rb',
  Swift: '.swift',
  Go: '.go',
  Kotlin: '.kt',
  Scala: '.scala',
  Rust: '.rs',
  PHP: '.php',
  TypeScript: '.ts',
  MySQL: '.sql',
  'MS SQL Server': '.sql',
  Oracle: '.sql',
  PostgreSQL: '.sql',
  'C++14': '.cpp',
  'C++17': '.cpp',
  'C++11': '.cpp',
  'C++98': '.cpp',
  'C++03': '.cpp',
  'C++20': '.cpp',
  'C++1z': '.cpp',
  'C++1y': '.cpp',
  'C++1x': '.cpp',
  'C++1a': '.cpp',
  CPP: '.cpp',
  Dart: '.dart',
  Elixir: '.ex',
};

const storedString = (value: unknown) => (typeof value === 'string' ? value : '');

const credentialPatterns = [
  /github_pat_[A-Za-z0-9_]{20,}/,
  /gh[pousr]_[A-Za-z0-9]{20,}/,
  /(?:AKIA|ASIA)[A-Z0-9]{16}/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /xox[baprs]-[A-Za-z0-9-]{20,}/,
  /sk_(?:live|test)_[A-Za-z0-9]{16,}/,
  /sk-(?:proj-)?[A-Za-z0-9_-]{20,}/,
  /AIza[0-9A-Za-z_-]{35}/,
  /npm_[A-Za-z0-9]{30,}/,
];

export const containsLikelyCredential = (content: string) =>
  credentialPatterns.some((pattern) => pattern.test(content));

export default class GithubHandler {
  private readonly baseUrl = 'https://api.github.com';
  private accessToken = '';
  private repoOwner = '';
  private repo = '';
  private subdirectory = '';
  private usesSeparateCodeforcesRepository = false;

  async loadTokenFromStorage(): Promise<string> {
    const result = await chrome.storage.local.get('github_leetsync_token');
    return storedString(result.github_leetsync_token);
  }

  async validateAndStoreToken(token: string): Promise<GithubUser | null> {
    const trimmedToken = token.trim();
    if (!trimmedToken.startsWith('github_pat_')) return null;

    const response = await fetch(`${this.baseUrl}/user`, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${trimmedToken}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });
    if (!response.ok) return null;

    const user = (await response.json()) as GithubUser;
    if (!user.login) return null;

    await chrome.storage.local.set({
      github_leetsync_token: trimmedToken,
      github_username: user.login,
    });
    return user;
  }

  async checkIfRepoExists(
    fullName: string,
    visibilityKey: RepositoryVisibilityKey = 'github_repo_visibility',
  ): Promise<boolean> {
    const token = await this.loadTokenFromStorage();
    const normalized = fullName.replace(/\.git$/i, '').trim();
    if (!token || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(normalized)) return false;

    const response = await fetch(`${this.baseUrl}/repos/${normalized}`, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });
    if (!response.ok) return false;

    const repository = await response.json();
    const writable = repository.permissions?.push !== false;
    if (writable) {
      await chrome.storage.local.set({
        [visibilityKey]: repository.private === false ? 'public' : 'private',
      });
    }
    return writable;
  }

  getProblemExtension(lang: string) {
    return languagesToExtensions[lang];
  }

  private async loadConfiguration(platform: 'leetcode' | 'codeforces'): Promise<boolean> {
    const result = await chrome.storage.local.get([
      'github_leetsync_token',
      'github_username',
      'github_repo_owner',
      'github_leetsync_repo',
      'github_codeforces_repo_owner',
      'github_codeforces_repo',
      'github_leetsync_subdirectory',
    ]);
    this.accessToken = storedString(result.github_leetsync_token);
    const codeforcesOwner = storedString(result.github_codeforces_repo_owner);
    const codeforcesRepo = storedString(result.github_codeforces_repo);
    this.usesSeparateCodeforcesRepository =
      platform === 'codeforces' && !!(codeforcesOwner && codeforcesRepo);
    this.repoOwner = this.usesSeparateCodeforcesRepository
      ? codeforcesOwner
      : storedString(result.github_repo_owner) || storedString(result.github_username);
    this.repo = this.usesSeparateCodeforcesRepository
      ? codeforcesRepo
      : storedString(result.github_leetsync_repo);
    this.subdirectory = storedString(result.github_leetsync_subdirectory);
    return !!(this.accessToken && this.repoOwner && this.repo);
  }

  private contentUrl(path: string, fileName: string) {
    const encodedPath = `${path}/${fileName}`
      .split('/')
      .filter(Boolean)
      .map(encodeURIComponent)
      .join('/');
    return `${this.baseUrl}/repos/${encodeURIComponent(this.repoOwner)}/${encodeURIComponent(
      this.repo,
    )}/contents/${encodedPath}`;
  }

  private async fileExists(path: string, fileName: string): Promise<string | null> {
    const response = await fetch(this.contentUrl(path, fileName), {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${this.accessToken}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`GitHub read failed with status ${response.status}`);
    return ((await response.json()) as { sha: string }).sha;
  }

  private async upload(path: string, fileName: string, content: string, commitMessage: string) {
    const sha = await this.fileExists(path, fileName);
    const data: { message: string; content: string; sha?: string } = {
      message: commitMessage,
      content: btoa(unescape(encodeURIComponent(content))),
    };
    if (sha) data.sha = sha;

    const response = await fetch(this.contentUrl(path, fileName), {
      method: 'PUT',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`GitHub upload failed with status ${response.status}`);
  }

  async submitCodeforces(submission: CodeforcesSubmission): Promise<boolean> {
    if (!(await this.loadConfiguration('codeforces')) || submission?.verdict !== 'OK') return false;

    const synced = (await chrome.storage.local.get('codeforces_synced_submissions'))
      .codeforces_synced_submissions;
    const syncedSubmissions =
      synced && typeof synced === 'object' ? (synced as Record<string, unknown>) : {};
    if (syncedSubmissions[submission.id]) return false;

    const { code, contestId, problem, programmingLanguage } = submission;
    if (
      !code ||
      !Number.isInteger(contestId) ||
      !/^[A-Za-z0-9]+$/.test(problem?.index ?? '') ||
      !problem?.name
    ) {
      return false;
    }
    if (containsLikelyCredential(code)) {
      await chrome.storage.local.set({
        lastUploadError: 'Upload blocked because the Codeforces solution may contain a credential.',
      });
      return false;
    }

    const problemId = `${contestId}${problem.index}`;
    const slug = problem.name
      .normalize('NFKD')
      .replace(/[^A-Za-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase() || 'problem';
    const basePath = [
      this.subdirectory,
      this.usesSeparateCodeforcesRepository ? '' : 'Codeforces',
      `${problemId}-${slug}`,
    ]
      .filter(Boolean)
      .join('/');
    const details = [
      problem.rating ? `**Rating:** ${problem.rating}` : '',
      problem.tags?.length ? `**Tags:** ${problem.tags.join(', ')}` : '',
      `**Submission:** [${submission.id}](${submission.submissionUrl})`,
    ]
      .filter(Boolean)
      .join(' · ');
    const readme = `<h2><a href="${submission.problemUrl}">${problemId} - ${problem.name}</a></h2>\n\n${details}\n\n<hr>\n\n${
      submission.statement || 'Open the linked Codeforces problem to view its statement.'
    }`;

    await this.upload(basePath, 'README.md', readme, `Add Codeforces README for ${problemId}`);
    await this.upload(
      basePath,
      `${slug}${getCodeforcesExtension(programmingLanguage)}`,
      code,
      `Accepted Codeforces ${problemId} using ${programmingLanguage} - CodeSync`,
    );

    await chrome.storage.local.set({
      lastUploadError: null,
      codeforces_synced_submissions: {
        ...syncedSubmissions,
        [submission.id]: {
          contestId,
          index: problem.index,
          name: problem.name,
          timestamp: submission.creationTimeSeconds * 1000,
        },
      },
    });
    return true;
  }

  getDifficultyColor(difficulty: QuestionDifficulty) {
    switch (difficulty) {
      case 'Easy':
        return 'brightgreen';
      case 'Medium':
        return 'orange';
      case 'Hard':
        return 'red';
    }
  }

  createDifficultyBadge(difficulty: QuestionDifficulty) {
    return `<img src='https://img.shields.io/badge/Difficulty-${difficulty}-${this.getDifficultyColor(
      difficulty,
    )}' alt='Difficulty: ${difficulty}' />`;
  }

  private async createReadmeFile(
    path: string,
    content: string,
    message: string,
    problemSlug: string,
    questionTitle: string,
    difficulty: QuestionDifficulty,
  ) {
    const mdContent = `<h2><a href="https://leetcode.com/problems/${problemSlug}">${questionTitle}</a></h2> ${this.createDifficultyBadge(
      difficulty,
    )}<hr>${content}`;
    await this.upload(path, 'README.md', mdContent, message);
  }

  private async createNotesFile(
    path: string,
    notes: string,
    message: string,
    questionTitle: string,
  ) {
    await this.upload(path, 'Notes.md', `<h2>${questionTitle} Notes</h2><hr>${notes}`, message);
  }

  private async createSolutionFile(
    path: string,
    code: string,
    problemName: string,
    lang: string,
    stats: {
      memoryDisplay: string;
      memoryPercentile: number;
      runtimeDisplay: string;
      runtimePercentile: number;
    },
  ) {
    const message = `Time: ${stats.runtimeDisplay} (${stats.runtimePercentile.toFixed(
      2,
    )}%) | Memory: ${stats.memoryDisplay} (${stats.memoryPercentile.toFixed(2)}%) - CodeSync`;
    await this.upload(path, `${problemName}${lang}`, code, message);
  }

  async submit(submission: Submission): Promise<boolean> {
    if (!(await this.loadConfiguration('leetcode')) || !submission || submission.statusCode !== 10) {
      return false;
    }

    const { code, lang, memoryDisplay, memoryPercentile, notes, question, runtimeDisplay, runtimePercentile } =
      submission;
    if (!question?.titleSlug || !/^[A-Za-z0-9-]+$/.test(question.titleSlug)) return false;
    if (containsLikelyCredential(`${code}\n${notes ?? ''}`)) {
      await chrome.storage.local.set({
        lastUploadError: 'Upload blocked because the solution or notes may contain a credential.',
      });
      return false;
    }

    const questionId = String(question.questionFrontendId ?? question.questionId ?? 'unknown').replace(
      /[^A-Za-z0-9_.-]/g,
      '-',
    );
    let basePath = `${questionId}-${question.titleSlug}`;
    if (this.subdirectory) {
      const parts = this.subdirectory.split('/').filter(Boolean);
      if (parts.some((part) => part === '..' || !/^[A-Za-z0-9_.-]+$/.test(part))) return false;
      basePath = `${parts.join('/')}/${basePath}`;
    }

    const extension = this.getProblemExtension(lang.verboseName);
    if (!extension) return false;

    await this.createReadmeFile(
      basePath,
      question.content,
      `Added README.md file for ${question.title}`,
      question.titleSlug,
      question.title,
      question.difficulty,
    );
    if (notes) {
      await this.createNotesFile(
        basePath,
        notes,
        `Added Notes.md file for ${question.title}`,
        question.title,
      );
    }
    await this.createSolutionFile(basePath, code, question.titleSlug, extension, {
      memoryDisplay,
      memoryPercentile,
      runtimeDisplay,
      runtimePercentile,
    });

    const timestamp = Date.now();
    const storedProblems = (await chrome.storage.local.get('problemsSolved')).problemsSolved;
    const problemsSolved =
      storedProblems && typeof storedProblems === 'object'
        ? (storedProblems as Record<string, unknown>)
        : {};
    await chrome.storage.local.set({
      lastUploadError: null,
      lastSolved: { slug: question.titleSlug, timestamp },
      problemsSolved: {
        ...problemsSolved,
        [question.titleSlug]: {
          question: { difficulty: question.difficulty, questionId: question.questionId },
          timestamp,
        },
      },
    });
    return true;
  }
}
