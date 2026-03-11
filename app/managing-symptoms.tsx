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
    Platform,
    Pressable,
    Share,
    ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { generateSpeech } from "../services/elevenLabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useOnboarding } from "../contexts/OnboardingContext";
import { useAccomplishments } from "../contexts/AccomplishmentContext";
import { BookmarkButton } from "../components/BookmarkButton";
import { RecommendationList } from "../components/RecommendationList";
import { DownloadButton } from "../components/DownloadButton";
import { useTheme } from "../contexts/ThemeContext";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const RESOURCE_ID = "17";
const PAGE_COLOR = "#6366F1";

// Body diagram layout constants (figureLeft computed from containerWidth in BodyDiagram)
const FIG_WIDTH = 100;
const ICON_SIZE = 42;
const HALO_GAP = 32;     // uniform gap from body edge to icon on all sides
const FIG_TOP = 88;      // enough room for icon (42) + label (30) + gap above head
const FIG_HEIGHT = 330;  // head-to-toe span of the figure
const DIAGRAM_HEIGHT = FIG_TOP + FIG_HEIGHT + HALO_GAP + ICON_SIZE + 55; // 55 = label (30) + padding

// Card flip dimensions
const FRONT_HEIGHT = 210;
const BACK_HEIGHT = 500;

// ─── Types ────────────────────────────────────────────────────────────────────
type SymptomSection = {
    heading?: string;
    notice: string[];
    helps: string[];
};

type SymptomArea = {
    id: string;
    label: string;
    icon: string;
    color: string;
    sections: SymptomSection[];
    side: 'left' | 'right' | 'top' | 'bottom';
    bodyAnchorY: number; // Y offset from FIG_TOP where connector line meets body edge
    haloGap: number;    // horizontal (or vertical) distance from body edge to icon
};

type GeneralTip = {
    id: string;
    title: string;
    icon: string;
    notice: string[];
    helps: string[];
};

