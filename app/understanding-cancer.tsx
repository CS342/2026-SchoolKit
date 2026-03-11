import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Modal,
  Platform,
  Pressable,
  Share,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Image,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useOnboarding } from "../contexts/OnboardingContext";
import { useAccomplishments } from "../contexts/AccomplishmentContext";
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { generateSpeech } from "../services/elevenLabs";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BookmarkButton } from '../components/BookmarkButton';
import { RecommendationList } from '../components/RecommendationList';
import { DownloadButton } from '../components/DownloadButton';
import { useTheme } from "../contexts/ThemeContext";
import { ThemeColors, ThemeShadows } from "../constants/theme";
import { TYPOGRAPHY, SPACING, RADII, BORDERS } from "../constants/onboarding-theme";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const FONT_STEPS = [1.0, 1.2, 1.45];

// --- Types ---
type CardData = {
  id: string;
  front: string;
  back?: string;
  backHeadline?: string;
  canFlip: boolean;
};

// --- Data ---
const CARDS: CardData[] = [
  {
    id: "1",
    front: "What is this page about?",
    backHeadline: "Clearing Up Confusion",
    back: "Different people have different ideas about what cancer is. Sometimes people believe things that **aren't true**. These misunderstandings aren't meant to hurt anyone, but they can make things harder for kids.\n\nTake a look at this list of **common myths** to learn the facts!",
    canFlip: true,
  },
  {
    id: "2",
    front: "Myth: Cancer Can Spread Between People",
    backHeadline: "Cancer Is Not Contagious",
    back: "You **can't catch cancer** from someone else. Kids getting treatment have **weaker immune systems**, making it easier for them to get sick from germs.\n\nThey wear masks to **protect themselves**, not because they are a danger to others.",
    canFlip: true,
  },
  {
    id: "3",
    front: "Myth: Childhood Cancer is the Same as Adult Cancer",
    backHeadline: "Kids Are Not Mini Adults",
    back: "**Childhood cancers are different** from adult cancers. They have different causes and treatments.\n\nKids don't usually get cancer from diet or lifestyle. Doctors use **special treatments** made safely for growing bodies.",
    canFlip: true,
  },
  {
    id: "4",
    front: "Myth: Cancer Always Happens Because of Something Someone Did",
    backHeadline: "It's Usually Random Chance",
    back: "Most of the time, cancer happens by **random chance**, not because of something someone did or didn't do.\n\nOnly a small number of childhood cancers are passed down in families.",
    canFlip: true,
  },
  {
    id: "5",
    front: "Myth: Cancer looks the same for everyone",
    backHeadline: "Every Journey Is Different",
    back: "**Not all cancers are the same.** The changes to one's body—like hair loss, weakness, or pain—can be very different.\n\nEach person has a **different journey** with cancer.",
    canFlip: true,
  },
  {
    id: "6",
    front: "Myth: All Children With Cancer Get Chemotherapy",
    backHeadline: "Treatment Is Individualized",
    back: "Chemotherapy is common, but treatment **depends on the type of cancer**.\n\nOptions include surgery, radiation, and newer **targeted therapies** that don't always involve chemo.",
    canFlip: true,
  },
  {
    id: "7",
    front: "Myth: The Cancer Experience is Over After Treatment Ends",
    backHeadline: "Care Continues After Treatment",
    back: "Survivors may face late effects from treatment. **Long-term follow-up care** is important to stay healthy.\n\nThe experience doesn't just end when treatment stops.",
    canFlip: true,
  },
  {
    id: "8",
    front: "Myth: Cancer is a Death Sentence for Kids",
    backHeadline: "Survival Rates Are Rising",
    back: "The average 5-year survival rate is **86%**—a huge improvement.\n\nWith support, **many children lead distinct, full lives** after treatment.",
    canFlip: true,
  },
  {
    id: "9",
    front:
      "These myths don't cover everything, but we hope they help you think more carefully about what you hear. **Learning the facts helps everyone feel more comfortable.**",
    backHeadline: "Knowledge is Power",
    back: "Understanding the truth about childhood cancer helps create a supportive environment for everyone.",
    canFlip: false,
  },
];

const CARD_COLORS = [
  "#f4978e", 
  "#FFB7B2", 
  "#FFDAC1", 
  "#E2F0CB", 
  "#B5EAD7", 
  "#C7CEEA", 
  "#90E0EF", 
  "#CDB4DB", 
];

