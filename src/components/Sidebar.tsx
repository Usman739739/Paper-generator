import React, { useRef } from 'react';
import { 
  FileText, 
  Layers, 
  Printer, 
  Upload, 
  Download, 
  Type, 
  RotateCcw,
  BookOpen,
  X,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean; // Mobile open/closed state
  onClose: () => void;
  isCollapsedDesktop: boolean; // Desktop collapsed (slim) state
  onToggleCollapseDesktop: () => void;
  currentView: 'bank' | 'build' | 'preview';
  onViewChange: (view: 'bank' | 'build' | 'preview') => void;
  bankCount: number;
  selectedCount: number;
  urduFontName: string | null;
  onFontLoaded: (file: File) => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onResetBank: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  isCollapsedDesktop,
  onToggleCollapseDesktop,
  currentView,
  onViewChange,
  bankCount,
  selectedCount,
  urduFontName,
  onFontLoaded,
  onExport,
  onImport,
  onResetBank
}) => {
  const fontInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const handleFontChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFontLoaded(file);
      e.target.value = '';
    }
  };

  const handleImportChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImport(file);
      e.target.value = '';
    }
  };

  const handleNavClick = (view: 'bank' | 'build' | 'preview') => {
    onViewChange(view);
    // Automatically close mobile drawer when navigating
    onClose();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-200"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container:
          - Mobile: Fixed slide-over drawer (z-50)
          - Desktop (lg): Sticky flex column, either w-64 or w-20
      */}
      <aside
        className={`no-print bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 h-screen border-r border-slate-800 select-none transition-all duration-300 ease-in-out
          fixed lg:sticky top-0 bottom-0 left-0 z-50
          ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
          ${isCollapsedDesktop ? 'lg:w-20' : 'lg:w-64'}
          w-72 sm:w-80 lg:w-auto
        `}
      >
        {/* Brand Header */}
        <div className="px-4 py-4.5 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-600/30 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            {/* Show title when not collapsed on desktop, or always on mobile */}
            <div className={`min-w-0 ${isCollapsedDesktop ? 'lg:hidden' : 'block'}`}>
              <div className="font-bold text-white tracking-tight text-base leading-none truncate">PaperGen</div>
              <div className="text-[11px] text-slate-400 mt-1 truncate">Physics Test Creator</div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Desktop Collapse / Expand Button */}
            <button
              onClick={onToggleCollapseDesktop}
              className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title={isCollapsedDesktop ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsedDesktop ? (
                <PanelLeftOpen className="w-5 h-5 text-indigo-400" />
              ) : (
                <PanelLeftClose className="w-5 h-5" />
              )}
            </button>

            {/* Mobile Close Button (X) */}
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="p-3 space-y-1.5 flex-1 overflow-y-auto overflow-x-hidden">
          <div className={`px-2 py-1.5 text-[10px] font-bold tracking-wider text-slate-500 uppercase ${
            isCollapsedDesktop ? 'lg:text-center lg:px-0' : 'text-left'
          }`}>
            {isCollapsedDesktop ? <span className="lg:hidden">Workspace</span> : 'Workspace'}
          </div>

          {/* Question Bank */}
          <button
            onClick={() => handleNavClick('bank')}
            title="Question Bank"
            className={`w-full flex items-center rounded-xl text-sm font-medium transition-all cursor-pointer ${
              currentView === 'bank'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            } ${
              isCollapsedDesktop 
                ? 'lg:justify-center lg:p-3 p-3 justify-between' 
                : 'px-3.5 py-2.5 justify-between'
            }`}
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 shrink-0 opacity-90" />
              <span className={isCollapsedDesktop ? 'lg:hidden' : 'inline'}>Question Bank</span>
            </div>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                currentView === 'bank' ? 'bg-indigo-700/90 text-white' : 'bg-slate-800 text-slate-400'
              } ${isCollapsedDesktop ? 'lg:hidden' : 'inline'}`}
            >
              {bankCount}
            </span>
          </button>

          {/* Build Paper */}
          <button
            onClick={() => handleNavClick('build')}
            title="Build Paper"
            className={`w-full flex items-center rounded-xl text-sm font-medium transition-all cursor-pointer ${
              currentView === 'build'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            } ${
              isCollapsedDesktop 
                ? 'lg:justify-center lg:p-3 p-3 justify-between' 
                : 'px-3.5 py-2.5 justify-between'
            }`}
          >
            <div className="flex items-center gap-3">
              <Layers className="w-5 h-5 shrink-0 opacity-90" />
              <span className={isCollapsedDesktop ? 'lg:hidden' : 'inline'}>Build Paper</span>
            </div>
            {selectedCount > 0 && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                  currentView === 'build' ? 'bg-indigo-700/90 text-white' : 'bg-emerald-500/20 text-emerald-400'
                } ${isCollapsedDesktop ? 'lg:hidden' : 'inline'}`}
              >
                {selectedCount}
              </span>
            )}
          </button>

          {/* Preview & Print */}
          <button
            onClick={() => handleNavClick('preview')}
            title="Preview & Print"
            className={`w-full flex items-center rounded-xl text-sm font-medium transition-all cursor-pointer ${
              currentView === 'preview'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            } ${
              isCollapsedDesktop 
                ? 'lg:justify-center lg:p-3 p-3 justify-between' 
                : 'px-3.5 py-2.5 justify-between'
            }`}
          >
            <div className="flex items-center gap-3">
              <Printer className="w-5 h-5 shrink-0 opacity-90" />
              <span className={isCollapsedDesktop ? 'lg:hidden' : 'inline'}>Preview & Print</span>
            </div>
            <span className={`text-[10px] text-slate-400 uppercase tracking-wider font-semibold ${
              isCollapsedDesktop ? 'lg:hidden' : 'inline'
            }`}>
              Ready
            </span>
          </button>

          {/* Tools & Fonts Section */}
          <div className={`pt-4 px-2 py-1.5 text-[10px] font-bold tracking-wider text-slate-500 uppercase ${
            isCollapsedDesktop ? 'lg:text-center lg:px-0' : 'text-left'
          }`}>
            {isCollapsedDesktop ? <span className="lg:hidden">Tools</span> : 'Tools & Fonts'}
          </div>

          {/* Load Urdu Font */}
          <button
            onClick={() => fontInputRef.current?.click()}
            title={urduFontName ? `Urdu Font Active: ${urduFontName}` : 'Upload custom Urdu font (.ttf/.woff)'}
            className={`w-full flex items-center rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer ${
              isCollapsedDesktop 
                ? 'lg:justify-center lg:p-3 p-2.5 justify-between' 
                : 'px-3.5 py-2 justify-between'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Type className="w-4 h-4 text-amber-400 shrink-0" />
              <span className={`truncate ${isCollapsedDesktop ? 'lg:hidden' : 'inline'}`}>
                {urduFontName ? `Font: ${urduFontName}` : 'Load Urdu Font'}
              </span>
            </div>
            <span className={`text-[10px] text-slate-500 shrink-0 ${isCollapsedDesktop ? 'lg:hidden' : 'inline'}`}>
              {urduFontName ? '✓ Active' : 'TTF'}
            </span>
          </button>
          <input
            ref={fontInputRef}
            type="file"
            accept=".ttf,.otf,.woff,.woff2"
            onChange={handleFontChange}
            className="hidden"
          />

          {/* Export JSON */}
          <button
            onClick={onExport}
            title="Export Question Bank (JSON)"
            className={`w-full flex items-center rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer ${
              isCollapsedDesktop 
                ? 'lg:justify-center lg:p-3 p-2.5 justify-start' 
                : 'px-3.5 py-2 justify-start'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Download className="w-4 h-4 text-sky-400 shrink-0" />
              <span className={isCollapsedDesktop ? 'lg:hidden' : 'inline'}>Export Questions</span>
            </div>
          </button>

          {/* Import JSON */}
          <button
            onClick={() => importInputRef.current?.click()}
            title="Import Bank (JSON)"
            className={`w-full flex items-center rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer ${
              isCollapsedDesktop 
                ? 'lg:justify-center lg:p-3 p-2.5 justify-start' 
                : 'px-3.5 py-2 justify-start'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Upload className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className={isCollapsedDesktop ? 'lg:hidden' : 'inline'}>Import Bank</span>
            </div>
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleImportChange}
            className="hidden"
          />
        </nav>

        {/* Footer Area */}
        <div className={`p-3 border-t border-slate-800 bg-slate-950/40 text-xs shrink-0 ${
          isCollapsedDesktop ? 'lg:p-2 lg:text-center' : ''
        }`}>
          <div className={`flex items-center justify-between text-slate-400 mb-2 ${
            isCollapsedDesktop ? 'lg:hidden' : 'flex'
          }`}>
            <span>Grade 10 Physics</span>
            <span className="text-emerald-400 font-medium">12 Chapters</span>
          </div>

          <button
            onClick={onResetBank}
            title="Reset Bank to Defaults"
            className={`w-full py-1.5 px-2 rounded-lg text-[11px] font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              isCollapsedDesktop ? 'lg:p-2' : ''
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5 shrink-0" />
            <span className={isCollapsedDesktop ? 'lg:hidden' : 'inline'}>Reset 200+ Questions</span>
          </button>
        </div>
      </aside>
    </>
  );
};
