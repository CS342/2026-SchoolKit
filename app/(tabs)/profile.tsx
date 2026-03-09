import React, { useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Image,
  Platform,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useOnboarding } from "../../contexts/OnboardingContext";
import { useAuth } from "../../contexts/AuthContext";
import { useAccomplishments } from "../../contexts/AccomplishmentContext";
import { useStories } from "../../contexts/StoriesContext";
import { ALL_RESOURCES } from "../../constants/resources";
import {
  RADII,
  SIZING,
  SPACING,
  BORDERS,
  ANIMATION,
} from "../../constants/onboarding-theme";
import { useTheme } from "../../contexts/ThemeContext";
import type { AppTheme } from "../../constants/theme";
import { getRoleDisplayName, getSchoolStatusText } from "../../utils/profile";

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


export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { colors, shadows, appStyles, isDark } = theme;
  const { data, updateProfilePicture, bookmarks } = useOnboarding();
  const { user } = useAuth();
  const { stories, storyBookmarks } = useStories();
  const { fireEvent } = useAccomplishments();

  const myStoriesCount = stories.filter(s => s.author_id === user?.id).length;
  const savedCount = bookmarks.length + storyBookmarks.length;
  const [showEditProfile, setShowEditProfile] = React.useState(false);

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

  const roleDisplayName = getRoleDisplayName(data.role);
  const schoolStatusText = getSchoolStatusText(data.schoolStatuses);

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


  return (
    <View style={[styles.container, { backgroundColor: colors.appBackground }]}>
      <View style={[appStyles.tabHeader, { paddingTop: insets.top + 10 }]}>
        <Text style={appStyles.tabHeaderTitle}>Profile</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={isDark ? ['rgba(123,104,238,0.18)', 'rgba(123,104,238,0.04)'] : ['rgba(123,104,238,0.10)', 'rgba(123,104,238,0.02)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.identityCard}
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
              <Text style={[styles.rolePillText, { color: colors.primary }]}>{roleDisplayName}</Text>
            </View>
            {schoolStatusText !== 'Not set' && (
              <View style={[styles.rolePill, { backgroundColor: colors.backgroundLight, marginTop: 8 }]}>
                <Text style={[styles.rolePillText, { color: colors.primary }]}>{schoolStatusText}</Text>
              </View>
            )}
            <View style={[styles.statsRow, { borderTopColor: colors.borderCard }]}>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: colors.textDark }]}>{myStoriesCount}</Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>Stories</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.borderCard }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: colors.textDark }]}>{savedCount}</Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>Saved</Text>
              </View>
            </View>

            <Pressable
              onPress={() => setShowEditProfile(true)}
              style={[styles.editProfileBtn, { borderColor: colors.borderCard }]}
            >
              <Ionicons name="pencil-outline" size={13} color={colors.textMuted} />
              <Text style={[styles.editProfileBtnText, { color: colors.textMuted }]}>Edit Profile</Text>
            </Pressable>
          </Animated.View>
        </View>
        </LinearGradient>

        {/* Edit Profile Modal */}
        <Modal
          visible={showEditProfile}
          animationType="slide"
          transparent
          onRequestClose={() => setShowEditProfile(false)}
        >
          <View style={styles.modalOverlay}>
            <Pressable style={styles.modalBackdrop} onPress={() => setShowEditProfile(false)} />
            <View style={[styles.editModalContent, { backgroundColor: colors.white, paddingBottom: insets.bottom + 16 }]}>
              <View style={[styles.editModalHandle, { backgroundColor: colors.borderCard }]} />
              <Text style={[styles.editModalTitle, { color: colors.textDark }]}>Edit Profile</Text>
              <View style={[styles.groupCard, { backgroundColor: colors.appBackground, marginHorizontal: 0, marginBottom: 0 }]}>
                <SettingRow icon="person-outline" label="Name" value={data.name} onPress={() => { setShowEditProfile(false); router.push("/edit-name"); }} theme={theme} />
                <SettingRow icon="school-outline" label="Role" value={roleDisplayName} onPress={() => { setShowEditProfile(false); router.push("/edit-role"); }} theme={theme} />
                <SettingRow icon="book-outline" label="School Status" value={schoolStatusText} onPress={() => { setShowEditProfile(false); router.push("/edit-school-status"); }} theme={theme} />
                <SettingRow icon="list-outline" label="Topics" value={`${data.topics.length} selected`} onPress={() => { setShowEditProfile(false); router.push("/edit-topics"); }} isLast theme={theme} />
              </View>
            </View>
          </View>
        </Modal>

        <AnimatedSection delay={460}>
          <Text style={[styles.sectionLabel, { color: colors.textLight }]}>MY PROGRESS</Text>
          
          <Pressable
            onPress={() => router.push('/knowledge-tree' as any)}
            style={({ pressed }) => [
              styles.journalWidget,
              { marginBottom: 16 },
              shadows.card,
              pressed && { transform: [{ scale: 0.98 }] }
            ]}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.9)', 'rgba(16, 185, 129, 0.15)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.journalGlass}
            >
              <View style={[styles.journalIconContainer, { backgroundColor: '#10B981', ...styles.iconGlow, shadowColor: '#10B981' }]}>
                <Ionicons name="leaf" size={28} color="#FFF" />
              </View>
              <View style={styles.journalInfo}>
                <Text style={[styles.journalTitle, { color: colors.textDark }]}>Knowledge Tree</Text>
                <Text style={[styles.journalCount, { color: colors.textMuted }]}>Explore concepts</Text>
              </View>
              <View style={[styles.journalArrow, { backgroundColor: 'rgba(255,255,255,0.5)' }]}>
                <Ionicons name="arrow-forward" size={18} color="#10B981" />
              </View>
            </LinearGradient>
          </Pressable>

          <Pressable
            onPress={() => router.push('/accomplishments' as any)}
            style={({ pressed }) => [
              styles.journalWidget,
              { marginBottom: 24 },
              shadows.card,
              pressed && { transform: [{ scale: 0.98 }] }
            ]}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.9)', 'rgba(245, 158, 11, 0.15)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.journalGlass}
            >
              <View style={[styles.journalIconContainer, { backgroundColor: '#F59E0B', ...styles.iconGlow, shadowColor: '#F59E0B' }]}>
                <Ionicons name="extension-puzzle" size={28} color="#FFF" />
              </View>
              <View style={styles.journalInfo}>
                <Text style={[styles.journalTitle, { color: colors.textDark }]}>My Puzzles</Text>
                <Text style={[styles.journalCount, { color: colors.textMuted }]}>View accomplishments</Text>
              </View>
              <View style={[styles.journalArrow, { backgroundColor: 'rgba(255,255,255,0.5)' }]}>
                <Ionicons name="arrow-forward" size={18} color="#F59E0B" />
              </View>
            </LinearGradient>
          </Pressable>
        </AnimatedSection>

        <AnimatedSection delay={500}>
          <Text style={[styles.sectionLabel, { color: colors.textLight }]}>MY JOURNAL</Text>

          <Pressable
            onPress={() => router.push("/journal")}
            style={({ pressed }) => [
              styles.journalWidget,
              shadows.card,
              pressed && { transform: [{ scale: 0.98 }] }
            ]}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.9)', 'rgba(123, 104, 238, 0.15)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.journalGlass}
            >


              <View style={[styles.journalIconContainer, { backgroundColor: colors.primary, ...styles.iconGlow }]}>
                <Ionicons name="journal" size={28} color="#FFF" />
              </View>
              <View style={styles.journalInfo}>
                <Text style={[styles.journalTitle, { color: colors.textDark }]}>Notebook Library</Text>
              </View>
              <View style={[styles.journalArrow, { backgroundColor: 'rgba(255,255,255,0.5)' }]}>
                <Ionicons name="arrow-forward" size={18} color={colors.primary} />
              </View>
            </LinearGradient>
          </Pressable>
        </AnimatedSection>

        <Animated.View style={[styles.footer, footerStyle]}>
          <Text style={[styles.footerText, { color: colors.indicatorInactive }]}>SchoolKit v{Constants.expoConfig?.version ?? '1.0.0'}</Text>
        </Animated.View>
      </ScrollView>
      {/* Modals removed to settings sheet */}
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
  identityCard: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(123,104,238,0.12)',
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
  schoolStatusText: {
    fontSize: 13,
    fontWeight: "400",
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 24,
  },
  topicsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 16,
  },
  topicChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
  },
  topicChipText: {
    fontSize: 12,
    fontWeight: "500",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 32,
  },
  statItem: {
    alignItems: "center",
    gap: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  statDivider: {
    width: 1,
    height: 28,
  },
  editProfileBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 100,
    borderWidth: 1,
  },
  editProfileBtnText: {
    fontSize: 13,
    fontWeight: "500",
  },
  editModalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  editModalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  editModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
    paddingLeft: 4,
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

  journalWidget: {
    marginHorizontal: 24,
    borderRadius: 24,
    marginBottom: 24,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)', // Primary color shadow -> back to white border
    backgroundColor: 'rgba(255,255,255,0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
  },
  journalGlass: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
  },
  journalIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  journalInfo: {
    flex: 1,
  },
  journalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  journalCount: {
    fontSize: 14,
    fontWeight: '500',
  },
  journalArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  iconGlow: {
    shadowColor: '#7B68EE',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
});
