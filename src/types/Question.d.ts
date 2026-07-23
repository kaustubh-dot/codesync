export enum QuestionDifficulty {
  Easy = 'Easy',
  Medium = 'Medium',
  Hard = 'Hard',
}

export class Question {
  questionId: string;
  questionFrontendId?: string;
  title: string;
  titleSlug: string;
  difficulty: QuestionDifficulty;
  content: string;
}
