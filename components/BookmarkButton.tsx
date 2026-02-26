import React, { useRef } from 'react';
import { TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOnboarding } from '../contexts/OnboardingContext';
import { useAccomplishments } from '../contexts/AccomplishmentContext';
import { COLORS } from '../constants/onboarding-theme';

interface BookmarkButtonProps {
  resourceId: string;
  size?: number;
  color?: string;
}

export function BookmarkButton({ resourceId, size = 24, color = COLORS.primary }: BookmarkButtonProps) {
  const { isBookmarked, addBookmark, removeBookmark } = useOnboarding();
  const { fireEvent } = useAccomplishments();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bookmarked = isBookmarked(resourceId);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    if (bookmarked) {
      removeBookmark(resourceId);
    } else {
      addBookmark(resourceId);
      fireEvent('resource_bookmarked');
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={styles.button}
      activeOpacity={0.7}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      accessibilityLabel={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Ionicons
          name={bookmarked ? 'bookmark' : 'bookmark-outline'}
          size={size}
          color={bookmarked ? color : COLORS.textLight}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 8,
  },
});
