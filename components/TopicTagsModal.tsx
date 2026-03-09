import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../contexts/ThemeContext";
import { AppTheme } from "../constants/theme";
import { COLORS, RADII, TYPOGRAPHY } from "../constants/onboarding-theme";
import { TAG_COLORS, DEFAULT_TAG_COLOR } from "./StoryCard";

export const TOPIC_TAGS = [
  // School Stage
  "Back to School",
  "In School",
  "Taking a Break",
  "Home / Hospital Learning",

  // treatment stage
  "During Treatment",
  "After Treatment",
  "Before Treatment",

  // Academics  
  "Catching Up",
  "School Support",
  "Attendance",
  "Activities",
  "Workload",
  "Test Stress",
  "School Environment",

  // Social & Emotional
  "Friendships",
  "Relationships",
  "Mental Health",
  "Confidence",

  // symptoms
  "Fatigue",
  "Anxiety",
  "Depression",
  "Sleep",

  // Practical
  "Financial Support",
  "Logistics",
  "College Planning",
];

interface TopicTagsModalProps {
  visible: boolean;
  onClose: () => void;
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  onClearAll?: () => void;
  maxTags?: number;
  useModal?: boolean;
}

export function TopicTagsModal({
  visible,
  onClose,
  selectedTags,
  onToggleTag,
  onClearAll,
  maxTags,
  useModal = true,
}: TopicTagsModalProps) {
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(
    () => makeStyles(colors, isDark),
    [colors, isDark]
  );

  const atLimit = maxTags !== undefined && selectedTags.length >= maxTags;
  const insets = useSafeAreaInsets();

  const content = (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[
        styles.overlay,
        !useModal && StyleSheet.absoluteFill,
        !useModal && { zIndex: 100 },
      ]}
    >
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

      <View
        style={[
          styles.modalContent,
          { paddingBottom: Math.max(insets.bottom + 20, 20) },
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Topic Tags</Text>
          <View style={styles.headerRight}>
            {onClearAll && selectedTags.length > 0 && (
              <Pressable
                onPress={onClearAll}
                style={styles.clearBtn}
                hitSlop={10}
              >
                <Text style={styles.clearBtnText}>Clear All</Text>
              </Pressable>
            )}
            <Pressable onPress={onClose} hitSlop={10} style={styles.doneBtn}>
              <Text style={styles.doneBtnText}>Done</Text>
            </Pressable>
          </View>
        </View>

        <Text style={styles.subtitle}>
          {maxTags
            ? `${selectedTags.length} of ${maxTags} tags selected`
            : "Select tags that best describe your school experience."}
        </Text>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.optionsList}>
            {TOPIC_TAGS.map((tag) => {
              const colorInfo = TAG_COLORS[tag] ?? DEFAULT_TAG_COLOR;
              const isSelected = selectedTags.includes(tag);
              const isDisabled = atLimit && !isSelected;
              return (
                <Pressable
                  key={tag}
                  style={[
                    styles.option,
                    { backgroundColor: colorInfo.bg, borderColor: 'transparent' },
                    isSelected && { backgroundColor: colorInfo.text },
                    isDisabled && styles.optionDisabled,
                  ]}
                  onPress={() => !isDisabled && onToggleTag(tag)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      { color: colorInfo.text },
                      isSelected && { color: COLORS.white },
                    ]}
                  >
                    {tag}
                  </Text>
                  {isSelected ? (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color={COLORS.white}
                    />
                  ) : (
                    <Ionicons
                      name="ellipse-outline"
                      size={24}
                      color={colorInfo.text}
                    />
                  )}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );

  if (!visible) return null;

  if (useModal) {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        {content}
      </Modal>
    );
  }

  return content;
}

function makeStyles(c: AppTheme["colors"], isDark: boolean) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.4)",
      justifyContent: "flex-end",
    },
    modalContent: {
      backgroundColor: isDark ? c.backgroundLight : c.white,
      borderTopLeftRadius: RADII.cardLarge || 24,
      borderTopRightRadius: RADII.cardLarge || 24,
      paddingTop: 24,
      paddingHorizontal: 20,
      maxHeight: "80%",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    title: {
      ...TYPOGRAPHY.h2,
      color: c.textDark,
    },
    headerRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    clearBtn: {
      paddingVertical: 6,
      paddingHorizontal: 4,
    },
    clearBtnText: {
      fontSize: 14,
      color: c.textLight,
      fontWeight: "500",
    },
    doneBtn: {
      backgroundColor: isDark ? c.primary + "30" : c.primary + "15",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    doneBtnText: {
      fontSize: 14,
      fontWeight: "700",
      color: c.primary,
    },
    subtitle: {
      fontSize: 15,
      color: c.textLight,
      lineHeight: 22,
      marginBottom: 20,
    },
    scrollView: {
      marginBottom: 10,
    },
    optionsList: {
      gap: 8,
    },
    option: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 16,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: isDark ? c.borderCard : "#E5E5EA",
      backgroundColor: isDark ? c.backgroundLight : c.white,
    },
    optionText: {
      flex: 1,
      fontSize: 16,
      fontWeight: "500",
      color: c.textDark,
    },
    optionDisabled: {
      opacity: 0.5,
      backgroundColor: isDark ? c.appBackground : "#F8F8FA",
    },
  });
}
