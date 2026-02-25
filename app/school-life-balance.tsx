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
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { generateSpeech } from "../services/elevenLabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useOnboarding } from "../contexts/OnboardingContext";
import { BookmarkButton } from "../components/BookmarkButton";
import { DownloadButton } from "../components/DownloadButton";
import { COLORS } from "../constants/onboarding-theme";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// ─── Types ───────────────────────────────────────────────────────────────────
type CardData = {
    id: string;
    front: string;
    back: string;
    icon: string;
};

// ─── Card data ────────────────────────────────────────────────────────────────
const CARDS: CardData[] = [
    {
        id: "1",
        front: "Prioritize What Matters Most",
        icon: "star-outline",
        back: "Make a short daily or weekly list of what's most important.\n\nSchoolwork, rest, and health come first\u2014then other responsibilities.\n\nIt's okay to say \"no\" if something feels like too much.",
    },
    {
        id: "2",
        front: "Use Time Wisely",
        icon: "time-outline",
        back: "Break big tasks into smaller, manageable steps.\n\nUse short blocks of time—bus rides, waiting rooms—for quick review or homework.\n\nTry planners, phone reminders, or apps like Google Calendar, Todoist, or Notion to stay organized.",
    },
    {
        id: "3",
        front: "Ask For Flexibility",
        icon: "chatbubble-ellipses-outline",
        back: "Employers, teachers, and family often want to help—let them know your needs.\n\nRequest flexible work hours or lighter duties if you're feeling drained.\n\nShare your school schedule so others can support you better.",
    },
    {
        id: "4",
        front: "Take Care of Yourself",
        icon: "heart-outline",
        back: "Rest is not laziness—your body and mind need recovery time to perform well.\n\nAim for consistent sleep, balanced meals, and small moments of movement each day.\n\nEven 10 minutes of fresh air or a short break can reset your focus and energy.",
    },
    {
        id: "5",
        front: "Lean on Your Support System",
        icon: "people-outline",
        back: "Ask family or friends to help with chores or errands when needed.\n\nCheck in regularly with teachers or mentors for guidance.\n\nYou don't have to carry everything alone—friends and family are there to support you!",
    },
    {
        id: "6",
        front: "Tips",
        icon: "bulb-outline",
        back: "Set a weekly \"reset\" time\u2014maybe Sunday evening\u2014to plan the week ahead.\n\nGrouping similar tasks together (like all errands in one trip) saves time and energy.\n\nCelebrate small wins! Finishing a homework assignment or making it through a tough shift both count.\n\nIf you feel overwhelmed, reach out to a school counselor or trusted adult\u2014asking for help is a strength.",
    },
];

// ─── Card colors ──────────────────────────────────────────────────────────────
const CARD_COLORS = [
    "#7EC8E3", // Sky blue
    "#95D1BB", // Sage green
    "#C5A3D6", // Soft purple
    "#F4A97B", // Warm peach
    "#F7C59F", // Light orange
    "#A8C5F0", // Periwinkle
];

const FRONT_HEIGHT = 300;
const BACK_HEIGHT = 520;
const GRID_CARD_HEIGHT = 160;

// ─── Handout data ─────────────────────────────────────────────────────────────
type Handout = {
    id: string;
    title: string;
    icon: string;
    color: string;
    sections: HandoutSection[];
    disclaimer?: string;
};

type HandoutSection = {
    heading?: string;
    emoji?: string;
    items: string[];
    isSmartGoal?: boolean;
};

