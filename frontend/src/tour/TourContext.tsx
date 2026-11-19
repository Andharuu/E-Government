import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { useLocation } from 'react-router-dom';
import {
  type TourSectionId,
  loadTourState,
  markSectionCompleted,
  markSectionDismissed,
  resetAllTourProgress,
  clearAllTourData,
} from './tourStorage';
import { TOUR_STEPS_BY_SECTION, type TourStep } from './TourSteps';

interface TourContextType {
  isActive: boolean;
  activeSection: TourSectionId | null;
  currentStepIndex: number;
  currentStep: TourStep | null;
  totalSteps: number;
  startTour: (section?: TourSectionId) => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  resetTour: () => void;
  clearTourData: () => void;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

const ROUTE_SECTION_MAP: Record<string, TourSectionId> = {
  '/dashboard': 'dashboard',
  '/profile': 'profile',
  '/templates': 'templates',
  '/activity': 'activity',
  '/settings': 'settings',
};

export function TourProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [isActive, setIsActive] = useState(false);
  const [activeSection, setActiveSection] = useState<TourSectionId | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const autoTriggerTimerRef = useRef<number | null>(null);

  // Helper untuk mendapatkan section berdasarkan pathname
  const getCurrentRouteSection = useCallback((): TourSectionId | null => {
    const path = location.pathname;
    for (const [route, sec] of Object.entries(ROUTE_SECTION_MAP)) {
      if (path === route || path.startsWith(`${route}/`)) {
        return sec;
      }
    }
    return null;
  }, [location.pathname]);

  const activeSteps: TourStep[] = activeSection ? TOUR_STEPS_BY_SECTION[activeSection] || [] : [];
  const currentStep: TourStep | null =
    isActive && activeSteps.length > 0 && currentStepIndex < activeSteps.length
      ? activeSteps[currentStepIndex]
      : null;

  // Start tour manually or programmatically
  const startTour = useCallback(
    (targetSection?: TourSectionId) => {
      if (autoTriggerTimerRef.current) {
        window.clearTimeout(autoTriggerTimerRef.current);
        autoTriggerTimerRef.current = null;
      }

      const sec = targetSection || getCurrentRouteSection() || 'dashboard';
      const steps = TOUR_STEPS_BY_SECTION[sec] || [];
      if (steps.length === 0) return;

      setActiveSection(sec);
      setCurrentStepIndex(0);
      setIsActive(true);
    },
    [getCurrentRouteSection]
  );

  const nextStep = useCallback(() => {
    if (!activeSection) return;
    const steps = TOUR_STEPS_BY_SECTION[activeSection] || [];
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      // Selesai seluruh langkah di bagian ini
      markSectionCompleted(activeSection);
      setIsActive(false);
      setActiveSection(null);
      setCurrentStepIndex(0);
    }
  }, [activeSection, currentStepIndex]);

  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  }, [currentStepIndex]);

  const skipTour = useCallback(() => {
    if (activeSection) {
      markSectionDismissed(activeSection);
    }
    setIsActive(false);
    setActiveSection(null);
    setCurrentStepIndex(0);
  }, [activeSection]);

  const resetTour = useCallback(() => {
    resetAllTourProgress();
    setIsActive(false);
    setActiveSection(null);
    setCurrentStepIndex(0);
    // Langsung trigger tour untuk halaman saat ini
    const sec = getCurrentRouteSection() || 'dashboard';
    startTour(sec);
  }, [getCurrentRouteSection, startTour]);

  const handleClearTourData = useCallback(() => {
    clearAllTourData();
    setIsActive(false);
    setActiveSection(null);
    setCurrentStepIndex(0);
  }, []);

  // KONTEKSTUAL AUTO-TRIGGER DENGAN DELAY (User Request #5):
  // - 10 Detik untuk pengguna baru di Dasbor (/dashboard)
  // - 2.5 Detik untuk pengguna yang pertama kali tiba di sub-halaman lain (/profile, /templates, dll.)
  useEffect(() => {
    if (autoTriggerTimerRef.current) {
      window.clearTimeout(autoTriggerTimerRef.current);
      autoTriggerTimerRef.current = null;
    }

    // Jika tour sedang aktif, jangan ganggu
    if (isActive) return;

    const sec = getCurrentRouteSection();
    if (!sec) return;

    const state = loadTourState();
    const hasCompleted = state.completedSections.includes(sec);
    const hasDismissed = state.dismissedSections.includes(sec);

    // Jika sudah selesai atau pernah di-skip di bagian ini, abaikan
    if (hasCompleted || hasDismissed) return;

    // Tentukan delay: 10 detik untuk Dasbor (pengguna baru adaptasi), 2.5s untuk sub-halaman
    const delayMs = sec === 'dashboard' ? 10000 : 2500;

    autoTriggerTimerRef.current = window.setTimeout(() => {
      startTour(sec);
    }, delayMs);

    return () => {
      if (autoTriggerTimerRef.current) {
        window.clearTimeout(autoTriggerTimerRef.current);
        autoTriggerTimerRef.current = null;
      }
    };
  }, [location.pathname, isActive, getCurrentRouteSection, startTour]);

  return (
    <TourContext.Provider
      value={{
        isActive,
        activeSection,
        currentStepIndex,
        currentStep,
        totalSteps: activeSteps.length,
        startTour,
        nextStep,
        prevStep,
        skipTour,
        resetTour,
        clearTourData: handleClearTourData,
      }}
    >
      {children}
    </TourContext.Provider>
  );
}

export function useTour() {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour harus digunakan di dalam TourProvider');
  }
  return context;
}
