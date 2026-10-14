// Small themed editor atoms: labels, text inputs, a color-token swatch row, an icon
// picker, and compact icon buttons. Web-only editor, so hover states are fine.
import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, Pressable, Switch, Modal, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { TYPOGRAPHY, SPACING, RADII } from '../../constants/onboarding-theme';
import { COLOR_TOKENS, resolveColor } from '../../features/content/tokens';
import type { ColorToken } from '../../features/content/types';

export function SectionLabel({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  return <Text style={{ ...TYPOGRAPHY.overline, color: colors.textLight, marginBottom: 6 }}>{children}</Text>;
}

export function TextField({ label, value, onChangeText, placeholder, multiline }: {
  label?: string; value: string; onChangeText: (t: string) => void; placeholder?: string; multiline?: boolean;
}) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ marginBottom: SPACING.md }}>
      {label ? <SectionLabel>{label}</SectionLabel> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.inputPlaceholder}
        multiline={multiline}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          ...TYPOGRAPHY.body,
          color: colors.textDark,
          backgroundColor: colors.inputBackground,
          borderWidth: 1.5,
          borderColor: focused ? colors.primary : colors.border,
          borderRadius: RADII.md,
          paddingHorizontal: 12,
          paddingVertical: 10,
          minHeight: multiline ? 84 : undefined,
          textAlignVertical: multiline ? 'top' : 'center',
          outlineStyle: 'none' as any,
        }}
      />
    </View>
  );
}

export function ToggleRow({ label, value, onValueChange }: { label: string; value: boolean; onValueChange: (v: boolean) => void }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.md }}>
      <Text style={{ ...TYPOGRAPHY.bodySmall, color: colors.textDark }}>{label}</Text>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ true: colors.primary, false: colors.indicatorInactive }} thumbColor="#fff" />
    </View>
  );
}

export function ColorSwatches({ value, onChange }: { value: ColorToken; onChange: (t: ColorToken) => void }) {
  const { colors } = useTheme();
  return (
    <View style={{ marginBottom: SPACING.md }}>
      <SectionLabel>Color</SectionLabel>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {COLOR_TOKENS.map((tok) => {
          const hex = resolveColor(tok, colors.primary);
          const selected = tok === value;
          return (
            <Pressable
              key={tok}
              onPress={() => onChange(tok)}
              accessibilityLabel={tok}
              style={{
                width: 30, height: 30, borderRadius: 15, backgroundColor: hex,
                alignItems: 'center', justifyContent: 'center',
                borderWidth: selected ? 3 : 0, borderColor: colors.white,
                outlineStyle: (selected ? `2px solid ${hex}` : 'none') as any,
                cursor: 'pointer' as any,
              }}
            >
              {selected ? <Ionicons name="checkmark" size={15} color="#fff" /> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// Curated Ionicons (outline) covering the SchoolKit content domain.
export const ICON_SET = [
  'heart-outline', 'happy-outline', 'sparkles-outline', 'sunny-outline', 'star-outline', 'ribbon-outline',
  'medkit-outline', 'fitness-outline', 'body-outline', 'bandage-outline', 'thermometer-outline', 'pulse-outline',
  'battery-half-outline', 'bed-outline', 'nutrition-outline', 'water-outline',
  'school-outline', 'book-outline', 'library-outline', 'pencil-outline', 'document-text-outline', 'reader-outline',
  'people-outline', 'people-circle-outline', 'person-outline', 'chatbubbles-outline', 'chatbox-ellipses-outline', 'hand-left-outline',
  'wallet-outline', 'cash-outline', 'card-outline', 'calculator-outline', 'gift-outline', 'receipt-outline', 'pricetag-outline',
  'home-outline', 'car-outline', 'airplane-outline', 'bus-outline', 'location-outline', 'map-outline',
  'calendar-outline', 'time-outline', 'hourglass-outline', 'alarm-outline', 'checkmark-circle-outline', 'shield-checkmark-outline',
  'call-outline', 'mail-outline', 'globe-outline', 'link-outline', 'search-outline', 'information-circle-outline',
  'bulb-outline', 'compass-outline', 'flag-outline', 'trophy-outline', 'leaf-outline', 'balloon-outline',
  'musical-notes-outline', 'game-controller-outline', 'football-outline', 'brush-outline', 'camera-outline', 'headset-outline',
];

export function IconField({ value, onChange }: { value: string; onChange: (icon: string) => void }) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? ICON_SET.filter((i) => i.includes(s)) : ICON_SET;
  }, [q]);

  return (
    <View style={{ marginBottom: SPACING.md }}>
      <SectionLabel>Icon</SectionLabel>
      <Pressable
        onPress={() => setOpen(true)}
        style={{
          flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'flex-start',
          backgroundColor: colors.inputBackground, borderWidth: 1.5, borderColor: colors.border,
          borderRadius: RADII.md, paddingHorizontal: 12, paddingVertical: 8, cursor: 'pointer' as any,
        }}
      >
        <Ionicons name={value as any} size={22} color={colors.primary} />
        <Text style={{ ...TYPOGRAPHY.bodySmall, color: colors.textMuted }}>{value.replace('-outline', '')}</Text>
        <Ionicons name="chevron-down" size={14} color={colors.textLight} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable onPress={() => setOpen(false)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' }}>
          <Pressable onPress={() => {}} style={{ width: 420, maxWidth: '92%', maxHeight: '78%', backgroundColor: colors.white, borderRadius: RADII.xl, padding: SPACING.xl, ...s.shadow }}>
            <Text style={{ ...TYPOGRAPHY.h3, color: colors.textDark, marginBottom: 12 }}>Choose an icon</Text>
            <TextInput
              value={q} onChangeText={setQ} placeholder="Search icons" placeholderTextColor={colors.inputPlaceholder}
              style={{ ...TYPOGRAPHY.body, color: colors.textDark, backgroundColor: colors.inputBackground, borderWidth: 1.5, borderColor: colors.border, borderRadius: RADII.md, paddingHorizontal: 12, paddingVertical: 9, marginBottom: 14, outlineStyle: 'none' as any }}
            />
            <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }} showsVerticalScrollIndicator={false}>
              {filtered.map((icon) => {
                const sel = icon === value;
                return (
                  <Pressable
                    key={icon}
                    onPress={() => { onChange(icon); setOpen(false); }}
                    style={{ width: 52, height: 52, borderRadius: RADII.md, alignItems: 'center', justifyContent: 'center', backgroundColor: sel ? colors.primarySoft : colors.appBackgroundAlt, borderWidth: sel ? 1.5 : 1, borderColor: sel ? colors.primary : colors.border, cursor: 'pointer' as any }}
                  >
                    <Ionicons name={icon as any} size={22} color={sel ? colors.primary : colors.textMuted} />
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

export function IconBtn({ icon, onPress, label, danger, disabled }: { icon: string; onPress: () => void; label: string; danger?: boolean; disabled?: boolean }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      accessibilityLabel={label}
      style={({ hovered }: any) => ({
        width: 30, height: 30, borderRadius: RADII.sm, alignItems: 'center', justifyContent: 'center',
        backgroundColor: hovered && !disabled ? (danger ? colors.error + '18' : colors.primarySoft) : 'transparent',
        opacity: disabled ? 0.35 : 1, cursor: (disabled ? 'default' : 'pointer') as any,
      })}
    >
      <Ionicons name={icon as any} size={17} color={danger ? colors.error : colors.textMuted} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  shadow: { shadowColor: '#2C2A3A', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.18, shadowRadius: 30, elevation: 12 },
});
