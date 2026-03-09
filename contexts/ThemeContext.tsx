import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  COLORS_LIGHT,
  COLORS_DARK,
  GRADIENTS_LIGHT,
  GRADIENTS_DARK,
  SHADOWS_LIGHT,
  SHADOWS_DARK,
  DECORATIVE_SHAPES_DARK,
  AppTheme,
  TextSizePreference,
} from '../constants/theme';
import {
  DECORATIVE_SHAPES,
  makeAppStyles,
  makeSharedStyles,
} from '../constants/onboarding-theme';

type ThemePreference = 'system' | 'light' | 'dark';

const STORAGE_KEY = '@schoolkit_theme_preference';
const TEXT_SIZE_KEY = '@schoolkit_text_size';

const FONT_SCALE: Record<TextSizePreference, number> = {
  small: 0.88,
  default: 1.0,
  large: 1.14,
};

const ThemeContext = createContext<AppTheme | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreference] = useState<ThemePreference>('system');
  const [textSizePreference, setTextSizePref] = useState<TextSizePreference>('default');

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(STORAGE_KEY),
      AsyncStorage.getItem(TEXT_SIZE_KEY),
    ]).then(([theme, textSize]) => {
      if (theme === 'light' || theme === 'dark' || theme === 'system') setPreference(theme);
      if (textSize === 'small' || textSize === 'default' || textSize === 'large') setTextSizePref(textSize);
    });
  }, []);

  const setThemePreference = (pref: ThemePreference) => {
    setPreference(pref);
    AsyncStorage.setItem(STORAGE_KEY, pref);
  };

  const setTextSizePreference = (pref: TextSizePreference) => {
    setTextSizePref(pref);
    AsyncStorage.setItem(TEXT_SIZE_KEY, pref);
  };

  const isDark = useMemo(() => {
    if (preference === 'system') return systemScheme === 'dark';
    return preference === 'dark';
  }, [preference, systemScheme]);

  const theme = useMemo<AppTheme>(() => {
    const colors = isDark ? COLORS_DARK : COLORS_LIGHT;
    const gradients = isDark ? GRADIENTS_DARK : GRADIENTS_LIGHT;
    const shadows = isDark ? SHADOWS_DARK : SHADOWS_LIGHT;
    const fontScale = FONT_SCALE[textSizePreference];

    const decorativeShapes = isDark
      ? { ...DECORATIVE_SHAPES, ...DECORATIVE_SHAPES_DARK }
      : DECORATIVE_SHAPES;

    return {
      colors,
      gradients,
      shadows,
      isDark,
      appStyles: makeAppStyles(colors, fontScale),
      sharedStyles: makeSharedStyles(colors, fontScale),
      decorativeShapes,
      themePreference: preference,
      setThemePreference,
      textSizePreference,
      setTextSizePreference,
      fontScale,
    };
  }, [isDark, preference, textSizePreference]);

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): AppTheme {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