const CARD_OVERLAP = 160; 
const CARD_HEIGHT = 200;
const FRONT_HEIGHT = 320; 
const BACK_HEIGHT = 580; 

// --- Stacked Card Component ---
function StackedCard({
  item,
  color,
  index,
  isVisible,
  onPress,
  isDark,
  colors,
  styles,
}: {
  item: CardData;
  color: string;
  index: number;
  isVisible: boolean;
  onPress: () => void;
  isDark: boolean;
  colors: ThemeColors;
  styles: any;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (isVisible && !hasAnimated.current) {
      hasAnimated.current = true;
      const delay = index < 4 ? index * 100 : 0;
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }),
        ]),
      ]).start();
    }
  }, [isVisible, index]);

  const isMyth = item.front.toLowerCase().startsWith("myth:");
  const displayTitle = isMyth ? item.front.substring(5).trim() : item.front;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }),
    ]).start();
    setTimeout(() => onPress(), 50);
  };

  if (!item.canFlip) {
    return (
      <Animated.View style={[styles.stackedCardShadow, { opacity: fadeAnim, transform: [{ scale: scaleAnim }, { translateY: slideAnim }] }]}>
        <View style={[styles.stackedCard, styles.lastCard, { backgroundColor: isDark ? colors.backgroundLight : "#F0F0FF", borderColor: isDark ? colors.borderCard : "#D0D0E0" }]}>
          <Text style={[styles.lastCardText, { color: colors.textDark }]}>{item.front}</Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={handlePress}>
      <Animated.View style={[styles.stackedCardShadow, { opacity: fadeAnim, transform: [{ scale: scaleAnim }, { translateY: slideAnim }] }]}>
        <View style={[styles.stackedCard, { backgroundColor: isDark ? color + "CC" : color, borderColor: color }]}>
          {isMyth && <Text style={[styles.stackedMythLabel, { color: isDark ? "#FFF" : "#000" }]}>MYTH</Text>}
          <Text style={[styles.stackedCardText, { color: isDark ? "#FFF" : "#2D2D44" }]} numberOfLines={2}>{displayTitle}</Text>
          <View style={styles.cardLinesBottom}>
            <View style={[styles.cardLine, { backgroundColor: "rgba(255,255,255,0.4)" }]} />
            <View style={[styles.cardLine, { backgroundColor: "rgba(255,255,255,0.3)" }]} />
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

// --- Expanded Card Modal ---
function ExpandedCardModal({
  visible,
  item,
  color,
  onClose,
  isSpeaking,
  isLoadingAudio,
  onToggleSpeak,
  isAudioLoaded,
  playbackRate,
  onTogglePlaybackRate,
  isDark,
  colors,
  styles,
}: {
  visible: boolean;
  item: CardData | null;
  color: string;
  onClose: () => void;
  isSpeaking: boolean;
  isLoadingAudio: boolean;
  onToggleSpeak: () => void;
  isAudioLoaded: boolean;
  playbackRate: number;
  onTogglePlaybackRate: () => void;
  isDark: boolean;
  colors: ThemeColors;
  styles: any;
}) {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const flipAnim = useRef(new Animated.Value(0)).current;
  const mythScaleAnim = useRef(new Animated.Value(2.5)).current;
  const mythOpacityAnim = useRef(new Animated.Value(0)).current;
  const factUnderlineAnim = useRef(new Animated.Value(0)).current;

  // State for dropdown
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [fontSizeStep, setFontSizeStep] = useState(0);

  // Timers
  let stampTimer: ReturnType<typeof setTimeout>;
  let flipTimer: ReturnType<typeof setTimeout>;

  useEffect(() => {
    if (visible && item) {
      // Reset flip state
      flipAnim.setValue(0);
      mythScaleAnim.setValue(2.5); // Start large
      mythOpacityAnim.setValue(0); // Start invisible
      factUnderlineAnim.setValue(0); // Start underline at 0

      const isMythCard = item.front.toLowerCase().startsWith("myth:");

      // Animate card appearance
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true, // Use native driver for transform/opacity
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      if (isMythCard) {
        // 1. Wait for card to be read (e.g., 1.5s)
        stampTimer = setTimeout(() => {
          // 2. Animate Stamp
          Animated.parallel([
            Animated.timing(mythScaleAnim, {
              toValue: 1,
              duration: 150, // Fast stamp, no bounce
              useNativeDriver: true,
            }),
            Animated.timing(mythOpacityAnim, {
              toValue: 1,
              duration: 100,
              useNativeDriver: true,
            }),
          ]).start(() => {
            // 3. Wait after stamp (e.g., 0.8s) before flipping
            flipTimer = setTimeout(() => {
              Animated.spring(flipAnim, {
                toValue: 1,
                friction: 8,
                tension: 10,
                useNativeDriver: false, // Must be false for height animation
              }).start(() => {
                // Animate underline after flip
                Animated.timing(factUnderlineAnim, {
                  toValue: 1,
                  duration: 400,
                  useNativeDriver: false,
                }).start();
              });
            }, 800);
          });
        }, 1500);
      } else {
        // Normal card behavior (faster flip)
        flipTimer = setTimeout(() => {
          Animated.spring(flipAnim, {
            toValue: 1,
            friction: 8,
            tension: 10,
            useNativeDriver: false, // Must be false for height animation
          }).start(() => {
            // Animate underline after flip
            Animated.timing(factUnderlineAnim, {
              toValue: 1,
              duration: 400,
              useNativeDriver: false,
            }).start();
          });
        }, 1200);
      }

      return () => {
        clearTimeout(stampTimer);
        clearTimeout(flipTimer);
      };
    } else {
      // Reset when closed
      scaleAnim.setValue(0.8);
      opacityAnim.setValue(0);
    }
  }, [visible, item]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, { toValue: 0.8, duration: 150, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start(() => onClose());
  };

  const renderTextWithBold = (text: string, baseStyle: any) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return (
      <Text style={baseStyle}>
        {parts.map((part, index) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return (
              <Text key={index} style={{ fontWeight: "800", color: colors.textDark }}>
                {part.slice(2, -2)}
              </Text>
            );
          }
          return <Text key={index}>{part}</Text>;
        })}
      </Text>
    );
  };

  if (!item) return null;

  const isMyth = item.front.toLowerCase().startsWith("myth:");
  const displayTitle = isMyth ? item.front.substring(5).trim() : item.front;

  const frontRotate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] });
  const backRotate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ["180deg", "360deg"] });
  const frontOpacity = flipAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0, 0] });
  const backOpacity = flipAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0, 1] });
  const cardHeight = flipAnim.interpolate({ inputRange: [0, 1], outputRange: [FRONT_HEIGHT, BACK_HEIGHT] });
  const underlineWidth = factUnderlineAnim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });

  const getFontSize = (text: string) => {
    const len = text.length;
    if (len < 120) return 28;
    if (len < 200) return 26;
    if (len < 300) return 24;
    return 22;
  };

  const backTextFontSize = getFontSize(item.back || "");

  const content = (
    <View style={styles.modalOverlay} pointerEvents="box-none">
      <Pressable style={StyleSheet.absoluteFill} onPress={handleClose}>
        <Animated.View style={[styles.modalBackdrop, { opacity: opacityAnim }]} />
      </Pressable>

      <Animated.View style={[styles.expandedCardContainer, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
        <View>
          <Animated.View style={[styles.expandedCardShadow, { transform: [{ perspective: 1000 }, { rotateY: frontRotate }], opacity: frontOpacity, height: cardHeight }]}>
            <View style={[styles.expandedCard, styles.expandedCardFront, { height: "100%", backgroundColor: isDark ? color + "CC" : color, borderColor: color }]}>
              <View style={styles.expandedCardInnerFront}>
                {isMyth && (
                  <>
                    <View style={styles.mythBadgeContainer}>
                      <View style={[styles.mythBadge, { backgroundColor: "rgba(255,255,255,0.3)" }]}>
                        <Text style={styles.mythBadgeText}>MYTH</Text>
                      </View>
                    </View>
                    <Animated.Image source={require("../assets/images/myth.png")} style={[styles.mythImage, { transform: [{ rotate: "45deg" }, { scale: mythScaleAnim }], opacity: mythOpacityAnim }]} resizeMode="contain" />
                  </>
                )}
                <View style={styles.expandedFrontContent}>
                  <Text style={[styles.expandedFrontTitle, { color: isDark ? "#FFF" : "#2D2D44" }]}>{displayTitle}</Text>
                </View>
              </View>
              <View style={styles.expandedCardLines}>
                <View style={[styles.cardLine, { backgroundColor: "rgba(255,255,255,0.4)" }]} />
                <View style={[styles.cardLine, { backgroundColor: "rgba(255,255,255,0.3)" }]} />
                <View style={[styles.cardLine, { backgroundColor: "rgba(255,255,255,0.2)" }]} />
              </View>
            </View>
          </Animated.View>

          <Animated.View style={[styles.expandedCardShadow, styles.expandedCardBackSide, { transform: [{ perspective: 1000 }, { rotateY: backRotate }], opacity: backOpacity, height: cardHeight }]}>
            <View style={[styles.expandedCard, { height: "100%", backgroundColor: colors.white, borderColor: "#10B981" }]}>
              <View style={styles.expandedCardInner}>
                <View style={styles.factHeader}>
                  <View style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                    <Text style={[styles.factBigText, { color: "#10B981" }]}>Fact</Text>
                    <Animated.View style={{ height: 4, backgroundColor: "#10B981", width: underlineWidth, borderRadius: 2, marginTop: 2 }} />
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <TouchableOpacity onPress={onToggleSpeak} style={styles.speakerButton} disabled={isLoadingAudio}>
                      {isLoadingAudio ? <ActivityIndicator size="small" color="#10B981" /> : (
                        <Ionicons name={isSpeaking ? "stop-circle-outline" : "volume-high-outline"} size={28} color={isSpeaking ? "#FF6B6B" : colors.textDark} />
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setFontSizeStep(s => (s + 1) % FONT_STEPS.length)} hitSlop={10} activeOpacity={0.7} style={{ padding: 6 }}>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: fontSizeStep > 0 ? "#10B981" : '#9CA3AF' }}>Aa</Text>
                    </TouchableOpacity>
                    {isAudioLoaded && (
                      <TouchableOpacity onPress={onTogglePlaybackRate} style={{ padding: 6 }}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textMuted }}>{playbackRate}x</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* Back Headline - Fixed at top */}
                {item.backHeadline && (
                  <View style={{ marginBottom: 16 }}>
                    <Text style={[styles.backHeadline, { color: colors.textDark }]}>
                      {item.backHeadline}
                    </Text>
                    <View style={[styles.backDivider, { backgroundColor: "#10B981" + "40", marginTop: 8 }]} />
                  </View>
                )}

                {/* Answer content */}
                <ScrollView
                  style={styles.backContentScroll}
                  showsVerticalScrollIndicator={true}
                  contentContainerStyle={{
                    flexGrow: 1,
                    paddingBottom: 40,
                    paddingHorizontal: 4,
                  }}
                >
                  {item.back && renderTextWithBold(item.back, [
                    styles.expandedAnswerText,
                    { color: colors.textDark, fontSize: backTextFontSize, lineHeight: backTextFontSize * 1.5 },
                    fontSizeStep > 0 && { fontSize: Math.round(15 * FONT_STEPS[fontSizeStep]), lineHeight: Math.round(24 * FONT_STEPS[fontSizeStep]) }
                  ])}
                </ScrollView>
              </View>

              {/* Index card lines */}
              <View style={styles.expandedCardLines}>
                <View
                  style={[styles.cardLine, { backgroundColor: "#10B981" + "40" }]}
                />
                <View
                  style={[styles.cardLine, { backgroundColor: "#10B981" + "30" }]}
                />
                <View
                  style={[styles.cardLine, { backgroundColor: "#10B981" + "20" }]}
                />
              </View>
            </View>
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  );

  if (Platform.OS === 'web') {
    if (!visible) return null;
    return <View style={StyleSheet.absoluteFill} pointerEvents="box-none">{content}</View>;
  }

  return <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>{content}</Modal>;
}

