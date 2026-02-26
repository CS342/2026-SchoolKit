import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle, G, Text as SvgText, Rect } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Dimensions } from 'react-native';
import { ALL_RESOURCES, Resource } from '../../constants/resources';

// ── Constants ──────────────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ARTBOARD_W = 500;
const ARTBOARD_H = 750;
const LEAF_R = 30;
const NODE_R = 34;
const TRUNK_DASH = 500;
const BRANCH_DASH = 300;
const ZOOM_SCALE = 1.95;

const CX = ARTBOARD_W / 2;
const CY = ARTBOARD_H / 2;

const SPRING_BOUNCE = { damping: 18, stiffness: 250 };
const SPRING_SMOOTH = { damping: 20, stiffness: 200 };

// ── Ionicons unicode characters ──────────────────────────────────────────────
// Codepoints from @expo/vector-icons Ionicons glyphmap.
// SVG Text with fontFamily="Ionicons" renders the icon glyph as a vector shape,
// so it stays perfectly crisp at every zoom level.

const ICON_CHARS: Record<string, string> = {
  'heart-outline': String.fromCodePoint(62327),
  'school-outline': String.fromCodePoint(62813),
  'medkit-outline': String.fromCodePoint(62540),
  'people-outline': String.fromCodePoint(62627),
  'heart-circle-outline': String.fromCodePoint(62316),
  'medical': String.fromCodePoint(62536),
  'people': String.fromCodePoint(62623),
  'heart': String.fromCodePoint(62314),
  'school': String.fromCodePoint(62812),
  'return-down-back': String.fromCodePoint(62776),
  'sunny': String.fromCodePoint(62893),
  'heart-circle': String.fromCodePoint(62315),
  'megaphone': String.fromCodePoint(62542),
  'people-circle': String.fromCodePoint(62624),
  'information-circle': String.fromCodePoint(62360),
};

// ── Types ─────────────────────────────────────────────────────────────────────

type LeafDef = { resource: Resource; cx: number; cy: number };

type SectionDef = {
  id: string;
  label: string;
  nx: number;
  ny: number;
  color: string;
  icon: string;
  branchPath: string;
  leaves: LeafDef[];
};

// ── Leaf layout helper ────────────────────────────────────────────────────────

function makeLeaves(
  nodeX: number, nodeY: number,
  resources: Resource[],
  centerAngleDeg: number, spreadDeg: number,
  radius = 75,
): LeafDef[] {
  const count = resources.length;
  return resources.map((resource, i) => {
    const angle = count === 1
      ? centerAngleDeg
      : centerAngleDeg - spreadDeg / 2 + (i * spreadDeg) / (count - 1);
    const rad = (angle * Math.PI) / 180;
    return { resource, cx: nodeX + radius * Math.cos(rad), cy: nodeY + radius * Math.sin(rad) };
  });
}

// Sections are now generated dynamically in the component based on the resources prop.

// ── Animated SVG components ───────────────────────────────────────────────────

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedG = Animated.createAnimatedComponent(G);

function AnimatedTrunk() {
  const dashOffset = useSharedValue(TRUNK_DASH);
  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: dashOffset.value }));
  useEffect(() => { dashOffset.value = withTiming(0, { duration: 600 }); }, []);
  return (
    <AnimatedPath d="M 245 440 C 240 560 260 640 250 780"
      stroke="#8B6914" strokeWidth={18} strokeLinecap="round"
      strokeDasharray={`${TRUNK_DASH} ${TRUNK_DASH}`} fill="none"
      animatedProps={animatedProps} />
  );
}

function AnimatedBranch({ d, color, delay }: { d: string; color: string; delay: number }) {
  const dashOffset = useSharedValue(BRANCH_DASH);
  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: dashOffset.value }));
  useEffect(() => { dashOffset.value = withDelay(delay, withTiming(0, { duration: 500 })); }, []);
  return (
    <AnimatedPath d={d} stroke={color} strokeWidth={6} strokeLinecap="round"
      strokeDasharray={`${BRANCH_DASH} ${BRANCH_DASH}`} fill="none"
      animatedProps={animatedProps} />
  );
}

