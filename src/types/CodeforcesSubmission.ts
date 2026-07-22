export type CodeforcesSubmission = {
  id: number;
  contestId: number;
  creationTimeSeconds: number;
  verdict: 'OK';
  programmingLanguage: string;
  code: string;
  statement: string;
  problemUrl: string;
  submissionUrl: string;
  problem: {
    index: string;
    name: string;
    rating?: number;
    tags: string[];
  };
};
