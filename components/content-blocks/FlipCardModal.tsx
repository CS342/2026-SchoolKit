// The flip-card reveal modal. Hosted once by ContentPage; opened via ctx.onOpenFlip with
// the block's cards and the tapped index. The card opens on its front, then turns over
// to its back; tapping it turns it again, and prev/next step through the block's cards.
// The grid itself only shows fronts, so a long back never stretches it.
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Modal, Platform, Pressable, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBlockCtx, FlipDeck } from './context';
import { safeIcon, Markdown } from './util';

const IS_WEB = Platform.OS === 'web';
const HALF_TURN_MS = 160;
const REVEAL_DELAY_MS = 380;

export function FlipCardModal({ deck, onClose }: { deck: FlipDeck | null; onClose: () => void }) {
  const { colors, styles } = useBlockCtx();
  const [index, setIndex] = useState(deck?.index ?? 0);
  const [showBack, setShowBack] = useState(false);
  // A new deck (a card tapped) starts at its tapped card, in the same render.
  const [openDeck, setOpenDeck] = useState(deck);
  if (deck !== openDeck) {
    setOpenDeck(deck);
    if (deck) { setIndex(deck.index); setShowBack(false); }
  }
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;
  // Degrees about Y. A flip turns the card edge-on (90), swaps the face, then turns it
  // back from -90 to 0 — so each face lays out at its own height, with no mirrored text.
  const turn = useRef(new Animated.Value(0)).current;
  const busy = useRef(false);

  const visible = deck !== null;
  const cards = deck?.cards ?? [];
  const card = cards[Math.min(index, cards.length - 1)];

  const flipTo = (back: boolean) => {
    if (busy.current) return;
    busy.current = true;
    Animated.timing(turn, { toValue: 90, duration: HALF_TURN_MS, useNativeDriver: !IS_WEB }).start(() => {
      setShowBack(back);
      turn.setValue(-90);
      Animated.timing(turn, { toValue: 0, duration: HALF_TURN_MS, useNativeDriver: !IS_WEB }).start(() => { busy.current = false; });
    });
  };

  // Fade/scale in when a card is tapped.
  useEffect(() => {
    if (!deck) return;
    fade.setValue(0);
    scale.setValue(0.9);
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 180, useNativeDriver: !IS_WEB }),
      Animated.spring(scale, { toValue: 1, friction: 8, tension: 60, useNativeDriver: !IS_WEB }),
    ]).start();
  }, [deck]);

  // Every card shown (on open, prev/next) starts on its front, then turns to reveal its back.
  useEffect(() => {
    if (!deck) return;
    busy.current = false;
    turn.setValue(0);
    setShowBack(false);
    const t = setTimeout(() => flipTo(true), REVEAL_DELAY_MS);
    return () => clearTimeout(t);
  }, [deck, index]);

  const close = () => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 0, duration: 140, useNativeDriver: !IS_WEB }),
      Animated.timing(scale, { toValue: 0.9, duration: 140, useNativeDriver: !IS_WEB }),
    ]).start(() => onClose());
  };
  const go = (delta: number) => setIndex((i) => Math.max(0, Math.min(cards.length - 1, i + delta)));

  // Keyboard on web: Esc closes, arrows step through the cards, space/enter flips.
  const keyRef = useRef<(e: KeyboardEvent) => void>(() => {});
  keyRef.current = (e: KeyboardEvent) => {
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowRight') go(1);
    else if (e.key === 'ArrowLeft') go(-1);
    else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flipTo(!showBack); }
  };
  useEffect(() => {
    if (!IS_WEB || !visible) return;
    const onKey = (e: KeyboardEvent) => keyRef.current(e);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [visible]);

  if (!visible || !card) return null;

  const hex = card.colorHex;
  const rotateY = turn.interpolate({ inputRange: [-90, 90], outputRange: ['-90deg', '90deg'] });
  const many = cards.length > 1;

  const front = (
    <View style={[st.face, st.frontFace, { backgroundColor: hex + '1F', borderColor: hex + '66' }]}>
      {card.icon ? <Ionicons name={safeIcon(card.icon)} size={40} color={hex} style={{ marginBottom: 14 }} /> : null}
      <Text style={[st.frontText, { color: colors.textDark }]}>{card.front}</Text>
      <View style={st.hintRow}>
        <Ionicons name="sync-outline" size={14} color={colors.textLight} />
        <Text style={[st.hint, { color: colors.textLight }]}>Tap to flip</Text>
      </View>
    </View>
  );

  const back = (
    <View style={[st.face, { borderColor: hex + '66' }]}>
      <View style={st.backHeader}>
        {card.icon ? (
          <View style={[st.backIcon, { backgroundColor: hex + '22' }]}>
            <Ionicons name={safeIcon(card.icon)} size={18} color={hex} />
          </View>
        ) : null}
        <Text style={[st.backTitle, { color: hex }]}>{card.front}</Text>
      </View>
      <View style={[st.divider, { backgroundColor: hex + '33' }]} />
      <ScrollView style={st.backScroll} showsVerticalScrollIndicator={false}>
        <Markdown
          markdown={card.back}
          paraStyle={{ ...styles.richPara, color: colors.textDark }}
          bulletRowStyle={styles.richBulletRow}
          bulletDotStyle={{ ...styles.richBulletDot, color: hex }}
          linkColor={colors.primary}
          onLink={(href) => { Linking.openURL(href).catch(() => {}); }}
        />
      </ScrollView>
    </View>
  );

  const content = (
    <View style={styles.modalOverlay} pointerEvents="box-none">
      <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="Close">
        <Animated.View style={[styles.modalBackdrop, { opacity: fade }]} />
      </Pressable>

      <Animated.View style={[st.container, { opacity: fade, transform: [{ scale }] }]}>
        <View style={st.topRow}>
          <Text style={st.counter}>{many ? `${index + 1} of ${cards.length}` : ''}</Text>
          <TouchableOpacity onPress={close} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close card" style={[st.roundBtn, IS_WEB && ({ cursor: 'pointer' } as any)]}>
            <Ionicons name="close" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <Pressable
          onPress={() => flipTo(!showBack)}
          accessibilityRole="button"
          accessibilityLabel={showBack ? `${card.front}. ${card.back}` : card.front}
          accessibilityHint={showBack ? 'Shows the front of the card' : 'Reveals the back of the card'}
          style={IS_WEB ? ({ cursor: 'pointer' } as any) : undefined}
        >
          <Animated.View style={[st.card, { backgroundColor: colors.white, transform: [{ perspective: 1200 }, { rotateY }] }]}>
            {showBack ? back : front}
          </Animated.View>
        </Pressable>

        {many ? (
          <View style={st.navRow}>
            <NavBtn icon="chevron-back" label="Previous card" disabled={index === 0} onPress={() => go(-1)} />
            <NavBtn icon="chevron-forward" label="Next card" disabled={index === cards.length - 1} onPress={() => go(1)} />
          </View>
        ) : null}
      </Animated.View>
    </View>
  );

  if (IS_WEB) return <View style={StyleSheet.absoluteFill} pointerEvents="box-none">{content}</View>;
  return <Modal visible transparent animationType="none" onRequestClose={close}>{content}</Modal>;
}

