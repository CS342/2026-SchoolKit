import React from 'react';
import { StyleProp, TextStyle } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const MCI_PREFIX = 'mci:';
const ION_GLYPHS = Ionicons.glyphMap as Record<string, number>;
const MCI_GLYPHS = MaterialCommunityIcons.glyphMap as Record<string, number>;

/** Whether `name` resolves to a real glyph: an Ionicons name, or `mci:<name>` for Material Community Icons. */
export function isValidIconName(name?: string | null): boolean {
  if (!name) return false;
  if (name.startsWith(MCI_PREFIX)) return name.slice(MCI_PREFIX.length) in MCI_GLYPHS;
  return name in ION_GLYPHS;
}

type AppIconProps = {
  /** Ionicons name (`'chatbubbles'`) or Material Community Icons name with a prefix (`'mci:home-heart'`). */
  name?: string | null;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
  /** Ionicons name shown when `name` is missing or unknown, so bad data can't crash a screen. */
  fallback?: keyof typeof Ionicons.glyphMap;
};

/**
 * Icon for data-driven names (topics, content blocks). Ionicons covers UI chrome; the `mci:`
 * prefix opens up Material Community Icons for more specific symbols (home-heart, hand-heart…).
 */
export function AppIcon({ name, size = 24, color, style, fallback = 'ellipse-outline' }: AppIconProps) {
  if (name && isValidIconName(name)) {
    if (name.startsWith(MCI_PREFIX)) {
      return <MaterialCommunityIcons name={name.slice(MCI_PREFIX.length) as any} size={size} color={color} style={style} />;
    }
    return <Ionicons name={name as any} size={size} color={color} style={style} />;
  }
  return <Ionicons name={fallback} size={size} color={color} style={style} />;
}
