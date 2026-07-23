import { getAllSubmission, getSubmission } from '../api/submissions/getSubmission';
import { Submission } from '../types/Submission';

class LeetCodeHandler {
  async getSubmission(questionSlug: string): Promise<Submission | null> {
    const submissions = await getAllSubmission(questionSlug);
    const submissionId = submissions?.questionSubmissionList?.submissions?.[0]?.id;
    if (!submissionId) return null;
    const numericId = Number(submissionId);
    const result = await getSubmission(Number.isInteger(numericId) ? numericId : submissionId);
    return result?.submissionDetails ?? null;
  }
}

export default LeetCodeHandler;
