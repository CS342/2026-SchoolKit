import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  LayoutAnimation,
  Platform,
  UIManager,
  Modal,
  Animated,
  PanResponder,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import RNAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTTS } from "../hooks/useTTS";
import { TTSButton } from "../components/TTSButton";
import { RecommendationList } from "../components/RecommendationList";
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  RADII,
  SHADOWS,
  BORDERS,
  ANIMATION,
} from "../constants/onboarding-theme";

if (Platform.OS === "android") {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.55;

// --- Data ---
type SectionData = {
  id: string;
  title: string;
  cardTitle: string; // shorter title shown on icon card
  icon: string;
  color: string;
  items: string[];
};

// First two sections → icon cards + bottom sheet
const ICON_SECTIONS: SectionData[] = [
  {
    id: "nurse-does",
    title: "What Does the School Nurse Do?",
    cardTitle: "What Does\nthe Nurse Do?",
    icon: "medkit-outline",
    color: "#E8735A",
    items: [
      "Keeps your medicines safe and helps you take them on time",
      "Has a quiet place where you can rest if you feel tired",
      "Knows about your health needs and keeps them private",
      "Talks to your doctors and parents to make sure you're okay",
    ],
  },
  {
    id: "when-to-visit",
    title: "When Should You Visit the Nurse?",
    cardTitle: "When Should\nYou Visit?",
    icon: "time-outline",
    color: "#0EA5E9",
    items: [
      "If you feel sick, dizzy, or extra tired",
      "When it's time for your medicine",
      "If you need a break from class",
      "When you have questions about your health at school",
    ],
  },
];

// Third section → accordion
const ACCORDION_SECTION: SectionData = {
  id: "before-school",
  title: "What You and Your Family Can Do Before School Starts",
  cardTitle: "",
  icon: "clipboard-outline",
  color: "#66D9A6",
  items: [
    "Show the nurse your medicine schedule",
    "Talk about what helps you feel better",
    "Plan where you can rest if needed",
    "Share your care team's phone number",
  ],
};

// ─── Icon Card ────────────────────────────────────────────────────────────────

function IconCard({
  section,
  onPress,
  index,
}: {
  section: SectionData;
  onPress: () => void;
  index: number;
}) {
  const scale = useSharedValue(0);
  const pressScale = useSharedValue(1);

  useEffect(() => {
    scale.value = withDelay(
      300 + index * 100,
      withSpring(1, ANIMATION.springBouncy)
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * pressScale.value }],
  }));

  return (
    <RNAnimated.View style={[iconCardStyles.wrapper, animStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          pressScale.value = withTiming(0.94, { duration: 80 });
        }}
        onPressOut={() => {
          pressScale.value = withSpring(1, ANIMATION.springBouncy);
        }}
        style={[
          iconCardStyles.card,
          {
            backgroundColor: COLORS.white,
            borderColor: section.color + "40",
            ...SHADOWS.card,
          },
        ]}
      >
        {/* Title above icon */}
        <Text style={[iconCardStyles.title, { color: COLORS.textDark }]}>
          {section.cardTitle}
        </Text>

        {/* Icon circle */}
        <View
          style={[
            iconCardStyles.iconCircle,
            { backgroundColor: section.color + "20" },
          ]}
        >
          <Ionicons name={section.icon as any} size={34} color={section.color} />
        </View>

        {/* Tap hint */}
        <Text style={[iconCardStyles.hint, { color: section.color }]}>
          Tap to learn more
        </Text>
      </Pressable>
    </RNAnimated.View>
  );
}

const iconCardStyles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  card: {
    borderRadius: RADII.card,
    borderWidth: BORDERS.card,
    padding: 18,
    alignItems: "center",
    gap: 14,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 20,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  hint: {
    fontSize: 12,
    fontWeight: "600",
    opacity: 0.8,
  },
});

// ─── Bottom Sheet ─────────────────────────────────────────────────────────────

