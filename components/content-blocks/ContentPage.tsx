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
import { WIDE_TYPES } from '../../features/content/registry';
import { makeBlockStyles } from './styles';
import { BlockCtx, BlockCtxProvider, makeColorResolver, ResolvedStep, FlipDeck } from './context';
import { BlockRenderer, HeroTitle, blockHeading } from './blocks';
import { BlockEntrance } from './util';
import { StepModal } from './StepModal';
import { FlipCardModal } from './FlipCardModal';

export function ContentPage({ doc, forceLayout, preview, onReachEnd }: { doc: ContentDoc; forceLayout?: 'web' | 'mobile'; preview?: boolean; onReachEnd?: () => void }) {
  const { selectedVoice } = useOnboarding();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, shadows, isDark } = useTheme();
  const webAuto = useWebLayout();
  const web = forceLayout ? forceLayout === 'web' : webAuto;

  // Fire onReachEnd once when the reader nears the bottom — the "read to end"
  // signal the content route turns into resource progress.
  const reachedEndRef = useRef(false);
  const handleScroll = ({ nativeEvent }: any) => {
    if (reachedEndRef.current || !onReachEnd) return;
    const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 48) {
      reachedEndRef.current = true;
      onReachEnd();
    }
  };

  const styles = useMemo(() => makeBlockStyles(colors, shadows, isDark), [colors, shadows, isDark]);
  const color = useMemo(() => makeColorResolver(colors.primary), [colors.primary]);

  // ── step modal + TTS (ported from finances) ──
  const [expandedStep, setExpandedStep] = useState<ResolvedStep | null>(null);
  const [flipDeck, setFlipDeck] = useState<FlipDeck | null>(null);
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
  const linkedResourceIds = useMemo(
    () => doc.blocks.flatMap((b) => (b.type === 'resourceRefList' ? ((b as any).resourceIds ?? []) as string[] : [])),
    [doc.blocks],
  );
  const ctx: BlockCtx = useMemo(
    () => ({ colors, shadows, isDark, web, styles, accent: doc.accent, resourceId: doc.resourceId, tags: doc.tags, linkedResourceIds, color, onOpenStep: setExpandedStep, onOpenFlip: setFlipDeck, preview }),
    [colors, shadows, isDark, web, styles, doc.accent, doc.resourceId, doc.tags, linkedResourceIds, color, preview],
  );

  // ── derive hero, body, TOC ──
  const heroBlock = doc.blocks.find((b) => b.type === 'hero') as HeroBlock | undefined;
  const bodyBlocks = doc.blocks.filter((b) => b !== heroBlock);
  const sections: ArticleSection[] = bodyBlocks
    .map((b) => ({ id: b.id, label: blockHeading(b) }))
    .filter((s): s is ArticleSection => !!s.label);
  const wide = doc.blocks.some((b) => WIDE_TYPES.has(b.type));

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
    <BlockEntrance delay={0} animate={!preview}><HeroTitle block={heroBlock} /></BlockEntrance>
  ) : (
    <Text style={[styles.pageTitle, { color: colors.textDark }, web && styles.pageTitleWeb]}>{doc.title}</Text>
  );

  const body = bodyBlocks.map((b, i) => (
    <BlockEntrance key={b.id} nativeID={b.id} delay={(i + 1) * 120} animate={!preview} style={i > 0 ? { marginTop: 32 } : undefined}>
      <BlockRenderer block={b} />
    </BlockEntrance>
  ));

  // Page-level modals: blocks open them through ctx (onOpenStep / onOpenFlip).
  const modals = (
    <>
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
      <FlipCardModal deck={flipDeck} onClose={() => setFlipDeck(null)} />
    </>
  );

  // The web article frame sizes itself by the browser window, so the editor's mobile
  // preview (forceLayout="mobile", a phone-width frame on web) uses the phone layout below.
  if (Platform.OS === 'web' && forceLayout !== 'mobile') {
    return (
      <BlockCtxProvider value={ctx}>
        <ArticleLayout
          wide={wide}
          breadcrumb={[
            { label: 'Library', onPress: preview ? undefined : () => router.push('/(tabs)/bookmarks') },
            { label: doc.category ?? 'Resources' },
            { label: doc.title },
          ]}
          title={titleNode}
          actions={actionsNode}
          sections={sections}
          onScroll={handleScroll}
        >
          {body}
        </ArticleLayout>
        {modals}
      </BlockCtxProvider>
    );
  }

  return (
    <BlockCtxProvider value={ctx}>
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: colors.white, borderBottomColor: colors.borderCard }]}>
          <TouchableOpacity onPress={() => { if (!preview) router.back(); }} style={styles.backButton} accessibilityLabel="Go back">
            <Ionicons name="arrow-back" size={28} color={colors.textDark} />
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>{actionsNode}</View>
        </View>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          <ContentColumn width="reading">
            {titleNode}
            {body}
          </ContentColumn>
        </ScrollView>
      </View>
      {modals}
    </BlockCtxProvider>
  );
}
