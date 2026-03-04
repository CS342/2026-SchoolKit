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


export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { colors, shadows, appStyles } = theme;
  const { data, updateProfilePicture } = useOnboarding();

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

        <AnimatedSection delay={420}>
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
  }
});
