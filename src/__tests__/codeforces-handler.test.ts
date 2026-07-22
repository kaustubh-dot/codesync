import { beforeEach, describe, expect, it, vi } from 'vitest';
import CodeforcesHandler, { getCodeforcesExtension } from '../handlers/CodeforcesHandler';

describe('CodeforcesHandler', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('maps common Codeforces language labels', () => {
    expect(getCodeforcesExtension('GNU C++17')).toBe('.cpp');
    expect(getCodeforcesExtension('PyPy 3-64')).toBe('.py');
    expect(getCodeforcesExtension('Java 21')).toBe('.java');
    expect(getCodeforcesExtension('Kotlin 1.9')).toBe('.kt');
    expect(getCodeforcesExtension('Unknown language')).toBe('.txt');
  });

  it('validates and canonicalizes a Codeforces handle', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'OK', result: [{ handle: 'Tourist' }] }),
      }),
    );

    expect(await CodeforcesHandler.validateHandle(' tourist ')).toBe('Tourist');
    expect(await CodeforcesHandler.validateHandle('../invalid')).toBeNull();
  });

  it('extracts a recent accepted submission from signed-in Codeforces pages', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'OK',
          result: [
            {
              id: 99,
              contestId: 123,
              creationTimeSeconds: Math.floor(Date.now() / 1000),
              verdict: 'OK',
              programmingLanguage: 'GNU C++17',
              problem: { index: 'A', name: 'Test Problem', rating: 800, tags: ['math'] },
            },
          ],
        }),
      })
      .mockResolvedValueOnce({ ok: true, text: async () => 'source-page' })
      .mockResolvedValueOnce({ ok: true, text: async () => 'problem-page' });
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal(
      'DOMParser',
      class {
        parseFromString(value: string) {
          return {
            querySelector: (selector: string) =>
              selector === '#program-source-text' && value === 'source-page'
                ? { textContent: 'int main() { return 0; }' }
                : selector === '.problem-statement' && value === 'problem-page'
                  ? { innerHTML: '<div>Statement</div>' }
                  : null,
          };
        }
      },
    );

    const submission = await new CodeforcesHandler().getLatestAcceptedSubmission('Tourist');

    expect(submission?.code).toContain('int main');
    expect(submission?.statement).toContain('Statement');
    expect(submission?.problemUrl).toBe('https://codeforces.com/contest/123/problem/A');
    expect(submission?.submissionUrl).toBe('https://codeforces.com/contest/123/submission/99');
  });
});
