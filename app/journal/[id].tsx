import React, { useState, useRef, useEffect, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Platform,
    KeyboardAvoidingView,
    PanResponder,
    Alert,
    Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../contexts/ThemeContext";
import { useJournal, PathData, JournalImage, JournalPage } from "../../contexts/JournalContext";
import { PAPERS } from "../../constants/journal";
import Animated, { FadeIn } from "react-native-reanimated";

type InputMode = "type" | "write" | "erase" | "image";

export default function NotebookScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const theme = useTheme();
    const { colors, appStyles, shadows } = theme;

    const { getNotebook, updateNotebook } = useJournal();
    const notebook = getNotebook(id);

    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const [inputMode, setInputMode] = useState<InputMode>("type");
    const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Derived from the current page
    const [textEntry, setTextEntry] = useState(notebook?.pages?.[0]?.textEntry || "");
    const [paths, setPaths] = useState<PathData[]>(notebook?.pages?.[0]?.paths || []);
    const [images, setImages] = useState<JournalImage[]>(notebook?.pages?.[0]?.images || []);

    const lastSyncedPage = useRef<number>(0);

    // Sync state when page changes
    useEffect(() => {
        if (currentPageIndex !== lastSyncedPage.current && notebook?.pages?.[currentPageIndex]) {
            setTextEntry(notebook.pages[currentPageIndex].textEntry);
            setPaths(notebook.pages[currentPageIndex].paths);
            setImages(notebook.pages[currentPageIndex].images || []);
            lastSyncedPage.current = currentPageIndex;
        }
    }, [currentPageIndex, notebook?.pages]);



    // --- Drawing State ---
    const [currentPath, setCurrentPath] = useState<string>("");
    const drawColor = colors.textDark;
    const strokeWidth = 3;

    // Auto-save mechanisms
    const saveNotebook = useCallback((newText: string, newPaths: PathData[], newImages: JournalImage[]) => {
        if (!id || !notebook) return;
        if (saveTimeout.current) clearTimeout(saveTimeout.current);
        saveTimeout.current = setTimeout(() => {
            const updatedPages = [...notebook.pages];
            updatedPages[currentPageIndex] = { textEntry: newText, paths: newPaths, images: newImages };
            updateNotebook(id, { pages: updatedPages });
        }, 1000);
    }, [id, notebook, currentPageIndex, updateNotebook]);

    const handleManualSave = () => {
        if (!id || !notebook) return;
        const updatedPages = [...notebook.pages];
        updatedPages[currentPageIndex] = { textEntry, paths, images };
        updateNotebook(id, { pages: updatedPages });
        Alert.alert("Saved", "Your progress has been saved successfully.");
    };

    const handleTextChange = (text: string) => {
        setTextEntry(text);
        saveNotebook(text, paths, images);
    };

    const handlePathsChange = (newPaths: PathData[]) => {
        setPaths(newPaths);
        saveNotebook(textEntry, newPaths, images);
    };

    const handleImagesChange = (newImages: JournalImage[]) => {
        setImages(newImages);
        saveNotebook(textEntry, paths, newImages);
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => inputMode === 'write',
            onMoveShouldSetPanResponder: () => inputMode === 'write',
            onPanResponderGrant: (e, gestureState) => {
                const { locationX, locationY } = e.nativeEvent;
                setCurrentPath(`M${locationX},${locationY}`);
            },
            onPanResponderMove: (e, gestureState) => {
                const { locationX, locationY } = e.nativeEvent;
                setCurrentPath((prev) => `${prev} L${locationX},${locationY}`);
            },
            onPanResponderRelease: () => {
                if (inputMode === 'write') {
                    const newPaths = [...paths, { path: currentPath, color: drawColor, strokeWidth }];
                    setCurrentPath("");
                    handlePathsChange(newPaths);
                } else if (inputMode === 'erase') {
                    // Simpler eraser: just clear last path for now or do nothing
                }
            },
        })
    ).current;



    const handleClearPage = () => {
        Alert.alert(
            "Clear Page",
            "Are you sure you want to clear everything on this page?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Clear", style: "destructive", onPress: () => {
                        setTextEntry("");
                        setPaths([]);
                        setImages([]);
                        saveNotebook("", [], []);
                    }
                }
            ]
        );
    };

    const handleInsertImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 1,
        });

        if (!result.canceled) {
            const newImage: JournalImage = {
                uri: result.assets[0].uri,
                x: 50,
                y: 50,
                width: 200,
                height: 200,
            };
            handleImagesChange([...images, newImage]);
        }
    };

    const handleSaveCurrentPage = () => {
        if (!id || !notebook) return;
        const updatedPages = [...notebook.pages];
        updatedPages[currentPageIndex] = { textEntry, paths, images };
        updateNotebook(id, { pages: updatedPages });
    };

    const handleAddPage = () => {
        if (!id || !notebook) return;
        handleSaveCurrentPage();
        const newPages: JournalPage[] = [...notebook.pages, { textEntry: "", paths: [], images: [] }];
        updateNotebook(id, { pages: newPages });
        setCurrentPageIndex(newPages.length - 1);
    };

    const navigateToPage = (index: number) => {
        handleSaveCurrentPage();
        setCurrentPageIndex(index);
    };

    if (!notebook) {
        return (
            <View style={[styles.container, { backgroundColor: colors.appBackground, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: colors.textDark, fontSize: 18 }}>Notebook not found.</Text>
                <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20, padding: 12, backgroundColor: colors.primary, borderRadius: 8 }}>
                    <Text style={{ color: '#FFF' }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const selectedPaper = PAPERS.find(p => p.id === notebook.paperId) || PAPERS[0];

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.appBackground }]}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <View style={[appStyles.editHeader, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity style={appStyles.editBackButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={colors.textDark} />
                </TouchableOpacity>
                <Text style={[appStyles.editHeaderTitle, { fontSize: 18 }]} numberOfLines={1}>{notebook.title}</Text>
                <TouchableOpacity style={styles.saveBtn} onPress={handleManualSave}>
                    <Text style={[styles.saveBtnText, { color: colors.primary }]}>Save</Text>
                </TouchableOpacity>
            </View>

            <Animated.View entering={FadeIn} style={styles.journalContainer}>
                {/* Top Toolbar */}
                <View style={[styles.toolbar, { backgroundColor: colors.white, ...shadows.card }]}>
                    <View style={styles.toolbarLeft}>
                        {currentPageIndex > 0 && (
                            <TouchableOpacity style={styles.pageArrow} onPress={() => navigateToPage(currentPageIndex - 1)}>
                                <Ionicons name="chevron-back" size={20} color={colors.textDark} />
                            </TouchableOpacity>
                        )}
                        <Text style={[styles.pageIndicator, { color: colors.textDark }]}>
                            Page {currentPageIndex + 1} / {notebook.pages.length}
                        </Text>
                        {currentPageIndex < notebook.pages.length - 1 ? (
                            <TouchableOpacity style={styles.pageArrow} onPress={() => navigateToPage(currentPageIndex + 1)}>
                                <Ionicons name="chevron-forward" size={20} color={colors.textDark} />
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity style={styles.pageArrow} onPress={handleAddPage}>
                                <Ionicons name="add" size={20} color={colors.primary} />
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={styles.toolbarCenter}>
                        <TouchableOpacity
                            style={[styles.modeBtn, inputMode === "type" && { backgroundColor: colors.primary }]}
                            onPress={() => setInputMode("type")}
                        >
                            <Ionicons name="text-outline" size={20} color={inputMode === "type" ? "#FFF" : colors.textLight} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modeBtn, inputMode === "write" && { backgroundColor: colors.primary }]}
                            onPress={() => setInputMode("write")}
                        >
                            <Ionicons name="pencil-outline" size={20} color={inputMode === "write" ? "#FFF" : colors.textLight} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modeBtn, inputMode === "erase" && { backgroundColor: colors.primary }]}
                            onPress={() => setInputMode("erase")}
                        >
                            <Ionicons name="trash-outline" size={20} color={inputMode === "erase" ? "#FFF" : colors.textLight} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modeBtn, inputMode === "image" && { backgroundColor: colors.primary }]}
                            onPress={handleInsertImage}
                        >
                            <Ionicons name="image-outline" size={20} color={colors.textLight} />
                        </TouchableOpacity>

                    </View>
                    <TouchableOpacity style={styles.toolbarBtn} onPress={handleClearPage}>
                        <Ionicons name="refresh-outline" size={24} color={colors.textDark} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.toolbarBtn}>
                        <Ionicons name="share-outline" size={24} color={colors.textDark} />
                    </TouchableOpacity>
                </View>

                {/* Journal Canvas Area */}
                <View style={[styles.canvasArea, { backgroundColor: selectedPaper.backgroundColor }]}>
                    {/* Paper Background Patterns */}
                    {selectedPaper.pattern === "lined" && (
                        <View style={[styles.absoluteFill, { zIndex: 0 }]}>
                            {Array.from({ length: 40 }).map((_, i) => (
                                <View key={`bg-line-${i}`} style={[styles.bgHorizontalLine, { top: (i + 1) * 32 }]} />
                            ))}
                        </View>
                    )}
                    {selectedPaper.pattern === "grid" && (
                        <View style={[styles.absoluteFill, { zIndex: 0 }]}>
                            {Array.from({ length: 40 }).map((_, i) => (
                                <View key={`bg-gline-${i}`} style={[styles.bgHorizontalLine, { top: (i + 1) * 32 }]} />
                            ))}
                            <View style={styles.absoluteFill}>
                                {Array.from({ length: 20 }).map((_, i) => (
                                    <View key={`bg-vline-${i}`} style={[styles.bgVerticalLine, { left: (i + 1) * 32 }]} />
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Always show images layer */}
                    <View style={StyleSheet.absoluteFill} pointerEvents="none">
                        {images.map((img, idx) => (
                            <Image
                                key={`img-${idx}`}
                                source={{ uri: img.uri }}
                                style={{
                                    position: 'absolute',
                                    left: img.x,
                                    top: img.y,
                                    width: img.width,
                                    height: img.height,
                                    borderRadius: 8,
                                }}
                            />
                        ))}
                    </View>

                    {/* Always show the drawing layer */}
                    <Svg
                        style={[StyleSheet.absoluteFill, { zIndex: 3 }]}
                        pointerEvents={inputMode === "write" || inputMode === "erase" ? "auto" : "none"}
                    >
                        {paths.map((p, index) => (
                            <Path
                                key={`path-${index}`}
                                d={p.path}
                                stroke={inputMode === 'erase' ? 'rgba(0,0,0,0.1)' : p.color} // Visual hint for eraser
                                strokeWidth={p.strokeWidth}
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                onPress={() => {
                                    if (inputMode === 'erase') {
                                        handlePathsChange(paths.filter((_, i) => i !== index));
                                    }
                                }}
                            />
                        ))}
                        {currentPath ? (
                            <Path
                                d={currentPath}
                                stroke={drawColor}
                                strokeWidth={strokeWidth}
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        ) : null}
                    </Svg>

                    {/* Always show the text layer */}
                    <TextInput
                        style={[styles.textInput, { zIndex: 1 }]}
                        multiline
                        placeholder={paths.length === 0 && images.length === 0 ? "Start typing or drawing..." : ""}
                        placeholderTextColor="#AAA"
                        value={textEntry}
                        onChangeText={handleTextChange}
                        pointerEvents={inputMode === "type" ? "auto" : "none"}
                        autoFocus={inputMode === "type"}
                    />

                    {inputMode === "write" && paths.length === 0 && !currentPath && (
                        <View style={[styles.writeHint, { zIndex: 4 }]} pointerEvents="none">
                            <Ionicons name="pencil" size={48} color={colors.textLight} style={{ opacity: 0.3 }} />
                            <Text style={[styles.writeOverlayText, { color: colors.textLight }]}>
                                Drawing mode is active.
                            </Text>
                        </View>
                    )}

                    {inputMode === "write" && paths.length > 0 && (
                        <TouchableOpacity
                            style={[styles.undoButton, { zIndex: 5 }]}
                            onPress={() => handlePathsChange(paths.slice(0, -1))}
                        >
                            <Ionicons name="arrow-undo" size={20} color={colors.textDark} />
                        </TouchableOpacity>
                    )}


                </View>
            </Animated.View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    journalContainer: { flex: 1 },
    saveBtn: { paddingHorizontal: 16, paddingVertical: 8 },
    saveBtnText: { fontWeight: "700", fontSize: 16 },
    toolbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingVertical: 10, zIndex: 10 },
    toolbarLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
    pageArrow: { padding: 4 },
    pageIndicator: { fontSize: 13, fontWeight: "600", width: 80, textAlign: "center" },
    toolbarBtn: { padding: 8 },
    toolbarCenter: { flexDirection: "row", backgroundColor: "#F5F5F7", borderRadius: 20, padding: 3 },
    modeBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
    canvasArea: { flex: 1, position: "relative" },
    absoluteFill: { ...StyleSheet.absoluteFillObject },
    bgHorizontalLine: { position: "absolute", width: "100%", height: 1, backgroundColor: "rgba(0,0,0,0.06)" },
    bgVerticalLine: { position: "absolute", height: "100%", width: 1, backgroundColor: "rgba(0,0,0,0.06)" },
    drawingContainer: { ...StyleSheet.absoluteFillObject, zIndex: 1 },
    textInput: { flex: 1, padding: 24, paddingTop: 32, fontSize: 18, lineHeight: 32, fontFamily: Platform.OS === "ios" ? "System" : "Roboto", textAlignVertical: "top", backgroundColor: "transparent" },
    writeHint: { ...StyleSheet.absoluteFillObject, justifyContent: "center", alignItems: "center" },
    undoButton: { position: "absolute", bottom: 24, right: 24, width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.8)", justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
    writeOverlayText: { marginTop: 16, fontSize: 16, fontWeight: "500" },
});