// ─── Symptom data ─────────────────────────────────────────────────────────────
const SYMPTOM_AREAS: SymptomArea[] = [
    {
        id: "general",
        label: "General Symptoms",
        icon: "flash-outline",
        color: "#F59E0B",
        side: 'top',
        bodyAnchorY: 0,
        haloGap: 0,
        sections: [
            {
                heading: "Rest & Energy",
                notice: [
                    "Feeling unusually tired or weak",
                    "Simple tasks take more effort than usual",
                ],
                helps: [
                    "Take short walks",
                    "Sit instead of stand when possible",
                ],
            },
            {
                heading: "Sleep",
                notice: [
                    "Trouble falling asleep",
                    "Waking frequently or vivid dreams",
                    "Sleeping more than usual",
                ],
                helps: [
                    "Keep consistent sleep and wake times",
                    "Limit screens before bed",
                    "Keep the room cool and dark",
                    "Create a calming wind-down routine",
                ],
            },
        ],
    },
    {
        id: "mind",
        label: "Mind & Mood",
        icon: "bulb-outline",
        color: "#8B5CF6",
        side: 'right',
        bodyAnchorY: 28,
        haloGap: 55,
        sections: [
            {
                heading: "Emotional Waves",
                notice: [
                    "Grief, anger, or guilt",
                    "Fear about the future",
                    "Feeling strong one day and fragile the next",
                ],
                helps: [
                    "Normalize emotional ups and downs",
                    "Seek therapy or support groups",
                    "Try journaling or mindfulness",
                    "Remind yourself healing is not linear",
                ],
            },
            {
                heading: "Stress & Relaxation",
                notice: [
                    "Muscle tension or headaches",
                    "Shallow breathing",
                    "Feeling constantly \"on edge\"",
                ],
                helps: [
                    "Guided breathing exercises",
                    "Gentle stretching or warm baths (if skin allows)",
                    "Short mindfulness sessions",
                    "Listening to calming music",
                ],
            },
        ],
    },
    {
        id: "mouth",
        label: "Mouth Care",
        icon: "water-outline",
        color: "#06B6D4",
        side: 'left',
        bodyAnchorY: 60,
        haloGap: 55,
        sections: [
            {
                notice: [
                    "Mouth tenderness or dryness",
                    "Taste changes",
                    "Difficulty eating certain foods",
                ],
                helps: [
                    "Brush gently with a soft toothbrush",
                    "Rinse regularly",
                    "Choose soft or cool foods if sore",
                    "Stay hydrated",
                ],
            },
        ],
    },
    {
        id: "heart",
        label: "Heart",
        icon: "heart-outline",
        color: "#EF4444",
        side: 'right',
        bodyAnchorY: 115,
        haloGap: 55,
        sections: [
            {
                notice: [
                    "Feeling your heart race or noticing your heartbeat",
                    "A tightness in your chest",
                ],
                helps: [
                    "Sit and rest when symptoms begin",
                    "Practice slow, steady breathing",
                    "Avoid overexertion",
                    "Stay hydrated",
                ],
            },
        ],
    },
    {
        id: "eating",
        label: "Eating",
        icon: "restaurant-outline",
        color: "#10B981",
        side: 'left',
        bodyAnchorY: 158,
        haloGap: 55,
        sections: [
            {
                notice: [
                    "Low appetite or early fullness",
                    "Food tasting different",
                    "Nausea or unintended weight changes",
                ],
                helps: [
                    "Eat small snacks every few hours",
                    "Keep easy snacks nearby",
                    "Add protein when you can",
                    "Try smoothies or soups if solid food feels hard",
                ],
            },
        ],
    },
    {
        id: "skin",
        label: "Sensitive Skin",
        icon: "sunny-outline",
        color: "#F97316",
        side: 'right',
        bodyAnchorY: 200,
        haloGap: 55,
        sections: [
            {
                notice: [
                    "Skin burning more easily",
                    "Increased sensitivity to sunlight",
                    "Fatigue in heat",
                ],
                helps: [
                    "Wear sunscreen and protective clothing",
                    "Avoid peak sun hours",
                    "Rest in shaded areas",
                    "Stay hydrated outdoors",
                ],
            },
        ],
    },
    {
        id: "balance",
        label: "Balance & Coordination",
        icon: "walk-outline",
        color: "#0EA5E9",
        side: 'bottom',
        bodyAnchorY: 0,
        haloGap: 0,
        sections: [
            {
                notice: [
                    "Feeling unsteady or clumsy",
                    "Trouble with fine motor tasks",
                    "Fear of falling",
                ],
                helps: [
                    "Use nightlights",
                    "Remove loose rugs",
                    "Wear supportive shoes",
                    "Move slowly when standing",
                    "Ask for help when needed",
                ],
            },
        ],
    },
];

// ─── General Tips data ────────────────────────────────────────────────────────
const GENERAL_TIPS: GeneralTip[] = [
    {
        id: "help",
        title: "Asking for Help",
        icon: "people-outline",
        notice: [
            "Feeling overwhelmed, frustrated, or isolated",
            "Daily tasks may feel heavier than usual",
        ],
        helps: [
            "Let others cook, drive, or clean",
            "Keep a shared calendar",
            "Make a simple \"ways you can help\" list",
            "Say yes when support is offered",
            "Support is part of treatment — not a burden",
        ],
    },
    {
        id: "gentle",
        title: "Be Gentle With Yourself",
        icon: "heart-circle-outline",
        notice: [
            "Energy and mood may change day to day",
            "Some days may feel productive; others may not",
        ],
        helps: [
            "Adjust expectations",
            "Celebrate small wins",
            "Rest without guilt",
            "Remember that healing is not linear",
            "Your worth is not measured by productivity",
        ],
    },
];

// ─── Body Diagram (halo layout, containerWidth-based) ─────────────────────────
const FIGURE_PART = StyleSheet.create({
    base: { position: "absolute", backgroundColor: "#EDE9FE", borderWidth: 2.5, borderColor: "#A78BFA" },
    head:  { width: 64, height: 64, borderRadius: 32 },
    neck:  { width: 22, height: 18, borderRadius: 11 },
    torso: { width: 88, height: 108, borderRadius: 28 },
    arm:   { width: 28, height: 82, borderRadius: 14 },
    hips:  { width: 92, height: 36, borderRadius: 18 },
    leg:   { width: 38, height: 112, borderRadius: 19 },
});