const HANDOUTS: Handout[] = [
    {
        id: "todo",
        title: "My To-Do List",
        icon: "checkbox-outline",
        color: "#7B68EE",
        sections: [
            {
                heading: "This Week's SMART Goals",
                items: [],
                isSmartGoal: true,
            },
            {
                heading: "Today's Priorities",
                items: [
                    "Most important task: ________________________",
                    "Second priority: ____________________________",
                    "Third priority: _____________________________",
                ],
            },
            {
                heading: "School Tasks",
                items: [
                    "Assignment due: _____________________________",
                    "Study for: __________________________________",
                    "Project step: _______________________________",
                ],
            },
            {
                heading: "Personal & Home",
                items: [
                    "Errand or chore: ____________________________",
                    "Ask for help with: __________________________",
                    "Self-care goal today: _______________________",
                ],
            },
            {
                heading: "End-of-Day Check-In",
                items: [
                    "✅  What did I accomplish today?",
                    "🔁  What can I carry over to tomorrow?",
                    "💚  One thing I'm proud of:",
                ],
            },
        ],
    },
    {
        id: "packing",
        title: "Hospital Packing List",
        icon: "bag-handle-outline",
        color: "#0EA5E9",
        disclaimer:
            "Every hospital unit has its own rules about what items are allowed for safety and infection control. Please check with your nursing station or care team before bringing any personal belongings to make sure they're approved for your child's specific unit and treatment area.",
        sections: [
            {
                emoji: "🧸",
                heading: "Comfort and Familiarity",
                items: [
                    "Favorite stuffed animal, blanket, or pillow",
                    "Family photo or drawings from friends/family",
                    "Small comfort item (lucky charm)",
                    "Favorite pajamas",
                    "Slippers",
                    "Small night light",
                ],
            },
            {
                emoji: "🎨",
                heading: "Entertainment and Distraction",
                items: [
                    "Tablet and laptop",
                    "Coloring books, crayons, or sketchpads",
                    "Books",
                    "Board games, cards, or small puzzles",
                    "Craft kits",
                ],
            },
            {
                emoji: "💕",
                heading: "Personal Care and Comfort",
                items: [
                    "Toothbrush, toothpaste, and gentle soap/shampoo",
                    "Lip balm and lotion",
                    "Hairbrush or comb",
                    "Hat, scarf, or beanie",
                    "Tissues and hand sanitizer",
                ],
            },
        ],
    },
];

// ─── Helper: SMART goal rows ──────────────────────────────────────────────────
function SmartGoalCard({ accentColor }: { accentColor: string }) {
    const letters = [
        { letter: "S", label: "Specific", placeholder: "What exactly will I do?" },
        { letter: "M", label: "Measurable", placeholder: "How will I know it's done?" },
        { letter: "A", label: "Achievable", placeholder: "Is this realistic for me right now?" },
        { letter: "R", label: "Relevant", placeholder: "Why does this matter to me?" },
        { letter: "T", label: "Time-bound", placeholder: "By when?" },
    ];

    return (
        <View style={smartStyles.container}>
            <Text style={[smartStyles.exampleLabel, { color: accentColor }]}>Example goal:</Text>
            <Text style={smartStyles.example}>
                "I will complete my history essay outline by Thursday at 8 PM so I'm not stressed the night before it's due."
            </Text>
            <Text style={[smartStyles.buildLabel, { color: accentColor }]}>Build your goal:</Text>
            {letters.map(({ letter, label, placeholder }) => (
                <View key={letter} style={smartStyles.row}>
                    <View style={[smartStyles.letterBox, { backgroundColor: accentColor }]}>
                        <Text style={smartStyles.letter}>{letter}</Text>
                    </View>
                    <View style={smartStyles.fieldWrapper}>
                        <Text style={smartStyles.fieldLabel}>{label}</Text>
                        <Text style={smartStyles.fieldLine}>{placeholder}</Text>
                        <View style={[smartStyles.line, { backgroundColor: accentColor + "40" }]} />
                    </View>
                </View>
            ))}
        </View>
    );
}

const smartStyles = StyleSheet.create({
    container: { marginBottom: 16 },
    exampleLabel: { fontSize: 13, fontWeight: "700", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 },
    example: { fontSize: 14, fontStyle: "italic", color: COLORS.textMuted, lineHeight: 20, marginBottom: 14, backgroundColor: "#F5F3FF", padding: 10, borderRadius: 10 },
    buildLabel: { fontSize: 13, fontWeight: "700", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 },
    row: { flexDirection: "row", alignItems: "flex-start", marginBottom: 12 },
    letterBox: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center", marginRight: 10, marginTop: 2 },
    letter: { color: "#fff", fontWeight: "800", fontSize: 16 },
    fieldWrapper: { flex: 1 },
    fieldLabel: { fontSize: 13, fontWeight: "700", color: COLORS.textDark },
    fieldLine: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
    line: { height: 1, marginTop: 6, borderRadius: 1 },
});

