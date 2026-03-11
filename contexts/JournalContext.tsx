import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { supabase, supabaseUrl } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { decode } from 'base64-arraybuffer';

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
    createNotebook: (title: string, coverId: string, paperId: string) => Promise<string | null>;
    updateNotebook: (id: string, updates: Partial<JournalNotebook>) => void;
    deleteNotebook: (id: string) => Promise<void>;
    getNotebook: (id: string) => JournalNotebook | undefined;
    uploadJournalImage: (localUri: string) => Promise<string | null>;
}

const JournalContext = createContext<JournalContextType | undefined>(undefined);

const LEGACY_STORAGE_KEY = '@schoolkit_journals';
const MIGRATION_FLAG_KEY = '@schoolkit_journals_migrated';

// ─── helpers ──────────────────────────────────────────────

/** Convert a Supabase DB row into the app-level JournalNotebook shape (without pages – those load separately). */
function rowToNotebook(row: any, pages: JournalPage[]): JournalNotebook {
    return {
        id: row.id,
        title: row.title,
        coverId: row.cover_id,
        paperId: row.paper_id,
        pages,
        createdAt: new Date(row.created_at).getTime(),
        updatedAt: new Date(row.updated_at).getTime(),
    };
}

function pageRowToPage(row: any): JournalPage {
    return {
        textEntry: row.text_entry ?? '',
        paths: (row.paths ?? []) as PathData[],
        images: (row.images ?? []) as JournalImage[],
    };
}

// ─── provider ─────────────────────────────────────────────

