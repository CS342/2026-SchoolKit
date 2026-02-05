import React, { useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Image,
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
import { useOnboarding } from "../../contexts/OnboardingContext";
import { useAuth } from "../../contexts/AuthContext";
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
            <Text style={[styles.rowValue, { color: colors.textLight }]} numberOfLines={1}>
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
  const { signOut } = useAuth();
  const theme = useTheme();
  const { colors, shadows, appStyles, isDark, themePreference, setThemePreference } = theme;
  const {
    data,
    resetOnboarding,
    updateProfilePicture,
    downloadAllResources,
    downloads,
  } = useOnboarding();

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
        return "Student (K-8)";
      case "student-hs":
        return "Student (High School+)";
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
    return data.schoolStatuses.map((s) => s.replace(/-/g, " ")).join(", ");
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
    });
    if (!result.canceled && result.assets[0]) {
      await updateProfilePicture(result.assets[0].uri);
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
    });
    if (!result.canceled && result.assets[0]) {
      await updateProfilePicture(result.assets[0].uri);
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
    const currentLabel = themePreference === 'system' ? 'System' : themePreference === 'light' ? 'Light' : 'Dark';
    Alert.alert("Appearance", `Current: ${currentLabel}`, [
      { text: "System", onPress: () => setThemePreference('system') },
      { text: "Light", onPress: () => setThemePreference('light') },
      { text: "Dark", onPress: () => setThemePreference('dark') },
      { text: "Cancel", style: "cancel" },
    ]);
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
              icon="moon-outline"
              label="Appearance"
              value={appearanceLabel}
              onPress={handleAppearance}
              theme={theme}
            />
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
            <SettingRow icon="information-circle-outline" label="About SchoolKit" onPress={() => {}} theme={theme} />
            <SettingRow icon="help-circle-outline" label="Help & Support" onPress={() => {}} isLast theme={theme} />
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
    color: "#FFFFFF",
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
    maxWidth: 160,
  },
  footer: {
    alignItems: "center",
    paddingTop: 8,
  },
  footerText: {
    fontSize: 13,
    fontWeight: "500",
  },
});
