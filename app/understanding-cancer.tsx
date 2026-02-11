import React, { useState, useRef, useEffect } from "react";
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
  Share,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Image,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useOnboarding } from "../contexts/OnboardingContext";
import { Audio } from "expo-av";
import { generateSpeech, VOICES } from "../services/elevenLabs";
import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BookmarkButton } from '../components/BookmarkButton';
import { DownloadButton } from '../components/DownloadButton';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// --- Types ---
type CardData = {
  id: string;
  front: string;
  back?: string;
  backHeadline?: string; // New headline for the back
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
    canFlip: false, // Wait, this card has canFlip: false in original.
  },
];

// Pastel color palette for cards
const CARD_COLORS = [
  "#f4978e", // Pink
  "#FFB7B2", // Light Pink
  "#FFDAC1", // Peach
  "#E2F0CB", // Mint
  "#B5EAD7", // Light Green
  "#C7CEEA", // Periwinkle
  "#90E0EF", // Light Blue
  "#CDB4DB", // Lilac
];

// Card overlap amount for stacked effect - increased to show 2 lines of text
// Card overlap amount for stacked effect - increased to show 2 lines of text
const CARD_OVERLAP = 160; // Increased from 145 to spread cards out more
const CARD_HEIGHT = 200;

// Expanded card dimensions
const FRONT_HEIGHT = 320; // More square-like
const BACK_HEIGHT = 580; // Taller for content

