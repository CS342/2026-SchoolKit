import React, { useEffect } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import Animated, { 
  FadeInUp, 
  FadeOutUp, 
  Layout,
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADII } from '../constants/onboarding-theme';
import { useTheme } from '../contexts/ThemeContext';

export type BannerType = 'success' | 'info' | 'warning' | 'error';

interface FeedbackBannerProps {
  message: string;
  visible: boolean;
  onDismiss: () => void;
  type?: BannerType;
  autoDismissTime?: number;
  style?: any;
}

export function FeedbackBanner({
  message,
  visible,
  onDismiss,
  type = 'info',
  autoDismissTime = 4000,
  style,
}: FeedbackBannerProps) {
  const { colors } = useTheme();

  useEffect(() => {
    if (visible && autoDismissTime > 0) {
      const timer = setTimeout(onDismiss, autoDismissTime);
      return () => clearTimeout(timer);
    }
  }, [visible, autoDismissTime, onDismiss]);

  if (!visible) return null;

  const getColors = () => {
    switch (type) {
      case 'success':
        return {
          bg: colors.successBg,
          border: colors.success + '40',
          icon: colors.successText,
          text: colors.successText,
        };
      case 'warning':
        return {
          bg: colors.warningBg,
          border: colors.warning + '40',
          icon: colors.warningText,
          text: colors.warningText,
        };
      case 'error':
        return {
          bg: colors.coralSoft,
          border: colors.destructive + '40',
          icon: colors.destructive,
          text: colors.textDark,
        };
      case 'info':
      default:
        return {
          bg: colors.infoBg,
          border: colors.info + '40',
          icon: colors.info,
          text: colors.textDark,
        };
    }
  };

  const c = getColors();

  const iconName = () => {
    switch (type) {
      case 'success': return 'checkmark-circle';
      case 'warning': return 'alert-circle';
      case 'error': return 'close-circle';
      default: return 'information-circle';
    }
  };

  return (
    <Animated.View 
      entering={FadeInUp.springify().damping(15)}
      exiting={FadeOutUp}
      layout={Layout.springify()}
      style={[
        styles.container, 
        { 
          backgroundColor: c.bg,
          borderColor: c.border,
        },
        style
      ]}
    >
      <View style={styles.content}>
        <Ionicons name={iconName() as any} size={20} color={c.icon} style={styles.icon} />
        <Text style={[styles.text, { color: c.text }]}>{message}</Text>
      </View>
      <Pressable onPress={onDismiss} hitSlop={12}>
        <Ionicons name="close" size={18} color={c.text} opacity={0.6} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: RADII.card || 12,
    borderWidth: 1,
    marginHorizontal: 20,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  icon: {
    marginRight: 10,
  },
  text: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
});
