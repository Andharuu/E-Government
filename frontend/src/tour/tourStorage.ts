/**
 * Penyimpanan State Tur Onboarding GovConnect
 * Menggunakan localStorage dengan prefix resmi govconnect_
 */

export type TourSectionId = 'dashboard' | 'profile' | 'templates' | 'activity' | 'settings';

export interface TourState {
  version: number;
  hasSeenWelcome: boolean;
  completedSections: TourSectionId[];
  dismissedSections: TourSectionId[];
  lastActiveSection: TourSectionId | null;
  lastCompletedAt: string | null;
}

const TOUR_STORAGE_KEY = 'govconnect_tour_state';
const CURRENT_TOUR_VERSION = 3;

const DEFAULT_TOUR_STATE: TourState = {
  version: CURRENT_TOUR_VERSION,
  hasSeenWelcome: false,
  completedSections: [],
  dismissedSections: [],
  lastActiveSection: null,
  lastCompletedAt: null,
};

export function loadTourState(): TourState {
  if (typeof window === 'undefined') return DEFAULT_TOUR_STATE;
  try {
    const raw = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!raw) return DEFAULT_TOUR_STATE;
    const parsed = JSON.parse(raw);
    if (parsed.version !== CURRENT_TOUR_VERSION) {
      // Migrasi versi jika versi berubah
      return {
        ...DEFAULT_TOUR_STATE,
        hasSeenWelcome: parsed.hasSeenWelcome || false,
      };
    }
    return {
      ...DEFAULT_TOUR_STATE,
      ...parsed,
      completedSections: Array.isArray(parsed.completedSections) ? parsed.completedSections : [],
      dismissedSections: Array.isArray(parsed.dismissedSections) ? parsed.dismissedSections : [],
    };
  } catch {
    return DEFAULT_TOUR_STATE;
  }
}

export function saveTourState(state: TourState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('GovConnect Tour: Gagal menyimpan state ke localStorage', e);
  }
}

export function isSectionCompleted(section: TourSectionId): boolean {
  const state = loadTourState();
  return state.completedSections.includes(section);
}

export function markSectionCompleted(section: TourSectionId): void {
  const state = loadTourState();
  if (!state.completedSections.includes(section)) {
    state.completedSections.push(section);
  }
  state.lastActiveSection = section;
  state.lastCompletedAt = new Date().toISOString();
  saveTourState(state);
}

export function markSectionDismissed(section: TourSectionId): void {
  const state = loadTourState();
  if (!state.dismissedSections.includes(section)) {
    state.dismissedSections.push(section);
  }
  saveTourState(state);
}

export function resetAllTourProgress(): void {
  const state = {
    ...DEFAULT_TOUR_STATE,
    version: CURRENT_TOUR_VERSION,
  };
  saveTourState(state);
}

export function clearAllTourData(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(TOUR_STORAGE_KEY);
  } catch {}
}
