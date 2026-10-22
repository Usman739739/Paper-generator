import React, { useState, useMemo } from 'react';
import { Question, PaperConfig, TestsPerSheet } from '../types';
import { STANDARD_SECTIONS } from '../data/chapters';
import { isRTL, LATIN_LETTERS, URDU_LETTERS, shuffle } from '../utils/paperUtils';
import { 
  Sliders, 
  CheckSquare, 
  Square, 
  Sparkles, 
  RotateCcw, 
  ArrowRight,
  Filter,
  Check,
  Trash2,
  ListChecks,
  ListFilter,
  AlertCircle
} from 'lucide-react';

interface BuildPaperViewProps {
  questions: Question[];
  config: PaperConfig;
  onConfigChange: (config: PaperConfig) => void;
  selectedIds: string[];
  onToggleQuestion: (id: string) => void;
  onSelectMultiple: (ids: string[], replace?: boolean) => void;
  onClearSelection: () => void;
  onGenerate: () => void;
}

export const BuildPaperView: React.FC<BuildPaperViewProps> = ({
  questions,
  config,
  onConfigChange,
  selectedIds,
  onToggleQuestion,
  onSelectMultiple,
  onClearSelection,
  onGenerate
}) => {
  const [filterChapter, setFilterChapter] = useState<string>('');
  const [filterMedium, setFilterMedium] = useState<string>('');
  const [filterSearch, setFilterSearch] = useState<string>('');
  const [activeSections, setActiveSections] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'browse' | 'selected'>('browse');

  // Helper to accurately match a question to a section code (A, B, C, D, E)
  const matchesSection = (q: Question, code: string): boolean => {
    if (!q.section) return false;
    const s = q.section.trim();
    if (code === 'A') {
      return s.startsWith('A.') || s.startsWith('A ') || q.type === 'mcq';
    }
    return s.startsWith(`${code}.`) || s.startsWith(`${code} `);
  };

  // Unique chapters
  const availableChapters = useMemo(() => {
    return Array.from(new Set(questions.map(q => q.chapter).filter(Boolean))).sort();
  }, [questions]);

  // Selected questions objects (filtered strictly to valid questions in current state)
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedQuestions = useMemo(() => {
    return selectedIds
      .map(id => questions.find(q => q.id === id))
      .filter(Boolean) as Question[];
  }, [selectedIds, questions]);

  const totalMarks = useMemo(() => {
    return selectedQuestions.reduce((sum, q) => sum + (q.marks || 1), 0);
  }, [selectedQuestions]);

  // Master sheets calculation
  const masterSheets = Math.ceil(Math.max(1, config.variants) / config.perSheet);

  // Filter questions for the right-side browse list
  const displayQuestions = useMemo(() => {
    return questions.filter(q => {
      const matchChapter = !filterChapter || q.chapter === filterChapter;
      const matchMedium = !filterMedium || q.medium === filterMedium;
      const matchSearch = !filterSearch || 
        q.text.toLowerCase().includes(filterSearch.toLowerCase()) ||
        q.section.toLowerCase().includes(filterSearch.toLowerCase());
      
      const matchSection = activeSections.length === 0 || 
        activeSections.some(secCode => matchesSection(q, secCode));

      return matchChapter && matchMedium && matchSearch && matchSection;
    });
  }, [questions, filterChapter, filterMedium, filterSearch, activeSections]);

  const handleConfigUpdate = <K extends keyof PaperConfig>(key: K, value: PaperConfig[K]) => {
    onConfigChange({ ...config, [key]: value });
  };

  // When chapter filter changes, sync config.chapter and update section selection if active
  const handleChapterFilterChange = (newChapter: string) => {
    setFilterChapter(newChapter);
    if (newChapter) {
      handleConfigUpdate('chapter', newChapter);
    }

    if (activeSections.length > 0) {
      const matching = questions
        .filter(q => {
          const matchChapter = !newChapter || q.chapter === newChapter;
          const matchMedium = !filterMedium || q.medium === filterMedium;
          const matchSec = activeSections.some(sec => matchesSection(q, sec));
          return matchChapter && matchMedium && matchSec;
        })
        .map(q => q.id);
      onSelectMultiple(matching, true);
    }
  };

  // When medium filter changes, sync config.medium and update section selection if active
  const handleMediumFilterChange = (newMedium: string) => {
    setFilterMedium(newMedium);
    if (newMedium === 'Urdu') {
      handleConfigUpdate('medium', 'urdu');
    } else if (newMedium === 'English') {
      handleConfigUpdate('medium', 'english');
    }

    if (activeSections.length > 0) {
      const matching = questions
        .filter(q => {
          const matchChapter = !filterChapter || q.chapter === filterChapter;
          const matchMedium = !newMedium || q.medium === newMedium;
          const matchSec = activeSections.some(sec => matchesSection(q, sec));
          return matchChapter && matchMedium && matchSec;
        })
        .map(q => q.id);
      onSelectMultiple(matching, true);
    }
  };

  // Quick Select Section handler
  const handleToggleSection = (sectionCode: string) => {
    let nextSections: string[];
    const isCurrentlyActive = activeSections.includes(sectionCode);

    if (isCurrentlyActive) {
      nextSections = activeSections.filter(s => s !== sectionCode);
    } else {
      nextSections = [...activeSections, sectionCode];
    }
    setActiveSections(nextSections);

    if (nextSections.length === 0) {
      // If all sections untoggled, keep user's current manual selection
      return;
    }

    // Set selection strictly to questions matching the currently checked sections
    const newSelected = questions
      .filter(q => {
        const matchChapter = !filterChapter || q.chapter === filterChapter;
        const matchMedium = !filterMedium || q.medium === filterMedium;
        const matchSec = nextSections.some(sec => matchesSection(q, sec));
        return matchChapter && matchMedium && matchSec;
      })
      .map(q => q.id);

    onSelectMultiple(newSelected, true);
  };

  const handleSelectAllFiltered = () => {
    const idsToAdd = displayQuestions.map(q => q.id);
    const combined = Array.from(new Set([...selectedIds, ...idsToAdd]));
    onSelectMultiple(combined, true);
  };

  const handleDeselectFiltered = () => {
    const idsToRemove = new Set(displayQuestions.map(q => q.id));
    const remaining = selectedIds.filter(id => !idsToRemove.has(id));
    onSelectMultiple(remaining, true);
  };

  // Quick preset helper
  const handlePreset = (mcqCount: number, shortCount: number, numericalCount: number) => {
    // Pick from the currently filtered chapter/medium, or fallback to first available
    const targetChapter = filterChapter || availableChapters[0] || '';
    const targetMedium = filterMedium || (config.medium === 'urdu' ? 'Urdu' : 'English');

    const candidates = questions.filter(q => {
      const matchChapter = !targetChapter || q.chapter === targetChapter;
      const matchMedium = !targetMedium || q.medium === targetMedium;
      return matchChapter && matchMedium;
    });

    const mcqs = shuffle(candidates.filter(q => matchesSection(q, 'A'))).slice(0, mcqCount);
    const shorts = shuffle(candidates.filter(q => matchesSection(q, 'B') || matchesSection(q, 'C') || matchesSection(q, 'D'))).slice(0, shortCount);
    const numericals = shuffle(candidates.filter(q => matchesSection(q, 'E'))).slice(0, numericalCount);

    const pickedIds = [...mcqs, ...shorts, ...numericals].map(q => q.id);
    if (pickedIds.length === 0) {
      alert(`No questions found for ${targetChapter || 'selected filters'}. Try choosing a chapter.`);
      return;
    }

    if (targetChapter) {
      setFilterChapter(targetChapter);
      handleConfigUpdate('chapter', targetChapter);
    }
    if (targetMedium) {
      setFilterMedium(targetMedium);
      handleConfigUpdate('medium', targetMedium === 'Urdu' ? 'urdu' : 'english');
    }

    setActiveSections([]);
    onSelectMultiple(pickedIds, true);
    setActiveTab('selected');
  };

  return (
    <div className="max-w-6xl mx-auto pb-16 space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Build Paper</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Configure test layout, exam header details, and select exact questions for printing
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Settings Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Paper & Header Settings
              </h2>
            </div>

            {/* School / Institute */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                School / College / Academy Name
              </label>
              <input
                type="text"
                value={config.school}
                onChange={e => handleConfigUpdate('school', e.target.value)}
                placeholder="e.g. City Science College"
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>

            {/* Exam Title & Chapter */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Exam Title</label>
                <input
                  type="text"
                  value={config.title}
                  onChange={e => handleConfigUpdate('title', e.target.value)}
                  placeholder="Mid-Term Examination"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Chapter Header</label>
                <input
                  type="text"
                  value={config.chapter}
                  onChange={e => handleConfigUpdate('chapter', e.target.value)}
                  placeholder="Chapter 10: Thermal..."
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>
            </div>

            {/* Class & Subject */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Class / Grade</label>
                <input
                  type="text"
                  value={config.className}
                  onChange={e => handleConfigUpdate('className', e.target.value)}
                  placeholder="10th (Matric)"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={config.subject}
                  onChange={e => handleConfigUpdate('subject', e.target.value)}
                  placeholder="Physics"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>
            </div>

            {/* Date & Duration */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  value={config.date}
                  onChange={e => handleConfigUpdate('date', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Duration</label>
                <input
                  type="text"
                  value={config.duration}
                  onChange={e => handleConfigUpdate('duration', e.target.value)}
                  placeholder="60 minutes"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>
            </div>

            {/* Paper Medium */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Paper Language / Medium</label>
              <select
                value={config.medium}
                onChange={e => handleConfigUpdate('medium', e.target.value as any)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="english">English</option>
                <option value="urdu">Urdu (اردو)</option>
                <option value="bilingual">Bilingual (English / اردو)</option>
              </select>
            </div>

            {/* Variants & MCQ Columns */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Variants</label>
                <select
                  value={config.variants}
                  onChange={e => handleConfigUpdate('variants', Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value={1}>1 (Single)</option>
                  <option value={2}>2 (Variant A & B)</option>
                  <option value={3}>3 (Variant A, B & C)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">MCQ Columns</label>
                <select
                  value={config.mcqCols}
                  onChange={e => handleConfigUpdate('mcqCols', Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value={1}>1 Column</option>
                  <option value={2}>2 Columns</option>
                  <option value={3}>3 Columns</option>
                  <option value={4}>4 Columns</option>
                </select>
              </div>
            </div>

            {/* Page Size & Tests Per Sheet */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Page Size</label>
                <select
                  value={config.pageSize}
                  onChange={e => handleConfigUpdate('pageSize', e.target.value as any)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="a4">A4 (210 × 297 mm)</option>
                  <option value="legal13">Legal 13" (8.5 × 13 in)</option>
                  <option value="legal14">Legal 14" (8.5 × 14 in)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tests Per Sheet</label>
                <select
                  value={config.perSheet}
                  onChange={e => handleConfigUpdate('perSheet', Number(e.target.value) as TestsPerSheet)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium"
                >
                  <option value={1}>1 test per sheet (Full page)</option>
                  <option value={2}>2 tests per sheet (Half page)</option>
                  <option value={4}>4 tests per sheet (Quarter)</option>
                </select>
              </div>
            </div>

            {/* Arrangement for 2-per-sheet */}
            {config.perSheet === 2 && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">2-Up Cut Orientation</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleConfigUpdate('arrangement', 'stack')}
                    className={`py-1.5 px-3 text-xs font-semibold rounded-lg border text-center transition-colors cursor-pointer ${
                      config.arrangement === 'stack'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    Top & Bottom (Stacked)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleConfigUpdate('arrangement', 'side')}
                    className={`py-1.5 px-3 text-xs font-semibold rounded-lg border text-center transition-colors cursor-pointer ${
                      config.arrangement === 'side'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    Left & Right (Columns)
                  </button>
                </div>
              </div>
            )}

            {/* Toggles */}
            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-700">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.shuffleQuestions}
                  onChange={e => handleConfigUpdate('shuffleQuestions', e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Shuffle question order per variant</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.shuffleOptions}
                  onChange={e => handleConfigUpdate('shuffleOptions', e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Shuffle MCQ choices per variant</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.includeKey}
                  onChange={e => handleConfigUpdate('includeKey', e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Generate Answer Key sheet at the end</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showMarks}
                  onChange={e => handleConfigUpdate('showMarks', e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Show marks [1], [2], [4] next to questions</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showStudentInfo}
                  onChange={e => handleConfigUpdate('showStudentInfo', e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Include Student Info header (Name, Roll No, Section)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Question Selection & Quick Sections (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Quick Select by Section Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Quick Select by Section
                </h2>
              </div>
              <span className="text-xs text-slate-500">Auto-selects questions for active chapter</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {STANDARD_SECTIONS.map(sec => {
                const isActive = activeSections.includes(sec.code);
                return (
                  <button
                    key={sec.code}
                    type="button"
                    onClick={() => handleToggleSection(sec.code)}
                    className={`flex items-center justify-between p-3 rounded-lg border text-left transition-all cursor-pointer ${
                      isActive
                        ? 'border-indigo-600 bg-indigo-50/90 text-indigo-950 font-semibold shadow-xs ring-1 ring-indigo-500'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xs">{sec.label}</span>
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {isActive ? '✓' : sec.code}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Quick Presets */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span className="font-semibold">Quick Presets:</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => handlePreset(5, 4, 1)}
                  className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-md transition-colors cursor-pointer"
                >
                  Quick Quiz (20 Marks)
                </button>
                <button
                  type="button"
                  onClick={() => handlePreset(10, 6, 2)}
                  className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-md transition-colors cursor-pointer"
                >
                  Mid-Term (40 Marks)
                </button>
                <button
                  type="button"
                  onClick={() => handlePreset(12, 8, 3)}
                  className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-md transition-colors cursor-pointer"
                >
                  Full Board (60 Marks)
                </button>
              </div>
            </div>
          </div>

          {/* Question Filter & Selection Card with Dual Tabs */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
            {/* Navigation Tabs */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('browse')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'browse'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <ListFilter className="w-3.5 h-3.5" />
                  <span>Browse & Select ({displayQuestions.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('selected')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'selected'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <ListChecks className="w-3.5 h-3.5" />
                  <span>Selected in Paper ({selectedQuestions.length})</span>
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs">
                {activeTab === 'browse' && (
                  <>
                    <button
                      type="button"
                      onClick={handleSelectAllFiltered}
                      className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                    >
                      Select Filtered
                    </button>
                    <span className="text-slate-300">·</span>
                    <button
                      type="button"
                      onClick={handleDeselectFiltered}
                      className="text-slate-500 hover:text-slate-700 font-semibold cursor-pointer"
                    >
                      Deselect Filtered
                    </button>
                    <span className="text-slate-300">·</span>
                  </>
                )}
                <button
                  type="button"
                  onClick={onClearSelection}
                  className="text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* TAB 1: BROWSE QUESTIONS */}
            {activeTab === 'browse' && (
              <div className="space-y-4">
                {/* Chapter & Medium Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Target Chapter
                    </label>
                    <select
                      value={filterChapter}
                      onChange={e => handleChapterFilterChange(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      <option value="">All Chapters</option>
                      {availableChapters.map((ch, i) => (
                        <option key={i} value={ch}>{ch}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Target Medium
                    </label>
                    <select
                      value={filterMedium}
                      onChange={e => handleMediumFilterChange(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      <option value="">All Mediums</option>
                      <option value="English">English</option>
                      <option value="Urdu">Urdu (اردو)</option>
                    </select>
                  </div>
                </div>

                {/* Question Pick List */}
                <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                  {displayQuestions.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs bg-slate-50 rounded-lg">
                      No questions match your current filters.
                    </div>
                  ) : (
                    displayQuestions.map(q => {
                      const isSelected = selectedSet.has(q.id);
                      const isUrdu = isRTL(q.text) || q.medium === 'Urdu';

                      return (
                        <label
                          key={q.id}
                          className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-50/60 border-indigo-400 shadow-2xs'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => onToggleQuestion(q.id)}
                            className="w-4 h-4 mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                          <div className="flex-1 min-w-0">
                            <div
                              dir={isUrdu ? 'rtl' : 'ltr'}
                              className={`text-xs font-medium text-slate-900 leading-relaxed ${
                                isUrdu ? 'font-urdu text-sm' : ''
                              }`}
                            >
                              {q.text}
                            </div>
                            <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-500 flex-wrap">
                              <span className={`px-1.5 py-0.5 rounded font-medium ${
                                q.medium === 'Urdu' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                              }`}>
                                {q.medium}
                              </span>
                              <span>·</span>
                              <span className="truncate max-w-[200px]">{q.chapter}</span>
                              {q.section && (
                                <>
                                  <span>·</span>
                                  <span className="text-slate-600 font-medium truncate max-w-[150px]">{q.section}</span>
                                </>
                              )}
                              <span>·</span>
                              <span className="font-semibold text-slate-700">{q.marks} mark{q.marks > 1 ? 's' : ''}</span>
                            </div>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: REVIEW EXACT SELECTED QUESTIONS IN PAPER */}
            {activeTab === 'selected' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-600 pb-2 border-b border-slate-100">
                  <span>These exact questions will appear on your generated exam paper:</span>
                  <span className="font-bold text-slate-900">{selectedQuestions.length} Questions · {totalMarks} Total Marks</span>
                </div>

                {selectedQuestions.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs bg-slate-50 rounded-lg p-6 space-y-2">
                    <AlertCircle className="w-6 h-6 mx-auto text-slate-400" />
                    <div className="font-semibold text-slate-600">No questions currently selected</div>
                    <p className="text-[11px] text-slate-500">
                      Click the "Browse & Select" tab above or choose a section preset to add questions to your paper.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('browse')}
                      className="mt-2 px-3.5 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer"
                    >
                      Browse Questions
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                    {selectedQuestions.map((q, idx) => {
                      const isUrdu = isRTL(q.text) || q.medium === 'Urdu';
                      return (
                        <div
                          key={q.id}
                          className="flex items-start gap-3 p-3 rounded-lg border border-indigo-200 bg-indigo-50/30 hover:bg-indigo-50/50 transition-colors"
                        >
                          <span className="w-5 text-center font-bold text-xs text-indigo-700 shrink-0 mt-0.5">
                            {idx + 1}.
                          </span>
                          <div className="flex-1 min-w-0">
                            <div
                              dir={isUrdu ? 'rtl' : 'ltr'}
                              className={`text-xs font-medium text-slate-900 leading-relaxed ${
                                isUrdu ? 'font-urdu text-sm' : ''
                              }`}
                            >
                              {q.text}
                            </div>
                            <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-500 flex-wrap">
                              <span className={`px-1.5 py-0.5 rounded font-medium ${
                                q.medium === 'Urdu' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                              }`}>
                                {q.medium}
                              </span>
                              <span>·</span>
                              <span className="truncate max-w-[180px]">{q.chapter}</span>
                              {q.section && (
                                <>
                                  <span>·</span>
                                  <span className="text-slate-600 font-medium truncate max-w-[140px]">{q.section}</span>
                                </>
                              )}
                              <span>·</span>
                              <span className="font-semibold text-slate-700">{q.marks} mark{q.marks > 1 ? 's' : ''}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => onToggleQuestion(q.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer shrink-0"
                            title="Remove from paper"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Summary Banner & Generate Button */}
          <div className="bg-slate-900 text-white rounded-xl p-5 shadow-md space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center border-b border-slate-800 pb-3">
              <div>
                <div className="text-[11px] text-slate-400 uppercase font-medium">Selected</div>
                <div className="text-xl font-bold text-white mt-0.5">{selectedQuestions.length} Qs</div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400 uppercase font-medium">Total Marks</div>
                <div className="text-xl font-bold text-emerald-400 mt-0.5">{totalMarks}</div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400 uppercase font-medium">Variants</div>
                <div className="text-xl font-bold text-sky-400 mt-0.5">{config.variants}</div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400 uppercase font-medium">Master Sheets</div>
                <div className="text-xl font-bold text-amber-400 mt-0.5">{masterSheets} ({config.perSheet}/sheet)</div>
              </div>
            </div>

            <button
              onClick={onGenerate}
              disabled={selectedQuestions.length === 0}
              className={`w-full py-3.5 px-6 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
                selectedQuestions.length > 0
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <span>Generate Preview & Print Layout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
