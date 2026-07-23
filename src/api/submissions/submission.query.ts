export const GET_SUBMISSION_DETAILS = `
  query submissionDetails($submissionId: Int!) {
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
  query submissionList(
    $offset: Int!
    $limit: Int!
    $lastKey: String
    $questionSlug: String!
    $status: Int
  ) {
    questionSubmissionList(
      offset: $offset
      limit: $limit
      lastKey: $lastKey
      questionSlug: $questionSlug
      status: $status
    ) {
      lastKey
      hasNext
      submissions {
        id
      }
    }
  }
`;
