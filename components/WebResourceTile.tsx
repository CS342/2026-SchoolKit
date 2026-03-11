import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../contexts/ThemeContext';
import { getGradientForColor, withOpacity } from '../constants/onboarding-theme';
import { BookmarkButton } from './BookmarkButton';
import { DownloadIndicator } from './DownloadIndicator';

export const WEB_GRID_GAP = 28;
export const WEB_GRID_COLS = 4;

interface WebResourceTileProps {
  id: string;
  title: string;
  icon: string;
  color: string;
  category?: string;
  onPress: () => void;
  tileSize: number;
  showDownloadIndicator?: boolean;
}

export function WebResourceTile({
  id, title, icon, color, category, onPress, tileSize, showDownloadIndicator,
}: WebResourceTileProps) {
  const { colors, isDark } = useTheme();
  const gradient = getGradientForColor(color);
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[animStyle, { width: tileSize }]}>
      <Pressable
        onPress={onPress}
        onHoverIn={() => { scale.value = withSpring(1.06, { damping: 10, stiffness: 280 }); }}
        onHoverOut={() => { scale.value = withTiming(1, { duration: 180 }); }}
        onPressIn={() => { scale.value = withSpring(0.96, { damping: 14, stiffness: 400 }); }}
        onPressOut={() => { scale.value = withTiming(1, { duration: 180 }); }}
        style={[
          styles.tile,
          {
            backgroundColor: isDark ? colors.backgroundLight : '#FFFFFF',
            borderColor: colors.borderCard,
            width: tileSize,
            height: tileSize,
          },
        ]}
      >
        <LinearGradient
          colors={[...gradient] as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconCircle}
        >
          <Ionicons name={icon as any} size={32} color="#FFF" />
        </LinearGradient>
        <Text style={[styles.title, { color: colors.textDark }]} numberOfLines={2}>
          {title}
        </Text>
        {category && (
          <View style={[styles.badge, { backgroundColor: withOpacity(color, 0.1) }]}>
            <Text style={[styles.badgeText, { color }]}>{category}</Text>
          </View>
        )}
        <View style={styles.actions}>
          {showDownloadIndicator && <DownloadIndicator resourceId={id} />}
          <BookmarkButton resourceId={id} color={color} size={18} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#7B68EE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 4,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 28,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
});