// ─── Grid Card ────────────────────────────────────────────────────────────────
function GridCard({
    item,
    color,
    index,
    onPress,
}: {
    item: CardData;
    color: string;
    index: number;
    onPress: () => void;
}) {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        const delay = index * 80;
        Animated.sequence([
            Animated.delay(delay),
            Animated.parallel([
                Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
                Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }),
            ]),
        ]).start();
    }, []);

    const handlePress = () => {
        Animated.sequence([
            Animated.timing(scaleAnim, { toValue: 0.93, duration: 80, useNativeDriver: true }),
            Animated.spring(scaleAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }),
        ]).start();
        setTimeout(() => onPress(), 50);
    };

    return (
        <Animated.View style={[styles.gridCardWrapper, { opacity: fadeAnim, transform: [{ scale: scaleAnim }, { translateY: slideAnim }] }]}>
            <TouchableOpacity activeOpacity={0.9} onPress={handlePress} style={{ flex: 1 }}>
                <View style={[styles.gridCard, { backgroundColor: color, borderColor: color }]}>
                    <Ionicons name={item.icon as any} size={30} color="rgba(255,255,255,0.85)" style={{ marginBottom: 10 }} />
                    <Text style={styles.gridCardText} numberOfLines={3}>{item.front}</Text>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
}

