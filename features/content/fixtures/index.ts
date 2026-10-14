// Local fixture registry — stands in for the Supabase `content_pages` table during
// Phase 1. The dynamic route reads from here; Phase 3 swaps this for a DB fetch.
import type { ContentDoc } from '../types';
import { financesDoc } from './finances';
import { returnToSchoolDoc } from './return-to-school';
import { justDiagnosedDoc } from './just-diagnosed';
import { understanding504Doc } from './understanding-504';

export const FIXTURE_DOCS: Record<string, ContentDoc> = {
  [financesDoc.slug]: financesDoc,
  [returnToSchoolDoc.slug]: returnToSchoolDoc,
  [justDiagnosedDoc.slug]: justDiagnosedDoc,
  [understanding504Doc.slug]: understanding504Doc,
};
