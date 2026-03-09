import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Paths, File as FSFile } from 'expo-file-system';

export const MAX_NOTEBOOKS = 20;
export const MAX_PAGES = 50;
export const MAX_IMAGES_PER_PAGE = 5;

export interface PathData {
    path: string;
    color: string;
    strokeWidth: number;
}

export interface JournalImage {
    uri: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface JournalPage {
    textEntry: string;
    paths: PathData[];
    images: JournalImage[];
}

export interface JournalNotebook {
    id: string;
    title: string;
    coverId: string;
    paperId: string;
    pages: JournalPage[];
    createdAt: number;
    updatedAt: number;
}

interface JournalContextType {
    notebooks: JournalNotebook[];
    isLoaded: boolean;
    createNotebook: (title: string, coverId: string, paperId: string) => string | null;
    updateNotebook: (id: string, updates: Partial<JournalNotebook>) => void;
    deleteNotebook: (id: string) => void;
    getNotebook: (id: string) => JournalNotebook | undefined;
}

const JournalContext = createContext<JournalContextType | undefined>(undefined);

const deletePageImages = (page: JournalPage) => {
    const docUri = Paths.document.uri;
    for (const img of page.images) {
        if (img.uri.startsWith(docUri)) {
            try {
                const f = new FSFile(img.uri);
                if (f.exists) f.delete();
            } catch {
                // Ignore cleanup errors
            }
        }
    }
};

export const JournalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [notebooks, setNotebooks] = useState<JournalNotebook[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        loadNotebooks();
    }, []);

    const loadNotebooks = async () => {
        try {
            const data = await AsyncStorage.getItem('@schoolkit_journals');
            if (data) {
                const parsed: JournalNotebook[] = JSON.parse(data);
                const migrated = parsed.map(n => {
                    const notebook = { ...n } as any;
                    // Migration: Ensure all notebooks have the 'pages' property
                    if (!notebook.pages) {
                        notebook.pages = [{
                            textEntry: notebook.textEntry || '',
                            paths: notebook.paths || [],
                            images: []
                        }];
                    } else {
                        notebook.pages = notebook.pages.map((p: any) => ({
                            textEntry: p.textEntry || '',
                            paths: p.paths || [],
                            images: p.images || []
                        }));
                    }
                    // Strip legacy fields
                    delete notebook.textEntry;
                    delete notebook.paths;
                    return notebook as JournalNotebook;
                });
                setNotebooks(migrated);
                // Re-save cleaned data
                await AsyncStorage.setItem('@schoolkit_journals', JSON.stringify(migrated));
            }
            setIsLoaded(true);
        } catch (e) {
            console.error('Failed to load notebooks', e);
            setIsLoaded(true);
        }
    };

    const saveNotebooks = async (newNotebooks: JournalNotebook[]) => {
        try {
            await AsyncStorage.setItem('@schoolkit_journals', JSON.stringify(newNotebooks));
            setNotebooks(newNotebooks);
        } catch (e) {
            console.error('Failed to save notebooks', e);
        }
    };

    const createNotebook = (title: string, coverId: string, paperId: string): string | null => {
        if (notebooks.length >= MAX_NOTEBOOKS) {
            return null;
        }
        const newNotebook: JournalNotebook = {
            id: Date.now().toString(),
            title,
            coverId,
            paperId,
            pages: [{ textEntry: '', paths: [], images: [] }],
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        const updated = [newNotebook, ...notebooks];
        saveNotebooks(updated);
        return newNotebook.id;
    };

    const updateNotebook = (id: string, updates: Partial<JournalNotebook>) => {
        setNotebooks((prev) => {
            const updated = prev.map((n) => {
                if (n.id === id) {
                    return { ...n, ...updates, updatedAt: Date.now() };
                }
                return n;
            });
            AsyncStorage.setItem('@schoolkit_journals', JSON.stringify(updated)).catch((e) =>
                console.error('Failed to auto-save notebooks', e)
            );
            return updated;
        });
    };

    const deleteNotebook = (id: string) => {
        const notebook = notebooks.find(n => n.id === id);
        if (notebook) {
            // Clean up persisted images
            for (const page of notebook.pages) {
                deletePageImages(page);
            }
        }
        const updated = notebooks.filter(n => n.id !== id);
        saveNotebooks(updated);
    };

    const getNotebook = (id: string) => {
        return notebooks.find(n => n.id === id);
    };

    // Provide empty-state context while loading to avoid flash
    const contextValue: JournalContextType = {
        notebooks,
        isLoaded,
        createNotebook,
        updateNotebook,
        deleteNotebook,
        getNotebook,
    };

    return (
        <JournalContext.Provider value={contextValue}>
            {children}
        </JournalContext.Provider>
    );
};

export const useJournal = () => {
    const context = useContext(JournalContext);
    if (!context) {
        throw new Error('useJournal must be used within a JournalProvider');
    }
    return context;
};
