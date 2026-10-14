// Shared styles for content-block renderers. Ported verbatim from the hand-built
// finances page so block output is pixel-identical, plus a few styles for the new
// blocks (richText / quote / image / resourceRefList). Keeping one makeStyles keeps
// every block reading as one family.
import { StyleSheet, Dimensions } from 'react-native';
import { ThemeColors, ThemeShadows } from '../../constants/theme';
import { TYPOGRAPHY } from '../../constants/onboarding-theme';

export const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
export const CARD_HEIGHT_FRONT = 280;
export const CARD_HEIGHT_BACK = 460;
export const BUBBLE_SIZE = 200;
export const FONT_STEPS = [1.0, 1.2, 1.45];

export const makeBlockStyles = (c: ThemeColors, s: ThemeShadows, isDark: boolean) =>
  StyleSheet.create({
    // Native page shell
    container: { flex: 1, backgroundColor: c.appBackground },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 24,
      paddingTop: 60,
      paddingBottom: 20,
      borderBottomWidth: 1,
      ...s.header,
      zIndex: 1000,
    },
    backButton: { padding: 8, marginLeft: -8 },
    scrollContent: { padding: 24, paddingBottom: 80 },

    // Title / hero
    eyebrowPill: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, marginBottom: 14, marginTop: 4 },
    eyebrowText: { ...TYPOGRAPHY.caption, fontFamily: 'Raleway_700Bold', letterSpacing: 0.2 },
    pageTitle: { ...TYPOGRAPHY.display, fontSize: 30, textAlign: 'left', marginBottom: 24, lineHeight: 38, letterSpacing: -1 },
    heroSubtitle: { ...TYPOGRAPHY.body, marginTop: -12, marginBottom: 24, lineHeight: 24 },

    // Callout
    callout: { flexDirection: 'row', gap: 14, borderRadius: 20, borderWidth: 1, padding: 20, marginBottom: 32, alignItems: 'flex-start' },
    calloutIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    calloutText: { ...TYPOGRAPHY.body, flex: 1, lineHeight: 24 },

    // Section headers
    sectionTitle: { ...TYPOGRAPHY.h3, fontFamily: 'Raleway_800ExtraBold', letterSpacing: -0.3 },
    sectionSubtitle: { ...TYPOGRAPHY.labelSmall, marginTop: 2, marginBottom: 16 },
    sectionTop: { marginTop: 36 },

    // Cost accordion
    costCard: { borderRadius: 18, borderWidth: 1.5, overflow: 'hidden' },
    costHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
    costIconCircle: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    costTitle: { ...TYPOGRAPHY.bodyStrong, letterSpacing: -0.2 },
    costSummary: { ...TYPOGRAPHY.bodySmall, marginTop: 2 },
    costBody: { paddingHorizontal: 16, paddingBottom: 16, borderTopWidth: 1 },
    tipPill: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', borderRadius: 14, padding: 14, marginTop: 14 },
    tipText: { ...TYPOGRAPHY.bodySmall, flex: 1, lineHeight: 21 },

    // Card grid (team-style cards)
    teamCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, backgroundColor: c.white, borderRadius: 18, borderWidth: 1, padding: 18 },
    teamIconCircle: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    teamRole: { ...TYPOGRAPHY.bodyStrong, letterSpacing: -0.2, marginBottom: 4 },
    teamBlurb: { ...TYPOGRAPHY.bodySmall, lineHeight: 21 },

    // Roadmap bubbles (stepper — mobile)
    pathContainer: { paddingBottom: 10, paddingTop: 4 },
    bubbleWrapper: { width: BUBBLE_SIZE },
    bubbleLeft: { alignSelf: 'flex-start', marginLeft: SCREEN_WIDTH > 520 ? 90 : 20 },
    bubbleRight: { alignSelf: 'flex-end', marginRight: SCREEN_WIDTH > 520 ? 90 : 20 },
    bubble: { width: BUBBLE_SIZE, height: BUBBLE_SIZE, borderRadius: BUBBLE_SIZE / 2, borderWidth: 2, alignItems: 'center', justifyContent: 'center', padding: 18, shadowColor: c.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: isDark ? 0.3 : 0.1, shadowRadius: 10, elevation: 4 },
    bubbleNumber: { position: 'absolute', top: 16, width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
    bubbleNumberText: { color: '#FFFFFF', fontSize: 13, fontFamily: 'Raleway_800ExtraBold' },
    bubbleText: { fontSize: 15, fontFamily: 'Raleway_700Bold', textAlign: 'center', lineHeight: 19, letterSpacing: -0.2 },
    connectorWrapper: { height: 22, justifyContent: 'center' },
    connectorLeft: { alignItems: 'flex-end', marginRight: (SCREEN_WIDTH > 520 ? 90 : 20) + BUBBLE_SIZE / 2 },
    connectorRight: { alignItems: 'flex-start', marginLeft: (SCREEN_WIDTH > 520 ? 90 : 20) + BUBBLE_SIZE / 2 },
    dashedLine: { width: 0, height: '100%', borderWidth: 1.5, borderStyle: 'dashed' },

    // Link list / org cards
    orgCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, borderRadius: 18, borderWidth: 1, padding: 18 },
    orgIconCircle: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    orgName: { ...TYPOGRAPHY.bodyStrong, letterSpacing: -0.2, marginBottom: 3 },
    orgBlurb: { ...TYPOGRAPHY.bodySmall, lineHeight: 21, marginBottom: 8 },
    orgLinkRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    orgLink: { ...TYPOGRAPHY.caption, fontFamily: 'Raleway_700Bold' },

    // Quote
    quoteCard: { borderRadius: 20, borderWidth: 1, padding: 22, marginBottom: 8, alignItems: 'center' },
    quoteText: { ...TYPOGRAPHY.body, fontStyle: 'italic', textAlign: 'center', lineHeight: 24, marginBottom: 8 },
    quoteAuthor: { ...TYPOGRAPHY.labelSmall, fontStyle: 'italic', textAlign: 'center' },

    // Rich text
    richHeading: { ...TYPOGRAPHY.h3, fontFamily: 'Raleway_800ExtraBold', letterSpacing: -0.3, marginBottom: 12 },
    richPara: { ...TYPOGRAPHY.body, lineHeight: 25, marginBottom: 12 },
    richBulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
    richBulletDot: { ...TYPOGRAPHY.body, lineHeight: 25 },

    // Image
    imageWrap: { borderRadius: 18, overflow: 'hidden', marginBottom: 6 },
    image: { width: '100%' },
    imageCaption: { ...TYPOGRAPHY.caption, fontStyle: 'italic', textAlign: 'center', marginTop: 8 },

    // Resource ref list
    refRow: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 18, borderWidth: 1, padding: 16, backgroundColor: c.white },
    refRank: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    refRankText: { color: '#FFFFFF', fontSize: 13, fontFamily: 'Raleway_800ExtraBold' },
    refIconCircle: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    refTitle: { ...TYPOGRAPHY.bodyStrong, letterSpacing: -0.2 },
    refDesc: { ...TYPOGRAPHY.bodySmall, marginTop: 2 },

    // ── Web layout ──
    pageTitleWeb: { fontSize: 40, lineHeight: 48, maxWidth: 880 },
    subMaxWeb: { maxWidth: 640 },
    pointer: { cursor: 'pointer' as any },
    gridRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, alignItems: 'stretch' },
    gridCol: { flexGrow: 1, flexBasis: '30%', minWidth: 240 },
    gridColSpacer: { flexGrow: 1, flexBasis: '30%', minWidth: 240, height: 0 },
    teamCardWeb: { flexDirection: 'column', alignItems: 'flex-start', gap: 12, height: '100%' },
    orgCardWeb: { height: '100%', width: '100%' },
    stepperRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', marginTop: 14, paddingHorizontal: 8 },
    stepItem: { width: 150, alignItems: 'center', gap: 12, cursor: 'pointer' as any },
    stepCircle: { width: 88, height: 88, borderRadius: 44, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
    stepBadge: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginBottom: 3 },
    stepBadgeText: { color: '#FFFFFF', fontSize: 12, fontFamily: 'Raleway_800ExtraBold' },
    stepLabel: { width: 150, fontSize: 14, fontFamily: 'Raleway_700Bold', textAlign: 'center', lineHeight: 18, letterSpacing: -0.2 },
    stepConnector: { flex: 1, height: 0, borderTopWidth: 2, borderStyle: 'dashed', marginTop: 44 },

    // Disclaimer / footer note
    disclaimer: { ...TYPOGRAPHY.caption, fontStyle: 'italic', textAlign: 'center', lineHeight: 18, marginTop: 32, marginBottom: 8, paddingHorizontal: 8 },

    // Step modal
    modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
    modalContainer: { width: '88%', maxWidth: 560, maxHeight: SCREEN_HEIGHT * 0.72 },
    modalCardShadow: { width: '100%', ...s.card },
    modalCard: { width: '100%', borderRadius: 32, borderWidth: 4, overflow: 'hidden', backfaceVisibility: 'hidden' },
    backSide: { position: 'absolute', top: 0, left: 0, right: 0 },
    frontInner: { flex: 1, padding: 32, alignItems: 'center', justifyContent: 'center' },
    frontTitle: { fontSize: 26, fontFamily: 'Raleway_700Bold', color: '#FFFFFF', textAlign: 'center', lineHeight: 34, letterSpacing: -0.5 },
    backInner: { padding: 24, flex: 1, overflow: 'hidden' },
    backHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
    backIconCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    backTitle: { fontSize: 18, fontFamily: 'Raleway_800ExtraBold', flex: 1, letterSpacing: -0.3 },
    speakerBtn: { padding: 6 },
    modalDivider: { height: 2, borderRadius: 1, marginBottom: 16 },
    backScroll: { flex: 1 },
    tipRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
    backText: { fontSize: 16, fontFamily: 'Raleway_400Regular', lineHeight: 24, flex: 1 },
  });

export type BlockStyles = ReturnType<typeof makeBlockStyles>;