function BottomSheet({
  visible,
  section,
  onClose,
}: {
  visible: boolean;
  section: SectionData | null;
  onClose: () => void;
}) {
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const [internalVisible, setInternalVisible] = useState(false);
  const bulletAnims = useRef<Animated.Value[]>([]).current;
  const { isSpeaking, isLoading, speak, stop } = useTTS();

  const maxBullets = 6;
  while (bulletAnims.length < maxBullets) {
    bulletAnims.push(new Animated.Value(0));
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => gs.dy > 5,
      onPanResponderMove: (_, gs) => {
        if (gs.dy > 0) translateY.setValue(gs.dy);
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > 80 || gs.vy > 0.5) {
          handleDismiss();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (visible && section) {
      setInternalVisible(true);
      translateY.setValue(SHEET_HEIGHT);
      backdropOpacity.setValue(0);
      bulletAnims.forEach((a) => a.setValue(0));

      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          friction: 10,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        const anims = section.items.map((_, i) =>
          Animated.timing(bulletAnims[i], {
            toValue: 1,
            duration: 280,
            delay: i * 70,
            useNativeDriver: true,
          })
        );
        Animated.stagger(70, anims).start();
      });
    }
  }, [visible, section]);

  const handleDismiss = useCallback(() => {
    stop();
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SHEET_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setInternalVisible(false);
      onClose();
    });
  }, [onClose, stop]);

  const handleSpeak = async () => {
    if (!section) return;
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
    speak(`${section.title}. ${section.items.join(". ")}`);
  };

  if (!internalVisible || !section) return null;

  return (
    <Modal
      transparent
      visible={internalVisible}
      animationType="none"
      onRequestClose={handleDismiss}
    >
      <View style={sheetStyles.overlay}>
        {/* Backdrop */}
        <Pressable style={StyleSheet.absoluteFill} onPress={handleDismiss}>
          <Animated.View
            style={[
              sheetStyles.backdrop,
              {
                opacity: backdropOpacity.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.45],
                }),
              },
            ]}
          />
        </Pressable>

        {/* Sheet */}
        <Animated.View
          style={[sheetStyles.sheet, { transform: [{ translateY }] }]}
        >
          {/* Drag handle */}
          <View {...panResponder.panHandlers} style={sheetStyles.handleArea}>
            <View style={sheetStyles.handle} />
          </View>

          {/* Header row */}
          <View style={sheetStyles.headerRow}>
            <View
              style={[
                sheetStyles.iconBadge,
                { backgroundColor: section.color + "20" },
              ]}
            >
              <Ionicons
                name={section.icon as any}
                size={20}
                color={section.color}
              />
            </View>
            <Text
              style={[sheetStyles.sheetTitle, { color: section.color }]}
              numberOfLines={2}
            >
              {section.title}
            </Text>
            <TTSButton
              isSpeaking={isSpeaking}
              isLoading={isLoading}
              onPress={handleSpeak}
              size={22}
              activeColor={section.color}
            />
            <TouchableOpacity onPress={handleDismiss} style={{ padding: 4 }}>
              <Ionicons name="close" size={24} color={COLORS.textLight} />
            </TouchableOpacity>
          </View>

          {/* Bullets */}
          <ScrollView
            style={sheetStyles.scroll}
            contentContainerStyle={sheetStyles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {section.items.map((item, i) => (
              <Animated.View
                key={i}
                style={[
                  sheetStyles.bulletRow,
                  {
                    opacity: bulletAnims[i] ?? new Animated.Value(1),
                    transform: [
                      {
                        translateX: (
                          bulletAnims[i] ?? new Animated.Value(1)
                        ).interpolate({
                          inputRange: [0, 1],
                          outputRange: [-20, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <View
                  style={[
                    sheetStyles.bullet,
                    { backgroundColor: section.color },
                  ]}
                />
                <Text style={sheetStyles.bulletText}>{item}</Text>
              </Animated.View>
            ))}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const sheetStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
  },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    minHeight: SHEET_HEIGHT,
    ...SHADOWS.cardSelected,
  },
  handleArea: {
    alignItems: "center",
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.borderCard,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.contentPadding,
    paddingBottom: 16,
    gap: 10,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  sheetTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.contentPadding,
    paddingBottom: 40,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 16,
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 7,
    flexShrink: 0,
  },
  bulletText: {
    fontSize: 15,
    lineHeight: 24,
    color: COLORS.textMuted,
    flex: 1,
  },
});

// ─── Accordion Section (3rd section) ─────────────────────────────────────────

const accordionStyles = StyleSheet.create({
  card: {
    borderRadius: RADII.card,
    borderWidth: BORDERS.card,
    marginBottom: SPACING.smallGap + 4,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.contentPadding,
    gap: 14,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  titleRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
    lineHeight: 22,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: SPACING.contentPadding,
  },
  body: {
    paddingHorizontal: SPACING.contentPadding,
    paddingTop: 14,
    paddingBottom: SPACING.contentPadding,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 7,
    flexShrink: 0,
  },
  bulletText: {
    fontSize: 15,
    lineHeight: 23,
    flex: 1,
  },
  ttsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  ttsLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
});

function AccordionSection({ section }: { section: SectionData }) {
  const [expanded, setExpanded] = useState(false);
  const { isSpeaking, isLoading, speak, stop } = useTTS();

  const handlePress = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (expanded) stop();
    setExpanded((v) => !v);
  };

  const handleSpeak = async () => {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
    speak(`${section.title}. ${section.items.join(". ")}`);
  };

  return (
    <View
      style={[
        accordionStyles.card,
        {
          backgroundColor: COLORS.white,
          borderColor: expanded ? section.color + "50" : COLORS.borderCard,
          ...SHADOWS.card,
        },
      ]}
    >
      <Pressable onPress={handlePress} style={accordionStyles.header}>
        <View
          style={[
            accordionStyles.iconCircle,
            { backgroundColor: section.color + "20" },
          ]}
        >
          <Ionicons name={section.icon as any} size={22} color={section.color} />
        </View>
        <View style={accordionStyles.titleRow}>
          <Text style={[accordionStyles.sectionTitle, { color: COLORS.textDark }]}>
            {section.title}
          </Text>
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={20}
            color={expanded ? section.color : COLORS.indicatorInactive}
          />
        </View>
      </Pressable>

      {expanded && (
        <>
          <View
            style={[
              accordionStyles.divider,
              { backgroundColor: COLORS.borderCard },
            ]}
          />
          <View style={accordionStyles.body}>
            {section.items.map((item, i) => (
              <View key={i} style={accordionStyles.bulletRow}>
                <View
                  style={[accordionStyles.bullet, { backgroundColor: section.color }]}
                />
                <Text style={[accordionStyles.bulletText, { color: COLORS.textMuted }]}>
                  {item}
                </Text>
              </View>
            ))}
            <View
              style={[
                accordionStyles.ttsRow,
                { borderTopColor: COLORS.borderCard },
              ]}
            >
              <TTSButton
                isSpeaking={isSpeaking}
                isLoading={isLoading}
                onPress={handleSpeak}
                size={20}
                activeColor={section.color}
              />
              <Text style={[accordionStyles.ttsLabel, { color: COLORS.textLight }]}>
                {isSpeaking ? "Tap to pause" : "Listen to this section"}
              </Text>
            </View>
          </View>
        </>
      )}
    </View>
  );
}

// ─── Video Placeholder ────────────────────────────────────────────────────────

const VIDEO_ACCENT = "#F59E0B";

const videoStyles = StyleSheet.create({
  card: {
    borderRadius: RADII.card,
    borderWidth: BORDERS.card,
    borderColor: VIDEO_ACCENT + "50",
    marginBottom: 28,
    height: 190,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    ...SHADOWS.card,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: VIDEO_ACCENT + "15",
  },
  inner: {
    alignItems: "center",
    justifyContent: "center",
  },
  peopleRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    marginBottom: 14,
  },
  personHead: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: VIDEO_ACCENT + "90",
  },
  personBody: {
    width: 30,
    height: 34,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    backgroundColor: VIDEO_ACCENT + "90",
    marginTop: 3,
  },
  playCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: VIDEO_ACCENT,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    ...SHADOWS.small,
  },
  label: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.textDark,
  },
  sublabel: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 2,
  },
});

