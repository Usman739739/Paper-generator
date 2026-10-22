export const CHAPTERS = {
  Ch10_En: 'Chapter 10: Thermal Properties of Matter',
  Ch10_Ur: 'باب 10: مادے کی حرارتی خصوصیات',
  Ch11_En: 'Chapter 11: Thermal Energy Transfer',
  Ch11_Ur: 'باب 11: حرارتی توانائی کی منتقلی',
  Ch12_En: 'Chapter 12: Waves',
  Ch13_En: 'Chapter 13: Sound',
  Ch14_En: 'Chapter 14: Light',
  Ch15_En: 'Chapter 15: Electrostatics',
  Ch16_En: 'Chapter 16: Current Electricity',
  Ch17_En: 'Chapter 17: Electromagnetism',
  Ch18_En: 'Chapter 18: Electromagnetic Induction',
  Ch19_En: 'Chapter 19: Basic Electronics',
  Ch20_En: 'Chapter 20: Nuclear Structure',
  Ch21_En: 'Chapter 21: Space and Earth'
};

export const STANDARD_SECTIONS = [
  { code: 'A', label: 'A. Multiple Choice (MCQs)', prefix: 'A.' },
  { code: 'B', label: 'B. Short Answer (SQs)', prefix: 'B.' },
  { code: 'C', label: 'C. Constructed Response (CRQs)', prefix: 'C.' },
  { code: 'D', label: 'D. Comprehensive', prefix: 'D.' },
  { code: 'E', label: 'E. Numerical Problems', prefix: 'E.' }
];

export const PAGE_PRESETS: Record<string, { w: number; h: number; css: string; name: string }> = {
  a4: { w: 210, h: 297, css: 'A4', name: 'A4 (210 × 297 mm)' },
  legal13: { w: 215.9, h: 330.2, css: '215.9mm 330.2mm', name: 'Legal 13" (8.5 × 13 in)' },
  legal14: { w: 215.9, h: 355.6, css: '215.9mm 355.6mm', name: 'Legal 14" (8.5 × 14 in)' }
};
