// One block in the edit list. Header shows the block type + a live summary and the
// move/delete controls; tapping expands the inline field editor. Only one card is
// open at a time (tracked by the store's selectedId).
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { TYPOGRAPHY, SPACING, RADII } from '../../constants/onboarding-theme';
import { useEditorStore } from '../../features/content/editor/store';
import { BLOCK_LABEL, BLOCK_ICON } from '../../features/content/editor/templates';
import { REGISTRY } from '../../features/content/registry';
import type { ContentBlock } from '../../features/content/types';
import { BlockFields } from './BlockFields';
import { IconBtn } from './primitives';

const summaryOf = (b: ContentBlock): string => REGISTRY[b.type]?.summary(b) ?? '';

export function BlockCard({ block, index, count }: { block: ContentBlock; index: number; count: number }) {
  const { colors, shadows } = useTheme();
  const selectedId = useEditorStore((s) => s.selectedId);
  const select = useEditorStore((s) => s.select);
  const dispatch = useEditorStore((s) => s.dispatch);
  const open = selectedId === block.id;

  return (
    <View style={[{ backgroundColor: colors.white, borderRadius: RADII.lg, borderWidth: 1.5, borderColor: open ? colors.primary : colors.borderCard }, open ? shadows.cardSelected : shadows.small]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, gap: 10 }}>
        <Pressable onPress={() => select(open ? null : block.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, cursor: 'pointer' as any }}>
          <View style={{ width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: open ? colors.primarySoft : colors.appBackgroundAlt }}>
            <Ionicons name={BLOCK_ICON[block.type] as any} size={17} color={open ? colors.primary : colors.textMuted} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ ...TYPOGRAPHY.caption, fontFamily: 'Raleway_700Bold', color: open ? colors.primary : colors.textMuted }}>{BLOCK_LABEL[block.type]}</Text>
            <Text style={{ ...TYPOGRAPHY.bodySmall, color: colors.textDark }} numberOfLines={1}>{summaryOf(block)}</Text>
          </View>
        </Pressable>
        <IconBtn icon="arrow-up" label="Move up" disabled={index === 0} onPress={() => dispatch([{ op: 'moveBlock', id: block.id, to: index - 1 }])} />
        <IconBtn icon="arrow-down" label="Move down" disabled={index === count - 1} onPress={() => dispatch([{ op: 'moveBlock', id: block.id, to: index + 1 }])} />
        <IconBtn icon="trash-outline" label="Delete block" danger onPress={() => { if (open) select(null); dispatch([{ op: 'removeBlock', id: block.id }]); }} />
      </View>
      {open ? (
        <View style={{ paddingHorizontal: 14, paddingBottom: 14, paddingTop: 2, borderTopWidth: 1, borderTopColor: colors.appBackgroundAlt }}>
          <BlockFields block={block} />
        </View>
      ) : null}
    </View>
  );
}