function PersonFigure({ scale, offsetTop }: { scale: number; offsetTop: number }) {
  return (
    <View style={{ alignItems: "center", transform: [{ scale }], marginTop: offsetTop }}>
      <View style={videoStyles.personHead} />
      <View style={videoStyles.personBody} />
    </View>
  );
}

function VideoPlaceholder() {
  return (
    <View style={videoStyles.card}>
      <View style={videoStyles.background} />
      <View style={videoStyles.inner}>
        <View style={videoStyles.peopleRow}>
          <PersonFigure scale={0.75} offsetTop={12} />
          <PersonFigure scale={1} offsetTop={0} />
          <PersonFigure scale={0.8} offsetTop={10} />
        </View>
        <View style={videoStyles.playCircle}>
          <Ionicons name="play" size={18} color="#fff" style={{ marginLeft: 2 }} />
        </View>
        <Text style={videoStyles.label}>Patient Video</Text>
        <Text style={videoStyles.sublabel}>Coming Soon</Text>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function SchoolNurseScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeSection, setActiveSection] = useState<SectionData | null>(null);

  const headerAnim = useSharedValue(0);
  const videoAnim = useSharedValue(0);
  const cardsAnim = useSharedValue(0);
  const accordionAnim = useSharedValue(0);

  useEffect(() => {
    headerAnim.value = withTiming(1, { duration: 450 });
    videoAnim.value = withDelay(100, withTiming(1, { duration: 400 }));
    cardsAnim.value = withDelay(200, withTiming(1, { duration: 400 }));
    accordionAnim.value = withDelay(320, withTiming(1, { duration: 400 }));
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerAnim.value,
    transform: [{ translateY: (1 - headerAnim.value) * 16 }],
  }));
  const videoStyle = useAnimatedStyle(() => ({
    opacity: videoAnim.value,
    transform: [{ translateY: (1 - videoAnim.value) * 16 }],
  }));
  const cardsStyle = useAnimatedStyle(() => ({
    opacity: cardsAnim.value,
    transform: [{ translateY: (1 - cardsAnim.value) * 16 }],
  }));
  const accordionStyle = useAnimatedStyle(() => ({
    opacity: accordionAnim.value,
    transform: [{ translateY: (1 - accordionAnim.value) * 16 }],
  }));

  return (
    <View style={styles.container}>
      {/* Nav header */}
      <View style={[styles.navHeader, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={28} color={COLORS.textDark} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title + subtitle */}
        <RNAnimated.View style={headerStyle}>
          <Text style={styles.pageTitle}>
            The School Nurse:{"\n"}
            <Text style={{ color: "#E8735A" }}>Your Ally at School</Text>
          </Text>
          <Text style={styles.pageSubtitle}>
            Your health helper when you're back in class!
          </Text>
        </RNAnimated.View>

        {/* Video placeholder */}
        <RNAnimated.View style={videoStyle}>
          <VideoPlaceholder />
        </RNAnimated.View>

        {/* Icon cards — 2 columns */}
        <RNAnimated.View style={[styles.iconRow, cardsStyle]}>
          {ICON_SECTIONS.map((section, i) => (
            <IconCard
              key={section.id}
              section={section}
              index={i}
              onPress={() => setActiveSection(section)}
            />
          ))}
        </RNAnimated.View>

        {/* Accordion section */}
        <RNAnimated.View style={accordionStyle}>
          <AccordionSection section={ACCORDION_SECTION} />
        </RNAnimated.View>

        {/* Recommendations */}
        <RecommendationList 
          currentId="13" 
          currentTags={['school', 'nurse', 'health', 'medicine', 'support', 'back to school']} 
        />
      </ScrollView>

      {/* Bottom sheet */}
      <BottomSheet
        visible={activeSection !== null}
        section={activeSection}
        onClose={() => setActiveSection(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.appBackground,
  },
  navHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.screenPadding,
    paddingBottom: 10,
    backgroundColor: COLORS.appBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.borderCard,
    ...SHADOWS.header,
    zIndex: 1000,
  },
  backButton: {
    padding: SPACING.smallGap,
    marginLeft: -8,
  },
  scrollContent: {
    padding: SPACING.screenPadding,
    paddingBottom: 60,
  },
  pageTitle: {
    ...TYPOGRAPHY.display,
    fontSize: 32,
    color: COLORS.textDark,
    marginBottom: 10,
    marginTop: 8,
    lineHeight: 42,
  },
  pageSubtitle: {
    fontSize: 17,
    color: COLORS.textMuted,
    lineHeight: 26,
    marginBottom: 28,
    fontWeight: "400",
  },
  iconRow: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 14,
  },
});
