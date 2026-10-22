// Role + grade-band chips for picking who a page version is for. Shared by the version
// bar, Add version, Page settings and the new-page modal. No roles picked = everyone.
// Grade bands describe the child parents and staff support, so they only appear once a
// parent or staff role is picked (a student's role already says their school level).
import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ADULT_ROLES, AUDIENCE_ROLES, AGE_BANDS, parseAudience, type Audience } from '../../features/content/audience';
import { ChipMultiSelect } from './primitives';

export function AudienceChips({ value, onChange, compact }: {
  value: Audience | undefined;
  onChange: (audience: Audience | undefined) => void;
  /** Leave out the explanatory hints. */
  compact?: boolean;
}) {
  const { t } = useTranslation();
  // parseAudience drops empty dimensions (none = everyone) and bands without parents/staff.
  const set = (patch: Audience) => onChange(parseAudience({ ...value, ...patch }));
  const roles = value?.roles ?? [];
  const forAdults = roles.some((r) => ADULT_ROLES.includes(r));
  // The option ids stay English (logic/storage); only the display labels are localized.
  const roleOptions = AUDIENCE_ROLES.map((r) => ({ value: r.value, label: t(`editor.audienceOptions.roles.${r.value}`) }));
  const bandOptions = AGE_BANDS.map((b) => ({ value: b.value, label: t(`editor.audienceOptions.bands.${b.value}`) }));
  return (
    <View>
      <ChipMultiSelect
        label={t('editor.audience.whoFor')}
        options={roleOptions}
        value={roles}
        onChange={(next) => set({ roles: next })}
        hint={compact || forAdults ? undefined : t('editor.audience.hintEveryone')}
      />
      {forAdults ? (
        <ChipMultiSelect
          label={t('editor.audience.childGrade')}
          options={bandOptions}
          value={value?.ageBands ?? []}
          onChange={(ageBands) => set({ ageBands })}
          hint={compact ? undefined : t('editor.audience.hintGrade')}
        />
      ) : null}
    </View>
  );
}
