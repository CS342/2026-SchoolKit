// ContentPage — renders a ContentDoc. Web uses the ArticleLayout frame (breadcrumb,
// sticky TOC, title/actions); native uses the header + reading column. Hosts the
// single step-detail modal + TTS. This is the runtime the finances page will render
// through once it lives in Supabase.
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { generateSpeech } from '../../services/elevenLabs';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useWebLayout } from '../../hooks/useResponsive';
import { ContentColumn, ArticleLayout, ArticleSection } from '../ui';
import { BookmarkButton } from '../BookmarkButton';
import { DownloadButton } from '../DownloadButton';
import { ContentDoc, HeroBlock } from '../../features/content/types';
import { makeBlockStyles } from './styles';
import { BlockCtx, BlockCtxProvider, makeColorResolver, ResolvedStep } from './context';
import { BlockRenderer, HeroTitle, blockHeading } from './blocks';
import { BlockEntrance } from './util';
import { StepModal } from './StepModal';

const GRID_TYPES = ['cardGrid', 'stepper', 'linkList', 'resourceRefList'];

export function ContentPage({ doc }: { doc: ContentDoc }) {
  const { selectedVoice } = useOnboarding();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, shadows, isDark } = useTheme();
  const web = useWebLayout();

  const styles = useMemo(() => makeBlockStyles(colors, shadows, isDark), [colors, shadows, isDark]);
  const color = useMemo(() => makeColorResolver(colors.primary), [colors.primary]);

  // ── step modal + TTS (ported from finances) ──
  const [expandedStep, setExpandedStep] = useState<ResolvedStep | null>(null);
  const cardPlayer = useAudioPlayer();
  const cardPlayerStatus = useAudioPlayerStatus(cardPlayer);
  const [isCardSpeaking, setIsCardSpeaking] = useState(false);
  const [isCardLoadingAudio, setIsCardLoadingAudio] = useState(false);
  const [cardPlaybackRate, setCardPlaybackRate] = useState(1.0);
  const currentCardIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (cardPlayerStatus.isLoaded && cardPlayerStatus.didJustFinish) {
      setIsCardSpeaking(false);
      cardPlayer.seekTo(0);
    }
  }, [cardPlayerStatus.isLoaded, cardPlayerStatus.didJustFinish]);

  const handleCardSpeak = async () => {
    if (!expandedStep) return;
    if (isCardSpeaking) { cardPlayer.pause(); setIsCardSpeaking(false); return; }
    if (cardPlayerStatus.isLoaded && currentCardIdRef.current === expandedStep.id) {
      cardPlayer.play(); setIsCardSpeaking(true); return;
    }
    currentCardIdRef.current = expandedStep.id;
    setIsCardSpeaking(true);
    try {
      setIsCardLoadingAudio(true);
      const audioUri = await generateSpeech(`${expandedStep.title}. ${expandedStep.detail}`, selectedVoice);
      if (audioUri) { cardPlayer.replace(audioUri); cardPlayer.play(); }
      else { setIsCardSpeaking(false); currentCardIdRef.current = null; }
    } catch {
      setIsCardSpeaking(false); currentCardIdRef.current = null;
    } finally {
      setIsCardLoadingAudio(false);
    }
  };

  const toggleCardPlaybackRate = () => {
    let next = 1.0;
    if (cardPlaybackRate === 1.0) next = 1.25;
    else if (cardPlaybackRate === 1.25) next = 1.5;
    else if (cardPlaybackRate === 1.5) next = 2.0;
    setCardPlaybackRate(next);
    if (cardPlayerStatus.isLoaded) cardPlayer.setPlaybackRate(next);
  };

  const closeStep = () => { cardPlayer.pause(); setIsCardSpeaking(false); setExpandedStep(null); };

  // ── ctx ──
  const ctx: BlockCtx = useMemo(
    () => ({ colors, shadows, isDark, web, styles, accent: doc.accent, resourceId: doc.resourceId, tags: doc.tags, color, onOpenStep: setExpandedStep }),
    [colors, shadows, isDark, web, styles, doc.accent, doc.resourceId, doc.tags, color],
  );

  // ── derive hero, body, TOC ──
  const heroBlock = doc.blocks.find((b) => b.type === 'hero') as HeroBlock | undefined;
  const bodyBlocks = doc.blocks.filter((b) => b !== heroBlock);
  const sections: ArticleSection[] = bodyBlocks
    .map((b) => ({ id: b.id, label: blockHeading(b) }))
    .filter((s): s is ArticleSection => !!s.label);
  const wide = doc.blocks.some((b) => GRID_TYPES.includes(b.type));

  const handleShare = async () => {
    try { await Share.share({ message: doc.shareMessage ?? doc.title }); } catch {}
  };

  const actionsNode = (
    <>
      <TouchableOpacity onPress={handleShare} style={{ padding: 4 }} accessibilityLabel="Share">
        <Ionicons name="share-outline" size={26} color={colors.textLight} />
      </TouchableOpacity>
      {doc.resourceId ? <DownloadButton resourceId={doc.resourceId} size={26} color={colors.primary} /> : null}
      {doc.resourceId ? <BookmarkButton resourceId={doc.resourceId} size={25} color={colors.primary} /> : null}
    </>
  );

  const titleNode = heroBlock ? (
    <BlockEntrance delay={0}><HeroTitle block={heroBlock} /></BlockEntrance>
  ) : (
    <Text style={[styles.pageTitle, { color: colors.textDark }, web && styles.pageTitleWeb]}>{doc.title}</Text>
  );

  const body = bodyBlocks.map((b, i) => (
    <BlockEntrance key={b.id} nativeID={b.id} delay={(i + 1) * 120} style={i > 0 ? { marginTop: 32 } : undefined}>
      <BlockRenderer block={b} />
    </BlockEntrance>
  ));

  const stepModal = (
    <StepModal
      visible={expandedStep !== null}
      step={expandedStep}
      onClose={closeStep}
      isSpeaking={isCardSpeaking}
      isLoadingAudio={isCardLoadingAudio}
      onToggleSpeak={handleCardSpeak}
      playbackRate={cardPlaybackRate}
      onTogglePlaybackRate={toggleCardPlaybackRate}
      isAudioLoaded={cardPlayerStatus.isLoaded}
      colors={colors}
      styles={styles}
    />
  );

  if (Platform.OS === 'web') {
    return (
      <BlockCtxProvider value={ctx}>
        <ArticleLayout
          wide={wide}
          breadcrumb={[
            { label: 'Library', onPress: () => router.push('/(tabs)/bookmarks') },
            { label: doc.category ?? 'Resources' },
            { label: doc.title },
          ]}
          title={titleNode}
          actions={actionsNode}
          sections={sections}
        >
          {body}
        </ArticleLayout>
        {stepModal}
      </BlockCtxProvider>
    );
  }

  return (
    <BlockCtxProvider value={ctx}>
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: colors.white, borderBottomColor: colors.borderCard }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton} accessibilityLabel="Go back">
            <Ionicons name="arrow-back" size={28} color={colors.textDark} />
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>{actionsNode}</View>
        </View>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <ContentColumn width="reading">
            {titleNode}
            {body}
          </ContentColumn>
        </ScrollView>
      </View>
      {stepModal}
    </BlockCtxProvider>
  );
}
