import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, Pressable, NativeSyntheticEvent, NativeScrollEvent, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADII, TYPOGRAPHY, SPACING } from '../constants/onboarding-theme';
import { PrimaryButton } from './onboarding/PrimaryButton';

interface CommunityNormsModalProps {
  visible: boolean;
  onClose: () => void;
  mode: 'view' | 'submit' | 'select';
  onAgree?: (selected: string[]) => void;
}

const NORMS = [
  { id: 'Be Kind and Supportive', desc: 'Share your authentic experiences, and if you respond to others, focus on encouragement and support. Treat everyone with compassion, empathy, and respect.' },
  { id: 'No Medical Advice', desc: 'This is a place for peer support, sharing coping strategies, and finding comfort. It is not a substitute for professional medical care or counseling. Please consult your healthcare team for medical questions or treatments.' },
  { id: "Protect Your Privacy (and Others')", desc: 'Do not share sensitive personal information like school names, addresses, phone numbers, or passwords. Respect the privacy of friends, teachers, and family by keeping them anonymous. Avoid sharing photos or videos that reveal identities without permission.' },
  { id: "Respect Everyone's Journey", desc: "Everyone's experience with cancer and school is unique. Use inclusive, non-judgmental language, and avoid judging or comparing others' journeys." },
  { id: 'Zero Tolerance for Bullying or Hate', desc: 'Harassment, hate speech, bullying, or inappropriate content will not be tolerated. Moderators review all stories; violations may result in removal or account suspension. If you see concerning content, please report it.' },
  { id: 'Stay On Topic', desc: 'Stories should relate to experiences with illness, school, or coping with transitions. Off-topic posts may be removed to keep the community focused and supportive.' },
  { id: 'Safe Language and Tone', desc: "Avoid triggering language or graphic medical details. Share what's helpful and safe for others to read." }
];

export function CommunityNormsModal({ visible, onClose, mode, onAgree }: CommunityNormsModalProps) {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<string[]>([]);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [scrollViewHeight, setScrollViewHeight] = useState(0);

  useEffect(() => {
    if (visible) {
      setHasScrolledToBottom(false);
      setSelected([]);
    }
  }, [visible, mode]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (mode !== 'submit' || hasScrolledToBottom) return;
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 50) {
      setHasScrolledToBottom(true);
    }
  };

  const toggleNorm = (id: string) => {
    if (mode !== 'select') return;
    setSelected(prev => prev.includes(id) ? prev.filter(n => n !== id) : [...prev, id]);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: Platform.OS === 'android' ? insets.top : 0 }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Community Norms</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={24} color={COLORS.textDark} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          onLayout={(e) => setScrollViewHeight(e.nativeEvent.layout.height)}
          onContentSizeChange={(w, h) => {
            if (mode === 'submit' && scrollViewHeight > 0 && h <= scrollViewHeight + 50) {
              setHasScrolledToBottom(true);
            }
          }}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {mode === 'select' && (
            <Text style={styles.selectHint}>Select which norms this story violates:</Text>
          )}

          {NORMS.map(norm => {
            const isSelected = selected.includes(norm.id);
            return (
              <Pressable 
                key={norm.id} 
                style={[styles.normBlock, mode === 'select' && styles.normBlockSelectable, isSelected && styles.normBlockSelected]}
                onPress={() => toggleNorm(norm.id)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {mode === 'select' && (
                    <Ionicons 
                        name={isSelected ? "checkbox" : "square-outline"} 
                        size={22} 
                        color={isSelected ? COLORS.primary : COLORS.textLight} 
                        style={{ marginRight: 12, marginTop: -2 }}
                    />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.normTitle, isSelected && { color: COLORS.primary }]}>{norm.id}</Text>
                    <Text style={styles.normText}>{norm.desc}</Text>
                  </View>
                </View>
              </Pressable>
            );
          })}

          {mode === 'submit' && (
            <View style={styles.ackBox}>
              <Text style={styles.ackTitle}>A Promise to Our Community</Text>
              <Text style={styles.ackText}>Thank you for being willing to share something so personal. By submitting your story, you're agreeing to hold this space with care — for yourself and for everyone else here who is going through something hard. All stories are reviewed before they appear in the feed.</Text>
            </View>
          )}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
          {mode === 'submit' ? (
            <PrimaryButton
              title={hasScrolledToBottom ? "I Promise & Share My Story" : "Read our promise to agree"}
              onPress={() => onAgree?.([])} 
              disabled={!hasScrolledToBottom}
            />
          ) : mode === 'select' ? (
            <PrimaryButton 
              title={`Reject Story (${selected.length} Selected)`} 
              onPress={() => onAgree?.(selected)} 
              disabled={selected.length === 0}
            />
          ) : (
            <PrimaryButton title="Got It" onPress={onClose} />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.appBackground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderCard,
    backgroundColor: COLORS.white,
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textDark,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  selectHint: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 20,
    lineHeight: 20,
  },
  normBlock: {
    marginBottom: 20,
    borderRadius: RADII.card,
    padding: 12,
    marginHorizontal: -12,
  },
  normBlockSelectable: {
    borderWidth: 1,
    borderColor: 'transparent',
  },
  normBlockSelected: {
    backgroundColor: COLORS.primary + '10',
    borderColor: COLORS.primary + '30',
  },
  normTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 6,
  },
  normText: {
    fontSize: 15,
    color: COLORS.textMuted,
    lineHeight: 22,
  },
  ackBox: {
    backgroundColor: COLORS.primary + '10',
    padding: 16,
    borderRadius: RADII.card,
    marginTop: 10,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  ackTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 8,
  },
  ackText: {
    fontSize: 14,
    color: COLORS.textDark,
    lineHeight: 20,
  },
  footer: {
    paddingTop: 16,
    paddingHorizontal: 20,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderCard,
  },
});
