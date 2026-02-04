import React, { useEffect } from "react";
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
import { useOnboarding } from "../../contexts/OnboardingContext";
import { useAuth } from "../../contexts/AuthContext";
import { ALL_RESOURCES } from "../../constants/resources";
import {
  COLORS,
  SHADOWS,
  RADII,
  SIZING,
  SPACING,
  BORDERS,
  ANIMATION,
  APP_STYLES,
} from "../../constants/onboarding-theme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// A single row inside a grouped section
function SettingRow({
  icon,
  label,
  value,
  onPress,
  isLast = false,
  tint,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress: () => void;
  isLast?: boolean;
  tint?: string;
}) {
  const scale = useSharedValue(1);

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
      <View style={[styles.rowIconWrap, tint ? { backgroundColor: tint } : null]}>
        <Ionicons
          name={icon}
          size={18}
          color={tint ? COLORS.white : COLORS.primary}
        />
      </View>
      <View style={[styles.rowBody, !isLast && styles.rowBorder]}>
        <Text style={styles.rowLabel}>{label}</Text>
        <View style={styles.rowRight}>
          {value ? (
            <Text style={styles.rowValue} numberOfLines={1}>
              {value}
            </Text>
          ) : null}
          <Ionicons name="chevron-forward" size={18} color={COLORS.indicatorInactive} />
        </View>
      </View>
    </AnimatedPressable>
  );
}

// Animated group container
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
  const { signOut } = useAuth();
  const {
    data,
    resetOnboarding,
    updateProfilePicture,
    downloadAllResources,
    downloads,
  } = useOnboarding();

  // Avatar entrance
  const avatarScale = useSharedValue(0);
  const avatarOpacity = useSharedValue(0);
  // Identity text entrance
  const nameOpacity = useSharedValue(0);
  const nameTranslateY = useSharedValue(12);
  // Footer
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

  // Photo handlers
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={APP_STYLES.tabHeader}>
        <Text style={APP_STYLES.tabHeaderTitle}>Profile</Text>
        <Text style={APP_STYLES.tabHeaderSubtitle}>Manage your information</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Identity */}
        <View style={styles.identity}>
          <Pressable onPress={handleProfilePicture}>
            <Animated.View style={avatarStyle}>
              <View style={styles.avatar}>
                {data.profilePicture ? (
                  <Image source={{ uri: data.profilePicture }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarInitial}>
                    {data.name.charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
              <View style={styles.cameraBadge}>
                <Ionicons name="camera" size={14} color={COLORS.white} />
              </View>
            </Animated.View>
          </Pressable>

          <Animated.View style={[styles.identityText, nameStyle]}>
            <Text style={styles.userName}>{data.name}</Text>
            <View style={styles.rolePill}>
              <Text style={styles.rolePillText}>{getRoleDisplayName()}</Text>
            </View>
          </Animated.View>
        </View>

        {/* Section: Profile */}
        <AnimatedSection delay={320}>
          <Text style={styles.sectionLabel}>PROFILE</Text>
          <View style={styles.groupCard}>
            <SettingRow
              icon="person-outline"
              label="Name"
              value={data.name}
              onPress={() => router.push("/edit-name")}
            />
            <SettingRow
              icon="school-outline"
              label="Role"
              value={getRoleDisplayName()}
              onPress={() => router.push("/edit-role")}
            />
            <SettingRow
              icon="book-outline"
              label="School Status"
              value={getSchoolStatusText()}
              onPress={() => router.push("/edit-school-status")}
            />
            <SettingRow
              icon="list-outline"
              label="Topics"
              value={`${data.topics.length} selected`}
              onPress={() => router.push("/edit-topics")}
              isLast
            />
          </View>
        </AnimatedSection>

        {/* Section: General */}
        <AnimatedSection delay={460}>
          <Text style={styles.sectionLabel}>GENERAL</Text>
          <View style={styles.groupCard}>
            <SettingRow
              icon="cloud-download-outline"
              label="Download All"
              value={
                downloads.length >= ALL_RESOURCES.length
                  ? "All saved"
                  : `${downloads.length}/${ALL_RESOURCES.length}`
              }
              onPress={handleDownloadAll}
            />
            <SettingRow
              icon="refresh-outline"
              label="Retake Survey"
              onPress={handleRetakeSurvey}
            />
            <SettingRow
              icon="information-circle-outline"
              label="About SchoolKit"
              onPress={() => {}}
            />
            <SettingRow
              icon="help-circle-outline"
              label="Help & Support"
              onPress={() => {}}
              isLast
            />
          </View>
        </AnimatedSection>

        {/* Sign Out — standalone */}
        <AnimatedSection delay={580}>
          <View style={styles.groupCard}>
            <SettingRow
              icon="log-out-outline"
              label="Sign Out"
              onPress={handleSignOut}
              tint={COLORS.error}
              isLast
            />
          </View>
        </AnimatedSection>

        {/* Footer */}
        <Animated.View style={[styles.footer, footerStyle]}>
          <Text style={styles.footerText}>SchoolKit v1.0.0</Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.appBackground,
  },
  scroll: {
    paddingBottom: 48,
  },

  // ── Identity ──────────────────────────────────
  identity: {
    alignItems: "center",
    paddingTop: 32,
    paddingBottom: 28,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.primary,
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
    color: COLORS.white,
    letterSpacing: -0.5,
  },
  cameraBadge: {
    position: "absolute",
    bottom: 0,
    right: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
    borderColor: COLORS.appBackground,
  },
  identityText: {
    alignItems: "center",
    marginTop: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.textDark,
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  rolePill: {
    backgroundColor: COLORS.backgroundLight,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 100,
  },
  rolePillText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.primary,
  },

  // ── Sections ──────────────────────────────────
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textLight,
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: SPACING.screenPadding + 4,
  },
  groupCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.screenPadding,
    borderRadius: 16,
    marginBottom: 24,
    ...SHADOWS.card,
  },

  // ── Row ───────────────────────────────────────
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
    backgroundColor: COLORS.backgroundLight,
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
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.borderCard,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.textDark,
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
    color: COLORS.textLight,
    maxWidth: 160,
  },

  // ── Footer ────────────────────────────────────
  footer: {
    alignItems: "center",
    paddingTop: 8,
  },
  footerText: {
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.indicatorInactive,
  },
});