// ─── Expanded Card Modal ──────────────────────────────────────────────────────
function ExpandedCardModal({
    visible,
    item,
    color,
    onClose,
    isSpeaking,
    isLoadingAudio,
    onToggleSpeak,
}: {
    visible: boolean;
    item: CardData | null;
    color: string;
    onClose: () => void;
    isSpeaking: boolean;
    isLoadingAudio: boolean;
    onToggleSpeak: () => void;
}) {
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const flipAnim = useRef(new Animated.Value(0)).current;
    const underlineAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            flipAnim.setValue(0);
            underlineAnim.setValue(0);
            Animated.parallel([
                Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
                Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
            ]).start();

            const timer = setTimeout(() => {
                Animated.spring(flipAnim, {
                    toValue: 1, friction: 8, tension: 10, useNativeDriver: false,
                }).start(() => {
                    Animated.timing(underlineAnim, { toValue: 1, duration: 400, useNativeDriver: false }).start();
                });
            }, 1200);
            return () => clearTimeout(timer);
        } else {
            scaleAnim.setValue(0.8);
            opacityAnim.setValue(0);
            flipAnim.setValue(0);
            underlineAnim.setValue(0);
        }
    }, [visible, item]);

    const handleClose = () => {
        Animated.parallel([
            Animated.timing(scaleAnim, { toValue: 0.8, duration: 150, useNativeDriver: true }),
            Animated.timing(opacityAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
        ]).start(() => onClose());
    };

    if (!item) return null;

    const frontRotate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] });
    const backRotate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ["180deg", "360deg"] });
    const frontOpacity = flipAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0, 0] });
    const backOpacity = flipAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0, 1] });
    const cardHeight = flipAnim.interpolate({ inputRange: [0, 1], outputRange: [FRONT_HEIGHT, BACK_HEIGHT] });
    const underlineWidth = underlineAnim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
            <View style={styles.modalOverlay}>
                <Pressable style={StyleSheet.absoluteFill} onPress={handleClose}>
                    <Animated.View style={[styles.modalBackdrop, { opacity: opacityAnim }]} />
                </Pressable>

                <Animated.View style={[styles.expandedCardContainer, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
                    {/* Front */}
                    <Animated.View style={[styles.expandedCardShadow, { transform: [{ perspective: 1000 }, { rotateY: frontRotate }], opacity: frontOpacity, height: cardHeight }]}>
                        <View style={[styles.expandedCard, { height: "100%", backgroundColor: color, borderColor: color }]}>
                            <View style={styles.expandedCardInnerFront}>
                                <Ionicons name={item.icon as any} size={48} color="rgba(255,255,255,0.9)" style={{ marginBottom: 16 }} />
                                <Text style={styles.expandedFrontTitle}>{item.front}</Text>
                                <Text style={styles.flipHint}>Flip for tips →</Text>
                            </View>
                            <View style={styles.expandedCardLines}>
                                <View style={[styles.cardLine, { backgroundColor: "rgba(255,255,255,0.4)" }]} />
                                <View style={[styles.cardLine, { backgroundColor: "rgba(255,255,255,0.3)" }]} />
                                <View style={[styles.cardLine, { backgroundColor: "rgba(255,255,255,0.2)" }]} />
                            </View>
                        </View>
                    </Animated.View>

                    {/* Back */}
                    <Animated.View style={[styles.expandedCardShadow, styles.expandedCardBackSide, { transform: [{ perspective: 1000 }, { rotateY: backRotate }], opacity: backOpacity, height: cardHeight }]}>
                        <View style={[styles.expandedCard, { height: "100%", backgroundColor: "#FFFFFF", borderColor: color }]}>
                            <View style={styles.expandedCardInner}>
                                <View style={styles.factHeader}>
                                    <View>
                                        <Text style={[styles.factBigText, { color }]}>Tips</Text>
                                        <Animated.View style={{ height: 4, backgroundColor: color, width: underlineWidth, borderRadius: 2, marginTop: 2 }} />
                                    </View>
                                    <TouchableOpacity onPress={onToggleSpeak} style={styles.speakerButton} disabled={isLoadingAudio} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                        {isLoadingAudio ? (
                                            <ActivityIndicator size="small" color={color} />
                                        ) : (
                                            <Ionicons name={isSpeaking ? "stop-circle-outline" : "volume-high-outline"} size={28} color={isSpeaking ? "#FF6B6B" : "#2D2D44"} />
                                        )}
                                    </TouchableOpacity>
                                </View>

                                <Text style={[styles.backCardTitle, { color }]}>{item.front}</Text>

                                <ScrollView style={styles.backContentScroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                                    {item.back.split("\n\n").map((para, idx) => (
                                        <Text key={idx} style={styles.backParagraph}>{para}</Text>
                                    ))}
                                </ScrollView>
                            </View>

                            <View style={styles.expandedCardLines}>
                                <View style={[styles.cardLine, { backgroundColor: color + "40" }]} />
                                <View style={[styles.cardLine, { backgroundColor: color + "30" }]} />
                                <View style={[styles.cardLine, { backgroundColor: color + "20" }]} />
                            </View>
                        </View>
                    </Animated.View>
                </Animated.View>
            </View>
        </Modal>
    );
}

// ─── Handout Modal ────────────────────────────────────────────────────────────
function HandoutModal({ handout, onClose }: { handout: Handout | null; onClose: () => void }) {
    const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const backdropAnim = useRef(new Animated.Value(0)).current;
    const [internalVisible, setInternalVisible] = useState(false);
    const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

    // Reset checks when a new handout opens
    useEffect(() => {
        if (handout) setCheckedItems(new Set());
    }, [handout?.id]);

    useEffect(() => {
        if (handout) {
            setInternalVisible(true);
            slideAnim.setValue(SCREEN_HEIGHT);
            backdropAnim.setValue(0);
            Animated.parallel([
                Animated.spring(slideAnim, { toValue: 0, friction: 10, tension: 50, useNativeDriver: true }),
                Animated.timing(backdropAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
            ]).start();
        }
    }, [handout]);

    const handleClose = () => {
        Animated.parallel([
            Animated.timing(slideAnim, { toValue: SCREEN_HEIGHT, duration: 250, useNativeDriver: true }),
            Animated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]).start(() => {
            setInternalVisible(false);
            onClose();
        });
    };

    if (!internalVisible || !handout) return null;

    return (
        <Modal transparent visible={internalVisible} animationType="none" onRequestClose={handleClose}>
            <View style={handoutStyles.overlay}>
                <Pressable style={StyleSheet.absoluteFill} onPress={handleClose}>
                    <Animated.View style={[handoutStyles.backdrop, { opacity: backdropAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.55] }) }]} />
                </Pressable>

                <Animated.View style={[handoutStyles.sheet, { transform: [{ translateY: slideAnim }] }]}>
                    {/* Handle bar */}
                    <View style={handoutStyles.handleArea}>
                        <View style={handoutStyles.handle} />
                    </View>

                    {/* Header */}
                    <View style={[handoutStyles.header, { borderBottomColor: handout.color + "30" }]}>
                        <View style={[handoutStyles.iconCircle, { backgroundColor: handout.color + "20" }]}>
                            <Ionicons name={handout.icon as any} size={22} color={handout.color} />
                        </View>
                        <Text style={[handoutStyles.title, { color: handout.color }]}>{handout.title}</Text>
                        <TouchableOpacity onPress={handleClose} style={handoutStyles.closeBtn}>
                            <Ionicons name="close" size={22} color={COLORS.textLight} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={handoutStyles.scroll} contentContainerStyle={handoutStyles.scrollContent} showsVerticalScrollIndicator={false}>
                        {handout.sections.map((section, sIdx) => (
                            <View key={sIdx} style={handoutStyles.section}>
                                {section.heading && (
                                    <View style={handoutStyles.sectionHeadRow}>
                                        {section.emoji && <Text style={handoutStyles.emoji}>{section.emoji}</Text>}
                                        <Text style={[handoutStyles.sectionHeading, { color: handout.color }]}>{section.heading}</Text>
                                    </View>
                                )}
                                {section.isSmartGoal ? (
                                    <SmartGoalCard accentColor={handout.color} />
                                ) : (
                                    section.items.map((item, iIdx) => {
                                        const key = `${sIdx}-${iIdx}`;
                                        const checked = checkedItems.has(key);
                                        const toggle = () => {
                                            setCheckedItems(prev => {
                                                const next = new Set(prev);
                                                if (next.has(key)) next.delete(key);
                                                else next.add(key);
                                                return next;
                                            });
                                        };
                                        return (
                                            <TouchableOpacity
                                                key={iIdx}
                                                style={handoutStyles.itemRow}
                                                onPress={toggle}
                                                activeOpacity={0.7}
                                            >
                                                <View style={[
                                                    handoutStyles.checkbox,
                                                    checked
                                                        ? { backgroundColor: handout.color, borderColor: handout.color }
                                                        : { borderColor: handout.color },
                                                ]}>
                                                    {checked && (
                                                        <Ionicons name="checkmark" size={12} color="#fff" />
                                                    )}
                                                </View>
                                                <Text style={[
                                                    handoutStyles.itemText,
                                                    checked && handoutStyles.itemTextChecked,
                                                ]}>{item}</Text>
                                            </TouchableOpacity>
                                        );
                                    })
                                )}
                            </View>
                        ))}

                        {handout.disclaimer && (
                            <View style={[handoutStyles.disclaimerBox, { borderColor: handout.color + "50", backgroundColor: handout.color + "0D" }]}>
                                <Ionicons name="information-circle-outline" size={18} color={handout.color} style={{ marginRight: 8, marginTop: 1 }} />
                                <Text style={[handoutStyles.disclaimerText, { color: COLORS.textMuted }]}>{handout.disclaimer}</Text>
                            </View>
                        )}
                    </ScrollView>
                </Animated.View>
            </View>
        </Modal>
    );
}

