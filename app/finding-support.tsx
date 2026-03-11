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
    ActivityIndicator,
    FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { generateSpeech } from "../services/elevenLabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useOnboarding } from "../contexts/OnboardingContext";
import { BookmarkButton } from "../components/BookmarkButton";
import { RecommendationList } from "../components/RecommendationList";
import { DownloadButton } from "../components/DownloadButton";
import { useTheme } from "../contexts/ThemeContext";
import { ThemeColors, ThemeShadows } from "../constants/theme";
import { TYPOGRAPHY, SPACING, RADII, BORDERS } from "../constants/onboarding-theme";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const FONT_STEPS = [1.0, 1.2, 1.45];

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
        back: "Look for one or two people you feel safe with—a close friend, sibling, or trusted classmate.\n\nYou don't need to tell your whole story at once—share at your own pace.",
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
        back: "Clubs, sports, or arts groups are great ways to meet people with shared interests.\n\nEven small involvement—like attending a meeting or practice—can build connections.",
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
        back: "Some schools have peer support groups or access to survivor networks. Talking to others who \"get it\" can feel comforting and empowering.\n\nPrograms like SAYAC (Stanford Adolescent \u0026 Young Adult Cancer) meetings bring young survivors together—connecting with people who truly understand your experience can be life-changing.",
    },
];

const CARD_HEIGHT_FRONT = 280;
const CARD_HEIGHT_BACK = 460;
const STORY_CARD_WIDTH = SCREEN_WIDTH * 0.78;
const STORY_CARD_MARGIN = 10;

// ─── Story Flippable Card ─────────────────────────────────────────────────────
function StoryFlipCard({ story, isDark, colors, styles }: { story: StoryData, isDark: boolean, colors: ThemeColors, styles: any }) {
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
                        styles.storyCard,
                        { backgroundColor: isDark ? story.color + 'CC' : story.color, borderColor: story.color + "60" },
                        { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
                        { transform: [{ perspective: 1000 }, { rotateY: frontRotate }], opacity: frontOpacity },
                    ]}
                >
                    <Text style={styles.storyEmoji}>{story.emoji}</Text>
                    <Text style={styles.storyFrontTitle}>{story.front}</Text>
                    <Text style={styles.storyTapHint}>Tap to read story</Text>
                </Animated.View>
                {/* Back */}
                <Animated.View
                    style={[
                        styles.storyCard,
                        { backgroundColor: isDark ? colors.backgroundLight : story.color + "12", borderColor: story.color + "60" },
                        { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
                        { transform: [{ perspective: 1000 }, { rotateY: backRotate }], opacity: backOpacity, backfaceVisibility: "hidden" },
                    ]}
                >
                    <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled>
                        <Text style={[styles.storyText, { color: colors.textDark }, story.fontSize ? { fontSize: story.fontSize, lineHeight: story.fontSize * 1.5 } : undefined]}>{"\u201C"}{story.text}{"\u201D"}</Text>
                    </ScrollView>
                </Animated.View>
            </View>
        </TouchableOpacity>
    );
}

// ─── Map Path Bubbles ───────────────────────────────────────────────────────
const BUBBLE_SIZE = 200;

function MapBubble({
    card,
    index,
    onPress,
    styles,
}: {
    card: TipCard;
    index: number;
    onPress: () => void;
    styles: any;
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
                styles.bubbleWrapper,
                isLeft ? styles.bubbleLeft : styles.bubbleRight,
                { opacity: fadeAnim, transform: [{ scale: scaleAnim }, { translateY: slideAnim }] },
            ]}
        >
            <TouchableOpacity activeOpacity={0.85} onPress={handlePress}>
                <View style={[styles.bubble, { backgroundColor: card.color + "18", borderColor: card.color + "50" }]}>
                    <Text style={[styles.bubbleText, { color: card.color }]} numberOfLines={3}>
                        {card.front}
                    </Text>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
}

function MapConnector({ fromIndex, styles }: { fromIndex: number, styles: any }) {
    const color = TIP_CARDS[fromIndex].color;
    const isFromLeft = fromIndex % 2 === 0;
    return (
        <View style={[styles.connectorWrapper, isFromLeft ? styles.connectorLeft : styles.connectorRight]}>
            <View style={[styles.dashedLine, { borderColor: color + "35" }]} />
        </View>
    );
}

