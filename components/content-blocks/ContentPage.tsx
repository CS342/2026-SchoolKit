// ContentPage — renders a ContentDoc. Web uses the ArticleLayout frame (breadcrumb,
// sticky TOC, title/actions); native uses the header + reading column. Hosts the
// page-level modals, the per-card TTS they share, and the whole-page "Listen" reader.
// This is the runtime the finances page will render through once it lives in Supabase.
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTTS } from '../../hooks/useTTS';
import { usePageReader } from '../../hooks/usePageReader';
import { useTheme } from '../../contexts/ThemeContext';
import { useWebLayout, CONTENT_WIDTH } from '../../hooks/useResponsive';
import { ContentColumn, ArticleLayout, ArticleSection } from '../ui';
import { BookmarkButton } from '../BookmarkButton';
import { DownloadButton } from '../DownloadButton';
import { ContentDoc, HeroBlock } from '../../features/content/types';
import { WIDE_TYPES } from '../../features/content/registry';
import { docSpeechSegments } from '../../features/content/speech';
import { makeBlockStyles } from './styles';
import { BlockCtx, BlockCtxProvider, makeColorResolver, ResolvedStep, FlipDeck } from './context';
import { BlockRenderer, HeroTitle, RecommendationsBlock, blockHeading } from './blocks';
import { BlockEntrance } from './util';
import { StepModal } from './StepModal';
import { FlipCardModal } from './FlipCardModal';
import { PageReaderBar } from './PageReaderBar';

/** Side padding of the phone layout's scroll content (styles.scrollContent). */
const PAGE_PAD = 24;

