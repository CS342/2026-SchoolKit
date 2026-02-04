import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useOnboarding } from "../../contexts/OnboardingContext";
import { useAuth } from "../../contexts/AuthContext";
import { ALL_RESOURCES } from "../../constants/resources";
import { COLORS } from "../../constants/onboarding-theme";

function SettingItem({ icon, title, subtitle, onPress }: any) {
  return (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingIcon}>
        <Ionicons name={icon} size={24} color={COLORS.primary} />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={22} color={COLORS.indicatorInactive} />
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { data, resetOnboarding, updateProfilePicture, downloadAllResources, downloads } = useOnboarding();

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
      Alert.alert(
        "Permission needed",
        "Camera permission is required to take photos."
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      console.log('📷 Uploading photo from camera...');
      await updateProfilePicture(result.assets[0].uri);
      console.log('📷 Photo upload complete');
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Photo library permission is required to choose photos."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      console.log('📷 Uploading photo from library...');
      await updateProfilePicture(result.assets[0].uri);
      console.log('📷 Photo upload complete');
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
    Alert.alert(
      "Retake Survey",
      "This will reset your profile. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Retake",
          style: "destructive",
          onPress: () => {
            resetOnboarding();
            router.replace("/welcome");
          },
        },
      ]
    );
  };

  const handleDownloadAll = () => {
    const allDownloaded = downloads.length >= ALL_RESOURCES.length;
    if (allDownloaded) {
      Alert.alert(
        "Already Downloaded",
        "All resources are already available offline."
      );
    } else {
      Alert.alert(
        "Download All Resources",
        "This will save all resources for offline access.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Download All",
            onPress: async () => {
              await downloadAllResources();
              Alert.alert("Success", "All resources are now available offline!");
            },
          },
        ]
      );
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            await signOut();
            router.replace("/welcome");
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <Text style={styles.headerSubtitle}>Manage your information</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.userCard}>
          <TouchableOpacity onPress={handleProfilePicture} activeOpacity={0.8}>
            <View style={styles.userAvatar}>
              {data.profilePicture ? (
                <Image
                  source={{ uri: data.profilePicture }}
                  style={styles.profileImage}
                />
              ) : (
                <Text style={styles.userInitial}>
                  {data.name.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
            <View style={styles.cameraIcon}>
              <Ionicons name="camera" size={20} color={COLORS.white} />
            </View>
          </TouchableOpacity>
          <Text style={styles.userName}>{data.name}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>{getRoleDisplayName()}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Information</Text>
          <SettingItem
            icon="person-outline"
            title="Name"
            subtitle={data.name}
            onPress={() => router.push("/edit-name")}
          />
          <SettingItem
            icon="school-outline"
            title="Role"
            subtitle={getRoleDisplayName()}
            onPress={() => router.push("/edit-role")}
          />
          <SettingItem
            icon="book-outline"
            title="School Status"
            subtitle={getSchoolStatusText()}
            onPress={() => router.push("/edit-school-status")}
          />
          <SettingItem
            icon="list-outline"
            title="Topics"
            subtitle={`${data.topics.length} selected`}
            onPress={() => router.push("/edit-topics")}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <SettingItem
            icon="cloud-download-outline"
            title="Download All Resources"
            subtitle={downloads.length >= ALL_RESOURCES.length ? "All resources saved offline" : `${downloads.length}/${ALL_RESOURCES.length} resources saved`}
            onPress={handleDownloadAll}
          />
          <SettingItem
            icon="refresh-outline"
            title="Retake Survey"
            subtitle="Start over with a fresh profile"
            onPress={handleRetakeSurvey}
          />
          <SettingItem
            icon="information-circle-outline"
            title="About SchoolKit"
            subtitle="Learn more about this app"
            onPress={() => {}}
          />
          <SettingItem
            icon="help-circle-outline"
            title="Help & Support"
            subtitle="Get assistance"
            onPress={() => {}}
          />
          <SettingItem
            icon="log-out-outline"
            title="Sign Out"
            subtitle="Sign out of your account"
            onPress={handleSignOut}
          />
        </View>

        <Text style={styles.version}>SchoolKit v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.appBackground },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
    backgroundColor: COLORS.white,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.borderCard,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 38,
    fontWeight: "800",
    color: COLORS.textDark,
    marginBottom: 6,
  },
  headerSubtitle: { fontSize: 18, fontWeight: "600", color: COLORS.textMuted },
  scrollContent: { paddingTop: 28, paddingBottom: 40 },
  userCard: {
    alignItems: "center",
    backgroundColor: COLORS.white,
    marginHorizontal: 24,
    padding: 36,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: COLORS.borderCard,
    marginBottom: 32,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  userAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    overflow: "hidden",
    position: "relative",
  },
  profileImage: { width: 120, height: 120, borderRadius: 60 },
  cameraIcon: {
    position: "absolute",
    bottom: 20,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: COLORS.white,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  userInitial: { fontSize: 48, fontWeight: "800", color: COLORS.white },
  userName: {
    fontSize: 30,
    fontWeight: "800",
    color: COLORS.textDark,
    marginBottom: 14,
  },
  roleBadge: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: COLORS.backgroundLighter,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.borderPurple,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  roleBadgeText: { fontSize: 16, fontWeight: "700", color: COLORS.primary },
  section: { marginBottom: 32, paddingHorizontal: 24 },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.textDark,
    marginBottom: 20,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 24,
    marginBottom: 14,
    borderWidth: 3,
    borderColor: COLORS.borderCard,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  settingIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.backgroundLighter,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingContent: { flex: 1 },
  settingTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2D2D44",
    marginBottom: 4,
  },
  settingSubtitle: { fontSize: 15, fontWeight: "600", color: "#8E8EA8" },
  version: {
    fontSize: 16,
    fontWeight: "600",
    color: "#A8A8B8",
    textAlign: "center",
    marginTop: 20,
  },
});
