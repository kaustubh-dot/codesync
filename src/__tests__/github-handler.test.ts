import { beforeEach, describe, expect, it, vi } from 'vitest';
import GithubHandler from '../handlers/GithubHandler';
import type { QuestionDifficulty } from '../types/Question';
import { Submission } from '../types/Submission';

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

  it('uploads the README, notes, and solution through the trusted worker configuration', async () => {
    Object.assign(stored, {
      github_leetsync_token: 'token',
      github_username: 'user',
      github_repo_owner: 'owner',
      github_leetsync_repo: 'solutions',
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
});