const handoutStyles = StyleSheet.create({
    overlay: { flex: 1, justifyContent: "flex-end" },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "#000" },
    sheet: {
        height: SCREEN_HEIGHT * 0.82,
        backgroundColor: "#FFFFFF",
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 20,
    },
    handleArea: { paddingVertical: 12, alignItems: "center" },
    handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.indicatorInactive },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingBottom: 14,
        borderBottomWidth: 1,
        gap: 10,
    },
    iconCircle: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
    title: { flex: 1, fontSize: 18, fontWeight: "800", letterSpacing: -0.3 },
    closeBtn: { padding: 4 },
    scroll: { flex: 1 },
    scrollContent: { padding: 20, paddingBottom: 50 },
    section: { marginBottom: 24 },
    sectionHeadRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
    emoji: { fontSize: 20, marginRight: 8 },
    sectionHeading: { fontSize: 15, fontWeight: "800", letterSpacing: -0.2, flex: 1 },
    itemRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 10 },
    checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 1.5, marginRight: 10, marginTop: 2, flexShrink: 0 },
    itemText: { fontSize: 14, color: COLORS.textMuted, lineHeight: 20, flex: 1 },
    itemTextChecked: { textDecorationLine: "line-through" as const, color: COLORS.textLight, opacity: 0.6 },
    disclaimerBox: {
        flexDirection: "row",
        alignItems: "flex-start",
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        marginTop: 8,
    },
    disclaimerText: { fontSize: 13, lineHeight: 19, flex: 1 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function SchoolLifeBalanceScreen() {
    const { selectedVoice } = useOnboarding();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [expandedCard, setExpandedCard] = useState<CardData | null>(null);
    const [expandedColor, setExpandedColor] = useState("#7EC8E3");
    const [activeHandout, setActiveHandout] = useState<Handout | null>(null);

    // Audio
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isLoadingAudio, setIsLoadingAudio] = useState(false);

    useEffect(() => {
        return () => { if (sound) sound.unloadAsync(); };
    }, [sound]);

    const getCardColor = (id: string) => {
        const idx = CARDS.findIndex((c) => c.id === id);
        return CARD_COLORS[idx % CARD_COLORS.length];
    };

    const closeExpandedCard = async () => {
        if (sound) {
            try { await sound.stopAsync(); await sound.unloadAsync(); } catch (_) { }
            setSound(null);
        }
        setIsSpeaking(false);
        setExpandedCard(null);
    };

    const handleSpeak = async () => {
        if (isSpeaking) {
            if (sound) await sound.pauseAsync();
            setIsSpeaking(false);
        } else {
            setIsSpeaking(true);
            if (sound) {
                await sound.playAsync();
            } else if (expandedCard?.back) {
                try {
                    setIsLoadingAudio(true);
                    const text = `${expandedCard.front}. ${expandedCard.back}`;
                    const audioUri = await generateSpeech(text, selectedVoice);
                    if (audioUri) {
                        const { sound: newSound } = await Audio.Sound.createAsync({ uri: audioUri }, { shouldPlay: true });
                        setSound(newSound);
                        newSound.setOnPlaybackStatusUpdate((status) => {
                            if (status.isLoaded && status.didJustFinish) {
                                setIsSpeaking(false);
                                newSound.setPositionAsync(0);
                            }
                        });
                    }
                } catch (e) {
                    console.error("Audio error:", e);
                    setIsSpeaking(false);
                } finally {
                    setIsLoadingAudio(false);
                }
            }
        }
    };

    const handleCardPress = (card: CardData) => {
        setExpandedColor(getCardColor(card.id));
        setExpandedCard(card);
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: 'Check out "Best Practices for Juggling School and Life" on SchoolKit — practical tips for balancing school, work, and home responsibilities.',
            });
        } catch { }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton} accessibilityLabel="Go back">
                    <Ionicons name="arrow-back" size={28} color="#2D2D44" />
                </TouchableOpacity>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <TouchableOpacity onPress={handleShare} style={{ padding: 4 }} accessibilityLabel="Share">
                        <Ionicons name="share-outline" size={28} color="#6B6B85" />
                    </TouchableOpacity>
                    <DownloadButton resourceId="14" size={28} color="#7B68EE" />
                    <BookmarkButton resourceId="14" size={28} color="#7B68EE" />
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Title */}
                <Text style={styles.pageTitle}>
                    Best Practices for Juggling{"\n"}
                    <Text style={{ color: "#7B68EE" }}>School and Life</Text>
                </Text>

                {/* Subtitle */}
                <Text style={styles.subtitleText}>
                    Balancing school with jobs, home duties, or other responsibilities can feel tough—but with the right tools, you can find a rhythm that works for you.
                </Text>

                <Text style={styles.instructionText}>Tap each card to flip it and read the tips.</Text>

                {/* 2-column card grid — rows of 2, matching handout box widths */}
                <View style={styles.gridContainer}>
                    {[0, 2, 4].map((rowStart) => (
                        <View key={rowStart} style={styles.cardRow}>
                            {CARDS.slice(rowStart, rowStart + 2).map((card, i) => (
                                <GridCard
                                    key={card.id}
                                    item={card}
                                    color={CARD_COLORS[(rowStart + i) % CARD_COLORS.length]}
                                    index={rowStart + i}
                                    onPress={() => handleCardPress(card)}
                                />
                            ))}
                        </View>
                    ))}
                </View>

                {/* Handouts section */}
                <View style={styles.handoutsSection}>
                    <Text style={styles.handoutsHeading}>📄 Helpful Handouts</Text>
                    <Text style={styles.handoutsSubtext}>Tap to open and explore.</Text>
                    <View style={styles.handoutsRow}>
                        {HANDOUTS.map((handout) => (
                            <TouchableOpacity
                                key={handout.id}
                                style={[styles.handoutCard, { borderColor: handout.color + "60", backgroundColor: handout.color + "10" }]}
                                onPress={() => setActiveHandout(handout)}
                                activeOpacity={0.8}
                            >
                                <View style={[styles.handoutIconCircle, { backgroundColor: handout.color + "20" }]}>
                                    <Ionicons name={handout.icon as any} size={26} color={handout.color} />
                                </View>
                                <Text style={[styles.handoutCardTitle, { color: handout.color }]}>{handout.title}</Text>
                                <View style={[styles.handoutOpenBtn, { backgroundColor: handout.color }]}>
                                    <Text style={styles.handoutOpenText}>Open</Text>
                                    <Ionicons name="chevron-forward" size={14} color="#fff" />
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </ScrollView>

            {/* Expanded card modal */}
            <ExpandedCardModal
                visible={expandedCard !== null}
                item={expandedCard}
                color={expandedColor}
                onClose={closeExpandedCard}
                isSpeaking={isSpeaking}
                isLoadingAudio={isLoadingAudio}
                onToggleSpeak={handleSpeak}
            />

            {/* Handout modal */}
            <HandoutModal handout={activeHandout} onClose={() => setActiveHandout(null)} />
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
        fontSize: 32,
        fontWeight: "800",
        color: "#2D2D44",
        textAlign: "left",
        marginBottom: 12,
        marginTop: 8,
        lineHeight: 40,
        letterSpacing: -1,
    },
    subtitleText: {
        fontSize: 15,
        color: "#6B6B85",
        fontWeight: "400",
        lineHeight: 22,
        marginBottom: 16,
    },
    instructionText: {
        fontSize: 14,
        color: "#8E8EA8",
        fontWeight: "300",
        marginBottom: 28,
    },

    // 2-column grid
    gridContainer: {
        gap: 14,
        marginBottom: 8,
    },
    cardRow: {
        flexDirection: "row",
        gap: 14,
    },
    gridCardWrapper: {
        flex: 1,
        borderRadius: 20,
        backgroundColor: "transparent",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18,
        shadowRadius: 12,
        elevation: 6,
    },
    gridCard: {
        height: GRID_CARD_HEIGHT,
        borderRadius: 20,
        borderWidth: 3,
        padding: 16,
        paddingTop: 18,
        overflow: "hidden",
        justifyContent: "center",
        alignItems: "center",
    },
    gridCardText: {
        fontSize: 15,
        fontWeight: "700",
        color: "#FFFFFF",
        lineHeight: 21,
        textAlign: "center",
        letterSpacing: -0.2,
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
    cardLine: { height: 2, borderRadius: 1, marginTop: 4 },

    // Modal
    modalOverlay: { flex: 1, justifyContent: "center", alignItems: "center" },
    modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)" },
    expandedCardContainer: { width: SCREEN_WIDTH - 48, maxHeight: SCREEN_HEIGHT * 0.7 },
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
        borderRadius: 36,
        borderWidth: 4,
        overflow: "hidden",
        backfaceVisibility: "hidden",
    },
    expandedCardBackSide: { position: "absolute", top: 0, left: 0, right: 0 },
    expandedCardInnerFront: {
        flex: 1,
        padding: 28,
        alignItems: "center",
        justifyContent: "center",
    },
    expandedFrontTitle: {
        fontSize: 28,
        fontWeight: "700",
        color: "#FFFFFF",
        textAlign: "center",
        lineHeight: 36,
        letterSpacing: -0.5,
        marginBottom: 8,
    },
    flipHint: {
        fontSize: 13,
        color: "rgba(255,255,255,0.65)",
        fontWeight: "500",
        marginTop: 8,
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
    expandedCardInner: { padding: 24, flex: 1, overflow: "hidden" },
    factHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 10,
    },
    factBigText: { fontSize: 30, fontWeight: "900", letterSpacing: 1, textTransform: "uppercase" },
    speakerButton: { padding: 8 },
    backCardTitle: {
        fontSize: 17,
        fontWeight: "700",
        marginBottom: 12,
        letterSpacing: -0.3,
    },
    backContentScroll: { flex: 1 },
    backParagraph: {
        fontSize: 16,
        fontWeight: "400",
        color: "#2D2D44",
        lineHeight: 26,
        marginBottom: 10,
    },

    // Handouts section
    handoutsSection: { marginTop: 32 },
    handoutsHeading: { fontSize: 20, fontWeight: "800", color: "#2D2D44", marginBottom: 4 },
    handoutsSubtext: { fontSize: 14, color: "#8E8EA8", marginBottom: 16 },
    handoutsRow: { flexDirection: "row", gap: 14 },
    handoutCard: {
        flex: 1,
        borderRadius: 20,
        borderWidth: 2,
        padding: 16,
        alignItems: "center",
        gap: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 3,
    },
    handoutIconCircle: {
        width: 52,
        height: 52,
        borderRadius: 26,
        alignItems: "center",
        justifyContent: "center",
    },
    handoutCardTitle: {
        fontSize: 13,
        fontWeight: "700",
        textAlign: "center",
        lineHeight: 18,
    },
    handoutOpenBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginTop: 2,
    },
    handoutOpenText: { color: "#fff", fontSize: 12, fontWeight: "700" },
});
