import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SHADOWS, RADII } from '../constants/onboarding-theme';
import { PrimaryButton } from './onboarding/PrimaryButton';

interface ReportStoryModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (reason: string, details: string) => void;
}

const REPORT_REASONS = [
  'Spam or misleading',
  'Inappropriate or offensive content',
  'Harassment or bullying',
  'Breaks community guidelines',
  'Other'
];

export function ReportStoryModal({ visible, onClose, onSubmit }: ReportStoryModalProps) {
  const insets = useSafeAreaInsets();
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [details, setDetails] = useState('');

  const handleSubmit = () => {
    if (selectedReason) {
      onSubmit(selectedReason, details);
      setSelectedReason(null);
      setDetails('');
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedReason(null);
    setDetails('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        
        <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom + 20, 20) }]}>
          <View style={styles.header}>
            <Text style={styles.title}>Report Story</Text>
            <Pressable onPress={handleClose} hitSlop={10}>
              <Ionicons name="close" size={24} color={COLORS.textLight} />
            </Pressable>
          </View>

          <Text style={styles.subtitle}>
            Please select a reason for reporting this story to help our moderators understand the issue.
          </Text>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.optionsList}>
              {REPORT_REASONS.map((reason) => {
                const isSelected = selectedReason === reason;
                return (
                  <Pressable
                    key={reason}
                    style={[styles.option, isSelected && styles.optionSelected]}
                    onPress={() => setSelectedReason(reason)}
                  >
                    <View style={[styles.radio, isSelected && styles.radioSelected]}>
                      {isSelected && <View style={styles.radioInner} />}
                    </View>
                    <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                      {reason}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {selectedReason === 'Other' && (
              <TextInput
                style={styles.textInput}
                placeholder="Can you tell us more?"
                placeholderTextColor={COLORS.textLight + '80'}
                value={details}
                onChangeText={setDetails}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                maxLength={300}
              />
            )}
          </ScrollView>

          <View style={styles.footer}>
            <View style={styles.submitBtn}>
              <PrimaryButton 
                title="Submit Report" 
                onPress={handleSubmit} 
                disabled={!selectedReason || (selectedReason === 'Other' && details.trim().length === 0)}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADII.cardLarge || 24,
    borderTopRightRadius: RADII.cardLarge || 24,
    paddingTop: 24,
    paddingHorizontal: 20,
    maxHeight: '80%',
    ...SHADOWS.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    lineHeight: 20,
    marginBottom: 20,
  },
  scrollView: {
    maxHeight: 400,
  },
  optionsList: {
    gap: 12,
    marginBottom: 16,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: RADII.card,
    backgroundColor: COLORS.backgroundLight,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  optionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '0D',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: COLORS.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  optionText: {
    fontSize: 15,
    color: COLORS.textDark,
    fontWeight: '500',
  },
  optionTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: COLORS.backgroundLight,
    borderRadius: RADII.card,
    padding: 16,
    fontSize: 15,
    color: COLORS.textDark,
    minHeight: 100,
    marginTop: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  footer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  submitBtn: {
    width: '100%',
  }
});
