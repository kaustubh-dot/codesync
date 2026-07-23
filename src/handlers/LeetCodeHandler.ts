import { getAllSubmission, getSubmission } from '../api/submissions/getSubmission';
import { Submission } from '../types/Submission';

class LeetCodeHandler {
  async getLatestSubmissionId(questionSlug: string): Promise<string | null> {
    const submissions = await getAllSubmission(questionSlug);
    const id = submissions?.questionSubmissionList?.submissions?.[0]?.id;
    return id == null ? null : String(id);
  }

  async getSubmissionById(submissionId: string): Promise<Submission | null> {
    const numericId = Number(submissionId);
    if (!Number.isInteger(numericId)) return null;
    const result = await getSubmission(numericId);
    return result?.submissionDetails ?? null;
  }

  async getSubmission(questionSlug: string): Promise<Submission | null> {
    const submissionId = await this.getLatestSubmissionId(questionSlug);
    return submissionId ? this.getSubmissionById(submissionId) : null;
  }
}

export default LeetCodeHandler;
