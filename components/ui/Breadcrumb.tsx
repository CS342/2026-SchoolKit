import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

export interface Crumb {
  label: string;
  onPress?: () => void;
}

/** Web breadcrumb trail: Library › Health › This Page. Last item is current. */
export function Breadcrumb({ items }: { items: Crumb[] }) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      {items.map((it, i) => {
        const last = i === items.length - 1;
        const label = (
          <Text
            style={[styles.item, { color: last ? colors.textMuted : colors.textLight }]}
            numberOfLines={1}
          >
            {it.label}
          </Text>
        );
        return (
          <View key={i} style={styles.row}>
            {i > 0 && <Text style={[styles.sep, { color: colors.textLight }]}>›</Text>}
            {it.onPress && !last ? (
              <Pressable
                onPress={it.onPress}
                style={Platform.OS === 'web' ? ({ hovered }: any) => ({ cursor: 'pointer', opacity: hovered ? 0.7 : 1 }) as any : undefined}
              >
                {label}
              </Pressable>
            ) : (
              label
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  item: { fontFamily: 'Raleway_500Medium', fontSize: 12.5, letterSpacing: 0.2 },
  sep: { fontSize: 13, marginHorizontal: 7 },
});