// --- Main Screen ---
export default function UnderstandingCancerScreen() {
  const { selectedVoice } = useOnboarding();
  const { fireEvent, fireResourceOpened, fireResourceScrolledToEnd } = useAccomplishments();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, shadows, isDark } = useTheme();

  const styles = useMemo(() => makeStyles(colors, shadows, isDark), [colors, shadows, isDark]);

  const [scrolledToEnd, setScrolledToEnd] = useState(false);
  const [timeSpent10s, setTimeSpent10s] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeSpent10s(true);
      fireEvent('cancer_info_read_10s');
      fireResourceOpened('11');
    }, 10_000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (scrolledToEnd && timeSpent10s) fireResourceScrolledToEnd('11');
  }, [scrolledToEnd, timeSpent10s]);

  const [expandedCard, setExpandedCard] = useState<CardData | null>(null);
  const [visibleLimit, setVisibleLimit] = useState(4);

  const player = useAudioPlayer();
  const playerStatus = useAudioPlayerStatus(player);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);

  const togglePlaybackRate = () => {
    let next = 1.0;
    if (playbackRate === 1.0) next = 1.25;
    else if (playbackRate === 1.25) next = 1.5;
    else if (playbackRate === 1.5) next = 2.0;
    setPlaybackRate(next);
    if (playerStatus.isLoaded) player.setPlaybackRate(next);
  };

  useEffect(() => {
    if (playerStatus.isLoaded && playerStatus.didJustFinish) {
      setIsSpeaking(false);
      player.seekTo(0);
    }
  }, [playerStatus.isLoaded, playerStatus.didJustFinish]);

  const getCardColor = (id: string) => {
    const index = CARDS.findIndex(c => c.id === id);
    return CARD_COLORS[index % CARD_COLORS.length] || "#FFFFFF";
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    const newLimit = Math.floor((scrollY + SCREEN_HEIGHT - 100) / CARD_OVERLAP);
    if (newLimit > visibleLimit) setVisibleLimit(newLimit);

    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    if (!scrolledToEnd && layoutMeasurement.height + contentOffset.y >= contentSize.height - 40) {
      setScrolledToEnd(true);
    }
  };

  const closeExpandedCard = () => {
    player.pause();
    setIsSpeaking(false);
    setExpandedCard(null);
  };

  const handleSpeak = async () => {
    if (isSpeaking) {
      player.pause();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      if (playerStatus.isLoaded) {
        player.play();
      } else if (expandedCard?.back) {
        try {
          setIsLoadingAudio(true);
          let textToSpeak = "Fact. ";
          if (expandedCard.backHeadline) textToSpeak += expandedCard.backHeadline + ". ";
          textToSpeak += expandedCard.back.replace(/\*\*/g, "");
          const audioUri = await generateSpeech(textToSpeak, selectedVoice);
          if (audioUri) {
            player.replace(audioUri);
            player.play();
          }
        } catch (error) {
          setIsSpeaking(false);
        } finally {
          setIsLoadingAudio(false);
        }
      }
    }
  };

  const handleCardPress = (card: CardData) => {
    if (card.canFlip) setExpandedCard(card);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: 'Check out "Understanding What Cancer Is and Isn\'t" on SchoolKit — learn the facts and bust common myths about cancer.',
      });
      fireEvent('resource_shared');
    } catch { }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: colors.white, borderBottomColor: colors.borderCard }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={28} color={colors.textDark} />
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity onPress={handleShare} style={{ padding: 4 }} accessibilityLabel="Share">
            <Ionicons name="share-outline" size={28} color={colors.textLight} />
          </TouchableOpacity>
          <DownloadButton resourceId="11" size={28} color={colors.primary} />
          <BookmarkButton resourceId="11" size={28} color={colors.primary} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} onScroll={handleScroll} scrollEventThrottle={16}>
        <Text style={[styles.pageTitle, { color: colors.textDark }]}>
          Understanding{"\n"}
          <Text style={{ color: colors.primary }}>What Cancer Is</Text>
          {"\n"}and Isn't
        </Text>
        <Text style={[styles.instructionText, { color: colors.textMuted }]}>Click each card to learn more.</Text>

        <View style={[styles.stackContainer, { height: CARDS.length * CARD_OVERLAP + CARD_HEIGHT }]}>
          {CARDS.map((card, index) => (
            <View key={card.id} style={[styles.stackedCardWrapper, { top: index * CARD_OVERLAP, zIndex: index + 1 }]}>
              <StackedCard item={card} color={CARD_COLORS[index % CARD_COLORS.length]} index={index} isVisible={index <= visibleLimit} onPress={() => handleCardPress(card)} isDark={isDark} colors={colors} styles={styles} />
            </View>
          ))}
        </View>

        <RecommendationList currentId="11" currentTags={['cancer', 'understanding', 'myths', 'facts']} />
      </ScrollView>

      <ExpandedCardModal visible={expandedCard !== null} item={expandedCard} color={expandedCard ? getCardColor(expandedCard.id) : colors.white} onClose={closeExpandedCard} isSpeaking={isSpeaking} isLoadingAudio={isLoadingAudio} onToggleSpeak={handleSpeak} isAudioLoaded={playerStatus.isLoaded} playbackRate={playbackRate} onTogglePlaybackRate={togglePlaybackRate} isDark={isDark} colors={colors} styles={styles} />
    </View>
  );
}

