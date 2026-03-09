import React, { useState, useRef, useEffect, useMemo } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Animated,
    Share,
    ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { generateSpeech } from "../services/elevenLabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useOnboarding } from "../contexts/OnboardingContext";
import { BookmarkButton } from "../components/BookmarkButton";
import { RecommendationList } from "../components/RecommendationList";
import { DownloadButton } from "../components/DownloadButton";
import { useTheme } from "../contexts/ThemeContext";

const PAGE_COLOR = "#E8734A";
const RESOURCE_ID = "16";

type NumberedItem = { icon: string; text: string };

const STAYING_CONNECTED: NumberedItem[] = [
    { icon: "videocam-outline", text: "Video calls with family" },
    { icon: "color-palette-outline", text: "Making drawings or crafts" },
    { icon: "images-outline", text: "Keeping a digital photo album" },
];

const PERSONALIZING_ROOM: NumberedItem[] = [
    { icon: "image-outline", text: "Bring photos and art from home" },
    { icon: "bed-outline", text: "Bring comfort items (stuffed animal, own pillowcases, sheets)" },
    { icon: "star-outline", text: "Light and glow decor" },
];

const CONTACTS_1 = ["Child Life Specialist", "Nursing Staff", "Social Worker", "Family Support Team"];
const CONTACTS_2 = ["Child Life Specialist", "Nursing Staff", "Social Worker", "Volunteer Coordinator"];

// ─── Video Placeholder (section 1 only) ──────────────────────────────────────
function VideoPlaceholder({ icon }: { icon: string }) {
    return (
        <View style={vidStyles.wrapper}>
            <View style={vidStyles.box}>
                <View style={vidStyles.iconCircle}>
                    <Ionicons name={icon as any} size={36} color={PAGE_COLOR} />
                </View>
                <View style={vidStyles.badge}>
                    <Ionicons name="play-circle-outline" size={14} color="#FFF" style={{ marginRight: 4 }} />
                    <Text style={vidStyles.badgeText}>Video Coming Soon</Text>
                </View>
            </View>
        </View>
    );
}
const vidStyles = StyleSheet.create({
    wrapper: { flex: 1, paddingHorizontal: 6 },
    box: {
        backgroundColor: "#FFF8F5", borderRadius: 20, borderWidth: 2,
        borderColor: PAGE_COLOR + "40", borderStyle: "dashed",
        paddingVertical: 28, paddingHorizontal: 16,
        alignItems: "center", justifyContent: "center", minHeight: 160,
    },
    iconCircle: {
        width: 64, height: 64, borderRadius: 32,
        backgroundColor: PAGE_COLOR + "18",
        alignItems: "center", justifyContent: "center", marginBottom: 16,
    },
    badge: { flexDirection: "row", alignItems: "center", backgroundColor: PAGE_COLOR, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
    badgeText: { fontSize: 11, fontWeight: "700", color: "#FFF" },
});

// ─── Illustration: Video Call Scene ──────────────────────────────────────────
function VideoCallIllustration() {
    return (
        <View style={illCard.frame}>
            <View style={[illCard.iconCircle, { backgroundColor: "#D0EEF8" }]}>
                <Ionicons name="videocam" size={32} color="#2A9DC8" />
            </View>
            <View style={illCard.iconRow}>
                <View style={[illCard.smallCircle, { backgroundColor: "#E8F5E9" }]}>
                    <Ionicons name="person" size={16} color="#4CAF50" />
                </View>
                <Ionicons name="arrow-forward" size={14} color={PAGE_COLOR + "80"} />
                <View style={[illCard.smallCircle, { backgroundColor: "#FFF3E0" }]}>
                    <Ionicons name="people" size={16} color="#FF9800" />
                </View>
            </View>
            <Text style={illCard.label}>Calling family</Text>
        </View>
    );
}

// ─── Illustration: Personalised Hospital Room ─────────────────────────────────
function PersonalizedRoomIllustration() {
    return (
        <View style={[illCard.frame, { backgroundColor: "#FFF8F2" }]}>
            <View style={[illCard.iconCircle, { backgroundColor: "#FFE8D6" }]}>
                <Ionicons name="home" size={32} color={PAGE_COLOR} />
            </View>
            <View style={illCard.iconRow}>
                <View style={[illCard.smallCircle, { backgroundColor: "#FCE4EC" }]}>
                    <Ionicons name="image" size={16} color="#E91E8C" />
                </View>
                <View style={[illCard.smallCircle, { backgroundColor: "#F3E5F5" }]}>
                    <Ionicons name="star" size={16} color="#9C27B0" />
                </View>
                <View style={[illCard.smallCircle, { backgroundColor: "#E8F5E9" }]}>
                    <Ionicons name="heart" size={16} color="#4CAF50" />
                </View>
            </View>
            <Text style={illCard.label}>Your space, your way</Text>
        </View>
    );
}

const illCard = StyleSheet.create({
    frame: {
        flex: 2,
        borderRadius: 22,
        borderWidth: 2,
        borderColor: PAGE_COLOR + "30",
        backgroundColor: "#EDF7FC",
        alignItems: "center",
        justifyContent: "center",
        padding: 14,
        gap: 12,
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: "center",
        justifyContent: "center",
    },
    iconRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    smallCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    label: {
        fontSize: 11,
        fontWeight: "600",
        color: "#8E8EA8",
        textAlign: "center",
    },
});

// ─── Shared flip helpers ──────────────────────────────────────────────────────
function useFlip() {
    const [flipped, setFlipped] = useState(false);
    const anim = useRef(new Animated.Value(0)).current;
    const toggle = () => {
        Animated.spring(anim, { toValue: flipped ? 0 : 1, friction: 8, tension: 10, useNativeDriver: false }).start();
        setFlipped(f => !f);
    };
    const frontRotate = anim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] });
    const backRotate = anim.interpolate({ inputRange: [0, 1], outputRange: ["180deg", "360deg"] });
    const frontOpacity = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0, 0] });
    const backOpacity = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0, 1] });
    return { toggle, frontRotate, backRotate, frontOpacity, backOpacity, flipped };
}