function NavBtn({ icon, label, disabled, onPress }: { icon: string; label: string; disabled: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[st.roundBtn, st.navBtn, { opacity: disabled ? 0.35 : 1 }, IS_WEB && !disabled && ({ cursor: 'pointer' } as any)]}
    >
      <Ionicons name={icon as any} size={22} color="#fff" />
    </TouchableOpacity>
  );
}

const st = StyleSheet.create({
  container: { width: '88%', maxWidth: 460 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  counter: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontFamily: 'Raleway_700Bold', letterSpacing: 0.3 },
  roundBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.16)' },
  card: { borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.25, shadowRadius: 24, elevation: 12 },
  face: { minHeight: 260, maxHeight: 520, padding: 24, borderRadius: 24, borderWidth: 2 },
  frontFace: { alignItems: 'center', justifyContent: 'center' },
  frontText: { fontSize: 22, lineHeight: 30, fontFamily: 'Raleway_700Bold', textAlign: 'center', letterSpacing: -0.3 },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 18 },
  hint: { fontSize: 12, fontFamily: 'Raleway_600SemiBold' },
  backHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  backTitle: { flex: 1, fontSize: 16, lineHeight: 22, fontFamily: 'Raleway_800ExtraBold' },
  divider: { height: 2, borderRadius: 1, marginVertical: 14 },
  backScroll: { flexGrow: 0, flexShrink: 1 },
  navRow: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 16 },
  navBtn: { width: 44, height: 44, borderRadius: 22 },
});