export const JournalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [notebooks, setNotebooks] = useState<JournalNotebook[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Load notebooks from Supabase ──────────────────────
    const loadFromSupabase = useCallback(async (userId: string) => {
        try {
            // Fetch all journals for this user
            const { data: journalRows, error: jErr } = await supabase
                .from('journals')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (jErr) throw jErr;
            if (!journalRows || journalRows.length === 0) {
                setNotebooks([]);
                setIsLoaded(true);
                return;
            }

            // Fetch all pages for these journals in one query
            const journalIds = journalRows.map(j => j.id);
            const { data: pageRows, error: pErr } = await supabase
                .from('journal_pages')
                .select('*')
                .in('journal_id', journalIds)
                .order('page_index', { ascending: true });

            if (pErr) throw pErr;

            // Group pages by journal_id
            const pagesByJournal: Record<string, JournalPage[]> = {};
            for (const pr of (pageRows ?? [])) {
                if (!pagesByJournal[pr.journal_id]) pagesByJournal[pr.journal_id] = [];
                pagesByJournal[pr.journal_id].push(pageRowToPage(pr));
            }

            const loaded = journalRows.map(jr =>
                rowToNotebook(jr, pagesByJournal[jr.id] ?? [{ textEntry: '', paths: [], images: [] }])
            );

            setNotebooks(loaded);
            setIsLoaded(true);
        } catch (e) {
            console.error('Failed to load journals from Supabase', e);
            setIsLoaded(true);
        }
    }, []);

    // ── Migrate local AsyncStorage data → Supabase (one-time) ─
    const migrateLocalData = useCallback(async (userId: string) => {
        try {
            const flag = await AsyncStorage.getItem(MIGRATION_FLAG_KEY);
            if (flag === 'done') return;

            const raw = await AsyncStorage.getItem(LEGACY_STORAGE_KEY);
            if (!raw) {
                await AsyncStorage.setItem(MIGRATION_FLAG_KEY, 'done');
                return;
            }

            const localNotebooks: any[] = JSON.parse(raw);
            if (localNotebooks.length === 0) {
                await AsyncStorage.setItem(MIGRATION_FLAG_KEY, 'done');
                return;
            }

            for (const ln of localNotebooks) {
                // Ensure pages array
                const pages: JournalPage[] = ln.pages
                    ? ln.pages.map((p: any) => ({
                        textEntry: p.textEntry || '',
                        paths: p.paths || [],
                        images: p.images || [],
                    }))
                    : [{ textEntry: ln.textEntry || '', paths: ln.paths || [], images: [] }];

                // Insert journal
                const { data: journal, error: jErr } = await supabase
                    .from('journals')
                    .insert({
                        user_id: userId,
                        title: ln.title || 'Untitled',
                        cover_id: ln.coverId || 'cover-leather',
                        paper_id: ln.paperId || 'paper-blank',
                    })
                    .select()
                    .single();

                if (jErr || !journal) {
                    console.error('Migration: failed to insert journal', jErr);
                    continue;
                }

                // Insert pages
                const pageInserts = pages.map((p, idx) => ({
                    journal_id: journal.id,
                    page_index: idx,
                    text_entry: p.textEntry,
                    paths: JSON.parse(JSON.stringify(p.paths)),
                    images: JSON.parse(JSON.stringify(p.images)),
                }));

                const { error: pErr } = await supabase
                    .from('journal_pages')
                    .insert(pageInserts);

                if (pErr) console.error('Migration: failed to insert pages', pErr);
            }

            await AsyncStorage.setItem(MIGRATION_FLAG_KEY, 'done');
            // Clean up old data
            await AsyncStorage.removeItem(LEGACY_STORAGE_KEY);
            console.log(`Migrated ${localNotebooks.length} journals to Supabase`);
        } catch (e) {
            console.error('Journal migration failed', e);
        }
    }, []);

    // ── Init: migrate then load ───────────────────────────
    useEffect(() => {
        if (!user) {
            setNotebooks([]);
            setIsLoaded(true);
            return;
        }
        (async () => {
            await migrateLocalData(user.id);
            await loadFromSupabase(user.id);
        })();
    }, [user, migrateLocalData, loadFromSupabase]);

    // ── Create ────────────────────────────────────────────
    const createNotebook = async (title: string, coverId: string, paperId: string): Promise<string | null> => {
        if (!user) return null;
        if (notebooks.length >= MAX_NOTEBOOKS) return null;

        try {
            const { data: journal, error: jErr } = await supabase
                .from('journals')
                .insert({
                    user_id: user.id,
                    title,
                    cover_id: coverId,
                    paper_id: paperId,
                })
                .select()
                .single();

            if (jErr || !journal) {
                console.error('Failed to create journal', jErr);
                return null;
            }

            // Insert initial empty page
            await supabase.from('journal_pages').insert({
                journal_id: journal.id,
                page_index: 0,
                text_entry: '',
                paths: [],
                images: [],
            });

            const newNotebook = rowToNotebook(journal, [{ textEntry: '', paths: [], images: [] }]);
            setNotebooks(prev => [newNotebook, ...prev]);
            return journal.id;
        } catch (e) {
            console.error('Failed to create notebook', e);
            return null;
        }
    };

    // ── Update (debounced save to Supabase) ───────────────
    const updateNotebook = (id: string, updates: Partial<JournalNotebook>) => {
        // Optimistic local update
        setNotebooks(prev =>
            prev.map(n => (n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n))
        );

        // Debounced persist to Supabase
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(async () => {
            try {
                // Update journal metadata if title changed
                if (updates.title) {
                    await supabase
                        .from('journals')
                        .update({ title: updates.title })
                        .eq('id', id);
                }

                // Update pages if they changed
                if (updates.pages) {
                    // Get existing page rows to know which to upsert
                    const { data: existingPages } = await supabase
                        .from('journal_pages')
                        .select('id, page_index')
                        .eq('journal_id', id)
                        .order('page_index', { ascending: true });

                    const existingByIndex: Record<number, string> = {};
                    for (const ep of (existingPages ?? [])) {
                        existingByIndex[ep.page_index] = ep.id;
                    }

                    // Upsert each page
                    for (let i = 0; i < updates.pages.length; i++) {
                        const page = updates.pages[i];
                        const existingId = existingByIndex[i];

                        if (existingId) {
                            // Update existing page
                            await supabase
                                .from('journal_pages')
                                .update({
                                    text_entry: page.textEntry,
                                    paths: JSON.parse(JSON.stringify(page.paths)),
                                    images: JSON.parse(JSON.stringify(page.images)),
                                })
                                .eq('id', existingId);
                        } else {
                            // Insert new page
                            await supabase
                                .from('journal_pages')
                                .insert({
                                    journal_id: id,
                                    page_index: i,
                                    text_entry: page.textEntry,
                                    paths: JSON.parse(JSON.stringify(page.paths)),
                                    images: JSON.parse(JSON.stringify(page.images)),
                                });
                        }
                    }

                    // Delete extra pages if user removed some
                    const extraIndices = Object.keys(existingByIndex)
                        .map(Number)
                        .filter(idx => idx >= updates.pages!.length);
                    if (extraIndices.length > 0) {
                        await supabase
                            .from('journal_pages')
                            .delete()
                            .eq('journal_id', id)
                            .in('page_index', extraIndices);
                    }
                }
            } catch (e) {
                console.error('Failed to persist notebook update', e);
            }
        }, 1500);
    };

    // ── Delete ────────────────────────────────────────────
    const deleteNotebook = async (id: string) => {
        // Optimistic local removal
        const notebook = notebooks.find(n => n.id === id);
        setNotebooks(prev => prev.filter(n => n.id !== id));

        try {
            // Delete images from storage
            if (notebook && user) {
                const allImageUris = notebook.pages.flatMap(p => p.images.map(img => img.uri));
                for (const uri of allImageUris) {
                    // Extract storage path from URL: .../journal-images/userId/filename
                    const match = uri.match(/journal-images\/(.+)$/);
                    if (match) {
                        await supabase.storage.from('journal-images').remove([match[1]]);
                    }
                }
            }

            // Delete journal (pages cascade automatically)
            const { error } = await supabase.from('journals').delete().eq('id', id);
            if (error) console.error('Failed to delete journal', error);
        } catch (e) {
            console.error('Failed to delete notebook', e);
        }
    };

    // ── Get ───────────────────────────────────────────────
    const getNotebook = (id: string) => {
        return notebooks.find(n => n.id === id);
    };

    // ── Upload image to Supabase Storage ──────────────────
    const uploadJournalImage = async (localUri: string): Promise<string | null> => {
        if (!user) return null;

        try {
            const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
            const storagePath = `${user.id}/${fileName}`;

            if (Platform.OS === 'web') {
                // On web, localUri is a blob URL or data URL
                const response = await fetch(localUri);
                const blob = await response.blob();

                const { error } = await supabase.storage
                    .from('journal-images')
                    .upload(storagePath, blob, { contentType: 'image/jpeg' });

                if (error) throw error;
            } else {
                // On native, read file and upload
                const { Paths, File: FSFile } = await import('expo-file-system');
                const file = new FSFile(localUri);

                // Validate file size (max 10MB)
                if (file.exists && file.size && file.size > 10 * 1024 * 1024) {
                    console.error('Image too large');
                    return null;
                }

                const base64 = await file.text({ encoding: 'base64' });
                const { error } = await supabase.storage
                    .from('journal-images')
                    .upload(storagePath, decode(base64), { contentType: 'image/jpeg' });

                if (error) throw error;
            }

            // Return public URL
            const { data } = supabase.storage
                .from('journal-images')
                .getPublicUrl(storagePath);

            return data.publicUrl;
        } catch (e) {
            console.error('Failed to upload journal image', e);
            return null;
        }
    };

    const contextValue: JournalContextType = {
        notebooks,
        isLoaded,
        createNotebook,
        updateNotebook,
        deleteNotebook,
        getNotebook,
        uploadJournalImage,
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
