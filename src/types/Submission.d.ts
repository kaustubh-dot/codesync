import { Question } from './Question';

export class Submission {
  code: string;
  timestamp: number;
  statusCode: number;
  runtimeDisplay?: string | null;
  runtimePercentile?: number | null;
  memoryDisplay?: string | null;
  memoryPercentile?: number | null;
  notes?: string;
  lang: {
    verboseName: string;
  };
  question: Question;
}
