import { beforeEach, describe, expect, it, vi } from 'vitest';
import GithubHandler, { containsLikelyCredential } from '../handlers/GithubHandler';
import type { QuestionDifficulty } from '../types/Question';
import { Submission } from '../types/Submission';
import type { CodeforcesSubmission } from '../types/CodeforcesSubmission';

const stored: Record<string, unknown> = {};

const storageGet = vi.fn(async (keys: string | string[]) => {
  const list = Array.isArray(keys) ? keys : [keys];
  return Object.fromEntries(list.map((key) => [key, stored[key]]));
});
const storageSet = vi.fn(async (values: Record<string, unknown>) => Object.assign(stored, values));

describe('GithubHandler', () => {
  beforeEach(() => {
    for (const key of Object.keys(stored)) delete stored[key];
    vi.clearAllMocks();
    (globalThis as any).chrome = { storage: { local: { get: storageGet, set: storageSet } } };
  });

  it('keeps language and difficulty behavior', () => {
    const handler = new GithubHandler();
    expect(handler.getProblemExtension('Python')).toBe('.py');
    expect(handler.getProblemExtension('JavaScript')).toBe('.js');
    expect(handler.getDifficultyColor('Easy' as QuestionDifficulty)).toBe('brightgreen');
    expect(handler.getDifficultyColor('Medium' as QuestionDifficulty)).toBe('orange');
    expect(handler.getDifficultyColor('Hard' as QuestionDifficulty)).toBe('red');
    expect(handler.createDifficultyBadge('Medium' as QuestionDifficulty)).toContain(
      'Difficulty-Medium-orange',
    );
  });

  it('detects likely credentials without blocking ordinary solution text', () => {
    expect(containsLikelyCredential('const answer = 42; // Use a map')).toBe(false);
    expect(containsLikelyCredential(`token = "github_pat_${'a'.repeat(24)}"`)).toBe(true);
    expect(containsLikelyCredential('-----BEGIN PRIVATE KEY-----')).toBe(true);
  });

  it('validates a token before storing it locally', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 1, login: 'kaustubh-dot' }) }),
    );

    const user = await new GithubHandler().validateAndStoreToken(' github_pat_test ');

    expect(user?.login).toBe('kaustubh-dot');
    expect(stored).toMatchObject({
      github_leetsync_token: 'github_pat_test',
      github_username: 'kaustubh-dot',
    });
  });

  it('does not store a rejected token', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    expect(await new GithubHandler().validateAndStoreToken('bad-token')).toBeNull();
    expect(storageSet).not.toHaveBeenCalled();
  });

  it('rejects broad classic tokens before contacting GitHub', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    expect(await new GithubHandler().validateAndStoreToken('ghp_classic')).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('requires write access to the selected repository', async () => {
    stored.github_leetsync_token = 'token';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ permissions: { push: false } }),
      }),
    );
    expect(await new GithubHandler().checkIfRepoExists('owner/repo')).toBe(false);
  });

  it('records public repository visibility', async () => {
    stored.github_leetsync_token = 'token';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ private: false, permissions: { push: true } }),
      }),
    );
    expect(await new GithubHandler().checkIfRepoExists('owner/public-solutions')).toBe(true);
    expect(stored.github_repo_visibility).toBe('public');
  });

  it('records Codeforces repository visibility separately', async () => {
    stored.github_leetsync_token = 'token';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ private: false, permissions: { push: true } }),
      }),
    );

    expect(
      await new GithubHandler().checkIfRepoExists(
        'owner/codeforces-solutions',
        'github_codeforces_repo_visibility',
      ),
    ).toBe(true);
    expect(stored.github_codeforces_repo_visibility).toBe('public');
    expect(stored.github_repo_visibility).toBeUndefined();
  });

  it('uploads the README, notes, and solution through the trusted worker configuration', async () => {
    Object.assign(stored, {
      github_leetsync_token: 'token',
      github_username: 'user',
      github_repo_owner: 'owner',
      github_leetsync_repo: 'solutions',
      github_codeforces_repo_owner: 'other-owner',
      github_codeforces_repo: 'codeforces-solutions',
      github_leetsync_subdirectory: 'leetcode/easy',
    });
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) =>
      init?.method === 'PUT'
        ? { ok: true, status: 201, json: async () => ({}) }
        : { ok: false, status: 404, json: async () => ({}) },
    );
    vi.stubGlobal('fetch', fetchMock);

    const submission = {
      code: 'const answer = 42;',
      statusCode: 10,
      timestamp: Math.floor(Date.now() / 1000),
      runtime: 1,
      runtimeDisplay: '1 ms',
      runtimePercentile: 99,
      runtimeDistribution: {} as any,
      memory: 1,
      memoryDisplay: '1 MB',
      memoryPercentile: 98,
      memoryDistribution: {} as any,
      lang: { name: 'javascript', verboseName: 'JavaScript' },
      notes: 'Use a map.',
      question: {
        questionId: '1',
        questionFrontendId: '1',
        title: 'Two Sum',
        titleSlug: 'two-sum',
        difficulty: 'Easy',
        content: '<p>Find the pair.</p>',
        likes: 1,
        dislikes: 0,
      },
      user: { username: 'user', profile: { realName: 'User', userAvatar: '' } },
    } as Submission;

    expect(await new GithubHandler().submit(submission)).toBe(true);
    const putCalls = fetchMock.mock.calls.filter(([, init]) => init?.method === 'PUT');
    expect(putCalls).toHaveLength(3);
    expect(putCalls[0][0]).toContain('/repos/owner/solutions/contents/leetcode/easy/1-two-sum/');
    expect(stored.problemsSolved).toBeTruthy();
  });

  it('rejects traversal in a configured subdirectory', async () => {
    Object.assign(stored, {
      github_leetsync_token: 'token',
      github_username: 'user',
      github_repo_owner: 'owner',
      github_leetsync_repo: 'solutions',
      github_leetsync_subdirectory: '../private',
    });
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const submission = {
      statusCode: 10,
      question: { titleSlug: 'two-sum', questionId: '1' },
    } as Submission;
    expect(await new GithubHandler().submit(submission)).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('blocks a submission containing a likely credential before uploading', async () => {
    Object.assign(stored, {
      github_leetsync_token: 'token',
      github_username: 'user',
      github_repo_owner: 'owner',
      github_leetsync_repo: 'solutions',
    });
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const submission = {
      code: `const token = "github_pat_${'a'.repeat(24)}";`,
      notes: '',
      statusCode: 10,
      question: { titleSlug: 'two-sum', questionId: '1' },
    } as Submission;

    expect(await new GithubHandler().submit(submission)).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(stored.lastUploadError).toContain('credential');
  });

  it('uploads and deduplicates an accepted Codeforces submission', async () => {
    Object.assign(stored, {
      github_leetsync_token: 'token',
      github_username: 'user',
      github_repo_owner: 'owner',
      github_leetsync_repo: 'solutions',
      github_leetsync_subdirectory: 'accepted',
    });
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) =>
      init?.method === 'PUT'
        ? { ok: true, status: 201, json: async () => ({}) }
        : { ok: false, status: 404, json: async () => ({}) },
    );
    vi.stubGlobal('fetch', fetchMock);
    const submission: CodeforcesSubmission = {
      id: 99,
      contestId: 123,
      creationTimeSeconds: 1,
      verdict: 'OK',
      programmingLanguage: 'GNU C++17',
      code: 'int main() { return 0; }',
      statement: '<div>Find the answer.</div>',
      problemUrl: 'https://codeforces.com/contest/123/problem/A',
      submissionUrl: 'https://codeforces.com/contest/123/submission/99',
      problem: { index: 'A', name: 'Test Problem', rating: 800, tags: ['math'] },
    };

    const handler = new GithubHandler();
    expect(await handler.submitCodeforces(submission)).toBe(true);
    const putCalls = fetchMock.mock.calls.filter(([, init]) => init?.method === 'PUT');
    expect(putCalls).toHaveLength(2);
    expect(putCalls[0][0]).toContain('/contents/accepted/Codeforces/123A-test-problem/');
    expect(stored.codeforces_synced_submissions).toHaveProperty('99');
    expect(await handler.submitCodeforces(submission)).toBe(false);
    expect(fetchMock.mock.calls.filter(([, init]) => init?.method === 'PUT')).toHaveLength(2);
  });

  it('routes Codeforces to a separate repository without a redundant platform folder', async () => {
    Object.assign(stored, {
      github_leetsync_token: 'token',
      github_username: 'user',
      github_repo_owner: 'owner',
      github_leetsync_repo: 'leetcode-solutions',
      github_codeforces_repo_owner: 'owner',
      github_codeforces_repo: 'codeforces-solutions',
      github_leetsync_subdirectory: 'accepted',
    });
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) =>
      init?.method === 'PUT'
        ? { ok: true, status: 201, json: async () => ({}) }
        : { ok: false, status: 404, json: async () => ({}) },
    );
    vi.stubGlobal('fetch', fetchMock);
    const submission: CodeforcesSubmission = {
      id: 100,
      contestId: 123,
      creationTimeSeconds: 1,
      verdict: 'OK',
      programmingLanguage: 'GNU C++17',
      code: 'int main() { return 0; }',
      statement: '<div>Find the answer.</div>',
      problemUrl: 'https://codeforces.com/contest/123/problem/A',
      submissionUrl: 'https://codeforces.com/contest/123/submission/100',
      problem: { index: 'A', name: 'Test Problem', rating: 800, tags: ['math'] },
    };

    expect(await new GithubHandler().submitCodeforces(submission)).toBe(true);
    const putCalls = fetchMock.mock.calls.filter(([, init]) => init?.method === 'PUT');
    expect(putCalls).toHaveLength(2);
    expect(putCalls[0][0]).toContain(
      '/repos/owner/codeforces-solutions/contents/accepted/123A-test-problem/',
    );
    expect(putCalls[0][0]).not.toContain('/Codeforces/');
  });
});
