// Block renderers + registry. Each maps one ContentBlock type to a component; the
// finances-derived ones (callout/accordion/cardGrid/stepper/linkList) are ported
// so output is pixel-identical. Content is data; behavior/animation lives here.
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, Image, Platform, LayoutAnimation, UIManager, Linking, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ExternalLink } from '../external-link';
import { RecommendationList } from '../RecommendationList';
import { ALL_RESOURCES } from '../../constants/resources';
import {
  ContentBlock, BlockType, HeroBlock, CalloutBlock as CalloutT, AccordionBlock as AccordionT, AccordionItem,
  CardGridBlock as CardGridT, StepperBlock as StepperT, LinkListBlock as LinkListT,
  RichTextBlock as RichTextT, QuoteBlock as QuoteT, FootnoteBlock as FootnoteT, ImageBlock as ImageT, ResourceRefListBlock as RefListT,
  DividerBlock as DividerT, ReferencesBlock as ReferencesT, ChecklistBlock as ChecklistT,
  StatGridBlock as StatGridT, GalleryBlock as GalleryT, TestimonialsBlock as TestimonialsT,
  ColumnsBlock as ColumnsT, TabsBlock as TabsT, FlipCardBlock as FlipCardT, FlipCardItem,
  ComparisonTableBlock as ComparisonTableT, VideoBlock as VideoT,
} from '../../features/content/types';
import { REGISTRY } from '../../features/content/registry';
import { useBlockCtx, BlockCtx } from './context';
import { safeIcon, Markdown } from './util';
import { BUBBLE_SIZE } from './styles';

const IS_WEB = Platform.OS === 'web';
// react-native-webview has no web build; load it only on native.
const WebView: any = IS_WEB ? null : require('react-native-webview').WebView;
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
  if (!block.url) {
    return (
      <View style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.appBackgroundAlt }}>
        <Ionicons name="image-outline" size={28} color={colors.textLight} />
        <Text style={{ color: colors.textLight, fontSize: 13, marginTop: 6 }}>Add an image URL</Text>
      </View>
    );
  }
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

// ─── Divider ───────────────────────────────────────────────────────────────────
export function DividerBlock({ block }: { block: DividerT }) {
  const { colors, color } = useBlockCtx();
  const variant = block.variant ?? 'line';
  const hex = block.tone ? color(block.tone) : colors.borderCard;
  if (variant === 'space') return <View style={{ height: 16 }} />;
  if (variant === 'dots') {
    return (
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10, paddingVertical: 8 }}>
        {[0, 1, 2].map((i) => <View key={i} style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: hex }} />)}
      </View>
    );
  }
  return <View style={{ height: 1, backgroundColor: hex, marginVertical: 4 }} />;
}

// ─── References ──────────────────────────────────────────────────────────────────
export function ReferencesBlock({ block }: { block: ReferencesT }) {
  const { colors } = useBlockCtx();
  return (
    <View>
      {block.heading ? <SectionHead heading={block.heading} /> : null}
      <View style={{ gap: 8 }}>
        {block.items.map((ref, i) => {
          const row = (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Text style={{ fontSize: 13, color: colors.textLight, fontFamily: 'Raleway_700Bold' }}>{i + 1}.</Text>
              <Text style={{ fontSize: 13, flex: 1, color: ref.url ? colors.primary : colors.textMuted, textDecorationLine: ref.url ? 'underline' : 'none' }}>{ref.label}</Text>
            </View>
          );
          return ref.url ? (
            <ExternalLink key={ref.id} href={ref.url as any} asChild>
              <TouchableOpacity activeOpacity={0.7} style={IS_WEB ? { cursor: 'pointer' } as any : undefined}>{row}</TouchableOpacity>
            </ExternalLink>
          ) : <View key={ref.id}>{row}</View>;
        })}
      </View>
    </View>
  );
}

