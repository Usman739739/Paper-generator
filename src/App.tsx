import React, { useState, useEffect } from 'react';
import { Question, PaperConfig } from './types';
import { DEFAULT_QUESTIONS } from './data/defaultQuestions';
import { 
  loadSavedFont, 
  saveCustomFont, 
  registerFontBuffer 
} from './services/fontStorage';
import { Sidebar } from './components/Sidebar';
import { QuestionBankView } from './components/QuestionBankView';
import { BuildPaperView } from './components/BuildPaperView';
import { PreviewPrintView } from './components/PreviewPrintView';
import { QuestionEditorModal } from './components/QuestionEditorModal';
import { BulkPasteModal } from './components/BulkPasteModal';
import { Menu, BookOpen, Layers, Printer, FileText } from 'lucide-react';

const STORAGE_KEY = 'tpg.physics10.v21';

const DEFAULT_CONFIG: PaperConfig = {
  school: 'City Science Academy',
  title: 'Physics Mid-Term Assessment',
  chapter: 'Chapter 10: Thermal Properties of Matter',
  className: 'Grade 10 (Matric)',
  subject: 'Physics',
  date: new Date().toISOString().slice(0, 10),
  duration: '60 Minutes',
  variants: 1,
  mcqCols: 2,
  pageSize: 'a4',
  perSheet: 1,
  arrangement: 'stack',
  medium: 'english',
  shuffleQuestions: false,
  shuffleOptions: false,
  includeKey: true,
  showMarks: true,
  showStudentInfo: true,
  watermarkText: ''
};