function FlipHint({ label }: { label: string }) {
    return (
        <View style={sharedFlip.hint}>
            <Ionicons name="refresh-outline" size={13} color={PAGE_COLOR} style={{ marginRight: 4 }} />
            <Text style={sharedFlip.hintText}>{label}</Text>
        </View>
    );
}

function ContactsBack({ contacts, flipped }: { contacts: string[]; flipped: boolean }) {
    return (
        <>
            <Text style={sharedFlip.backTitle}>Need Help? Contact:</Text>
            <View style={sharedFlip.list}>
                {contacts.map((c, i) => (
                    <View key={i} style={sharedFlip.row}>
                        <View style={sharedFlip.bullet}>
                            <Ionicons name="person-outline" size={11} color="#FFF" />
                        </View>
                        <Text style={sharedFlip.contact}>{c}</Text>
                    </View>
                ))}
            </View>
            <FlipHint label={flipped ? "Tap to go back" : "Tap for Help Contacts"} />
        </>
    );
}

const sharedFlip = StyleSheet.create({
    hint: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingTop: 6 },
    hintText: { fontSize: 11, fontWeight: "600", color: PAGE_COLOR, opacity: 0.75 },
    backTitle: { fontSize: 14, fontWeight: "800", color: "#2D2D44", letterSpacing: -0.2, marginBottom: 8 },
    list: { flex: 1, justifyContent: "center", gap: 8 },
    row: { flexDirection: "row", alignItems: "center", gap: 8 },
    bullet: { width: 22, height: 22, borderRadius: 11, backgroundColor: PAGE_COLOR, alignItems: "center", justifyContent: "center", flexShrink: 0 },
    contact: { fontSize: 12, fontWeight: "600", color: "#2D2D44", flex: 1 },
});

