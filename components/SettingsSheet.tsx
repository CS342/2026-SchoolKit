import React, { useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
  Image,
  TextInput,
  LayoutAnimation,
  UIManager,
  PanResponder,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useSettings } from '../contexts/SettingsContext';
import { useOnboarding } from '../contexts/OnboardingContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useTheme } from '../contexts/ThemeContext';
import { VOICE_META, generateSpeech } from '../services/elevenLabs';
import { ALL_RESOURCES } from '../constants/resources';
import { ANIMATION, SPACING } from '../constants/onboarding-theme';
import type { AppTheme } from '../constants/theme';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type SheetView = 'main' | 'voice' | 'appearance' | 'textsize' | 'about' | 'faq' | 'feedback';

const FAQS = [
  { q: 'How do I change the reading voice?', a: 'Go to Settings → Voice. You can preview and select from several different voices.' },
  { q: 'How do I start a new profile / retake the survey?', a: 'Go to Settings → Retake Survey. This will reset your role, topics, and preferences.' },
  { q: 'How do I change my role?', a: 'Go to Profile → Role. You can switch between Student, Parent/Caregiver, and School Staff at any time.' },
  { q: 'How do I change my topics of interest?', a: 'Go to Profile → Topics. You can add or remove topics and the app will tailor content to your selection.' },
  { q: 'How do I bookmark a resource?', a: 'Tap the bookmark icon on any resource card or detail page. Saved items appear in the Bookmarks tab.' },
  { q: 'Can I use the app offline?', a: 'Yes! Tap Download All in Settings to save resources for offline access.' },
  { q: 'How do I switch between light and dark mode?', a: 'Go to Settings → Appearance. You can choose Light, Dark, or follow your device system setting.' },
  { q: 'Who is SchoolKit for?', a: 'SchoolKit supports young cancer survivors and their families, caregivers, and school staff as they navigate the return to school after treatment.' },
  { q: 'How can I check my progress?', a: 'Go to the Profile tab to see your completed topics, downloaded resources, and bookmarks.' },
  { q: 'How long will it take for my story to be approved?', a: 'Stories are reviewed by our team before appearing in the community. This usually takes 1–3 days.' },
  { q: 'What is the Stories tab for?', a: 'The Stories tab is a community space where users can share their own life experiences related to the school re-entry journey.' },
];

// ── Shared row component ───────────────────────────────────────────────────

function SheetRow({
  icon,
  label,
  value,
  onPress,
  isLast = false,
  tint,
  theme,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress: () => void;
  isLast?: boolean;
  tint?: string;
  theme: AppTheme;
}) {
  const scale = useSharedValue(1);
  const { colors } = theme;

  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => { scale.value = withTiming(0.98, { duration: 80 }); }}
      onPressOut={() => { scale.value = withSpring(1, ANIMATION.springBouncy); }}
      style={[styles.row, pressStyle]}
    >
      <View style={[styles.rowIcon, { backgroundColor: tint || colors.backgroundLight }]}>
        <Ionicons name={icon} size={18} color={tint ? '#FFFFFF' : colors.primary} />
      </View>
      <View style={[styles.rowBody, !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderCard }]}>
        <Text style={[styles.rowLabel, { color: tint ? colors.error : colors.textDark }]}>{label}</Text>
        <View style={styles.rowRight}>
          {value ? <Text style={[styles.rowValue, { color: colors.textLight }]}>{value}</Text> : null}
          <Ionicons name="chevron-forward" size={18} color={colors.indicatorInactive} />
        </View>
      </View>
    </AnimatedPressable>
  );
}

// ── Appearance view ────────────────────────────────────────────────────────

