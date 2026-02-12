import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * Safe haptic feedback that only works on mobile devices
 */
export const hapticFeedback = {
  light: () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  },
  medium: () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  },
  heavy: () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  },
  success: () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  },
  warning: () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  },
  error: () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  },
};

/**
 * Platform feature detection
 */
export const features = {
  supportsHaptics: Platform.OS !== 'web',
  supportsImagePicker: true, // expo-image-picker supports web
  supportsSpeech: Platform.OS !== 'web', // expo-speech mainly for mobile
  supportsClipboard: true, // Works on all platforms
  supportsBiometrics: Platform.OS !== 'web',
};

/**
 * Platform-specific styles helper
 */
export const platformStyles = {
  /**
   * Returns web-specific styles only on web platform
   */
  web: (styles: Record<string, any>) => {
    return Platform.OS === 'web' ? styles : {};
  },

  /**
   * Returns mobile-specific styles only on mobile platforms
   */
  mobile: (styles: Record<string, any>) => {
    return Platform.OS !== 'web' ? styles : {};
  },

  /**
   * Select different styles based on platform
   */
  select: <T,>(options: { web?: T; mobile?: T; ios?: T; android?: T; default?: T }): T | undefined => {
    if (Platform.OS === 'web' && options.web) return options.web;
    if (Platform.OS === 'ios' && options.ios) return options.ios;
    if (Platform.OS === 'android' && options.android) return options.android;
    if (Platform.OS !== 'web' && options.mobile) return options.mobile;
    return options.default;
  },
};

/**
 * Check if running on web
 */
export const isWeb = Platform.OS === 'web';

/**
 * Check if running on mobile (iOS or Android)
 */
export const isMobile = Platform.OS === 'ios' || Platform.OS === 'android';
