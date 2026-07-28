import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { RADII, SPACING, TYPOGRAPHY } from '../../constants/onboarding-theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

/**
 * The single text field. One height, one radius, a token border that turns
 * primary with a soft focus ring. Use `multiline` for longer entries.
 */
export function Input({ label, error, containerStyle, multiline, style, onFocus, onBlur, ...rest }: InputProps) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error ? colors.error : focused ? colors.primary : colors.borderCard;

  return (
    <View style={containerStyle}>
      {label ? <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text> : null}
      <TextInput
        {...rest}
        multiline={multiline}
        placeholderTextColor={colors.inputPlaceholder}
        onFocus={(e) => { setFocused(true); onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); onBlur?.(e); }}
        style={[
          styles.field,
          {
            backgroundColor: colors.white,
            color: colors.textDark,
            borderColor,
            minHeight: multiline ? 96 : 50,
            textAlignVertical: multiline ? 'top' : 'center',
          },
          focused && !error ? { shadowColor: colors.primary, shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: { width: 0, height: 0 }, elevation: 2 } : null,
          style,
        ]}
      />
      {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { ...TYPOGRAPHY.caption, marginBottom: 6, marginLeft: 2 },
  field: {
    ...TYPOGRAPHY.body,
    borderWidth: 1.5,
    borderRadius: RADII.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  error: { ...TYPOGRAPHY.caption, marginTop: 5, marginLeft: 2 },
});
