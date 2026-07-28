// Block renderers + registry. Each maps one ContentBlock type to a component; the
// finances-derived ones (callout/accordion/cardGrid/stepper/linkList) are ported
// so output is pixel-identical. Content is data; behavior/animation lives here.
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, Image, Platform, LayoutAnimation, UIManager, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ExternalLink } from '../external-link';
import { RecommendationList } from '../RecommendationList';
import { ALL_RESOURCES } from '../../constants/resources';
import {
  ContentBlock, HeroBlock, CalloutBlock as CalloutT, AccordionBlock as AccordionT, AccordionItem,
  CardGridBlock as CardGridT, StepperBlock as StepperT, LinkListBlock as LinkListT,
  RichTextBlock as RichTextT, QuoteBlock as QuoteT, FootnoteBlock as FootnoteT, ImageBlock as ImageT, ResourceRefListBlock as RefListT,
} from '../../features/content/types';
import { useBlockCtx, BlockCtx } from './context';
import { safeIcon, Markdown } from './util';
import { BUBBLE_SIZE } from './styles';

const IS_WEB = Platform.OS === 'web';
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Hero (rendered as the page title; also usable in body) ────────────────────
export function HeroTitle({ block }: { block: HeroBlock }) {
  const { colors, styles, web, color, accent } = useBlockCtx();
  const eyebrowHex = color(block.eyebrowColor ?? accent);
  return (
    <View>
      {block.eyebrow ? (
        <View style={[styles.eyebrowPill, { backgroundColor: eyebrowHex + '18' }]}>
          {block.eyebrowIcon ? <Ionicons name={safeIcon(block.eyebrowIcon)} size={14} color={eyebrowHex} /> : null}
          <Text style={[styles.eyebrowText, { color: eyebrowHex }]}>{block.eyebrow}</Text>
        </View>
      ) : null}
      <Text style={[styles.pageTitle, { color: colors.textDark }, web && styles.pageTitleWeb]}>
        {block.titleParts.map((p, i) => (
          <Text key={i} style={p.accent ? { color: color(accent) } : undefined}>{p.text}</Text>
        ))}
      </Text>
      {block.subtitle ? <Text style={[styles.heroSubtitle, { color: colors.textMuted }]}>{block.subtitle}</Text> : null}
    </View>
  );
}

// ─── section header helper ─────────────────────────────────────────────────────
function SectionHead({ heading, subheading }: { heading: string; subheading?: string }) {
  const { colors, styles, web } = useBlockCtx();
  return (
    <>
      <Text style={[styles.sectionTitle, { color: colors.textDark }]}>{heading}</Text>
      {subheading ? <Text style={[styles.sectionSubtitle, { color: colors.textMuted }, web && styles.subMaxWeb]}>{subheading}</Text> : null}
    </>
  );
}

