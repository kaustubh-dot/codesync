import { getAllSubmission, getSubmission } from '../api/submissions/getSubmission';
import { Submission } from '../types/Submission';

class LeetCodeHandler {
  async getSubmission(questionSlug: string): Promise<Submission | null> {
    const submissions = await getAllSubmission(questionSlug);

    if (!submissions?.questionSubmissionList?.submissions?.[0]?.id) {
      return null;
    }

    const latestSubmissionId = submissions?.questionSubmissionList?.submissions?.[0].id;

    const result = await getSubmission(latestSubmissionId);

    if (!result?.submissionDetails) return null;

    return result.submissionDetails;
  }
}

export default LeetCodeHandler;
