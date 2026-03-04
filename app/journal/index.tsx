import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform, Alert, Modal, TextInput, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useJournal, JournalNotebook } from '../../contexts/JournalContext';
import { COVERS } from '../../constants/journal';

export default function JournalLibraryScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const theme = useTheme();
    const { colors, appStyles, shadows } = theme;
    const { notebooks, deleteNotebook, updateNotebook } = useJournal();
    const [renameId, setRenameId] = React.useState<string | null>(null);
    const [newName, setNewName] = React.useState('');

    const handleDelete = (notebook: JournalNotebook) => {
        Alert.alert(
            "Delete Notebook",
            `Are you sure you want to delete "${notebook.title}"? This cannot be undone.`,
            [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => deleteNotebook(notebook.id) }
            ]
        );
    };

    const startRename = (notebook: JournalNotebook) => {
        setRenameId(notebook.id);
        setNewName(notebook.title);
    };

    const confirmRename = () => {
        if (!renameId) return;
        const trimmed = newName.trim();
        if (!trimmed) {
            Alert.alert("Invalid Name", "Notebook title cannot be empty.");
            return;
        }
        updateNotebook(renameId, { title: trimmed.slice(0, 40) });
        setRenameId(null);
    };

    const handleExport = async (notebook: JournalNotebook) => {
        let content = `${notebook.title}\n${'='.repeat(notebook.title.length)}\n\n`;
        notebook.pages.forEach((page, i) => {
            content += `--- Page ${i + 1} ---\n`;
            if (page.textEntry.trim()) {
                content += page.textEntry.trim() + "\n";
            }
            if (page.paths.length > 0) {
                content += `[${page.paths.length} drawing stroke${page.paths.length !== 1 ? 's' : ''}]\n`;
            }
            if (page.images.length > 0) {
                content += `[${page.images.length} image${page.images.length !== 1 ? 's' : ''}]\n`;
            }
            content += "\n";
        });
        try {
            await Share.share({ message: content });
        } catch {
            // User cancelled
        }
    };

    const renderShelf = ({ item: rowNotebooks, index }: { item: (JournalNotebook | 'new')[]; index: number }) => {
        return (
            <View style={styles.shelfContainer}>
                <View style={styles.row}>
                    {rowNotebooks.map((item, colIndex) => {
                        const isNew = item === 'new';
                        if (isNew) {
                            return (
                                <TouchableOpacity
                                    key={`new-${index}-${colIndex}`}
                                    style={[styles.notebookCard, styles.newCard, { borderColor: colors.primary, backgroundColor: colors.backgroundLight }]}
                                    onPress={() => router.push('/journal/create')}
                                >
                                    <View style={styles.notebookInner}>
                                        <Ionicons name="add" size={48} color={colors.primary} />
                                        <Text style={[styles.newText, { color: colors.primary }]}>New</Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        }

                        const notebook = item as JournalNotebook;
                        const cover = COVERS.find(c => c.id === notebook.coverId) || COVERS[0];

                        return (
                            <TouchableOpacity
                                key={notebook.id}
                                style={[styles.notebookCard, { backgroundColor: cover.color, ...shadows.card }]}
                                onPress={() => router.push(`/journal/${notebook.id}`)}
                                onLongPress={() => handleDelete(notebook)}
                            >
                                <View style={[styles.spine, { backgroundColor: 'rgba(0,0,0,0.15)' }]} />
                                <View style={styles.notebookInner}>
                                    <TouchableOpacity
                                        style={styles.moreButton}
                                        onPress={() => {
                                            Alert.alert(
                                                notebook.title,
                                                "What would you like to do?",
                                                [
                                                    { text: "Rename", onPress: () => startRename(notebook) },
                                                    { text: "Export", onPress: () => handleExport(notebook) },
                                                    { text: "Delete", style: "destructive", onPress: () => handleDelete(notebook) },
                                                    { text: "Cancel", style: "cancel" }
                                                ]
                                            );
                                        }}
                                    >
                                        <Ionicons name="ellipsis-vertical" size={16} color={cover.textColor} />
                                    </TouchableOpacity>
                                    <View style={styles.titleContainer}>
                                        <Text style={[styles.coverTitle, { color: cover.textColor }]} numberOfLines={2}>
                                            {notebook.title}
                                        </Text>
                                    </View>
                                    <Text style={[styles.dateText, { color: cover.textColor }]}>
                                        {new Date(notebook.updatedAt).toLocaleDateString()}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                    {/* Fill empty spots in the row to keep shelf sizing consistent */}
                    {rowNotebooks.length < 3 && Array.from({ length: 3 - rowNotebooks.length }).map((_, i) => (
                        <View key={`empty-${index}-${i}`} style={styles.notebookCardEmpty} />
                    ))}
                </View>
                {/* The visual shelf block */}
                <View style={[styles.shelfPlank, { backgroundColor: '#D4B895' }]}>
                    <View style={[styles.shelfEdge, { backgroundColor: '#C0A07B' }]} />
                </View>
            </View>
        );
    };

    // Group items into rows of 3 to create shelves
    const rawData = ['new', ...notebooks] as (JournalNotebook | 'new')[];
    const rows = [];
    for (let i = 0; i < rawData.length; i += 3) {
        rows.push(rawData.slice(i, i + 3));
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.appBackground }]}>
            <View style={[appStyles.editHeader, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity style={appStyles.editBackButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={colors.textDark} />
                </TouchableOpacity>
                <Text style={appStyles.editHeaderTitle}>My Library</Text>
                <View style={{ width: 40 }} />
            </View>

            <FlatList
                data={rows}
                keyExtractor={(_, index) => `shelf-${index}`}
                renderItem={renderShelf}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />

            <Modal visible={!!renameId} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.white }]}>
                        <Text style={[styles.modalTitle, { color: colors.textDark }]}>Rename Notebook</Text>
                        <TextInput
                            style={[styles.input, { borderColor: colors.borderCard, color: colors.textDark }]}
                            value={newName}
                            onChangeText={setNewName}
                            autoFocus
                            placeholder="Notebook Title"
                            maxLength={40}
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.modalBtn} onPress={() => setRenameId(null)}>
                                <Text style={{ color: colors.textLight }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.primary, borderRadius: 8 }]} onPress={confirmRename}>
                                <Text style={{ color: "#FFF", fontWeight: "600" }}>Rename</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    listContent: {
        paddingTop: 16,
        paddingBottom: 40,
    },
    shelfContainer: {
        marginBottom: 20,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 0,
        zIndex: 1,
    },
    notebookCard: {
        width: '30%',
        aspectRatio: 0.75,
        borderRadius: 8,
        borderTopRightRadius: 10,
        borderBottomRightRadius: 10,
        position: 'relative',
        overflow: 'hidden',
    },
    notebookCardEmpty: {
        width: '30%',
    },
    notebookInner: {
        flex: 1,
        padding: 12,
        paddingLeft: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    newCard: {
        borderWidth: 2,
        borderStyle: 'dashed',
    },
    newText: {
        marginTop: 8,
        fontSize: 14,
        fontWeight: '600',
    },
    spine: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 12,
    },
    titleContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    coverTitle: {
        fontSize: 13,
        fontWeight: '700',
        textAlign: 'center',
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    },
    moreButton: {
        position: 'absolute',
        top: 8,
        right: 4,
        padding: 4,
        zIndex: 10,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 20,
        padding: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "700",
        marginBottom: 16,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        marginBottom: 20,
    },
    modalButtons: {
        flexDirection: "row",
        justifyContent: "flex-end",
        gap: 12,
    },
    modalBtn: {
        paddingVertical: 10,
        paddingHorizontal: 16,
    },
    dateText: {
        fontSize: 10,
        opacity: 0.8,
        marginTop: 4,
    },
    shelfPlank: {
        height: 16,
        marginHorizontal: 8,
        borderBottomLeftRadius: 4,
        borderBottomRightRadius: 4,
        position: 'relative',
        top: -4,
        zIndex: 0,
    },
    shelfEdge: {
        height: 4,
        width: '100%',
        position: 'absolute',
        bottom: 0,
        borderBottomLeftRadius: 4,
        borderBottomRightRadius: 4,
    },
});
