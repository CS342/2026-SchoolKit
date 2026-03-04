import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
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
    Share,
    ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Paths, File as FSFile, Directory } from "expo-file-system";
import { useLocalSearchParams, useRouter } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../contexts/ThemeContext";
import { useJournal, PathData, JournalImage, JournalPage, MAX_PAGES, MAX_IMAGES_PER_PAGE } from "../../contexts/JournalContext";
import { PAPERS } from "../../constants/journal";
import Animated, { FadeIn } from "react-native-reanimated";

type InputMode = "type" | "write" | "erase" | "image";

const DRAW_COLORS = ["#000000", "#E53935", "#1E88E5", "#43A047", "#FB8C00", "#8E24AA", "#757575"];
const STROKE_WIDTHS = [2, 4, 8];

const getJournalImagesDir = (): Directory => {
    return new Directory(Paths.document, "journal-images");
};

const copyImageToDocuments = async (tempUri: string): Promise<string> => {
    const dir = getJournalImagesDir();
    if (!dir.exists) {
        dir.create({ intermediates: true });
    }
    const ext = tempUri.split('.').pop()?.split('?')[0] || 'jpg';
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const destFile = new FSFile(dir, filename);
    const sourceFile = new FSFile(tempUri);
    sourceFile.copy(destFile);
    return destFile.uri;
};

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

    // Drawing customization
    const [drawColor, setDrawColor] = useState(DRAW_COLORS[0]);
    const [strokeWidth, setStrokeWidth] = useState(STROKE_WIDTHS[0]);

    // Derived from the current page
    const [textEntry, setTextEntry] = useState(notebook?.pages?.[0]?.textEntry || "");
    const [paths, setPaths] = useState<PathData[]>(notebook?.pages?.[0]?.paths || []);
    const [images, setImages] = useState<JournalImage[]>(notebook?.pages?.[0]?.images || []);

    const lastSyncedPage = useRef<number>(0);
    const pathsRef = useRef<PathData[]>(paths);
    const currentPathRef = useRef<string>("");

    // Keep pathsRef in sync
    useEffect(() => {
        pathsRef.current = paths;
    }, [paths]);

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

    // Keep currentPathRef in sync
    useEffect(() => {
        currentPathRef.current = currentPath;
    }, [currentPath]);

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

    // Eraser helper: remove paths near a point
    const eraseNearPoint = useCallback((x: number, y: number) => {
        const threshold = 20;
        const currentPaths = pathsRef.current;
        const filtered = currentPaths.filter(p => {
            const coords = p.path.match(/[\d.]+/g);
            if (!coords) return true;
            for (let i = 0; i < coords.length - 1; i += 2) {
                const px = parseFloat(coords[i]);
                const py = parseFloat(coords[i + 1]);
                const dist = Math.sqrt((px - x) ** 2 + (py - y) ** 2);
                if (dist < threshold) return false;
            }
            return true;
        });
        if (filtered.length !== currentPaths.length) {
            setPaths(filtered);
            pathsRef.current = filtered;
            saveNotebook(textEntry, filtered, images);
        }
    }, [textEntry, images, saveNotebook]);

    const panResponder = useMemo(
        () => PanResponder.create({
            onStartShouldSetPanResponder: () => inputMode === 'write' || inputMode === 'erase',
            onMoveShouldSetPanResponder: () => inputMode === 'write' || inputMode === 'erase',
            onPanResponderGrant: (e) => {
                const { locationX, locationY } = e.nativeEvent;
                if (inputMode === 'write') {
                    const newPath = `M${locationX},${locationY}`;
                    setCurrentPath(newPath);
                    currentPathRef.current = newPath;
                } else if (inputMode === 'erase') {
                    eraseNearPoint(locationX, locationY);
                }
            },
            onPanResponderMove: (e) => {
                const { locationX, locationY } = e.nativeEvent;
                if (inputMode === 'write') {
                    setCurrentPath((prev) => {
                        const updated = `${prev} L${locationX},${locationY}`;
                        currentPathRef.current = updated;
                        return updated;
                    });
                } else if (inputMode === 'erase') {
                    eraseNearPoint(locationX, locationY);
                }
            },
            onPanResponderRelease: () => {
                if (inputMode === 'write') {
                    const latestPaths = pathsRef.current;
                    const latestCurrentPath = currentPathRef.current;
                    if (latestCurrentPath) {
                        const newPaths = [...latestPaths, { path: latestCurrentPath, color: drawColor, strokeWidth }];
                        setPaths(newPaths);
                        pathsRef.current = newPaths;
                        setCurrentPath("");
                        currentPathRef.current = "";
                        saveNotebook(textEntry, newPaths, images);
                    }
                }
            },
        }),
        [inputMode, drawColor, strokeWidth, eraseNearPoint, textEntry, images, saveNotebook]
    );

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

    const handleDeletePage = () => {
        if (!id || !notebook) return;
        if (notebook.pages.length <= 1) {
            Alert.alert("Cannot Delete", "A notebook must have at least one page.");
            return;
        }
        Alert.alert(
            "Delete Page",
            `Are you sure you want to delete page ${currentPageIndex + 1}? This cannot be undone.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete", style: "destructive", onPress: async () => {
                        const deletedPage = notebook.pages[currentPageIndex];
                        // Clean up images from deleted page
                        const docUri = Paths.document.uri;
                        for (const img of deletedPage.images) {
                            if (img.uri.startsWith(docUri)) {
                                try { const f = new FSFile(img.uri); if (f.exists) f.delete(); } catch { }
                            }
                        }
                        const newPages = notebook.pages.filter((_, i) => i !== currentPageIndex);
                        const newIndex = Math.min(currentPageIndex, newPages.length - 1);
                        updateNotebook(id, { pages: newPages });
                        setCurrentPageIndex(newIndex);
                        setTextEntry(newPages[newIndex].textEntry);
                        setPaths(newPages[newIndex].paths);
                        setImages(newPages[newIndex].images || []);
                        lastSyncedPage.current = newIndex;
                    }
                }
            ]
        );
    };

    const handlePageMenu = () => {
        Alert.alert(
            "Page Options",
            undefined,
            [
                { text: "Clear Page", onPress: handleClearPage },
                {
                    text: "Delete Page", style: "destructive",
                    onPress: handleDeletePage
                },
                { text: "Cancel", style: "cancel" }
            ]
        );
    };

    const handleInsertImage = async () => {
        if (images.length >= MAX_IMAGES_PER_PAGE) {
            Alert.alert("Limit Reached", `You can add up to ${MAX_IMAGES_PER_PAGE} images per page.`);
            return;
        }

        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert("Permission Needed", "Please allow access to your photo library in Settings to insert images.");
            return;
        }

        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8,
            });

            if (!result.canceled) {
                const tempUri = result.assets[0].uri;

                // Validate file size (max 10MB)
                const tempFile = new FSFile(tempUri);
                if (tempFile.exists && tempFile.size > 10 * 1024 * 1024) {
                    Alert.alert("File Too Large", "Please select an image under 10MB.");
                    return;
                }

                // Copy to persistent storage
                const persistedUri = await copyImageToDocuments(tempUri);

                const newImage: JournalImage = {
                    uri: persistedUri,
                    x: 50,
                    y: 50,
                    width: 200,
                    height: 200,
                };
                handleImagesChange([...images, newImage]);
            }
        } catch (e) {
            console.error('Failed to insert image', e);
            Alert.alert("Error", "Failed to insert image. Please try again.");
        }
    };

    const handleSharePage = async () => {
        if (!notebook) return;
        let content = `${notebook.title} — Page ${currentPageIndex + 1}\n\n`;
        if (textEntry.trim()) {
            content += textEntry.trim() + "\n";
        }
        if (paths.length > 0) {
            content += `\n[${paths.length} drawing stroke${paths.length !== 1 ? 's' : ''}]\n`;
        }
        if (images.length > 0) {
            content += `[${images.length} image${images.length !== 1 ? 's' : ''}]\n`;
        }
        try {
            await Share.share({ message: content });
        } catch {
            // User cancelled share
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
        if (notebook.pages.length >= MAX_PAGES) {
            Alert.alert("Limit Reached", `You can have up to ${MAX_PAGES} pages per notebook.`);
            return;
        }
        handleSaveCurrentPage();
        const newPages: JournalPage[] = [...notebook.pages, { textEntry: "", paths: [], images: [] }];
        updateNotebook(id, { pages: newPages });
        const newIndex = newPages.length - 1;
        setCurrentPageIndex(newIndex);
        setTextEntry("");
        setPaths([]);
        setImages([]);
        lastSyncedPage.current = newIndex;
    };

    const navigateToPage = (index: number) => {
        if (!id || !notebook) return;
        // Save current page first
        const updatedPages = [...notebook.pages];
        updatedPages[currentPageIndex] = { textEntry, paths, images };
        updateNotebook(id, { pages: updatedPages });

        // Load target page state immediately
        const targetPage = updatedPages[index] || notebook.pages[index];
        if (targetPage) {
            setTextEntry(targetPage.textEntry);
            setPaths(targetPage.paths);
            setImages(targetPage.images || []);
            lastSyncedPage.current = index;
        }
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
                    <TouchableOpacity style={styles.toolbarBtn} onPress={handlePageMenu}>
                        <Ionicons name="ellipsis-horizontal" size={24} color={colors.textDark} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.toolbarBtn} onPress={handleSharePage}>
                        <Ionicons name="share-outline" size={24} color={colors.textDark} />
                    </TouchableOpacity>
                </View>

                {/* Draw customization toolbar */}
                {inputMode === "write" && (
                    <View style={[styles.drawToolbar, { backgroundColor: colors.white, ...shadows.card }]}>
                        <View style={styles.colorRow}>
                            {DRAW_COLORS.map((c) => (
                                <TouchableOpacity
                                    key={c}
                                    style={[
                                        styles.colorDot,
                                        { backgroundColor: c },
                                        drawColor === c && { borderWidth: 3, borderColor: colors.primary },
                                    ]}
                                    onPress={() => setDrawColor(c)}
                                />
                            ))}
                        </View>
                        <View style={styles.strokeRow}>
                            {STROKE_WIDTHS.map((sw) => (
                                <TouchableOpacity
                                    key={sw}
                                    style={[
                                        styles.strokeOption,
                                        strokeWidth === sw && { backgroundColor: colors.primary + '20', borderColor: colors.primary },
                                    ]}
                                    onPress={() => setStrokeWidth(sw)}
                                >
                                    <View style={[styles.strokePreview, { height: sw, backgroundColor: drawColor }]} />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {/* Journal Canvas Area */}
                <View style={[styles.canvasArea, { backgroundColor: selectedPaper.backgroundColor }]}>
                    {/* Paper Background Patterns */}
                    {selectedPaper.pattern === "lined" && (
                        <View style={[styles.absoluteFill, { zIndex: 0 }]}>
                            {Array.from({ length: 60 }).map((_, i) => (
                                <View key={`bg-line-${i}`} style={[styles.bgHorizontalLine, { top: (i + 1) * 24 }]} />
                            ))}
                        </View>
                    )}
                    {selectedPaper.pattern === "grid" && (
                        <View style={[styles.absoluteFill, { zIndex: 0 }]}>
                            {Array.from({ length: 60 }).map((_, i) => (
                                <View key={`bg-gline-${i}`} style={[styles.bgHorizontalLine, { top: (i + 1) * 24 }]} />
                            ))}
                            <View style={styles.absoluteFill}>
                                {Array.from({ length: 60 }).map((_, i) => (
                                    <View key={`bg-vline-${i}`} style={[styles.bgVerticalLine, { left: (i + 1) * 24 }]} />
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

                    {/* Drawing layer wrapped in pan handler */}
                    <View style={[StyleSheet.absoluteFill, { zIndex: 3 }]} pointerEvents={inputMode === "write" || inputMode === "erase" ? "auto" : "none"} {...panResponder.panHandlers}>
                        <Svg
                            style={StyleSheet.absoluteFill}
                            pointerEvents={inputMode === "write" || inputMode === "erase" ? "auto" : "none"}
                        >
                            {paths.map((p, index) => (
                                <Path
                                    key={`path-${index}`}
                                    d={p.path}
                                    stroke={inputMode === 'erase' ? 'rgba(0,0,0,0.1)' : p.color}
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
                    </View>

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
    bgHorizontalLine: { position: "absolute", width: "100%", height: 1, backgroundColor: "rgba(0,0,0,0.15)" },
    bgVerticalLine: { position: "absolute", height: "100%", width: 1, backgroundColor: "rgba(0,0,0,0.15)" },
    drawingContainer: { ...StyleSheet.absoluteFillObject, zIndex: 1 },
    textInput: { flex: 1, padding: 24, paddingTop: 24, fontSize: 16, lineHeight: 24, fontFamily: Platform.OS === "ios" ? "System" : "Roboto", textAlignVertical: "top", backgroundColor: "transparent" },
    writeHint: { ...StyleSheet.absoluteFillObject, justifyContent: "center", alignItems: "center" },
    undoButton: { position: "absolute", bottom: 24, right: 24, width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.8)", justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
    writeOverlayText: { marginTop: 16, fontSize: 16, fontWeight: "500" },
    drawToolbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 8, zIndex: 9 },
    colorRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    colorDot: { width: 28, height: 28, borderRadius: 14 },
    strokeRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    strokeOption: { width: 40, height: 30, borderRadius: 6, borderWidth: 1, borderColor: "#E0E0E0", justifyContent: "center", alignItems: "center" },
    strokePreview: { width: 24, borderRadius: 2 },
});