// ─── List Flip Card — numbered list front, contacts back ──────────────────────
function ListFlipCard({ items, contacts, style }: { items: NumberedItem[]; contacts: string[]; style?: object }) {
    const { toggle, frontRotate, backRotate, frontOpacity, backOpacity, flipped } = useFlip();
    return (
        <TouchableOpacity activeOpacity={0.95} onPress={toggle} style={[listFlip.container, style]}>
            <View style={listFlip.inner}>
                <Animated.View style={[listFlip.card, listFlip.front, { transform: [{ perspective: 1000 }, { rotateY: frontRotate }], opacity: frontOpacity }]}>
                    <View style={listFlip.itemList}>
                        {items.map((item, idx) => (
                            <View key={idx} style={listFlip.itemRow}>
                                <View style={listFlip.badge}><Text style={listFlip.badgeText}>{idx + 1}</Text></View>
                                <View style={listFlip.iconCircle}>
                                    <Ionicons name={item.icon as any} size={14} color={PAGE_COLOR} />
                                </View>
                                <Text style={listFlip.itemText} numberOfLines={2}>{item.text}</Text>
                            </View>
                        ))}
                    </View>
                    <FlipHint label="Tap for Help Contacts" />
                </Animated.View>
                <Animated.View style={[listFlip.card, listFlip.back, { transform: [{ perspective: 1000 }, { rotateY: backRotate }], opacity: backOpacity, backfaceVisibility: "hidden" }]}>
                    <ContactsBack contacts={contacts} flipped={flipped} />
                </Animated.View>
            </View>
        </TouchableOpacity>
    );
}

