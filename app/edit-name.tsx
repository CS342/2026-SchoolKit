import React, { useState, useEffect, useMemo } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnboarding } from '../contexts/OnboardingContext';
import { RADII, BORDERS, SPACING, ANIMATION } from '../constants/onboarding-theme';
import { useTheme } from '../contexts/ThemeContext';

export default function EditNameScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, updateName } = useOnboarding();
  const { colors, shadows, appStyles } = useTheme();
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

  const styles = useMemo(() => makeStyles(colors, shadows), [colors, shadows]);

  return (
    <View style={styles.container}>
      <View style={[appStyles.editHeader, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={appStyles.editBackButton} accessibilityLabel="Go back">
          <Ionicons name="chevron-back" size={22} color={colors.textDark} />
        </TouchableOpacity>
        <Text style={appStyles.editHeaderTitle}>Edit Name</Text>
        <TouchableOpacity
          onPress={handleSave}
          style={[appStyles.editSaveButton, !name.trim() && appStyles.editSaveButtonDisabled]}
          disabled={!name.trim()}
        >
          <Text style={[appStyles.editSaveText, !name.trim() && appStyles.editSaveTextDisabled]}>Save</Text>
        </TouchableOpacity>
      </View>

      <Animated.View style={[styles.content, cardAnimStyle]}>
        <Text style={styles.label}>Your Name</Text>
        <TextInput
          style={[
            styles.input,
            isFocused && { borderColor: colors.primary },
          ]}
          value={name}
          onChangeText={setName}
          placeholder="Enter your name"
          placeholderTextColor={colors.inputPlaceholder}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          autoFocus
        />
      </Animated.View>
    </View>
  );
}

const makeStyles = (
  c: typeof import('../constants/theme').COLORS_LIGHT,
  s: typeof import('../constants/theme').SHADOWS_LIGHT,
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.appBackground,
    },
    content: {
      padding: SPACING.screenPadding,
    },
    label: {
      fontSize: 18,
      fontWeight: '700',
      color: c.textDark,
      marginBottom: 12,
    },
    input: {
      backgroundColor: c.white,
      borderRadius: RADII.card,
      borderWidth: BORDERS.card,
      borderColor: c.borderCard,
      padding: 20,
      fontSize: 18,
      fontWeight: '600',
      color: c.textDark,
      ...s.card,
    },
  });
