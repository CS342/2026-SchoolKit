// "Add version → Translation from file": make a version of a topic in another language
// from a translator's file. The new version is a copy of the source version — same
// blocks, audience, icons, colors, images and links — with each text swapped for the
// passage of the file that translates it (see ../translate). Saved as a draft; whatever
// needs a human look (gaps, text not found in the file) goes to the checks panel.
import { alignTranslation } from '../ai/client';
import type { ContentLanguage } from '../audience';
import type { TextAttachment } from '../uploads';
import { textSlots, applySlots, checkAlignment, alignmentNotices, translationSource } from '../translate';
import { loadContentPage, saveContentPage } from './crud';
import { stashGenerationNotices } from './store';

export async function createTranslatedVersion({ sourcePageId, files, language }: {
  sourcePageId: string;
  /** The translation, as extracted text (one or more files, in order). */
  files: TextAttachment[];
  language: ContentLanguage;
}): Promise<{ pageId: string } | { error: string }> {
  const source = await loadContentPage(sourcePageId);
  if (!source) return { error: 'Could not load the version to translate.' };
  const translation = files.map((f) => f.text).join('\n\n').trim();
  if (!translation) return { error: 'The translation file has no text we could read.' };

  const slots = textSlots(source.doc);
  const aligned = await alignTranslation(slots, translation, language);
  if ('error' in aligned) return aligned;

  const translated = applySlots(source.doc, slots, aligned.values);
  const doc = {
    ...translated,
    // A new slug is minted from the (translated) title; readers reach it through the topic.
    slug: '',
    language,
    translatedFrom: translationSource(sourcePageId, source.doc),
    // The source's link to a built-in guide stays on the source only (as for copies).
    resourceId: undefined,
  };
  const saved = await saveContentPage(null, doc, 'draft', source.topicId);
  if ('error' in saved) return saved;

  const fileName = files.length === 1 ? files[0].name : 'your files';
  stashGenerationNotices(saved.id, alignmentNotices(checkAlignment(slots, aligned.values, doc, translation), fileName));
  return { pageId: saved.id };
}