const listFlip = StyleSheet.create({
    container: { flex: 3 },
    inner: { height: 240 },
    card: {
        borderRadius: 22, borderWidth: 2, borderColor: PAGE_COLOR + "40",
        padding: 16, height: 240,
        shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
        backfaceVisibility: "hidden", justifyContent: "space-between",
    },
    front: { backgroundColor: "#FFF8F5", position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
    back: { backgroundColor: "#FFFFFF", position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
    itemList: { flex: 1, justifyContent: "center", gap: 10 },
    itemRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    badge: { width: 24, height: 24, borderRadius: 12, backgroundColor: PAGE_COLOR, alignItems: "center", justifyContent: "center", flexShrink: 0 },
    badgeText: { fontSize: 12, fontWeight: "800", color: "#FFF" },
    iconCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: PAGE_COLOR + "18", alignItems: "center", justifyContent: "center", flexShrink: 0 },
    itemText: { fontSize: 12, fontWeight: "500", color: "#2D2D44", flex: 1, lineHeight: 17 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function CopingAwayFromHomeScreen() {
    const { selectedVoice } = useOnboarding();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { fontScale } = useTheme();
    const fs = (size: number) => Math.round(size * fontScale);

    const pagePlayer = useAudioPlayer();
    const pagePlayerStatus = useAudioPlayerStatus(pagePlayer);
    const [isPageSpeaking, setIsPageSpeaking] = useState(false);
    const [isPageLoadingAudio, setIsPageLoadingAudio] = useState(false);

    const titleFade = useRef(new Animated.Value(0)).current;
    const titleSlide = useRef(new Animated.Value(20)).current;
    const quoteFade = useRef(new Animated.Value(0)).current;
    const quoteSlide = useRef(new Animated.Value(20)).current;
    const s1Fade = useRef(new Animated.Value(0)).current;
    const s1Slide = useRef(new Animated.Value(20)).current;
    const s2Fade = useRef(new Animated.Value(0)).current;
    const s2Slide = useRef(new Animated.Value(20)).current;
    const s3Fade = useRef(new Animated.Value(0)).current;
    const s3Slide = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        [
            { fade: titleFade, slide: titleSlide, delay: 0 },
            { fade: quoteFade, slide: quoteSlide, delay: 120 },
            { fade: s1Fade, slide: s1Slide, delay: 240 },
            { fade: s2Fade, slide: s2Slide, delay: 360 },
            { fade: s3Fade, slide: s3Slide, delay: 480 },
        ].forEach(({ fade, slide, delay }) => {
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
        if (pagePlayerStatus.isLoaded && pagePlayerStatus.didJustFinish) {
            setIsPageSpeaking(false);
            pagePlayer.seekTo(0);
        }
    }, [pagePlayerStatus.isLoaded, pagePlayerStatus.didJustFinish]);

    const handlePageSpeak = async () => {
        if (isPageSpeaking) { pagePlayer.pause(); setIsPageSpeaking(false); return; }
        setIsPageSpeaking(true);
        if (pagePlayerStatus.isLoaded) { pagePlayer.play(); return; }
        try {
            setIsPageLoadingAudio(true);
            const text = `Coping When Away From Home. It is natural to feel out of place when being away from home for treatment. You are not alone, and we're here to help you feel a little more at home. Staying Connected with Home: Video calls with family. Making drawings or crafts. Keeping a digital photo album. From Hospital Room to YOUR Hospital Room: Bring photos and art from home. Bring comfort items like a stuffed animal, your own pillowcases, or sheets. Light and glow decor.`;
            const audioUri = await generateSpeech(text, selectedVoice);
            if (audioUri) { pagePlayer.replace(audioUri); pagePlayer.play(); }
            else { setIsPageSpeaking(false); }
        } catch (e) {
            setIsPageSpeaking(false);
        } finally {
            setIsPageLoadingAudio(false);
        }
    };

    const handleShare = async () => {
        try { await Share.share({ message: 'Check out "Coping When Away From Home" on SchoolKit — tips for staying connected and making your hospital room feel more like home.' }); } catch { }
    };

    const styles = useMemo(() => makeStyles(fs), [fontScale]);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton} accessibilityLabel="Go back">
                    <Ionicons name="arrow-back" size={28} color="#2D2D44" />
                </TouchableOpacity>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <TouchableOpacity onPress={handleShare} style={{ padding: 4 }}>
                        <Ionicons name="share-outline" size={28} color="#6B6B85" />
                    </TouchableOpacity>
                    <DownloadButton resourceId={RESOURCE_ID} size={28} color={PAGE_COLOR} />
                    <BookmarkButton resourceId={RESOURCE_ID} size={28} color={PAGE_COLOR} />
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Title */}
                <Animated.View style={{ opacity: titleFade, transform: [{ translateY: titleSlide }] }}>
                    <TouchableOpacity onPress={handlePageSpeak} style={{ position: 'absolute', top: 10, right: 0, padding: 4, zIndex: 1 }} accessibilityLabel={isPageSpeaking ? "Pause reading" : "Read aloud"}>
                        {isPageLoadingAudio
                            ? <ActivityIndicator size="small" color={PAGE_COLOR} />
                            : <Ionicons name={isPageSpeaking ? "pause-circle" : "volume-high"} size={24} color={isPageSpeaking ? PAGE_COLOR : "#6B6B85"} />
                        }
                    </TouchableOpacity>
                    <Text style={styles.pageTitle}>
                        Coping When <Text style={{ color: PAGE_COLOR }}>Away From Home</Text>
                    </Text>
                </Animated.View>

                {/* Quote */}
                <Animated.View style={[styles.quoteCard, { opacity: quoteFade, transform: [{ translateY: quoteSlide }] }]}>
                    <Ionicons name="chatbubble-ellipses-outline" size={22} color={PAGE_COLOR} style={{ marginBottom: 8, opacity: 0.6 }} />
                    <Text style={styles.quoteText}>{"\u201C"}Where we love is home, home that our feet may leave, but not our hearts.{"\u201D"}</Text>
                    <Text style={styles.quoteAuthor}>{"\u2014"} Oliver Wendell Holmes Sr.</Text>
                </Animated.View>

                {/* ── Section 1: Home vs Hospital ── */}
                <Animated.View style={{ opacity: s1Fade, transform: [{ translateY: s1Slide }] }}>
                    <Text style={styles.sectionTitle}>Home and Hospital</Text>
                    <Text style={styles.sectionSubtitle}>Two very different spaces, but both can feel safe.</Text>
                    <View style={styles.videoRow}>
                        <VideoPlaceholder icon="home" />
                        <VideoPlaceholder icon="medical" />
                    </View>
                </Animated.View>

                {/* ── Section 2: Introduction ── */}
                <Animated.View style={[styles.introCard, { opacity: s2Fade, transform: [{ translateY: s2Slide }] }]}>
                    <View style={[styles.introAccent, { backgroundColor: PAGE_COLOR }]} />
                    <View style={styles.introContent}>
                        <Text style={styles.introText}>
                            It is natural to feel{" "}
                            <Text style={{ fontWeight: "700", color: PAGE_COLOR }}>"out of place"</Text>
                            {" "}when being away from home for treatment.
                        </Text>
                        <Text style={[styles.introText, { marginTop: 10 }]}>
                            You are <Text style={{ fontWeight: "700" }}>not alone</Text>, and we're here to help you feel a little more at home. 💛
                        </Text>
                    </View>
                </Animated.View>

                {/* ── Section 3: Staying Connected ── */}
                <Animated.View style={{ opacity: s2Fade, transform: [{ translateY: s2Slide }] }}>
                    <Text style={[styles.sectionTitle, { marginTop: 4 }]}>Staying Connected with Home</Text>
                    <Text style={styles.sectionSubtitle}>Small rituals can make a big difference.</Text>
                    <View style={styles.sideBySideRow}>
                        {/* List flip card (left) */}
                        <ListFlipCard items={STAYING_CONNECTED} contacts={CONTACTS_1} style={{}} />
                        {/* Cartoon illustration (right, static) */}
                        <VideoCallIllustration />
                    </View>
                </Animated.View>

                {/* ── Section 4: YOUR Hospital Room ── */}
                <Animated.View style={{ opacity: s3Fade, transform: [{ translateY: s3Slide }] }}>
                    <Text style={[styles.sectionTitle, { marginTop: 28 }]}>
                        From Hospital Room to <Text style={{ color: PAGE_COLOR }}>YOUR</Text> Hospital Room
                    </Text>
                    <Text style={styles.sectionSubtitle}>Make it yours — bring a little home with you.</Text>
                    <View style={styles.sideBySideRow}>
                        {/* List flip card (left) */}
                        <ListFlipCard items={PERSONALIZING_ROOM} contacts={CONTACTS_2} style={{}} />
                        {/* Cartoon illustration (right, static) */}
                        <PersonalizedRoomIllustration />
                    </View>
                </Animated.View>

                <RecommendationList
                    currentId={RESOURCE_ID}
                    currentTags={["home", "hospital", "coping", "family", "comfort", "connected"]}
                />
            </ScrollView>
        </View>
    );
}

function makeStyles(fs: (n: number) => number) {
    return StyleSheet.create({
        container: { flex: 1, backgroundColor: "#FAFAFD" },
        header: {
            flexDirection: "row", alignItems: "center", justifyContent: "space-between",
            paddingHorizontal: 24, paddingBottom: 20, backgroundColor: "#FFFFFF",
            borderBottomWidth: 1, borderBottomColor: "#F0F0F0",
            shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05, shadowRadius: 8, elevation: 3, zIndex: 1000,
        },
        backButton: { padding: 8, marginLeft: -8 },
        scrollContent: { padding: 24, paddingBottom: 80 },

        pageTitle: {
            fontSize: fs(30), fontWeight: "800", color: "#2D2D44",
            marginBottom: 20, marginTop: 8, lineHeight: fs(38), letterSpacing: -1,
        },
        quoteCard: {
            backgroundColor: "#FFFFFF", borderRadius: 20, borderWidth: 2,
            borderColor: PAGE_COLOR + "30", padding: 22, marginBottom: 28, alignItems: "center",
            shadowColor: PAGE_COLOR, shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.08, shadowRadius: 12, elevation: 3,
        },
        quoteText: {
            fontSize: fs(16), fontWeight: "500", fontStyle: "italic",
            color: "#2D2D44", textAlign: "center", lineHeight: fs(26), marginBottom: 8,
        },
        quoteAuthor: { fontSize: fs(13), fontWeight: "500", fontStyle: "italic", color: "#8E8EA8", textAlign: "center" },

        sectionTitle: { fontSize: fs(18), fontWeight: "800", color: "#2D2D44", letterSpacing: -0.3, marginBottom: 4 },
        sectionSubtitle: { fontSize: fs(13), color: "#8E8EA8", fontWeight: "400", marginBottom: 16 },

        videoRow: { flexDirection: "row", marginHorizontal: -6, marginBottom: 28 },

        introCard: {
            flexDirection: "row", backgroundColor: "#FFFFFF", borderRadius: 20,
            marginBottom: 28, overflow: "hidden",
            shadowColor: PAGE_COLOR, shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.08, shadowRadius: 12, elevation: 3,
        },
        introAccent: { width: 5, borderRadius: 2 },
        introContent: { flex: 1, padding: 20 },
        introText: { fontSize: fs(16), fontWeight: "400", color: "#2D2D44", lineHeight: fs(26) },

        sideBySideRow: {
            flexDirection: "row",
            alignItems: "stretch",
            height: 240,
            marginBottom: 8,
            gap: 10,
        },
    });
}