// ─── Expanded Card Modal ──────────────────────────────────────────────────────
function ExpandedCardModal({
    visible,
    card,
    onClose,
    isSpeaking,
    isLoadingAudio,
    onToggleSpeak,
    playbackRate,
    onTogglePlaybackRate,
    isAudioLoaded,
    isDark,
    colors,
    styles,
}: {
    visible: boolean;
    card: TipCard | null;
    onClose: () => void;
    isSpeaking: boolean;
    isLoadingAudio: boolean;
    onToggleSpeak: () => void;
    playbackRate: number;
    onTogglePlaybackRate: () => void;
    isAudioLoaded: boolean;
    isDark: boolean;
    colors: ThemeColors;
    styles: any;
}) {
    const scaleAnim = useRef(new Animated.Value(0.85)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const flipAnim = useRef(new Animated.Value(0)).current;
    const [fontSizeStep, setFontSizeStep] = useState(0);

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
    const frontRotate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] });
    const backRotate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ["180deg", "360deg"] });
    const frontOpacity = flipAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0, 0] });
    const backOpacity = flipAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0, 1] });
    const cardHeight = flipAnim.interpolate({ inputRange: [0, 1], outputRange: [CARD_HEIGHT_FRONT, CARD_HEIGHT_BACK] });

    const content = (
        <View style={styles.modalOverlay} pointerEvents="box-none">
                <Pressable style={StyleSheet.absoluteFill} onPress={handleClose}>
                    <Animated.View style={[styles.modalBackdrop, { opacity: opacityAnim }]} />
                </Pressable>

                <Animated.View style={[styles.modalContainer, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
                    {/* Front */}
                    <Animated.View style={[styles.modalCardShadow, { transform: [{ perspective: 1000 }, { rotateY: frontRotate }], opacity: frontOpacity, height: cardHeight }]}>
                        <View style={[styles.modalCard, { height: "100%", backgroundColor: color, borderColor: color }]}>
                            <View style={styles.frontInner}>
                                <Ionicons name={card.icon as any} size={56} color="rgba(255,255,255,0.9)" style={{ marginBottom: 16 }} />
                                <Text style={styles.frontTitle}>{card.front}</Text>
                            </View>
                        </View>
                    </Animated.View>

                    {/* Back */}
                    <Animated.View style={[styles.modalCardShadow, styles.backSide, { transform: [{ perspective: 1000 }, { rotateY: backRotate }], opacity: backOpacity, height: cardHeight }]}>
                        <View style={[styles.modalCard, { height: "100%", backgroundColor: colors.white, borderColor: color }]}>
                            <View style={styles.backInner}>
                                <View style={styles.backHeader}>
                                    <View style={[styles.backIconCircle, { backgroundColor: color + "20" }]}>
                                        <Ionicons name={card.icon as any} size={22} color={color} />
                                    </View>
                                    <Text style={[styles.backTitle, { color }]}>{card.front}</Text>
                                    <TouchableOpacity onPress={onToggleSpeak} style={styles.speakerBtn} disabled={isLoadingAudio}>
                                        {isLoadingAudio ? <ActivityIndicator size="small" color={color} /> : <Ionicons name={isSpeaking ? "stop-circle-outline" : "volume-high-outline"} size={26} color={isSpeaking ? "#FF6B6B" : colors.textDark} />}
                                    </TouchableOpacity>
                                    {isAudioLoaded && (
                                        <TouchableOpacity onPress={onTogglePlaybackRate} style={styles.speakerBtn}>
                                            <Text style={{ fontSize: 12, fontWeight: '700', color }}>{playbackRate}x</Text>
                                        </TouchableOpacity>
                                    )}
                                    <TouchableOpacity onPress={() => setFontSizeStep(s => (s + 1) % FONT_STEPS.length)} hitSlop={10} activeOpacity={0.7}>
                                        <Text style={{ fontSize: 13, fontWeight: '800', color: fontSizeStep > 0 ? color : '#9CA3AF' }}>Aa</Text>
                                    </TouchableOpacity>
                                </View>
                                <View style={[styles.modalDivider, { backgroundColor: color + "30" }]} />
                                <ScrollView style={styles.backScroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
                                    {card.back.split("\n\n").map((para, idx) => (
                                        <View key={idx} style={styles.tipRow}>
                                            <Ionicons
                                                name="chevron-forward-circle"
                                                size={18}
                                                color={color}
                                                style={{ marginTop: 2, marginRight: 10, flexShrink: 0 }}
                                            />
                                            <Text style={[styles.backText, { color: colors.textDark }, fontSizeStep > 0 && { fontSize: Math.round(16 * FONT_STEPS[fontSizeStep]), lineHeight: Math.round(24 * FONT_STEPS[fontSizeStep]) }]}>{para}</Text>
                                        </View>
                                    ))}
                                </ScrollView>
                            </View>
                        </View>
                    </Animated.View>
                </Animated.View>
            </View>
    );

    if (Platform.OS === 'web') {
        if (!visible) return null;
        return <View style={StyleSheet.absoluteFill} pointerEvents="box-none">{content}</View>;
    }
    return <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>{content}</Modal>;
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function FindingSupportScreen() {
    const { selectedVoice } = useOnboarding();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { colors, shadows, isDark } = useTheme();

    const styles = useMemo(() => makeStyles(colors, shadows, isDark), [colors, shadows, isDark]);

    const [expandedCard, setExpandedCard] = useState<TipCard | null>(null);

    const cardPlayer = useAudioPlayer();
    const cardPlayerStatus = useAudioPlayerStatus(cardPlayer);
    const [isCardSpeaking, setIsCardSpeaking] = useState(false);
    const [isCardLoadingAudio, setIsCardLoadingAudio] = useState(false);
    const [cardPlaybackRate, setCardPlaybackRate] = useState(1.0);
    const currentCardIdRef = useRef<string | null>(null);

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

    useEffect(() => {
        if (cardPlayerStatus.isLoaded && cardPlayerStatus.didJustFinish) {
            setIsCardSpeaking(false);
            cardPlayer.seekTo(0);
        }
    }, [cardPlayerStatus.isLoaded, cardPlayerStatus.didJustFinish]);

    const handleCardSpeak = async () => {
        if (!expandedCard) return;
        if (isCardSpeaking) {
            cardPlayer.pause();
            setIsCardSpeaking(false);
            return;
        }
        if (cardPlayerStatus.isLoaded && currentCardIdRef.current === expandedCard.id) {
            cardPlayer.play();
            setIsCardSpeaking(true);
            return;
        }
        currentCardIdRef.current = expandedCard.id;
        setIsCardSpeaking(true);
        try {
            setIsCardLoadingAudio(true);
            const text = `${expandedCard.front}. ${expandedCard.back}`;
            const audioUri = await generateSpeech(text, selectedVoice);
            if (audioUri) {
                cardPlayer.replace(audioUri);
                cardPlayer.play();
            } else {
                setIsCardSpeaking(false);
                currentCardIdRef.current = null;
            }
        } catch (e) {
            setIsCardSpeaking(false);
            currentCardIdRef.current = null;
        } finally {
            setIsCardLoadingAudio(false);
        }
    };

    const toggleCardPlaybackRate = () => {
        let next = 1.0;
        if (cardPlaybackRate === 1.0) next = 1.25;
        else if (cardPlaybackRate === 1.25) next = 1.5;
        else if (cardPlaybackRate === 1.5) next = 2.0;
        setCardPlaybackRate(next);
        if (cardPlayerStatus.isLoaded) cardPlayer.setPlaybackRate(next);
    };

    const closeExpandedCard = () => {
        cardPlayer.pause();
        setIsCardSpeaking(false);
        setExpandedCard(null);
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: 'Check out "How to Find People Who Understand Your Journey" on SchoolKit — real stories and tips for building supportive friendships.',
            });
        } catch { }
    };

    const storyScrollRef = useRef<FlatList>(null);
    const [activeStoryIndex, setActiveStoryIndex] = useState(0);

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: colors.white, borderBottomColor: colors.borderCard }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton} accessibilityLabel="Go back">
                    <Ionicons name="arrow-back" size={28} color={colors.textDark} />
                </TouchableOpacity>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <TouchableOpacity onPress={handleShare} style={{ padding: 4 }} accessibilityLabel="Share">
                        <Ionicons name="share-outline" size={28} color={colors.textLight} />
                    </TouchableOpacity>
                    <DownloadButton resourceId="15" size={28} color={colors.primary} />
                    <BookmarkButton resourceId="15" size={28} color={colors.primary} />
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Animated.View style={{ opacity: titleFade, transform: [{ translateY: titleSlide }] }}>
                    <Text style={[styles.pageTitle, { color: colors.textDark }]}>
                        How to Find People Who <Text style={{ color: colors.primary }}>Understand</Text> Your Journey
                    </Text>
                </Animated.View>

                <Animated.View style={[styles.quoteCard, { backgroundColor: colors.white, borderColor: colors.borderCard }, shadows.card, { opacity: quoteFade, transform: [{ translateY: quoteSlide }] }]}>
                    <Ionicons name="chatbubble-outline" size={22} color={colors.primary} style={{ marginBottom: 8, opacity: 0.6 }} />
                    <Text style={[styles.quoteText, { color: colors.textDark }]}>
                        {"\u201C"}A friend is someone who knows all about you and still loves you.{"\u201D"}
                    </Text>
                    <Text style={[styles.quoteAuthor, { color: colors.textLight }]}>{"\u2014"} Elbert Hubbard</Text>
                </Animated.View>

                <Animated.View style={{ opacity: storiesFade, transform: [{ translateY: storiesSlide }] }}>
                    <Text style={[styles.sectionTitle, { color: colors.textDark }]}>Making New Friends: Shining Examples</Text>
                    <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>Real stories from young people who found their way.</Text>
                    <FlatList ref={storyScrollRef} data={STORIES} keyExtractor={(item) => item.id} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 4, paddingBottom: 8 }} snapToInterval={STORY_CARD_WIDTH + STORY_CARD_MARGIN * 2} decelerationRate="fast" renderItem={({ item }) => <StoryFlipCard story={item} isDark={isDark} colors={colors} styles={styles} />} onMomentumScrollEnd={(e) => {
                        const idx = Math.round(e.nativeEvent.contentOffset.x / (STORY_CARD_WIDTH + STORY_CARD_MARGIN * 2));
                        setActiveStoryIndex(idx);
                    }} />
                    <View style={styles.dotsRow}>
                        {STORIES.map((s, i) => (
                            <View key={s.id} style={[styles.dot, { backgroundColor: i === activeStoryIndex ? s.color : isDark ? colors.indicatorInactive : "#D0D0E0", width: i === activeStoryIndex ? 20 : 8 }]} />
                        ))}
                    </View>
                    <Text style={[styles.sourceText, { color: colors.textLight }]}>Source: Alex's Lemonade Stand Foundation</Text>
                </Animated.View>

                <Animated.View style={{ opacity: sectionFade, transform: [{ translateY: sectionSlide }] }}>
                    <Text style={[styles.sectionTitle, { color: colors.textDark, marginTop: 32 }]}>Steps to Build Your Circle</Text>
                    <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>Tap each step to learn more.</Text>
                    <View style={styles.pathContainer}>
                        {TIP_CARDS.map((card, index) => (
                            <React.Fragment key={card.id}>
                                <MapBubble card={card} index={index} onPress={() => setExpandedCard(card)} styles={styles} />
                                {index < TIP_CARDS.length - 1 && <MapConnector fromIndex={index} styles={styles} />}
                            </React.Fragment>
                        ))}
                    </View>
                </Animated.View>

                <RecommendationList currentId="15" currentTags={['social', 'friends', 'support', 'survivors', 'connections', 'peer']} />
            </ScrollView>

            <ExpandedCardModal visible={expandedCard !== null} card={expandedCard} onClose={closeExpandedCard} isSpeaking={isCardSpeaking} isLoadingAudio={isCardLoadingAudio} onToggleSpeak={handleCardSpeak} playbackRate={cardPlaybackRate} onTogglePlaybackRate={toggleCardPlaybackRate} isAudioLoaded={cardPlayerStatus.isLoaded} isDark={isDark} colors={colors} styles={styles} />
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
    scrollContent: { padding: 24, paddingBottom: 80 },
    pageTitle: { ...TYPOGRAPHY.display, fontSize: 30, textAlign: "left", marginBottom: 20, marginTop: 8, lineHeight: 38, letterSpacing: -1 },
    quoteCard: { borderRadius: 20, borderWidth: 2, padding: 22, marginBottom: 28, alignItems: "center", ...s.card },
    quoteText: { ...TYPOGRAPHY.body, fontStyle: "italic", textAlign: "center", lineHeight: 24, marginBottom: 8 },
    quoteAuthor: { ...TYPOGRAPHY.labelSmall, fontStyle: "italic", textAlign: "center" },
    sectionTitle: { ...TYPOGRAPHY.h3, fontWeight: "800", letterSpacing: -0.3 },
    sectionSubtitle: { ...TYPOGRAPHY.labelSmall, fontWeight: "300", marginBottom: 16 },
    dotsRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6, marginTop: 14, marginBottom: 6 },
    dot: { height: 8, borderRadius: 4 },
    sourceText: { ...TYPOGRAPHY.caption, fontStyle: "italic", textAlign: "center", marginTop: 6 },
    storyCard: { width: STORY_CARD_WIDTH, borderRadius: 24, borderWidth: 2, padding: 20, height: 260, justifyContent: "center", alignItems: "center", backfaceVisibility: "hidden" },
    storyEmoji: { fontSize: 40, marginBottom: 12 },
    storyFrontTitle: { fontSize: 18, fontWeight: "700", color: "#FFFFFF", textAlign: "center", lineHeight: 24 },
    storyTapHint: { fontSize: 12, color: "rgba(255,255,255,0.6)", fontWeight: "500", marginTop: 10 },
    storyText: { fontSize: 14, fontWeight: "400", lineHeight: 22, fontStyle: "italic" },
    pathContainer: { paddingBottom: 10 },
    bubbleWrapper: { width: BUBBLE_SIZE },
    bubbleLeft: { alignSelf: "flex-start", marginLeft: 140 },
    bubbleRight: { alignSelf: "flex-end", marginRight: 140 },
    bubble: { width: BUBBLE_SIZE, height: BUBBLE_SIZE, borderRadius: BUBBLE_SIZE / 2, borderWidth: 2.5, alignItems: "center", justifyContent: "center", padding: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 4 },
    bubbleText: { fontSize: 14, fontWeight: "700", textAlign: "center", lineHeight: 16, letterSpacing: -0.2 },
    connectorWrapper: { height: 20, justifyContent: "center" },
    connectorLeft: { alignItems: "flex-end", marginRight: 30 + BUBBLE_SIZE / 2 },
    connectorRight: { alignItems: "flex-start", marginLeft: 30 + BUBBLE_SIZE / 2 },
    dashedLine: { width: 0, height: "100%", borderWidth: 1.5, borderStyle: "dashed" },
    modalOverlay: { flex: 1, justifyContent: "center", alignItems: "center" },
    modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)" },
    modalContainer: { width: '88%', maxWidth: 560, maxHeight: SCREEN_HEIGHT * 0.72 },
    modalCardShadow: { width: "100%", ...s.card },
    modalCard: { width: "100%", borderRadius: 32, borderWidth: 4, overflow: "hidden", backfaceVisibility: "hidden" },
    backSide: { position: "absolute", top: 0, left: 0, right: 0 },
    frontInner: { flex: 1, padding: 32, alignItems: "center", justifyContent: "center" },
    frontTitle: { fontSize: 26, fontWeight: "700", color: "#FFFFFF", textAlign: "center", lineHeight: 34, letterSpacing: -0.5 },
    backInner: { padding: 24, flex: 1, overflow: "hidden" },
    backHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
    backIconCircle: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
    backTitle: { fontSize: 18, fontWeight: "800", flex: 1, letterSpacing: -0.3 },
    speakerBtn: { padding: 6 },
    modalDivider: { height: 2, borderRadius: 1, marginBottom: 16 },
    backScroll: { flex: 1 },
    tipRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 14 },
    backText: { fontSize: 16, fontWeight: "400", lineHeight: 24, flex: 1 },
});
