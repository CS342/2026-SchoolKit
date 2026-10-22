// Role + grade-band chips for picking who a page version is for. Shared by the version
// bar, Add version, Page settings and the new-page modal. No roles picked = everyone.
// Grade bands describe the child parents and staff support, so they only appear once a
// parent or staff role is picked (a student's role already says their school level).
import React from 'react';
import { View } from 'react-native';
import { ADULT_ROLES, AUDIENCE_ROLES, AGE_BANDS, parseAudience, type Audience } from '../../features/content/audience';
import { ChipMultiSelect } from './primitives';

export function AudienceChips({ value, onChange, compact }: {
  value: Audience | undefined;
  onChange: (audience: Audience | undefined) => void;
  /** Leave out the explanatory hints. */
  compact?: boolean;
}) {
  // parseAudience drops empty dimensions (none = everyone) and bands without parents/staff.
  const set = (patch: Audience) => onChange(parseAudience({ ...value, ...patch }));
  const roles = value?.roles ?? [];
  const forAdults = roles.some((r) => ADULT_ROLES.includes(r));
  return (
    <View>
      <ChipMultiSelect
        label="Who is this for?"
        options={AUDIENCE_ROLES}
        value={roles}
        onChange={(next) => set({ roles: next })}
        hint={compact || forAdults ? undefined : 'Leave empty for everyone.'}
      />
      {forAdults ? (
        <ChipMultiSelect
          label="Their child's grade (parents & staff)"
          options={AGE_BANDS}
          value={value?.ageBands ?? []}
          onChange={(ageBands) => set({ ageBands })}
          hint={compact ? undefined : "Leave empty for any grade. Doesn't affect students — their role already says their school level."}
        />
      ) : null}
    </View>
  );
}
