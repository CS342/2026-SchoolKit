import { useTheme } from '../contexts/ThemeContext';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: string
) {
  const { isDark, colors } = useTheme();
  const colorFromProps = isDark ? props.dark : props.light;

  if (colorFromProps) {
    return colorFromProps;
  }

  return (colors as any)[colorName] ?? '#000000';
}
