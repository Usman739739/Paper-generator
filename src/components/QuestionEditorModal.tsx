import React, { useState, useEffect } from 'react';
import { Question, QuestionType, MediumType } from '../types';
import { CHAPTERS, STANDARD_SECTIONS } from '../data/chapters';
import { isRTL, LATIN_LETTERS, URDU_LETTERS } from '../utils/paperUtils';
import { X, Plus, Trash2, CheckCircle2 } from 'lucide-react';

interface QuestionEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (question: Question) => void;
  initialQuestion?: Question | null;
}

export const QuestionEditorModal: React.FC<QuestionEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialQuestion
}) => {
  const [subject, setSubject] = useState('Physics');
  const [chapter, setChapter] = useState(CHAPTERS.Ch10_En);
  const [medium, setMedium] = useState<MediumType>('English');
  const [section, setSection] = useState('A. Multiple Choice Questions');
  const [type, setType] = useState<QuestionType>('mcq');
  const [marks, setMarks] = useState(1);
  const [text, setText] = useState('');
  const [options, setOptions] = useState<string[]>(['', '', '', '']);
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState(0);
  const [shortAnswer, setShortAnswer] = useState('');

  useEffect(() => {
    if (initialQuestion) {
      setSubject(initialQuestion.subject || 'Physics');
      setChapter(initialQuestion.chapter || CHAPTERS.Ch10_En);
      setMedium(initialQuestion.medium || 'English');
      setSection(initialQuestion.section || 'A. Multiple Choice Questions');
      setType(initialQuestion.type || 'mcq');
      setMarks(initialQuestion.marks || 1);
      setText(initialQuestion.text || '');
      if (initialQuestion.type === 'mcq') {
        const opts = initialQuestion.options && initialQuestion.options.length > 0 
          ? initialQuestion.options 
          : ['', '', '', ''];
        setOptions(opts);
        setCorrectAnswerIndex(typeof initialQuestion.answer === 'number' ? initialQuestion.answer : 0);
        setShortAnswer('');
      } else {
        setShortAnswer((initialQuestion.answer as string) || '');
      }
    } else {
      // reset to clean state
      setSubject('Physics');
      setChapter(CHAPTERS.Ch10_En);
      setMedium('English');
      setSection('A. Multiple Choice Questions');
      setType('mcq');
      setMarks(1);
      setText('');
      setOptions(['', '', '', '']);
      setCorrectAnswerIndex(0);
      setShortAnswer('');
    }
  }, [initialQuestion, isOpen]);

  if (!isOpen) return null;

  const isTextUrdu = isRTL(text) || medium === 'Urdu';

  const handleOptionChange = (idx: number, val: string) => {
    const updated = [...options];
    updated[idx] = val;
    setOptions(updated);
  };

  const handleAddOption = () => {
    if (options.length < 8) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOption = (idx: number) => {
    if (options.length <= 2) return;
    const updated = options.filter((_, i) => i !== idx);
    setOptions(updated);
    if (correctAnswerIndex === idx) {
      setCorrectAnswerIndex(0);
    } else if (correctAnswerIndex > idx) {
      setCorrectAnswerIndex(correctAnswerIndex - 1);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      alert('Question text is required.');
      return;
    }

    let finalAnswer: number | string = '';
    let finalOptions: string[] = [];

    if (type === 'mcq') {
      const validOptions = options.map(o => o.trim()).filter(Boolean);
      if (validOptions.length < 2) {
        alert('Please provide at least 2 valid options for the MCQ.');
        return;
      }
      finalOptions = validOptions;
      finalAnswer = Math.min(correctAnswerIndex, validOptions.length - 1);
    } else {
      finalAnswer = shortAnswer.trim();
    }

    const saved: Question = {
      id: initialQuestion?.id || 'q_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      subject: subject.trim() || 'Physics',
      chapter: chapter.trim(),
      medium,
      section: section.trim(),
      type,
      marks: Math.max(1, Number(marks) || 1),
      text: text.trim(),
      options: finalOptions,
      answer: finalAnswer
    };

    onSave(saved);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {initialQuestion ? 'Edit Question' : 'Add New Question'}
            </h2>
            <p className="text-xs text-slate-500">Configure parameters, formatting, and answer keys</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Medium</label>
              <select
                value={medium}
                onChange={e => setMedium(e.target.value as MediumType)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="English">English</option>
                <option value="Urdu">Urdu (اردو)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Marks</label>
              <input
                type="number"
                min="1"
                max="20"
                value={marks}
                onChange={e => setMarks(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Chapter</label>
              <input
                type="text"
                list="chapter-suggestions"
                value={chapter}
                onChange={e => setChapter(e.target.value)}
                placeholder="Chapter 10: Thermal Properties..."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                required
              />
              <datalist id="chapter-suggestions">
                {Object.values(CHAPTERS).map((ch, i) => (
                  <option key={i} value={ch} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Section</label>
              <input
                type="text"
                list="section-suggestions"
                value={section}
                onChange={e => setSection(e.target.value)}
                placeholder="e.g. A. Multiple Choice Questions"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                required
              />
              <datalist id="section-suggestions">
                {STANDARD_SECTIONS.map((sec, i) => (
                  <option key={i} value={sec.label} />
                ))}
                <option value="A. کثیر الانتخابی سوالات" />
                <option value="B. مختصر سوالات" />
                <option value="C. تفصیلی جوابات کے سوالات" />
                <option value="D. جامع سوالات" />
                <option value="E. عددی سوالات" />
              </datalist>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Question Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('mcq')}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all text-center cursor-pointer ${
                  type === 'mcq'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                Multiple Choice (MCQ)
              </button>
              <button
                type="button"
                onClick={() => setType('short')}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all text-center cursor-pointer ${
                  type === 'short'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                Written / Short / Long / Numerical
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">Question Text</label>
              <span className="text-[11px] text-slate-400">
                {isTextUrdu ? 'Urdu text detected (RTL)' : 'English text (LTR)'}
              </span>
            </div>
            <textarea
              rows={3}
              dir={isTextUrdu ? 'rtl' : 'ltr'}
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Enter the question text here..."
              className={`w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white ${
                isTextUrdu ? 'font-urdu text-base' : ''
              }`}
              required
            />
          </div>

          {/* MCQ Options */}
          {type === 'mcq' ? (
            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Options (Select the correct answer)
                </span>
                <span className="text-[11px] text-slate-500">Radio button = correct answer</span>
              </div>

              <div className="space-y-2.5">
                {options.map((opt, idx) => {
                  const isOptUrdu = isRTL(opt) || isTextUrdu;
                  const letter = isOptUrdu ? URDU_LETTERS[idx] : LATIN_LETTERS[idx];
                  return (
                    <div key={idx} className="flex items-center gap-2">
                      <label className="flex items-center justify-center cursor-pointer p-1">
                        <input
                          type="radio"
                          name="correctOption"
                          checked={correctAnswerIndex === idx}
                          onChange={() => setCorrectAnswerIndex(idx)}
                          className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </label>
                      <span className="w-6 text-center font-bold text-xs text-slate-500 shrink-0">
                        {letter}
                      </span>
                      <input
                        type="text"
                        dir={isOptUrdu ? 'rtl' : 'ltr'}
                        value={opt}
                        onChange={e => handleOptionChange(idx, e.target.value)}
                        placeholder={`Option ${letter}`}
                        className={`flex-1 px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white ${
                          isOptUrdu ? 'font-urdu' : ''
                        }`}
                      />
                      {options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {options.length < 8 && (
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="mt-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Option</span>
                </button>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Answer Key Reference / Expected Solution (Optional)
              </label>
              <textarea
                rows={2}
                value={shortAnswer}
                onChange={e => setShortAnswer(e.target.value)}
                placeholder="e.g. 72 kJ or key formula steps..."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save Question</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
