import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Platform,
    KeyboardAvoidingView,
    Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../contexts/ThemeContext";
import { useJournal, MAX_NOTEBOOKS } from "../../contexts/JournalContext";
import { COVERS, PAPERS } from "../../constants/journal";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

type SetupStep = "cover" | "paper" | "title";

export default function CreateNotebookScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const theme = useTheme();
    const { colors, appStyles } = theme;
    const { createNotebook, notebooks } = useJournal();

    const [step, setStep] = useState<SetupStep>("cover");
    const [selectedCover, setSelectedCover] = useState(COVERS[0]);
    const [selectedPaper, setSelectedPaper] = useState(PAPERS[1]);
    const [title, setTitle] = useState("");

    const handleCreate = () => {
        const finalTitle = title.trim() || "Untitled Notebook";
        const id = createNotebook(finalTitle.slice(0, 40), selectedCover.id, selectedPaper.id);
        if (!id) {
            Alert.alert("Limit Reached", `You can have up to ${MAX_NOTEBOOKS} notebooks.`);
            return;
        }
        // Navigate replace so "back" from notebook goes to library
        router.replace(`/journal/${id}`);
    };

    const renderCoverSelection = () => (
        <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.stepContainer}>
            <Text style={[styles.title, { color: colors.textDark }]}>Choose a Notebook</Text>
            <Text style={[styles.subtitle, { color: colors.textLight }]}>Select a cover design for your journal</Text>

            <ScrollView horizontal contentContainerStyle={styles.horizontalScroll} showsHorizontalScrollIndicator={false}>
                {COVERS.map((cover) => (
                    <TouchableOpacity
                        key={cover.id}
                        style={[
                            styles.coverCard,
                            { backgroundColor: cover.color },
                            selectedCover.id === cover.id && styles.selectedItem,
                            selectedCover.id === cover.id && { borderColor: colors.primary }
                        ]}
                        onPress={() => setSelectedCover(cover)}
                    >
                        <Text style={[styles.coverText, { color: cover.textColor }]}>Journal Title</Text>
                        {selectedCover.id === cover.id && (
                            <View style={[styles.checkmark, { backgroundColor: colors.primary }]}>
                                <Ionicons name="checkmark" size={16} color="#FFF" />
                            </View>
                        )}
                        <Text style={[styles.cardLabel, { color: cover.textColor }]}>{cover.name}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <TouchableOpacity
                style={[styles.nextButton, { backgroundColor: colors.primary }]}
                onPress={() => setStep("paper")}
            >
                <Text style={styles.nextButtonText}>Next</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFF" />
            </TouchableOpacity>
        </Animated.View>
    );

    const renderPaperSelection = () => (
        <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.stepContainer}>
            <Text style={[styles.title, { color: colors.textDark }]}>Choose Paper Style</Text>
            <Text style={[styles.subtitle, { color: colors.textLight }]}>Select a background for your pages</Text>

            <ScrollView horizontal contentContainerStyle={styles.horizontalScroll} showsHorizontalScrollIndicator={false}>
                {PAPERS.map((paper) => (
                    <TouchableOpacity
                        key={paper.id}
                        style={[
                            styles.paperCard,
                            { backgroundColor: paper.backgroundColor },
                            selectedPaper.id === paper.id && styles.selectedItem,
                            selectedPaper.id === paper.id && { borderColor: colors.primary }
                        ]}
                        onPress={() => setSelectedPaper(paper)}
                    >
                        {paper.pattern === "lined" && (
                            <View style={styles.patternContainer}>
                                {Array.from({ length: 10 }).map((_, i) => (
                                    <View key={`line-${i}`} style={styles.horizontalLine} />
                                ))}
                            </View>
                        )}
                        {paper.pattern === "grid" && (
                            <>
                                <View style={styles.patternContainer}>
                                    {Array.from({ length: 10 }).map((_, i) => (
                                        <View key={`gline-${i}`} style={styles.horizontalLine} />
                                    ))}
                                </View>
                                <View style={styles.gridVerticalContainer}>
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <View key={`vline-${i}`} style={styles.verticalLine} />
                                    ))}
                                </View>
                            </>
                        )}

                        {selectedPaper.id === paper.id && (
                            <View style={[styles.checkmark, { backgroundColor: colors.primary }]}>
                                <Ionicons name="checkmark" size={16} color="#FFF" />
                            </View>
                        )}
                        <Text style={[styles.cardLabel, { color: colors.textDark, bottom: -25 }]}>{paper.name}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <View style={styles.buttonRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                    <TouchableOpacity
                        style={[styles.backButton, { backgroundColor: colors.backgroundLight }]}
                        onPress={() => setStep("cover")}
                    >
                        <Ionicons name="arrow-back" size={20} color={colors.textDark} />
                        <Text style={[styles.backButtonText, { color: colors.textDark }]}>Back</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ flex: 1, marginLeft: 8 }}>
                    <TouchableOpacity
                        style={[styles.nextButton, { backgroundColor: colors.primary, marginTop: 0 }]}
                        onPress={() => setStep("title")}
                    >
                        <Text style={styles.nextButtonText}>Next</Text>
                        <Ionicons name="arrow-forward" size={20} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </View>
        </Animated.View>
    );

    const renderTitleSelection = () => (
        <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.stepContainer}>
            <Text style={[styles.title, { color: colors.textDark }]}>Name your Journal</Text>
            <Text style={[styles.subtitle, { color: colors.textLight }]}>Give your new notebook a title</Text>

            <View style={styles.inputContainer}>
                <TextInput
                    style={[styles.textInput, { color: colors.textDark, backgroundColor: colors.backgroundLight, borderColor: colors.borderCard }]}
                    placeholder="E.g., Therapy Notes, Daily Gratitude"
                    placeholderTextColor={colors.textLight}
                    value={title}
                    onChangeText={setTitle}
                    autoFocus
                    maxLength={40}
                />
            </View>

            <View style={styles.buttonRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                    <TouchableOpacity
                        style={[styles.backButton, { backgroundColor: colors.backgroundLight }]}
                        onPress={() => setStep("paper")}
                    >
                        <Ionicons name="arrow-back" size={20} color={colors.textDark} />
                        <Text style={[styles.backButtonText, { color: colors.textDark }]}>Back</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ flex: 1, marginLeft: 8 }}>
                    <TouchableOpacity
                        style={[styles.nextButton, { backgroundColor: colors.primary, marginTop: 0 }]}
                        onPress={handleCreate}
                    >
                        <Text style={styles.nextButtonText}>Start</Text>
                        <Ionicons name="journal-outline" size={20} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </View>
        </Animated.View>
    );

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.appBackground }]}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <View style={[appStyles.editHeader, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity style={appStyles.editBackButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={colors.textDark} />
                </TouchableOpacity>
                <Text style={appStyles.editHeaderTitle}>New Notebook</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.content}>
                {step === "cover" && renderCoverSelection()}
                {step === "paper" && renderPaperSelection()}
                {step === "title" && renderTitleSelection()}
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { flex: 1 },
    stepContainer: { flex: 1, padding: 24, justifyContent: "center" },
    title: { fontSize: 28, fontWeight: "700", marginBottom: 8 },
    subtitle: { fontSize: 16, marginBottom: 40 },
    horizontalScroll: { paddingVertical: 20, gap: 20 },
    coverCard: {
        width: 180, height: 260, borderRadius: 16, marginRight: 20, justifyContent: "center", alignItems: "center",
        borderWidth: 2, borderColor: "transparent",
        shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 5,
    },
    paperCard: {
        width: 180, height: 260, borderRadius: 8, marginRight: 20, borderWidth: 2, borderColor: "#E5E5E5",
        shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3, overflow: "hidden",
    },
    coverText: { fontSize: 22, fontWeight: "700", textAlign: "center", fontFamily: Platform.OS === "ios" ? "Georgia" : "serif" },
    cardLabel: { position: "absolute", bottom: 20, fontSize: 14, fontWeight: "600", textAlign: "center", width: "100%" },
    selectedItem: { transform: [{ scale: 1.05 }] },
    checkmark: { position: "absolute", top: 12, right: 12, width: 24, height: 24, borderRadius: 12, justifyContent: "center", alignItems: "center" },
    patternContainer: { ...StyleSheet.absoluteFillObject, justifyContent: "space-evenly" },
    horizontalLine: { height: 1, backgroundColor: "#C0C0C0", width: "100%" },
    gridVerticalContainer: { ...StyleSheet.absoluteFillObject, flexDirection: "row", justifyContent: "space-evenly" },
    verticalLine: { width: 1, height: "100%", backgroundColor: "#C0C0C0" },
    nextButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 16, borderRadius: 30, marginTop: 40, gap: 8 },
    nextButtonText: { color: "#FFF", fontSize: 16, fontWeight: "600" },
    buttonRow: { flexDirection: "row", marginTop: 40 },
    backButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 16, borderRadius: 30, gap: 8, paddingHorizontal: 24 },
    backButtonText: { fontSize: 16, fontWeight: "600" },
    inputContainer: { width: "100%", marginBottom: 20 },
    textInput: { borderRadius: 12, borderWidth: 1, padding: 20, fontSize: 18, fontFamily: Platform.OS === "ios" ? "System" : "Roboto" },
});