export function ContentPage({ doc, forceLayout, preview, onReachEnd, languageFallback }: {
  doc: ContentDoc;
  forceLayout?: 'web' | 'mobile';
  preview?: boolean;
  onReachEnd?: () => void;
  /** The reader's language has no version of this topic yet; show a short note. */
  languageFallback?: boolean;
}) {
  const { t } = useTranslation();
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

  // ── page-level modals + audio ──
  const [expandedStep, setExpandedStep] = useState<ResolvedStep | null>(null);
  const [flipDeck, setFlipDeck] = useState<FlipDeck | null>(null);
  // One TTS player for whichever card modal is open; the page reader has its own queue.
  // Read aloud in the page's language, which can differ from the app's.
  const pageLanguage = doc.language ?? 'en';
  const cardTts = useTTS(pageLanguage);
  const segments = useMemo(() => docSpeechSegments(doc), [doc]);
  const reader = usePageReader(segments, pageLanguage);
  const canListen = !preview && segments.length > 0;

  // Only one voice at a time: opening a card pauses the page; listening stops a card.
  const { pause: pauseReader } = reader;
  useEffect(() => {
    if (expandedStep || flipDeck) pauseReader();
  }, [expandedStep, flipDeck, pauseReader]);
  const speakCard = (text: string) => { reader.pause(); cardTts.speak(text); };
  const toggleListen = () => {
    cardTts.stop();
    if (reader.isOpen) reader.stop(); else reader.toggle();
  };

  const closeStep = () => { cardTts.stop(); setExpandedStep(null); };
  const closeFlip = () => { cardTts.stop(); setFlipDeck(null); };

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
  // A closing Recommendations block becomes the full-width page footer instead of a
  // card inside the reading column.
  const lastBlock = doc.blocks[doc.blocks.length - 1];
  const footerBlock = lastBlock?.type === 'recommendations' ? lastBlock : undefined;
  const bodyBlocks = doc.blocks.filter((b) => b !== heroBlock && b !== footerBlock);
  const sections: ArticleSection[] = bodyBlocks
    .map((b) => ({ id: b.id, label: blockHeading(b) }))
    .filter((s): s is ArticleSection => !!s.label);
  const wide = doc.blocks.some((b) => WIDE_TYPES.has(b.type));

  const handleShare = async () => {
    try { await Share.share({ message: doc.shareMessage ?? doc.title }); } catch {}
  };

  const actionsNode = (
    <>
      {canListen ? (
        <TouchableOpacity
          onPress={toggleListen}
          style={{ padding: 4 }}
          accessibilityRole="button"
          accessibilityLabel={reader.isOpen ? t('editor.blocksUi.stopListening') : t('editor.blocksUi.listenToPage')}
        >
          <Ionicons name={reader.isOpen ? 'headset' : 'headset-outline'} size={25} color={reader.isOpen ? colors.primary : colors.textLight} />
        </TouchableOpacity>
      ) : null}
      <TouchableOpacity onPress={handleShare} style={{ padding: 4 }} accessibilityLabel={t('common.share')}>
        <Ionicons name="share-outline" size={26} color={colors.textLight} />
      </TouchableOpacity>
      {doc.resourceId ? <DownloadButton resourceId={doc.resourceId} size={26} color={colors.primary} /> : null}
      {doc.resourceId ? <BookmarkButton resourceId={doc.resourceId} size={25} color={colors.primary} /> : null}
    </>
  );

  const languageNote = languageFallback ? (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', marginTop: 10, paddingVertical: 7, paddingHorizontal: 12, borderRadius: 12, backgroundColor: colors.infoBg }}>
      <Ionicons name="language-outline" size={16} color={colors.info} />
      <Text style={{ fontSize: 13, lineHeight: 18, color: colors.textDark, flexShrink: 1 }}>{t('common.languageFallback')}</Text>
    </View>
  ) : null;

  const titleNode = (
    <>
      {heroBlock ? (
        <BlockEntrance delay={0} animate={!preview}><HeroTitle block={heroBlock} /></BlockEntrance>
      ) : (
        <Text style={[styles.pageTitle, { color: colors.textDark }, web && styles.pageTitleWeb]}>{doc.title}</Text>
      )}
      {languageNote}
    </>
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
        isSpeaking={cardTts.isSpeaking}
        isLoadingAudio={cardTts.isLoading}
        onToggleSpeak={() => expandedStep && speakCard(`${expandedStep.title}. ${expandedStep.detail}`)}
        playbackRate={cardTts.playbackRate}
        onTogglePlaybackRate={cardTts.togglePlaybackRate}
        isAudioLoaded={cardTts.isAudioLoaded}
        colors={colors}
        styles={styles}
      />
      <FlipCardModal
        deck={flipDeck}
        onClose={closeFlip}
        audio={{ isSpeaking: cardTts.isSpeaking, isLoading: cardTts.isLoading, speak: speakCard, stop: cardTts.stop }}
      />
      {canListen ? <PageReaderBar reader={reader} /> : null}
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
            { label: t('editor.blocksUi.breadcrumbLibrary'), onPress: preview ? undefined : () => router.push('/(tabs)/bookmarks') },
            { label: doc.category ?? t('editor.blocksUi.breadcrumbResources') },
            { label: doc.title },
          ]}
          title={titleNode}
          actions={actionsNode}
          sections={sections}
          onScroll={handleScroll}
          footer={footerBlock ? (align) => <RecommendationsBlock band={{ alignWidth: align.width, minPad: align.minPad }} /> : undefined}
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
          <TouchableOpacity onPress={() => { if (!preview) router.back(); }} style={styles.backButton} accessibilityLabel={t('common.goBack')}>
            <Ionicons name="arrow-back" size={28} color={colors.textDark} />
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>{actionsNode}</View>
        </View>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          <View style={[styles.scrollContent, footerBlock && { paddingBottom: 40 }]}>
            <ContentColumn width="reading">
              {titleNode}
              {body}
            </ContentColumn>
          </View>
          {footerBlock ? (
            <RecommendationsBlock band={{ alignWidth: CONTENT_WIDTH.reading, minPad: PAGE_PAD, bottomInset: preview ? 0 : insets.bottom }} />
          ) : null}
        </ScrollView>
      </View>
      {modals}
    </BlockCtxProvider>
  );
}
