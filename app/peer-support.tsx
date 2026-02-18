import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Modal,
  Pressable,
  PanResponder,
  Share,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { generateSpeech } from "../services/elevenLabs";
import RNAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withSpring,
} from "react-native-reanimated";
import { BookmarkButton } from "../components/BookmarkButton";
import { DownloadButton } from "../components/DownloadButton";
import { TTSButton } from "../components/TTSButton";
import { useTTS } from "../hooks/useTTS";
import {
  COLORS,
  SHADOWS,
  TYPOGRAPHY,
  ANIMATION,
  SPACING,
  RADII,
  BORDERS,
  withOpacity,
} from "../constants/onboarding-theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useOnboarding } from "../contexts/OnboardingContext";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// --- Types ---
type PeerTopic = {
  id: string;
  title: string;
  fullTitle: string;
  icon: string;
  color: string;
  intro: string;
  points: string[];
  summary: string;
};

// --- Data ---
const PEER_TOPICS: PeerTopic[] = [
  {
    id: "1",
    title: "Kindness &\nRespect",
    fullTitle: "Set Clear Expectations for Kindness and Respect",
    icon: "heart-outline",
    color: "#E07A70", // Darker from #F4978E
    intro:
      "Children often want to be supportive but need clear guidance on what that looks like.",
    points: [
      "Reinforce classroom norms around kindness, inclusion, and respect.",
      "Clearly state that teasing, rumors, or exclusion are not acceptable.",
      "Model respectful language and curiosity.",
      "Remind students that everyone's body and abilities can change over time.",
    ],
    summary:
      "Clear expectations help peers feel confident and safe in their interactions.",
  },
  {
    id: "2",
    title: "School\nCommunity",
    fullTitle: "Involve the Whole School Community",
    icon: "people-outline",
    color: "#7AC5D8", // Darker from #90E0EF
    intro: "Peer support extends beyond the classroom.",
    points: [
      "Collaborate with recess monitors, coaches, and specialty teachers.",
      "Encourage inclusive practices in extracurricular activities.",
      "Reinforce consistent messages across settings.",
    ],
    summary:
      "A unified approach strengthens a child's sense of safety and belonging.",
  },
  {
    id: "3",
    title: "Address\nChallenges",
    fullTitle: "Address Challenges Early",
    icon: "alert-circle-outline",
    color: "#E0BFA0", // Darker from #FFDAC1
    intro: "Social challenges may surface gradually.",
    points: [
      "Watch for signs of exclusion, withdrawal, or subtle bullying.",
      "Intervene early and calmly when issues arise.",
      "Communicate concerns with counselors, social workers, or administrators.",
      "Partner with families if peer issues persist.",
    ],
    summary:
      "Early support prevents small issues from becoming bigger barriers.",
  },
  {
    id: "4",
    title: "What to\nSay",
    fullTitle: "Help Students Know What to Say (and What Not to Say)",
    icon: "chatbubble-ellipses-outline",
    color: "#C2D5A8", // Darker from #E2F0CB
    intro:
      "Peers may worry about asking the wrong question\u2014or may ask very direct ones.",
    points: [
      "Offer age-appropriate guidance on respectful questions.",
      "Normalize that it's okay not to ask about medical details.",
      'Encourage simple, friendly interactions: "Want to sit with us?" or "Do you want to play?"',
      "Redirect conversations if questions become intrusive.",
    ],
    summary:
      "Helpful framing: \"It's okay to be curious, but it's important to be kind and respectful.\"",
  },
  {
    id: "5",
    title: "Structured\nConnection",
    fullTitle: "Use Structured Opportunities for Connection",
    icon: "link-outline",
    color: "#95D1BB", // Darker from #B5EAD7
    intro:
      "Intentional structure can reduce social pressure for both the returning student and their peers.",
    points: [
      "Assign a peer buddy or small group for transitions or group work.",
      "Rotate partners so support doesn't fall on one student alone.",
      "Use cooperative learning activities that emphasize teamwork.",
      "Provide low-pressure ways to reconnect, such as shared projects or games.",
    ],
    summary: "Structure creates connection without forcing attention.",
  },
  {
    id: "6",
    title: "Empathy\nNot Pity",
    fullTitle: "Encourage Empathy Without Pity",
    icon: "hand-left-outline",
    color: "#AAB3D6", // Darker from #C7CEEA
    intro: "Support should feel empowering\u2014not isolating.",
    points: [
      "Discourage overhelping or excessive attention.",
      "Remind students to follow the returning child's lead.",
      "Focus on shared interests and normal classroom experiences.",
      "Praise peers for inclusive behaviors you observe.",
    ],
    summary: "The goal is connection, not sympathy.",
  },
  {
    id: "7",
    title: "Normalize\nDifferences",
    fullTitle: "Normalize Differences and Fluctuating Abilities",
    icon: "sparkles-outline",
    color: "#B29AC3", // Darker from #CDB4DB
    intro:
      "Cancer survivors may have visible or invisible changes, including fatigue, hair loss, mobility differences, or cognitive effects.",
    points: [
      "Emphasize that everyone has strengths and challenges.",
      "Avoid framing accommodations as \"special treatment.\"",
      "Reinforce that fairness means everyone gets what they need to succeed.",
      "Celebrate effort and participation, not just performance.",
    ],
    summary:
      "This helps peers understand differences without judgment.",
  },
];

