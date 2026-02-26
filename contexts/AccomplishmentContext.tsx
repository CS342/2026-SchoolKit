import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import {
  CHAPTERS,
  CHAPTER_BY_ID,
  PIECES_BY_EVENT,
  PieceDefinition,
  PieceEvent,
  RESOURCES_10PCT_THRESHOLD,
  RESOURCES_50PCT_THRESHOLD,
  RESOURCES_100PCT_THRESHOLD,
} from '../constants/accomplishments';
import { useOnboarding } from './OnboardingContext';
import { useStories } from './StoriesContext';

const STORAGE_KEY = '@schoolkit_accomplishments';

interface PersistedState {
  earnedPieceIds: string[];
  visibleChapterIds: string[];
  openedResourceIds: string[];
  scrolledToEndIds: string[];
  visitedTabNames: string[];
  earnedAt: Record<string, number>;
}

interface AccomplishmentContextType {
  earnedPieceIds: Set<string>;
  visibleChapterIds: Set<string>;
  openedResourceIds: Set<string>;
  revealingPiece: PieceDefinition | null;
  earnedAt: Record<string, number>;
  isEarned: (pieceId: string) => boolean;
  isChapterVisible: (chapterId: string) => boolean;
  isChapterComplete: (chapterId: string) => boolean;
  isResourceFullyViewed: (id: string) => boolean;
  fireEvent: (event: PieceEvent) => void;
  fireResourceOpened: (resourceId: string) => void;
  fireResourceScrolledToEnd: (resourceId: string) => void;
  fireTabVisited: (tabName: string) => void;
  dismissReveal: () => void;
}

const AccomplishmentContext = createContext<AccomplishmentContextType | undefined>(undefined);

