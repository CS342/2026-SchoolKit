import React from 'react';
import { Text, StyleSheet, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SHADOWS, ANIMATION } from '../../constants/onboarding-theme';

interface SelectableCardProps {
  title: string;
  subtitle?: string;
  selected: boolean;
  onPress: () => void;
  multiSelect?: boolean;
  color?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

export function SelectableCard({
  title,
  subtitle,
  selected,
  onPress,
  multiSelect = false,
  color = '#7B68EE',
  icon,
}: SelectableCardProps) {
  const scale = useSharedValue(1);
  const indicatorScale = useSharedValue(selected ? 1 : 0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const indicatorAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: indicatorScale.value }],
  }));

  React.useEffect(() => {
    indicatorScale.value = withSpring(selected ? 1 : 0, ANIMATION.springBouncy);
  }, [selected]);

  const handlePress = () => {
    scale.value = withSequence(
      withTiming(0.96, { duration: 80 }),
      withSpring(1, ANIMATION.springBouncy)
    );
    onPress();
  };

  return (
    <Pressable onPress={handlePress}>
      <Animated.View
        style={[
          styles.card,
          selected && {
            backgroundColor: color + '08',
            borderColor: color,
            borderWidth: 2.5,
            ...SHADOWS.cardSelected,
          },
          !selected && SHADOWS.card,
          animatedStyle,
        ]}
      >
        {icon && (
          <View style={[styles.iconCircle, { backgroundColor: color + '15' }]}>
            <Ionicons name={icon} size={24} color={color} />
          </View>
        )}
        <View style={styles.textContainer}>
          <Text style={[styles.title, selected && { color: '#2D2D44' }]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.subtitle, selected && { color: '#6B6B85' }]}>
              {subtitle}
            </Text>
          )}
        </View>

        {multiSelect ? (
          <View
            style={[
              styles.checkbox,
              selected && { backgroundColor: color, borderColor: color },
            ]}
          >
            <Animated.View style={indicatorAnimStyle}>
              {selected && <Ionicons name="checkmark" size={20} color="#FFFFFF" />}
            </Animated.View>
          </View>
        ) : (
          <View style={[styles.radio, selected && { borderColor: color }]}>
            <Animated.View
              style={[
                styles.radioDot,
                { backgroundColor: color },
                indicatorAnimStyle,
              ]}
            />
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 2,
    borderColor: '#E8E8F0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#2D2D44',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8EA8',
  },
  checkbox: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2.5,
    borderColor: '#C8C8D8',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radio: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2.5,
    borderColor: '#C8C8D8',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
});
