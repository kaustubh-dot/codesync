import { Question } from './Question';

export class Submission {
  code: string;
  timestamp: number;
  statusCode: number;
  runtimeDisplay: string;
  runtimePercentile: number;
  memoryDisplay: string;
  memoryPercentile: number;
  notes?: string;
  lang: {
    verboseName: string;
  };
  question: Question;
}