// ─── Callout ───────────────────────────────────────────────────────────────────
export function CalloutBlock({ block }: { block: CalloutT }) {
  const { colors, shadows, styles, color } = useBlockCtx();
  const tone = block.tone ?? 'primary';
  const iconBg = tone === 'primary' ? colors.primarySoft : color(tone) + '22';
  const iconFg = tone === 'primary' ? colors.primary : color(tone);
  return (
    <View style={[styles.callout, { marginBottom: 0, backgroundColor: colors.white, borderColor: colors.borderCard }, shadows.card]}>
      <View style={[styles.calloutIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={safeIcon(block.icon)} size={22} color={iconFg} />
      </View>
      <Text style={[styles.calloutText, { color: colors.textDark }]}>{block.text}</Text>
    </View>
  );
}

// ─── Accordion ─────────────────────────────────────────────────────────────────
function AccordionRow({ item, expanded, onToggle }: { item: AccordionItem; expanded: boolean; onToggle: () => void }) {
  const { colors, styles, color } = useBlockCtx();
  const hex = color(item.color);
  const chevron = useRef(new Animated.Value(expanded ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(chevron, { toValue: expanded ? 1 : 0, duration: 200, useNativeDriver: true }).start();
  }, [expanded]);
  const rotate = chevron.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  return (
    <View style={[styles.costCard, { backgroundColor: colors.white, borderColor: expanded ? hex + '55' : colors.borderCard }]}>
      <TouchableOpacity activeOpacity={0.85} onPress={onToggle} style={[styles.costHeader, IS_WEB && styles.pointer]}>
        <View style={[styles.costIconCircle, { backgroundColor: hex + '1A' }]}>
          <Ionicons name={safeIcon(item.icon)} size={22} color={hex} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.costTitle, { color: colors.textDark }]}>{item.title}</Text>
          <Text style={[styles.costSummary, { color: colors.textMuted }]}>{item.summary}</Text>
        </View>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Ionicons name="chevron-down" size={20} color={colors.textLight} />
        </Animated.View>
      </TouchableOpacity>
      {expanded && (
        <View style={[styles.costBody, { borderTopColor: colors.borderCard }]}>
          <View style={[styles.tipPill, { backgroundColor: hex + '14' }]}>
            <Ionicons name="bulb-outline" size={16} color={hex} style={{ marginTop: 1 }} />
            <Text style={[styles.tipText, { color: colors.textDark }]}>{item.body}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

export function AccordionBlock({ block }: { block: AccordionT }) {
  const [expanded, setExpanded] = useState<string | null>(block.items[0]?.id ?? null);
  const toggle = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.create(200, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity));
    setExpanded((prev) => (prev === id ? null : id));
  };
  return (
    <View>
      <SectionHead heading={block.heading} subheading={block.subheading} />
      <View style={{ gap: 12 }}>
        {block.items.map((it) => (
          <AccordionRow key={it.id} item={it} expanded={expanded === it.id} onToggle={() => toggle(it.id)} />
        ))}
      </View>
    </View>
  );
}

// ─── Card grid ─────────────────────────────────────────────────────────────────
export function CardGridBlock({ block }: { block: CardGridT }) {
  const { colors, shadows, styles, web, color } = useBlockCtx();
  return (
    <View>
      <SectionHead heading={block.heading} subheading={block.subheading} />
      <View style={web ? styles.gridRow : { gap: 12 }}>
        {block.items.map((m) => {
          const hex = color(m.color);
          const card = (
            <View style={[styles.teamCard, web && styles.teamCardWeb, web && { height: '100%' }, { backgroundColor: colors.white, borderColor: colors.borderCard }, shadows.small]}>
              <View style={[styles.teamIconCircle, { backgroundColor: hex + '18' }]}>
                <Ionicons name={safeIcon(m.icon)} size={26} color={hex} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.teamRole, { color: colors.textDark }]}>{m.title}</Text>
                <Text style={[styles.teamBlurb, { color: colors.textMuted }]}>{m.body}</Text>
              </View>
            </View>
          );
          return (
            <View key={m.id} style={web ? styles.gridCol : undefined}>
              {m.href ? (
                <ExternalLink href={m.href as any} asChild>
                  <TouchableOpacity activeOpacity={0.85}>{card}</TouchableOpacity>
                </ExternalLink>
              ) : card}
            </View>
          );
        })}
        {web && <View style={styles.gridColSpacer} />}
      </View>
    </View>
  );
}