export default function App() {
  const [currentView, setCurrentView] = useState<'bank' | 'build' | 'preview'>('build');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [config, setConfig] = useState<PaperConfig>(DEFAULT_CONFIG);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [urduFontName, setUrduFontName] = useState<string | null>(null);

  // Responsive Sidebar States
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCollapsedDesktop, setIsCollapsedDesktop] = useState(false);

  // Modals state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isBulkOpen, setIsBulkOpen] = useState(false);

  // Notification message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Initial State Loading & Font check
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed.questions) && parsed.questions.length > 0) {
          setQuestions(parsed.questions);
          if (parsed.config) setConfig(parsed.config);
          if (Array.isArray(parsed.selectedIds)) {
            const valid = parsed.selectedIds.filter((id: string) => 
              parsed.questions.some((q: Question) => q.id === id)
            );
            setSelectedIds(valid);
          }
        } else {
          setQuestions(DEFAULT_QUESTIONS);
          setSelectedIds([]);
        }
      } else {
        setQuestions(DEFAULT_QUESTIONS);
        setSelectedIds([]);
      }
    } catch {
      setQuestions(DEFAULT_QUESTIONS);
      setSelectedIds([]);
    }

    // Check IndexedDB for Urdu Font
    loadSavedFont().then(fontData => {
      if (fontData && fontData.buf) {
        registerFontBuffer(fontData.buf)
          .then(() => setUrduFontName(fontData.name))
          .catch(err => console.warn('Could not register saved font', err));
      }
    });
  }, []);

  // 2. Persist state on change
  useEffect(() => {
    if (questions.length === 0) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          questions,
          config,
          selectedIds
        })
      );
    } catch (err) {
      console.warn('Storage quota exceeded or disabled', err);
    }
  }, [questions, config, selectedIds]);

  // Keyboard shortcut: close drawer on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileSidebarOpen) {
        setIsMobileSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileSidebarOpen]);

  // Handlers
  const handleToggleQuestion = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectMultiple = (ids: string[], replace = false) => {
    if (replace) {
      setSelectedIds(ids);
    } else {
      const set = new Set([...selectedIds, ...ids]);
      setSelectedIds(Array.from(set));
    }
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
    showToast('Selection cleared.');
  };

  const handleAddQuestion = () => {
    setEditingQuestion(null);
    setIsEditorOpen(true);
  };

  const handleEditQuestion = (q: Question) => {
    setEditingQuestion(q);
    setIsEditorOpen(true);
  };

  const handleSaveQuestion = (q: Question) => {
    if (editingQuestion) {
      setQuestions(prev => prev.map(item => item.id === q.id ? q : item));
      showToast('Question updated successfully.');
    } else {
      setQuestions(prev => [q, ...prev]);
      showToast('New question added to bank.');
    }
  };

  const handleDeleteQuestion = (id: string) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      setQuestions(prev => prev.filter(q => q.id !== id));
      setSelectedIds(prev => prev.filter(x => x !== id));
      showToast('Question removed.');
    }
  };

  const handleDuplicateQuestion = (q: Question) => {
    const duplicated: Question = {
      ...q,
      id: 'q_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      text: `${q.text} (Copy)`
    };
    setQuestions(prev => [duplicated, ...prev]);
    showToast('Question duplicated.');
  };

  const handleBulkAdd = (newQuestions: Question[]) => {
    setQuestions(prev => [...newQuestions, ...prev]);
    showToast(`Added ${newQuestions.length} questions to bank.`);
  };

  const handleFontLoaded = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      await registerFontBuffer(buffer);
      await saveCustomFont(buffer, file.name);
      setUrduFontName(file.name);
      showToast(`Font "${file.name}" loaded and stored.`);
    } catch (err: any) {
      alert('Could not load font file: ' + err?.message);
    }
  };

  const handleExport = () => {
    const data = {
      version: '2.1',
      exportedAt: new Date().toISOString(),
      config,
      selectedIds,
      questions
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PaperGen-PhysicsBank-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Question bank exported to JSON.');
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const content = JSON.parse(e.target?.result as string);
        const incoming = Array.isArray(content) ? content : content.questions;
        if (!Array.isArray(incoming)) {
          throw new Error('File does not contain valid questions array.');
        }

        const shouldMerge = window.confirm(
          `Found ${incoming.length} questions in file.\n\nClick OK to MERGE with current bank.\nClick CANCEL to REPLACE entire bank.`
        );

        if (shouldMerge) {
          setQuestions(prev => [...incoming, ...prev]);
          showToast(`Merged ${incoming.length} questions into bank.`);
        } else {
          setQuestions(incoming);
          if (content.config) setConfig(content.config);
          if (Array.isArray(content.selectedIds)) setSelectedIds(content.selectedIds);
          showToast(`Imported ${incoming.length} questions.`);
        }
      } catch (err: any) {
        alert('Failed to import JSON: ' + err?.message);
      }
    };
    reader.readAsText(file);
  };

  const handleResetBank = () => {
    if (window.confirm('Reset question bank back to default 200+ Physics questions? Any custom additions will be reset.')) {
      setQuestions(DEFAULT_QUESTIONS);
      setSelectedIds(DEFAULT_QUESTIONS.slice(0, 10).map(q => q.id));
      showToast('Bank restored to default 200+ questions.');
    }
  };

  const getViewTitle = () => {
    switch (currentView) {
      case 'bank': return 'Question Bank';
      case 'build': return 'Build Paper';
      case 'preview': return 'Preview & Print';
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen w-screen overflow-hidden bg-slate-100 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="no-print fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl border border-slate-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Mobile Top App Bar (visible on screens < 1024px) */}
      <header className="no-print lg:hidden bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800 shrink-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="p-1.5 -ml-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            aria-label="Open navigation menu"
            title="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="font-bold text-sm tracking-tight">PaperGen</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 font-medium">
            {getViewTitle()}
          </span>
          {selectedIds.length > 0 && currentView !== 'build' && (
            <button
              onClick={() => setCurrentView('build')}
              className="text-xs px-2 py-1 rounded-md bg-indigo-600 text-white font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{selectedIds.length}</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Sidebar (Drawer on mobile, collapsible sticky bar on laptop/desktop) */}
      <Sidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        isCollapsedDesktop={isCollapsedDesktop}
        onToggleCollapseDesktop={() => setIsCollapsedDesktop(prev => !prev)}
        currentView={currentView}
        onViewChange={setCurrentView}
        bankCount={questions.length}
        selectedCount={selectedIds.length}
        urduFontName={urduFontName}
        onFontLoaded={handleFontLoaded}
        onExport={handleExport}
        onImport={handleImport}
        onResetBank={handleResetBank}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto h-full p-3.5 sm:p-6 lg:p-8">
        {currentView === 'bank' && (
          <QuestionBankView
            questions={questions}
            onAddQuestion={handleAddQuestion}
            onBulkPaste={() => setIsBulkOpen(true)}
            onEditQuestion={handleEditQuestion}
            onDeleteQuestion={handleDeleteQuestion}
            onDuplicateQuestion={handleDuplicateQuestion}
          />
        )}

        {currentView === 'build' && (
          <BuildPaperView
            questions={questions}
            config={config}
            onConfigChange={setConfig}
            selectedIds={selectedIds}
            onToggleQuestion={handleToggleQuestion}
            onSelectMultiple={handleSelectMultiple}
            onClearSelection={handleClearSelection}
            onGenerate={() => setCurrentView('preview')}
          />
        )}

        {currentView === 'preview' && (
          <PreviewPrintView
            questions={questions}
            config={config}
            selectedIds={selectedIds}
            onBackToBuild={() => setCurrentView('build')}
          />
        )}
      </main>

      {/* Modals */}
      <QuestionEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSaveQuestion}
        initialQuestion={editingQuestion}
      />

      <BulkPasteModal
        isOpen={isBulkOpen}
        onClose={() => setIsBulkOpen(false)}
        onAddQuestions={handleBulkAdd}
      />
    </div>
  );
}
