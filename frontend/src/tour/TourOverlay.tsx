import { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTour } from './TourContext';
import { useTourTarget } from './useTourTarget';
import { FontAwesome } from '../components/ui';

const TOOLTIP_WIDTH = 420;
const ESTIMATED_TOOLTIP_HEIGHT = 330;
const EDGE_MARGIN = 16;
const GAP_TARGET = 14;

export function TourOverlay() {
  const {
    isActive,
    currentStep,
    currentStepIndex,
    totalSteps,
    activeSection,
    nextStep,
    prevStep,
    skipTour,
  } = useTour();

  const tooltipRef = useRef<HTMLDivElement>(null);
  const [actualTooltipHeight, setActualTooltipHeight] = useState(ESTIMATED_TOOLTIP_HEIGHT);

  const { rect: targetRect, isReady } = useTourTarget(
    currentStep?.target,
    currentStep?.spotlightPadding ?? 8
  );

  // Measure actual height of tooltip dynamically whenever step changes
  useLayoutEffect(() => {
    if (tooltipRef.current) {
      const h = tooltipRef.current.offsetHeight;
      if (h > 0) {
        setActualTooltipHeight(h);
      }
    }
  }, [currentStep, currentStepIndex]);

  // Keyboard navigation: Escape to skip, ArrowRight to next, ArrowLeft to prev
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        skipTour();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextStep();
      } else if (e.key === 'ArrowLeft' && currentStepIndex > 0) {
        e.preventDefault();
        prevStep();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, nextStep, prevStep, skipTour, currentStepIndex]);

  if (!isActive || !currentStep) return null;

  // Responsive tooltip width (clamped on small screens)
  const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
  const tooltipWidth = Math.min(TOOLTIP_WIDTH, windowWidth - EDGE_MARGIN * 2);
  const tooltipHeight = actualTooltipHeight;

  // VIEWPORT-AWARE CLAMPING & POSITIONING (Solves cutoff bug)
  let calculatedLeft = (windowWidth - tooltipWidth) / 2;
  let calculatedTop = (windowHeight - tooltipHeight) / 2;

  if (targetRect && currentStep.placement !== 'center') {
    let placement = currentStep.placement;

    // 1. Initial preferred calculation based on requested placement
    if (placement === 'bottom') {
      calculatedTop = targetRect.bottom + GAP_TARGET;
      calculatedLeft = targetRect.left + (targetRect.width - tooltipWidth) / 2;

      // Flip to top if overflow at bottom
      if (calculatedTop + tooltipHeight > windowHeight - EDGE_MARGIN) {
        const topCandidate = targetRect.top - tooltipHeight - GAP_TARGET;
        const spaceAbove = targetRect.top;
        const spaceBelow = windowHeight - targetRect.bottom;
        if (topCandidate >= EDGE_MARGIN || spaceAbove > spaceBelow) {
          calculatedTop = topCandidate;
          placement = 'top';
        }
      }
    } else if (placement === 'top') {
      calculatedTop = targetRect.top - tooltipHeight - GAP_TARGET;
      calculatedLeft = targetRect.left + (targetRect.width - tooltipWidth) / 2;

      // Flip to bottom if overflow at top
      if (calculatedTop < EDGE_MARGIN) {
        const bottomCandidate = targetRect.bottom + GAP_TARGET;
        const spaceAbove = targetRect.top;
        const spaceBelow = windowHeight - targetRect.bottom;
        if (bottomCandidate + tooltipHeight <= windowHeight - EDGE_MARGIN || spaceBelow > spaceAbove) {
          calculatedTop = bottomCandidate;
          placement = 'bottom';
        }
      }
    } else if (placement === 'left') {
      calculatedLeft = targetRect.left - tooltipWidth - GAP_TARGET;
      calculatedTop = targetRect.top + (targetRect.height - tooltipHeight) / 2;

      // Flip to right or bottom if overflow at left
      if (calculatedLeft < EDGE_MARGIN) {
        const rightCandidate = targetRect.right + GAP_TARGET;
        if (rightCandidate + tooltipWidth <= windowWidth - EDGE_MARGIN) {
          calculatedLeft = rightCandidate;
          placement = 'right';
        } else {
          // Fallback to bottom if neither fits horizontally
          calculatedTop = targetRect.bottom + GAP_TARGET;
          calculatedLeft = (windowWidth - tooltipWidth) / 2;
          placement = 'bottom';
        }
      }
    } else if (placement === 'right') {
      calculatedLeft = targetRect.right + GAP_TARGET;
      calculatedTop = targetRect.top + (targetRect.height - tooltipHeight) / 2;

      // Flip to left or bottom if overflow at right
      if (calculatedLeft + tooltipWidth > windowWidth - EDGE_MARGIN) {
        const leftCandidate = targetRect.left - tooltipWidth - GAP_TARGET;
        if (leftCandidate >= EDGE_MARGIN) {
          calculatedLeft = leftCandidate;
          placement = 'left';
        } else {
          calculatedTop = targetRect.bottom + GAP_TARGET;
          calculatedLeft = (windowWidth - tooltipWidth) / 2;
          placement = 'bottom';
        }
      }
    }

    // 2. ABSOLUTE VIEWPORT BOUNDS CLAMPING (Hard clamp to guarantee 0px cut-off)
    const minLeft = EDGE_MARGIN;
    const maxLeft = Math.max(EDGE_MARGIN, windowWidth - tooltipWidth - EDGE_MARGIN);
    calculatedLeft = Math.max(minLeft, Math.min(calculatedLeft, maxLeft));

    const minTop = EDGE_MARGIN;
    const maxTop = Math.max(EDGE_MARGIN, windowHeight - tooltipHeight - EDGE_MARGIN);
    calculatedTop = Math.max(minTop, Math.min(calculatedTop, maxTop));
  } else {
    // Modal center fallback
    calculatedLeft = Math.max(EDGE_MARGIN, (windowWidth - tooltipWidth) / 2);
    calculatedTop = Math.max(EDGE_MARGIN, (windowHeight - tooltipHeight) / 2);
  }

  const sectionTitles: Record<string, string> = {
    dashboard: 'DASBOR',
    profile: 'PROFIL',
    templates: 'GRUP LAYANAN',
    activity: 'RIWAYAT AKTIVITAS',
    settings: 'PENGATURAN',
  };

  const isLastStep = currentStepIndex === totalSteps - 1;

  const content = (
    <div
      className="fixed inset-0 z-[999999] pointer-events-auto select-none font-sans"
      style={{ overflow: 'hidden' }}
      aria-modal="true"
      role="dialog"
      aria-label={currentStep.title}
    >
      {/* 4 Backdrop Dark Panels around spotlight target (or single full overlay) */}
      {targetRect && isReady ? (
        <>
          {/* Top backdrop */}
          <div
            className="fixed top-0 left-0 right-0 bg-slate-950/75 backdrop-blur-[2px] transition-all duration-300"
            style={{ height: `${targetRect.top}px` }}
            onClick={skipTour}
          />
          {/* Bottom backdrop */}
          <div
            className="fixed left-0 right-0 bottom-0 bg-slate-950/75 backdrop-blur-[2px] transition-all duration-300"
            style={{ top: `${targetRect.bottom}px` }}
            onClick={skipTour}
          />
          {/* Left backdrop */}
          <div
            className="fixed bg-slate-950/75 backdrop-blur-[2px] transition-all duration-300"
            style={{
              top: `${targetRect.top}px`,
              left: 0,
              width: `${targetRect.left}px`,
              height: `${targetRect.height}px`,
            }}
            onClick={skipTour}
          />
          {/* Right backdrop */}
          <div
            className="fixed right-0 bg-slate-950/75 backdrop-blur-[2px] transition-all duration-300"
            style={{
              top: `${targetRect.top}px`,
              left: `${targetRect.right}px`,
              height: `${targetRect.height}px`,
            }}
            onClick={skipTour}
          />

          {/* Spotlight Highlight Ring */}
          <div
            className="fixed pointer-events-none rounded-xl transition-all duration-300 z-10"
            style={{
              top: `${targetRect.top}px`,
              left: `${targetRect.left}px`,
              width: `${targetRect.width}px`,
              height: `${targetRect.height}px`,
              boxShadow: '0 0 0 3px #7BBDE8, 0 0 24px rgba(123, 189, 232, 0.45)',
            }}
          />
        </>
      ) : (
        /* Full Backdrop for modal steps */
        <div
          className="fixed inset-0 bg-slate-950/75 backdrop-blur-[3px] transition-opacity duration-300"
          onClick={skipTour}
        />
      )}

      {/* TOOLTIP CARD (Viewport-Clamped & Responsive) */}
      <div
        ref={tooltipRef}
        className="fixed z-20 transition-all duration-300 ease-out"
        style={{
          top: `${calculatedTop}px`,
          left: `${calculatedLeft}px`,
          width: `${tooltipWidth}px`,
          maxHeight: `calc(100vh - ${EDGE_MARGIN * 2}px)`,
        }}
      >
        <div className="relative rounded-2xl bg-[#111927] border border-[#243550] shadow-2xl p-6 text-slate-100 flex flex-col gap-4 overflow-y-auto max-h-[calc(100vh-32px)]">
          {/* Subtle top ambient glow */}
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-[#7BBDE8]/10 rounded-full blur-2xl pointer-events-none" />

          {/* Header Row: Step counter pill + Progress Dots + Close Button */}
          <div className="flex items-center justify-between gap-2 border-b border-[#1E2B40] pb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#1C2C45] text-[#7BBDE8] border border-[#2D4568]">
                <FontAwesome name="check-circle" className="text-[10px]" />
                <span>
                  {activeSection ? `${sectionTitles[activeSection] || 'TUR'} • ` : ''}
                  LANGKAH {currentStepIndex + 1} DARI {totalSteps}
                </span>
              </span>

              {/* Micro-dots progress indicator */}
              <div className="flex items-center gap-1 ml-1">
                {Array.from({ length: totalSteps }).map((_, idx) => (
                  <span
                    key={idx}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      idx === currentStepIndex
                        ? 'w-4 bg-[#7BBDE8]'
                        : idx < currentStepIndex
                        ? 'w-1.5 bg-[#4E8EA2]'
                        : 'w-1.5 bg-[#243550]'
                    }`}
                  />
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={skipTour}
              aria-label="Tutup panduan"
              className="w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-[#1E2B40] flex items-center justify-center transition-colors cursor-pointer"
            >
              <FontAwesome name="xmark" className="text-xs" />
            </button>
          </div>

          {/* Title & Badge */}
          <div className="space-y-1">
            {currentStep.badge && (
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#6EA2B3]">
                {currentStep.badge}
              </span>
            )}
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span>{currentStep.title}</span>
              {currentStep.shortcut && (
                <kbd className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-[#1C2C45] text-[#93C5FD] border border-[#2D4568] rounded-md shadow-inner">
                  {currentStep.shortcut}
                </kbd>
              )}
            </h3>
          </div>

          {/* Body Description */}
          <p className="text-xs text-slate-300/90 leading-relaxed font-normal">
            {currentStep.body}
          </p>

          {/* Callout Smart Tip Box */}
          {currentStep.tip && (
            <div className="p-3 bg-[#0F1C2E] border border-[#223B5C] rounded-xl flex items-start gap-2.5 text-xs text-[#BDD8E9]">
              <FontAwesome name="lightbulb" className="text-[#7BBDE8] text-xs mt-0.5 shrink-0" />
              <div className="leading-tight">
                <span className="font-semibold text-white">Tips Cerdas: </span>
                <span className="text-slate-300">{currentStep.tip}</span>
              </div>
            </div>
          )}

          {/* Bottom Actions Row */}
          <div className="flex items-center justify-between gap-3 pt-2 mt-1 border-t border-[#1E2B40]">
            <button
              type="button"
              onClick={skipTour}
              className="text-xs font-medium text-slate-400 hover:text-white px-2 py-1.5 rounded-lg hover:bg-[#1C2638] transition-colors cursor-pointer"
            >
              Lewati Tur
            </button>

            <div className="flex items-center gap-2">
              {currentStepIndex > 0 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 bg-[#172235] hover:bg-[#202E46] border border-[#243550] transition-colors cursor-pointer"
                >
                  Kembali
                </button>
              )}

              <button
                type="button"
                onClick={nextStep}
                className="px-4 py-1.5 rounded-xl text-xs font-bold text-[#0A1628] bg-[#7BBDE8] hover:bg-[#99d1f3] shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <span>{isLastStep ? 'Selesai Tur' : 'Lanjut'}</span>
                <FontAwesome name={isLastStep ? 'check' : 'arrow-right'} className="text-[11px]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(content, document.body) : null;
}
