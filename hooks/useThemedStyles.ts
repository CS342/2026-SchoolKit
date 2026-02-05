import { useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import type { AppTheme } from '../constants/theme';

export function useThemedStyles<T>(factory: (theme: AppTheme) => T): T {
  const theme = useTheme();
  return useMemo(() => factory(theme), [theme]);
}