// --- Person Silhouette Constants ---
const HEAD_SIZE = 18;
const BODY_WIDTH = 30;
const BODY_HEIGHT = 36;
const SILHOUETTE_HEIGHT = HEAD_SIZE + 3 + BODY_HEIGHT;

// --- Circle Layout Constants ---
const CIRCLE_RADIUS = Math.min(SCREEN_WIDTH * 0.29, 120);
const ICON_SIZE = SILHOUETTE_HEIGHT;
const CIRCLE_AREA_SIZE = CIRCLE_RADIUS * 2 + ICON_SIZE + 60;
const LABEL_WIDTH = 84;
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.6;

const getIconPosition = (index: number, total: number) => {
  const angleStep = (2 * Math.PI) / total;
  const angle = -Math.PI / 2 + index * angleStep;
  const centerX = CIRCLE_AREA_SIZE / 2;
  const centerY = CIRCLE_AREA_SIZE / 2;
  return {
    left: centerX + CIRCLE_RADIUS * Math.cos(angle) - ICON_SIZE / 2,
    top: centerY + CIRCLE_RADIUS * Math.sin(angle) - ICON_SIZE / 2,
  };
};

// --- Person Silhouette Component ---
function PersonSilhouette({ color }: { color: string }) {
  return (
    <View style={styles.silhouette}>
      {/* Head */}
      <View
        style={[
          styles.silhouetteHead,
          { backgroundColor: color },
        ]}
      />
      {/* Body */}
      <View
        style={[
          styles.silhouetteBody,
          { backgroundColor: color },
        ]}
      />
    </View>
  );
}

// --- Person Icon Component ---
function PersonIcon({
  topic,
  index,
  position,
  onPress,
}: {
  topic: PeerTopic;
  index: number;
  position: { left: number; top: number };
  onPress: () => void;
}) {
  const scale = useSharedValue(0);
  const pressScale = useSharedValue(1);

  useEffect(() => {
    scale.value = withDelay(
      500 + index * 80,
      withSpring(1, ANIMATION.springBouncy)
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * pressScale.value }],
  }));

  const handlePressIn = () => {
    pressScale.value = withTiming(0.9, { duration: 80 });
  };

  const handlePressOut = () => {
    pressScale.value = withSpring(1, ANIMATION.springBouncy);
  };

  return (
    <RNAnimated.View
      style={[
        styles.personIconContainer,
        { left: position.left - (LABEL_WIDTH - ICON_SIZE) / 2, top: position.top },
        animatedStyle,
      ]}
    >
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        style={styles.personIconPressable}
      >
        <PersonSilhouette color={topic.color} />
        <Text style={[styles.personIconLabel, { color: topic.color }]} numberOfLines={2}>
          {topic.title}
        </Text>
      </Pressable>
    </RNAnimated.View>
  );
}

// --- Circle Layout Component ---
function CircleLayout({
  topics,
  onTopicPress,
}: {
  topics: PeerTopic[];
  onTopicPress: (topic: PeerTopic) => void;
}) {
  const containerOpacity = useSharedValue(0);
  const containerScale = useSharedValue(0.9);

  useEffect(() => {
    containerOpacity.value = withDelay(400, withTiming(1, { duration: 400 }));
    containerScale.value = withDelay(
      400,
      withSpring(1, ANIMATION.springSmooth)
    );
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
    transform: [{ scale: containerScale.value }],
  }));

  return (
    <RNAnimated.View
      style={[
        styles.circleContainer,
        { width: CIRCLE_AREA_SIZE, height: CIRCLE_AREA_SIZE + 30 },
        containerStyle,
      ]}
    >
      {topics.map((topic, index) => {
        const position = getIconPosition(index, topics.length);
        return (
          <PersonIcon
            key={topic.id}
            topic={topic}
            index={index}
            position={position}
            onPress={() => onTopicPress(topic)}
          />
        );
      })}
    </RNAnimated.View>
  );
}

