import React, { useState, useRef } from "react";
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
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import { BookmarkButton } from '../components/BookmarkButton';
import { DownloadButton } from '../components/DownloadButton';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// --- Types ---
type CardData = {
  id: string;
  front: string;
  back?: string;
  canFlip: boolean;
};

// --- Data ---
const CARDS: CardData[] = [
  {
    id: "1",
    front: "What is this page about?",
    back: "Different people have different ideas about what cancer is, how it affects kids, and what it means when a child is told they have cancer. Sometimes people believe things about cancer that **aren't true**. These misunderstandings aren't meant to hurt anyone, but they can sometimes make things harder for kids who have had cancer. Take a look at this list of **common myths about cancer** to learn the facts and understand what a cancer diagnosis really means for you or a student you care about!",
    canFlip: true,
  },
  {
    id: "2",
    front: "Myth: Cancer Can Spread Between People",
    back: "**Cancer is not contagious!** You can't catch cancer from someone else. Kids who are getting treatment for cancer have **weaker immune systems**, which means it's easier for them to get sick from germs. That's why they might wear masks or stay away from crowds - to **protect themselves**, not because they could make others sick. Kids with cancer are not a danger to anyone's health.",
    canFlip: true,
  },
  {
    id: "3",
    front: "Myth: Childhood Cancer is the Same as Adult Cancer",
    back: "**Childhood cancers are different** from cancers that happen in adults. They can have different causes, types, and treatments. Kids don't usually get cancer because of things like diet, exercise, or the environment. Doctors use **special treatments** that are made to work safely for children's growing bodies.",
    canFlip: true,
  },
  {
    id: "4",
    front: "Myth: Cancer Always Happens Because of Something Someone Did",
    back: "Most of the time, cancer happens by **random chance**, not because of something one did. Only a small number of childhood cancers are passed down in families.",
    canFlip: true,
  },
  {
    id: "5",
    front: "Myth: Cancer looks the same for everyone",
    back: "**Not all cancers are the same.** The changes to one's body such as hair loss, weakness, pain, can be very different. Each person has a **different journey** with cancer.",
    canFlip: true,
  },
  {
    id: "6",
    front: "Myth: All Children With Cancer Get Chemotherapy",
    back: "Chemotherapy is a common treatment for cancer, but treatment plans **depend on the type of cancer**. Treatment options include surgery, radiation, and newer non-chemotherapy options that offer more **targeted therapy**.",
    canFlip: true,
  },
  {
    id: "7",
    front: "Myth: The Cancer Experience is Over After Treatment Ends",
    back: "No, this is a **common misconception**! Survivors may face various late effects from treatment or relapse, and are at higher risk for secondary health issues. Thus, **long-term follow-up care** is recommended to reduce health risks.",
    canFlip: true,
  },
  {
    id: "8",
    front: "Myth: Cancer is a Death Sentence for Kids",
    back: "The average 5-year survival rate for childhood cancer is **86%** - a huge improvement compared to what it once was. With the support of family and their school team, **many children can lead relatively normal lives** after treatment.",
    canFlip: true,
  },
  {
    id: "9",
    front:
      "These myths don't cover everything people get wrong about childhood cancer, but we hope they help you think more carefully about what you hear or believe. **Learning the facts can help you feel more comfortable** and better understand what childhood cancer really is.",
    canFlip: false,
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
  onPress,
}: {
  item: CardData;
  color: string;
  onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
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
      <View
        style={[
          styles.stackedCard,
          styles.lastCard,
          { backgroundColor: "#F0F0FF", borderColor: "#D0D0E0" },
        ]}
      >
        <Text style={styles.lastCardText}>{item.front}</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={handlePress}
      style={{ flex: 1 }}
    >
      <Animated.View
        style={[
          styles.stackedCard,
          {
            backgroundColor: color,
            borderColor: color,
            transform: [{ scale: scaleAnim }],
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
}: {
  visible: boolean;
  item: CardData | null;
  color: string;
  onClose: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const flipAnim = useRef(new Animated.Value(0)).current;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<Speech.Voice | null>(null);

  React.useEffect(() => {
    // Find a better voice on mount
    const loadVoices = async () => {
      try {
        const availableVoices = await Speech.getAvailableVoicesAsync();
        if (availableVoices.length > 0) {
          // Priority list for "friendly/gentle" female voices
          // "Ava" is often a premium quality voice on iOS
          // "Samantha" is the classic friendly Siri voice
          // "Victoria" and "Susan" are also good options
          const preferredNames = [
            "Ava", 
            "Samantha", 
            "Victoria", 
            "Susan", 
            "Karen", 
            "Google US English Female", 
            "en-us-x-sfg#female_1-local" // Android example
          ];
          
          let voice = availableVoices.find(v => 
            preferredNames.includes(v.name) && v.language.startsWith("en")
          );

          // If no specific name found, try to find an "enhanced" quality voice
          // And try to guess female if possible (though API doesn't always say gender)
          if (!voice) {
            voice = availableVoices.find(v => 
              v.quality === "Enhanced" && v.language.startsWith("en") && !v.name.includes("Fred") && !v.name.includes("Daniel")
            );
          }

          // Fallback to any English voice logic...
          if (!voice) {
             // Try to filter out known male voices if possible by name to find a female default? 
             // Hard to guarantee without checking all names, but default is usually female.
            voice = availableVoices.find(v => v.language.startsWith("en"));
          }

          if (voice) {
            setSelectedVoice(voice);
          }
        }
      } catch (e) {
        console.log("Error loading voices:", e);
      }
    };
    
    loadVoices();
    
    return () => {
        Speech.stop();
    }
  }, []);

  React.useEffect(() => {
    if (visible) {
      // Reset flip state
      flipAnim.setValue(0);

      // Animate card appearance
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: false, // Changed for height animation
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();

      // Auto-flip after 1.5 seconds
      const flipTimer = setTimeout(() => {
        Animated.spring(flipAnim, {
          toValue: 1,
          friction: 8,
          tension: 10,
          useNativeDriver: false, // Changed for height animation
        }).start();
      }, 800);

      return () => clearTimeout(flipTimer);
    } else {
      scaleAnim.setValue(0.8);
      opacityAnim.setValue(0);
      flipAnim.setValue(0);
    }
  }, [visible]);

  const handleClose = () => {
    Speech.stop();
    setIsSpeaking(false);
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 150,
        useNativeDriver: false,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: false,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const handleSpeak = () => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
    } else if (item?.back) {
      setIsSpeaking(true);
      // Strip markdown for speech
      const textToSpeak = item.back.replace(/\*\*/g, "");
      
      const options: Speech.SpeechOptions = {
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
        rate: 0.95, // Slower for a calmer, gentler pace
        pitch: 0.95, // Slightly lower pitch can sound warmer
      };

      if (selectedVoice) {
        options.voice = selectedVoice.identifier;
      }

      Speech.speak(textToSpeak, options);
    }
  };

  // Helper to render text with bold markers
  const renderTextWithBold = (text: string, baseStyle: any) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return (
      <Text style={baseStyle}>
        {parts.map((part, index) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return (
              <Text key={index} style={{ fontWeight: "800", color: "#2D2D44" }}>
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

  // Height interpolation
  const cardHeight = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [FRONT_HEIGHT, BACK_HEIGHT],
  });

  // Dynamic font size based on text length
  const getFontSize = (text: string) => {
    const len = text.length;
    if (len < 120) return 28;
    if (len < 200) return 26;
    if (len < 300) return 24;
    if (len < 400) return 22;
    return 20;
  };

  const backTextFontSize = item ? getFontSize(item.back || "") : 20;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.modalOverlay} onPress={handleClose}>
        <Animated.View
          style={[styles.modalBackdrop, { opacity: opacityAnim }]}
        />
        <Animated.View
          style={[
            styles.expandedCardContainer,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <Pressable onPress={handleClose}>
            {/* Front of card (Myth) */}
            <Animated.View
              style={[
                styles.expandedCard,
                styles.expandedCardFront,
                {
                  height: cardHeight,
                  backgroundColor: color,
                  borderColor: color,
                  transform: [{ perspective: 1000 }, { rotateY: frontRotate }],
                  opacity: frontOpacity,
                },
              ]}
            >
              <View style={styles.expandedCardInnerFront}>
                {isMyth && (
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
            </Animated.View>

            {/* Back of card (Fact) */}
            <Animated.View
              style={[
                styles.expandedCard,
                styles.expandedCardBackSide,
                {
                  height: cardHeight,
                  backgroundColor: "#FFFFFF",
                  borderColor: color,
                  transform: [{ perspective: 1000 }, { rotateY: backRotate }],
                  opacity: backOpacity,
                },
              ]}
            >
              <View style={styles.expandedCardInner}>
                {/* Fact badge & Speaking controls */}
                <View style={styles.factHeader}>
                    <View style={[styles.factBadge, { backgroundColor: color }]}>
                    <Text style={styles.factBadgeText}>FACT</Text>
                    </View>
                    <TouchableOpacity 
                        onPress={handleSpeak}
                        style={styles.speakerButton}
                        hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                    >
                        <Ionicons 
                            name={isSpeaking ? "stop-circle-outline" : "volume-high-outline"} 
                            size={28} 
                            color={isSpeaking ? "#FF6B6B" : "#2D2D44"} 
                        />
                    </TouchableOpacity>
                </View>

                {/* Answer content */}
                <ScrollView
                  style={styles.backContentScroll}
                  showsVerticalScrollIndicator={true}
                  contentContainerStyle={{ 
                    flexGrow: 1, 
                    justifyContent: 'center',
                    paddingBottom: 20 
                  }}
                >
                  {item.back && renderTextWithBold(item.back, [
                    styles.expandedAnswerText,
                    { fontSize: backTextFontSize, lineHeight: backTextFontSize * 1.4 }
                  ])}
                </ScrollView>
              </View>

              {/* Index card lines */}
              <View style={styles.expandedCardLines}>
                <View
                  style={[styles.cardLine, { backgroundColor: color + "40" }]}
                />
                <View
                  style={[styles.cardLine, { backgroundColor: color + "30" }]}
                />
                <View
                  style={[styles.cardLine, { backgroundColor: color + "20" }]}
                />
              </View>
            </Animated.View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}



export default function UnderstandingCancerScreen() {
  const router = useRouter();
  const [selectedCard, setSelectedCard] = useState<CardData | null>(null);
  const [selectedColor, setSelectedColor] = useState("#FF9AA2");

  const handleCardPress = (card: CardData, index: number) => {
    if (!card.canFlip) return;
    setSelectedCard(card);
    setSelectedColor(CARD_COLORS[index % CARD_COLORS.length]);
  };

  const handleCloseCard = () => {
    setSelectedCard(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={28} color="#2D2D44" />
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <DownloadButton resourceId="11" size={28} color="#3B82F6" />
          <BookmarkButton resourceId="11" size={28} color="#3B82F6" />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
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
                onPress={() => handleCardPress(card, index)}
              />
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Expanded card modal */}
      <ExpandedCardModal
        visible={selectedCard !== null}
        item={selectedCard}
        color={selectedColor}
        onClose={handleCloseCard}
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
  stackedCard: {
    height: CARD_HEIGHT,
    borderRadius: 20,
    borderWidth: 3,
    padding: 20,
    paddingTop: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
    overflow: "hidden",
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
  expandedCard: {
    width: "100%",
    // Height is now animated via inline style
    borderRadius: 40,
    borderWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
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
    alignItems: "center",
    flex: 1, // Added flex: 1 to fill parent height
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
    justifyContent: 'center',
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
    position: 'absolute',
    right: 0,
  },
  factBadgeText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 2,
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
  divider: {
    width: "80%",
    height: 2,
    borderRadius: 1,
    marginBottom: 20,
  },
  expandedAnswerText: {
    fontSize: 20,
    fontWeight: "500",
    color: "#444455",
    textAlign: "center",
    lineHeight: 28,
  },
  backContentScroll: {
    flex: 1, // Let scrollview fill space
  },
});
