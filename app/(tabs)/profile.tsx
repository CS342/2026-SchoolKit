import React, { useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Image,
  Modal,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Audio } from "expo-av";
import { useOnboarding } from "../../contexts/OnboardingContext";
import { useAuth } from "../../contexts/AuthContext";
import { useAccomplishments } from "../../contexts/AccomplishmentContext";
import { ALL_RESOURCES } from "../../constants/resources";
import { VOICES, VOICE_META, generateSpeech } from "../../services/elevenLabs";
import {
  RADII,
  SIZING,
  SPACING,
  BORDERS,
  ANIMATION,
} from "../../constants/onboarding-theme";
import { useTheme } from "../../contexts/ThemeContext";
import type { AppTheme } from "../../constants/theme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function SettingRow({
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

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withTiming(0.98, { duration: 80 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, ANIMATION.springBouncy);
      }}
      style={[styles.row, pressStyle]}
    >
      <View style={[styles.rowIconWrap, { backgroundColor: tint || colors.backgroundLight }]}>
        <Ionicons
          name={icon}
          size={18}
          color={tint ? '#FFFFFF' : colors.primary}
        />
      </View>
      <View style={[styles.rowBody, !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderCard }]}>
        <Text style={[styles.rowLabel, { color: colors.textDark }]}>{label}</Text>
        <View style={styles.rowRight}>
          {value ? (
            <Text style={[styles.rowValue, { color: colors.textLight }]}>
              {value}
            </Text>
          ) : null}
          <Ionicons name="chevron-forward" size={18} color={colors.indicatorInactive} />
        </View>
      </View>
    </AnimatedPressable>
  );
}

function AnimatedSection({
  children,
  delay,
}: {
  children: React.ReactNode;
  delay: number;
}) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(24);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
    translateY.value = withDelay(
      delay,
      withSpring(0, ANIMATION.springSmooth)
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
}

