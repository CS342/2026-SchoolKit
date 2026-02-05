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
} from '../constants/theme';
import {
  DECORATIVE_SHAPES,
  makeAppStyles,
  makeSharedStyles,
} from '../constants/onboarding-theme';

type ThemePreference = 'system' | 'light' | 'dark';

const STORAGE_KEY = '@schoolkit_theme_preference';

const ThemeContext = createContext<AppTheme | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreference] = useState<ThemePreference>('system');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setPreference(stored);
      }
      setLoaded(true);
    });
  }, []);

  const setThemePreference = (pref: ThemePreference) => {
    setPreference(pref);
    AsyncStorage.setItem(STORAGE_KEY, pref);
  };

  const isDark = useMemo(() => {
    if (preference === 'system') return systemScheme === 'dark';
    return preference === 'dark';
  }, [preference, systemScheme]);

  const theme = useMemo<AppTheme>(() => {
    const colors = isDark ? COLORS_DARK : COLORS_LIGHT;
    const gradients = isDark ? GRADIENTS_DARK : GRADIENTS_LIGHT;
    const shadows = isDark ? SHADOWS_DARK : SHADOWS_LIGHT;

    // Merge decorative shapes: dark overrides where available, keeps light defaults
    const decorativeShapes = isDark
      ? { ...DECORATIVE_SHAPES, ...DECORATIVE_SHAPES_DARK }
      : DECORATIVE_SHAPES;

    return {
      colors,
      gradients,
      shadows,
      isDark,
      appStyles: makeAppStyles(colors),
      sharedStyles: makeSharedStyles(colors),
      decorativeShapes,
      themePreference: preference,
      setThemePreference,
    };
  }, [isDark, preference]);

  if (!loaded) return null;

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
