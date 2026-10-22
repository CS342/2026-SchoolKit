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
import { useTranslation } from 'react-i18next';
import { useSettings } from '../contexts/SettingsContext';
import { useOnboarding } from '../contexts/OnboardingContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useTheme } from '../contexts/ThemeContext';
import { VOICE_META, generateSpeech, voicesFor, voiceDescription, toVoiceLang, SHOW_VOICE_AVATARS, type VoiceLang } from '../services/elevenLabs';
import { useResources } from '../hooks/useResources';
import { ANIMATION, SPACING } from '../constants/onboarding-theme';
import type { AppTheme } from '../constants/theme';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type SheetView = 'main' | 'voice' | 'appearance' | 'about' | 'faq' | 'feedback' | 'language';

// Stable keys for the FAQ list; the question/answer text lives in the `profile`
// locale namespace (profile.faq.<key>.q / profile.faqSheet.<key>.a).
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

// ── Language view ──────────────────────────────────────────────────────────

function LanguageView({ theme, onBack }: { theme: AppTheme; onBack: () => void }) {
  const { t } = useTranslation();
  const { colors, shadows } = theme;
  const { preferredLanguage, updatePreferredLanguage } = useOnboarding();

  const options = [
    { key: 'english' as const, label: 'English', icon: 'language-outline' as const, desc: 'Use English for resources and navigation' },
    { key: 'spanish' as const, label: 'Español', icon: 'language-outline' as const, desc: 'Usar español para recursos y navegación' },
  ];

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.subHeader}>
        <Pressable onPress={onBack} style={styles.backButton} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color={colors.textDark} />
        </Pressable>
        <Text style={[styles.subTitle, { color: colors.textDark }]}>{t('profile.language')}</Text>
        <View style={{ width: 32 }} />
      </View>
      <Text style={[styles.subSubtitle, { color: colors.textLight }]}>{t('profile.chooseLanguage')}</Text>
      <View style={{ gap: 10, marginTop: 8 }}>
        {options.map((option) => {
          const isSelected = preferredLanguage === option.key;
          return (
            <Pressable
              key={option.key}
              style={[styles.voiceCard, { backgroundColor: colors.white, borderColor: isSelected ? colors.primary : 'transparent' }, shadows.card, isSelected && { backgroundColor: colors.backgroundLight }]}
              onPress={() => updatePreferredLanguage(option.key)}
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

// ── Appearance view ────────────────────────────────────────────────────────

function AppearanceView({ theme, onBack }: { theme: AppTheme; onBack: () => void }) {
  const { t } = useTranslation();
  const { colors, shadows, themePreference, setThemePreference } = theme;

  const options = [
    { key: 'system' as const, label: t('profile.appearanceSystem'), icon: 'phone-portrait-outline' as const, desc: t('profile.appearanceSystemDesc') },
    { key: 'light' as const, label: t('profile.appearanceLight'), icon: 'sunny-outline' as const, desc: t('profile.appearanceLightDesc') },
    { key: 'dark' as const, label: t('profile.appearanceDark'), icon: 'moon-outline' as const, desc: t('profile.appearanceDarkDesc') },
  ];

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.subHeader}>
        <Pressable onPress={onBack} style={styles.backButton} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color={colors.textDark} />
        </Pressable>
        <Text style={[styles.subTitle, { color: colors.textDark }]}>{t('profile.appearance')}</Text>
        <View style={{ width: 32 }} />
      </View>
      <Text style={[styles.subSubtitle, { color: colors.textLight }]}>{t('profile.chooseTheme')}</Text>
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

// ── Voice view ─────────────────────────────────────────────────────────────

function VoiceView({
  theme,
  lang,
  selectedVoice,
  onSelectVoice,
  onBack,
}: {
  theme: AppTheme;
  /** The app language — only guides who read it natively are offered. */
  lang: VoiceLang;
  selectedVoice: string;
  onSelectVoice: (id: string) => void;
  onBack: () => void;
}) {
  const { t } = useTranslation();
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
      const sampleText = t('auth.voice.sampleIntro', { name: VOICE_META[voiceId]?.name ?? '' });
      const uri = await generateSpeech(sampleText, voiceId);
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

  const voices = React.useMemo(() => voicesFor(lang), [lang]);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.subHeader}>
        <Pressable onPress={onBack} style={styles.backButton} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color={colors.textDark} />
        </Pressable>
        <Text style={[styles.subTitle, { color: colors.textDark }]}>{t('profile.voice')}</Text>
        <View style={{ width: 32 }} />
      </View>
      <Text style={[styles.subSubtitle, { color: colors.textLight }]}>{t('profile.selectCompanion')}</Text>
      <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 8 }}>
        <View style={{ gap: 10, marginBottom: 8 }}>
          {voices.map((voice) => {
            const isSelected = selectedVoice === voice.id;
            const isPlaying = playingVoiceId === voice.id;
            return (
              <Pressable
                key={voice.id}
                style={[styles.voiceCard, { backgroundColor: colors.white, borderColor: isSelected ? colors.primary : 'transparent' }, shadows.card, isSelected && { backgroundColor: colors.backgroundLight }]}
                onPress={() => onSelectVoice(voice.id)}
                accessibilityRole="radio"
                accessibilityLabel={`${voice.name}, ${t(`auth.voice.accents.${voice.accent}`)}`}
                accessibilityState={{ selected: isSelected }}
              >
                {SHOW_VOICE_AVATARS && voice.image ? (
                  <Image source={voice.image} style={[styles.voiceAvatar, { backgroundColor: colors.backgroundLight }]} />
                ) : (
                  <View style={[styles.voiceAvatar, { backgroundColor: voice.color, alignItems: 'center', justifyContent: 'center' }]}>
                    <Text style={styles.voiceInitial}>{voice.initial}</Text>
                  </View>
                )}
                <View style={styles.voiceInfo}>
                  <Text style={[styles.voiceName, { color: isSelected ? colors.primary : colors.textDark }]}>{voice.name}</Text>
                  <Text style={[styles.voiceDesc, { color: colors.textLight, opacity: isSelected ? 0.8 : 1 }]}>{voiceDescription(voice, lang)}</Text>
                  <Text style={[styles.voiceDesc, { color: colors.textLight, fontSize: 12, fontWeight: '600', marginTop: 2 }]}>{t(`auth.voice.accents.${voice.accent}`)}</Text>
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
      </ScrollView>
    </View>
  );
}

// ── About view ────────────────────────────────────────────────────────────

function AboutView({ theme, onBack }: { theme: AppTheme; onBack: () => void }) {
  const { t } = useTranslation();
  const { colors, shadows } = theme;
  return (
    <View style={{ flex: 1 }}>
      <View style={styles.subHeader}>
        <Pressable onPress={onBack} style={styles.backButton} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color={colors.textDark} />
        </Pressable>
        <Text style={[styles.subTitle, { color: colors.textDark }]}>{t('profile.aboutTitle')}</Text>
        <View style={{ width: 32 }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24, alignItems: 'center' }}>
        <Image
          source={require('../assets/images/SchoolKit.png')}
          style={{ width: 80, height: 80, resizeMode: 'contain', marginVertical: 16 }}
        />
        <Text style={[styles.subTitle, { color: colors.textDark, marginBottom: 20 }]}>SchoolKit</Text>

        <View style={[styles.groupCard, { backgroundColor: colors.white, ...shadows.card, width: '100%', padding: 16 }]}>
          <Text style={[styles.cardLabel, { color: colors.textLight }]}>{t('profile.ourMission')}</Text>
          <Text style={[styles.cardBody, { color: colors.textDark }]}>
            {t('profile.aboutMissionBodySheet')}
          </Text>
        </View>

        <View style={[styles.groupCard, { backgroundColor: colors.white, ...shadows.card, width: '100%', paddingHorizontal: 16 }]}>
          <Text style={[styles.cardLabel, { color: colors.textLight, paddingTop: 16 }]}>{t('profile.whoItsFor')}</Text>
          {[
            { icon: 'school-outline' as const, label: t('profile.whoStudents'), desc: t('profile.whoStudentsDesc') },
            { icon: 'people-outline' as const, label: t('profile.whoParents'), desc: t('profile.whoParentsDesc') },
            { icon: 'briefcase-outline' as const, label: t('profile.whoStaff'), desc: t('profile.whoStaffDesc') },
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
  const { t } = useTranslation();
  const { colors, shadows } = theme;
  return (
    <View style={{ flex: 1 }}>
      <View style={styles.subHeader}>
        <Pressable onPress={onBack} style={styles.backButton} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color={colors.textDark} />
        </Pressable>
        <Text style={[styles.subTitle, { color: colors.textDark }]}>{t('profile.faqShort')}</Text>
        <View style={{ width: 32 }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={[styles.groupCard, { backgroundColor: colors.white, ...shadows.card }]}>
          {FAQ_KEYS.map((key, i) => (
            <FAQItem
              key={key}
              item={{ q: t(`profile.faq.${key}.q`), a: t(`profile.faqSheet.${key}.a`) }}
              index={i}
              colors={colors}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

// ── Feedback view ──────────────────────────────────────────────────────────

const MAX_CHARS = 300;

function FeedbackView({ theme, onBack }: { theme: AppTheme; onBack: () => void }) {
  const { t } = useTranslation();
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
        <Text style={[styles.subTitle, { color: colors.textDark }]}>{t('profile.shareFeedback')}</Text>
        <View style={{ width: 32 }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={[styles.groupCard, { backgroundColor: colors.white, ...shadows.card }]}>
          {submitted ? (
            <View style={styles.thankYou}>
              <Ionicons name="checkmark-circle" size={44} color={colors.primary} />
              <Text style={[styles.voiceName, { color: colors.textDark, marginTop: 8 }]}>{t('profile.thankYou')}</Text>
              <Text style={[styles.voiceDesc, { color: colors.textLight, textAlign: 'center', marginTop: 4 }]}>
                {t('profile.thankYouBody')}
              </Text>
            </View>
          ) : submitError ? (
            <View style={styles.thankYou}>
              <Ionicons name="alert-circle" size={44} color="#E74C3C" />
              <Text style={[styles.voiceName, { color: colors.textDark, marginTop: 8 }]}>{t('profile.feedbackFailed')}</Text>
              <Text style={[styles.voiceDesc, { color: colors.textLight, textAlign: 'center', marginTop: 4 }]}>
                {t('profile.feedbackFailedBody')}
              </Text>
            </View>
          ) : (
            <View style={styles.feedbackInner}>
              <Text style={[styles.voiceDesc, { color: colors.textLight, marginBottom: 14, lineHeight: 20 }]}>
                {t('profile.feedbackDescriptionShort')}
              </Text>
              <TextInput
                style={[styles.feedbackInput, { backgroundColor: colors.appBackground, borderColor: isFocused ? colors.primary : colors.borderCard, color: colors.textDark }]}
                value={feedbackText}
                onChangeText={(text) => setFeedbackText(text.slice(0, MAX_CHARS))}
                placeholder={t('profile.feedbackPlaceholder')}
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
                {isSubmitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitText}>{t('common.submit')}</Text>}
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
  const { t } = useTranslation();
  const { isOpen, close } = useSettings();
  const router = useRouter();
  const theme = useTheme();
  const { colors, shadows } = theme;
  const { signOut, isAdmin } = useAuth();
  const { downloadAllResources, downloads, selectedVoice, updateVoice, resetOnboarding, preferredLanguage } = useOnboarding();
  // Count against what the Library lists for this viewer (published pages included,
  // hidden built-ins excluded), not the static built-in list.
  const { resources } = useResources();
  const libraryIds = resources.filter((r) => !r.designOnly).map((r) => r.id);
  const savedCount = libraryIds.filter((id) => downloads.includes(id)).length;
  const allDownloaded = libraryIds.length > 0 && savedCount === libraryIds.length;
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
    if (Platform.OS === 'web') {
      if (!window.confirm(t('profile.retakeConfirm'))) return;
      resetOnboarding();
      router.replace('/onboarding/step1');
      return;
    }
    Alert.alert(t('profile.retakeSurvey'), t('profile.retakeConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('profile.retakeAction'), style: 'destructive', onPress: () => { resetOnboarding(); router.replace('/onboarding/step1'); } },
    ]);
  };

  const handleDownloadAll = () => {
    if (allDownloaded) {
      if (Platform.OS === 'web') {
        window.alert(`${t('profile.alreadyDownloaded')}\n${t('profile.alreadyDownloadedBody')}`);
      } else {
        Alert.alert(t('profile.alreadyDownloaded'), t('profile.alreadyDownloadedBody'));
      }
    } else if (Platform.OS === 'web') {
      if (!window.confirm(`${t('profile.downloadAllTitle')}\n${t('profile.downloadAllBody')}`)) return;
      downloadAllResources(libraryIds).then(() => { window.alert(`${t('profile.downloadSuccessTitle')}\n${t('profile.downloadSuccessBody')}`); });
    } else {
      Alert.alert(t('profile.downloadAllTitle'), t('profile.downloadAllBody'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('profile.downloadAll'), onPress: async () => { await downloadAllResources(libraryIds); Alert.alert(t('profile.downloadSuccessTitle'), t('profile.downloadSuccessBody')); } },
      ]);
    }
  };

  const handleSignOut = async () => {
    if (Platform.OS === 'web') {
      if (!window.confirm(t('profile.signOutConfirm'))) return;
      try { await signOut(); close(); router.replace('/welcome'); }
      catch (err: any) { window.alert(err.message || t('profile.signOutFailedBody')); }
    } else {
      Alert.alert(t('profile.signOut'), t('profile.signOutConfirm'), [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('profile.signOut'), style: 'destructive', onPress: async () => {
            try { await signOut(); close(); router.replace('/welcome'); }
            catch (err: any) { Alert.alert(t('profile.signOutFailed'), err.message || t('common.error')); }
          },
        },
      ]);
    }
  };

  const appearanceLabel = theme.themePreference === 'system' ? t('profile.appearanceSystem') : theme.themePreference === 'light' ? t('profile.appearanceLight') : t('profile.appearanceDark');
  const voiceName = VOICE_META[selectedVoice]?.name ?? '';
  const languageLabel = preferredLanguage === 'english' ? 'English' : 'Español';

  const isWeb = Platform.OS === 'web';

  return (
    <Modal visible={isOpen} transparent animationType={isWeb ? 'fade' : 'slide'} onRequestClose={handleClose}>
      <View style={[styles.overlay, isWeb && styles.overlayWeb]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose}>
          <View style={styles.backdrop} />
        </Pressable>

        <View style={[styles.sheet, { backgroundColor: colors.appBackground }, isWeb && styles.sheetWeb]}>
          {!isWeb && (
            <View style={styles.handleArea} {...panResponder.panHandlers}>
              <View style={[styles.handle, { backgroundColor: colors.borderCard }]} />
            </View>
          )}

          {currentView === 'main' && (
            <>
              <Text style={[styles.sheetTitle, { color: colors.textDark }]}>{t('profile.settings')}</Text>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
                <View style={[styles.groupCard, { backgroundColor: colors.white, ...shadows.card }]}>
                  <SheetRow icon="moon-outline" label={t('profile.appearance')} value={appearanceLabel} onPress={() => setCurrentView('appearance')} theme={theme} />
                  <SheetRow icon="language-outline" label={t('profile.language')} value={languageLabel} onPress={() => setCurrentView('language')} theme={theme} />
                  <SheetRow icon="mic-outline" label={t('profile.voice')} value={voiceName} onPress={() => setCurrentView('voice')} theme={theme} />
                  {Platform.OS === 'web' && isAdmin && (
                    <SheetRow icon="color-palette-outline" label={t('profile.designEditor')} value={t('profile.designEditorValue')} onPress={() => { close(); router.push('/(editor)/designs'); }} theme={theme} />
                  )}
                  {/* Content Pages now lives as a top-level admin tab in the left sidebar (PersistentSidebar). */}
                  <SheetRow icon="cloud-download-outline" label={t('profile.downloadAll')} value={allDownloaded ? t('profile.allSaved') : `${savedCount}/${libraryIds.length}`} onPress={handleDownloadAll} theme={theme} />
                  <SheetRow icon="refresh-outline" label={t('profile.retakeSurvey')} onPress={handleRetakeSurvey} theme={theme} />
                  <SheetRow icon="information-circle-outline" label={t('profile.aboutTitle')} onPress={() => setCurrentView('about')} theme={theme} />
                  <SheetRow icon="help-circle-outline" label={t('profile.faqTitle')} onPress={() => setCurrentView('faq')} theme={theme} />
                  <SheetRow icon="chatbubble-ellipses-outline" label={t('profile.shareFeedback')} onPress={() => setCurrentView('feedback')} isLast theme={theme} />
                </View>
                <View style={[styles.groupCard, { backgroundColor: colors.white, ...shadows.card }]}>
                  <SheetRow icon="log-out-outline" label={t('profile.signOut')} onPress={handleSignOut} tint={colors.error} isLast theme={theme} />
                </View>
              </ScrollView>
            </>
          )}

          {currentView === 'appearance' && (
            <View style={{ flex: 1 }}>
              <AppearanceView theme={theme} onBack={() => setCurrentView('main')} />
            </View>
          )}

          {currentView === 'voice' && (
            <View style={{ flex: 1 }}>
              <VoiceView
                theme={theme}
                lang={toVoiceLang(preferredLanguage)}
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

          {currentView === 'language' && (
            <View style={{ flex: 1 }}>
              <LanguageView theme={theme} onBack={() => setCurrentView('main')} />
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
  overlayWeb: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'stretch',
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
  sheetWeb: {
    width: 380,
    height: '100%',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingTop: 48,
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