// ── Section node (pure SVG — crisp at any zoom) ───────────────────────────────

function SectionNode({
  section, delay, expanded, onPress,
}: {
  section: SectionDef; delay: number; expanded: boolean; onPress: () => void;
}) {
  const { nx, ny, color, icon, label } = section;
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const pressScale = useSharedValue(1);

  useEffect(() => {
    scale.value = withDelay(delay, withSpring(1, SPRING_BOUNCE));
    opacity.value = withDelay(delay, withTiming(1, { duration: 300 }));
  }, []);

  useEffect(() => {
    pressScale.value = withSpring(expanded ? 1.12 : 1, SPRING_BOUNCE);
  }, [expanded]);

  // SVG transform: scale from the node's centre (nx, ny).
  // translate(nx*(1-s), ny*(1-s)) scale(s)  ≡  transform-origin at (nx, ny).
  const animatedProps = useAnimatedProps(() => {
    'worklet';
    const s = scale.value * pressScale.value;
    const tx = nx * (1 - s);
    const ty = ny * (1 - s);
    return {
      opacity: opacity.value,
      transform: [
        { translateX: tx },
        { translateY: ty },
        { scale: s }
      ]
    } as any;
  });

  return (
    <>
      <AnimatedG animatedProps={animatedProps}>
        <Circle cx={nx} cy={ny} r={NODE_R} fill={color} />
        {/* Icon rendered via Ionicons font — infinite resolution */}
        <SvgText
          x={nx} y={ny}
          textAnchor="middle" alignmentBaseline="central"
          fontFamily="Ionicons" fontSize={24} fill="#FFFFFF"
        >
          {ICON_CHARS[icon] ?? ''}
        </SvgText>
        {/* Label below the circle */}
        <SvgText
          x={nx} y={ny + NODE_R + 15}
          textAnchor="middle"
          fontWeight="700" fontSize={12} fill={color}
        >
          {label}
        </SvgText>
      </AnimatedG>
      <Circle cx={nx} cy={ny} r={NODE_R * 1.5} fill="rgba(255,255,255,0.01)" onPress={onPress} />
    </>
  );
}

// ── Leaf node (pure SVG — crisp at any zoom) ──────────────────────────────────

