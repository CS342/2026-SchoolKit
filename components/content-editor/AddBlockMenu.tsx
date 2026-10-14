// "Add block" — opens a palette of block types, grouped by kind and searchable.
// A new block slots in just before the recommendations block (which stays last),
// and is selected so its editor opens.
import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, Modal, ScrollView, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { shadow } from '../../constants/theme';
import { TYPOGRAPHY, SPACING, RADII } from '../../constants/onboarding-theme';
import { useEditorStore } from '../../features/content/editor/store';
import { BLOCK_PALETTE, newBlock } from '../../features/content/editor/templates';
import type { BlockType } from '../../features/content/types';

// Curated grouping of the palette. Anything not listed falls into "More", so new
// manifest block types still appear even before they're assigned a group here.
const GROUP_ORDER = ['Text', 'Interactive', 'Layout & cards', 'Media', 'Links & references', 'More'] as const;
type Group = (typeof GROUP_ORDER)[number];

const GROUP_BY_TYPE: Record<string, Group> = {
  callout: 'Text', richText: 'Text', quote: 'Text', footnote: 'Text', divider: 'Text',
  accordion: 'Interactive', stepper: 'Interactive', tabs: 'Interactive', flipCard: 'Interactive', checklist: 'Interactive',
  cardGrid: 'Layout & cards', columns: 'Layout & cards', statGrid: 'Layout & cards', comparisonTable: 'Layout & cards', testimonials: 'Layout & cards',
  image: 'Media', gallery: 'Media', video: 'Media',
  resourceRefList: 'Links & references', linkList: 'Links & references', references: 'Links & references', recommendations: 'Links & references',
};

type PaletteItem = (typeof BLOCK_PALETTE)[number];

function BlockCard({ item, onPress }: { item: PaletteItem; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Add ${item.label} block`}
      style={({ hovered }: any) => ({
        width: 168, flexGrow: 1, flexBasis: 168, maxWidth: 220,
        padding: 14, borderRadius: RADII.lg, borderWidth: 1.5,
        borderColor: hovered ? colors.primary : colors.borderCard,
        backgroundColor: hovered ? colors.primarySoft : colors.white,
        cursor: 'pointer' as any,
      })}
    >
      <View style={{ width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft, marginBottom: 10 }}>
        <Ionicons name={item.icon as any} size={19} color={colors.primary} />
      </View>
      <Text style={{ ...TYPOGRAPHY.bodyStrong, color: colors.textDark }}>{item.label}</Text>
      <Text style={{ ...TYPOGRAPHY.caption, color: colors.textMuted, marginTop: 2 }}>{item.blurb}</Text>
    </Pressable>
  );
}

export function AddBlockMenu() {
  const { colors } = useTheme();
  const doc = useEditorStore((s) => s.doc);
  const dispatch = useEditorStore((s) => s.dispatch);
  const select = useEditorStore((s) => s.select);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const close = () => { setOpen(false); setQuery(''); };

  const add = (type: BlockType) => {
    const block = newBlock(type);
    const recsIdx = doc.blocks.findIndex((b) => b.type === 'recommendations');
    const at = recsIdx >= 0 && type !== 'recommendations' ? { before: doc.blocks[recsIdx].id } : doc.blocks.length;
    dispatch([{ op: 'insertBlock', at, block }]);
    select(block.id);
    close();
  };

  const q = query.trim().toLowerCase();
  const matches = (m: PaletteItem) => !q || m.label.toLowerCase().includes(q) || m.blurb.toLowerCase().includes(q);

  // Grouped (no query) or a flat filtered list (while searching).
  const groups = useMemo(() => {
    return GROUP_ORDER
      .map((g) => ({ group: g, items: BLOCK_PALETTE.filter((m) => (GROUP_BY_TYPE[m.type] ?? 'More') === g && matches(m)) }))
      .filter((s) => s.items.length > 0);
  }, [q]);
  const flat = useMemo(() => BLOCK_PALETTE.filter(matches), [q]);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Add block"
        style={({ hovered }: any) => ({ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13, borderRadius: RADII.lg, borderWidth: 1.5, borderStyle: 'dashed', borderColor: hovered ? colors.primary : colors.border, backgroundColor: hovered ? colors.primarySoft : 'transparent', cursor: 'pointer' as any })}
      >
        <Ionicons name="add-circle-outline" size={19} color={colors.primary} />
        <Text style={{ ...TYPOGRAPHY.button, fontSize: 15, color: colors.primary }}>Add block</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <Pressable onPress={close} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <Pressable onPress={() => {}} style={{ width: 620, maxWidth: '100%', maxHeight: '84%', backgroundColor: colors.white, borderRadius: RADII.xl, ...st.shadow }}>
            {/* Header */}
            <View style={{ paddingTop: SPACING.xl, paddingHorizontal: SPACING.xl }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ ...TYPOGRAPHY.h3, color: colors.textDark }}>Add a block</Text>
                  <Text style={{ ...TYPOGRAPHY.bodySmall, color: colors.textMuted, marginTop: 2 }}>Pick the kind of content to add.</Text>
                </View>
                <Pressable
                  onPress={close}
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                  style={({ hovered }: any) => ({ width: 34, height: 34, borderRadius: RADII.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: hovered ? colors.backgroundLighter : 'transparent', cursor: 'pointer' as any })}
                >
                  <Ionicons name="close" size={20} color={colors.textMuted} />
                </Pressable>
              </View>

              {/* Search */}
              <View style={[st.search, { backgroundColor: colors.backgroundLighter, borderColor: colors.borderCard }]}>
                <Ionicons name="search" size={16} color={colors.textLight} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search block types…"
                  placeholderTextColor={colors.inputPlaceholder}
                  style={[st.searchInput, { color: colors.textDark }]}
                />
                {query.length > 0 && (
                  <Pressable onPress={() => setQuery('')} accessibilityLabel="Clear search">
                    <Ionicons name="close-circle" size={16} color={colors.textLight} />
                  </Pressable>
                )}
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: SPACING.xl, paddingBottom: SPACING.xl, paddingTop: 14 }}>
              {q ? (
                flat.length > 0 ? (
                  <View style={st.grid}>
                    {flat.map((m) => <BlockCard key={m.type} item={m} onPress={() => add(m.type)} />)}
                  </View>
                ) : (
                  <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                    <Ionicons name="search-outline" size={26} color={colors.textLight} />
                    <Text style={{ ...TYPOGRAPHY.body, color: colors.textMuted, marginTop: 10 }}>No block types match “{query}”.</Text>
                  </View>
                )
              ) : (
                groups.map(({ group, items }) => (
                  <View key={group} style={{ marginBottom: 18 }}>
                    <Text style={[st.groupLabel, { color: colors.textLight }]}>{group.toUpperCase()}</Text>
                    <View style={st.grid}>
                      {items.map((m) => <BlockCard key={m.type} item={m} onPress={() => add(m.type)} />)}
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const st = StyleSheet.create({
  shadow: shadow({ shadowColor: '#2C2A3A', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.2, shadowRadius: 36, elevation: 14 }),
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: RADII.button,
    borderWidth: 1,
  },
  searchInput: { flex: 1, ...TYPOGRAPHY.bodySmall, paddingVertical: 2, ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : null) },
  groupLabel: { ...TYPOGRAPHY.caption, fontFamily: 'Raleway_700Bold', letterSpacing: 0.8, marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
});
