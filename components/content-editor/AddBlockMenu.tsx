// "Add block" — opens a palette of block types. A new block slots in just before the
// recommendations block (which stays last), and is selected so its editor opens.
import React, { useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { TYPOGRAPHY, SPACING, RADII } from '../../constants/onboarding-theme';
import { useEditorStore } from '../../features/content/editor/store';
import { BLOCK_PALETTE, newBlock } from '../../features/content/editor/templates';
import type { BlockType } from '../../features/content/types';

export function AddBlockMenu() {
  const { colors } = useTheme();
  const doc = useEditorStore((s) => s.doc);
  const dispatch = useEditorStore((s) => s.dispatch);
  const select = useEditorStore((s) => s.select);
  const [open, setOpen] = useState(false);

  const add = (type: BlockType) => {
    const block = newBlock(type);
    const recsIdx = doc.blocks.findIndex((b) => b.type === 'recommendations');
    const at = recsIdx >= 0 && type !== 'recommendations' ? { before: doc.blocks[recsIdx].id } : doc.blocks.length;
    dispatch([{ op: 'insertBlock', at, block }]);
    select(block.id);
    setOpen(false);
  };

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ hovered }: any) => ({ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13, borderRadius: RADII.lg, borderWidth: 1.5, borderStyle: 'dashed', borderColor: hovered ? colors.primary : colors.border, backgroundColor: hovered ? colors.primarySoft : 'transparent', cursor: 'pointer' as any })}
      >
        <Ionicons name="add-circle-outline" size={19} color={colors.primary} />
        <Text style={{ ...TYPOGRAPHY.button, fontSize: 15, color: colors.primary }}>Add block</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable onPress={() => setOpen(false)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' }}>
          <Pressable onPress={() => {}} style={{ width: 560, maxWidth: '92%', maxHeight: '82%', backgroundColor: colors.white, borderRadius: RADII.xl, padding: SPACING.xl, ...st.shadow }}>
            <Text style={{ ...TYPOGRAPHY.h3, color: colors.textDark, marginBottom: 4 }}>Add a block</Text>
            <Text style={{ ...TYPOGRAPHY.bodySmall, color: colors.textMuted, marginBottom: 16 }}>Pick the kind of content to add.</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {BLOCK_PALETTE.map((m) => (
                  <Pressable
                    key={m.type}
                    onPress={() => add(m.type)}
                    style={({ hovered }: any) => ({ width: 168, padding: 14, borderRadius: RADII.lg, borderWidth: 1.5, borderColor: hovered ? colors.primary : colors.borderCard, backgroundColor: hovered ? colors.primarySoft : colors.white, cursor: 'pointer' as any })}
                  >
                    <View style={{ width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft, marginBottom: 10 }}>
                      <Ionicons name={m.icon as any} size={19} color={colors.primary} />
                    </View>
                    <Text style={{ ...TYPOGRAPHY.bodyStrong, color: colors.textDark }}>{m.label}</Text>
                    <Text style={{ ...TYPOGRAPHY.caption, color: colors.textMuted, marginTop: 2 }}>{m.blurb}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const st = StyleSheet.create({
  shadow: { shadowColor: '#2C2A3A', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.2, shadowRadius: 36, elevation: 14 },
});
