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
    Pressable,
    LayoutChangeEvent,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../contexts/ThemeContext";
import { useJournal, PathData, JournalImage, JournalPage, MAX_PAGES, MAX_IMAGES_PER_PAGE } from "../../contexts/JournalContext";
import { useAuth } from "../../contexts/AuthContext";
import { PAPERS } from "../../constants/journal";
import Animated, { FadeIn } from "react-native-reanimated";
import { WebContainer } from "../../components/WebContainer";

// Conditionally import expo-file-system only on native
let Paths: any, FSFile: any, Directory: any;
if (Platform.OS !== 'web') {
    const fs = require('expo-file-system');
    Paths = fs.Paths;
    FSFile = fs.File;
    Directory = fs.Directory;
}

type InputMode = "type" | "write" | "erase" | "image";

const DRAW_COLORS = ["#000000", "#E53935", "#1E88E5", "#43A047", "#FB8C00", "#8E24AA", "#757575"];
const STROKE_WIDTHS = [2, 4, 8];

const getJournalImagesDir = () => {
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

const copyImageForWeb = async (uri: string): Promise<string> => {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

// Draggable, selectable image component
function ImageItem({ image, index, isSelected, inputMode, onSelect, onMove, onMoveEnd, onDelete, primaryColor }: {
    image: JournalImage; index: number; isSelected: boolean; inputMode: InputMode;
    onSelect: () => void; onMove: (x: number, y: number) => void;
    onMoveEnd: (x: number, y: number) => void; onDelete: () => void; primaryColor: string;
}) {
    const dragStart = useRef({ x: 0, y: 0, imgX: 0, imgY: 0 });
    const currentPos = useRef({ x: image.x, y: image.y });

    useEffect(() => {
        currentPos.current = { x: image.x, y: image.y };
    }, [image.x, image.y]);

    const imagePanResponder = useMemo(() => PanResponder.create({
        onStartShouldSetPanResponder: () => inputMode === "image" && isSelected,
        onMoveShouldSetPanResponder: () => inputMode === "image" && isSelected,
        onPanResponderGrant: (e) => {
            dragStart.current = {
                x: e.nativeEvent.pageX,
                y: e.nativeEvent.pageY,
                imgX: currentPos.current.x,
                imgY: currentPos.current.y,
            };
        },
        onPanResponderMove: (e) => {
            const dx = e.nativeEvent.pageX - dragStart.current.x;
            const dy = e.nativeEvent.pageY - dragStart.current.y;
            const newX = dragStart.current.imgX + dx;
            const newY = dragStart.current.imgY + dy;
            currentPos.current = { x: newX, y: newY };
            onMove(newX, newY);
        },
        onPanResponderRelease: () => {
            onMoveEnd(currentPos.current.x, currentPos.current.y);
        },
    }), [inputMode, isSelected, onMove, onMoveEnd]);

    return (
        <View
            style={[{
                position: 'absolute',
                left: image.x,
                top: image.y,
                width: image.width,
                height: image.height,
                borderRadius: 8,
            }, isSelected && { borderWidth: 2, borderColor: primaryColor }]}
            {...(isSelected ? imagePanResponder.panHandlers : {})}
        >
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={onSelect}
                style={{ width: '100%', height: '100%' }}
            >
                <Image
                    source={{ uri: image.uri }}
                    style={{ width: '100%', height: '100%', borderRadius: 6 }}
                />
            </TouchableOpacity>
            {isSelected && (
                <TouchableOpacity
                    style={[styles.imageDeleteBtn, { backgroundColor: primaryColor }]}
                    onPress={onDelete}
                >
                    <Ionicons name="close" size={14} color="#FFF" />
                </TouchableOpacity>
            )}
        </View>
    );
}

export default function NotebookScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const theme = useTheme();
    const { colors, appStyles, shadows } = theme;

    const { getNotebook, updateNotebook, uploadJournalImage } = useJournal();
    const notebook = getNotebook(id);

    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const [inputMode, setInputMode] = useState<InputMode>("type");
    const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Drawing customization
    const [drawColor, setDrawColor] = useState(DRAW_COLORS[0]);
    const [strokeWidth, setStrokeWidth] = useState(STROKE_WIDTHS[0]);

    // Web-specific state
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
    const [showPageMenu, setShowPageMenu] = useState(false);

    const handleCanvasLayout = useCallback((e: LayoutChangeEvent) => {
        const { width, height } = e.nativeEvent.layout;
        setCanvasSize({ width, height });
    }, []);

    // Derived from the current page
    const [textEntry, setTextEntry] = useState(notebook?.pages?.[0]?.textEntry || "");
    const [paths, setPaths] = useState<PathData[]>(notebook?.pages?.[0]?.paths || []);
    const [images, setImages] = useState<JournalImage[]>(notebook?.pages?.[0]?.images || []);

    const lastSyncedPage = useRef<number>(0);
    const pathsRef = useRef<PathData[]>(paths);
    const currentPathRef = useRef<string>("");

    // Undo/Redo stacks
    const undoStackRef = useRef<PathData[][]>([]);
    const redoStackRef = useRef<PathData[][]>([]);
    const [historyVersion, setHistoryVersion] = useState(0);

    // Image selection
    const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

    // Keep pathsRef in sync
    useEffect(() => {
        pathsRef.current = paths;
    }, [paths]);

    // Sync state when page changes
    useEffect(() => {
        if (currentPageIndex !== lastSyncedPage.current && notebook?.pages?.[currentPageIndex]) {
            setTextEntry(notebook.pages[currentPageIndex].textEntry);
            setPaths(notebook.pages[currentPageIndex].paths);
            pathsRef.current = notebook.pages[currentPageIndex].paths;
            setImages(notebook.pages[currentPageIndex].images || []);
            undoStackRef.current = [];
            redoStackRef.current = [];
            setHistoryVersion(v => v + 1);
            setSelectedImageIndex(null);
            lastSyncedPage.current = currentPageIndex;
        }
    }, [currentPageIndex, notebook?.pages]);

    // Deselect image when leaving image mode
    useEffect(() => {
        if (inputMode !== "image") setSelectedImageIndex(null);
    }, [inputMode]);

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
        if (Platform.OS === 'web') {
            window.alert("Your progress has been saved successfully.");
        } else {
            Alert.alert("Saved", "Your progress has been saved successfully.");
        }
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

    // Undo/Redo helpers
    const pushUndo = useCallback((currentPaths: PathData[]) => {
        undoStackRef.current = [...undoStackRef.current.slice(-49), currentPaths];
        redoStackRef.current = [];
        setHistoryVersion(v => v + 1);
    }, []);

    const handleUndo = useCallback(() => {
        if (undoStackRef.current.length === 0) return;
        const prev = undoStackRef.current[undoStackRef.current.length - 1];
        undoStackRef.current = undoStackRef.current.slice(0, -1);
        redoStackRef.current = [...redoStackRef.current, pathsRef.current];
        setPaths(prev);
        pathsRef.current = prev;
        setHistoryVersion(v => v + 1);
        saveNotebook(textEntry, prev, images);
    }, [textEntry, images, saveNotebook]);

    const handleRedo = useCallback(() => {
        if (redoStackRef.current.length === 0) return;
        const next = redoStackRef.current[redoStackRef.current.length - 1];
        redoStackRef.current = redoStackRef.current.slice(0, -1);
        undoStackRef.current = [...undoStackRef.current, pathsRef.current];
        setPaths(next);
        pathsRef.current = next;
        setHistoryVersion(v => v + 1);
        saveNotebook(textEntry, next, images);
    }, [textEntry, images, saveNotebook]);

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
            pushUndo(currentPaths);
            setPaths(filtered);
            pathsRef.current = filtered;
            saveNotebook(textEntry, filtered, images);
        }
    }, [textEntry, images, saveNotebook, pushUndo]);

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
                        pushUndo(latestPaths);
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
        [inputMode, drawColor, strokeWidth, eraseNearPoint, textEntry, images, saveNotebook, pushUndo]
    );

    const handleClearPage = () => {
        const doClear = () => {
            if (paths.length > 0) pushUndo(paths);
            setTextEntry("");
            setPaths([]);
            pathsRef.current = [];
            setImages([]);
            saveNotebook("", [], []);
        };
        if (Platform.OS === 'web') {
            if (window.confirm("Are you sure you want to clear everything on this page?")) {
                doClear();
            }
        } else {
            Alert.alert(
                "Clear Page",
                "Are you sure you want to clear everything on this page?",
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Clear", style: "destructive", onPress: doClear }
                ]
            );
        }
    };

    const performDeletePage = () => {
        if (!id || !notebook) return;
        const deletedPage = notebook.pages[currentPageIndex];
        // Clean up images from deleted page (native only)
        if (Platform.OS !== 'web') {
            const docUri = Paths.document.uri;
            for (const img of deletedPage.images) {
                if (img.uri.startsWith(docUri)) {
                    try { const f = new FSFile(img.uri); if (f.exists) f.delete(); } catch { }
                }
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
    };

    const handleDeletePage = () => {
        if (!id || !notebook) return;
        if (notebook.pages.length <= 1) {
            if (Platform.OS === 'web') {
                window.alert("A notebook must have at least one page.");
            } else {
                Alert.alert("Cannot Delete", "A notebook must have at least one page.");
            }
            return;
        }
        if (Platform.OS === 'web') {
            if (window.confirm(`Are you sure you want to delete page ${currentPageIndex + 1}? This cannot be undone.`)) {
                performDeletePage();
            }
        } else {
            Alert.alert(
                "Delete Page",
                `Are you sure you want to delete page ${currentPageIndex + 1}? This cannot be undone.`,
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Delete", style: "destructive", onPress: performDeletePage }
                ]
            );
        }
    };

    const handlePageMenu = () => {
        if (Platform.OS === 'web') {
            setShowPageMenu(prev => !prev);
        } else {
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
        }
    };

    const handleInsertImage = async () => {
        if (images.length >= MAX_IMAGES_PER_PAGE) {
            if (Platform.OS === 'web') {
                window.alert(`You can add up to ${MAX_IMAGES_PER_PAGE} images per page.`);
            } else {
                Alert.alert("Limit Reached", `You can add up to ${MAX_IMAGES_PER_PAGE} images per page.`);
            }
            return;
        }

        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            if (Platform.OS === 'web') {
                window.alert("Please allow access to your photo library to insert images.");
            } else {
                Alert.alert("Permission Needed", "Please allow access to your photo library in Settings to insert images.");
            }
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

                // Upload to Supabase Storage
                const publicUrl = await uploadJournalImage(tempUri);
                if (!publicUrl) {
                    if (Platform.OS === 'web') {
                        window.alert("Failed to upload image. Please try again.");
                    } else {
                        Alert.alert("Error", "Failed to upload image. Please try again.");
                    }
                    return;
                }

                const newImage: JournalImage = {
                    uri: publicUrl,
                    x: 50,
                    y: 50,
                    width: 200,
                    height: 200,
                };
                handleImagesChange([...images, newImage]);
            }
        } catch (e) {
            console.error('Failed to insert image', e);
            if (Platform.OS === 'web') {
                window.alert("Failed to insert image. Please try again.");
            } else {
                Alert.alert("Error", "Failed to insert image. Please try again.");
            }
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
            if (Platform.OS === 'web') {
                window.alert(`You can have up to ${MAX_PAGES} pages per notebook.`);
            } else {
                Alert.alert("Limit Reached", `You can have up to ${MAX_PAGES} pages per notebook.`);
            }
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

        // Reset undo/redo stacks and image selection
        undoStackRef.current = [];
        redoStackRef.current = [];
        setHistoryVersion(v => v + 1);
        setSelectedImageIndex(null);

        // Load target page state immediately
        const targetPage = updatedPages[index] || notebook.pages[index];
        if (targetPage) {
            setTextEntry(targetPage.textEntry);
            setPaths(targetPage.paths);
            pathsRef.current = targetPage.paths;
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
        <WebContainer maxWidth={900}>
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
                    <View style={styles.toolbarSection}>
                        <TouchableOpacity
                            style={[styles.pageArrow, currentPageIndex === 0 && { opacity: 0.3 }]}
                            onPress={() => currentPageIndex > 0 && navigateToPage(currentPageIndex - 1)}
                            disabled={currentPageIndex === 0}
                        >
                            <Ionicons name="chevron-back" size={18} color={colors.textDark} />
                        </TouchableOpacity>
                        <Text style={[styles.pageIndicator, { color: colors.textDark }]}>
                            {currentPageIndex + 1}<Text style={{ color: colors.textLight }}> / {notebook.pages.length}</Text>
                        </Text>
                        {currentPageIndex < notebook.pages.length - 1 ? (
                            <TouchableOpacity style={styles.pageArrow} onPress={() => navigateToPage(currentPageIndex + 1)}>
                                <Ionicons name="chevron-forward" size={18} color={colors.textDark} />
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity style={styles.pageArrow} onPress={handleAddPage}>
                                <Ionicons name="add" size={18} color={colors.primary} />
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={styles.toolbarCenter}>
                        <TouchableOpacity
                            style={[styles.modeBtn, inputMode === "type" && { backgroundColor: colors.primary }]}
                            onPress={() => setInputMode("type")}
                        >
                            <Ionicons name="text-outline" size={18} color={inputMode === "type" ? "#FFF" : colors.textLight} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modeBtn, inputMode === "write" && { backgroundColor: colors.primary }]}
                            onPress={() => setInputMode("write")}
                        >
                            <Ionicons name="pencil-outline" size={18} color={inputMode === "write" ? "#FFF" : colors.textLight} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modeBtn, inputMode === "erase" && { backgroundColor: colors.primary }]}
                            onPress={() => setInputMode("erase")}
                        >
                            <MaterialCommunityIcons name="eraser" size={18} color={inputMode === "erase" ? "#FFF" : colors.textLight} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modeBtn, inputMode === "image" && { backgroundColor: colors.primary }]}
                            onPress={() => {
                                if (inputMode === "image") {
                                    handleInsertImage();
                                } else {
                                    setInputMode("image");
                                }
                            }}
                        >
                            <Ionicons name="image-outline" size={18} color={inputMode === "image" ? "#FFF" : colors.textLight} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.toolbarSection}>
                        <View style={{ position: 'relative' }}>
                            <TouchableOpacity style={styles.toolbarIconBtn} onPress={handlePageMenu}>
                                <Ionicons name="ellipsis-horizontal" size={20} color={colors.textLight} />
                            </TouchableOpacity>
                            {showPageMenu && (
                                <>
                                    <Pressable
                                        onPress={() => setShowPageMenu(false)}
                                        style={styles.dropdownBackdrop}
                                    />
                                    <View style={[styles.dropdownMenu, { backgroundColor: colors.white, ...shadows.card }]}>
                                        <TouchableOpacity style={styles.dropdownItem} onPress={() => { setShowPageMenu(false); handleClearPage(); }}>
                                            <Ionicons name="document-outline" size={18} color={colors.textDark} />
                                            <Text style={[styles.dropdownText, { color: colors.textDark }]}>Clear Page</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.dropdownItem} onPress={() => { setShowPageMenu(false); handleDeletePage(); }}>
                                            <Ionicons name="trash-outline" size={18} color="#E53935" />
                                            <Text style={[styles.dropdownText, { color: '#E53935' }]}>Delete Page</Text>
                                        </TouchableOpacity>
                                    </View>
                                </>
                            )}
                        </View>
                        <TouchableOpacity style={styles.toolbarIconBtn} onPress={handleSharePage}>
                            <Ionicons name="share-outline" size={20} color={colors.textLight} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Draw customization toolbar */}
                {inputMode === "write" && (
                    <View style={[styles.drawToolbar, { backgroundColor: colors.white, ...shadows.card }]}>
                        <View style={styles.drawToolbarInner}>
                            <View style={styles.colorRow}>
                                {DRAW_COLORS.map((c) => (
                                    <TouchableOpacity
                                        key={c}
                                        style={[
                                            styles.colorDot,
                                            { backgroundColor: c },
                                            drawColor === c && { borderWidth: 2.5, borderColor: colors.primary },
                                        ]}
                                        onPress={() => setDrawColor(c)}
                                    />
                                ))}
                            </View>
                            <View style={[styles.drawDivider, { backgroundColor: colors.border }]} />
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
                    </View>
                )}

                {/* Image mode toolbar */}
                {inputMode === "image" && (
                    <View style={[styles.drawToolbar, { backgroundColor: colors.white, ...shadows.card }]}>
                        <TouchableOpacity
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 6, backgroundColor: colors.primary, borderRadius: 16 }}
                            onPress={handleInsertImage}
                        >
                            <Ionicons name="add" size={16} color="#FFF" />
                            <Text style={{ color: '#FFF', fontWeight: '600', fontSize: 14 }}>Insert Image</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Journal Canvas Area */}
                <View style={[styles.canvasArea, { backgroundColor: selectedPaper.backgroundColor }]} onLayout={handleCanvasLayout}>
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

                    {/* Images layer — interactive in image mode */}
                    <View style={[StyleSheet.absoluteFill, { zIndex: inputMode === "image" ? 5 : 2 }]} pointerEvents={inputMode === "image" ? "auto" : "none"}
                        onStartShouldSetResponder={() => inputMode === "image"}
                        onResponderGrant={() => { if (inputMode === "image") setSelectedImageIndex(null); }}
                    >
                        {images.map((img, idx) => (
                            <ImageItem
                                key={`img-${idx}`}
                                image={img}
                                index={idx}
                                isSelected={selectedImageIndex === idx}
                                inputMode={inputMode}
                                onSelect={() => setSelectedImageIndex(idx)}
                                onMove={(newX, newY) => {
                                    const updated = [...images];
                                    updated[idx] = { ...updated[idx], x: newX, y: newY };
                                    setImages(updated);
                                }}
                                onMoveEnd={(newX, newY) => {
                                    const updated = [...images];
                                    updated[idx] = { ...updated[idx], x: newX, y: newY };
                                    handleImagesChange(updated);
                                }}
                                onDelete={() => {
                                    const filtered = images.filter((_, i) => i !== idx);
                                    setSelectedImageIndex(null);
                                    handleImagesChange(filtered);
                                }}
                                primaryColor={colors.primary}
                            />
                        ))}
                    </View>

                    {/* Drawing layer wrapped in pan handler */}
                    <View style={[StyleSheet.absoluteFill, { zIndex: 3 }]} pointerEvents={inputMode === "write" || inputMode === "erase" ? "auto" : "none"} {...panResponder.panHandlers}>
                        <Svg
                            style={StyleSheet.absoluteFill}
                            width={canvasSize.width || '100%'}
                            height={canvasSize.height || '100%'}
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
                                            pushUndo(paths);
                                            const filtered = paths.filter((_, i) => i !== index);
                                            setPaths(filtered);
                                            pathsRef.current = filtered;
                                            saveNotebook(textEntry, filtered, images);
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

                    {/* Floating undo/redo pill */}
                    {(undoStackRef.current.length > 0 || redoStackRef.current.length > 0) && (
                        <View style={[styles.undoRedoGroup, { zIndex: 6 }]} pointerEvents="box-none">
                            <TouchableOpacity
                                style={[styles.undoRedoBtn, undoStackRef.current.length === 0 && { opacity: 0.3 }]}
                                onPress={handleUndo}
                                disabled={undoStackRef.current.length === 0}
                            >
                                <Ionicons name="arrow-undo" size={20} color={colors.textDark} />
                            </TouchableOpacity>
                            <View style={{ width: 1, height: 20, backgroundColor: 'rgba(0,0,0,0.1)' }} />
                            <TouchableOpacity
                                style={[styles.undoRedoBtn, redoStackRef.current.length === 0 && { opacity: 0.3 }]}
                                onPress={handleRedo}
                                disabled={redoStackRef.current.length === 0}
                            >
                                <Ionicons name="arrow-redo" size={20} color={colors.textDark} />
                            </TouchableOpacity>
                        </View>
                    )}

                </View>
            </Animated.View>
        </KeyboardAvoidingView>
        </WebContainer>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    journalContainer: { flex: 1 },
    saveBtn: { paddingHorizontal: 16, paddingVertical: 8 },
    saveBtnText: { fontWeight: "700", fontSize: 16 },
    toolbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 10, paddingVertical: 8, zIndex: 10 },
    toolbarSection: { flexDirection: "row", alignItems: "center", gap: 2, minWidth: 90 },
    pageArrow: { padding: 6 },
    pageIndicator: { fontSize: 14, fontWeight: "700", minWidth: 36, textAlign: "center" },
    toolbarIconBtn: { padding: 6 },
    toolbarCenter: { flexDirection: "row", backgroundColor: "#F0F0F4", borderRadius: 20, padding: 3, gap: 1 },
    modeBtn: { paddingHorizontal: 11, paddingVertical: 6, borderRadius: 16 },
    canvasArea: { flex: 1, position: "relative", overflow: 'hidden' },
    // @ts-ignore web-only fixed positioning
    dropdownBackdrop: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99 },
    dropdownMenu: { position: "absolute", top: 40, right: 0, borderRadius: 10, paddingVertical: 4, minWidth: 160, zIndex: 100 },
    dropdownItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 12 },
    dropdownText: { fontSize: 15, fontWeight: "500" },
    absoluteFill: { ...StyleSheet.absoluteFillObject },
    bgHorizontalLine: { position: "absolute", width: "100%", height: 1, backgroundColor: "rgba(0,0,0,0.15)" },
    bgVerticalLine: { position: "absolute", height: "100%", width: 1, backgroundColor: "rgba(0,0,0,0.15)" },
    drawingContainer: { ...StyleSheet.absoluteFillObject, zIndex: 1 },
    textInput: { flex: 1, padding: 24, paddingTop: 24, fontSize: 16, lineHeight: 24, fontFamily: Platform.OS === "ios" ? "System" : "Roboto", textAlignVertical: "top", backgroundColor: "transparent" },
    writeHint: { ...StyleSheet.absoluteFillObject, justifyContent: "center", alignItems: "center" },
    undoRedoGroup: { position: "absolute", bottom: 24, right: 24, flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.9)", borderRadius: 22, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 4, elevation: 3 },
    undoRedoBtn: { paddingHorizontal: 12, paddingVertical: 10 },
    imageDeleteBtn: { position: "absolute", top: -8, right: -8, width: 24, height: 24, borderRadius: 12, justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 2 },
    writeOverlayText: { marginTop: 16, fontSize: 16, fontWeight: "500" },
    drawToolbar: { alignItems: "center", paddingVertical: 8, zIndex: 9 },
    drawToolbarInner: { flexDirection: "row", alignItems: "center", gap: 12 },
    colorRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    colorDot: { width: 24, height: 24, borderRadius: 12 },
    drawDivider: { width: 1, height: 20, borderRadius: 1 },
    strokeRow: { flexDirection: "row", alignItems: "center", gap: 4 },
    strokeOption: { width: 36, height: 28, borderRadius: 6, borderWidth: 1, borderColor: "#E0E0E0", justifyContent: "center", alignItems: "center" },
    strokePreview: { width: 20, borderRadius: 2 },
});
