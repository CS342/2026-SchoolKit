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
    ActivityIndicator,
    FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { generateSpeech } from "../services/elevenLabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useOnboarding } from "../contexts/OnboardingContext";
import { BookmarkButton } from "../components/BookmarkButton";
import { RecommendationList } from "../components/RecommendationList";
import { DownloadButton } from "../components/DownloadButton";
import { COLORS } from "../constants/onboarding-theme";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// ─── Types ───────────────────────────────────────────────────────────────────
type StoryData = {
    id: string;
    emoji: string;
    front: string;
    text: string;
    color: string;
    fontSize?: number;
};

type TipCard = {
    id: string;
    front: string;
    back: string;
    icon: string;
    color: string;
};

// ─── Stories data ─────────────────────────────────────────────────────────────
const STORIES: StoryData[] = [
    {
        id: "s1",
        emoji: "😊",
        front: "Taking the First Step",
        color: "#7EC8E3",
        text: "When I got to high school I realized that people will always be the way that they are, and because I am blind, I will always need to overcome barriers. So I decided to take it on myself. I go out of my way to start conversations, and it's tough. But sometimes you just have to take chances and smile and say hi.",
    },
    {
        id: "s2",
        emoji: "💪",
        front: "Finding New Friends After Treatment",
        color: "#C5A3D6",
        text: "After my diagnosis of leukemia (ALL), I was tutored at home for my entire eighth grade year. One of the most difficult things was that all the people I hung out with were too afraid to talk with me when I came back. They would walk past me in the hall and not even acknowledge me. Only one friend ever visited me in the hospital. When I went back in ninth grade, the teachers were incredibly supportive, but dealing with friends was very difficult. I just started hanging out with a new group of friends. By high school, I made lots of new friends.",
        fontSize: 11,
    },
    {
        id: "s3",
        emoji: "🚴",
        front: "Connecting Through Sports",
        color: "#95D1BB",
        text: "I had bilateral retinoblastoma when I was 2\u00BD. They had to remove both eyes, so I'm totally blind. I am an athlete and have been involved in several sports. Right now I'm into mountain biking with a tandem bike. It's really a liberating experience and a wonderful icebreaker. It's a great way to get out in the community and meet people with similar interests. Whether you have a disability or not, athletics is rewarding to anyone who is involved.",
        fontSize: 13,
    },
];

// ─── Tip cards data ───────────────────────────────────────────────────────────
const TIP_CARDS: TipCard[] = [
    {
        id: "t1",
        front: "Start Small",
        icon: "leaf-outline",
        color: "#7EC8E3",
        back: "Look for one or two people you feel safe with\u2014a close friend, sibling, or trusted classmate.\n\nYou don't need to tell your whole story at once\u2014share at your own pace.",
    },
    {
        id: "t2",
        front: "Find Allies",
        icon: "shield-checkmark-outline",
        color: "#F4A97B",
        back: "School counselor, nurse, or a favorite teacher can be strong supporters.\n\nThey can also help explain your needs to classmates if you want.",
    },
    {
        id: "t3",
        front: "Join Groups \u0026 Activities",
        icon: "people-circle-outline",
        color: "#95D1BB",
        back: "Clubs, sports, or arts groups are great ways to meet people with shared interests.\n\nEven small involvement\u2014like attending a meeting or practice\u2014can build connections.",
    },
    {
        id: "t4",
        front: "Be Honest About Your Needs",
        icon: "chatbubbles-outline",
        color: "#C5A3D6",
        back: "Let friends know if you get tired, need breaks, or just want to hang out without talking about cancer.\n\nTrue friends will respect where you're at.",
    },
    {
        id: "t5",
        front: "Seek Out Other Survivors",
        icon: "heart-circle-outline",
        color: "#F7C59F",
        back: "Some schools have peer support groups or access to survivor networks. Talking to others who \"get it\" can feel comforting and empowering.\n\nPrograms like SAYAC (Stanford Adolescent \u0026 Young Adult Cancer) meetings bring young survivors together\u2014connecting with people who truly understand your experience can be life-changing.",
    },
];

