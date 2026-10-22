import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PaperConfig, Question } from '../types';
import { PAGE_PRESETS } from '../data/chapters';
import { 
  generatePaperVariants, 
  isRTL, 
  LATIN_LETTERS, 
  URDU_LETTERS, 
  getTranslation,
  PreparedVariant 
} from '../utils/paperUtils';
import { 
  Printer, 
  ArrowLeft, 
  ZoomIn, 
  ZoomOut, 
  AlertCircle, 
  CheckCircle2, 
  Scissors,
  FileCheck,
  Maximize2,
  Minimize2,
  Sparkles,
  Sliders,
  Type
} from 'lucide-react';

interface PreviewPrintViewProps {
  questions: Question[];
  config: PaperConfig;
  selectedIds: string[];
  onBackToBuild: () => void;
}

export const PreviewPrintView: React.FC<PreviewPrintViewProps> = ({
  questions,
  config,
  selectedIds,
  onBackToBuild
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [headerDensity, setHeaderDensity] = useState<'compact' | 'minimal' | 'standard'>('compact');
  const [autoFitEnabled, setAutoFitEnabled] = useState<boolean>(true);
  const [appliedFontSize, setAppliedFontSize] = useState<number>(11.5);
  const [fitStatus, setFitStatus] = useState<{ fits: boolean; message: string }>({
    fits: true,
    message: 'Auto-fitting...'
  });

  const paperContainerRef = useRef<HTMLDivElement>(null);

  // Selected questions
  const selectedQuestions = React.useMemo(() => {
    return selectedIds.map(id => questions.find(q => q.id === id)).filter(Boolean) as Question[];
  }, [selectedIds, questions]);

  // Generate variants
  const variants = React.useMemo(() => {
    return generatePaperVariants(selectedQuestions, config);
  }, [selectedQuestions, config]);

  // Setup dynamic page CSS for A4, Legal 13, Legal 14
  useEffect(() => {
    const preset = PAGE_PRESETS[config.pageSize] || PAGE_PRESETS.a4;
    const styleEl = document.getElementById('dynamicPageStyle') || document.createElement('style');
    styleEl.id = 'dynamicPageStyle';
    styleEl.textContent = `
      @page { size: ${preset.css}; margin: 8mm 8mm; }
      :root { --pw: ${preset.w}mm; --ph: ${preset.h}mm; --mx: 8mm; --my: 8mm; }
    `;
    if (!document.getElementById('dynamicPageStyle')) {
      document.head.appendChild(styleEl);
    }
  }, [config.pageSize]);

  // Auto-fit calculation algorithm
  const performAutoFit = useCallback(() => {
    if (!paperContainerRef.current || !autoFitEnabled || selectedQuestions.length === 0) return;

    const miniPapers = paperContainerRef.current.querySelectorAll('.mini-paper:not(.is-key)');
    if (miniPapers.length === 0) return;

    // Base font sizes depending on layout
    const maxFont = config.perSheet === 1 ? 14.5 : config.perSheet === 2 ? 12.5 : 10.5;
    const minFont = config.perSheet === 1 ? 8.0 : config.perSheet === 2 ? 7.0 : 6.0;

    let allFit = true;
    let computedBestSize = maxFont;

    miniPapers.forEach(paper => {
      const el = paper as HTMLElement;
      const targetHeight = el.clientHeight || (el.parentElement?.clientHeight ? el.parentElement.clientHeight - 8 : 950);

      // Start with max font and scale down if content overflows
      let currentSize = maxFont;
      el.style.fontSize = `${currentSize}px`;

      // If already fitting with room to spare, test if we should scale up or stay
      if (el.scrollHeight <= targetHeight - 2) {
        computedBestSize = currentSize;
      } else {
        // Step down until it fits or reaches min readable font
        while (el.scrollHeight > targetHeight && currentSize > minFont) {
          currentSize -= 0.3;
          el.style.fontSize = `${currentSize}px`;
        }
        computedBestSize = Math.max(minFont, Number(currentSize.toFixed(1)));
      }

      if (el.scrollHeight > targetHeight + 3) {
        allFit = false;
      }
    });

    setAppliedFontSize(computedBestSize);
    if (allFit) {
      setFitStatus({
        fits: true,
        message: `Auto-fit: ${computedBestSize}px (Fits 1 page per test)`
      });
    } else {
      setFitStatus({
        fits: false,
        message: `Exceeds 1 page at ${computedBestSize}px (${selectedQuestions.length} Qs selected)`
      });
    }
  }, [autoFitEnabled, config.perSheet, config.arrangement, selectedQuestions.length, headerDensity]);

  // Run auto-fit after DOM updates
  useEffect(() => {
    const timer = setTimeout(() => {
      performAutoFit();
    }, 60);
    return () => clearTimeout(timer);
  }, [performAutoFit, variants, zoomLevel, headerDensity]);

  // Manual font size adjustments
  const handleManualFontAdjust = (delta: number) => {
    setAutoFitEnabled(false);
    const newSize = Math.max(6, Math.min(18, Number((appliedFontSize + delta).toFixed(1))));
    setAppliedFontSize(newSize);

    if (paperContainerRef.current) {
      const miniPapers = paperContainerRef.current.querySelectorAll('.mini-paper:not(.is-key)');
      let overflows = false;
      miniPapers.forEach(paper => {
        const el = paper as HTMLElement;
        el.style.fontSize = `${newSize}px`;
        if (el.scrollHeight > el.clientHeight + 2) {
          overflows = true;
        }
      });
      setFitStatus({
        fits: !overflows,
        message: overflows ? `Exceeds page bounds at ${newSize}px` : `Manual: ${newSize}px (Fits 1 page)`
      });
    }
  };

  const handleResetToAuto = () => {
    setAutoFitEnabled(true);
    performAutoFit();
  };

  const handlePrint = () => {
    window.print();
  };

  const totalMarks = selectedQuestions.reduce((a, b) => a + (b.marks || 1), 0);
  const masterSheetCount = Math.ceil(variants.length / config.perSheet);

  // If no questions selected, prompt user to go back to Build
  if (selectedQuestions.length === 0) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-xs">
          <FileCheck className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">No Questions Selected</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          You haven't selected any questions for this test paper yet. Please go to the <strong>Build Paper</strong> tab and choose your test questions.
        </p>
        <button
          onClick={onBackToBuild}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Go to Build Paper</span>
        </button>
      </div>
    );
  }

  // Render ultra-compact space-efficient header
  const renderHeader = (variant: PreparedVariant) => {
    const isMediumUrdu = config.medium === 'urdu';

    // 1. MINIMAL HEADER (Ultra-condensed, saves maximum vertical space)
    if (headerDensity === 'minimal') {
      return (
        <div className="border-b-2 border-black pb-1 mb-1.5 text-center leading-tight">
          <div className="flex items-center justify-between gap-2">
            <div className="font-extrabold text-[12px] uppercase tracking-tight truncate text-black">
              {config.school || config.title || 'Exam Paper'}
              {config.subject ? ` · ${config.subject}` : ''}
              {config.className ? ` (${config.className})` : ''}
            </div>
            <div className="flex items-center gap-2 shrink-0 text-[10px]">
              {variant.label && (
                <span className="border border-black rounded px-1.5 font-bold uppercase">
                  {variant.label}
                </span>
              )}
              <span className="font-bold">Marks: {totalMarks}</span>
            </div>
          </div>
          {config.showStudentInfo && (
            <div className="mt-0.5 pt-0.5 border-t border-dashed border-slate-300 flex items-center justify-between text-[9px] text-slate-700">
              <span>{getTranslation('name', config.medium)}: ____________________</span>
              <span>{getTranslation('rollNo', config.medium)}: _________</span>
              <span>{getTranslation('time', config.medium)}: {config.duration || '60m'}</span>
            </div>
          )}
        </div>
      );
    }

    // 2. COMPACT HEADER (Default: Clean, elegant, space-efficient)
    if (headerDensity === 'compact') {
      return (
        <div className="border-b-2 border-black pb-1 mb-2 text-center">
          {/* Top Line: School & Variant Badge */}
          <div className="flex items-center justify-between gap-2 leading-tight">
            <div className="flex-1 text-center">
              {config.school && (
                <div className={`text-[13px] font-black uppercase tracking-tight text-black leading-tight ${isMediumUrdu ? 'font-urdu text-[15px]' : ''}`}>
                  {config.school}
                </div>
              )}
              <div className="flex items-center justify-center gap-2 text-[11px] font-bold text-slate-900 leading-tight">
                {config.title && <span>{config.title}</span>}
                {config.title && config.chapter && <span className="opacity-30">·</span>}
                {config.chapter && <span className="font-semibold text-slate-700">{config.chapter}</span>}
              </div>
            </div>

            {variant.label && (
              <div className="border-2 border-black rounded px-2 py-0.2 text-[10px] font-black tracking-wider uppercase shrink-0">
                {variant.label}
              </div>
            )}
          </div>

          {/* Meta Line: Class, Subject, Date, Duration, Total Marks in a single compact row */}
          <div className="flex items-center justify-center gap-2.5 sm:gap-4 text-[10px] font-medium text-slate-800 mt-1 pt-0.5 border-t border-slate-300 flex-wrap leading-tight">
            {config.className && (
              <span><strong>{getTranslation('class', config.medium)}:</strong> {config.className}</span>
            )}
            {config.subject && (
              <span><strong>{getTranslation('subject', config.medium)}:</strong> {config.subject}</span>
            )}
            {config.date && (
              <span><strong>{getTranslation('date', config.medium)}:</strong> {config.date}</span>
            )}
            {config.duration && (
              <span><strong>{getTranslation('time', config.medium)}:</strong> {config.duration}</span>
            )}
            <span><strong>{getTranslation('totalMarks', config.medium)}:</strong> {totalMarks}</span>
          </div>

          {/* Student Info row (compact) */}
          {config.showStudentInfo && (
            <div className="mt-1 pt-0.5 border-t border-dashed border-slate-400 grid grid-cols-4 gap-2 text-[9.5px] text-slate-800 text-left leading-tight">
              <div className="col-span-2 truncate">
                <span>{getTranslation('name', config.medium)}: </span>
                <span className="inline-block border-b border-black w-24 sm:w-36"></span>
              </div>
              <div>
                <span>{getTranslation('rollNo', config.medium)}: </span>
                <span className="inline-block border-b border-black w-10 sm:w-16"></span>
              </div>
              <div className="text-right font-bold">
                <span className="border border-black px-1.5 py-0.2 text-[9px]">Marks: &nbsp;&nbsp;&nbsp;/{totalMarks}</span>
              </div>
            </div>
          )}
        </div>
      );
    }

    // 3. STANDARD HEADER
    return (
      <div className="border-b-2 border-black pb-2 mb-2.5 text-center">
        <div className="flex justify-between items-baseline flex-wrap gap-2">
          <div className="flex-1 text-center">
            {config.school && (
              <div className={`text-base font-extrabold uppercase tracking-tight ${isMediumUrdu ? 'font-urdu text-lg' : ''}`}>
                {config.school}
              </div>
            )}
            {config.title && (
              <div className={`text-xs font-bold text-slate-800 ${isMediumUrdu ? 'font-urdu' : ''}`}>
                {config.title}
              </div>
            )}
            {config.chapter && (
              <div className={`text-[11px] font-semibold text-slate-700 mt-0.5 ${isMediumUrdu ? 'font-urdu' : ''}`}>
                {config.chapter}
              </div>
            )}
          </div>

          {variant.label && (
            <div className="border-2 border-black rounded px-2.5 py-0.5 text-xs font-black tracking-wider uppercase shrink-0">
              {variant.label}
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-3 sm:gap-5 mt-1.5 text-[10.5px] font-medium text-slate-800 flex-wrap border-t border-slate-300 pt-1">
          {config.className && <span><strong>{getTranslation('class', config.medium)}:</strong> {config.className}</span>}
          {config.subject && <span><strong>{getTranslation('subject', config.medium)}:</strong> {config.subject}</span>}
          {config.date && <span><strong>{getTranslation('date', config.medium)}:</strong> {config.date}</span>}
          {config.duration && <span><strong>{getTranslation('time', config.medium)}:</strong> {config.duration}</span>}
          <span><strong>{getTranslation('totalMarks', config.medium)}:</strong> {totalMarks}</span>
        </div>

        {config.showStudentInfo && (
          <div className="mt-1.5 pt-1 border-t border-dashed border-slate-400 grid grid-cols-4 gap-2 text-[10px] text-slate-800 text-left">
            <div className="col-span-2 truncate">
              <span>{getTranslation('name', config.medium)}: </span>
              <span className="inline-block border-b border-black w-28 sm:w-36"></span>
            </div>
            <div>
              <span>{getTranslation('rollNo', config.medium)}: </span>
              <span className="inline-block border-b border-black w-12 sm:w-16"></span>
            </div>
            <div className="text-right">
              <span className="border border-black px-1.5 py-0.5 font-bold">Marks: &nbsp;&nbsp;&nbsp;/{totalMarks}</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Helper to render mini paper component
  const renderSinglePaper = (variant: PreparedVariant, tileIndex?: number) => {
    const isMediumUrdu = config.medium === 'urdu';

    return (
      <div 
        key={`tile_${variant.variantIndex}_${tileIndex ?? 0}`} 
        className={`mini-paper ${isMediumUrdu ? 'font-urdu' : ''}`}
        dir={isMediumUrdu ? 'rtl' : 'ltr'}
      >
        {/* Compact Space-Efficient Header */}
        {renderHeader(variant)}

        {/* Question Sections */}
        <div className="space-y-2.5 flex-1 overflow-hidden">
          {variant.groups.map((group, gIdx) => {
            return (
              <div key={gIdx} className="space-y-1.5">
                {group.section && (
                  <div className="text-[11px] font-bold uppercase tracking-wider border-b border-black pb-0.5 text-slate-900 break-after-avoid leading-tight">
                    {group.section}
                  </div>
                )}

                <ol className="space-y-1.5 list-none p-0 m-0">
                  {group.questions.map((q, qIdx) => {
                    // Compute absolute question number across groups
                    let overallNum = 1;
                    for (let prev = 0; prev < gIdx; prev++) {
                      overallNum += variant.groups[prev].questions.length;
                    }
                    overallNum += qIdx;

                    const isUrduQ = isRTL(q.text) || q.medium === 'Urdu';
                    const letters = isUrduQ ? URDU_LETTERS : LATIN_LETTERS;
                    const colClass = 
                      config.mcqCols === 1 ? 'grid-cols-1' :
                      config.mcqCols === 3 ? 'grid-cols-3' :
                      config.mcqCols === 4 ? 'grid-cols-4' : 'grid-cols-2';

                    return (
                      <li key={q.id} dir={isUrduQ ? 'rtl' : 'ltr'} className="break-inside-avoid">
                        <div className="flex items-start gap-1">
                          <span className="font-bold shrink-0 select-none opacity-90" dir="ltr">
                            Q{overallNum}.
                          </span>
                          <span className={`flex-1 text-slate-950 font-medium ${isUrduQ ? 'font-urdu' : ''}`}>
                            {q.text}
                          </span>
                          {config.showMarks && (
                            <span className="font-semibold text-[0.85em] text-slate-700 shrink-0 ml-1 opacity-80" dir="ltr">
                              [{q.marks || 1}]
                            </span>
                          )}
                        </div>

                        {/* MCQ Options */}
                        {q.type === 'mcq' && q.options && q.options.length > 0 && (
                          <div 
                            className={`grid ${colClass} gap-x-3 gap-y-0.5 mt-0.5 pl-3 rtl:pl-0 rtl:pr-3 text-[0.92em] text-slate-800`}
                          >
                            {q.options.map((opt, oIdx) => (
                              <div key={oIdx} className="flex items-baseline gap-1">
                                <span className="font-bold text-[0.9em] shrink-0 text-slate-900" dir="ltr">
                                  ({letters[oIdx]})
                                </span>
                                <span className={isUrduQ ? 'font-urdu' : ''}>{opt}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ol>
              </div>
            );
          })}
        </div>

        {/* Footer cut mark indicator for 2-up or 4-up */}
        {config.perSheet > 1 && (
          <div className="mt-auto pt-1 text-[8.5px] text-slate-400 flex items-center justify-between border-t border-slate-200">
            <span>{config.school || 'Test Paper'}</span>
            <span>{variant.label || `Paper ${tileIndex ? tileIndex + 1 : 1}`}</span>
          </div>
        )}
      </div>
    );
  };

  // Group tiles into sheets
  const sheets: { tiles: PreparedVariant[]; sheetIndex: number }[] = [];
  const V = variants.length;
  const per = config.perSheet;

  for (let s = 0; s < masterSheetCount; s++) {
    const tiles: PreparedVariant[] = [];
    for (let slot = 0; slot < per; slot++) {
      const vIdx = (s * per + slot) % V;
      tiles.push(variants[vIdx]);
    }
    sheets.push({ tiles, sheetIndex: s });
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Sticky Toolbar with Auto-Fit and Space Controls */}
      <div className="no-print sticky top-3 z-40 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-lg p-3 max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left Tools */}
        <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto">
          <button
            onClick={onBackToBuild}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Build</span>
          </button>

          <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>

          {/* Header Density Dropdown */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium">Header:</span>
            <select
              value={headerDensity}
              onChange={e => setHeaderDensity(e.target.value as any)}
              className="px-2 py-1 text-xs border border-slate-200 rounded-md bg-white font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="compact">Compact (Space-Saving)</option>
              <option value="minimal">Minimal (1-Line Ultra)</option>
              <option value="standard">Standard</option>
            </select>
          </div>

          <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>

          {/* Font Auto-Fit & Manual Controls */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg text-xs">
            <button
              onClick={handleResetToAuto}
              title="Recalculate font size to fit page"
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                autoFitEnabled 
                  ? 'bg-indigo-600 text-white shadow-2xs' 
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>Auto-Fit</span>
            </button>

            {/* Manual Nudge */}
            <div className="flex items-center gap-1 ml-1 pl-1 border-l border-slate-200">
              <button
                onClick={() => handleManualFontAdjust(-0.4)}
                title="Decrease font size"
                className="w-5 h-5 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-200 rounded cursor-pointer text-xs"
              >
                A-
              </button>
              <span className="font-mono text-[11px] font-semibold text-slate-800 min-w-8 text-center">
                {appliedFontSize}px
              </span>
              <button
                onClick={() => handleManualFontAdjust(0.4)}
                title="Increase font size"
                className="w-5 h-5 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-200 rounded cursor-pointer text-xs"
              >
                A+
              </button>
            </div>
          </div>
        </div>

        {/* Center / Right Tools: Fit Status & Print */}
        <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto">
          {/* Fit Status Badge */}
          <div className="flex items-center gap-1.5 text-xs truncate">
            {fitStatus.fits ? (
              <span className="flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 text-[11px] truncate">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">{fitStatus.message}</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-700 font-semibold bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 text-[11px] truncate">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="truncate">{fitStatus.message}</span>
              </span>
            )}
          </div>

          {/* Zoom controls */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
            <button
              onClick={() => setZoomLevel(Math.max(50, zoomLevel - 15))}
              className="p-1 hover:bg-white rounded text-slate-600 cursor-pointer"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 font-mono text-[11px] text-slate-700 min-w-8 text-center">
              {zoomLevel}%
            </span>
            <button
              onClick={() => setZoomLevel(Math.min(150, zoomLevel + 15))}
              className="p-1 hover:bg-white rounded text-slate-600 cursor-pointer"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all shadow-md shadow-indigo-600/20 cursor-pointer shrink-0"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* Sheets Container */}
      <div 
        ref={paperContainerRef}
        style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
        className="transition-transform duration-150 ease-out origin-top"
      >
        {/* Render test sheets */}
        {sheets.map((sheet, sIdx) => {
          return (
            <div key={sIdx} className="sheet-frame">
              {/* Scissors cutting guide indicator for multi-up */}
              {config.perSheet > 1 && (
                <div className="no-print absolute top-1 right-2 flex items-center gap-1 text-[9px] text-slate-400">
                  <Scissors className="w-3 h-3" />
                  <span>Cut sheet after printing ({config.perSheet} tests per page)</span>
                </div>
              )}

              <div 
                className="sheet" 
                data-per={config.perSheet} 
                data-arr={config.arrangement}
              >
                {sheet.tiles.map((tile, tIdx) => renderSinglePaper(tile, tIdx))}
              </div>
            </div>
          );
        })}

        {/* Answer Key Sheet */}
        {config.includeKey && (
          <div className="sheet-frame">
            <div className="mini-paper is-key">
              <div className="border-b-2 border-black pb-1.5 mb-3 text-center">
                <div className="text-sm font-extrabold tracking-tight uppercase">
                  {getTranslation('answerKey', config.medium)}
                </div>
                <div className="text-[11px] text-slate-600 mt-0.5">
                  {config.school} · {config.title} · {config.subject}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {variants.map(v => (
                  <div key={v.variantIndex} className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div className="font-bold text-[11px] text-indigo-700 uppercase tracking-wider mb-2 pb-1 border-b border-slate-300">
                      {v.label || 'Standard Key'}
                    </div>

                    <div className="space-y-1">
                      {v.keys.map((k, kIdx) => (
                        <div key={kIdx} className="flex items-start gap-1.5 text-[11px] py-0.5 border-b border-slate-100">
                          <span className="font-bold text-slate-800 w-5 shrink-0" dir="ltr">{k.num}.</span>
                          <span className={`text-slate-900 ${k.isRtl ? 'font-urdu' : ''}`} dir={k.isRtl ? 'rtl' : 'ltr'}>
                            {k.answer}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
