import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useStories, Story } from '../contexts/StoriesContext';
import { useOnboarding } from '../contexts/OnboardingContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAccomplishments } from '../contexts/AccomplishmentContext';
import { CommunityNormsModal } from '../components/CommunityNormsModal';
import { StoryStartersModal } from '../components/StoryStartersModal';
import { TopicTagsModal } from '../components/TopicTagsModal';
import { TAG_COLORS, DEFAULT_TAG_COLOR } from '../components/StoryCard';
import {
  TYPOGRAPHY,
  SPACING,
  RADII,
  BORDERS,
} from '../constants/onboarding-theme';
import { isStudentRole } from '../utils/profile';

// Exporting CreateStoryScreen as default component
export default function CreateStoryScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const isEditing = params.edit === 'true';
  const editId = params.id as string;

  const insets = useSafeAreaInsets();
  const { isAnonymous } = useAuth();
  const { createStory, updateStory, deleteStory, stories } = useStories();
  const { fireEvent } = useAccomplishments();
  const { data: onboardingData } = useOnboarding();
  const { colors, isDark, fontScale, appStyles } = useTheme();

  const userGroup = useMemo(() => {
    if (isStudentRole(onboardingData.role)) return 'Students';
    if (onboardingData.role === 'parent') return 'Parents';
    if (onboardingData.role === 'staff') return 'School Staff';
    return '';
  }, [onboardingData.role]);

  const existingStory = isEditing ? stories.find(s => s.id === editId) : null;

  // Make sure the user's own group is in the initial target audiences
  const initialAudiences = [...(existingStory?.target_audiences || ['Students', 'Parents', 'School Staff'])];
  if (userGroup && !initialAudiences.includes(userGroup)) {
    initialAudiences.push(userGroup);
  }

  const [title, setTitle] = useState(existingStory?.title || '');
  const [body, setBody] = useState(existingStory?.body || '');
  const [postAnonymously, setPostAnonymously] = useState(existingStory ? existingStory.author_name === 'Anonymous' : false);
  const [lookingFor, setLookingFor] = useState<string[]>(existingStory?.looking_for || []);
  const [targetAudiences, setTargetAudiences] = useState<string[]>(initialAudiences);
  const [storyTags, setStoryTags] = useState<string[]>(existingStory?.story_tags || []);
  const [submitting, setSubmitting] = useState(false);
  const [showNorms, setShowNorms] = useState(false);
  const [normsMode, setNormsMode] = useState<'view' | 'submit'>('submit');
  const [showStarters, setShowStarters] = useState(false);
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const [initialState] = useState({
    title: existingStory?.title || '',
    body: existingStory?.body || '',
    postAnonymously: existingStory ? existingStory.author_name === 'Anonymous' : false,
    lookingFor: existingStory?.looking_for || [],
    targetAudiences: initialAudiences,
    storyTags: existingStory?.story_tags || [],
  });

  const hasMadeChanges = useMemo(() => {
    if (!isEditing) return true; // Always allow posting if it's a new story
    if (title !== initialState.title) return true;
    if (body !== initialState.body) return true;
    if (postAnonymously !== initialState.postAnonymously) return true;
    // Check arrays safely
    const safeLookingFor = Array.isArray(lookingFor) ? lookingFor : [];
    const safeTargetAudiences = Array.isArray(targetAudiences) ? targetAudiences : [];
    const safeStoryTags = Array.isArray(storyTags) ? storyTags : [];
    const safeInitialLookingFor = Array.isArray(initialState.lookingFor) ? initialState.lookingFor : [];
    const safeInitialTargetAudiences = Array.isArray(initialState.targetAudiences) ? initialState.targetAudiences : [];
    const safeInitialStoryTags = Array.isArray(initialState.storyTags) ? initialState.storyTags : [];

    if (safeLookingFor.length !== safeInitialLookingFor.length || !safeLookingFor.every(v => safeInitialLookingFor.includes(v))) return true;
    if (safeTargetAudiences.length !== safeInitialTargetAudiences.length || !safeTargetAudiences.every(v => safeInitialTargetAudiences.includes(v))) return true;
    if (safeStoryTags.length !== safeInitialStoryTags.length || !safeStoryTags.every(v => safeInitialStoryTags.includes(v))) return true;
    return false;
  }, [isEditing, title, body, postAnonymously, lookingFor, targetAudiences, storyTags, initialState]);

  const isExhausted = isEditing && existingStory?.status === 'rejected' && (existingStory?.attempt_count || 0) >= 2;
  const canSubmit = title.trim().length > 0 && body.trim().length > 0 && !submitting && !isExhausted && hasMadeChanges;

  const getAudienceHint = () => {
    const ALL_AUDIENCES = ['Students', 'Parents', 'School Staff'];
    const tags = targetAudiences.filter(a => ALL_AUDIENCES.includes(a));
    const hasAll = ALL_AUDIENCES.every(a => tags.includes(a));
    if (hasAll || tags.length === 0) return '';
    const names = tags.map(a => t(`stories.audiences.${a}`));
    const joined = names.length === 1
      ? names[0]
      : `${names.slice(0, -1).join(', ')} ${t('stories.audienceAnd')} ${names[names.length - 1]}`;
    return t('stories.audienceFor', { audiences: joined });
  };
  const audienceHint = getAudienceHint();

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handlePreSubmit = () => {
    if (!canSubmit) return;
    if (isAnonymous) {
      showAlert(t('stories.signInRequiredTitle'), t('stories.signInRequiredMsg'));
      return;
    }
    setNormsMode('submit');
    setShowNorms(true);
  };

  const handleViewNorms = () => {
    setNormsMode('view');
    setShowNorms(true);
  };

  const handleFinalSubmit = async () => {
    setShowNorms(false);
    setSubmitting(true);

    let result;
    if (isEditing && editId) {
      result = await updateStory(editId, title.trim(), body.trim(), { postAnonymously, lookingFor, targetAudiences, storyTags });
    } else {
      result = await createStory(title.trim(), body.trim(), { postAnonymously, lookingFor, targetAudiences, storyTags });
    }

    setSubmitting(false);

    if (result) {
      fireEvent('story_created');
      const goToStories = () => {
        // Use a more robust way to navigate to the tab
        router.replace('/(tabs)/stories' as any);
      };

      if (!isEditing || (isEditing && existingStory?.status === 'rejected')) {
        if (Platform.OS === 'web') {
          alert(t('stories.storySubmittedMsg'));
          goToStories();
        } else {
          Alert.alert(
            t('stories.storySubmittedTitle'),
            t('stories.storySubmittedMsg'),
            [{ text: t('common.ok'), onPress: goToStories }]
          );
        }
      } else {
        goToStories();
      }
    } else {
      showAlert(t('stories.errorTitle'), isEditing ? t('stories.updateFailed') : t('stories.createFailed'));
    }
  };

  const styles = useMemo(() => makeStyles(colors, isDark, fontScale), [colors, isDark, fontScale]);

  return (
    <View style={[styles.container, Platform.OS === 'web' && styles.webContainer as any]}>
      <View style={Platform.OS === 'web' ? styles.webInner as any : { flex: 1 }}>
      <View style={[appStyles.editHeader, { paddingTop: insets.top + 10 }]}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('common.close')} style={appStyles.editBackButton} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/stories' as any)}>
          <Ionicons name="close" size={22} color={colors.textDark} />
        </Pressable>
        <Text style={appStyles.editHeaderTitle}>{isExhausted ? t('stories.createHeaderReview') : t('stories.shareYourStory')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={appStyles.editScrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable style={[styles.topicReminder, { backgroundColor: isDark ? colors.backgroundLight : '#EEEEF6' }]} onPress={handleViewNorms}>
            <Ionicons name="school-outline" size={16} color={isDark ? colors.textMuted : "#5C5C8A"} />
            <Text style={[styles.topicReminderText, { color: isDark ? colors.textMuted : "#5C5C8A" }]}>{t('stories.topicReminder')}</Text>
            <View style={styles.topicReminderLink}>
              <Text style={[styles.topicReminderLinkText, { color: isDark ? colors.textMuted : "#5C5C8A" }]}>{t('stories.reviewNorms')}</Text>
              <Ionicons name="chevron-forward" size={13} color={isDark ? colors.textMuted : "#5C5C8A"} />
            </View>
          </Pressable>

          {isEditing && existingStory?.status === 'rejected' && existingStory.rejected_norms && existingStory.rejected_norms.length > 0 && (
            <View style={[styles.normsContainer, { backgroundColor: colors.error + '10', borderColor: colors.error + '30' }]}>
              <View style={styles.normsHeader}>
                <Text style={[styles.normsLabel, { color: colors.error }]}>{isExhausted ? t('stories.limitReached') : t('stories.actionRequired')}</Text>
                <Text style={[styles.normsAttemptText, { color: colors.error }]}>
                  {t('stories.attemptOf', { current: existingStory.attempt_count || 1 })}
                </Text>
              </View>
              <Text style={styles.normsDesc}>
                {isExhausted
                  ? t('stories.exhaustedDesc')
                  : t('stories.resolveViolationsDesc')}
              </Text>
              {existingStory.rejected_norms.map((norm, idx) => (
                <View key={idx} style={styles.normItem}>
                  <Ionicons name="close-circle" size={16} color={colors.error} />
                  <Text style={styles.normText}>{norm}</Text>
                </View>
              ))}
            </View>
          )}

          <TextInput
            style={[styles.titleInput, isExhausted && { color: colors.textMuted }]}
            placeholder={t('stories.titlePlaceholder')}
            placeholderTextColor={colors.textMuted}
            value={title}
            onChangeText={setTitle}
            maxLength={120}
            autoFocus={!isExhausted}
            editable={!isExhausted}
          />
          <View style={styles.titleRow}>
            <Pressable onPress={() => !isExhausted && setShowSettingsModal(true)} style={styles.startersBtn}>
              <Ionicons name="options-outline" size={16} color={colors.primary} />
              <Text style={[styles.startersText, { color: colors.primary }]}>{t('stories.addTagsAudience')}</Text>
            </Pressable>
            <Text style={styles.charCount}>{title.length}/120</Text>
          </View>

          {/* Selected settings preview area */}
          {(!isExhausted && (storyTags.length > 0 || audienceHint !== '')) && (
            <View style={styles.previewContainer}>
              {audienceHint !== '' && (
                <Text style={styles.audiencePreviewText}>
                  {audienceHint}
                </Text>
              )}

              {storyTags.length > 0 && (
                <View style={styles.tagsContainer}>
                  {storyTags.map(tag => {
                    const color = TAG_COLORS[tag] ?? DEFAULT_TAG_COLOR;
                    return (
                      <View key={tag} style={[styles.tagBadge, { backgroundColor: isDark ? color.text + '30' : color.bg }]}>
                        <Text style={[styles.tagText, { color: isDark ? color.bg : color.text }]}>{tag}</Text>
                        <Pressable accessibilityRole="button" accessibilityLabel={t('common.a11y.removeTag', { tag })} 
                          onPress={() => setStoryTags(storyTags.filter(t => t !== tag))}
                          hitSlop={8}
                          style={{ marginLeft: 4 }}
                        >
                          <Ionicons name="close-circle" size={18} color={isDark ? color.bg : color.text} />
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          )}

          <TextInput
            style={[styles.bodyInput, isExhausted && { backgroundColor: isDark ? colors.appBackground : colors.backgroundLight, color: colors.textMuted }]}
            placeholder={t('stories.bodyPlaceholder')}
            placeholderTextColor={colors.textMuted}
            value={body}
            onChangeText={setBody}
            multiline
            textAlignVertical="top"
            editable={!isExhausted}
          />

          {body.trim().length === 0 && (
            <Pressable onPress={() => !isExhausted && setShowStarters(true)} style={[styles.startersBtn, { marginTop: 12, alignSelf: 'flex-start' }]}>
              <Ionicons name="sparkles" size={16} color={colors.primary} />
              <Text style={[styles.startersText, { color: colors.primary }]}>{t('stories.storyStarters')}</Text>
            </Pressable>
          )}



          {/* Looking For preview area */}
          {(!isExhausted && lookingFor.length > 0) && (
            <View style={styles.lookingForPreview}>
              <Text style={styles.lookingForText}>
                {t('stories.lookingForPreview', { items: lookingFor.map(o => t(`stories.lookingFor.${o}`)).join(' · ') })}
              </Text>
            </View>
          )}

          {/* Anonymous toggle */}
          <View style={styles.anonymousRow}>
            <View style={styles.anonymousInfo}>
              <Ionicons
                name={postAnonymously ? 'eye-off' : 'eye'}
                size={20}
                color={postAnonymously ? colors.primary : colors.textLight}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.anonymousLabel}>{t('stories.postAnonymously')}</Text>
                <Text style={styles.anonymousHint}>
                  {postAnonymously
                    ? t('stories.anonHintHidden')
                    : t('stories.anonHintVisible')}
                </Text>
              </View>
            </View>
            <Switch
              value={postAnonymously}
              onValueChange={setPostAnonymously}
              trackColor={{ false: colors.indicatorInactive, true: colors.primary }}
              thumbColor="#FFFFFF"
              disabled={isExhausted}
            />
          </View>

          <View style={styles.bottomActions}>
            {isEditing && existingStory?.status === 'rejected' && (
              <Pressable
                style={[
                  styles.actionBtn,
                  isExhausted ? styles.deleteBtnSolid : styles.deleteBtn
                ]}
                onPress={() => {
                  if (Platform.OS === 'web') {
                    if (window.confirm(t('stories.deleteStoryConfirm'))) {
                      deleteStory(editId).then(() => {
                        router.back();
                      });
                    }
                  } else {
                    Alert.alert(t('stories.deleteStory'), t('stories.deleteStoryConfirm'), [
                      { text: t('common.cancel'), style: 'cancel' },
                      {
                        text: t('common.delete'), style: 'destructive', onPress: async () => {
                          await deleteStory(editId);
                          router.back();
                        }
                      }
                    ]);
                  }
                }}
              >
                <Text style={[
                  isExhausted ? styles.deleteBtnTextSolid : styles.deleteBtnText
                ]}>{t('stories.deleteStory')}</Text>
              </Pressable>
            )}

            {!isExhausted && (
              <Pressable
                style={[styles.actionBtn, styles.primaryBtn, !canSubmit && styles.primaryBtnDisabled]}
                onPress={handlePreSubmit}
                disabled={!canSubmit}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={[styles.primaryBtnText, !canSubmit && styles.primaryBtnTextDisabled]}>
                    {isEditing && existingStory?.status === 'rejected' ? t('stories.resubmit') : t('stories.postStory')}
                  </Text>
                )}
              </Pressable>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={showSettingsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowSettingsModal(false)} />
          <View style={[styles.settingsModalContent, { paddingBottom: Math.max(insets.bottom + 20, 20) }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('stories.storySettings')}</Text>
              <Pressable onPress={() => setShowSettingsModal(false)} hitSlop={10} style={styles.modalDoneBtn}>
                <Text style={styles.modalDoneBtnText}>{t('common.done')}</Text>
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.settingsScroll}>

              {/* Content Tags via Dropdown/Modal */}
              <Text style={styles.sectionHeading}>{t('stories.topicTags')}</Text>
              <Pressable
                style={styles.tagsDropdownBtn}
                onPress={() => !isExhausted && setShowTagsModal(true)}
              >
                <Text style={storyTags.length > 0 ? styles.tagsDropdownTextSelected : styles.tagsDropdownText}>
                  {storyTags.length > 0
                    ? t(storyTags.length === 1 ? 'stories.tagsSelectedOne' : 'stories.tagsSelectedOther', { count: storyTags.length })
                    : t('stories.selectTopicTags')}
                </Text>
                <Ionicons name="chevron-down" size={20} color={colors.textLight} />
              </Pressable>

              {storyTags.length > 0 && (
                <View style={styles.selectedTagsContainer}>
                  {storyTags.map((tag) => {
                    const color = TAG_COLORS[tag] ?? DEFAULT_TAG_COLOR;
                    return (
                      <View key={tag} style={[styles.selectedTagChip, { backgroundColor: isDark ? color.text + '30' : color.bg }]}>
                        <Text style={[styles.selectedTagText, { color: isDark ? color.bg : color.text }]}>{tag}</Text>
                        {!isExhausted && (
                          <Pressable accessibilityRole="button" accessibilityLabel={t('common.a11y.removeTag', { tag })}
                            onPress={() => setStoryTags(storyTags.filter(t => t !== tag))}
                            hitSlop={8}
                            style={{ marginLeft: 4 }}
                          >
                            <Ionicons name="close-circle" size={16} color={isDark ? color.bg : color.text} />
                          </Pressable>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Looking For Chips */}
              <Text style={styles.sectionHeading}>{t('stories.lookingForHeading')}</Text>
              <View style={styles.chipGroup}>
                {['Advice', 'Warmth + Support', 'Listening Ear', 'Just Sharing'].map((option) => {
                  const isSelected = lookingFor.includes(option);
                  return (
                    <Pressable
                      key={option}
                      style={[styles.chip, isSelected && styles.chipSelected, isExhausted && { opacity: 0.6 }]}
                      onPress={() => {
                        if (isExhausted) return;
                        if (isSelected) {
                          setLookingFor(lookingFor.filter(o => o !== option));
                        } else {
                          setLookingFor([...lookingFor, option]);
                        }
                      }}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                        {t(`stories.lookingFor.${option}`)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Target Audience Chips */}
              <Text style={[styles.sectionHeading, { marginTop: 20 }]}>{t('stories.shareWithHeading')}</Text>
              <View style={styles.chipGroup}>
                {['Students', 'Parents', 'School Staff'].map((option) => {
                  const isSelected = targetAudiences.includes(option);
                  return (
                    <Pressable
                      key={option}
                      style={[styles.chip, isSelected && styles.chipSelected, isExhausted && { opacity: 0.6 }]}
                      onPress={() => {
                        if (isExhausted) return;
                        if (option === userGroup) {
                          showAlert(t('stories.requiredTitle'), t('stories.requiredAudienceMsg', { audience: t(`stories.audiences.${option}`) }));
                          return;
                        }
                        if (isSelected) {
                          setTargetAudiences(targetAudiences.filter(o => o !== option));
                        } else {
                          setTargetAudiences([...targetAudiences, option]);
                        }
                      }}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                        {t(`stories.audiences.${option}`)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>

        {/* Render TopicTagsModal within SettingsModal without creating a new React Native Modal */}
        <TopicTagsModal
          visible={showTagsModal}
          useModal={false}
          onClose={() => setShowTagsModal(false)}
          selectedTags={storyTags}
          onToggleTag={(tag) => {
            setStoryTags(prev => {
              if (prev.includes(tag)) return prev.filter(t => t !== tag);
              if (prev.length >= 3) return prev;
              return [...prev, tag];
            });
          }}
          maxTags={3}
          onClearAll={() => setStoryTags([])}
        />
      </Modal>

      <CommunityNormsModal
        visible={showNorms}
        onClose={() => setShowNorms(false)}
        mode={normsMode}
        onAgree={normsMode === 'submit' ? handleFinalSubmit : undefined}
      />

      <StoryStartersModal
        visible={showStarters}
        onClose={() => setShowStarters(false)}
        onSelectPrompt={(prompt) => {
          setBody((prev) => prev ? `${prev}\n\n${prompt}` : prompt);
        }}
      />

      </View>
    </View>
  );
}
const makeStyles = (c: any, isDark: boolean, fontScale = 1) => {
  const fs = (size: number) => Math.round(size * fontScale);
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.appBackground,
    },
    webContainer: {
      alignItems: 'center' as const,
      overflowY: 'auto' as any,
    },
    webInner: {
      width: '100%' as any,
      maxWidth: 720 as any,
      flex: 1,
    },
    titleInput: {
      fontSize: fs(22),
      fontWeight: '700',
      color: c.textDark,
      borderBottomWidth: 2,
      borderBottomColor: isDark ? c.borderCard : c.borderCard,
      paddingVertical: 16,
      marginBottom: 4,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    startersBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 6,
      paddingHorizontal: 12,
      backgroundColor: c.primary + '15',
      borderRadius: 100,
      gap: 6,
    },
    startersText: {
      fontSize: 13,
      fontWeight: '600',
    },
    charCount: {
      fontSize: 13,
      fontWeight: '500',
      color: c.textLight,
      textAlign: 'right',
      marginBottom: 20,
    },
    bodyInput: {
      fontSize: fs(17),
      fontWeight: '500',
      color: c.textDark,
      lineHeight: fs(26),
      minHeight: 200,
      padding: 16,
      backgroundColor: isDark ? c.backgroundLight : c.white,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: isDark ? c.borderCard : c.borderCard,
    },
    previewContainer: {
      marginBottom: 20,
      paddingVertical: 12,
      borderRadius: 12,
    },
    audiencePreviewText: {
      fontSize: 13,
      fontWeight: '600',
      color: c.primary,
      marginBottom: 8,
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    tagBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingLeft: 12,
      paddingRight: 8,
      paddingVertical: 6,
      borderRadius: 100,
    },
    tagText: {
      fontSize: 13,
      fontWeight: '700',
    },
    lookingForPreview: {
      marginTop: 16,
      padding: 12,
      backgroundColor: isDark ? c.backgroundLight : c.appBackgroundAlt,
      borderRadius: 12,
    },
    lookingForText: {
      fontSize: 13,
      fontWeight: '600',
      color: c.textMuted,
    },
    anonymousRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 20,
      backgroundColor: isDark ? c.backgroundLight : c.white,
      borderRadius: RADII.card,
      borderWidth: 1.5,
      borderColor: isDark ? c.borderCard : c.borderCard,
      padding: 16,
    },
    anonymousInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
      marginRight: 12,
    },
    anonymousLabel: {
      fontSize: 16,
      fontWeight: '700',
      color: c.textDark,
    },
    anonymousHint: {
      fontSize: 13,
      fontWeight: '500',
      color: c.textLight,
      marginTop: 2,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    settingsModalContent: {
      backgroundColor: c.white,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      paddingTop: 24,
      paddingHorizontal: 24,
      maxHeight: '90%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: c.textDark,
    },
    modalDoneBtn: {
      paddingVertical: 6,
      paddingHorizontal: 12,
    },
    modalDoneBtnText: {
      fontSize: 16,
      fontWeight: '700',
      color: c.primary,
    },
    settingsScroll: {
      marginBottom: 20,
    },
    sectionHeading: {
      fontSize: 16,
      fontWeight: '700',
      color: c.textDark,
      marginTop: 12,
      marginBottom: 8,
    },
    chipGroup: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    chip: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: isDark ? c.backgroundLight : c.white,
      borderRadius: 100,
      borderWidth: 1.5,
      borderColor: isDark ? c.borderCard : c.borderCard,
    },
    chipSelected: {
      backgroundColor: c.primary + '15',
      borderColor: c.primary,
    },
    chipText: {
      fontSize: 14,
      fontWeight: '600',
      color: c.textMuted,
    },
    chipTextSelected: {
      color: c.primary,
    },
    tagsDropdownBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: isDark ? c.backgroundLight : c.white,
      borderWidth: 1.5,
      borderColor: isDark ? c.borderCard : c.borderCard,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      marginBottom: 12,
    },
    tagsDropdownText: {
      fontSize: 16,
      color: c.textLight,
    },
    tagsDropdownTextSelected: {
      fontSize: 16,
      fontWeight: '600',
      color: c.textDark,
    },
    selectedTagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 10,
    },
    selectedTagChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 100,
    },
    selectedTagText: {
      fontSize: 13,
      fontWeight: '600',
    },
    normsContainer: {
      padding: 16,
      borderRadius: RADII.card,
      marginBottom: 24,
      borderWidth: 1,
    },
    normsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    normsLabel: {
      fontSize: 14,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    normsAttemptText: {
      fontSize: 13,
      fontWeight: '600',
    },
    normsDesc: {
      fontSize: 14,
      color: c.textDark,
      marginBottom: 12,
      lineHeight: 20,
    },
    normItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      marginBottom: 8,
    },
    normText: {
      flex: 1,
      fontSize: 14,
      fontWeight: '600',
      color: c.textDark,
      lineHeight: 20,
    },
    bottomActions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 32,
      marginBottom: 20,
    },
    actionBtn: {
      flex: 1,
      paddingVertical: 16,
      borderRadius: 100,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryBtn: {
      backgroundColor: c.primaryFill,
    },
    primaryBtnDisabled: {
      backgroundColor: c.borderCard,
    },
    primaryBtnText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    primaryBtnTextDisabled: {
      color: c.textLight,
    },
    deleteBtn: {
      backgroundColor: isDark ? c.appBackground : c.white,
      borderWidth: 1.5,
      borderColor: c.destructive,
    },
    deleteBtnText: {
      fontSize: 16,
      fontWeight: '700',
      color: c.destructive,
    },
    deleteBtnSolid: {
      backgroundColor: c.destructiveFill,
      borderWidth: 0,
    },
    deleteBtnTextSolid: {
      fontSize: 16,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    topicReminder: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 20,
      gap: 7,
    },
    topicReminderText: {
      flex: 1,
      fontSize: 13,
      fontWeight: '500',
    },
    topicReminderLink: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    topicReminderLinkText: {
      fontSize: 13,
      fontWeight: '700',
    },
  });
};