const CARD_HEIGHT_FRONT = 280;
const CARD_HEIGHT_BACK = 460;
const STORY_CARD_WIDTH = SCREEN_WIDTH * 0.78;
const STORY_CARD_MARGIN = 10;

// ─── Story Flippable Card ─────────────────────────────────────────────────────
function StoryFlipCard({ story }: { story: StoryData }) {
    const [flipped, setFlipped] = useState(false);
    const flipAnim = useRef(new Animated.Value(0)).current;

    const handleFlip = () => {
        Animated.spring(flipAnim, {
            toValue: flipped ? 0 : 1,
            friction: 8,
            tension: 10,
            useNativeDriver: false,
        }).start();
        setFlipped(!flipped);
    };

    const frontRotate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] });
    const backRotate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ["180deg", "360deg"] });
    const frontOpacity = flipAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0, 0] });
    const backOpacity = flipAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0, 1] });

    return (
        <TouchableOpacity activeOpacity={0.95} onPress={handleFlip} style={{ width: STORY_CARD_WIDTH, marginHorizontal: STORY_CARD_MARGIN }}>
            <View style={{ height: 260 }}>
                {/* Front */}
                <Animated.View
                    style={[
                        storyStyles.card,
                        { backgroundColor: story.color, borderColor: story.color + "60" },
                        { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
                        { transform: [{ perspective: 1000 }, { rotateY: frontRotate }], opacity: frontOpacity },
                    ]}
                >
                    <Text style={storyStyles.emoji}>{story.emoji}</Text>
                    <Text style={storyStyles.frontTitle}>{story.front}</Text>
                    <Text style={storyStyles.tapHint}>Tap to read story</Text>
                </Animated.View>
                {/* Back */}
                <Animated.View
                    style={[
                        storyStyles.card,
                        { backgroundColor: story.color + "12", borderColor: story.color + "60" },
                        { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
                        { transform: [{ perspective: 1000 }, { rotateY: backRotate }], opacity: backOpacity, backfaceVisibility: "hidden" },
                    ]}
                >
                    <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled>
                        <Text style={[storyStyles.text, story.fontSize ? { fontSize: story.fontSize, lineHeight: story.fontSize * 1.5 } : undefined]}>{"\u201C"}{story.text}{"\u201D"}</Text>
                    </ScrollView>
                </Animated.View>
            </View>
        </TouchableOpacity>
    );
}

const storyStyles = StyleSheet.create({
    card: {
        width: STORY_CARD_WIDTH,
        borderRadius: 24,
        borderWidth: 2,
        padding: 20,
        height: 260,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
        justifyContent: "center",
        alignItems: "center",
        backfaceVisibility: "hidden",
    },
    emoji: {
        fontSize: 40,
        marginBottom: 12,
    },
    frontTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#FFFFFF",
        textAlign: "center",
        lineHeight: 24,
    },
    tapHint: {
        fontSize: 12,
        color: "rgba(255,255,255,0.6)",
        fontWeight: "500",
        marginTop: 10,
    },
    text: {
        fontSize: 14,
        fontWeight: "400",
        color: "#2D2D44",
        lineHeight: 22,
        fontStyle: "italic",
    },
});

// ─── Map Path Bubbles ───────────────────────────────────────────────────────
const BUBBLE_SIZE = 200;