// --- Stacked Card Component (in the stack) ---
function StackedCard({
  item,
  color,
  index,
  isVisible,
  onPress,
}: {
  item: CardData;
  color: string;
  index: number;
  isVisible: boolean;
  onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const hasAnimated = useRef(false);

  React.useEffect(() => {
    if (isVisible && !hasAnimated.current) {
      hasAnimated.current = true;
      const delay = index < 4 ? index * 100 : 0; // Stagger only initial set (0-3)

      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.spring(slideAnim, {
            toValue: 0,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [isVisible, index]);

  const isMyth = item.front.toLowerCase().startsWith("myth:");
  const displayTitle = isMyth ? item.front.substring(5).trim() : item.front;

  const handlePress = () => {
    // Bounce animation sequence like info survey cards
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Trigger the card expansion after bounce starts
    setTimeout(() => {
      onPress();
    }, 50);
  };

  if (!item.canFlip) {
    // Last card - static, no flip - show full text
    return (
      <Animated.View
        style={[
          styles.stackedCardShadow,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
          },
        ]}
      >
        <View
          style={[
            styles.stackedCard,
            styles.lastCard,
            { backgroundColor: "#F0F0FF", borderColor: "#D0D0E0" },
          ]}
        >
          <Text style={styles.lastCardText}>{item.front}</Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={handlePress}
    >
      <Animated.View
        style={[
          styles.stackedCardShadow,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
          },
        ]}
      >
        <View
          style={[
            styles.stackedCard,
            {
              backgroundColor: color,
              borderColor: color,
            },
          ]}
        >
          {isMyth && <Text style={styles.stackedMythLabel}>MYTH</Text>}
          <Text style={styles.stackedCardText} numberOfLines={2}>
            {displayTitle}
          </Text>

          {/* Index card lines */}
          <View style={styles.cardLinesBottom}>
            <View
              style={[
                styles.cardLine,
                { backgroundColor: "rgba(255,255,255,0.4)" },
              ]}
            />
            <View
              style={[
                styles.cardLine,
                { backgroundColor: "rgba(255,255,255,0.3)" },
              ]}
            />
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

// --- Expanded Card Modal (shows front, then flips to back after 1.5s) ---
function ExpandedCardModal({
  visible,
  item,
  color,
  onClose,
  isSpeaking,
  isLoadingAudio,
  onToggleSpeak,
  selectedVoice,
}: {
  visible: boolean;
  item: CardData | null;
  color: string;
  onClose: () => void;
  isSpeaking: boolean;
  isLoadingAudio: boolean;
  onToggleSpeak: () => void;
  selectedVoice: string;
}) {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const flipAnim = useRef(new Animated.Value(0)).current;
  // Myth stamp animations
  const mythScaleAnim = useRef(new Animated.Value(2.5)).current;
  const mythOpacityAnim = useRef(new Animated.Value(0)).current;
  const factUnderlineAnim = useRef(new Animated.Value(0)).current;

  // State for dropdown
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Timers
  let stampTimer: NodeJS.Timeout;
  let flipTimer: NodeJS.Timeout;

  React.useEffect(() => {
    if (visible) {
      // Reset flip state
      flipAnim.setValue(0);
      mythScaleAnim.setValue(2.5); // Start large
      mythOpacityAnim.setValue(0); // Start invisible
      factUnderlineAnim.setValue(0); // Start underline at 0

      const isMythCard = item?.front.toLowerCase().startsWith("myth:");

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
      flipAnim.setValue(0);
      mythScaleAnim.setValue(2.5);
      mythOpacityAnim.setValue(0);
      factUnderlineAnim.setValue(0);
    }
  }, [visible, item]);

  const handleClose = () => {
    // Stop audio handled by parent via onClose -> closeExpandedCard
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const handleSpeak = () => {
    onToggleSpeak();
  };

  // Helper to render text with bold markers
  const renderTextWithBold = (text: string, baseStyle: any) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return (
      <Text style={baseStyle}>
        {parts.map((part, index) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return (
              <Text key={index} style={{ fontWeight: "800", color: "#1A1A2E" }}>
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

  // Flip animation interpolations
  const frontRotate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });
  const backRotate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["180deg", "360deg"],
  });
  const frontOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0, 0],
  });
  const backOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  // Height interpolation - NOT supported by native driver, removing height anim or using layout anim?
  // The original code used useNativeDriver: false for height animation.
  // I changed logic above to useNativeDriver: true for performance, but height is not supported.
  // I need to check if I can keep height animation.
  // The height was interpolating flipAnim.
  // If I use useNativeDriver: true for flipAnim, I cannot interpolate height on the View style directly if it's not a transform.
  // However, I can just use `useNativeDriver: false` for the flip animation to keep the height animation working.
  // Ideally, distinct animations for transform (native) and layout (js) would be better, but simpler to revert to false for flip.
  
  // Re-evaluating: The user wants "Show animation...".
  // I will revert useNativeDriver for flipAnim to false in my head (and in the code below) to preserve the height animation which is crucial for the card size change.

  const cardHeight = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [FRONT_HEIGHT, BACK_HEIGHT],
  });

  const underlineWidth = factUnderlineAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ["0%", "100%"]
  });

  // Dynamic font size based on text length
  const getFontSize = (text: string) => {
    const len = text.length;
    if (len < 120) return 28;
    if (len < 200) return 26;
    if (len < 300) return 24;
    return 22; // Minimum size 22
  };

  const backTextFontSize = item ? getFontSize(item.back || "") : 20;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose}>
          <Animated.View
            style={[styles.modalBackdrop, { opacity: opacityAnim }]}
          />
        </Pressable>
        
        <Animated.View
          style={[
            styles.expandedCardContainer,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <View>
            {/* Front of card (Myth) */}
            <Animated.View
              style={[
                styles.expandedCardShadow,
                {
                  transform: [{ perspective: 1000 }, { rotateY: frontRotate }],
                  opacity: frontOpacity,
                  height: cardHeight,
                },
              ]}
            >
              <View
                style={[
                  styles.expandedCard,
                  styles.expandedCardFront,
                  {
                    height: "100%",
                    backgroundColor: color,
                    borderColor: color,
                  },
                ]}
              >
              <View style={styles.expandedCardInnerFront}>
                {isMyth && (
                  <>
                    <View style={styles.mythBadgeContainer}>
                      <View
                        style={[
                          styles.mythBadge,
                          { backgroundColor: "rgba(255,255,255,0.3)" },
                        ]}
                      >
                        <Text style={styles.mythBadgeText}>MYTH</Text>
                      </View>
                    </View>
                    {/* Animated Myth Image */}
                    <Animated.Image
                      source={require("../assets/images/myth.png")}
                      style={[
                        styles.mythImage, 
                        {
                          transform: [
                            { rotate: "45deg" },
                            { scale: mythScaleAnim }
                          ],
                          opacity: mythOpacityAnim
                        }
                      ]}
                      resizeMode="contain"
                    />
                  </>
                )}
                
                <View style={styles.expandedFrontContent}>
                  <Text style={[styles.expandedFrontTitle, { color: "#2D2D44" }]}>
                    {displayTitle}
                  </Text>
                </View>
              </View>

              {/* Index card lines */}
              <View style={styles.expandedCardLines}>
                <View
                  style={[
                    styles.cardLine,
                    { backgroundColor: "rgba(255,255,255,0.4)" },
                  ]}
                />
                <View
                  style={[
                    styles.cardLine,
                    { backgroundColor: "rgba(255,255,255,0.3)" },
                  ]}
                />
                <View
                  style={[
                    styles.cardLine,
                    { backgroundColor: "rgba(255,255,255,0.2)" },
                  ]}
                />
              </View>
              </View>
            </Animated.View>

            {/* Back of card (Fact) */}
            <Animated.View
              style={[
                styles.expandedCardShadow,
                styles.expandedCardBackSide,
                {
                  transform: [{ perspective: 1000 }, { rotateY: backRotate }],
                  opacity: backOpacity,
                  height: cardHeight,
                },
              ]}
            >
              <View
                style={[
                  styles.expandedCard,
                  {
                    height: "100%",
                    backgroundColor: "#FFFFFF",
                    borderColor: "#10B981",
                  },
                ]}
              >
              <View style={styles.expandedCardInner}>
                {/* Fact badge & Speaking controls */}
                <View style={styles.factHeader}>
                    {/* FACT Label & Underline */}
                    <View style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                        <Text style={[styles.factBigText, { color: "#10B981" }]}>Fact</Text>
                        <Animated.View 
                            style={{
                                height: 4,
                                backgroundColor: "#10B981",
                                width: underlineWidth,
                                borderRadius: 2,
                                marginTop: 2,
                            }}
                        />
                    </View>
                    
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      {/* Voice Selector Removed - managed in Profile */}

                      <TouchableOpacity 
                          onPress={onToggleSpeak}
                          style={styles.speakerButton}
                          disabled={isLoadingAudio}
                          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                      >
                          {isLoadingAudio ? (
                             <ActivityIndicator size="small" color="#10B981" />
                          ) : (
                             <Ionicons 
                                name={isSpeaking ? "stop-circle-outline" : "volume-high-outline"} 
                                size={28} 
                                color={isSpeaking ? "#FF6B6B" : "#2D2D44"} 
                             />
                          )}
                      </TouchableOpacity>
                    </View>
                </View>

                {/* Back Headline - Fixed at top */}
                {item.backHeadline && (
                  <View style={{ marginBottom: 16 }}>
                    <Text style={styles.backHeadline}>
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
                    { fontSize: backTextFontSize, lineHeight: backTextFontSize * 1.5 }
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
    </Modal>
  );
}



export default function UnderstandingCancerScreen() {
  const { selectedVoice } = useOnboarding();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedCard, setSelectedCard] = useState<CardData | null>(null);
  const [expandedCard, setExpandedCard] = useState<CardData | null>(null);
  const [selectedColor, setSelectedColor] = useState("#FF9AA2");
  const [visibleLimit, setVisibleLimit] = useState(4);

  // Audio state
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);

  // Cleanup sound on unmount/change
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  // Helper for card colors
  const getCardColor = (id: string) => {
    const index = CARDS.findIndex(c => c.id === id);
    return CARD_COLORS[index % CARD_COLORS.length] || "#FFFFFF";
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    // Calculate how many cards should be visible based on scroll position
    const visibleHeight = scrollY + SCREEN_HEIGHT;
    const buffer = 100; // Buffer to start animating before fully in view
    
    // Calculate index based on card position (top = index * overlap)
    const newLimit = Math.floor((visibleHeight - buffer) / CARD_OVERLAP);
    
    if (newLimit > visibleLimit) {
      setVisibleLimit(newLimit);
    }
  };

  const closeExpandedCard = async () => {
    if (sound) {
      try {
        await sound.stopAsync();
        await sound.unloadAsync();
      } catch (e) {
        // Ignore errors if sound is already unloaded
      }
      setSound(null);
    }
    setIsSpeaking(false);
    setExpandedCard(null);
  };

  const handleSpeak = async () => {
    if (isSpeaking) {
      if (sound) {
        await sound.pauseAsync();
      }
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      if (sound) {
        await sound.playAsync();
      } else if (expandedCard?.back) {
        try {
          setIsLoadingAudio(true);
          // Construct full text: "Fact. [Headline]. [Body]"
          let textToSpeak = "Fact. ";
          if (expandedCard.backHeadline) {
            textToSpeak += expandedCard.backHeadline + ". ";
          }
          textToSpeak += expandedCard.back.replace(/\*\*/g, ""); // Clean markdown
          
          const audioUri = await generateSpeech(textToSpeak, selectedVoice);
          
          if (audioUri) {
            const { sound: newSound } = await Audio.Sound.createAsync(
              { uri: audioUri },
              { shouldPlay: true }
            );
            setSound(newSound);
            
            // Reset state when playback finishes
            newSound.setOnPlaybackStatusUpdate((status) => {
                if (status.isLoaded && status.didJustFinish) {
                    setIsSpeaking(false);
                    newSound.setPositionAsync(0);
                }
            });
          }
        } catch (error) {
          console.error("Audio playback error:", error);
          setIsSpeaking(false);
        } finally {
          setIsLoadingAudio(false);
        }
      }
    }
  };

  const handleVoiceChange = async (voiceId: string) => {
      if (selectedVoice === voiceId) return;
      
      // Stop current audio
      if (sound) {
          await sound.stopAsync();
          await sound.unloadAsync();
          setSound(null);
      }
      setIsSpeaking(false);
  };

  const handleCardPress = (card: CardData) => {
    if (!card.canFlip) return;
    setExpandedCard(card);
    // Auto-select color based on ID is handled in render
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: 'Check out "Understanding What Cancer Is and Isn\'t" on SchoolKit — learn the facts and bust common myths about cancer.',
      });
    } catch {}
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={28} color="#2D2D44" />
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity onPress={handleShare} style={{ padding: 4 }} accessibilityLabel="Share">
            <Ionicons name="share-outline" size={28} color="#6B6B85" />
          </TouchableOpacity>
          <DownloadButton resourceId="11" size={28} color="#3B82F6" />
          <BookmarkButton resourceId="11" size={28} color="#3B82F6" />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <Text style={styles.pageTitle}>
          Understanding{"\n"}
          <Text style={{ color: "#3B82F6" }}>What Cancer Is</Text>
          {"\n"}and Isn't
        </Text>
        <Text style={styles.instructionText}>Click each card to learn more.</Text>

        {/* Stacked cards container */}
        <View
          style={[
            styles.stackContainer,
            { height: CARDS.length * CARD_OVERLAP + CARD_HEIGHT },
          ]}
        >
          {CARDS.map((card, index) => (
            <View
              key={card.id}
              style={[
                styles.stackedCardWrapper,
                {
                  top: index * CARD_OVERLAP,
                  zIndex: index + 1,
                },
              ]}
            >
              <StackedCard
                item={card}
                color={CARD_COLORS[index % CARD_COLORS.length]}
                index={index}
                isVisible={index <= visibleLimit}
                onPress={() => handleCardPress(card)}
              />
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Expanded card modal */}
      <ExpandedCardModal
        visible={expandedCard !== null}
        item={expandedCard}
        color={expandedCard ? getCardColor(expandedCard.id) : "#FFFFFF"}
        onClose={closeExpandedCard}
        isSpeaking={isSpeaking}
        isLoadingAudio={isLoadingAudio}
        onToggleSpeak={handleSpeak}
        selectedVoice={selectedVoice}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFD",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    zIndex: 1000,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    display: "none", // Hide original title
  },
  pageTitle: {
    fontSize: 34,
    fontWeight: "800",
    color: "#2D2D44",
    textAlign: "left",
    marginBottom: 8,
    marginTop: 10,
    lineHeight: 42,
    letterSpacing: -1,
  },
  instructionText: {
    fontSize: 15,
    color: "#8E8EA8",
    fontWeight: "300",
    marginBottom: 32,
    marginTop: 0,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 60,
  },

  // Stack container
  stackContainer: {
    position: "relative",
    width: "100%",
  },
  stackedCardWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
  },

  // Stacked card (in the stack)
  stackedCardShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  stackedCard: {
    height: CARD_HEIGHT,
    borderRadius: 20,
    borderWidth: 3,
    padding: 20,
    paddingTop: 24,
    overflow: "hidden", // OK here now
    justifyContent: "center",
    alignItems: "center",
  },
  lastCard: {
    height: "auto" as any,
    minHeight: 220,
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  lastCardText: {
    fontSize: 20,
    fontWeight: "500",
    color: "#555",
    lineHeight: 28,
    textAlign: "center",
  },
  stackedMythLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#000000",
    letterSpacing: 3,
    opacity: 0.5,
    marginBottom: 8,
    textAlign: "center",
    textTransform: "uppercase",
  },
  stackedCardText: {
    fontSize: 24,
    fontWeight: "600",
    color: "#2D2D44",
    lineHeight: 32,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  stackedTapHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    position: "absolute",
    bottom: 16,
  },
  stackedTapText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#000000",
    opacity: 0.35,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cardLinesBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 4,
  },
  cardLine: {
    height: 2,
    borderRadius: 1,
    marginTop: 4,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  expandedCardContainer: {
    width: SCREEN_WIDTH - 48,
    maxHeight: SCREEN_HEIGHT * 0.7,
  },

  // Expanded card
  // Expanded card
  expandedCardShadow: {
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  expandedCard: {
    width: "100%",
    // Height is now animated via inline style
    borderRadius: 40,
    borderWidth: 4,
    overflow: "hidden",
    backfaceVisibility: "hidden",
  },
  expandedCardFront: {
    // Front card styling
  },
  expandedCardBackSide: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  expandedCardInnerFront: {
    flex: 1,
    padding: 28,
    alignItems: "center",
  },
  mythBadgeContainer: {
    position: "absolute",
    top: 28,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
  },
  expandedFrontContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  expandedFrontTitle: {
    fontSize: 32,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 40,
    letterSpacing: -0.5,
    color: "#2D2D44",
  },
  expandedCardBack: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    fontSize: 17,
    fontWeight: "300",
    color: "#444455",
    lineHeight: 26,
  },
  expandedCardInner: {
    padding: 28,
    flex: 1, // Added flex: 1 to fill parent height
    overflow: 'hidden',
  },
  expandedMythLabel: {
    fontSize: 16,
    fontWeight: "900",
    color: "#000000",
    letterSpacing: 3,
    opacity: 0.35,
    marginBottom: 12,
  },
  expandedCardTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2D2D44",
    textAlign: "center",
    lineHeight: 32,
    marginBottom: 20,
  },
  expandedTapHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 16,
  },
  expandedTapText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000000",
    opacity: 0.3,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  expandedCardLines: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 6,
  },
  factHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
    position: 'relative',
  },
  factBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  speakerButton: {
    padding: 8,
  },
  factBadgeText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 2,
  },
  factBigText: {
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  mythBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
  },
  mythBadgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 3,
    textTransform: "uppercase",
  },
  expandedMythTitle: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 30,
    marginBottom: 20,
  },
  mythImage: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -120, // Half of height
    marginLeft: -120, // Half of width
    width: 240,
    height: 240,
    zIndex: 20,
    // transform is handled inline
  },
  divider: {
    width: "80%",
    height: 2,
    borderRadius: 1,
    marginBottom: 20,
  },
  backHeadline: {
    fontSize: 28,
    fontWeight: "800",
    color: "#2D2D44",
    textAlign: "left",
    marginBottom: 12,
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  backDivider: {
    height: 2,
    width: "40%",
    borderRadius: 1,
    marginBottom: 20,
  },
  expandedAnswerText: {
    fontSize: 20,
    fontWeight: "500",
    color: "#2D2D44", // Darker for better contrast
    textAlign: "left", // Left align for readability
    lineHeight: 32, // Increased line height
  },
  backContentScroll: {
    flex: 1, // Let scrollview fill space
  },
});
