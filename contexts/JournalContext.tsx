import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    pages: JournalPage[]; // source of truth
    createdAt: number;
    updatedAt: number;
    // Legacy support
    textEntry?: string;
    paths?: PathData[];
}

interface JournalContextType {
    notebooks: JournalNotebook[];
    createNotebook: (title: string, coverId: string, paperId: string) => string;
    updateNotebook: (id: string, updates: Partial<JournalNotebook>) => void;
    deleteNotebook: (id: string) => void;
    getNotebook: (id: string) => JournalNotebook | undefined;
}

const JournalContext = createContext<JournalContextType | undefined>(undefined);

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
                // Migration: Ensure all notebooks have the 'pages' property
                const migrated = parsed.map(n => {
                    if (!n.pages) {
                        return {
                            ...n,
                            pages: [{
                                textEntry: n.textEntry || '',
                                paths: n.paths || [],
                                images: []
                            }]
                        };
                    }
                    if (n.pages) {
                        return {
                            ...n,
                            pages: n.pages.map(p => ({
                                textEntry: p.textEntry || '',
                                paths: p.paths || [],
                                images: p.images || []
                            }))
                        };
                    }
                    return n;
                });
                setNotebooks(migrated);
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
            setNotebooks(newNotebooks); // Update state directly
        } catch (e) {
            console.error('Failed to save notebooks', e);
        }
    };

    const createNotebook = (title: string, coverId: string, paperId: string) => {
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
            // Fire and forget save logic, to avoid waiting on async storage
            AsyncStorage.setItem('@schoolkit_journals', JSON.stringify(updated)).catch((e) =>
                console.error('Failed to auto-save notebooks', e)
            );
            return updated;
        });
    };

    const deleteNotebook = (id: string) => {
        const updated = notebooks.filter(n => n.id !== id);
        saveNotebooks(updated);
    };

    const getNotebook = (id: string) => {
        return notebooks.find(n => n.id === id);
    };

    if (!isLoaded) return null;

    return (
        <JournalContext.Provider value={{ notebooks, createNotebook, updateNotebook, deleteNotebook, getNotebook }}>
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
