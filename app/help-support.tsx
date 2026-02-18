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
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';
import { RADII, BORDERS, SPACING, ANIMATION } from '../constants/onboarding-theme';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

const FAQS = [
  {
    q: 'How do I change the reading voice?',
    a: 'Go to Profile → Voice. You can preview and select from several different voices for your companion.',
  },
  {
    q: 'How do I start a new profile / retake the survey?',
    a: 'Go to Profile → Retake Survey. This will reset your role, topics, and preferences so you can go through setup again.',
  },
  {
    q: 'How do I change my role?',
    a: 'Go to Profile → Role. You can switch between Student, Parent/Caregiver, and School Staff at any time.',
  },
  {
    q: 'How do I change my topics of interest?',
    a: 'Go to Profile → Topics. You can add or remove topics and the app will tailor content to your selection.',
  },
  {
    q: 'How do I bookmark a resource?',
    a: 'Tap the bookmark icon on any resource card or detail page. Saved items appear in the Bookmarks tab.',
  },
  {
    q: 'Can I use the app offline?',
    a: 'Yes! Tap Download All in your Profile to save resources for offline access. Bookmarks and previously viewed content are also cached.',
  },
  {
    q: 'How do I switch between light and dark mode?',
    a: 'Go to Profile → Appearance. You can choose Light, Dark, or follow your device system setting.',
  },
  {
    q: 'Who is SchoolKit for?',
    a: 'SchoolKit supports young cancer survivors and their families, caregivers, and school staff as they navigate the return to school after treatment.',
  },
];

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
  const insets = useSafeAreaInsets();
  const { data } = useOnboarding();
  const { user } = useAuth();
  const { colors, shadows, appStyles } = useTheme();

  const [feedbackText, setFeedbackText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const inputRef = useRef<TextInput>(null);

  const faqAnim = useSharedValue(0);
  const feedbackAnim = useSharedValue(0);
  const thankYouOpacity = useSharedValue(0);
  const thankYouScale = useSharedValue(0.85);

  useEffect(() => {
    faqAnim.value = withDelay(150, withTiming(1, { duration: 350 }));
    feedbackAnim.value = withDelay(300, withTiming(1, { duration: 350 }));
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
    try {
      await supabase.from('user_questions').insert({
        user_id: user?.id ?? null,
        question: feedbackText.trim(),
        role: data.role ?? null,
      });
    } catch {
      // Fail silently — feedback collection is best-effort
    } finally {
      setIsSubmitting(false);
      setFeedbackText('');
      setSubmitted(true);
    }
  };

  const styles = useMemo(() => makeStyles(colors, shadows), [colors, shadows]);
  const canSubmit = feedbackText.trim().length > 0 && !isSubmitting;

  return (
    <View style={styles.container}>
      <View style={[appStyles.editHeader, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={appStyles.editBackButton} accessibilityLabel="Go back">
          <Ionicons name="chevron-back" size={22} color={colors.textDark} />
        </TouchableOpacity>
        <Text style={appStyles.editHeaderTitle}>Help & Support</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        {/* FAQ Section */}
        <Animated.View style={faqStyle}>
          <Text style={[styles.sectionLabel, { color: colors.textLight }]}>FREQUENTLY ASKED QUESTIONS</Text>
          <View style={[styles.card, { backgroundColor: colors.white, ...shadows.card }]}>
            {FAQS.map((item, i) => (
              <FAQItem key={i} item={item} index={i} colors={colors} shadows={shadows} />
            ))}
          </View>
        </Animated.View>

        {/* Feedback Section */}
        <Animated.View style={feedbackStyle}>
          <Text style={[styles.sectionLabel, { color: colors.textLight }]}>SHARE YOUR FEEDBACK</Text>
          <View style={[styles.card, { backgroundColor: colors.white, ...shadows.card }]}>
            {submitted ? (
              <Animated.View style={[styles.thankYouInner, thankYouStyle]}>
                <Ionicons name="checkmark-circle" size={44} color={colors.primary} />
                <Text style={[styles.thankYouTitle, { color: colors.textDark }]}>Thank you!</Text>
                <Text style={[styles.thankYouBody, { color: colors.textLight }]}>
                  We hope to add your suggestions to a future version of SchoolKit.
                </Text>
              </Animated.View>
            ) : (
              <View style={styles.feedbackInner}>
                <Text style={[styles.feedbackDescription, { color: colors.textLight }]}>
                  Have a question or suggestion not covered above? Share it here. We collect responses to help shape future versions of SchoolKit — we won't be able to reply directly, but every submission is read and considered.
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
                  placeholder="Type your question or suggestion..."
                  placeholderTextColor={colors.inputPlaceholder}
                  multiline
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  textAlignVertical="top"
                />
                <Text style={[styles.charCount, { color: feedbackText.length >= MAX_CHARS ? colors.error : colors.indicatorInactive }]}>
                  {feedbackText.length}/{MAX_CHARS}
                </Text>

                <TouchableOpacity
                  style={[styles.submitButton, { backgroundColor: canSubmit ? colors.primary : colors.indicatorInactive }]}
                  onPress={handleSubmit}
                  disabled={!canSubmit}
                  activeOpacity={0.8}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitText}>Submit</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Animated.View>
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