function MapBubble({
    card,
    index,
    onPress,
}: {
    card: TipCard;
    index: number;
    onPress: () => void;
}) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.sequence([
            Animated.delay(300 + index * 140),
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
        <Animated.View
            style={[
                mapStyles.bubbleWrapper,
                isLeft ? mapStyles.bubbleLeft : mapStyles.bubbleRight,
                { opacity: fadeAnim, transform: [{ scale: scaleAnim }, { translateY: slideAnim }] },
            ]}
        >
            <TouchableOpacity activeOpacity={0.85} onPress={handlePress}>
                <View style={[mapStyles.bubble, { backgroundColor: card.color + "18", borderColor: card.color + "50" }]}>
                    <Text style={[mapStyles.bubbleText, { color: card.color }]} numberOfLines={3}>
                        {card.front}
                    </Text>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
}

function MapConnector({ fromIndex }: { fromIndex: number }) {
    const color = TIP_CARDS[fromIndex].color;
    const isFromLeft = fromIndex % 2 === 0;
    return (
        <View style={[mapStyles.connectorWrapper, isFromLeft ? mapStyles.connectorLeft : mapStyles.connectorRight]}>
            <View style={[mapStyles.dashedLine, { borderColor: color + "35" }]} />
        </View>
    );
}

const mapStyles = StyleSheet.create({
    pathContainer: { paddingBottom: 10 },
    bubbleWrapper: { width: BUBBLE_SIZE },
    bubbleLeft: { alignSelf: "flex-start", marginLeft: 140 },
    bubbleRight: { alignSelf: "flex-end", marginRight: 140 },
    bubble: {
        width: BUBBLE_SIZE,
        height: BUBBLE_SIZE,
        borderRadius: BUBBLE_SIZE / 2,
        borderWidth: 2.5,
        alignItems: "center",
        justifyContent: "center",
        padding: 14,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
    },
    bubbleText: {
        fontSize: 14,
        fontWeight: "700",
        textAlign: "center",
        lineHeight: 16,
        letterSpacing: -0.2,
    },
    connectorWrapper: {
        height: 20,
        justifyContent: "center",
    },
    connectorLeft: {
        alignItems: "flex-end",
        marginRight: 30 + BUBBLE_SIZE / 2,
    },
    connectorRight: {
        alignItems: "flex-start",
        marginLeft: 30 + BUBBLE_SIZE / 2,
    }
});

// ─── Expanded Card Modal ──────────────────────────────────────────────────────
function ExpandedCardModal({
    visible,
    card,
    onClose,
    isSpeaking,
    isLoadingAudio,
    onToggleSpeak,
}: {
    visible: boolean;
    card: TipCard | null;
    onClose: () => void;
    isSpeaking: boolean;
    isLoadingAudio: boolean;
    onToggleSpeak: () => void;
}) {
    const scaleAnim = useRef(new Animated.Value(0.85)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const flipAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            flipAnim.setValue(0);
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 8,
                    tension: 40,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();

            const timer = setTimeout(() => {
                Animated.spring(flipAnim, {
                    toValue: 1,
                    friction: 8,
                    tension: 10,
                    useNativeDriver: false,
                }).start();
            }, 1000);
            return () => clearTimeout(timer);
        } else {
            scaleAnim.setValue(0.85);
            opacityAnim.setValue(0);
            flipAnim.setValue(0);
        }
    }, [visible, card]);

    const handleClose = () => {
        Animated.parallel([
            Animated.timing(scaleAnim, {
                toValue: 0.85,
                duration: 150,
                useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
            }),
        ]).start(() => onClose());
    };

    if (!card) return null;

    const color = card.color;
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
    const cardHeight = flipAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [CARD_HEIGHT_FRONT, CARD_HEIGHT_BACK],
    });

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={handleClose}
        >
            <View style={modalStyles.overlay}>
                <Pressable style={StyleSheet.absoluteFill} onPress={handleClose}>
                    <Animated.View
                        style={[modalStyles.backdrop, { opacity: opacityAnim }]}
                    />
                </Pressable>

                <Animated.View
                    style={[
                        modalStyles.container,
                        { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
                    ]}
                >
                    {/* Front */}
                    <Animated.View
                        style={[
                            modalStyles.cardShadow,
                            {
                                transform: [{ perspective: 1000 }, { rotateY: frontRotate }],
                                opacity: frontOpacity,
                                height: cardHeight,
                            },
                        ]}
                    >
                        <View
                            style={[
                                modalStyles.card,
                                { height: "100%", backgroundColor: color, borderColor: color },
                            ]}
                        >
                            <View style={modalStyles.frontInner}>
                                <Ionicons
                                    name={card.icon as any}
                                    size={56}
                                    color="rgba(255,255,255,0.9)"
                                    style={{ marginBottom: 16 }}
                                />
                                <Text style={modalStyles.frontTitle}>{card.front}</Text>
                            </View>
                        </View>
                    </Animated.View>

                    {/* Back */}
                    <Animated.View
                        style={[
                            modalStyles.cardShadow,
                            modalStyles.backSide,
                            {
                                transform: [{ perspective: 1000 }, { rotateY: backRotate }],
                                opacity: backOpacity,
                                height: cardHeight,
                            },
                        ]}
                    >
                        <View
                            style={[
                                modalStyles.card,
                                {
                                    height: "100%",
                                    backgroundColor: "#FFFFFF",
                                    borderColor: color,
                                },
                            ]}
                        >
                            <View style={modalStyles.backInner}>
                                {/* Header */}
                                <View style={modalStyles.backHeader}>
                                    <View style={[modalStyles.backIconCircle, { backgroundColor: color + "20" }]}>
                                        <Ionicons name={card.icon as any} size={22} color={color} />
                                    </View>
                                    <Text style={[modalStyles.backTitle, { color }]}>
                                        {card.front}
                                    </Text>
                                    <TouchableOpacity
                                        onPress={onToggleSpeak}
                                        style={modalStyles.speakerBtn}
                                        disabled={isLoadingAudio}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        {isLoadingAudio ? (
                                            <ActivityIndicator size="small" color={color} />
                                        ) : (
                                            <Ionicons
                                                name={
                                                    isSpeaking
                                                        ? "stop-circle-outline"
                                                        : "volume-high-outline"
                                                }
                                                size={26}
                                                color={isSpeaking ? "#FF6B6B" : "#2D2D44"}
                                            />
                                        )}
                                    </TouchableOpacity>
                                </View>

                                <View style={[modalStyles.divider, { backgroundColor: color + "30" }]} />

                                {/* Body */}
                                <ScrollView
                                    style={modalStyles.backScroll}
                                    showsVerticalScrollIndicator={false}
                                    contentContainerStyle={{ paddingBottom: 30 }}
                                >
                                    {card.back.split("\n\n").map((para, idx) => (
                                        <View key={idx} style={modalStyles.tipRow}>
                                            <Ionicons
                                                name="chevron-forward-circle"
                                                size={18}
                                                color={color}
                                                style={{ marginTop: 2, marginRight: 10, flexShrink: 0 }}
                                            />
                                            <Text style={modalStyles.backText}>{para}</Text>
                                        </View>
                                    ))}
                                </ScrollView>
                            </View>
                        </View>
                    </Animated.View>
                </Animated.View>
            </View>
        </Modal>
    );
}

