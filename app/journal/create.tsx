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
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../contexts/ThemeContext";
import { useJournal, MAX_NOTEBOOKS } from "../../contexts/JournalContext";
import { COVERS, PAPERS } from "../../constants/journal";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

type SetupStep = "cover" | "paper" | "title";

export default function CreateNotebookScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const theme = useTheme();
    const { colors, appStyles } = theme;
    const { createNotebook, notebooks } = useJournal();

    const [step, setStep] = useState<SetupStep>("cover");
    const [selectedCover, setSelectedCover] = useState(COVERS[0]);
    const [selectedPaper, setSelectedPaper] = useState(PAPERS[1]);
    const [title, setTitle] = useState("");

    const [isCreating, setIsCreating] = useState(false);

    const handleCreate = async () => {
        if (isCreating) return;
        setIsCreating(true);
        try {
            const finalTitle = title.trim() || t('journal.create.untitledNotebook');
            const id = await createNotebook(finalTitle.slice(0, 40), selectedCover.id, selectedPaper.id);
            if (!id) {
                if (Platform.OS === "web") {
                    window.alert(`${t('journal.limitReachedTitle')}\n${t('journal.create.notebookLimit', { count: MAX_NOTEBOOKS })}`);
                } else {
                    Alert.alert(t('journal.limitReachedTitle'), t('journal.create.notebookLimit', { count: MAX_NOTEBOOKS }));
                }
                return;
            }
            router.replace(`/journal/${id}`);
        } finally {
            setIsCreating(false);
        }
    };

    const renderCoverSelection = () => (
        <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.stepContainer}>
            <Text style={[styles.title, { color: colors.textDark }]}>{t('journal.create.chooseCover')}</Text>
            <Text style={[styles.subtitle, { color: colors.textLight }]}>{t('journal.create.chooseCoverSubtitle')}</Text>

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
                        <Text style={[styles.coverText, { color: cover.textColor }]}>{t('journal.create.journalTitleSample')}</Text>
                        {selectedCover.id === cover.id && (
                            <View style={[styles.checkmark, { backgroundColor: colors.primaryFill }]}>
                                <Ionicons name="checkmark" size={16} color="#FFF" />
                            </View>
                        )}
                        <Text style={[styles.cardLabel, { color: cover.textColor }]}>{cover.name}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <TouchableOpacity
                style={[styles.nextButton, { backgroundColor: colors.primaryFill }]}
                onPress={() => setStep("paper")}
            >
                <Text style={styles.nextButtonText}>{t('common.next')}</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFF" />
            </TouchableOpacity>
        </Animated.View>
    );

    const renderPaperSelection = () => (
        <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.stepContainer}>
            <Text style={[styles.title, { color: colors.textDark }]}>{t('journal.create.choosePaper')}</Text>
            <Text style={[styles.subtitle, { color: colors.textLight }]}>{t('journal.create.choosePaperSubtitle')}</Text>

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
                            <View style={[styles.checkmark, { backgroundColor: colors.primaryFill }]}>
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
                        <Text style={[styles.backButtonText, { color: colors.textDark }]}>{t('common.back')}</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ flex: 1, marginLeft: 8 }}>
                    <TouchableOpacity
                        style={[styles.nextButton, { backgroundColor: colors.primaryFill, marginTop: 0 }]}
                        onPress={() => setStep("title")}
                    >
                        <Text style={styles.nextButtonText}>{t('common.next')}</Text>
                        <Ionicons name="arrow-forward" size={20} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </View>
        </Animated.View>
    );

    const renderTitleSelection = () => (
        <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.stepContainer}>
            <Text style={[styles.title, { color: colors.textDark }]}>{t('journal.create.nameJournal')}</Text>
            <Text style={[styles.subtitle, { color: colors.textLight }]}>{t('journal.create.nameJournalSubtitle')}</Text>

            <View style={styles.inputContainer}>
                <TextInput
                    style={[styles.textInput, { color: colors.textDark, backgroundColor: colors.backgroundLight, borderColor: colors.borderCard }]}
                    placeholder={t('journal.create.titlePlaceholder')}
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
                        <Text style={[styles.backButtonText, { color: colors.textDark }]}>{t('common.back')}</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ flex: 1, marginLeft: 8 }}>
                    <TouchableOpacity
                        style={[styles.nextButton, { backgroundColor: colors.primaryFill, marginTop: 0 }]}
                        onPress={handleCreate}
                    >
                        <Text style={styles.nextButtonText}>{t('journal.create.start')}</Text>
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
                <Text style={appStyles.editHeaderTitle}>{t('journal.create.header')}</Text>
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
    patternContainer: { ...StyleSheet.absoluteFill, justifyContent: "space-evenly" },
    horizontalLine: { height: 1, backgroundColor: "#C0C0C0", width: "100%" },
    gridVerticalContainer: { ...StyleSheet.absoluteFill, flexDirection: "row", justifyContent: "space-evenly" },
    verticalLine: { width: 1, height: "100%", backgroundColor: "#C0C0C0" },
    nextButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 16, borderRadius: 30, marginTop: 40, gap: 8 },
    nextButtonText: { color: "#FFF", fontSize: 16, fontWeight: "600" },
    buttonRow: { flexDirection: "row", marginTop: 40 },
    backButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 16, borderRadius: 30, gap: 8, paddingHorizontal: 24 },
    backButtonText: { fontSize: 16, fontWeight: "600" },
    inputContainer: { width: "100%", marginBottom: 20 },
    textInput: { borderRadius: 12, borderWidth: 1, padding: 20, fontSize: 18, fontFamily: Platform.OS === "ios" ? "System" : "Roboto" },
});
