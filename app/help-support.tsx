import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Pressable,
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useOnboarding } from '../contexts/OnboardingContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';
import { RADII, BORDERS, SPACING, ANIMATION } from '../constants/onboarding-theme';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

// Stable keys for the FAQ list; the question/answer text lives in the `profile`
// locale namespace (profile.faq.<key>.q / profile.faqHelp.<key>.a).
const FAQ_KEYS = [
  'voice',
  'newProfile',
  'role',
  'topics',
  'bookmark',
  'offline',
  'appearance',
  'who',
  'progress',
  'storyTime',
  'storiesTab',
] as const;

const MAX_CHARS = 300;

// Static styles used by FAQItem (no theme dependency)
const faqStyles = StyleSheet.create({
  faqRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  faqRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    lineHeight: 21,
  },
  faqAnswer: {
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
  },
});

function FAQItem({
  item,
  index,
  colors,
  shadows,
}: {
  item: { q: string; a: string };
  index: number;
  colors: any;
  shadows: any;
}) {
  const [expanded, setExpanded] = useState(false);

  const handlePress = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((v) => !v);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={[
        faqStyles.faqRow,
        index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderCard },
        expanded && { backgroundColor: colors.backgroundLight },
      ]}
    >
      <View style={faqStyles.faqRowHeader}>
        <Text style={[faqStyles.faqQuestion, { color: colors.textDark }]}>{item.q}</Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.indicatorInactive}
        />
      </View>
      {expanded && (
        <Text style={[faqStyles.faqAnswer, { color: colors.textLight }]}>{item.a}</Text>
      )}
    </Pressable>
  );
}

