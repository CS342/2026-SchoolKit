// The language a page version is written in — English or Spanish. Shared by Add version
// and the new-page modal; Page settings uses the same chips with a longer hint.
import React from 'react';
import { useTranslation } from 'react-i18next';
import { CONTENT_LANGUAGES, type ContentLanguage } from '../../features/content/audience';
import { detectLanguage } from '../../features/content/language';
import type { Attachment } from '../../features/content/uploads';
import { ChipSingleSelect } from './primitives';

export function LanguageChips({ value, onChange }: { value: ContentLanguage | undefined; onChange: (language: ContentLanguage) => void }) {
  const { t } = useTranslation();
  return (
    <ChipSingleSelect
      label={t('editor.settings.languageLabel')}
      options={CONTENT_LANGUAGES.map((l) => ({ value: l, label: t(`editor.language.${l}`) }))}
      value={value ?? 'en'}
      onChange={onChange}
    />
  );
}

/** The language of the attached documents, when clear — a prefill for LanguageChips. */
export function languageOfFiles(attachments: Attachment[]): ContentLanguage | undefined {
  return detectLanguage(attachments.flatMap((a) => (a.kind === 'text' ? [a.text] : [])).join('\n'));
}
