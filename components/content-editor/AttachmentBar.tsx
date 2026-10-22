// Shared attachment strip for the content AI (new-page modal + "Ask AI" bar).
// Presentational only: the parent owns the picker + processing (pickFiles/processFile)
// and passes the resulting attachments down. Web/admin editor only.
import React from 'react';
import { View, Text, Pressable, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { TYPOGRAPHY, RADII } from '../../constants/onboarding-theme';
import type { Attachment } from '../../features/content/uploads';

export function AttachmentBar({
  attachments,
  onAttach,
  onRemove,
  processing = false,
  disabled = false,
  showAttachButton = true,
}: {
  attachments: Attachment[];
  onAttach: () => void;
  onRemove: (id: string) => void;
  processing?: boolean;
  disabled?: boolean;
  /** Show the "Attach" pill. Off when the parent provides its own attach affordance. */
  showAttachButton?: boolean;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const canAttach = !disabled && !processing;

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
      {showAttachButton ? (
        <Pressable
          onPress={canAttach ? onAttach : undefined}
          disabled={!canAttach}
          accessibilityLabel={t('editor.attach.filesLabel')}
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 5,
            paddingVertical: 6, paddingHorizontal: 10, borderRadius: RADII.pill,
            borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.inputBackground,
            opacity: canAttach ? 1 : 0.5, cursor: (canAttach ? 'pointer' : 'default') as any,
          }}
        >
          {processing
            ? <ActivityIndicator size="small" color={colors.textMuted} />
            : <Ionicons name="attach" size={15} color={colors.textMuted} />}
          <Text style={{ ...TYPOGRAPHY.caption, color: colors.textMuted }}>{t('editor.attach.label')}</Text>
        </Pressable>
      ) : null}

      {attachments.map((a) => (
        <View
          key={a.id}
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 6,
            paddingVertical: 4, paddingLeft: a.kind === 'image' ? 4 : 9, paddingRight: 4,
            borderRadius: RADII.pill, backgroundColor: colors.appBackgroundAlt,
            maxWidth: 200,
          }}
        >
          {a.kind === 'image'
            ? <Image source={{ uri: a.dataUrl }} style={{ width: 22, height: 22, borderRadius: 5 }} />
            : <Ionicons name="document-text-outline" size={14} color={colors.textMuted} />}
          <Text style={{ ...TYPOGRAPHY.caption, color: colors.textDark, flexShrink: 1 }} numberOfLines={1}>
            {a.name}
          </Text>
          <Pressable
            onPress={disabled ? undefined : () => onRemove(a.id)}
            disabled={disabled}
            accessibilityLabel={t('editor.attach.remove', { name: a.name })}
            style={{ width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', cursor: (disabled ? 'default' : 'pointer') as any }}
          >
            <Ionicons name="close" size={13} color={colors.textMuted} />
          </Pressable>
        </View>
      ))}
    </View>
  );
}
