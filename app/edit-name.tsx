import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useOnboarding } from '../contexts/OnboardingContext';
import { COLORS, SHADOWS, RADII, BORDERS, SPACING, ANIMATION, APP_STYLES } from '../constants/onboarding-theme';

export default function EditNameScreen() {
  const router = useRouter();
  const { data, updateName } = useOnboarding();
  const [name, setName] = useState(data.name);
  const [isFocused, setIsFocused] = useState(false);

  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(16);

  useEffect(() => {
    cardOpacity.value = withDelay(200, withTiming(1, { duration: 350 }));
    cardTranslateY.value = withDelay(200, withSpring(0, ANIMATION.springSmooth));
  }, []);

  const cardAnimStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }],
  }));

  const handleSave = () => {
    if (name.trim()) {
      updateName(name.trim());
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      <View style={APP_STYLES.editHeader}>
        <TouchableOpacity onPress={() => router.back()} style={APP_STYLES.editBackButton}>
          <Ionicons name="chevron-back" size={22} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={APP_STYLES.editHeaderTitle}>Edit Name</Text>
        <TouchableOpacity
          onPress={handleSave}
          style={[APP_STYLES.editSaveButton, !name.trim() && APP_STYLES.editSaveButtonDisabled]}
          disabled={!name.trim()}
        >
          <Text style={[APP_STYLES.editSaveText, !name.trim() && APP_STYLES.editSaveTextDisabled]}>Save</Text>
        </TouchableOpacity>
      </View>

      <Animated.View style={[styles.content, cardAnimStyle]}>
        <Text style={styles.label}>Your Name</Text>
        <TextInput
          style={[
            styles.input,
            isFocused && { borderColor: COLORS.primary },
          ]}
          value={name}
          onChangeText={setName}
          placeholder="Enter your name"
          placeholderTextColor={COLORS.inputPlaceholder}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          autoFocus
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.appBackground,
  },
  content: {
    padding: SPACING.screenPadding,
  },
  label: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 12,
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: RADII.card,
    borderWidth: BORDERS.card,
    borderColor: COLORS.borderCard,
    padding: 20,
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textDark,
    ...SHADOWS.card,
  },
});
