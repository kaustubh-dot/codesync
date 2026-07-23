export const GET_SUBMISSION_DETAILS = `
  query SubmissionDetails($submissionId: Int!) {
    submissionDetails(submissionId: $submissionId) {
      code
      timestamp
      statusCode
      runtimeDisplay
      runtimePercentile
      memoryDisplay
      memoryPercentile
      notes
      lang {
        verboseName
      }
      question {
        questionId
        questionFrontendId
        title
        titleSlug
        difficulty
        content
      }
    }
  }
`;

export const GET_SUBMISSIONS = `
  query AcceptedSubmissions($questionSlug: String!) {
    questionSubmissionList(
      offset: 0
      limit: 1
      lastKey: null
      questionSlug: $questionSlug
      status: 10
    ) {
      submissions {
        id
      }
    }
  }
`;