const modalStyles = StyleSheet.create({
    overlay: { flex: 1, justifyContent: "center", alignItems: "center" },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.5)",
    },
    container: { width: SCREEN_WIDTH - 48, maxHeight: SCREEN_HEIGHT * 0.72 },
    cardShadow: {
        width: "100%",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 15,
    },
    card: {
        width: "100%",
        borderRadius: 32,
        borderWidth: 4,
        overflow: "hidden",
        backfaceVisibility: "hidden",
    },
    backSide: { position: "absolute", top: 0, left: 0, right: 0 },
    frontInner: {
        flex: 1,
        padding: 32,
        alignItems: "center",
        justifyContent: "center",
    },
    frontTitle: {
        fontSize: 26,
        fontWeight: "700",
        color: "#FFFFFF",
        textAlign: "center",
        lineHeight: 34,
        letterSpacing: -0.5,
    },
    backInner: { padding: 24, flex: 1, overflow: "hidden" },
    backHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginBottom: 12,
    },
    backIconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
    },
    backTitle: {
        fontSize: 18,
        fontWeight: "800",
        flex: 1,
        letterSpacing: -0.3,
    },
    speakerBtn: { padding: 6 },
    divider: { height: 2, borderRadius: 1, marginBottom: 16 },
    backScroll: { flex: 1 },
    tipRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 14,
    },
    backText: {
        fontSize: 16,
        fontWeight: "400",
        color: "#2D2D44",
        lineHeight: 24,
        flex: 1,
    },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function FindingSupportScreen() {
    const { selectedVoice } = useOnboarding();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [expandedCard, setExpandedCard] = useState<TipCard | null>(null);
    const [activeHandout, setActiveHandout] = useState(null);

    // Page TTS
    const [pageSound, setPageSound] = useState<Audio.Sound | null>(null);
    const [isPageSpeaking, setIsPageSpeaking] = useState(false);
    const [isPageLoadingAudio, setIsPageLoadingAudio] = useState(false);

    // Card TTS
    const [cardSound, setCardSound] = useState<Audio.Sound | null>(null);
    const [isCardSpeaking, setIsCardSpeaking] = useState(false);
    const [isCardLoadingAudio, setIsCardLoadingAudio] = useState(false);

    // Entrance anims
    const titleFade = useRef(new Animated.Value(0)).current;
    const titleSlide = useRef(new Animated.Value(20)).current;
    const quoteFade = useRef(new Animated.Value(0)).current;
    const quoteSlide = useRef(new Animated.Value(20)).current;
    const storiesFade = useRef(new Animated.Value(0)).current;
    const storiesSlide = useRef(new Animated.Value(20)).current;
    const sectionFade = useRef(new Animated.Value(0)).current;
    const sectionSlide = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        const anims = [
            { fade: titleFade, slide: titleSlide, delay: 0 },
            { fade: quoteFade, slide: quoteSlide, delay: 150 },
            { fade: storiesFade, slide: storiesSlide, delay: 300 },
            { fade: sectionFade, slide: sectionSlide, delay: 450 },
        ];
        anims.forEach(({ fade, slide, delay }) => {
            Animated.sequence([
                Animated.delay(delay),
                Animated.parallel([
                    Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }),
                    Animated.spring(slide, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }),
                ]),
            ]).start();
        });
    }, []);

    // Cleanup
    useEffect(() => {
        return () => {
            if (pageSound) pageSound.unloadAsync();
            if (cardSound) cardSound.unloadAsync();
        };
    }, [pageSound, cardSound]);

    // Page TTS
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
            const text = `How to Find People Who Understand Your Journey. A friend is someone who knows all about you and still loves you. Elbert Hubbard. Whether you're returning to school after treatment or navigating life with a chronic condition, finding people who truly understand what you're going through can make all the difference.`;
            const audioUri = await generateSpeech(text, selectedVoice);
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
        } catch (e) {
            console.error("Audio error:", e);
            setIsPageSpeaking(false);
        } finally {
            setIsPageLoadingAudio(false);
        }
    };

    // Card TTS
    const handleCardSpeak = async () => {
        if (isCardSpeaking) {
            if (cardSound) await cardSound.pauseAsync();
            setIsCardSpeaking(false);
            return;
        }
        setIsCardSpeaking(true);
        if (cardSound) {
            await cardSound.playAsync();
            return;
        }
        if (!expandedCard) return;
        try {
            setIsCardLoadingAudio(true);
            const text = `${expandedCard.front}. ${expandedCard.back}`;
            const audioUri = await generateSpeech(text, selectedVoice);
            if (audioUri) {
                const { sound: newSound } = await Audio.Sound.createAsync(
                    { uri: audioUri },
                    { shouldPlay: true }
                );
                setCardSound(newSound);
                newSound.setOnPlaybackStatusUpdate((status) => {
                    if (status.isLoaded && status.didJustFinish) {
                        setIsCardSpeaking(false);
                        newSound.setPositionAsync(0);
                    }
                });
            } else {
                setIsCardSpeaking(false);
            }
        } catch (e) {
            console.error("Audio error:", e);
            setIsCardSpeaking(false);
        } finally {
            setIsCardLoadingAudio(false);
        }
    };

    const closeExpandedCard = async () => {
        if (cardSound) {
            try {
                await cardSound.stopAsync();
                await cardSound.unloadAsync();
            } catch (_) { }
            setCardSound(null);
        }
        setIsCardSpeaking(false);
        setExpandedCard(null);
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message:
                    'Check out "How to Find People Who Understand Your Journey" on SchoolKit \u2014 real stories and tips for building supportive friendships.',
            });
        } catch { }
    };

    const storyScrollRef = useRef<FlatList>(null);
    const [activeStoryIndex, setActiveStoryIndex] = useState(0);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backButton}
                    accessibilityLabel="Go back"
                >
                    <Ionicons name="arrow-back" size={28} color="#2D2D44" />
                </TouchableOpacity>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <TouchableOpacity
                        onPress={handlePageSpeak}
                        style={{ padding: 4 }}
                        accessibilityLabel={isPageSpeaking ? "Pause reading" : "Read aloud"}
                    >
                        {isPageLoadingAudio ? (
                            <ActivityIndicator size="small" color={COLORS.studentK8} />
                        ) : (
                            <Ionicons
                                name={isPageSpeaking ? "pause-circle" : "volume-high"}
                                size={28}
                                color={isPageSpeaking ? COLORS.studentK8 : COLORS.textMuted}
                            />
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={handleShare}
                        style={{ padding: 4 }}
                        accessibilityLabel="Share"
                    >
                        <Ionicons name="share-outline" size={28} color="#6B6B85" />
                    </TouchableOpacity>
                    <DownloadButton resourceId="15" size={28} color="#7B68EE" />
                    <BookmarkButton resourceId="15" size={28} color="#7B68EE" />
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Title */}
                <Animated.View
                    style={{ opacity: titleFade, transform: [{ translateY: titleSlide }] }}
                >
                    <Text style={styles.pageTitle}>
                        How to Find People Who <Text style={{ color: "#7B68EE" }}>Understand</Text> Your Journey
                    </Text>
                </Animated.View>

                {/* Quote */}
                <Animated.View
                    style={[
                        styles.quoteCard,
                        { opacity: quoteFade, transform: [{ translateY: quoteSlide }] },
                    ]}
                >
                    <Ionicons
                        name="chatbubble-outline"
                        size={22}
                        color="#7B68EE"
                        style={{ marginBottom: 8, opacity: 0.6 }}
                    />
                    <Text style={styles.quoteText}>
                        {"\u201C"}A friend is someone who knows all about you and still loves
                        you.{"\u201D"}
                    </Text>
                    <Text style={styles.quoteAuthor}>{"\u2014"} Elbert Hubbard</Text>
                </Animated.View>

                {/* Stories Spotlight */}
                <Animated.View
                    style={{
                        opacity: storiesFade,
                        transform: [{ translateY: storiesSlide }],
                    }}
                >
                    <Text style={styles.sectionTitle}>
                        Making New Friends: Shining Examples
                    </Text>
                    <Text style={styles.sectionSubtitle}>
                        Real stories from young people who found their way.
                    </Text>

                    <FlatList
                        ref={storyScrollRef}
                        data={STORIES}
                        keyExtractor={(item) => item.id}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 4, paddingBottom: 8 }}
                        snapToInterval={STORY_CARD_WIDTH + STORY_CARD_MARGIN * 2}
                        decelerationRate="fast"
                        renderItem={({ item }) => <StoryFlipCard story={item} />}
                        onMomentumScrollEnd={(e) => {
                            const idx = Math.round(
                                e.nativeEvent.contentOffset.x /
                                (STORY_CARD_WIDTH + STORY_CARD_MARGIN * 2)
                            );
                            setActiveStoryIndex(idx);
                        }}
                    />

                    {/* Dots */}
                    <View style={styles.dotsRow}>
                        {STORIES.map((s, i) => (
                            <View
                                key={s.id}
                                style={[
                                    styles.dot,
                                    {
                                        backgroundColor:
                                            i === activeStoryIndex ? s.color : "#D0D0E0",
                                        width: i === activeStoryIndex ? 20 : 8,
                                    },
                                ]}
                            />
                        ))}
                    </View>

                    <Text style={styles.sourceText}>
                        Source: Alex's Lemonade Stand Foundation
                    </Text>
                </Animated.View>

                {/* Tips Section */}
                <Animated.View
                    style={{
                        opacity: sectionFade,
                        transform: [{ translateY: sectionSlide }],
                    }}
                >
                    <Text style={[styles.sectionTitle, { marginTop: 32 }]}>
                        Steps to Build Your Circle
                    </Text>
                    <Text style={styles.sectionSubtitle}>
                        Tap each step to learn more.
                    </Text>

                    <View style={mapStyles.pathContainer}>
                        {TIP_CARDS.map((card, index) => (
                            <React.Fragment key={card.id}>
                                <MapBubble
                                    card={card}
                                    index={index}
                                    onPress={() => setExpandedCard(card)}
                                />
                                {index < TIP_CARDS.length - 1 && (
                                    <MapConnector fromIndex={index} />
                                )}
                            </React.Fragment>
                        ))}
                    </View>
                </Animated.View>

                {/* Recommendations */}
                <RecommendationList 
                  currentId="15" 
                  currentTags={['social', 'friends', 'support', 'survivors', 'connections', 'peer']} 
                />
            </ScrollView>

            {/* Expanded card modal */}
            <ExpandedCardModal
                visible={expandedCard !== null}
                card={expandedCard}
                onClose={closeExpandedCard}
                isSpeaking={isCardSpeaking}
                isLoadingAudio={isCardLoadingAudio}
                onToggleSpeak={handleCardSpeak}
            />
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#FAFAFD" },
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
    backButton: { padding: 8, marginLeft: -8 },
    scrollContent: { padding: 24, paddingBottom: 80 },

    pageTitle: {
        fontSize: 30,
        fontWeight: "800",
        color: "#2D2D44",
        textAlign: "left",
        marginBottom: 20,
        marginTop: 8,
        lineHeight: 38,
        letterSpacing: -1,
    },

    // Quote
    quoteCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        borderWidth: 2,
        borderColor: "#E8E8F0",
        padding: 22,
        marginBottom: 28,
        alignItems: "center",
        shadowColor: "#7B68EE",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
    },
    quoteText: {
        fontSize: 16,
        fontWeight: "500",
        fontStyle: "italic",
        color: "#2D2D44",
        textAlign: "center",
        lineHeight: 24,
        marginBottom: 8,
    },
    quoteAuthor: {
        fontSize: 13,
        fontWeight: "500",
        fontStyle: "italic",
        color: "#8E8EA8",
        textAlign: "center",
    },

    // Section headers
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 4,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "800",
        color: "#2D2D44",
        flex: 1,
        letterSpacing: -0.3,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: "#8E8EA8",
        fontWeight: "300",
        marginBottom: 16,
    },

    // Dots
    dotsRow: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 6,
        marginTop: 14,
        marginBottom: 6,
    },
    dot: {
        height: 8,
        borderRadius: 4,
    },
    sourceText: {
        fontSize: 11,
        color: "#B0B0C0",
        textAlign: "center",
        fontStyle: "italic",
        marginTop: 6,
    },

    // Steps
    stepsContainer: {
        marginTop: 8,
    },
});