function AppearanceView({ theme, onBack }: { theme: AppTheme; onBack: () => void }) {
  const { colors, shadows, themePreference, setThemePreference } = theme;

  const options = [
    { key: 'system' as const, label: 'System', icon: 'phone-portrait-outline' as const, desc: 'Match device settings' },
    { key: 'light' as const, label: 'Light', icon: 'sunny-outline' as const, desc: 'Always use light mode' },
    { key: 'dark' as const, label: 'Dark', icon: 'moon-outline' as const, desc: 'Always use dark mode' },
  ];

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.subHeader}>
        <Pressable onPress={onBack} style={styles.backButton} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color={colors.textDark} />
        </Pressable>
        <Text style={[styles.subTitle, { color: colors.textDark }]}>Appearance</Text>
        <View style={{ width: 32 }} />
      </View>
      <Text style={[styles.subSubtitle, { color: colors.textLight }]}>Choose your preferred theme</Text>
      <View style={{ gap: 10, marginTop: 8 }}>
        {options.map((option) => {
          const isSelected = themePreference === option.key;
          return (
            <Pressable
              key={option.key}
              style={[styles.voiceCard, { backgroundColor: colors.white, borderColor: isSelected ? colors.primary : 'transparent' }, shadows.card, isSelected && { backgroundColor: colors.backgroundLight }]}
              onPress={() => setThemePreference(option.key)}
            >
              <View style={[styles.voiceAvatar, { backgroundColor: isSelected ? colors.primary : colors.backgroundLight, alignItems: 'center', justifyContent: 'center' }]}>
                <Ionicons name={option.icon} size={20} color={isSelected ? '#FFFFFF' : colors.primary} />
              </View>
              <View style={styles.voiceInfo}>
                <Text style={[styles.voiceName, { color: isSelected ? colors.primary : colors.textDark }]}>{option.label}</Text>
                <Text style={[styles.voiceDesc, { color: colors.textLight }]}>{option.desc}</Text>
              </View>
              {isSelected && <Ionicons name="checkmark-circle" size={24} color={colors.primary} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ── Text Size view ─────────────────────────────────────────────────────────

function TextSizeView({ theme, onBack }: { theme: AppTheme; onBack: () => void }) {
  const { colors, shadows, textSizePreference, setTextSizePreference } = theme;

  const options = [
    { key: 'small' as const, label: 'Small', icon: 'remove-circle-outline' as const, desc: 'Slightly smaller text throughout the app', preview: 15 },
    { key: 'default' as const, label: 'Default', icon: 'ellipse-outline' as const, desc: 'Standard text size', preview: 18 },
    { key: 'large' as const, label: 'Large', icon: 'add-circle-outline' as const, desc: 'Larger, easier-to-read text', preview: 21 },
  ];

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.subHeader}>
        <Pressable onPress={onBack} style={styles.backButton} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color={colors.textDark} />
        </Pressable>
        <Text style={[styles.subTitle, { color: colors.textDark }]}>Text Size</Text>
        <View style={{ width: 32 }} />
      </View>
      <Text style={[styles.subSubtitle, { color: colors.textLight }]}>Choose a comfortable reading size</Text>
      <View style={{ gap: 10, marginTop: 8 }}>
        {options.map((option) => {
          const isSelected = textSizePreference === option.key;
          return (
            <Pressable
              key={option.key}
              style={[styles.voiceCard, { backgroundColor: colors.white, borderColor: isSelected ? colors.primary : 'transparent' }, shadows.card, isSelected && { backgroundColor: colors.backgroundLight }]}
              onPress={() => setTextSizePreference(option.key)}
            >
              <View style={[styles.voiceAvatar, { backgroundColor: isSelected ? colors.primary : colors.backgroundLight, alignItems: 'center', justifyContent: 'center' }]}>
                <Ionicons name={option.icon} size={20} color={isSelected ? '#FFFFFF' : colors.primary} />
              </View>
              <View style={styles.voiceInfo}>
                <Text style={[styles.voiceName, { color: isSelected ? colors.primary : colors.textDark }]}>{option.label}</Text>
                <Text style={[styles.voiceDesc, { color: colors.textLight }]}>{option.desc}</Text>
              </View>
              <Text style={{ fontSize: option.preview, color: isSelected ? colors.primary : colors.textLight, fontWeight: '700' }}>Aa</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ── Voice view ─────────────────────────────────────────────────────────────

function VoiceView({
  theme,
  selectedVoice,
  onSelectVoice,
  onBack,
}: {
  theme: AppTheme;
  selectedVoice: string;
  onSelectVoice: (id: string) => void;
  onBack: () => void;
}) {
  const { colors, shadows } = theme;
  const player = useAudioPlayer();
  const playerStatus = useAudioPlayerStatus(player);
  const [playingVoiceId, setPlayingVoiceId] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  useEffect(() => {
    if (playerStatus.isLoaded && playerStatus.didJustFinish) {
      setPlayingVoiceId(null);
    }
  }, [playerStatus.didJustFinish, playerStatus.isLoaded]);

  // Stop audio when leaving VoiceView
  useEffect(() => {
    return () => {
      player.pause();
    };
  }, [player]);

  const handlePlaySample = async (voiceId: string) => {
    try {
      if (playingVoiceId === voiceId) {
        player.pause();
        setPlayingVoiceId(null);
        return;
      }
      setIsLoading(true);
      setPlayingVoiceId(voiceId);
      const uri = await generateSpeech('The quick brown fox jumps over the lazy dog.', voiceId);
      if (uri) {
        player.replace(uri);
        player.play();
      } else {
        setPlayingVoiceId(null);
      }
    } catch {
      setPlayingVoiceId(null);
    } finally {
      setIsLoading(false);
    }
  };

  const voicesByAccent = React.useMemo(() => {
    const groups: Record<string, typeof VOICE_META[string][]> = {};
    Object.values(VOICE_META).forEach((v) => {
      const accent = v.accent || 'Other';
      if (!groups[accent]) groups[accent] = [];
      groups[accent].push(v);
    });
    return groups;
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.subHeader}>
        <Pressable onPress={onBack} style={styles.backButton} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color={colors.textDark} />
        </Pressable>
        <Text style={[styles.subTitle, { color: colors.textDark }]}>Voice</Text>
        <View style={{ width: 32 }} />
      </View>
      <Text style={[styles.subSubtitle, { color: colors.textLight }]}>Select a companion for your journey</Text>
      <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 8 }}>
        {['American', 'British', 'Australian'].map((accent) => {
          const voices = voicesByAccent[accent];
          if (!voices?.length) return null;
          return (
            <View key={accent}>
              <Text style={[styles.accentLabel, { color: colors.textLight }]}>{accent}</Text>
              <View style={{ gap: 10, marginBottom: 8 }}>
                {voices.map((voice) => {
                  const isSelected = selectedVoice === voice.id;
                  const isPlaying = playingVoiceId === voice.id;
                  return (
                    <Pressable
                      key={voice.id}
                      style={[styles.voiceCard, { backgroundColor: colors.white, borderColor: isSelected ? colors.primary : 'transparent' }, shadows.card, isSelected && { backgroundColor: colors.backgroundLight }]}
                      onPress={() => onSelectVoice(voice.id)}
                    >
                      {voice.image ? (
                        <Image source={voice.image} style={[styles.voiceAvatar, { backgroundColor: colors.backgroundLight }]} />
                      ) : (
                        <View style={[styles.voiceAvatar, { backgroundColor: voice.color, alignItems: 'center', justifyContent: 'center' }]}>
                          <Text style={styles.voiceInitial}>{voice.initial}</Text>
                        </View>
                      )}
                      <View style={styles.voiceInfo}>
                        <Text style={[styles.voiceName, { color: isSelected ? colors.primary : colors.textDark }]}>{voice.name}</Text>
                        <Text style={[styles.voiceDesc, { color: colors.textLight, opacity: isSelected ? 0.8 : 1 }]}>{voice.description}</Text>
                      </View>
                      <Pressable
                        style={[styles.playButton, { backgroundColor: isPlaying ? colors.primary : colors.backgroundLight }]}
                        onPress={(e) => { e.stopPropagation(); handlePlaySample(voice.id); }}
                      >
                        {isLoading && isPlaying ? (
                          <ActivityIndicator size="small" color={isPlaying ? '#FFFFFF' : colors.primary} />
                        ) : (
                          <Ionicons name={isPlaying ? 'stop' : 'play'} size={16} color={isPlaying ? '#FFFFFF' : colors.primary} />
                        )}
                      </Pressable>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ── About view ────────────────────────────────────────────────────────────

function AboutView({ theme, onBack }: { theme: AppTheme; onBack: () => void }) {
  const { colors, shadows } = theme;
  return (
    <View style={{ flex: 1 }}>
      <View style={styles.subHeader}>
        <Pressable onPress={onBack} style={styles.backButton} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color={colors.textDark} />
        </Pressable>
        <Text style={[styles.subTitle, { color: colors.textDark }]}>About SchoolKit</Text>
        <View style={{ width: 32 }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24, alignItems: 'center' }}>
        <Image
          source={require('../assets/images/SchoolKit.png')}
          style={{ width: 80, height: 80, resizeMode: 'contain', marginVertical: 16 }}
        />
        <Text style={[styles.subTitle, { color: colors.textDark, marginBottom: 20 }]}>SchoolKit</Text>

        <View style={[styles.groupCard, { backgroundColor: colors.white, ...shadows.card, width: '100%', padding: 16 }]}>
          <Text style={[styles.cardLabel, { color: colors.textLight }]}>OUR MISSION</Text>
          <Text style={[styles.cardBody, { color: colors.textDark }]}>
            Cancer survivors who are returning to school, their parents, and their education team need a centralized, accessible platform that addresses the shared educational and social challenges of re-entry — in order to support a smoother transition back into the school environment.
          </Text>
        </View>

        <View style={[styles.groupCard, { backgroundColor: colors.white, ...shadows.card, width: '100%', paddingHorizontal: 16 }]}>
          <Text style={[styles.cardLabel, { color: colors.textLight, paddingTop: 16 }]}>WHO IT'S FOR</Text>
          {[
            { icon: 'school-outline' as const, label: 'Students', desc: 'Young cancer survivors navigating their return to school after treatment.' },
            { icon: 'people-outline' as const, label: 'Parents & Caregivers', desc: 'Families supporting their child through the re-entry process.' },
            { icon: 'briefcase-outline' as const, label: 'School Staff', desc: 'Teachers and staff creating an inclusive environment for returning students.' },
          ].map((item, i) => (
            <View key={item.label} style={[styles.whoRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderCard }]}>
              <View style={[styles.whoIcon, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name={item.icon} size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.voiceName, { color: colors.textDark }]}>{item.label}</Text>
                <Text style={[styles.voiceDesc, { color: colors.textLight }]}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

// ── FAQ view ───────────────────────────────────────────────────────────────

function FAQItem({ item, index, colors }: { item: { q: string; a: string }; index: number; colors: any }) {
  const [expanded, setExpanded] = React.useState(false);
  return (
    <Pressable
      onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setExpanded(v => !v); }}
      style={[styles.faqRow, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderCard }, expanded && { backgroundColor: colors.backgroundLight }]}
    >
      <View style={styles.faqRowHeader}>
        <Text style={[styles.faqQuestion, { color: colors.textDark }]}>{item.q}</Text>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.indicatorInactive} />
      </View>
      {expanded && <Text style={[styles.faqAnswer, { color: colors.textLight }]}>{item.a}</Text>}
    </Pressable>
  );
}

function FAQView({ theme, onBack }: { theme: AppTheme; onBack: () => void }) {
  const { colors, shadows } = theme;
  return (
    <View style={{ flex: 1 }}>
      <View style={styles.subHeader}>
        <Pressable onPress={onBack} style={styles.backButton} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color={colors.textDark} />
        </Pressable>
        <Text style={[styles.subTitle, { color: colors.textDark }]}>FAQ</Text>
        <View style={{ width: 32 }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={[styles.groupCard, { backgroundColor: colors.white, ...shadows.card }]}>
          {FAQS.map((item, i) => (
            <FAQItem key={i} item={item} index={i} colors={colors} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

// ── Feedback view ──────────────────────────────────────────────────────────

const MAX_CHARS = 300;

function FeedbackView({ theme, onBack }: { theme: AppTheme; onBack: () => void }) {
  const { colors, shadows } = theme;
  const { data } = useOnboarding();
  const { user } = useAuth();
  const [feedbackText, setFeedbackText] = React.useState('');
  const [isFocused, setIsFocused] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [submitError, setSubmitError] = React.useState(false);

  const handleSubmit = async () => {
    if (!feedbackText.trim() || isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(false);
    try {
      const { error } = await supabase.from('user_questions').insert({ user_id: user?.id ?? null, question: feedbackText.trim(), role: data.role ?? null });
      if (error) throw error;
      setFeedbackText('');
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
    } catch {
      setSubmitError(true);
      setTimeout(() => setSubmitError(false), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.subHeader}>
        <Pressable onPress={onBack} style={styles.backButton} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color={colors.textDark} />
        </Pressable>
        <Text style={[styles.subTitle, { color: colors.textDark }]}>Share Feedback</Text>
        <View style={{ width: 32 }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={[styles.groupCard, { backgroundColor: colors.white, ...shadows.card }]}>
          {submitted ? (
            <View style={styles.thankYou}>
              <Ionicons name="checkmark-circle" size={44} color={colors.primary} />
              <Text style={[styles.voiceName, { color: colors.textDark, marginTop: 8 }]}>Thank you!</Text>
              <Text style={[styles.voiceDesc, { color: colors.textLight, textAlign: 'center', marginTop: 4 }]}>
                We hope to add your suggestions to a future version of SchoolKit.
              </Text>
            </View>
          ) : submitError ? (
            <View style={styles.thankYou}>
              <Ionicons name="alert-circle" size={44} color="#E74C3C" />
              <Text style={[styles.voiceName, { color: colors.textDark, marginTop: 8 }]}>Failed to send</Text>
              <Text style={[styles.voiceDesc, { color: colors.textLight, textAlign: 'center', marginTop: 4 }]}>
                Please check your connection and try again.
              </Text>
            </View>
          ) : (
            <View style={styles.feedbackInner}>
              <Text style={[styles.voiceDesc, { color: colors.textLight, marginBottom: 14, lineHeight: 20 }]}>
                Have a question or suggestion? Share it here — every submission is read and considered.
              </Text>
              <TextInput
                style={[styles.feedbackInput, { backgroundColor: colors.appBackground, borderColor: isFocused ? colors.primary : colors.borderCard, color: colors.textDark }]}
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
              <Pressable
                style={[styles.submitButton, { backgroundColor: feedbackText.trim().length > 0 && !isSubmitting ? colors.primary : colors.indicatorInactive }]}
                onPress={handleSubmit}
                disabled={!feedbackText.trim() || isSubmitting}
              >
                {isSubmitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitText}>Submit</Text>}
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// ── Main settings sheet ────────────────────────────────────────────────────

export function SettingsSheet() {
  const { isOpen, close } = useSettings();
  const router = useRouter();
  const theme = useTheme();
  const { colors, shadows } = theme;
  const { signOut } = useAuth();
  const { downloadAllResources, downloads, selectedVoice, updateVoice, resetOnboarding } = useOnboarding();
  const [currentView, setCurrentView] = React.useState<SheetView>('main');

  // Reset to main view whenever sheet opens
  useEffect(() => { if (isOpen) setCurrentView('main'); }, [isOpen]);

  const handleClose = () => close();

  // Swipe-down or tap-handle to dismiss
  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 60) {
          close();
        } else if (Math.abs(gestureState.dy) < 10 && Math.abs(gestureState.dx) < 10) {
          close();
        }
      },
    })
  ).current;

  const handleRetakeSurvey = () => {
    close();
    Alert.alert('Retake Survey', 'This will reset your profile. Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Retake', style: 'destructive', onPress: () => { resetOnboarding(); router.replace('/onboarding/step1'); } },
    ]);
  };

  const handleDownloadAll = () => {
    const allDownloaded = downloads.length >= ALL_RESOURCES.length;
    if (allDownloaded) {
      Alert.alert('Already Downloaded', 'All resources are already available offline.');
    } else {
      Alert.alert('Download All Resources', 'This will save all resources for offline access.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Download All', onPress: async () => { await downloadAllResources(); Alert.alert('Success', 'All resources are now available offline!'); } },
      ]);
    }
  };

  const handleSignOut = async () => {
    if (Platform.OS === 'web') {
      if (!window.confirm('Are you sure you want to sign out?')) return;
      try { await signOut(); close(); router.replace('/welcome'); }
      catch (err: any) { window.alert(err.message || 'Sign out failed.'); }
    } else {
      Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out', style: 'destructive', onPress: async () => {
            try { await signOut(); close(); router.replace('/welcome'); }
            catch (err: any) { Alert.alert('Sign Out Failed', err.message || 'Something went wrong.'); }
          },
        },
      ]);
    }
  };

  const appearanceLabel = theme.themePreference === 'system' ? 'System' : theme.themePreference === 'light' ? 'Light' : 'Dark';
  const textSizeLabel = theme.textSizePreference === 'small' ? 'Small' : theme.textSizePreference === 'large' ? 'Large' : 'Default';
  const voiceName = Object.values(VOICE_META).find(m => m.id === selectedVoice)?.name || 'Peter';

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose}>
          <View style={styles.backdrop} />
        </Pressable>

        <View style={[styles.sheet, { backgroundColor: colors.appBackground }]}>
          <View style={styles.handleArea} {...panResponder.panHandlers}>
            <View style={[styles.handle, { backgroundColor: colors.borderCard }]} />
          </View>

          {currentView === 'main' && (
            <>
              <Text style={[styles.sheetTitle, { color: colors.textDark }]}>Settings</Text>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
                <View style={[styles.groupCard, { backgroundColor: colors.white, ...shadows.card }]}>
                  <SheetRow icon="moon-outline" label="Appearance" value={appearanceLabel} onPress={() => setCurrentView('appearance')} theme={theme} />
                  <SheetRow icon="text-outline" label="Text Size" value={textSizeLabel} onPress={() => setCurrentView('textsize')} theme={theme} />
                  <SheetRow icon="mic-outline" label="Voice" value={voiceName} onPress={() => setCurrentView('voice')} theme={theme} />
                  {Platform.OS === 'web' && (
                    <SheetRow icon="color-palette-outline" label="Design Editor" value="Create visuals" onPress={() => { close(); router.push('/(editor)/designs'); }} theme={theme} />
                  )}
                  <SheetRow icon="cloud-download-outline" label="Download All" value={downloads.length >= ALL_RESOURCES.length ? 'All saved' : `${downloads.length}/${ALL_RESOURCES.length}`} onPress={handleDownloadAll} theme={theme} />
                  <SheetRow icon="refresh-outline" label="Retake Survey" onPress={handleRetakeSurvey} theme={theme} />
                  <SheetRow icon="information-circle-outline" label="About SchoolKit" onPress={() => setCurrentView('about')} theme={theme} />
                  <SheetRow icon="help-circle-outline" label="Frequently Asked Questions" onPress={() => setCurrentView('faq')} theme={theme} />
                  <SheetRow icon="chatbubble-ellipses-outline" label="Share Feedback" onPress={() => setCurrentView('feedback')} isLast theme={theme} />
                </View>
                <View style={[styles.groupCard, { backgroundColor: colors.white, ...shadows.card }]}>
                  <SheetRow icon="log-out-outline" label="Sign Out" onPress={handleSignOut} tint={colors.error} isLast theme={theme} />
                </View>
              </ScrollView>
            </>
          )}

          {currentView === 'appearance' && (
            <View style={{ flex: 1 }}>
              <AppearanceView theme={theme} onBack={() => setCurrentView('main')} />
            </View>
          )}

          {currentView === 'textsize' && (
            <View style={{ flex: 1 }}>
              <TextSizeView theme={theme} onBack={() => setCurrentView('main')} />
            </View>
          )}

          {currentView === 'voice' && (
            <View style={{ flex: 1 }}>
              <VoiceView
                theme={theme}
                selectedVoice={selectedVoice}
                onSelectVoice={(id) => { updateVoice(id); }}
                onBack={() => setCurrentView('main')}
              />
            </View>
          )}

          {currentView === 'about' && (
            <View style={{ flex: 1 }}>
              <AboutView theme={theme} onBack={() => setCurrentView('main')} />
            </View>
          )}

          {currentView === 'faq' && (
            <View style={{ flex: 1 }}>
              <FAQView theme={theme} onBack={() => setCurrentView('main')} />
            </View>
          )}

          {currentView === 'feedback' && (
            <View style={{ flex: 1 }}>
              <FeedbackView theme={theme} onBack={() => setCurrentView('main')} />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  backdrop: { flex: 1 },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: SPACING.screenPadding,
    paddingTop: 12,
    paddingBottom: 40,
    height: '88%',
  },
  handleArea: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
  },
  groupCard: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14,
    paddingRight: 16,
    minHeight: 52,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: 12,
    paddingVertical: 14,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 12,
  },
  rowValue: {
    fontSize: 15,
    fontWeight: '400',
  },

  // Sub-views
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  subSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  accentLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 16,
    marginLeft: 4,
  },
  voiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 2,
  },
  voiceAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  voiceInitial: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  voiceInfo: { flex: 1 },
  voiceName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  voiceDesc: { fontSize: 13, lineHeight: 18 },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // About
  cardLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.9,
    marginBottom: 10,
  },
  cardBody: {
    fontSize: 15,
    lineHeight: 24,
  },
  whoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    gap: 12,
  },
  whoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // FAQ
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

  // Feedback
  feedbackInner: {
    padding: 16,
  },
  feedbackInput: {
    borderRadius: 12,
    borderWidth: 1.5,
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
    marginBottom: 14,
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
  thankYou: {
    padding: 32,
    alignItems: 'center',
  },
});
