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

const PROMPTS = [
  "How did you navigate the first day back to school after diagnosis?",
  "What advice would you give to a newly diagnosed AYA?",
  "What is one thing you wish your teachers knew about cancer?",
  "What was a small academic win you experienced this week?",
  "How has your perspective on school changed since diagnosis?",
];

interface StoryStartersModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectPrompt: (prompt: string) => void;
}

export function StoryStartersModal({
  visible,
  onClose,
  onSelectPrompt,
}: StoryStartersModalProps) {
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View
          style={[
            styles.modalContent,
            { paddingBottom: Math.max(insets.bottom + 20, 20) },
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Story Starters</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={24} color={COLORS.textLight} />
            </Pressable>
          </View>

          <Text style={styles.subtitle}>
            Not sure where to begin? Choose a prompt to get started:
          </Text>

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.optionsList}>
              {PROMPTS.map((prompt, index) => (
                <Pressable
                  key={index}
                  style={styles.option}
                  onPress={() => {
                    onSelectPrompt(prompt);
                    onClose();
                  }}
                >
                  <Text style={styles.optionText}>{prompt}</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={COLORS.textLight}
                  />
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function makeStyles(c: AppTheme['colors'], isDark: boolean) {
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
    gap: 12,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: isDark ? c.borderCard : "#E5E5EA",
    backgroundColor: isDark ? c.backgroundLight : c.appBackground,
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: c.textDark,
    lineHeight: 22,
    marginRight: 10,
  },
});
}
