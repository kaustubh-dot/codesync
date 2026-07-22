import type { CodeforcesSubmission } from '../types/CodeforcesSubmission';

type ApiSubmission = {
  id: number;
  contestId: number;
  creationTimeSeconds: number;
  verdict?: string;
  programmingLanguage: string;
  problem: CodeforcesSubmission['problem'];
};

const sleep = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const pageUrl = (contestId: number, suffix: string) =>
  `https://codeforces.com/${contestId >= 100_000 ? 'gym' : 'contest'}/${contestId}/${suffix}`;

export const getCodeforcesExtension = (language: string) => {
  const value = language.toUpperCase();
  if (value.includes('C++') || value.includes('G++') || value.includes('CLANG++')) return '.cpp';
  if (value.includes('PYTHON') || value.includes('PYPY')) return '.py';
  if (value.includes('JAVA') && !value.includes('JAVASCRIPT')) return '.java';
  if (value.includes('GNU C') || value === 'C' || value.includes('CLANG C')) return '.c';
  if (value.includes('RUST')) return '.rs';
  if (value === 'GO' || value.startsWith('GO ')) return '.go';
  if (value.includes('KOTLIN')) return '.kt';
  if (value.includes('TYPESCRIPT')) return '.ts';
  if (value.includes('JAVASCRIPT') || value.includes('NODE.JS')) return '.js';
  if (value.includes('C#') || value.includes('CSHARP')) return '.cs';
  if (value.includes('RUBY')) return '.rb';
  if (value.includes('PHP')) return '.php';
  if (value.includes('SCALA')) return '.scala';
  if (value.includes('HASKELL')) return '.hs';
  if (value.includes('PASCAL') || value.includes('DELPHI')) return '.pas';
  return '.txt';
};

export default class CodeforcesHandler {
  static async validateHandle(handle: string): Promise<string | null> {
    const trimmed = handle.trim();
    if (!/^[A-Za-z0-9_.-]{3,24}$/.test(trimmed)) return null;

    const response = await fetch(
      `https://codeforces.com/api/user.info?handles=${encodeURIComponent(trimmed)}`,
    );
    if (!response.ok) return null;
    const body = await response.json();
    return body.status === 'OK' && typeof body.result?.[0]?.handle === 'string'
      ? body.result[0].handle
      : null;
  }

  async getLatestAcceptedSubmission(
    handle: string,
    attempts = 1,
  ): Promise<CodeforcesSubmission | null> {
    let latest: ApiSubmission | undefined;

    for (let attempt = 0; attempt < attempts; attempt++) {
      const response = await fetch(
        `https://codeforces.com/api/user.status?handle=${encodeURIComponent(handle)}&from=1&count=1`,
        { credentials: 'include', cache: 'no-store' },
      );
      if (!response.ok) return null;
      const body = await response.json();
      latest = body.status === 'OK' ? body.result?.[0] : undefined;
      if (latest?.verdict === 'OK') break;
      if (latest?.verdict && latest.verdict !== 'TESTING') return null;
      if (attempt + 1 < attempts) await sleep(2000);
    }

    if (
      latest?.verdict !== 'OK' ||
      !Number.isInteger(latest.id) ||
      !Number.isInteger(latest.contestId) ||
      !latest.problem?.index ||
      !latest.problem?.name ||
      !latest.programmingLanguage
    ) {
      return null;
    }
    if (Date.now() / 1000 - latest.creationTimeSeconds > 180) return null;

    const submissionUrl = pageUrl(latest.contestId, `submission/${latest.id}`);
    const problemUrl = pageUrl(latest.contestId, `problem/${encodeURIComponent(latest.problem.index)}`);
    const [submissionPage, problemPage] = await Promise.all([
      fetch(submissionUrl, { credentials: 'include', cache: 'no-store' }),
      fetch(problemUrl, { credentials: 'include', cache: 'no-store' }),
    ]);
    if (!submissionPage.ok) {
      throw new Error('Codeforces did not allow access to the accepted submission page.');
    }

    const parser = new DOMParser();
    const submissionDocument = parser.parseFromString(await submissionPage.text(), 'text/html');
    const code = submissionDocument.querySelector('#program-source-text')?.textContent?.trim();
    if (!code) throw new Error('Codeforces source was not visible. Sign in and try again.');

    let statement = '';
    if (problemPage.ok) {
      const problemDocument = parser.parseFromString(await problemPage.text(), 'text/html');
      statement = problemDocument.querySelector('.problem-statement')?.innerHTML.trim() ?? '';
    }

    return {
      ...latest,
      verdict: 'OK',
      code,
      statement,
      problemUrl,
      submissionUrl,
      problem: {
        ...latest.problem,
        tags: Array.isArray(latest.problem.tags) ? latest.problem.tags : [],
      },
    };
  }
}
