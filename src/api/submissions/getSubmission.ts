import { getClient } from '../../lib/client';
import { Submission } from '../../types/Submission';
import { GET_SUBMISSIONS, GET_SUBMISSION_DETAILS } from './submission.query';

export const getSubmission = async (
  submissionId: number | string,
): Promise<{ submissionDetails: Submission } | null> => {
  try {
    return getClient().request(GET_SUBMISSION_DETAILS, { submissionId });
  } catch {
    return null;
  }
};
export const getAllSubmission = async (
  questionSlug: string,
): Promise<{ questionSubmissionList?: { submissions?: { id: number | string }[] } } | null> => {
  try {
    return getClient().request(GET_SUBMISSIONS, {
      questionSlug,
      limit: 20,
      offset: 0,
      lastKey: null,
      status: 10,
    });
  } catch {
    return null;
  }
};