// --- Bottom Sheet Component ---
function BottomSheet({
  visible,
  topic,
  onClose,
  selectedVoice,
}: {
  visible: boolean;
  topic: PeerTopic | null;
  onClose: () => void;
  selectedVoice: string;
}) {
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const [internalVisible, setInternalVisible] = useState(false);
  const bulletAnims = useRef<Animated.Value[]>([]).current;

  // TTS state for bottom sheet
  const [sheetSound, setSheetSound] = useState<Audio.Sound | null>(null);
  const [isSheetSpeaking, setIsSheetSpeaking] = useState(false);
  const [isSheetLoadingAudio, setIsSheetLoadingAudio] = useState(false);

  const maxBullets = 8;
  while (bulletAnims.length < maxBullets) {
    bulletAnims.push(new Animated.Value(0));
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => gs.dy > 5,
      onPanResponderMove: (_, gs) => {
        if (gs.dy > 0) {
          translateY.setValue(gs.dy);
        }
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > 100 || gs.vy > 0.5) {
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
    if (visible && topic) {
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
        const totalItems = (topic.points.length || 0) + 2;
        const anims = [];
        for (let i = 0; i < totalItems && i < bulletAnims.length; i++) {
          anims.push(
            Animated.timing(bulletAnims[i], {
              toValue: 1,
              duration: 300,
              delay: i * 80,
              useNativeDriver: true,
            })
          );
        }
        Animated.stagger(80, anims).start();
      });
    }
  }, [visible, topic]);

  const handleDismiss = useCallback(() => {
    // Stop audio on dismiss
    if (sheetSound) {
      sheetSound.unloadAsync();
      setSheetSound(null);
      setIsSheetSpeaking(false);
    }

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
  }, [onClose, sheetSound]);

  const handleSheetSpeak = async () => {
    if (!topic) return;

    if (isSheetSpeaking) {
      if (sheetSound) await sheetSound.pauseAsync();
      setIsSheetSpeaking(false);
      return;
    }

    setIsSheetSpeaking(true);

    if (sheetSound) {
      await sheetSound.playAsync();
      return;
    }

    try {
      setIsSheetLoadingAudio(true);
      const pointsText = topic.points.join(". ");
      const textToSpeak = `${topic.fullTitle}. ${topic.intro}. ${pointsText}. ${topic.summary}`;
      const audioUri = await generateSpeech(textToSpeak, selectedVoice);

      if (audioUri) {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: audioUri },
          { shouldPlay: true }
        );
        setSheetSound(newSound);
        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            setIsSheetSpeaking(false);
            newSound.setPositionAsync(0);
          }
        });
      } else {
        setIsSheetSpeaking(false);
      }
    } catch (error) {
      console.error("Audio playback error:", error);
      setIsSheetSpeaking(false);
    } finally {
      setIsSheetLoadingAudio(false);
    }
  };

  // Reset audio when topic changes
  useEffect(() => {
    if (sheetSound) {
      sheetSound.unloadAsync();
      setSheetSound(null);
      setIsSheetSpeaking(false);
    }
  }, [topic?.id]);

  if (!internalVisible || !topic) return null;

  return (
    <Modal transparent visible={internalVisible} animationType="none" onRequestClose={handleDismiss}>
      <View style={styles.sheetOverlay}>
        {/* Backdrop */}
        <Pressable style={StyleSheet.absoluteFill} onPress={handleDismiss}>
          <Animated.View
            style={[
              styles.sheetBackdrop,
              { opacity: backdropOpacity.interpolate({ inputRange: [0, 1], outputRange: [0, 0.5] }) },
            ]}
          />
        </Pressable>

        {/* Sheet */}
        <Animated.View
          style={[
            styles.sheetContainer,
            { transform: [{ translateY }] },
          ]}
        >
          {/* Drag handle */}
          <View {...panResponder.panHandlers} style={styles.sheetHandleArea}>
            <View style={styles.sheetHandle} />
          </View>

          {/* Sheet actions */}
          <View style={styles.sheetActions}>
            <TouchableOpacity onPress={handleSheetSpeak} style={styles.sheetActionButton} accessibilityLabel={isSheetSpeaking ? "Pause reading" : "Read aloud"}>
              {isSheetLoadingAudio ? (
                <ActivityIndicator size="small" color={topic.color} />
              ) : (
                <Ionicons name={isSheetSpeaking ? "pause-circle" : "volume-high"} size={22} color={isSheetSpeaking ? topic.color : COLORS.textLight} />
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.sheetActionButton} onPress={handleDismiss} accessibilityLabel="Close">
              <Ionicons name="close" size={24} color={COLORS.textLight} />
            </TouchableOpacity>
          </View>

          {/* Title */}
          <View style={[styles.sheetTitleBadge, { backgroundColor: withOpacity(topic.color, 0.15) }]}>
            <Ionicons name={topic.icon as any} size={22} color={topic.color} style={{ marginRight: 10 }} />
            <Text style={[styles.sheetTitleText, { color: topic.color }]} numberOfLines={2}>
              {topic.fullTitle}
            </Text>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.sheetScrollView}
            contentContainerStyle={styles.sheetScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Intro */}
            <Animated.View
              style={{
                opacity: bulletAnims[0],
                transform: [
                  {
                    translateX: bulletAnims[0].interpolate({
                      inputRange: [0, 1],
                      outputRange: [-20, 0],
                    }),
                  },
                ],
              }}
            >
              <Text style={styles.sheetIntro}>{topic.intro}</Text>
            </Animated.View>

            {/* Bullet points */}
            {topic.points.map((point, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.bulletRow,
                  {
                    opacity: bulletAnims[i + 1] || new Animated.Value(1),
                    transform: [
                      {
                        translateX: (bulletAnims[i + 1] || new Animated.Value(1)).interpolate({
                          inputRange: [0, 1],
                          outputRange: [-20, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <View style={[styles.bulletDot, { backgroundColor: topic.color }]} />
                <Text style={styles.bulletText}>{point}</Text>
              </Animated.View>
            ))}

            {/* Summary */}
            <Animated.View
              style={{
                opacity: bulletAnims[topic.points.length + 1] || new Animated.Value(1),
                transform: [
                  {
                    translateX: (
                      bulletAnims[topic.points.length + 1] || new Animated.Value(1)
                    ).interpolate({
                      inputRange: [0, 1],
                      outputRange: [-20, 0],
                    }),
                  },
                ],
              }}
            >
              <View style={[styles.summaryBar, { backgroundColor: withOpacity(topic.color, 0.25) }]} />
              <Text style={styles.sheetSummary}>{topic.summary}</Text>
            </Animated.View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

// --- Main Screen ---
export default function PeerSupportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { selectedVoice } = useOnboarding();
  const [selectedTopic, setSelectedTopic] = useState<PeerTopic | null>(null);

  // TTS state for main page
  const [pageSound, setPageSound] = useState<Audio.Sound | null>(null);
  const [isPageSpeaking, setIsPageSpeaking] = useState(false);
  const [isPageLoadingAudio, setIsPageLoadingAudio] = useState(false);

  useEffect(() => {
    return () => {
      if (pageSound) pageSound.unloadAsync();
    };
  }, [pageSound]);

  const handlePageSpeak = async () => {
    if (isPageSpeaking) {
      if (pageSound) await pageSound.pauseAsync();
      setIsPageSpeaking(false);
      return;
    }

    setIsPageSpeaking(true);

    if (pageSound) {
      await pageSound.playAsync();
      return;
    }

    try {
      setIsPageLoadingAudio(true);
      const textToSpeak = `Encouraging Positive Peer Support. "Alone we can do so little; together we can do so much." Helen Keller. Why is peer support important? After a prolonged absence, a returning student may worry about being different, falling behind socially, or being treated differently by classmates. Positive peer support helps create a welcoming environment where every student feels they belong.`;
      const audioUri = await generateSpeech(textToSpeak, selectedVoice);

      if (audioUri) {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: audioUri },
          { shouldPlay: true }
        );
        setPageSound(newSound);
        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            setIsPageSpeaking(false);
            newSound.setPositionAsync(0);
          }
        });
      } else {
        setIsPageSpeaking(false);
      }
    } catch (error) {
      console.error("Audio playback error:", error);
      setIsPageSpeaking(false);
    } finally {
      setIsPageLoadingAudio(false);
    }
  };

  // Entrance animations
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(20);
  const quoteOpacity = useSharedValue(0);
  const quoteTranslateY = useSharedValue(20);
  const sectionOpacity = useSharedValue(0);
  const sectionTranslateY = useSharedValue(20);

  useEffect(() => {
    titleOpacity.value = withTiming(1, { duration: 500 });
    titleTranslateY.value = withTiming(0, { duration: 500 });
    quoteOpacity.value = withDelay(100, withTiming(1, { duration: 500 }));
    quoteTranslateY.value = withDelay(100, withTiming(0, { duration: 500 }));
    sectionOpacity.value = withDelay(200, withTiming(1, { duration: 500 }));
    sectionTranslateY.value = withDelay(200, withTiming(0, { duration: 500 }));
  }, []);

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const quoteStyle = useAnimatedStyle(() => ({
    opacity: quoteOpacity.value,
    transform: [{ translateY: quoteTranslateY.value }],
  }));

  const sectionStyle = useAnimatedStyle(() => ({
    opacity: sectionOpacity.value,
    transform: [{ translateY: sectionTranslateY.value }],
  }));

  const handleShare = async () => {
    try {
      await Share.share({
        message: 'Check out "Encouraging Positive Peer Support" on SchoolKit — learn how to help peers support a returning student.',
      });
    } catch {}
  };

  const handleTopicPress = (topic: PeerTopic) => {
    setSelectedTopic(topic);
  };

  const handleCloseSheet = () => {
    setSelectedTopic(null);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={28} color={COLORS.textDark} />
        </TouchableOpacity>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <TouchableOpacity onPress={handlePageSpeak} style={{ padding: 4 }} accessibilityLabel={isPageSpeaking ? "Pause reading" : "Read aloud"}>
            {isPageLoadingAudio ? (
              <ActivityIndicator size="small" color={COLORS.studentK8} />
            ) : (
              <Ionicons name={isPageSpeaking ? "pause-circle" : "volume-high"} size={28} color={isPageSpeaking ? COLORS.studentK8 : COLORS.textMuted} />
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={{ padding: 4 }} accessibilityLabel="Share">
            <Ionicons name="share-outline" size={28} color={COLORS.textMuted} />
          </TouchableOpacity>
          <DownloadButton resourceId="12" size={28} color={COLORS.studentK8} />
          <BookmarkButton resourceId="12" size={28} color={COLORS.studentK8} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Page Title */}
        <RNAnimated.View style={titleStyle}>
          <Text style={styles.pageTitle}>
            Encouraging{"\n"}
            <Text style={{ color: COLORS.studentK8 }}>Positive Peer</Text>
            {"\n"}Support
          </Text>
        </RNAnimated.View>

        {/* Quote Card */}
        <RNAnimated.View style={[styles.quoteCard, quoteStyle]}>
          <Text style={styles.quoteText}>
            {"\u201C"}Alone we can do so little; together we can do so much.{"\u201D"}
          </Text>
          <Text style={styles.quoteAuthor}>{"\u2014"} Helen Keller</Text>
        </RNAnimated.View>

        {/* Why Section */}
        <RNAnimated.View style={sectionStyle}>
          <Text style={styles.sectionHeading}>
            Why is peer support important?
          </Text>
          <Text style={styles.sectionBody}>
            After a prolonged absence, a returning student may worry about being
            different, falling behind socially, or being treated differently by
            classmates. Positive peer support helps create a welcoming
            environment where every student feels they belong.
          </Text>
        </RNAnimated.View>

        {/* Instruction */}
        <RNAnimated.View style={sectionStyle}>
          <Text style={styles.instructionText}>
            Tap each person to learn more.
          </Text>
        </RNAnimated.View>

        {/* Circle Layout */}
        <View style={styles.circleWrapper}>
          <CircleLayout topics={PEER_TOPICS} onTopicPress={handleTopicPress} />
        </View>
      </ScrollView>

      {/* Bottom Sheet */}
      <BottomSheet
        visible={selectedTopic !== null}
        topic={selectedTopic}
        onClose={handleCloseSheet}
        selectedVoice={selectedVoice}
      />
    </View>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.appBackground,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.screenPadding,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
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
    fontSize: 34,
    color: COLORS.textDark,
    textAlign: "left",
    marginBottom: 20,
    marginTop: 10,
    lineHeight: 42,
  },

  // Quote
  quoteCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADII.button,
    borderWidth: BORDERS.card,
    borderColor: COLORS.borderCard,
    padding: SPACING.screenPadding,
    marginBottom: 28,
    ...SHADOWS.card,
  },
  quoteText: {
    ...TYPOGRAPHY.body,
    fontStyle: "italic",
    color: COLORS.textDark,
    textAlign: "center",
    lineHeight: 28,
    marginBottom: SPACING.smallGap,
  },
  quoteAuthor: {
    ...TYPOGRAPHY.labelSmall,
    fontWeight: "500",
    fontStyle: "italic",
    color: COLORS.textLight,
    textAlign: "center",
  },

  // Section
  sectionHeading: {
    ...TYPOGRAPHY.h2,
    fontWeight: "800",
    color: COLORS.textDark,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  sectionBody: {
    fontSize: 16,
    fontWeight: "400",
    color: COLORS.textMuted,
    lineHeight: 24,
    marginBottom: SPACING.sectionGap,
  },
  instructionText: {
    ...TYPOGRAPHY.labelSmall,
    fontWeight: "300",
    color: COLORS.textLight,
    marginBottom: SPACING.smallGap,
  },

  // Circle layout
  circleWrapper: {
    alignItems: "center",
    marginTop: SPACING.smallGap,
    marginBottom: 40,
  },
  circleContainer: {
    position: "relative",
  },

  // Person silhouette
  silhouette: {
    alignItems: "center",
    height: SILHOUETTE_HEIGHT,
  },
  silhouetteHead: {
    width: HEAD_SIZE,
    height: HEAD_SIZE,
    borderRadius: HEAD_SIZE / 2,
  },
  silhouetteBody: {
    width: BODY_WIDTH,
    height: BODY_HEIGHT,
    borderTopLeftRadius: BODY_WIDTH * 0.4,
    borderTopRightRadius: BODY_WIDTH * 0.4,
    borderBottomLeftRadius: BODY_WIDTH * 0.25,
    borderBottomRightRadius: BODY_WIDTH * 0.25,
    marginTop: 3,
  },

  // Person icon container
  personIconContainer: {
    position: "absolute",
    width: LABEL_WIDTH,
    alignItems: "center",
  },
  personIconPressable: {
    alignItems: "center",
  },
  personIconLabel: {
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 6,
    width: LABEL_WIDTH,
    lineHeight: 14,
  },

  // Bottom sheet
  sheetOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.shadow,
  },
  sheetContainer: {
    height: SHEET_HEIGHT,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADII.userCard,
    borderTopRightRadius: RADII.userCard,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
    overflow: "hidden",
  },
  sheetHandleArea: {
    paddingVertical: SPACING.itemGap,
    alignItems: "center",
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.indicatorInactive,
  },
  sheetActions: {
    position: "absolute",
    top: 14,
    right: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    zIndex: 10,
  },
  sheetActionButton: {
    padding: 6,
  },
  sheetTitleBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: SPACING.screenPadding,
    paddingHorizontal: 16,
    paddingVertical: SPACING.itemGap,
    borderRadius: RADII.input,
    marginBottom: 16,
  },
  sheetTitleText: {
    ...TYPOGRAPHY.body,
    fontWeight: "800",
    flex: 1,
    lineHeight: 24,
  },
  sheetScrollView: {
    flex: 1,
  },
  sheetScrollContent: {
    paddingHorizontal: SPACING.screenPadding,
    paddingBottom: 40,
  },
  sheetIntro: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: "500",
    color: COLORS.textDark,
    lineHeight: 24,
    marginBottom: SPACING.contentPadding,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: SPACING.itemGap,
  },
  bulletDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 7,
    marginRight: 12,
    flexShrink: 0,
  },
  bulletText: {
    ...TYPOGRAPHY.labelSmall,
    fontWeight: "400",
    color: COLORS.textMuted,
    lineHeight: 22,
    flex: 1,
  },
  summaryBar: {
    height: 3,
    borderRadius: 1.5,
    marginTop: 10,
    marginBottom: SPACING.itemGap,
  },
  sheetSummary: {
    ...TYPOGRAPHY.labelSmall,
    fontStyle: "italic",
    color: COLORS.textMuted,
    lineHeight: 22,
  },
});