function BodyDiagram({
    containerWidth,
    areas,
    onSelectArea,
}: {
    containerWidth: number;
    areas: SymptomArea[];
    onSelectArea: (area: SymptomArea) => void;
}) {
    if (!containerWidth) return null;

    const fL = (containerWidth - FIG_WIDTH) / 2; // figure left edge
    const fR = fL + FIG_WIDTH;                   // figure right edge
    const figBottom = FIG_TOP + FIG_HEIGHT;

    return (
        <View style={{ width: "100%", height: DIAGRAM_HEIGHT, position: "relative" }}>
            {/* ── Body figure ── */}
            {/* Head */}
            <View style={[FIGURE_PART.base, FIGURE_PART.head, { top: FIG_TOP, left: fL + 18 }]} />
            {/* Neck */}
            <View style={[FIGURE_PART.base, FIGURE_PART.neck,  { top: FIG_TOP + 61,  left: fL + 39 }]} />
            {/* Left arm (angled out like \) */}
            <View style={[FIGURE_PART.base, FIGURE_PART.arm,   { top: FIG_TOP + 76,  left: fL - 28, transform: [{ rotate: "12deg" }] }]} />
            {/* Torso */}
            <View style={[FIGURE_PART.base, FIGURE_PART.torso, { top: FIG_TOP + 72,  left: fL + 6  }]} />
            {/* Right arm (angled out like /) */}
            <View style={[FIGURE_PART.base, FIGURE_PART.arm,   { top: FIG_TOP + 76,  left: fL + 100, transform: [{ rotate: "-12deg" }] }]} />
            {/* Legs */}
            <View style={[FIGURE_PART.base, FIGURE_PART.leg,   { top: FIG_TOP + 178, left: fL + 8  }]} />
            <View style={[FIGURE_PART.base, FIGURE_PART.leg,   { top: FIG_TOP + 178, left: fL + 54 }]} />

            {/* ── Halo icons + connector lines ── */}
            {areas.map((area) => {
                let iconLeft: number;
                let iconTop: number;

                if (area.side === "right") {
                    const cy = FIG_TOP + area.bodyAnchorY;
                    iconLeft = fR + area.haloGap;
                    iconTop  = cy - ICON_SIZE / 2;
                } else if (area.side === "left") {
                    const cy = FIG_TOP + area.bodyAnchorY;
                    iconLeft = fL - area.haloGap - ICON_SIZE;
                    iconTop  = cy - ICON_SIZE / 2;
                } else if (area.side === "top") {
                    const cx = fL + FIG_WIDTH / 2;
                    iconLeft = cx - ICON_SIZE / 2;
                    iconTop  = 0;
                } else {
                    const cx = fL + FIG_WIDTH / 2;
                    iconLeft = cx - ICON_SIZE / 2;
                    iconTop  = FIG_TOP + 317 + 14; // 317 = actual leg bottom offset, 14px gap
                }

                // Label centered below icon
                // Label centered below icon for all sides
                const LABEL_W = ICON_SIZE + 40;
                const labelPositionStyle = {
                    left: iconLeft + (ICON_SIZE - LABEL_W) / 2,
                    top: iconTop + ICON_SIZE + 5,
                    width: LABEL_W,
                };

                return (
                    <React.Fragment key={area.id}>
                        {/* Icon circle */}
                        <TouchableOpacity
                            onPress={() => onSelectArea(area)}
                            accessibilityLabel={`${area.label} — tap for information`}
                            style={{
                                position: "absolute",
                                left: iconLeft, top: iconTop,
                                width: ICON_SIZE, height: ICON_SIZE,
                                borderRadius: ICON_SIZE / 2,
                                backgroundColor: area.color,
                                alignItems: "center", justifyContent: "center",
                                shadowColor: "#000",
                                shadowOffset: { width: 0, height: 3 },
                                shadowOpacity: 0.22, shadowRadius: 5,
                                elevation: 5, zIndex: 10,
                            }}
                        >
                            <Ionicons name={area.icon as any} size={20} color="#FFF" />
                        </TouchableOpacity>

                        {/* Label */}
                        <TouchableOpacity
                            onPress={() => onSelectArea(area)}
                            style={[{ position: "absolute", zIndex: 9 }, labelPositionStyle]}
                        >
                            <Text style={[styles.inlineLabelText, { color: area.color, textAlign: "center" }]}>
                                {area.label}
                            </Text>
                        </TouchableOpacity>
                    </React.Fragment>
                );
            })}
        </View>
    );
}

