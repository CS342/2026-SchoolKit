import { useCallback, useMemo } from 'react';
import { useOnboarding } from '../contexts/OnboardingContext';
import { isVisibleTo, type Audience, type AudienceViewer } from '../features/content/audience';
import { ALL_RESOURCE_IDS, SHOW_HARDCODED_RESOURCES, HIDDEN_RESOURCE_TITLES } from '../constants/resources';

const HARDCODED_IDS = new Set(ALL_RESOURCE_IDS);

/**
 * Predicate for "should the current viewer see this in a list?", based on their role
 * and grade from onboarding, plus the temporary SHOW_HARDCODED_RESOURCES switch and
 * HIDDEN_RESOURCE_TITLES list. Use it for lists only — direct links, bookmarks and
 * downloads always open.
 */
/** The current viewer's role and grade, for picking topic versions (features/content/versions.ts). */
export function useAudienceViewer(): AudienceViewer {
  const { data } = useOnboarding();
  const { role, gradeLevel } = data;
  return useMemo(() => ({ role, gradeLevel }), [role, gradeLevel]);
}

type Listable = { id: string; title: string; audience?: Audience; fromContentPage?: boolean };

/** Whether a resource may appear in lists at all, for anyone (the audience-free part of
 *  useAudienceFilter). Editor pickers and the AI's guide index use this. */
export function isListable(item: Listable): boolean {
  // A built-in id backed by a published editor page is that page, not a built-in.
  return (SHOW_HARDCODED_RESOURCES || !HARDCODED_IDS.has(item.id) || !!item.fromContentPage) &&
    !HIDDEN_RESOURCE_TITLES.has(item.title.toLowerCase());
}

export function useAudienceFilter(): (item: Listable) => boolean {
  const { data } = useOnboarding();
  const { role, gradeLevel } = data;
  return useCallback(
    (item) => isListable(item) && isVisibleTo(item.audience, { role, gradeLevel }),
    [role, gradeLevel],
  );
}
