import { useCallback, useMemo } from 'react';
import { useOnboarding } from '../contexts/OnboardingContext';
import { isVisibleTo, toContentLanguage, type Audience, type AudienceViewer, type ContentLanguage } from '../features/content/audience';
import { ALL_RESOURCE_IDS, SHOW_HARDCODED_RESOURCES, HIDDEN_RESOURCE_TITLES } from '../constants/resources';

const HARDCODED_IDS = new Set(ALL_RESOURCE_IDS);

/**
 * Predicate for "should the current viewer see this in a list?", based on their role
 * and grade from onboarding, plus the temporary SHOW_HARDCODED_RESOURCES switch and
 * HIDDEN_RESOURCE_TITLES list. Use it for lists only — direct links, bookmarks and
 * downloads always open.
 */
/** The current viewer's role, grade and language, for picking topic versions (features/content/versions.ts). */
export function useAudienceViewer(): AudienceViewer {
  const { data, preferredLanguage } = useOnboarding();
  const { role, gradeLevel } = data;
  const language = toContentLanguage(preferredLanguage);
  return useMemo(() => ({ role, gradeLevel, language }), [role, gradeLevel, language]);
}

type Listable = { id: string; title: string; audience?: Audience; language?: ContentLanguage; fromContentPage?: boolean };

/** Whether a resource may appear in lists at all, for anyone (the audience-free part of
 *  useAudienceFilter). Editor pickers and the AI's guide index use this. */
export function isListable(item: Listable): boolean {
  // A built-in id backed by a published editor page is that page, not a built-in.
  return (SHOW_HARDCODED_RESOURCES || !HARDCODED_IDS.has(item.id) || !!item.fromContentPage) &&
    !HIDDEN_RESOURCE_TITLES.has(item.title.toLowerCase());
}

export function useAudienceFilter(): (item: Listable) => boolean {
  const { data, preferredLanguage } = useOnboarding();
  const { role, gradeLevel } = data;
  const language = toContentLanguage(preferredLanguage);
  return useCallback(
    // A topic shown in another language than English is only listed for readers of it
    // (it only has versions in that language); English is everyone's fallback.
    (item) => isListable(item) && isVisibleTo(item.audience, { role, gradeLevel })
      && (!item.language || item.language === 'en' || item.language === language),
    [role, gradeLevel, language],
  );
}
