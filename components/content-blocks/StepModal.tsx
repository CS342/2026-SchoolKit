// The step-detail flip modal with TTS — ported from the finances page. Hosted once
// by ContentPage; opened via ctx.onOpenStep. Behavior lives here (content is data).
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Modal, Platform, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors } from '../../constants/theme';
import { BlockStyles, CARD_HEIGHT_FRONT, CARD_HEIGHT_BACK, FONT_STEPS } from './styles';
import { AppIcon } from '../ui/AppIcon';
import { ResolvedStep } from './context';

import { useTranslation } from 'react-i18next';
export function StepModal({
  visible, step, onClose, isSpeaking, isLoadingAudio, onToggleSpeak, playbackRate, onTogglePlaybackRate, isAudioLoaded, colors, styles,
}: {
  visible: boolean;
  step: ResolvedStep | null;
  onClose: () => void;
  isSpeaking: boolean;
  isLoadingAudio: boolean;
  onToggleSpeak: () => void;
  playbackRate: number;
  onTogglePlaybackRate: () => void;
  isAudioLoaded: boolean;
  colors: ThemeColors;
  styles: BlockStyles;
}) {
  const { t } = useTranslation();
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const flipAnim = useRef(new Animated.Value(0)).current;
  const [fontSizeStep, setFontSizeStep] = useState(0);

  useEffect(() => {
    if (visible) {
      flipAnim.setValue(0);
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
      const timer = setTimeout(() => {
        Animated.spring(flipAnim, { toValue: 1, friction: 8, tension: 10, useNativeDriver: false }).start();
      }, 850);
      return () => clearTimeout(timer);
    } else {
      scaleAnim.setValue(0.85);
      opacityAnim.setValue(0);
      flipAnim.setValue(0);
    }
  }, [visible, step]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, { toValue: 0.85, duration: 150, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start(() => onClose());
  };

  if (!step) return null;

  const color = step.colorHex;
  // The front is a solid fill under white text; dark-mode primary is too light for that.
  const frontFill = color === colors.primary ? colors.primaryFill : color;
  const frontRotate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backRotate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });
  const frontOpacity = flipAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0, 0] });
  const backOpacity = flipAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0, 1] });
  const cardHeight = flipAnim.interpolate({ inputRange: [0, 1], outputRange: [CARD_HEIGHT_FRONT, CARD_HEIGHT_BACK] });

  const content = (
    <View style={styles.modalOverlay} pointerEvents="box-none">
      <Pressable style={StyleSheet.absoluteFill} onPress={handleClose}>
        <Animated.View style={[styles.modalBackdrop, { opacity: opacityAnim }]} />
      </Pressable>

      <Animated.View style={[styles.modalContainer, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
        {/* Front */}
        <Animated.View style={[styles.modalCardShadow, { transform: [{ perspective: 1000 }, { rotateY: frontRotate }], opacity: frontOpacity, height: cardHeight }]}>
          <View style={[styles.modalCard, { height: '100%', backgroundColor: frontFill, borderColor: frontFill }]}>
            <View style={styles.frontInner}>
              <AppIcon name={step.icon} size={56} color="rgba(255,255,255,0.9)" style={{ marginBottom: 16 }} />
              <Text style={styles.frontTitle}>{step.title}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Back */}
        <Animated.View style={[styles.modalCardShadow, styles.backSide, { transform: [{ perspective: 1000 }, { rotateY: backRotate }], opacity: backOpacity, height: cardHeight }]}>
          <View style={[styles.modalCard, { height: '100%', backgroundColor: colors.white, borderColor: color }]}>
            <View style={styles.backInner}>
              <View style={styles.backHeader}>
                <View style={[styles.backIconCircle, { backgroundColor: color + '20' }]}>
                  <AppIcon name={step.icon} size={22} color={color} />
                </View>
                <Text style={[styles.backTitle, { color }]}>{step.title}</Text>
                <TouchableOpacity accessibilityRole="button" accessibilityLabel={isSpeaking ? t('common.a11y.stopReading') : t('common.a11y.readAloud')} onPress={onToggleSpeak} style={styles.speakerBtn} disabled={isLoadingAudio}>
                  {isLoadingAudio ? <ActivityIndicator size="small" color={color} /> : <Ionicons name={isSpeaking ? 'stop-circle-outline' : 'volume-high-outline'} size={26} color={isSpeaking ? colors.error : colors.textDark} />}
                </TouchableOpacity>
                {isAudioLoaded && (
                  <TouchableOpacity onPress={onTogglePlaybackRate} style={styles.speakerBtn}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color }}>{playbackRate}x</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setFontSizeStep((s) => (s + 1) % FONT_STEPS.length)} hitSlop={10} activeOpacity={0.7}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: fontSizeStep > 0 ? color : colors.textLight }}>Aa</Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.modalDivider, { backgroundColor: color + '30' }]} />
              <ScrollView style={styles.backScroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
                {step.detail.split('\n\n').map((para, idx) => (
                  <View key={idx} style={styles.tipRow}>
                    <Ionicons name="chevron-forward-circle" size={18} color={color} style={{ marginTop: 2, marginRight: 10, flexShrink: 0 }} />
                    <Text style={[styles.backText, { color: colors.textDark }, fontSizeStep > 0 && { fontSize: Math.round(16 * FONT_STEPS[fontSizeStep]), lineHeight: Math.round(24 * FONT_STEPS[fontSizeStep]) }]}>{para}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  );

  if (Platform.OS === 'web') {
    if (!visible) return null;
    return <View style={StyleSheet.absoluteFill} pointerEvents="box-none">{content}</View>;
  }
  return <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>{content}</Modal>;
}