function Leaf({
  leaf, sectionColor, lit, visible, delay, onPress,
}: {
  leaf: LeafDef; sectionColor: string; lit: boolean;
  visible: boolean; delay: number; onPress: () => void;
}) {
  const { cx, cy, resource } = leaf;
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withDelay(delay, withSpring(1, SPRING_BOUNCE));
      opacity.value = withDelay(delay, withTiming(1, { duration: 200 }));
    } else {
      scale.value = withTiming(0, { duration: 180 });
      opacity.value = withTiming(0, { duration: 140 });
    }
  }, [visible]);

  const bgColor = lit ? sectionColor : 'rgba(50,45,80,0.88)';
  const labelColor = lit ? sectionColor : 'rgba(190,180,220,0.9)';

  const animatedProps = useAnimatedProps(() => {
    'worklet';
    const s = scale.value;
    const tx = cx * (1 - s);
    const ty = cy * (1 - s);
    return {
      opacity: opacity.value,
      transform: [
        { translateX: tx },
        { translateY: ty },
        { scale: s }
      ]
    } as any;
  });

  return (
    <>
      <AnimatedG animatedProps={animatedProps}>
        <Circle cx={cx} cy={cy} r={LEAF_R} fill={bgColor} />
        {/* Icon via Ionicons font — infinite resolution */}
        <SvgText
          x={cx} y={cy}
          textAnchor="middle" alignmentBaseline="central"
          fontFamily="Ionicons" fontSize={18} fill="#FFFFFF"
        >
          {ICON_CHARS[resource.icon] ?? ''}
        </SvgText>
        {/* Short label below the circle */}
        <SvgText
          x={cx} y={cy + LEAF_R + 12}
          textAnchor="middle"
          fontWeight="700" fontSize={11} fill={labelColor}
        >
          {resource.abbr}
        </SvgText>
      </AnimatedG>
      {visible && (
        <Circle cx={cx} cy={cy} r={LEAF_R * 1.5} fill="rgba(255,255,255,0.01)" onPress={onPress} />
      )}
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

type Props = { isResourceFullyViewed: (id: string) => boolean; isDark: boolean; resources: Resource[] };

export default function KnowledgeTree({ isResourceFullyViewed, isDark: isDark, resources }: Props) {
  const RENDER_W = SCREEN_WIDTH;
  const RENDER_H = RENDER_W * (ARTBOARD_H / ARTBOARD_W);
  const SCALE = RENDER_W / ARTBOARD_W;

  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const router = useRouter();

  const zoomScale = useSharedValue(1);
  const zoomTx = useSharedValue(0);
  const zoomTy = useSharedValue(0);

  const { SECTIONS, SECTION_CENTROIDS } = React.useMemo(() => {
    const EMOTIONS_RESOURCES = resources.filter(r => r.category === 'Emotions');
    const SCHOOL_RESOURCES = resources.filter(r => r.category === 'School');
    const HEALTH_RESOURCES = resources.filter(r => r.category === 'Health');
    const SOCIAL_RESOURCES = resources.filter(r => r.category === 'Social');
    const FAMILY_RESOURCES = resources.filter(r => r.category === 'Family');

    const sections: SectionDef[] = [
      {
        id: 'Emotions', label: 'Emotions', nx: 130, ny: 245, color: '#66D9A6', icon: 'heart-outline',
        branchPath: 'M 225 435 Q 170 335 130 245',
        leaves: makeLeaves(130, 245, EMOTIONS_RESOURCES, 315, 60, 95) // radius 95
      },
      {
        id: 'School', label: 'School', nx: 250, ny: 155, color: '#F59E0B', icon: 'school-outline',
        branchPath: 'M 250 395 Q 248 285 250 155',
        leaves: makeLeaves(250, 155, SCHOOL_RESOURCES, 270, 80, 95)
      },
      {
        id: 'Health', label: 'Health', nx: 370, ny: 245, color: '#7B68EE', icon: 'medkit-outline',
        branchPath: 'M 275 435 Q 325 330 370 245',
        leaves: makeLeaves(370, 245, HEALTH_RESOURCES, 225, 60, 95)
      },
      {
        id: 'Social', label: 'Social', nx: 110, ny: 430, color: '#0EA5E9', icon: 'people-outline',
        branchPath: 'M 215 505 Q 155 460 110 430',
        leaves: makeLeaves(110, 430, SOCIAL_RESOURCES, 270, 50, 85)
      },
      {
        id: 'Family', label: 'Family', nx: 390, ny: 430, color: '#EC4899', icon: 'heart-circle-outline',
        branchPath: 'M 285 505 Q 340 460 390 430',
        leaves: makeLeaves(390, 430, FAMILY_RESOURCES, 275, 45, 85)
      },
    ];

    const centroids = sections.map(section => {
      const pts = [{ x: section.nx, y: section.ny }, ...section.leaves.map(l => ({ x: l.cx, y: l.cy }))];
      return {
        x: pts.reduce((s, p) => s + p.x, 0) / pts.length,
        y: pts.reduce((s, p) => s + p.y, 0) / pts.length,
      };
    });

    return { SECTIONS: sections, SECTION_CENTROIDS: centroids };
  }, [resources]);

  const zoomStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: zoomTx.value },
      { translateY: zoomTy.value },
      { scale: zoomScale.value },
    ],
  }));

  const handleSectionPress = useCallback((sectionId: string) => {
    const idx = SECTIONS.findIndex(s => s.id === sectionId);
    if (expandedSection === sectionId) {
      // Collapse
      setExpandedSection(null);
      zoomScale.value = withSpring(1, SPRING_SMOOTH);
      zoomTx.value = withSpring(0, SPRING_SMOOTH);
      zoomTy.value = withSpring(0, SPRING_SMOOTH);
    } else {
      // Expand and zoom to centroid
      const c = SECTION_CENTROIDS[idx];
      setExpandedSection(sectionId);
      zoomScale.value = withSpring(ZOOM_SCALE, SPRING_SMOOTH);

      const renderCx = c.x * SCALE;
      const renderCy = c.y * SCALE;
      const targetTx = (RENDER_W / 2) - renderCx;
      const targetTy = (RENDER_H / 2) - renderCy;

      zoomTx.value = withSpring(targetTx * ZOOM_SCALE, SPRING_SMOOTH);
      zoomTy.value = withSpring(targetTy * ZOOM_SCALE, SPRING_SMOOTH);
    }
  }, [expandedSection, SCALE, RENDER_W, RENDER_H, SECTION_CENTROIDS]);

  const navigateToLeaf = useCallback((sectionIdx: number, leafIdx: number) => {
    const resource = SECTIONS[sectionIdx]?.leaves[leafIdx]?.resource;
    if (!resource) return;
    if (resource.route) {
      router.push(resource.route as any);
    } else {
      router.push({ pathname: '/topic-detail', params: { title: resource.title, id: resource.id } } as any);
    }
  }, [router]);

  const handleBackgroundPress = useCallback(() => {
    if (!expandedSection) return;
    setExpandedSection(null);
    zoomScale.value = withSpring(1, SPRING_SMOOTH);
    zoomTx.value = withSpring(0, SPRING_SMOOTH);
    zoomTy.value = withSpring(0, SPRING_SMOOTH);
  }, [expandedSection]);

  return (
    <View style={[{ width: RENDER_W, height: RENDER_H, overflow: 'hidden' }]}>
      {/*
        Animated.View handles the zoom transform.  Everything inside is a single
        SVG so all rendering is vector-based and crisp at any zoom level.
        React Native routes touches through the transform automatically, so SVG
        element onPress callbacks fire at the correct visual positions.
      */}
      <Animated.View style={[{ width: RENDER_W, height: RENDER_H }, zoomStyle]}>
        <Svg width="100%" height="100%" viewBox={`0 0 ${ARTBOARD_W} ${ARTBOARD_H}`}>

          {/* Full-viewport hit area — must come first (lowest z-order) so that
              taps on nodes/leaves above it are NOT absorbed here. */}
          <Rect
            x={0} y={0} width={ARTBOARD_W} height={ARTBOARD_H}
            fill="transparent" onPress={handleBackgroundPress}
          />

          {/* Trunk */}
          <AnimatedTrunk />

          {/* Main branches to section nodes */}
          {SECTIONS.map((section, i) => (
            <AnimatedBranch
              key={section.id}
              d={section.branchPath}
              color={section.color}
              delay={200 + i * 100}
            />
          ))}

          {/* Thin lines from section node to each leaf (visible when expanded) */}
          {SECTIONS.map(section =>
            section.leaves.map(leaf => (
              <Path
                key={`line-${leaf.resource.id}`}
                d={`M ${section.nx} ${section.ny} L ${leaf.cx} ${leaf.cy}`}
                stroke={section.color} strokeWidth={2} strokeLinecap="round"
                opacity={expandedSection === section.id ? 0.6 : 0}
              />
            ))
          )}

          {/* Section nodes — tapping zooms in / collapses */}
          {SECTIONS.map((section, i) => (
            <SectionNode
              key={section.id}
              section={section}
              delay={600 + i * 80}
              expanded={expandedSection === section.id}
              onPress={() => handleSectionPress(section.id)}
            />
          ))}

          {/* Leaf nodes — tapping navigates to the linked page */}
          {SECTIONS.map((section, si) =>
            section.leaves.map((leaf, li) => (
              <Leaf
                key={leaf.resource.id}
                leaf={leaf}
                sectionColor={section.color}
                lit={isResourceFullyViewed(leaf.resource.id)}
                visible={expandedSection === section.id}
                delay={li * 80}
                onPress={() => navigateToLeaf(si, li)}
              />
            ))
          )}

        </Svg>
      </Animated.View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Legacy styles removed
});