const makeStyles = (c: ThemeColors, s: ThemeShadows, isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.appBackground },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    ...s.header,
    zIndex: 1000,
  },
  backButton: { padding: 8, marginLeft: -8 },
  pageTitle: {
    ...TYPOGRAPHY.display,
    fontSize: 34,
    color: c.textDark,
    textAlign: "left",
    marginBottom: 8,
    marginTop: 10,
    lineHeight: 42,
    letterSpacing: -1,
  },
  instructionText: {
    ...TYPOGRAPHY.labelSmall,
    color: c.textMuted,
    fontWeight: "300",
    marginBottom: 32,
  },
  scrollContent: { padding: 24, paddingBottom: 60 },
  stackContainer: { position: "relative", width: "100%" },
  stackedCardWrapper: { position: "absolute", left: 0, right: 0 },
  stackedCardShadow: { ...s.card },
  stackedCard: {
    height: CARD_HEIGHT,
    borderRadius: 20,
    borderWidth: 3,
    padding: 20,
    paddingTop: 24,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  lastCard: { height: "auto" as any, minHeight: 220, paddingVertical: 32, paddingHorizontal: 24 },
  lastCardText: { fontSize: 20, fontWeight: "500", lineHeight: 28, textAlign: "center" },
  stackedMythLabel: { fontSize: 12, fontWeight: "700", letterSpacing: 3, opacity: 0.5, marginBottom: 8, textAlign: "center", textTransform: "uppercase" },
  stackedCardText: { fontSize: 24, fontWeight: "600", lineHeight: 32, textAlign: "center", letterSpacing: -0.5 },
  cardLinesBottom: { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingBottom: 10, gap: 4 },
  cardLine: { height: 2, borderRadius: 1, marginTop: 4 },
  modalOverlay: { flex: 1, justifyContent: "center", alignItems: "center" },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0, 0, 0, 0.7)" },
  expandedCardContainer: { width: '88%', maxWidth: 560, maxHeight: SCREEN_HEIGHT * 0.7 },
  expandedCardShadow: { width: "100%", ...s.card },
  expandedCard: { width: "100%", borderRadius: 40, borderWidth: 4, overflow: "hidden", backfaceVisibility: "hidden" },
  expandedCardFront: {},
  expandedCardBackSide: { position: "absolute", top: 0, left: 0, right: 0 },
  expandedCardInnerFront: { flex: 1, padding: 28, alignItems: "center" },
  mythBadgeContainer: { position: "absolute", top: 28, left: 0, right: 0, alignItems: "center", zIndex: 10 },
  expandedFrontContent: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 10 },
  expandedFrontTitle: { fontSize: 32, fontWeight: "600", textAlign: "center", lineHeight: 40, letterSpacing: -0.5 },
  expandedCardInner: { padding: 28, flex: 1, overflow: 'hidden' },
  expandedCardLines: { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingBottom: 16, gap: 6 },
  factHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 16, position: 'relative' },
  speakerButton: { padding: 8 },
  factBigText: { fontSize: 34, fontWeight: "900", letterSpacing: 1, textTransform: "uppercase" },
  mythBadge: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginBottom: 12 },
  mythBadgeText: { fontSize: 13, fontWeight: "700", color: "#FFFFFF", letterSpacing: 3, textTransform: "uppercase" },
  mythImage: { position: "absolute", top: "50%", left: "50%", marginTop: -120, marginLeft: -120, width: 240, height: 240, zIndex: 20 },
  backHeadline: { fontSize: 28, fontWeight: "800", textAlign: "left", marginBottom: 12, letterSpacing: -0.5, lineHeight: 34 },
  backDivider: { height: 2, width: "40%", borderRadius: 1, marginBottom: 20 },
  expandedAnswerText: { fontSize: 20, fontWeight: "500", textAlign: "left", lineHeight: 32 },
  backContentScroll: { flex: 1 },
});
