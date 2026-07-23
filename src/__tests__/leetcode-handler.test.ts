import { afterEach, describe, expect, it, vi } from 'vitest';
import LeetCodeHandler from '../handlers/LeetCodeHandler';
import * as submissionApi from '../api/submissions/getSubmission';

vi.mock('../api/submissions/getSubmission');

describe('LeetCodeHandler getSubmission', () => {
  afterEach(() => vi.clearAllMocks());

  it('returns null when no submissions exist', async () => {
    vi.mocked(submissionApi.getAllSubmission).mockResolvedValue({} as any);
    expect(await new LeetCodeHandler().getSubmission('two-sum')).toBeNull();
  });

  it('returns the latest submission without extracting a session cookie', async () => {
    vi.mocked(submissionApi.getAllSubmission).mockResolvedValue({
      questionSubmissionList: { submissions: [{ id: 1 }] },
    } as any);
    const details = { id: 1, code: 'code' } as any;
    vi.mocked(submissionApi.getSubmission).mockResolvedValue({ submissionDetails: details });

    expect(await new LeetCodeHandler().getSubmission('two-sum')).toEqual(details);
    expect(submissionApi.getSubmission).toHaveBeenCalledWith(1);
  });

  it('reads submission details by the normalized latest id', async () => {
    vi.mocked(submissionApi.getAllSubmission).mockResolvedValue({
      questionSubmissionList: { submissions: [{ id: 123 }] },
    } as any);
    vi.mocked(submissionApi.getSubmission).mockResolvedValue({
      submissionDetails: { code: 'answer' } as any,
    });

    const handler = new LeetCodeHandler();
    expect(await handler.getLatestSubmissionId('two-sum')).toBe('123');
    expect(await handler.getSubmissionById('123')).toMatchObject({ code: 'answer' });
    expect(submissionApi.getSubmission).toHaveBeenCalledWith(123);
  });
});
