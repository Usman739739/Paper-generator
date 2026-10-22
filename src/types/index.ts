export type QuestionType = 'mcq' | 'short';
export type MediumType = 'English' | 'Urdu';

export interface Question {
  id: string;
  subject: string;
  chapter: string;
  medium: MediumType;
  section: string;
  type: QuestionType;
  marks: number;
  text: string;
  options?: string[];
  answer?: number | string; // index for mcq, text for short
}

export type PageSize = 'a4' | 'legal13' | 'legal14';
export type TestsPerSheet = 1 | 2 | 4;
export type ArrangeType = 'stack' | 'side';
export type PaperMedium = 'english' | 'urdu' | 'bilingual';

export interface PaperConfig {
  school: string;
  title: string;
  chapter: string;
  className: string;
  subject: string;
  date: string;
  duration: string;
  variants: number;
  mcqCols: number;
  pageSize: PageSize;
  perSheet: TestsPerSheet;
  arrangement: ArrangeType;
  medium: PaperMedium;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  includeKey: boolean;
  showMarks: boolean;
  showStudentInfo: boolean;
  watermarkText: string;
}

export interface SectionGroup {
  section: string;
  questions: Question[];
}
