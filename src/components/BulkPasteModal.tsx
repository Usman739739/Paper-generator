import React, { useState } from 'react';
import { Question } from '../types';
import { CHAPTERS, STANDARD_SECTIONS } from '../data/chapters';
import { parseBulkQuestions } from '../utils/paperUtils';
import { X, FileSpreadsheet, Check } from 'lucide-react';

interface BulkPasteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddQuestions: (questions: Question[]) => void;
}

export const BulkPasteModal: React.FC<BulkPasteModalProps> = ({
  isOpen,
  onClose,
  onAddQuestions
}) => {
  const [subject, setSubject] = useState('Physics');
  const [chapter, setChapter] = useState(CHAPTERS.Ch10_En);
  const [medium, setMedium] = useState<'English' | 'Urdu'>('English');
  const [section, setSection] = useState('A. Multiple Choice Questions');
  const [defaultMarks, setDefaultMarks] = useState(1);
  const [text, setText] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      alert('Please paste questions in the text box.');
      return;
    }

    const parsed = parseBulkQuestions(text, {
      subject,
      chapter,
      medium,
      section,
      marks: defaultMarks
    });

    if (parsed.length === 0) {
      alert('Could not parse any questions. Check format: Separate questions with a blank line.');
      return;
    }

    onAddQuestions(parsed);
    setText('');
    onClose();
  };

  const samplePlaceholder = `What is the SI unit of force?
*Newton
Joule
Watt
Pascal

Define specific heat capacity.
Ans: The amount of heat required to raise the temperature of 1 kg of a substance by 1 K.

Calculate the energy when 2 kg is moved 5 m under 10 N force.
Ans: 50 Joules`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Bulk Paste Questions</h2>
              <p className="text-xs text-slate-500">Paste multiple MCQs or written questions separated by blank lines</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Medium</label>
              <select
                value={medium}
                onChange={e => setMedium(e.target.value as 'English' | 'Urdu')}
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="English">English</option>
                <option value="Urdu">Urdu (اردو)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Default Marks</label>
              <input
                type="number"
                min="1"
                max="20"
                value={defaultMarks}
                onChange={e => setDefaultMarks(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Chapter</label>
              <input
                type="text"
                list="bulk-chapters"
                value={chapter}
                onChange={e => setChapter(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                required
              />
              <datalist id="bulk-chapters">
                {Object.values(CHAPTERS).map((ch, i) => (
                  <option key={i} value={ch} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Section</label>
              <input
                type="text"
                list="bulk-sections"
                value={section}
                onChange={e => setSection(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                required
              />
              <datalist id="bulk-sections">
                {STANDARD_SECTIONS.map((sec, i) => (
                  <option key={i} value={sec.label} />
                ))}
              </datalist>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">Paste Text Content</label>
              <span className="text-[11px] text-slate-400">Put * in front of correct MCQ option</span>
            </div>
            <textarea
              rows={9}
              dir="auto"
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={samplePlaceholder}
              className="w-full p-3 font-mono text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white leading-relaxed"
              required
            />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 space-y-1">
            <div className="font-semibold">Quick Format Tips:</div>
            <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-amber-800">
              <li>Separate each question with at least <strong>one blank line</strong>.</li>
              <li>For MCQs: Put the question on the first line, then 2 to 4 options underneath. Put an asterisk <code>*</code> in front of the correct option.</li>
              <li>For Written/Short questions: Include <code>Ans: &lt;answer&gt;</code> for the answer key.</li>
            </ul>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Import Questions</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
