import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADII, TYPOGRAPHY } from '../constants/onboarding-theme';

export const TOPIC_TAGS = [
  'Diagnosis',
  'Treatment',
  'Side Effects',
  'Mental Health',
  'Navigating School',
  'Relationships',
  'Grief',
  'Uplifting',
  'Remission',
  'Advice'
];

interface TopicTagsModalProps {
  visible: boolean;
  onClose: () => void;
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  onClearAll?: () => void;
}

export function TopicTagsModal({ visible, onClose, selectedTags, onToggleTag, onClearAll }: TopicTagsModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        
        <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom + 20, 20) }]}>
          <View style={styles.header}>
            <Text style={styles.title}>Topic Tags</Text>
            <View style={styles.headerRight}>
              {onClearAll && selectedTags.length > 0 && (
                <Pressable onPress={onClearAll} style={styles.clearBtn} hitSlop={10}>
                  <Text style={styles.clearBtnText}>Clear All</Text>
                </Pressable>
              )}
              <Pressable onPress={onClose} hitSlop={10} style={styles.doneBtn}>
                <Text style={styles.doneBtnText}>Done</Text>
              </Pressable>
            </View>
          </View>

          <Text style={styles.subtitle}>
            Select tags that best describe your story.
          </Text>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.optionsList}>
              {TOPIC_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <Pressable
                    key={tag}
                    style={[styles.option, isSelected && styles.optionSelected]}
                    onPress={() => onToggleTag(tag)}
                  >
                    <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{tag}</Text>
                    {isSelected ? (
                      <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                    ) : (
                      <Ionicons name="ellipse-outline" size={24} color={COLORS.textLight} />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADII.cardLarge || 24,
    borderTopRightRadius: RADII.cardLarge || 24,
    paddingTop: 24,
    paddingHorizontal: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textDark,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clearBtn: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  clearBtnText: {
    fontSize: 14,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  doneBtn: {
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  doneBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textLight,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E5EA',
    backgroundColor: COLORS.white,
  },
  optionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '08',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textDark,
    marginRight: 10,
  },
  optionTextSelected: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});