export function AccomplishmentProvider({ children }: { children: ReactNode }) {
  // ── Refs for synchronous idempotency checks (avoids stale closure issues) ──
  const earnedPieceIdsRef = useRef<Set<string>>(new Set());
  const visibleChapterIdsRef = useRef<Set<string>>(new Set());
  const openedResourceIdsRef = useRef<Set<string>>(new Set());
  const scrolledToEndIdsRef = useRef<Set<string>>(new Set());
  const visitedTabNamesRef = useRef<Set<string>>(new Set());
  const earnedAtRef = useRef<Record<string, number>>({});
  const toastQueue = useRef<PieceDefinition[]>([]);
  const isShowingToast = useRef(false);
  const persistTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // ── State for re-rendering ───────────────────────────────────────────────
  const [earnedPieceIds, setEarnedPieceIds] = useState<Set<string>>(new Set());
  const [visibleChapterIds, setVisibleChapterIds] = useState<Set<string>>(new Set());
  const [openedResourceIds, setOpenedResourceIds] = useState<Set<string>>(new Set());
  const [revealingPiece, setRevealingPiece] = useState<PieceDefinition | null>(null);
  const [earnedAt, setEarnedAt] = useState<Record<string, number>>({});
  const [isHydrated, setIsHydrated] = useState(false);

  // ── Contexts we observe (no coupling back into OnboardingContext) ─────────
  const { data: onboardingData, bookmarks, downloads } = useOnboarding();
  const { storyBookmarks } = useStories();

  // ── Persistence ──────────────────────────────────────────────────────────
  const persistState = useCallback(() => {
    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(() => {
      const toSave: PersistedState = {
        earnedPieceIds: [...earnedPieceIdsRef.current],
        visibleChapterIds: [...visibleChapterIdsRef.current],
        openedResourceIds: [...openedResourceIdsRef.current],
        scrolledToEndIds: [...scrolledToEndIdsRef.current],
        visitedTabNames: [...visitedTabNamesRef.current],
        earnedAt: earnedAtRef.current,
      };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave)).catch(e => {
        console.warn('[Accomplishments] Failed to persist:', e);
      });
    }, 50);
  }, []);

  // ── Hydrate from AsyncStorage on mount ───────────────────────────────────
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => {
        if (raw) {
          try {
            const saved: PersistedState = JSON.parse(raw);
            const earned = new Set(saved.earnedPieceIds ?? []);
            const visible = new Set(saved.visibleChapterIds ?? []);
            const opened = new Set(saved.openedResourceIds ?? []);
            const scrolledToEnd = new Set(saved.scrolledToEndIds ?? []);
            const visited = new Set(saved.visitedTabNames ?? []);
            const at = saved.earnedAt ?? {};

            earnedPieceIdsRef.current = earned;
            visibleChapterIdsRef.current = visible;
            openedResourceIdsRef.current = opened;
            scrolledToEndIdsRef.current = scrolledToEnd;
            visitedTabNamesRef.current = visited;
            earnedAtRef.current = at;

            setEarnedPieceIds(earned);
            setVisibleChapterIds(visible);
            setOpenedResourceIds(opened);
            setEarnedAt(at);
          } catch (e) {
            console.warn('[Accomplishments] Failed to parse persisted state:', e);
          }
        }
      })
      .finally(() => setIsHydrated(true));
  }, []);

  // ── Toast queue management ───────────────────────────────────────────────
  const showNextToast = useCallback(() => {
    if (toastQueue.current.length === 0) {
      isShowingToast.current = false;
      setRevealingPiece(null);
      return;
    }
    isShowingToast.current = true;
    const next = toastQueue.current.shift()!;
    setRevealingPiece(next);
  }, []);

  const dismissReveal = useCallback(() => {
    setRevealingPiece(null);
    setTimeout(() => {
      showNextToast();
    }, 350);
  }, [showNextToast]);

  // ── Core event firing ────────────────────────────────────────────────────
  const fireEvent = useCallback((event: PieceEvent) => {
    const pieces = PIECES_BY_EVENT[event] ?? [];
    const newlyEarned: PieceDefinition[] = [];

    for (const piece of pieces) {
      if (earnedPieceIdsRef.current.has(piece.id)) continue;
      earnedPieceIdsRef.current.add(piece.id);
      visibleChapterIdsRef.current.add(piece.chapterId);
      earnedAtRef.current[piece.id] = Date.now();
      newlyEarned.push(piece);
    }

    if (newlyEarned.length === 0) return;

    // Update render state
    setEarnedPieceIds(new Set(earnedPieceIdsRef.current));
    setVisibleChapterIds(new Set(visibleChapterIdsRef.current));
    setEarnedAt({ ...earnedAtRef.current });

    // Queue toast reveals
    toastQueue.current.push(...newlyEarned);
    if (!isShowingToast.current) {
      showNextToast();
    }

    // Haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    persistState();
  }, [showNextToast, persistState]);

  // ── Resource scroll-to-end tracking ─────────────────────────────────────
  const fireResourceScrolledToEnd = useCallback((resourceId: string) => {
    if (!scrolledToEndIdsRef.current.has(resourceId)) {
      scrolledToEndIdsRef.current.add(resourceId);
      persistState();
    }
  }, [persistState]);

  // ── Resource opened tracking (unique resource IDs) ───────────────────────
  const fireResourceOpened = useCallback((resourceId: string) => {
    const alreadyOpened = openedResourceIdsRef.current.has(resourceId);

    if (!alreadyOpened) {
      openedResourceIdsRef.current.add(resourceId);
      setOpenedResourceIds(new Set(openedResourceIdsRef.current));
      persistState();
    }

    // Always fire generic resource_read_30s (idempotent — only unlocks piece once)
    fireEvent('resource_read_30s');

    // Check percentage thresholds
    const size = openedResourceIdsRef.current.size;
    if (size >= RESOURCES_10PCT_THRESHOLD) fireEvent('resources_10pct');
    if (size >= RESOURCES_50PCT_THRESHOLD) fireEvent('resources_50pct');
    if (size >= RESOURCES_100PCT_THRESHOLD) fireEvent('resources_100pct');
  }, [fireEvent, persistState]);

  // ── Tab visit tracking ───────────────────────────────────────────────────
  const fireTabVisited = useCallback((tabName: string) => {
    // profile_tab_visited fires on first profile tab visit (idempotent internally)
    if (tabName === 'profile') {
      fireEvent('profile_tab_visited');
    }

    // Track unique tabs for all_tabs_visited
    if (!visitedTabNamesRef.current.has(tabName)) {
      visitedTabNamesRef.current.add(tabName);
      persistState();

      if (visitedTabNamesRef.current.size >= 5) {
        fireEvent('all_tabs_visited');
      }
    }
  }, [fireEvent, persistState]);

  // ── Watch-based milestone detection (reads from parent contexts) ──────────
  // These only run after hydration to avoid false re-triggers on initial load
  useEffect(() => {
    if (!isHydrated) return;
    if (onboardingData.isCompleted) fireEvent('onboarding_complete');
  }, [isHydrated, onboardingData.isCompleted]);

  useEffect(() => {
    if (!isHydrated) return;
    if (bookmarks.length >= 5) fireEvent('resources_5_bookmarked');
  }, [isHydrated, bookmarks.length]);

  useEffect(() => {
    if (!isHydrated) return;
    if (downloads.length >= 3) fireEvent('resources_3_downloaded');
  }, [isHydrated, downloads.length]);

  useEffect(() => {
    if (!isHydrated) return;
    if (storyBookmarks.length >= 3) fireEvent('stories_3_bookmarked');
  }, [isHydrated, storyBookmarks.length]);

  // ── Computed helpers ─────────────────────────────────────────────────────
  const isEarned = useCallback((pieceId: string) =>
    earnedPieceIdsRef.current.has(pieceId), []);

  const isChapterVisible = useCallback((chapterId: string) =>
    visibleChapterIdsRef.current.has(chapterId), []);

  const isChapterComplete = useCallback((chapterId: string) => {
    const chapter = CHAPTER_BY_ID[chapterId];
    if (!chapter) return false;
    return chapter.pieces.every(p => earnedPieceIdsRef.current.has(p.id));
  }, []);

  const isResourceFullyViewed = useCallback((id: string) =>
    openedResourceIdsRef.current.has(id) && scrolledToEndIdsRef.current.has(id), []);

  const value: AccomplishmentContextType = {
    earnedPieceIds,
    visibleChapterIds,
    openedResourceIds,
    revealingPiece,
    earnedAt,
    isEarned,
    isChapterVisible,
    isChapterComplete,
    isResourceFullyViewed,
    fireEvent,
    fireResourceOpened,
    fireResourceScrolledToEnd,
    fireTabVisited,
    dismissReveal,
  };

  return (
    <AccomplishmentContext.Provider value={value}>
      {children}
    </AccomplishmentContext.Provider>
  );
}

export function useAccomplishments() {
  const context = useContext(AccomplishmentContext);
  if (context === undefined) {
    throw new Error('useAccomplishments must be used within an AccomplishmentProvider');
  }
  return context;
}