export default function HelpSupportScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { section } = useLocalSearchParams<{ section?: string }>();
  const insets = useSafeAreaInsets();
  const { data } = useOnboarding();
  const { user } = useAuth();
  const { colors, shadows, appStyles } = useTheme();

  const [feedbackText, setFeedbackText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(false);

  const inputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const feedbackSectionY = useRef<number>(0);

  const faqAnim = useSharedValue(0);
  const feedbackAnim = useSharedValue(0);
  const thankYouOpacity = useSharedValue(0);
  const thankYouScale = useSharedValue(0.85);

  useEffect(() => {
    faqAnim.value = withDelay(150, withTiming(1, { duration: 350 }));
    feedbackAnim.value = withDelay(300, withTiming(1, { duration: 350 }));
    if (section === 'feedback') {
      const timer = setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: feedbackSectionY.current, animated: true });
        inputRef.current?.focus();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (submitted) {
      thankYouOpacity.value = withTiming(1, { duration: 350 });
      thankYouScale.value = withSpring(1, ANIMATION.springBouncy);
      const timer = setTimeout(() => {
        thankYouOpacity.value = withTiming(0, { duration: 300 });
        setTimeout(() => setSubmitted(false), 300);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [submitted]);

  const faqStyle = useAnimatedStyle(() => ({
    opacity: faqAnim.value,
    transform: [{ translateY: (1 - faqAnim.value) * 16 }],
  }));

  const feedbackStyle = useAnimatedStyle(() => ({
    opacity: feedbackAnim.value,
    transform: [{ translateY: (1 - feedbackAnim.value) * 16 }],
  }));

  const thankYouStyle = useAnimatedStyle(() => ({
    opacity: thankYouOpacity.value,
    transform: [{ scale: thankYouScale.value }],
  }));

  const handleSubmit = async () => {
    if (!feedbackText.trim() || isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(false);
    try {
      // supabase-js reports failures (RLS, no session, offline) via `error`, not by throwing.
      const { error } = await supabase.from('user_questions').insert({
        user_id: user?.id ?? null,
        question: feedbackText.trim(),
        role: data.role ?? null,
      });
      if (error) throw error;
      setFeedbackText('');
      setSubmitted(true);
    } catch {
      // Keep the text so the user can retry.
      setSubmitError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const styles = useMemo(() => makeStyles(colors, shadows), [colors, shadows]);
  const canSubmit = feedbackText.trim().length > 0 && !isSubmitting;

  return (
    <View style={styles.container}>
      <View style={[appStyles.editHeader, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={appStyles.editBackButton} accessibilityLabel={t('common.goBack')}>
          <Ionicons name="chevron-back" size={22} color={colors.textDark} />
        </TouchableOpacity>
        <Text style={appStyles.editHeaderTitle}>
          {section === 'feedback' ? t('profile.shareFeedback') : t('profile.faqTitle')}
        </Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        {/* FAQ Section — only shown when section=faq */}
        {section !== 'feedback' && <Animated.View style={faqStyle}>
          <Text style={[styles.sectionLabel, { color: colors.textLight }]}>{t('profile.faqSectionLabel')}</Text>
          <View style={[styles.card, { backgroundColor: colors.white, ...shadows.card }]}>
            {FAQ_KEYS.map((key, i) => (
              <FAQItem
                key={key}
                item={{ q: t(`profile.faq.${key}.q`), a: t(`profile.faqHelp.${key}.a`) }}
                index={i}
                colors={colors}
                shadows={shadows}
              />
            ))}
          </View>
        </Animated.View>}

        {/* Feedback Section — only shown when section=feedback */}
        {section !== 'faq' &&
        <Animated.View
          style={feedbackStyle}
          onLayout={(e) => { feedbackSectionY.current = e.nativeEvent.layout.y; }}
        >
          <Text style={[styles.sectionLabel, { color: colors.textLight }]}>{t('profile.shareFeedbackSection')}</Text>
          <View style={[styles.card, { backgroundColor: colors.white, ...shadows.card }]}>
            {submitted ? (
              <Animated.View style={[styles.thankYouInner, thankYouStyle]}>
                <Ionicons name="checkmark-circle" size={44} color={colors.primary} />
                <Text style={[styles.thankYouTitle, { color: colors.textDark }]}>{t('profile.thankYou')}</Text>
                <Text style={[styles.thankYouBody, { color: colors.textLight }]}>
                  {t('profile.thankYouBody')}
                </Text>
              </Animated.View>
            ) : (
              <View style={styles.feedbackInner}>
                <Text style={[styles.feedbackDescription, { color: colors.textLight }]}>
                  {t('profile.feedbackDescriptionFull')}
                </Text>

                <TextInput
                  ref={inputRef}
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.appBackground,
                      borderColor: isFocused ? colors.primary : colors.borderCard,
                      color: colors.textDark,
                    },
                  ]}
                  value={feedbackText}
                  onChangeText={(t) => setFeedbackText(t.slice(0, MAX_CHARS))}
                  placeholder={t('profile.feedbackPlaceholder')}
                  placeholderTextColor={colors.inputPlaceholder}
                  multiline
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  textAlignVertical="top"
                />
                <Text style={[styles.charCount, { color: feedbackText.length >= MAX_CHARS ? colors.error : colors.textLight }]}>
                  {feedbackText.length}/{MAX_CHARS}
                </Text>

                {submitError ? (
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 12 }}>
                    <Ionicons name="alert-circle" size={16} color={colors.error} style={{ marginTop: 1 }} />
                    <Text style={{ flex: 1, fontSize: 14, color: colors.error }}>
                      {t('profile.feedbackFailed')}. {t('profile.feedbackFailedBody')}
                    </Text>
                  </View>
                ) : null}

                <TouchableOpacity
                  style={[styles.submitButton, { backgroundColor: canSubmit ? colors.primaryFill : colors.disabledButton }]}
                  onPress={handleSubmit}
                  disabled={!canSubmit}
                  activeOpacity={0.8}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color={colors.primary} />
                  ) : (
                    <Text style={[styles.submitText, !canSubmit && { color: colors.disabledText }]}>{t('common.submit')}</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Animated.View>}
      </ScrollView>
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
    scroll: {
      padding: SPACING.screenPadding,
      paddingBottom: 360,
    },
    sectionLabel: {
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 0.8,
      marginBottom: 8,
      marginLeft: 4,
    },
    card: {
      borderRadius: RADII.card,
      marginBottom: 28,
      overflow: 'hidden',
    },
    // Feedback
    feedbackInner: {
      padding: 16,
    },
    feedbackDescription: {
      fontSize: 14,
      lineHeight: 21,
      marginBottom: 16,
    },
    input: {
      borderRadius: RADII.card,
      borderWidth: BORDERS.card,
      padding: 14,
      fontSize: 15,
      minHeight: 110,
      fontWeight: '400',
    },
    charCount: {
      fontSize: 12,
      fontWeight: '500',
      textAlign: 'right',
      marginTop: 6,
      marginBottom: 16,
    },
    submitButton: {
      borderRadius: 100,
      paddingVertical: 14,
      alignItems: 'center',
    },
    submitText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700',
    },
    // Thank-you (inline inside feedback card)
    thankYouInner: {
      padding: 32,
      alignItems: 'center',
      gap: 10,
    },
    thankYouTitle: {
      fontSize: 18,
      fontWeight: '700',
    },
    thankYouBody: {
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 20,
    },
  });
