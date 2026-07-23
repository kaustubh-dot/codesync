import { getClient } from '../../lib/client';
import { Submission } from '../../types/Submission';
import { GET_SUBMISSIONS, GET_SUBMISSION_DETAILS } from './submission.query';

const getRequestHeaders = (): Record<string, string> => {
  if (typeof document === 'undefined') return {};
  const token = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/)?.[1];
  return token ? { 'x-csrftoken': decodeURIComponent(token) } : {};
};

export const getSubmission = async (
  submissionId: number | string,
): Promise<{ submissionDetails: Submission } | null> => {
  try {
    const client = getClient();
    return client.request(
      GET_SUBMISSION_DETAILS,
      { submissionId },
      getRequestHeaders(),
    );
  } catch {
    return null;
  }
};
export const getAllSubmission = async (
  questionSlug: string,
): Promise<{ questionSubmissionList?: { submissions?: { id: string }[] } } | null> => {
  try {
    const client = getClient();
    return client.request(GET_SUBMISSIONS, { questionSlug }, getRequestHeaders());
  } catch {
    return null;
  }
};
