import React, { useState, useMemo } from 'react';
import { Question, MediumType } from '../types';
import { isRTL, LATIN_LETTERS, URDU_LETTERS } from '../utils/paperUtils';
import { 
  Search, 
  Plus, 
  FileSpreadsheet, 
  Trash2, 
  Edit3, 
  Copy, 
  Check, 
  X
} from 'lucide-react';

interface QuestionBankViewProps {
  questions: Question[];
  onAddQuestion: () => void;
  onBulkPaste: () => void;
  onEditQuestion: (question: Question) => void;
  onDeleteQuestion: (id: string) => void;
  onDuplicateQuestion: (question: Question) => void;
}

export const QuestionBankView: React.FC<QuestionBankViewProps> = ({
  questions,
  onAddQuestion,
  onBulkPaste,
  onEditQuestion,
  onDeleteQuestion,
  onDuplicateQuestion
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMedium, setSelectedMedium] = useState<string>('');
  const [selectedChapter, setSelectedChapter] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');

  // Extract unique chapters
  const availableChapters = useMemo(() => {
    return Array.from(new Set(questions.map(q => q.chapter).filter(Boolean))).sort();
  }, [questions]);

  // Filtered list
  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      const matchSearch = !searchTerm || 
        q.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.chapter.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.section.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchMedium = !selectedMedium || q.medium === selectedMedium;
      const matchChapter = !selectedChapter || q.chapter === selectedChapter;
      const matchType = !selectedType || q.type === selectedType;

      return matchSearch && matchMedium && matchChapter && matchType;
    });
  }, [questions, searchTerm, selectedMedium, selectedChapter, selectedType]);

  const stats = useMemo(() => {
    const total = questions.length;
    const mcqs = questions.filter(q => q.type === 'mcq').length;
    const short = total - mcqs;
    const urdu = questions.filter(q => q.medium === 'Urdu').length;
    const eng = total - urdu;
    return { total, mcqs, short, urdu, eng };
  }, [questions]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedMedium('');
    setSelectedChapter('');
    setSelectedType('');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Question Bank</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage, search, and edit your Physics questions database
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={onBulkPaste}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-slate-500" />
            <span>Bulk Paste</span>
          </button>
          <button
            onClick={onAddQuestion}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Question</span>
          </button>
        </div>
      </div>

      {/* Stats Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Total Questions</div>
          <div className="text-xl font-bold text-slate-900 mt-1">{stats.total}</div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">MCQs</div>
          <div className="text-xl font-bold text-indigo-600 mt-1">{stats.mcqs}</div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Written / Numericals</div>
          <div className="text-xl font-bold text-amber-600 mt-1">{stats.short}</div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">English Medium</div>
          <div className="text-xl font-bold text-emerald-600 mt-1">{stats.eng}</div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Urdu Medium</div>
          <div className="text-xl font-bold text-rose-600 mt-1">{stats.urdu}</div>
        </div>
      </div>

      {/* Filters Box */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search questions or keywords..."
              className="w-full pl-9 pr-8 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Medium Filter */}
          <div>
            <select
              value={selectedMedium}
              onChange={e => setSelectedMedium(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">All Mediums (English & Urdu)</option>
              <option value="English">English</option>
              <option value="Urdu">Urdu (اردو)</option>
            </select>
          </div>

          {/* Chapter Filter */}
          <div>
            <select
              value={selectedChapter}
              onChange={e => setSelectedChapter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white truncate"
            >
              <option value="">All Chapters</option>
              {availableChapters.map((ch, idx) => (
                <option key={idx} value={ch}>{ch}</option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">All Types</option>
              <option value="mcq">MCQ (Multiple Choice)</option>
              <option value="short">Written / Descriptive / Numericals</option>
            </select>
          </div>
        </div>

        {/* Active filter counter and clear button */}
        {(searchTerm || selectedMedium || selectedChapter || selectedType) && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500">
              Showing <strong className="text-slate-800">{filteredQuestions.length}</strong> matching questions
            </span>
            <button
              onClick={clearFilters}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Questions List */}
      <div className="space-y-3">
        {filteredQuestions.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200 p-8">
            <div className="text-slate-400 mb-2 font-semibold">No questions found matching your filter</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              Try adjusting your search criteria, clearing filters, or adding new questions to the bank.
            </p>
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredQuestions.map(q => {
            const isTextUrdu = isRTL(q.text) || q.medium === 'Urdu';
            const letters = isTextUrdu ? URDU_LETTERS : LATIN_LETTERS;

            return (
              <div
                key={q.id}
                className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 p-4 transition-all shadow-2xs hover:shadow-xs group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Metadata line */}
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-2 flex-wrap">
                      <span className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                        q.medium === 'Urdu' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {q.medium}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="text-slate-700 font-medium truncate max-w-[280px]">{q.chapter}</span>
                      {q.section && (
                        <>
                          <span className="text-slate-300">·</span>
                          <span className="text-slate-600 truncate max-w-[220px]">{q.section}</span>
                        </>
                      )}
                      <span className="text-slate-300">·</span>
                      <span className="capitalize">{q.type === 'mcq' ? 'MCQ' : 'Written'}</span>
                      <span className="text-slate-300">·</span>
                      <span className="font-semibold text-slate-700">{q.marks} mark{q.marks > 1 ? 's' : ''}</span>
                    </div>

                    {/* Question text */}
                    <div
                      dir={isTextUrdu ? 'rtl' : 'ltr'}
                      className={`text-slate-900 font-medium text-sm leading-relaxed ${
                        isTextUrdu ? 'font-urdu text-base' : ''
                      }`}
                    >
                      {q.text}
                    </div>

                    {/* MCQ Options preview */}
                    {q.type === 'mcq' && q.options && q.options.length > 0 && (
                      <div
                        dir={isTextUrdu ? 'rtl' : 'ltr'}
                        className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100"
                      >
                        {q.options.map((opt, oi) => {
                          const isCorrect = q.answer === oi;
                          return (
                            <div
                              key={oi}
                              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs ${
                                isCorrect
                                  ? 'bg-emerald-50/80 border border-emerald-200 text-emerald-900 font-medium'
                                  : 'bg-slate-50 text-slate-700'
                              }`}
                            >
                              <span className={`w-4 text-center font-bold text-[11px] shrink-0 ${
                                isCorrect ? 'text-emerald-700' : 'text-slate-400'
                              }`}>
                                {letters[oi]}
                              </span>
                              <span className={`truncate ${isTextUrdu ? 'font-urdu' : ''}`}>{opt}</span>
                              {isCorrect && (
                                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 ml-auto" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Short Answer reference */}
                    {q.type === 'short' && q.answer && (
                      <div className="mt-2 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 inline-flex items-center gap-1.5">
                        <span className="font-semibold text-slate-700">Answer Key:</span>
                        <span>{String(q.answer)}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions Buttons */}
                  <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onDuplicateQuestion(q)}
                      title="Duplicate Question"
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEditQuestion(q)}
                      title="Edit Question"
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteQuestion(q.id)}
                      title="Delete Question"
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
