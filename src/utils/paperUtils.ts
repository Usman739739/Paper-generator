import { Question, PaperConfig, PaperMedium, SectionGroup } from '../types';

export const RTL_REGEX = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;

export function isRTL(text: string): boolean {
  return RTL_REGEX.test(text || '');
}

export function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const LATIN_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
export const URDU_LETTERS = ['ا', 'ب', 'ج', 'د', 'ہ', 'و', 'ز', 'ح'];

export const TRANSLATIONS = {
  en: {
    class: 'Class',
    subject: 'Subject',
    date: 'Date',
    time: 'Time',
    totalMarks: 'Total Marks',
    name: 'Student Name',
    rollNo: 'Roll No',
    section: 'Section',
    obtainedMarks: 'Obtained Marks',
    answerKey: 'ANSWER KEY',
    signature: "Invigilator's Sig",
  },
  ur: {
    class: 'کلاس',
    subject: 'مضمون',
    date: 'تاریخ',
    time: 'وقت',
    totalMarks: 'کل نمبر',
    name: 'طالب علم کا نام',
    rollNo: 'رول نمبر',
    section: 'سیکشن',
    obtainedMarks: 'حاصل کردہ نمبر',
    answerKey: 'جوابی کلید',
    signature: 'دستخط نگران',
  }
};

export function getTranslation(key: keyof typeof TRANSLATIONS.en, medium: PaperMedium) {
  const en = TRANSLATIONS.en[key];
  const ur = TRANSLATIONS.ur[key];
  if (medium === 'urdu') return ur;
  if (medium === 'bilingual') return `${en} / ${ur}`;
  return en;
}

export function getVariantLabels(medium: PaperMedium, count: number): string[] {
  const urduLabels = ['ورژن الف', 'ورژن ب', 'ورژن ج', 'ورژن د'];
  const engLabels = ['Variant A', 'Variant B', 'Variant C', 'Variant D'];
  const labels = medium === 'urdu' ? urduLabels : engLabels;
  return labels.slice(0, count);
}

export interface PreparedVariant {
  variantIndex: number;
  label: string;
  groups: SectionGroup[];
  totalMarks: number;
  keys: {
    num: number;
    section: string;
    answer: string;
    isRtl: boolean;
  }[];
}

export function generatePaperVariants(selectedQuestions: Question[], config: PaperConfig): PreparedVariant[] {
  const variantCount = Math.min(3, Math.max(1, config.variants));
  const labels = getVariantLabels(config.medium, variantCount);
  const totalMarks = selectedQuestions.reduce((sum, q) => sum + (q.marks || 1), 0);

  const results: PreparedVariant[] = [];

  for (let v = 0; v < variantCount; v++) {
    // Group questions by section
    const sectionMap = new Map<string, Question[]>();
    for (const q of selectedQuestions) {
      const s = q.section || 'General Questions';
      if (!sectionMap.has(s)) {
        sectionMap.set(s, []);
      }
      sectionMap.get(s)!.push(q);
    }

    const sectionOrder = ['A', 'B', 'C', 'D', 'E'];
    const sortedSectionNames = Array.from(sectionMap.keys()).sort((a, b) => {
      const codeA = a.trim().charAt(0).toUpperCase();
      const codeB = b.trim().charAt(0).toUpperCase();
      const idxA = sectionOrder.indexOf(codeA);
      const idxB = sectionOrder.indexOf(codeB);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });

    const groups: SectionGroup[] = [];
    const keys: { num: number; section: string; answer: string; isRtl: boolean }[] = [];
    let qCounter = 1;

    for (const sectionName of sortedSectionNames) {
      const qs = sectionMap.get(sectionName) || [];
      let list = [...qs];
      if (config.shuffleQuestions) {
        list = shuffle(list);
      }

      const processedQuestions: Question[] = list.map(q => {
        const copy: Question = { ...q, options: q.options ? [...q.options] : [] };
        if (config.shuffleOptions && copy.type === 'mcq' && copy.options && copy.options.length > 1) {
          const originalOptions = [...copy.options];
          const indices = shuffle(originalOptions.map((_, i) => i));
          copy.options = indices.map(i => originalOptions[i]);
          const origAns = typeof q.answer === 'number' ? q.answer : 0;
          copy.answer = indices.indexOf(origAns);
        }
        return copy;
      });

      // record answer keys
      for (const q of processedQuestions) {
        const isRtl = isRTL(q.text) || (q.options?.some(isRTL) ?? false);
        const letters = isRtl ? URDU_LETTERS : LATIN_LETTERS;
        let ansText = '';
        if (q.type === 'mcq') {
          const ansIdx = typeof q.answer === 'number' ? q.answer : 0;
          const letter = letters[ansIdx] || '?';
          const optVal = q.options?.[ansIdx];
          ansText = optVal ? `${letter}. ${optVal}` : letter;
        } else {
          ansText = (q.answer as string) || '—';
        }

        keys.push({
          num: qCounter,
          section: sectionName,
          answer: ansText,
          isRtl
        });

        qCounter++;
      }

      groups.push({
        section: sectionName,
        questions: processedQuestions
      });
    }

    results.push({
      variantIndex: v,
      label: variantCount > 1 ? labels[v] : '',
      groups,
      totalMarks,
      keys
    });
  }

  return results;
}

export function parseBulkQuestions(
  text: string,
  defaults: {
    subject: string;
    chapter: string;
    medium: 'English' | 'Urdu';
    section: string;
    marks: number;
  }
): Question[] {
  const blocks = text.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);
  const out: Question[] = [];

  for (const block of blocks) {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    if (!lines.length) continue;

    // First line is question stem (stripping Q1., 1., etc.)
    const stem = lines[0].replace(/^[Qq]?\d*[\).:\-]\s*/, '').trim();
    if (!stem) continue;

    const options: { text: string; correct: boolean }[] = [];
    let answerText = '';

    for (const line of lines.slice(1)) {
      const matchAns = line.match(/^(?:ans|answer|جواب)\s*[:=\-]\s*(.+)$/i);
      if (matchAns) {
        answerText = matchAns[1].trim();
        continue;
      }
      const isCorrect = /^[*+]/.test(line);
      let opt = line.replace(/^[*+]\s*/, '');
      opt = opt.replace(/^[A-Ha-hا-ح][\).]\s*/, '').trim();
      if (!opt) continue;
      options.push({ text: opt, correct: isCorrect });
    }

    const isQuestionUrdu = isRTL(stem) || defaults.medium === 'Urdu';
    const isMcq = options.length >= 2;
    const q: Question = {
      id: 'bulk_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      subject: defaults.subject || 'Physics',
      chapter: defaults.chapter,
      medium: isQuestionUrdu ? 'Urdu' : 'English',
      section: defaults.section || 'General Questions',
      marks: Math.max(1, defaults.marks || 1),
      text: stem,
      type: isMcq ? 'mcq' : 'short',
      options: isMcq ? options.map(o => o.text) : [],
      answer: isMcq ? Math.max(0, options.findIndex(o => o.correct)) : (answerText || (options[0]?.text ?? ''))
    };

    out.push(q);
  }

  return out;
}