function VoiceSelectorModal({
  visible,
  onClose,
  selectedVoice,
  onSelectVoice,
}: {
  visible: boolean;
  onClose: () => void;
  selectedVoice: string;
  onSelectVoice: (voiceId: string) => void;
}) {
  const [sound, setSound] = React.useState<Audio.Sound | null>(null);
  const [playingVoiceId, setPlayingVoiceId] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const { colors, shadows } = useTheme();

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const handlePlaySample = async (voiceId: string, name: string) => {
    try {
      if (playingVoiceId === voiceId) {
        // Stop if currently playing this voice
        if (sound) {
          await sound.stopAsync();
          await sound.unloadAsync();
          setSound(null);
          setPlayingVoiceId(null);
        }
        return;
      }

      // Stop previous
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
        setPlayingVoiceId(null);
      }

      setIsLoading(true);
      setPlayingVoiceId(voiceId);

      const text = `The quick brown fox jumps over the lazy dog.`;
      const uri = await generateSpeech(text, voiceId);

      if (uri) {
        const { sound: newSound } = await Audio.Sound.createAsync(
            { uri },
            { shouldPlay: true }
        );
        setSound(newSound);
        newSound.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded && status.didJustFinish) {
                setPlayingVoiceId(null);
            }
        });
      } else {
          setPlayingVoiceId(null);
      }
    } catch (e) {
      console.error("Error playing sample", e);
      setPlayingVoiceId(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Group voices by accent
  const voicesByAccent = React.useMemo(() => {
    const groups: Record<string, typeof VOICE_META[string][]> = {};
    Object.values(VOICE_META).forEach((voice) => {
      const accent = voice.accent || 'Other';
      if (!groups[accent]) groups[accent] = [];
      groups[accent].push(voice);
    });
    return groups;
  }, []);

  const accentOrder = ['American', 'British', 'Australian'];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
         <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
            <View style={styles.modalBackdrop} />
         </Pressable>
         <View style={[styles.modalContent, { backgroundColor: colors.appBackground }]}>
            <Text style={[styles.modalTitle, { color: colors.textDark }]}>Choose a Voice</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textLight }]}>Select a companion for your journey</Text>

            <ScrollView style={styles.voiceScroll} showsVerticalScrollIndicator={false}>
              {accentOrder.map((accent) => {
                const voices = voicesByAccent[accent];
                if (!voices || voices.length === 0) return null;
                return (
                  <View key={accent}>
                    <Text style={[styles.accentLabel, { color: colors.textLight }]}>{accent}</Text>
                    <View style={styles.voiceList}>
                      {voices.map((voice) => {
                        const isSelected = selectedVoice === voice.id;
                        const isPlaying = playingVoiceId === voice.id;

                        return (
                          <Pressable
                              key={voice.id}
                              style={[
                                  styles.voiceCard,
                                  { backgroundColor: colors.white, borderColor: isSelected ? colors.primary : 'transparent' },
                                  shadows.card,
                                  isSelected && { backgroundColor: colors.backgroundLight }
                              ]}
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
                                  <Text style={[styles.voiceDesc, { color: isSelected ? colors.primary : colors.textLight, opacity: isSelected ? 0.8 : 1 }]}>{voice.description}</Text>
                              </View>

                              <Pressable
                                  style={[
                                      styles.playButton,
                                      { backgroundColor: isPlaying ? colors.primary : colors.backgroundLight }
                                  ]}
                                  onPress={(e) => {
                                      e.stopPropagation();
                                      handlePlaySample(voice.id, voice.name);
                                  }}
                              >
                                  {isLoading && isPlaying ? (
                                      <ActivityIndicator size="small" color={isPlaying ? '#FFFFFF' : colors.primary} />
                                  ) : (
                                      <Ionicons
                                          name={isPlaying ? "stop" : "play"}
                                          size={16}
                                          color={isPlaying ? '#FFFFFF' : colors.primary}
                                      />
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

            <Pressable style={[styles.closeButton, { backgroundColor: colors.primary }]} onPress={onClose}>
                <Text style={styles.closeButtonText}>Done</Text>
            </Pressable>
         </View>
      </View>
    </Modal>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();
  const theme = useTheme();
  const { colors, shadows, appStyles, isDark, themePreference, setThemePreference } = theme;
  const {
    data,
    resetOnboarding,
    updateProfilePicture,
    downloadAllResources,
    downloads,
    selectedVoice,
    updateVoice,
  } = useOnboarding();
  const { fireEvent } = useAccomplishments();

  // Modal State
  const [isVoiceModalVisible, setIsVoiceModalVisible] = React.useState(false);
  const [isAppearanceModalVisible, setIsAppearanceModalVisible] = React.useState(false);

  // Avatar entrance
  const avatarScale = useSharedValue(0);
  const avatarOpacity = useSharedValue(0);
  const nameOpacity = useSharedValue(0);
  const nameTranslateY = useSharedValue(12);
  const footerOpacity = useSharedValue(0);

  useEffect(() => {
    avatarOpacity.value = withDelay(80, withTiming(1, { duration: 300 }));
    avatarScale.value = withDelay(80, withSpring(1, ANIMATION.springBouncy));
    nameOpacity.value = withDelay(200, withTiming(1, { duration: 350 }));
    nameTranslateY.value = withDelay(200, withSpring(0, ANIMATION.springSmooth));
    footerOpacity.value = withDelay(700, withTiming(1, { duration: 500 }));
  }, []);

  const avatarStyle = useAnimatedStyle(() => ({
    opacity: avatarOpacity.value,
    transform: [{ scale: avatarScale.value }],
  }));
  const nameStyle = useAnimatedStyle(() => ({
    opacity: nameOpacity.value,
    transform: [{ translateY: nameTranslateY.value }],
  }));
  const footerStyle = useAnimatedStyle(() => ({
    opacity: footerOpacity.value,
  }));

  const getRoleDisplayName = () => {
    switch (data.role) {
      case "student-k8":
        return "Student (Middle School)";
      case "student-hs":
        return "Student (High School and up)";
      case "parent":
        return "Parent/Caregiver";
      case "staff":
        return "School Staff";
      default:
        return "Not set";
    }
  };

  const getSchoolStatusText = () => {
    if (data.schoolStatuses.length === 0) return "Not set";
    const labels: Record<string, string> = {
      'current-treatment': 'Currently in school',
      'returning-after-treatment': 'Taking a break from school',
      'supporting-student': 'Planning to return to school soon',
      'special-needs': 'Home/hospital school',
    };
    return data.schoolStatuses.map((s) => labels[s] ?? s.replace(/-/g, " ")).join(", ");
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Camera permission is required to take photos.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled && result.assets[0].base64) {
      // Create data URI for profile picture
      const dataUri = `data:image/jpeg;base64,${result.assets[0].base64}`;
      await updateProfilePicture(dataUri);
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Photo library permission is required.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled && result.assets[0].base64) {
      // Create data URI for profile picture
      const dataUri = `data:image/jpeg;base64,${result.assets[0].base64}`;
      await updateProfilePicture(dataUri);
    }
  };

  const handleProfilePicture = () => {
    Alert.alert("Profile Picture", "Choose an option", [
      { text: "Take Photo", onPress: handleTakePhoto },
      { text: "Choose from Library", onPress: handlePickImage },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleRetakeSurvey = () => {
    Alert.alert("Retake Survey", "This will reset your profile. Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Retake",
        style: "destructive",
        onPress: () => {
          resetOnboarding();
          router.replace("/onboarding/step1");
        },
      },
    ]);
  };

  const handleDownloadAll = () => {
    const allDownloaded = downloads.length >= ALL_RESOURCES.length;
    if (allDownloaded) {
      Alert.alert("Already Downloaded", "All resources are already available offline.");
    } else {
      Alert.alert("Download All Resources", "This will save all resources for offline access.", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Download All",
          onPress: async () => {
            await downloadAllResources();
            Alert.alert("Success", "All resources are now available offline!");
          },
        },
      ]);
    }
  };

  const handleAppearance = () => {
    setIsAppearanceModalVisible(true);
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
            router.replace("/welcome");
          } catch (err: any) {
            Alert.alert("Sign Out Failed", err.message || "Something went wrong.");
          }
        },
      },
    ]);
  };

  const appearanceLabel = themePreference === 'system' ? 'System' : themePreference === 'light' ? 'Light' : 'Dark';

  return (
    <View style={[styles.container, { backgroundColor: colors.appBackground }]}>
      <View style={[appStyles.tabHeader, { paddingTop: insets.top + 10 }]}>
        <Text style={appStyles.tabHeaderTitle}>Profile</Text>
        <Text style={appStyles.tabHeaderSubtitle}>Manage your information</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.identity}>
          <Pressable onPress={handleProfilePicture}>
            <Animated.View style={avatarStyle}>
              <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                {data.profilePicture ? (
                  <Image source={{ uri: data.profilePicture }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarInitial}>
                    {data.name.charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
              <View style={[styles.cameraBadge, { backgroundColor: colors.primary, borderColor: colors.appBackground }]}>
                <Ionicons name="camera" size={14} color="#FFFFFF" />
              </View>
            </Animated.View>
          </Pressable>

          <Animated.View style={[styles.identityText, nameStyle]}>
            <Text style={[styles.userName, { color: colors.textDark }]}>{data.name}</Text>
            <View style={[styles.rolePill, { backgroundColor: colors.backgroundLight }]}>
              <Text style={[styles.rolePillText, { color: colors.primary }]}>{getRoleDisplayName()}</Text>
            </View>
          </Animated.View>
        </View>

        <AnimatedSection delay={320}>
          <Text style={[styles.sectionLabel, { color: colors.textLight }]}>PROFILE</Text>
          <View style={[styles.groupCard, { backgroundColor: colors.white, ...shadows.card }]}>
            <SettingRow icon="person-outline" label="Name" value={data.name} onPress={() => router.push("/edit-name")} theme={theme} />
            <SettingRow icon="school-outline" label="Role" value={getRoleDisplayName()} onPress={() => router.push("/edit-role")} theme={theme} />
            <SettingRow icon="book-outline" label="School Status" value={getSchoolStatusText()} onPress={() => router.push("/edit-school-status")} theme={theme} />
            <SettingRow icon="list-outline" label="Topics" value={`${data.topics.length} selected`} onPress={() => router.push("/edit-topics")} isLast theme={theme} />
          </View>
        </AnimatedSection>

        <AnimatedSection delay={460}>
          <Text style={[styles.sectionLabel, { color: colors.textLight }]}>GENERAL</Text>
          <View style={[styles.groupCard, { backgroundColor: colors.white, ...shadows.card }]}>
            <SettingRow
              icon="leaf-outline"
              label="Knowledge Tree"
              onPress={() => router.push('/knowledge-tree' as any)}
              theme={theme}
            />
            <SettingRow
              icon="extension-puzzle-outline"
              label="My Puzzles"
              onPress={() => router.push('/accomplishments' as any)}
              theme={theme}
            />
            <SettingRow
              icon="moon-outline"
              label="Appearance"
              value={appearanceLabel}
              onPress={handleAppearance}
              theme={theme}
            />
            <SettingRow
              icon="mic-outline"
              label="Voice"
              value={Object.values(VOICE_META).find((meta) => meta.id === selectedVoice)?.name || 'Peter'}
              onPress={() => setIsVoiceModalVisible(true)}
              theme={theme}
            />
            {Platform.OS === 'web' && (
              <SettingRow
                icon="color-palette-outline"
                label="Design Editor"
                value="Create visuals"
                onPress={() => router.push('/(editor)/designs')}
                theme={theme}
              />
            )}
            <SettingRow
              icon="cloud-download-outline"
              label="Download All"
              value={
                downloads.length >= ALL_RESOURCES.length
                  ? "All saved"
                  : `${downloads.length}/${ALL_RESOURCES.length}`
              }
              onPress={handleDownloadAll}
              theme={theme}
            />
            <SettingRow icon="refresh-outline" label="Retake Survey" onPress={handleRetakeSurvey} theme={theme} />
            <SettingRow icon="information-circle-outline" label="About SchoolKit" onPress={() => router.push('/about')} theme={theme} />
            <SettingRow icon="help-circle-outline" label="Frequently Asked Questions" onPress={() => router.push('/help-support?section=faq')} theme={theme} />
            <SettingRow icon="chatbubble-ellipses-outline" label="Share Feedback" onPress={() => router.push('/help-support?section=feedback')} isLast theme={theme} />
          </View>
        </AnimatedSection>

        <AnimatedSection delay={580}>
          <View style={[styles.groupCard, { backgroundColor: colors.white, ...shadows.card }]}>
            <SettingRow icon="log-out-outline" label="Sign Out" onPress={handleSignOut} tint={colors.error} isLast theme={theme} />
          </View>
        </AnimatedSection>

        <Animated.View style={[styles.footer, footerStyle]}>
          <Text style={[styles.footerText, { color: colors.indicatorInactive }]}>SchoolKit v1.0.0</Text>
        </Animated.View>
      </ScrollView>

      {/* Appearance Modal */}
      <Modal visible={isAppearanceModalVisible} transparent animationType="fade" onRequestClose={() => setIsAppearanceModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setIsAppearanceModalVisible(false)}>
            <View style={styles.modalBackdrop} />
          </Pressable>
          <View style={[styles.modalContent, { backgroundColor: colors.appBackground }]}>
            <Text style={[styles.modalTitle, { color: colors.textDark }]}>Appearance</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textLight }]}>Choose your preferred theme</Text>
            <View style={{ gap: 10, marginBottom: 20 }}>
              {([
                { key: 'system' as const, label: 'System', icon: 'phone-portrait-outline' as const, desc: 'Match device settings' },
                { key: 'light' as const, label: 'Light', icon: 'sunny-outline' as const, desc: 'Always use light mode' },
                { key: 'dark' as const, label: 'Dark', icon: 'moon-outline' as const, desc: 'Always use dark mode' },
              ]).map((option) => {
                const isSelected = themePreference === option.key;
                return (
                  <Pressable
                    key={option.key}
                    style={[
                      styles.voiceCard,
                      { backgroundColor: colors.white, borderColor: isSelected ? colors.primary : 'transparent' },
                      shadows.card,
                      isSelected && { backgroundColor: colors.backgroundLight },
                    ]}
                    onPress={() => {
                      setThemePreference(option.key);
                      setIsAppearanceModalVisible(false);
                    }}
                  >
                    <View style={[styles.voiceAvatar, { backgroundColor: isSelected ? colors.primary : colors.backgroundLight, alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 20 }]}>
                      <Ionicons name={option.icon} size={20} color={isSelected ? '#FFFFFF' : colors.primary} />
                    </View>
                    <View style={styles.voiceInfo}>
                      <Text style={[styles.voiceName, { color: isSelected ? colors.primary : colors.textDark }]}>{option.label}</Text>
                      <Text style={[styles.voiceDesc, { color: colors.textLight }]}>{option.desc}</Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                    )}
                  </Pressable>
                );
              })}
            </View>
            <Pressable style={[styles.closeButton, { backgroundColor: colors.primary }]} onPress={() => setIsAppearanceModalVisible(false)}>
              <Text style={styles.closeButtonText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Voice Selection Modal */}
      <VoiceSelectorModal
        visible={isVoiceModalVisible}
        onClose={() => setIsVoiceModalVisible(false)}
        selectedVoice={selectedVoice}
        onSelectVoice={(voiceId) => {
            updateVoice(voiceId);
            fireEvent('voice_changed');
            setIsVoiceModalVisible(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingBottom: 48,
  },
  identity: {
    alignItems: "center",
    paddingTop: 32,
    paddingBottom: 28,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  avatarInitial: {
    fontSize: 36,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  cameraBadge: {
    position: "absolute",
    bottom: 0,
    right: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
  },
  identityText: {
    alignItems: "center",
    marginTop: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  rolePill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 100,
  },
  rolePillText: {
    fontSize: 13,
    fontWeight: "600",
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: SPACING.screenPadding + 4,
  },
  groupCard: {
    marginHorizontal: SPACING.screenPadding,
    borderRadius: 16,
    marginBottom: 24,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 14,
    paddingRight: 16,
    minHeight: 52,
  },
  rowIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  rowBody: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginLeft: 12,
    paddingVertical: 14,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: "500",
    flexShrink: 0,
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexShrink: 1,
    marginLeft: 12,
  },
  rowValue: {
    fontSize: 15,
    fontWeight: "400",
    flexShrink: 1,
    textAlign: "right",
  },
  footer: {
    alignItems: "center",
    paddingTop: 8,
  },
  footerText: {
    fontSize: 13,
    fontWeight: "500",
  },

  // ── Modal ─────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    flex: 1,
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.screenPadding,
    paddingBottom: 40,
    maxHeight: "85%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
  },
  voiceScroll: {
    marginBottom: 16,
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
  voiceList: {
    gap: 10,
    marginBottom: 8,
  },
  voiceCard: {
    flexDirection: "row",
    alignItems: "center",
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
  voiceInfo: {
    flex: 1,
  },
  voiceName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  voiceDesc: {
    fontSize: 13,
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButton: {
    paddingVertical: 14,
    borderRadius: 100,
    alignItems: "center",
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontWeight: "600",
    fontSize: 16,
  },
});
