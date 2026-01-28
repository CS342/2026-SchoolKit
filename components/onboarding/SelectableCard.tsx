import React, { useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, View, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SelectableCardProps {
  title: string;
  subtitle?: string;
  selected: boolean;
  onPress: () => void;
  multiSelect?: boolean;
  color?: string;
}

export function SelectableCard({
  title,
  subtitle,
  selected,
  onPress,
  multiSelect = false,
  color = '#7B68EE'
}: SelectableCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.96,
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
    onPress();
  };

  const getColorWithOpacity = (color: string, opacity: number) => {
    return color + Math.round(opacity * 255).toString(16).padStart(2, '0');
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.9}
    >
      <Animated.View
        style={[
          styles.card,
          selected && {
            borderColor: color,
            borderLeftWidth: 6,
            backgroundColor: getColorWithOpacity(color, 0.08),
          },
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <View style={styles.content}>
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
            <View style={[
              styles.checkbox,
              selected && { backgroundColor: color, borderColor: color }
            ]}>
              {selected && <Ionicons name="checkmark" size={22} color="#FFFFFF" />}
            </View>
          ) : (
            <View style={[
              styles.radio,
              selected && { borderColor: color }
            ]}>
              {selected && <View style={[styles.radioDot, { backgroundColor: color }]} />}
            </View>
          )}
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    marginBottom: 14,
    borderWidth: 3,
    borderColor: '#E8E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 19,
    fontWeight: '700',
    color: '#2D2D44',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B6B85',
    lineHeight: 22,
  },
  checkbox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#C8C8D8',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radio: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 3,
    borderColor: '#C8C8D8',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
});