// ─── Expanded Card Modal ──────────────────────────────────────────────────────
function ExpandedCardModal({
    visible,
    area,
    onClose,
    isSpeaking,
    isLoadingAudio,
    onToggleSpeak,
    playbackRate,
    onTogglePlaybackRate,
}: {
    visible: boolean;
    area: SymptomArea | null;
    onClose: () => void;
    isSpeaking: boolean;
    isLoadingAudio: boolean;
    onToggleSpeak: () => void;
    playbackRate: number;
    onTogglePlaybackRate: () => void;
}) {
    const { isDark, colors } = useTheme();
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
            }, 1000);
            return () => clearTimeout(timer);
        } else {
            scaleAnim.setValue(0.8);
            opacityAnim.setValue(0);
            flipAnim.setValue(0);
            underlineAnim.setValue(0);
        }
    }, [visible, area]);

    const handleClose = () => {
        Animated.parallel([
            Animated.timing(scaleAnim, { toValue: 0.8, duration: 150, useNativeDriver: true }),
            Animated.timing(opacityAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
        ]).start(() => onClose());
    };

    if (!area) return null;

    const color = area.color;
    const frontRotate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] });
    const backRotate  = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ["180deg", "360deg"] });
    const frontOpacity = flipAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0, 0] });
    const backOpacity  = flipAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0, 1] });
    const cardHeight   = flipAnim.interpolate({ inputRange: [0, 1], outputRange: [FRONT_HEIGHT, BACK_HEIGHT] });
    const underlineWidth = underlineAnim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });

    const content = (
        <View style={styles.modalOverlay} pointerEvents="box-none">
            <Pressable style={StyleSheet.absoluteFill} onPress={handleClose}>
                <Animated.View style={[styles.modalBackdrop, { opacity: opacityAnim }]} />
            </Pressable>

            <Animated.View style={[styles.expandedContainer, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
                {/* Front */}
                <Animated.View style={[styles.cardShadow, {
                    transform: [{ perspective: 1000 }, { rotateY: frontRotate }],
                    opacity: frontOpacity, height: cardHeight,
                }]}>
                    <View style={[styles.card, { height: "100%", backgroundColor: color, borderColor: color }]}>
                        <View style={styles.frontInner}>
                            <View style={[styles.frontIconCircle, { backgroundColor: "rgba(255,255,255,0.25)" }]}>
                                <Ionicons name={area.icon as any} size={36} color="#FFF" />
                            </View>
                            <Text style={styles.frontTitle}>{area.label}</Text>
                            <Text style={styles.flipHint}>Flip for details →</Text>
                        </View>
                    </View>
                </Animated.View>

                {/* Back */}
                <Animated.View style={[styles.cardShadow, styles.backSide, {
                    transform: [{ perspective: 1000 }, { rotateY: backRotate }],
                    opacity: backOpacity, height: cardHeight,
                }]}>
                    <View style={[styles.card, { height: "100%", backgroundColor: isDark ? colors.backgroundLight : "#FFFFFF", borderColor: color }]}>
                        <View style={styles.backInner}>
                            {/* Header row */}
                            <View style={styles.backHeaderRow}>
                                <View>
                                    <Text style={[styles.backLabel, { color }]}>{area.label}</Text>
                                    <Animated.View style={{ height: 3, backgroundColor: color, width: underlineWidth, borderRadius: 2, marginTop: 3 }} />
                                </View>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                    {isSpeaking && (
                                        <TouchableOpacity onPress={onTogglePlaybackRate} hitSlop={10}>
                                            <Text style={{ fontSize: 12, fontWeight: "700", color }}>{playbackRate}x</Text>
                                        </TouchableOpacity>
                                    )}
                                    <TouchableOpacity
                                        onPress={onToggleSpeak}
                                        style={styles.speakerBtn}
                                        disabled={isLoadingAudio}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        {isLoadingAudio ? (
                                            <ActivityIndicator size="small" color={color} />
                                        ) : (
                                            <Ionicons
                                                name={isSpeaking ? "stop-circle-outline" : "volume-high-outline"}
                                                size={26}
                                                color={isSpeaking ? "#FF6B6B" : "#2D2D44"}
                                            />
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
                                {area.sections.map((section, sIdx) => (
                                    <View key={sIdx} style={{ marginBottom: sIdx < area.sections.length - 1 ? 18 : 0 }}>
                                        {section.heading && (
                                            <Text style={[styles.sectionHeading, { color }]}>{section.heading}</Text>
                                        )}
                                        {/* Notice */}
                                        <View style={[styles.sectionBox, { backgroundColor: color + "10", borderColor: color + "30" }]}>
                                            <View style={styles.sectionLabelRow}>
                                                <Ionicons name="eye-outline" size={13} color={color} />
                                                <Text style={[styles.sectionLabel, { color }]}>What you might notice</Text>
                                            </View>
                                            {section.notice.map((item, i) => (
                                                <View key={i} style={styles.bulletRow}>
                                                    <View style={[styles.bullet, { backgroundColor: color }]} />
                                                    <Text style={styles.bulletText}>{item}</Text>
                                                </View>
                                            ))}
                                        </View>
                                        {/* Helps */}
                                        <View style={[styles.sectionBox, { backgroundColor: "#F0FDF4", borderColor: "#BBF7D0", marginTop: 8 }]}>
                                            <View style={styles.sectionLabelRow}>
                                                <Ionicons name="checkmark-circle-outline" size={13} color="#10B981" />
                                                <Text style={[styles.sectionLabel, { color: "#10B981" }]}>What helps</Text>
                                            </View>
                                            {section.helps.map((item, i) => (
                                                <View key={i} style={styles.bulletRow}>
                                                    <View style={[styles.bullet, { backgroundColor: "#10B981" }]} />
                                                    <Text style={styles.bulletText}>{item}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                ))}
                            </ScrollView>
                        </View>
                    </View>
                </Animated.View>
            </Animated.View>
        </View>
    );

    if (Platform.OS === "web") {
        if (!visible) return null;
        return <View style={StyleSheet.absoluteFill} pointerEvents="box-none">{content}</View>;
    }
    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
            {content}
        </Modal>
    );
}

// ─── General Tip Accordion Item ───────────────────────────────────────────────
function TipAccordion({ tip }: { tip: GeneralTip }) {
    const [expanded, setExpanded] = useState(false);
    const heightAnim = useRef(new Animated.Value(0)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;

    const toggle = () => {
        const toValue = expanded ? 0 : 1;
        Animated.parallel([
            Animated.spring(heightAnim, { toValue, friction: 10, tension: 60, useNativeDriver: false }),
            Animated.timing(rotateAnim, { toValue, duration: 200, useNativeDriver: true }),
        ]).start();
        setExpanded(!expanded);
    };

    const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] });

    return (
        <View style={tipStyles.wrapper}>
            <TouchableOpacity style={tipStyles.header} onPress={toggle} activeOpacity={0.8}>
                <View style={[tipStyles.iconCircle, { backgroundColor: PAGE_COLOR + "18" }]}>
                    <Ionicons name={tip.icon as any} size={20} color={PAGE_COLOR} />
                </View>
                <Text style={tipStyles.title}>{tip.title}</Text>
                <Animated.View style={{ transform: [{ rotate }] }}>
                    <Ionicons name="chevron-down" size={20} color="#6B6B85" />
                </Animated.View>
            </TouchableOpacity>

            {expanded && (
                <View style={tipStyles.body}>
                    <View style={[styles.sectionBox, { backgroundColor: PAGE_COLOR + "08", borderColor: PAGE_COLOR + "25" }]}>
                        <View style={styles.sectionLabelRow}>
                            <Ionicons name="eye-outline" size={13} color={PAGE_COLOR} />
                            <Text style={[styles.sectionLabel, { color: PAGE_COLOR }]}>What you might notice</Text>
                        </View>
                        {tip.notice.map((item, i) => (
                            <View key={i} style={styles.bulletRow}>
                                <View style={[styles.bullet, { backgroundColor: PAGE_COLOR }]} />
                                <Text style={styles.bulletText}>{item}</Text>
                            </View>
                        ))}
                    </View>
                    <View style={[styles.sectionBox, { backgroundColor: "#F0FDF4", borderColor: "#BBF7D0", marginTop: 8 }]}>
                        <View style={styles.sectionLabelRow}>
                            <Ionicons name="checkmark-circle-outline" size={13} color="#10B981" />
                            <Text style={[styles.sectionLabel, { color: "#10B981" }]}>What helps</Text>
                        </View>
                        {tip.helps.map((item, i) => (
                            <View key={i} style={styles.bulletRow}>
                                <View style={[styles.bullet, { backgroundColor: "#10B981" }]} />
                                <Text style={styles.bulletText}>{item}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            )}
        </View>
    );
}

const tipStyles = StyleSheet.create({
    wrapper: {
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#E5E3F8",
        backgroundColor: "#FAFAFE",
        marginBottom: 10,
        overflow: "hidden",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        padding: 16,
    },
    iconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
    },
    title: {
        flex: 1,
        fontSize: 15,
        fontWeight: "700",
        color: "#2D2D44",
    },
    body: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ManagingSymptomsScreen() {
    const { selectedVoice } = useOnboarding();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { fireResourceOpened, fireResourceScrolledToEnd, fireEvent } = useAccomplishments();

    const [expandedArea, setExpandedArea] = useState<SymptomArea | null>(null);
    const [scrolledToEnd, setScrolledToEnd] = useState(false);
    const [diagramWidth, setDiagramWidth] = useState(0);

    // Accomplishments
    useEffect(() => {
        const timer = setTimeout(() => {
            fireResourceOpened(RESOURCE_ID);
        }, 10_000);
        return () => clearTimeout(timer);
    }, [fireResourceOpened]);

    const handleScroll = ({ nativeEvent }: any) => {
        const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
        if (!scrolledToEnd && layoutMeasurement.height + contentOffset.y >= contentSize.height - 40) {
            setScrolledToEnd(true);
            fireResourceScrolledToEnd(RESOURCE_ID);
        }
    };

    // Card TTS
    const player = useAudioPlayer();
    const playerStatus = useAudioPlayerStatus(player);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isLoadingAudio, setIsLoadingAudio] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1.0);
    const currentAreaIdRef = useRef<string | null>(null);

    useEffect(() => {
        if (playerStatus.isLoaded && playerStatus.didJustFinish) {
            setIsSpeaking(false);
            player.seekTo(0);
        }
    }, [playerStatus.isLoaded, playerStatus.didJustFinish]);

    const togglePlaybackRate = () => {
        let next = 1.0;
        if (playbackRate === 1.0) next = 1.25;
        else if (playbackRate === 1.25) next = 1.5;
        else if (playbackRate === 1.5) next = 2.0;
        setPlaybackRate(next);
        if (playerStatus.isLoaded) player.setPlaybackRate(next);
    };

    const handleSpeak = async () => {
        if (!expandedArea) return;

        if (isSpeaking) {
            player.pause();
            setIsSpeaking(false);
            return;
        }

        if (playerStatus.isLoaded && currentAreaIdRef.current === expandedArea.id) {
            player.play();
            setIsSpeaking(true);
            return;
        }

        currentAreaIdRef.current = expandedArea.id;
        setIsSpeaking(true);
        setIsLoadingAudio(true);
        try {
            // Build text from structured sections
            let text = expandedArea.label + ". ";
            expandedArea.sections.forEach((s) => {
                if (s.heading) text += s.heading + ". ";
                text += "What you might notice: " + s.notice.join(". ") + ". ";
                text += "What helps: " + s.helps.join(". ") + ". ";
            });
            const audioUri = await generateSpeech(text, selectedVoice);
            if (audioUri) {
                player.replace(audioUri);
                player.play();
            } else {
                setIsSpeaking(false);
                currentAreaIdRef.current = null;
            }
        } catch (e) {
            console.error("Audio error:", e);
            setIsSpeaking(false);
            currentAreaIdRef.current = null;
        } finally {
            setIsLoadingAudio(false);
        }
    };

    const closeCard = () => {
        player.pause();
        setIsSpeaking(false);
        currentAreaIdRef.current = null;
        setExpandedArea(null);
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: 'Check out "Tips for Managing Symptoms" on SchoolKit — practical guidance for understanding and managing treatment-related symptoms.',
            });
            fireEvent("resource_shared");
        } catch { }
    };

    // Entrance animations
    const titleFade  = useRef(new Animated.Value(0)).current;
    const titleSlide = useRef(new Animated.Value(20)).current;
    const introFade  = useRef(new Animated.Value(0)).current;
    const introSlide = useRef(new Animated.Value(20)).current;
    const diagFade   = useRef(new Animated.Value(0)).current;
    const diagSlide  = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        [
            { fade: titleFade,  slide: titleSlide,  delay: 0 },
            { fade: introFade,  slide: introSlide,  delay: 120 },
            { fade: diagFade,   slide: diagSlide,   delay: 260 },
        ].forEach(({ fade, slide, delay }) => {
            Animated.sequence([
                Animated.delay(delay),
                Animated.parallel([
                    Animated.timing(fade,  { toValue: 1, duration: 500, useNativeDriver: true }),
                    Animated.spring(slide, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }),
                ]),
            ]).start();
        });
    }, []);

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
                    <DownloadButton resourceId={RESOURCE_ID} size={28} color={PAGE_COLOR} />
                    <BookmarkButton resourceId={RESOURCE_ID} size={28} color={PAGE_COLOR} />
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={100}
            >
                {/* Title */}
                <Animated.View style={{ opacity: titleFade, transform: [{ translateY: titleSlide }] }}>
                    <Text style={styles.pageTitle}>
                        Tips for{" "}
                        <Text style={{ color: PAGE_COLOR }}>Managing Symptoms</Text>
                    </Text>
                </Animated.View>

                {/* Intro paragraphs */}
                <Animated.View style={{ opacity: introFade, transform: [{ translateY: introSlide }] }}>
                    <Text style={styles.introPara}>
                        Your body is going through a lot right now. Cancer and its treatments can affect many different parts of your body. You are not weak for feeling tired, uncomfortable, or overwhelmed.
                    </Text>

                    {/* Emergency callout */}
                    <View style={styles.callout}>
                        <View style={styles.calloutIconRow}>
                            <Ionicons name="alert-circle" size={20} color="#EF4444" />
                            <Text style={styles.calloutTitle}>Important</Text>
                        </View>
                        <Text style={styles.calloutText}>
                            If you ever feel very unwell or have any symptoms your care team instructed you to call them about, contact your care team right away or go to the nearest emergency department.
                        </Text>
                    </View>
                </Animated.View>

                {/* Body Diagram */}
                <Animated.View style={{ opacity: diagFade, transform: [{ translateY: diagSlide }] }}>
                    <Text style={styles.sectionTitle}>Tap a body area to learn more about symptom areas</Text>

                    {/* Diagram */}
                    <View
                        style={[styles.diagramContainer, { height: DIAGRAM_HEIGHT }]}
                        onLayout={(e) => setDiagramWidth(e.nativeEvent.layout.width)}
                    >
                        <BodyDiagram
                            containerWidth={diagramWidth}
                            areas={SYMPTOM_AREAS}
                            onSelectArea={setExpandedArea}
                        />
                    </View>
                </Animated.View>

                {/* General Tips */}
                <View style={styles.generalTipsSection}>
                    <View style={[styles.generalTipsHeader, { backgroundColor: PAGE_COLOR }]}>
                        <Ionicons name="sparkles" size={18} color="#FFF" />
                        <Text style={styles.generalTipsTitle}>General Tips & Considerations</Text>
                    </View>
                    <View style={styles.generalTipsBody}>
                        {GENERAL_TIPS.map((tip) => (
                            <TipAccordion key={tip.id} tip={tip} />
                        ))}
                    </View>
                </View>

                {/* Recommendations */}
                <RecommendationList
                    currentId={RESOURCE_ID}
                    currentTags={["health", "symptoms", "cancer", "treatment", "managing"]}
                />
            </ScrollView>

            {/* Expanded card modal */}
            <ExpandedCardModal
                visible={expandedArea !== null}
                area={expandedArea}
                onClose={closeCard}
                isSpeaking={isSpeaking}
                isLoadingAudio={isLoadingAudio}
                onToggleSpeak={handleSpeak}
                playbackRate={playbackRate}
                onTogglePlaybackRate={togglePlaybackRate}
            />
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FAFAF8",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 24,
        paddingBottom: 16,
        backgroundColor: "#FFFFFF",
        borderBottomWidth: 1,
        borderBottomColor: "#F0F0F0",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
        zIndex: 10,
    },
    backButton: { padding: 8, marginLeft: -8 },
    scrollContent: {
        paddingBottom: 48,
    },
    pageTitle: {
        fontSize: 28,
        fontWeight: "800",
        color: "#2D2D44",
        letterSpacing: -0.5,
        lineHeight: 36,
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 4,
    },
    introPara: {
        fontSize: 15,
        color: "#4B4B6A",
        lineHeight: 24,
        paddingHorizontal: 24,
        marginTop: 12,
    },
    callout: {
        marginHorizontal: 24,
        marginTop: 16,
        padding: 14,
        borderRadius: 14,
        backgroundColor: "#FFF5F5",
        borderWidth: 1.5,
        borderColor: "#FCA5A5",
    },
    calloutIconRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: 6,
    },
    calloutTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: "#EF4444",
    },
    calloutText: {
        fontSize: 14,
        color: "#7F1D1D",
        lineHeight: 21,
        fontWeight: "500",
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#2D2D44",
        paddingHorizontal: 24,
        marginTop: 28,
        marginBottom: 4,
    },
    diagramContainer: {
        width: "100%",
        position: "relative",
        marginTop: 8,
    },
    inlineLabelText: {
        fontSize: 11,
        fontWeight: "700",
        lineHeight: 15,
    },
    generalTipsSection: {
        marginHorizontal: 24,
        marginTop: 32,
        borderRadius: 20,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "#E5E3F8",
    },
    generalTipsHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        padding: 16,
    },
    generalTipsTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: "#FFF",
    },
    generalTipsBody: {
        padding: 12,
        backgroundColor: "#FFFFFF",
    },
    // Shared section/bullet styles (used in modal + accordion)
    sectionBox: {
        borderWidth: 1,
        borderRadius: 10,
        padding: 10,
    },
    sectionLabelRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        marginBottom: 6,
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: 0.4,
    },
    bulletRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 8,
        marginBottom: 5,
    },
    bullet: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginTop: 8,
        flexShrink: 0,
    },
    bulletText: {
        fontSize: 15,
        color: "#2D2D44",
        lineHeight: 22,
        flex: 1,
    },
    sectionHeading: {
        fontSize: 15,
        fontWeight: "700",
        marginBottom: 6,
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    modalBackdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.52)",
    },
    expandedContainer: {
        width: "88%",
        maxWidth: 520,
        maxHeight: SCREEN_HEIGHT * 0.72,
    },
    cardShadow: {
        width: "100%",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.28,
        shadowRadius: 20,
        elevation: 14,
    },
    card: {
        width: "100%",
        borderRadius: 28,
        borderWidth: 3,
        overflow: "hidden",
        backfaceVisibility: "hidden",
    },
    backSide: {
        position: "absolute",
        top: 0, left: 0, right: 0,
    },
    frontInner: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 28,
        gap: 12,
    },
    frontIconCircle: {
        width: 68,
        height: 68,
        borderRadius: 34,
        alignItems: "center",
        justifyContent: "center",
    },
    frontTitle: {
        fontSize: 22,
        fontWeight: "800",
        color: "#FFF",
        textAlign: "center",
        letterSpacing: -0.3,
    },
    flipHint: {
        fontSize: 15,
        color: "rgba(255,255,255,0.75)",
        fontWeight: "500",
    },
    backInner: {
        flex: 1,
        padding: 20,
        overflow: "hidden",
    },
    backHeaderRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 14,
    },
    backLabel: {
        fontSize: 19,
        fontWeight: "800",
        letterSpacing: -0.3,
    },
    speakerBtn: { padding: 6 },
});