// ─── Checklist ─────────────────────────────────────────────────────────────────
export function ChecklistBlock({ block }: { block: ChecklistT }) {
  const { colors, shadows } = useBlockCtx();
  const [checked, setChecked] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(block.items.map((it) => [it.id, !!it.done])),
  );
  return (
    <View>
      {block.heading ? <SectionHead heading={block.heading} subheading={block.subheading} /> : null}
      <View style={{ gap: 10 }}>
        {block.items.map((it) => {
          const on = checked[it.id];
          return (
            <TouchableOpacity
              key={it.id}
              activeOpacity={0.7}
              onPress={() => setChecked((c) => ({ ...c, [it.id]: !c[it.id] }))}
              style={[{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, backgroundColor: colors.white, borderColor: colors.borderCard }, shadows.small, IS_WEB && { cursor: 'pointer' } as any]}
            >
              <Ionicons name={on ? 'checkbox' : 'square-outline'} size={22} color={on ? colors.primary : colors.textLight} />
              <Text style={{ flex: 1, fontSize: 15, color: colors.textDark, textDecorationLine: on ? 'line-through' : 'none', opacity: on ? 0.55 : 1 }}>{it.text}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Stat grid ─────────────────────────────────────────────────────────────────
export function StatGridBlock({ block }: { block: StatGridT }) {
  const { colors, shadows, styles, web, color } = useBlockCtx();
  return (
    <View>
      {block.heading ? <SectionHead heading={block.heading} subheading={block.subheading} /> : null}
      <View style={web ? styles.gridRow : { gap: 12 }}>
        {block.items.map((s) => {
          const hex = color(s.color);
          return (
            <View key={s.id} style={web ? styles.gridCol : undefined}>
              <View style={[{ padding: 18, borderRadius: 16, borderWidth: 1, alignItems: 'center', backgroundColor: colors.white, borderColor: colors.borderCard }, shadows.small, web && { height: '100%' }]}>
                {s.icon ? <Ionicons name={safeIcon(s.icon)} size={24} color={hex} style={{ marginBottom: 6 }} /> : null}
                <Text style={{ fontSize: 28, fontFamily: 'Raleway_800ExtraBold', color: hex, textAlign: 'center' }}>{s.value}</Text>
                <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: 'center', marginTop: 2 }}>{s.label}</Text>
              </View>
            </View>
          );
        })}
        {web && <View style={styles.gridColSpacer} />}
      </View>
    </View>
  );
}

// ─── Gallery ───────────────────────────────────────────────────────────────────
export function GalleryBlock({ block }: { block: GalleryT }) {
  const { colors, styles, web } = useBlockCtx();
  return (
    <View>
      {block.heading ? <SectionHead heading={block.heading} subheading={block.subheading} /> : null}
      <View style={web ? styles.gridRow : { gap: 12 }}>
        {block.items.map((img) => (
          <View key={img.id} style={web ? styles.gridCol : undefined}>
            <View style={{ borderRadius: 14, overflow: 'hidden', backgroundColor: colors.appBackgroundAlt, aspectRatio: 4 / 3, alignItems: 'center', justifyContent: 'center' }}>
              {img.url
                ? <Image source={{ uri: img.url }} accessibilityLabel={img.alt} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                : <Ionicons name="image-outline" size={24} color={colors.textLight} />}
            </View>
            {img.caption ? <Text style={{ fontSize: 12, color: colors.textLight, marginTop: 6, textAlign: 'center' }}>{img.caption}</Text> : null}
          </View>
        ))}
        {web && <View style={styles.gridColSpacer} />}
      </View>
    </View>
  );
}

// ─── Testimonials ────────────────────────────────────────────────────────────────
export function TestimonialsBlock({ block }: { block: TestimonialsT }) {
  const { colors, shadows, styles } = useBlockCtx();
  return (
    <View>
      {block.heading ? <SectionHead heading={block.heading} subheading={block.subheading} /> : null}
      <View style={{ gap: 12 }}>
        {block.items.map((t) => (
          <View key={t.id} style={[styles.quoteCard, { backgroundColor: colors.white, borderColor: colors.borderCard }, shadows.card]}>
            <Ionicons name="chatbubble-outline" size={20} color={colors.primary} style={{ marginBottom: 6, opacity: 0.6 }} />
            <Text style={[styles.quoteText, { color: colors.textDark }]}>{'“'}{t.text}{'”'}</Text>
            {(t.author || t.role) ? <Text style={[styles.quoteAuthor, { color: colors.textLight }]}>{'—'} {[t.author, t.role].filter(Boolean).join(', ')}</Text> : null}
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Columns ───────────────────────────────────────────────────────────────────
export function ColumnsBlock({ block }: { block: ColumnsT }) {
  const { colors, styles, web } = useBlockCtx();
  const col = (md: string) => (
    <Markdown
      markdown={md}
      paraStyle={{ ...styles.richPara, color: colors.textDark }}
      bulletRowStyle={styles.richBulletRow}
      bulletDotStyle={{ ...styles.richBulletDot, color: colors.primary }}
      linkColor={colors.primary}
      onLink={(href) => { Linking.openURL(href).catch(() => {}); }}
    />
  );
  return (
    <View>
      {block.heading ? <Text style={[styles.richHeading, { color: colors.textDark }]}>{block.heading}</Text> : null}
      <View style={web ? { flexDirection: 'row', gap: 24 } : { gap: 16 }}>
        <View style={web ? { flex: 1 } : undefined}>{col(block.left)}</View>
        <View style={web ? { flex: 1 } : undefined}>{col(block.right)}</View>
      </View>
    </View>
  );
}

// ─── Tabs ──────────────────────────────────────────────────────────────────────
export function TabsBlock({ block }: { block: TabsT }) {
  const { colors, styles } = useBlockCtx();
  const [active, setActive] = useState(block.items[0]?.id ?? '');
  const current = block.items.find((t) => t.id === active) ?? block.items[0];
  return (
    <View>
      {block.heading ? <SectionHead heading={block.heading} subheading={block.subheading} /> : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
        {block.items.map((t) => {
          const on = t.id === current?.id;
          return (
            <TouchableOpacity
              key={t.id}
              activeOpacity={0.8}
              onPress={() => setActive(t.id)}
              style={[{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1.5, borderColor: on ? colors.primary : colors.borderCard, backgroundColor: on ? colors.primarySoft : colors.white }, IS_WEB && { cursor: 'pointer' } as any]}
            >
              {t.icon ? <Ionicons name={safeIcon(t.icon)} size={15} color={on ? colors.primary : colors.textMuted} /> : null}
              <Text style={{ fontSize: 14, fontFamily: 'Raleway_700Bold', color: on ? colors.primary : colors.textMuted }}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {current ? (
        <Markdown
          markdown={current.markdown}
          paraStyle={{ ...styles.richPara, color: colors.textDark }}
          bulletRowStyle={styles.richBulletRow}
          bulletDotStyle={{ ...styles.richBulletDot, color: colors.primary }}
          linkColor={colors.primary}
          onLink={(href) => { Linking.openURL(href).catch(() => {}); }}
        />
      ) : null}
    </View>
  );
}

// ─── Flip cards ──────────────────────────────────────────────────────────────────
function FlipCard({ item }: { item: FlipCardItem }) {
  const { colors, shadows, color } = useBlockCtx();
  const hex = color(item.color);
  const [flipped, setFlipped] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;
  const flip = () => {
    Animated.spring(anim, { toValue: flipped ? 0 : 1, useNativeDriver: true, friction: 8, tension: 10 }).start();
    setFlipped((f) => !f);
  };
  const frontRotate = anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backRotate = anim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });
  const face = { backfaceVisibility: 'hidden' as const, padding: 18, borderRadius: 16, borderWidth: 1, minHeight: 130, alignItems: 'center' as const, justifyContent: 'center' as const };
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={flip} style={[{ minHeight: 130 }, IS_WEB && { cursor: 'pointer' } as any]}>
      <View>
        <Animated.View style={[face, { backgroundColor: hex + '14', borderColor: hex + '44', transform: [{ perspective: 1000 }, { rotateY: frontRotate }] }, shadows.small]}>
          {item.icon ? <Ionicons name={safeIcon(item.icon)} size={26} color={hex} style={{ marginBottom: 8 }} /> : null}
          <Text style={{ fontSize: 16, fontFamily: 'Raleway_700Bold', color: colors.textDark, textAlign: 'center' }}>{item.front}</Text>
        </Animated.View>
        <Animated.View style={[face, { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.white, borderColor: hex + '55', transform: [{ perspective: 1000 }, { rotateY: backRotate }] }, shadows.small]}>
          <Text style={{ fontSize: 14, color: colors.textMuted, textAlign: 'center' }}>{item.back}</Text>
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
}

export function FlipCardBlock({ block }: { block: FlipCardT }) {
  const { styles, web } = useBlockCtx();
  return (
    <View>
      {block.heading ? <SectionHead heading={block.heading} subheading={block.subheading} /> : null}
      <View style={web ? styles.gridRow : { gap: 12 }}>
        {block.items.map((c) => (
          <View key={c.id} style={web ? styles.gridCol : undefined}>
            <FlipCard item={c} />
          </View>
        ))}
        {web && <View style={styles.gridColSpacer} />}
      </View>
    </View>
  );
}

// ─── Comparison table ───────────────────────────────────────────────────────────
export function ComparisonTableBlock({ block }: { block: ComparisonTableT }) {
  const { colors } = useBlockCtx();
  const cols = block.columns;
  const colW = 150;
  const cellBorder = (ci: number) => (ci < cols.length - 1 ? { borderRightWidth: 1, borderRightColor: colors.borderCard } : null);
  return (
    <View>
      {block.heading ? <SectionHead heading={block.heading} subheading={block.subheading} /> : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ borderRadius: 14, borderWidth: 1, borderColor: colors.borderCard, overflow: 'hidden', backgroundColor: colors.white }}>
          <View style={{ flexDirection: 'row', backgroundColor: colors.primarySoft }}>
            {cols.map((c, ci) => (
              <View key={ci} style={[{ width: colW, padding: 10 }, cellBorder(ci)]}>
                <Text style={{ fontSize: 13, fontFamily: 'Raleway_700Bold', color: colors.textDark }}>{c}</Text>
              </View>
            ))}
          </View>
          {block.rows.map((row, ri) => (
            <View key={row.id} style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.borderCard, backgroundColor: ri % 2 ? colors.appBackgroundAlt : colors.white }}>
              {cols.map((_, ci) => (
                <View key={ci} style={[{ width: colW, padding: 10 }, cellBorder(ci)]}>
                  <Text style={{ fontSize: 13, color: ci === 0 ? colors.textDark : colors.textMuted }}>{row.cells[ci] ?? ''}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Video ───────────────────────────────────────────────────────────────────────
function inferVideoProvider(url: string): 'youtube' | 'vimeo' | 'mp4' {
  if (/youtu\.?be/.test(url)) return 'youtube';
  if (/vimeo\.com/.test(url)) return 'vimeo';
  return 'mp4';
}
function videoEmbed(provider: VideoT['provider'], url: string): { kind: 'iframe' | 'file'; src: string } {
  const p = provider ?? inferVideoProvider(url);
  if (p === 'youtube') {
    const m = url.match(/(?:youtu\.be\/|[?&]v=|\/embed\/)([A-Za-z0-9_-]{6,})/);
    return { kind: 'iframe', src: m ? `https://www.youtube.com/embed/${m[1]}` : url };
  }
  if (p === 'vimeo') {
    const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    return { kind: 'iframe', src: m ? `https://player.vimeo.com/video/${m[1]}` : url };
  }
  return { kind: 'file', src: url };
}

export function VideoBlock({ block }: { block: VideoT }) {
  const { colors } = useBlockCtx();
  if (!block.url) {
    return (
      <View style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.appBackgroundAlt }}>
        <Ionicons name="videocam-outline" size={28} color={colors.textLight} />
        <Text style={{ color: colors.textLight, fontSize: 13, marginTop: 6 }}>Add a video URL</Text>
      </View>
    );
  }
  const { kind, src } = videoEmbed(block.provider, block.url);
  let media: React.ReactNode = null;
  if (IS_WEB) {
    media = kind === 'iframe'
      ? React.createElement('iframe', { src, style: { width: '100%', height: '100%', border: 0 }, allowFullScreen: true, allow: 'autoplay; encrypted-media; picture-in-picture' })
      : React.createElement('video', { src, controls: true, style: { width: '100%', height: '100%', backgroundColor: '#000' } });
  } else if (WebView) {
    const source = kind === 'iframe'
      ? { uri: src }
      : { html: `<body style="margin:0;background:#000"><video controls playsinline style="width:100%;height:100%" src="${src}"></video></body>` };
    media = <WebView source={source} style={{ flex: 1, backgroundColor: '#000' }} allowsFullscreenVideo javaScriptEnabled domStorageEnabled />;
  }
  return (
    <View>
      {block.title ? <Text style={{ fontSize: 17, fontFamily: 'Raleway_700Bold', color: colors.textDark, marginBottom: 8 }}>{block.title}</Text> : null}
      <View style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: 14, overflow: 'hidden', backgroundColor: '#000' }}>{media}</View>
      {block.caption ? <Text style={{ fontSize: 12, color: colors.textLight, marginTop: 6, textAlign: 'center' }}>{block.caption}</Text> : null}
    </View>
  );
}

// ─── Registry (render layer) ─────────────────────────────────────────────────────
// Second half of the manifest: binds each block type to its JSX component. Typed
// Record<BlockType, …> so a new union member fails to compile until it has an entry
// here — the compile-time mirror of the pure REGISTRY in features/content/registry.
export const BLOCK_RENDERERS: Record<BlockType, React.ComponentType<{ block: any }>> = {
  hero: HeroTitle,
  callout: CalloutBlock,
  richText: RichTextBlock,
  quote: QuoteBlock,
  footnote: FootnoteBlock,
  image: ImageBlock,
  accordion: AccordionBlock,
  cardGrid: CardGridBlock,
  stepper: StepperBlock,
  linkList: LinkListBlock,
  resourceRefList: ResourceRefListBlock,
  recommendations: RecommendationsBlock,
  divider: DividerBlock,
  references: ReferencesBlock,
  checklist: ChecklistBlock,
  statGrid: StatGridBlock,
  gallery: GalleryBlock,
  testimonials: TestimonialsBlock,
  columns: ColumnsBlock,
  tabs: TabsBlock,
  flipCard: FlipCardBlock,
  comparisonTable: ComparisonTableBlock,
  video: VideoBlock,
};

export function BlockRenderer({ block }: { block: ContentBlock }) {
  const Comp = BLOCK_RENDERERS[block.type];
  return Comp ? <Comp block={block} /> : null; // unknown/forward-compatible → render nothing
}

/** The heading text for a block, if it carries one (→ TOC entry). */
export function blockHeading(block: ContentBlock): string | undefined {
  const field = REGISTRY[block.type]?.headingField;
  return field ? (block as any)[field] : undefined;
}

export type { BlockCtx };