// ─── Stepper ───────────────────────────────────────────────────────────────────
function MapBubble({ step, index, onPress }: { step: StepperT['steps'][number]; index: number; onPress: () => void }) {
  const { styles, color } = useBlockCtx();
  const hex = color(step.color);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.delay(200 + index * 130),
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);
  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.9, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }),
    ]).start();
    setTimeout(() => onPress(), 50);
  };
  const isLeft = index % 2 === 0;
  return (
    <Animated.View style={[styles.bubbleWrapper, isLeft ? styles.bubbleLeft : styles.bubbleRight, { opacity: fadeAnim, transform: [{ scale: scaleAnim }, { translateY: slideAnim }] }]}>
      <TouchableOpacity activeOpacity={0.85} onPress={handlePress}>
        <View style={[styles.bubble, { backgroundColor: hex + '18', borderColor: hex + '50' }]}>
          <View style={[styles.bubbleNumber, { backgroundColor: hex }]}>
            <Text style={styles.bubbleNumberText}>{index + 1}</Text>
          </View>
          <Ionicons name={safeIcon(step.icon)} size={30} color={hex} style={{ marginBottom: 8 }} />
          <Text style={[styles.bubbleText, { color: hex }]} numberOfLines={3}>{step.title}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function MapConnector({ hex, isFromLeft }: { hex: string; isFromLeft: boolean }) {
  const { styles } = useBlockCtx();
  return (
    <View style={[styles.connectorWrapper, isFromLeft ? styles.connectorLeft : styles.connectorRight]}>
      <View style={[styles.dashedLine, { borderColor: hex + '35' }]} />
    </View>
  );
}

export function StepperBlock({ block }: { block: StepperT }) {
  const { styles, web, color, onOpenStep } = useBlockCtx();
  const open = (s: StepperT['steps'][number]) =>
    onOpenStep({ id: s.id, title: s.title, detail: s.detail, icon: s.icon, colorHex: color(s.color) });
  return (
    <View>
      <SectionHead heading={block.heading} subheading={block.subheading} />
      {web ? (
        <View style={styles.stepperRow}>
          {block.steps.map((step, index) => {
            const hex = color(step.color);
            return (
              <React.Fragment key={step.id}>
                <TouchableOpacity activeOpacity={0.85} onPress={() => open(step)} style={styles.stepItem}>
                  <View style={[styles.stepCircle, { backgroundColor: hex + '18', borderColor: hex + '50' }]}>
                    <View style={[styles.stepBadge, { backgroundColor: hex }]}>
                      <Text style={styles.stepBadgeText}>{index + 1}</Text>
                    </View>
                    <Ionicons name={safeIcon(step.icon)} size={26} color={hex} />
                  </View>
                  <Text style={[styles.stepLabel, { color: hex }]} numberOfLines={2}>{step.title}</Text>
                </TouchableOpacity>
                {index < block.steps.length - 1 && <View style={[styles.stepConnector, { borderTopColor: hex + '45' }]} />}
              </React.Fragment>
            );
          })}
        </View>
      ) : (
        <View style={styles.pathContainer}>
          {block.steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <MapBubble step={step} index={index} onPress={() => open(step)} />
              {index < block.steps.length - 1 && <MapConnector hex={color(block.steps[index].color)} isFromLeft={index % 2 === 0} />}
            </React.Fragment>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Link list ─────────────────────────────────────────────────────────────────
export function LinkListBlock({ block }: { block: LinkListT }) {
  const { colors, shadows, styles, web, color } = useBlockCtx();
  return (
    <View>
      <SectionHead heading={block.heading} subheading={block.subheading} />
      <View style={web ? styles.gridRow : { gap: 12 }}>
        {block.items.map((org) => {
          const hex = color(org.color);
          return (
            <View key={org.id} style={web ? styles.gridCol : undefined}>
              <ExternalLink href={org.url as any} asChild>
                <TouchableOpacity activeOpacity={0.85}>
                  <View style={[styles.orgCard, web && styles.orgCardWeb, { backgroundColor: colors.white, borderColor: colors.borderCard }, shadows.small]}>
                    <View style={[styles.orgIconCircle, { backgroundColor: hex + '18' }]}>
                      <Ionicons name={safeIcon(org.icon)} size={24} color={hex} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.orgName, { color: colors.textDark }]}>{org.name}</Text>
                      <Text style={[styles.orgBlurb, { color: colors.textMuted }]}>{org.blurb}</Text>
                      <View style={styles.orgLinkRow}>
                        <Ionicons name="open-outline" size={13} color={hex} />
                        <Text style={[styles.orgLink, { color: hex }]}>{org.display}</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              </ExternalLink>
            </View>
          );
        })}
        {web && <View style={styles.gridColSpacer} />}
      </View>
    </View>
  );
}

// ─── Rich text ─────────────────────────────────────────────────────────────────
export function RichTextBlock({ block }: { block: RichTextT }) {
  const { colors, styles } = useBlockCtx();
  return (
    <View>
      {block.heading ? <Text style={[styles.richHeading, { color: colors.textDark }]}>{block.heading}</Text> : null}
      <Markdown
        markdown={block.markdown}
        paraStyle={{ ...styles.richPara, color: colors.textDark }}
        bulletRowStyle={styles.richBulletRow}
        bulletDotStyle={{ ...styles.richBulletDot, color: colors.primary }}
        linkColor={colors.primary}
        onLink={(href) => { Linking.openURL(href).catch(() => {}); }}
      />
    </View>
  );
}

// ─── Quote ─────────────────────────────────────────────────────────────────────
export function QuoteBlock({ block }: { block: QuoteT }) {
  const { colors, shadows, styles } = useBlockCtx();
  return (
    <View style={[styles.quoteCard, { backgroundColor: colors.white, borderColor: colors.borderCard }, shadows.card]}>
      <Ionicons name="chatbubble-outline" size={22} color={colors.primary} style={{ marginBottom: 8, opacity: 0.6 }} />
      <Text style={[styles.quoteText, { color: colors.textDark }]}>{'“'}{block.text}{'”'}</Text>
      {block.author ? <Text style={[styles.quoteAuthor, { color: colors.textLight }]}>{'—'} {block.author}</Text> : null}
    </View>
  );
}

// ─── Footnote ──────────────────────────────────────────────────────────────────
export function FootnoteBlock({ block }: { block: FootnoteT }) {
  const { colors, styles } = useBlockCtx();
  return <Text style={[styles.disclaimer, { marginTop: 0, color: colors.textLight }]}>{block.text}</Text>;
}

// ─── Image ─────────────────────────────────────────────────────────────────────
export function ImageBlock({ block }: { block: ImageT }) {
  const { colors, styles } = useBlockCtx();
  return (
    <View>
      <View style={styles.imageWrap}>
        <Image
          source={{ uri: block.url }}
          accessibilityLabel={block.alt}
          style={[styles.image, { aspectRatio: block.aspect ?? 16 / 9 }]}
          resizeMode="cover"
        />
      </View>
      {block.caption ? <Text style={[styles.imageCaption, { color: colors.textLight }]}>{block.caption}</Text> : null}
    </View>
  );
}

// ─── Resource ref list ─────────────────────────────────────────────────────────
export function ResourceRefListBlock({ block }: { block: RefListT }) {
  const { colors, shadows, styles, web, preview } = useBlockCtx();
  const router = useRouter();
  const items = block.resourceIds
    .map((id) => ALL_RESOURCES.find((r) => r.id === id))
    .filter(Boolean) as (typeof ALL_RESOURCES)[number][];
  return (
    <View>
      <SectionHead heading={block.heading} subheading={block.subheading} />
      <View style={web ? styles.gridRow : { gap: 12 }}>
        {items.map((r, i) => (
          <View key={r.id} style={web ? styles.gridCol : undefined}>
            <TouchableOpacity activeOpacity={0.85} onPress={() => { if (!preview && r.route) router.push(r.route as any); }} style={IS_WEB ? styles.pointer : undefined}>
              <View style={[styles.refRow, web && { height: '100%' }, { backgroundColor: colors.white, borderColor: colors.borderCard }, shadows.small]}>
                {block.ranked ? (
                  <View style={[styles.refRank, { backgroundColor: r.color }]}>
                    <Text style={styles.refRankText}>{i + 1}</Text>
                  </View>
                ) : null}
                <View style={[styles.refIconCircle, { backgroundColor: r.color + '1A' }]}>
                  <Ionicons name={safeIcon(r.icon)} size={22} color={r.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.refTitle, { color: colors.textDark }]}>{r.title}</Text>
                  <Text style={[styles.refDesc, { color: colors.textMuted }]} numberOfLines={2}>{r.shortDescription}</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        ))}
        {web && <View style={styles.gridColSpacer} />}
      </View>
    </View>
  );
}

// ─── Recommendations ───────────────────────────────────────────────────────────
export function RecommendationsBlock() {
  const { resourceId, tags, preview } = useBlockCtx();
  // In the editor preview, keep it visible but inert so a card tap can't leave the editor.
  return (
    <View pointerEvents={preview ? 'none' : 'auto'}>
      <RecommendationList currentId={resourceId ?? ''} currentTags={tags} />
    </View>
  );
}

// ─── Registry ──────────────────────────────────────────────────────────────────
export function BlockRenderer({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case 'hero': return <HeroTitle block={block} />;
    case 'callout': return <CalloutBlock block={block} />;
    case 'richText': return <RichTextBlock block={block} />;
    case 'quote': return <QuoteBlock block={block} />;
    case 'footnote': return <FootnoteBlock block={block} />;
    case 'image': return <ImageBlock block={block} />;
    case 'accordion': return <AccordionBlock block={block} />;
    case 'cardGrid': return <CardGridBlock block={block} />;
    case 'stepper': return <StepperBlock block={block} />;
    case 'linkList': return <LinkListBlock block={block} />;
    case 'resourceRefList': return <ResourceRefListBlock block={block} />;
    case 'recommendations': return <RecommendationsBlock />;
    default: return null; // unknown/forward-compatible → render nothing
  }
}

/** Which block types carry a heading (→ TOC entry). */
export function blockHeading(block: ContentBlock): string | undefined {
  switch (block.type) {
    case 'accordion':
    case 'cardGrid':
    case 'stepper':
    case 'linkList':
    case 'resourceRefList':
      return block.heading;
    case 'richText':
      return block.heading;
    default:
      return undefined;
  }
}

export type { BlockCtx };
