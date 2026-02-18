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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useStories } from '../contexts/StoriesContext';
import { useTheme } from '../contexts/ThemeContext';
import { TTSButton } from '../components/TTSButton';
import { useTTS } from '../hooks/useTTS';
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  RADII,
  BORDERS,
} from '../constants/onboarding-theme';

// Exporting CreateStoryScreen as default component
export default function CreateStoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAnonymous } = useAuth();
  const { createStory } = useStories();
  const { colors, appStyles } = useTheme();
  const { isSpeaking, isLoading, speak } = useTTS();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [postAnonymously, setPostAnonymously] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = title.trim().length > 0 && body.trim().length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    if (isAnonymous) {
      Alert.alert('Sign In Required', 'You need to create an account to share stories.');
      return;
    }

    setSubmitting(true);
    const result = await createStory(title.trim(), body.trim(), postAnonymously);
    setSubmitting(false);

    if (result) {
      router.back();
    } else {
      Alert.alert('Error', 'Failed to create story. Please try again.');
    }
  };

  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <View style={[appStyles.editHeader, { paddingTop: insets.top + 10 }]}>
        <Pressable style={appStyles.editBackButton} onPress={() => router.back()}>
          <Ionicons name="close" size={22} color={colors.textDark} />
        </Pressable>
        <Text style={appStyles.editHeaderTitle}>Share Your Story</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <TTSButton
          isSpeaking={isSpeaking}
          isLoading={isLoading}
          onPress={() => speak('Share your story. Add a title and share your experience navigating cancer and school. You can choose to post anonymously if you prefer.')}
          size={22}
        />
        <Pressable
          style={[appStyles.editSaveButton, !canSubmit && appStyles.editSaveButtonDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={[appStyles.editSaveText, !canSubmit && appStyles.editSaveTextDisabled]}>
              Post
            </Text>
          )}
        </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={appStyles.editScrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TextInput
          style={styles.titleInput}
          placeholder="Title"
          placeholderTextColor={COLORS.inputPlaceholder}
          value={title}
          onChangeText={setTitle}
          maxLength={120}
          autoFocus
        />
        <Text style={styles.charCount}>{title.length}/120</Text>

        <TextInput
          style={styles.bodyInput}
          placeholder="Share your experience navigating cancer and school..."
          placeholderTextColor={COLORS.inputPlaceholder}
          value={body}
          onChangeText={setBody}
          multiline
          textAlignVertical="top"
        />

        {/* Anonymous toggle */}
        <View style={styles.anonymousRow}>
          <View style={styles.anonymousInfo}>
            <Ionicons
              name={postAnonymously ? 'eye-off' : 'eye'}
              size={20}
              color={postAnonymously ? colors.primary : COLORS.textLight}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.anonymousLabel}>Post anonymously</Text>
              <Text style={styles.anonymousHint}>
                {postAnonymously
                  ? 'Your name and role will be hidden'
                  : 'Your name and role will be visible'}
              </Text>
            </View>
          </View>
          <Switch
            value={postAnonymously}
            onValueChange={setPostAnonymously}
            trackColor={{ false: COLORS.borderCard, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>
      </ScrollView>
    </View>
  );
}

const makeStyles = (c: typeof import('../constants/theme').COLORS_LIGHT) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.appBackground,
    },
    titleInput: {
      fontSize: 22,
      fontWeight: '700',
      color: c.textDark,
      borderBottomWidth: 2,
      borderBottomColor: c.borderCard,
      paddingVertical: 16,
      marginBottom: 4,
    },
    charCount: {
      fontSize: 13,
      fontWeight: '500',
      color: c.textLight,
      textAlign: 'right',
      marginBottom: 20,
    },
    bodyInput: {
      fontSize: 17,
      fontWeight: '500',
      color: c.textDark,
      lineHeight: 26,
      minHeight: 200,
      padding: 16,
      backgroundColor: c.white,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: c.borderCard,
    },
    anonymousRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 20,
      backgroundColor: c.white,
      borderRadius: RADII.card,
      borderWidth: BORDERS.card,
      borderColor: c.borderCard,
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
  });
