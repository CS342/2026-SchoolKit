import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../lib/supabase";

interface OfflineContextType {
  isOnline: boolean;
  isLoading: boolean;
  hasPendingChanges: boolean;
  syncPendingChanges: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

const PENDING_CHANGES_KEY = "@schoolkit_pending_changes";

// Drop a change after this many failed sync attempts so a permanently-failing
// change doesn't get retried forever.
const MAX_SYNC_ATTEMPTS = 5;

interface PendingChange {
  id: string;
  type:
    | "profile_update"
    | "bookmark_add"
    | "bookmark_remove"
    | "progress_update"
    | "story_bookmark_add"
    | "story_bookmark_remove";
  payload: Record<string, unknown>;
  timestamp: number;
  /** Number of failed sync attempts so far. Absent for changes queued before this field existed. */
  attempts?: number;
}

export function OfflineProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const isOnlineRef = useRef(true);
  const isSyncingRef = useRef(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);

  useEffect(() => {
    // Check initial network state
    NetInfo.fetch().then((state: NetInfoState) => {
      const connected = state.isConnected ?? true;
      isOnlineRef.current = connected;
      setIsOnline(connected);
      setIsLoading(false);
    });

    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const wasOffline = !isOnlineRef.current;
      const nowOnline = state.isConnected ?? true;

      isOnlineRef.current = nowOnline;
      setIsOnline(nowOnline);

      // Auto-sync when coming back online
      if (wasOffline && nowOnline) {
        syncPendingChanges();
      }
    });

    // Check for pending changes on mount
    checkPendingChanges();

    return () => unsubscribe();
  }, []);

  const checkPendingChanges = async () => {
    try {
      const stored = await AsyncStorage.getItem(PENDING_CHANGES_KEY);
      if (stored) {
        const changes: PendingChange[] = JSON.parse(stored);
        setHasPendingChanges(changes.length > 0);
      }
    } catch (error) {
      console.error("Error checking pending changes:", error);
    }
  };

  const syncPendingChanges = async () => {
    if (!isOnlineRef.current) return;
    // Prevent concurrent runs (e.g. NetInfo reconnect firing while another
    // trigger is mid-sync) from reading the same snapshot and double-applying.
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;

    try {
      const stored = await AsyncStorage.getItem(PENDING_CHANGES_KEY);
      if (!stored) return;

      const changes: PendingChange[] = JSON.parse(stored);
      if (changes.length === 0) return;

      const failedChanges: PendingChange[] = [];

      for (const change of changes) {
        try {
          switch (change.type) {
            case "bookmark_add": {
              const { error } = await supabase
                .from("user_bookmarks")
                .insert({
                  user_id: change.payload.user_id as string,
                  resource_id: change.payload.resource_id as string,
                });
              if (error) throw error;
              break;
            }
            case "bookmark_remove": {
              const { error } = await supabase
                .from("user_bookmarks")
                .delete()
                .eq("user_id", change.payload.user_id as string)
                .eq("resource_id", change.payload.resource_id as string);
              if (error) throw error;
              break;
            }
            case "profile_update": {
              const { user_id, ...updates } = change.payload;
              const { error } = await supabase
                .from("profiles")
                .update(updates)
                .eq("id", user_id as string);
              if (error) throw error;
              break;
            }
            case "progress_update": {
              console.warn("progress_update sync not yet implemented");
              break;
            }
            case "story_bookmark_add": {
              const { error } = await supabase
                .from("story_bookmarks")
                .insert({
                  user_id: change.payload.user_id as string,
                  story_id: change.payload.story_id as string,
                });
              if (error) throw error;
              break;
            }
            case "story_bookmark_remove": {
              const { error } = await supabase
                .from("story_bookmarks")
                .delete()
                .eq("user_id", change.payload.user_id as string)
                .eq("story_id", change.payload.story_id as string);
              if (error) throw error;
              break;
            }
          }
        } catch (err) {
          const attempts = (change.attempts ?? 0) + 1;
          if (attempts >= MAX_SYNC_ATTEMPTS) {
            console.error(
              `Dropping change ${change.id} after ${attempts} failed attempts:`,
              err
            );
          } else {
            console.error(
              `Failed to sync change ${change.id} (attempt ${attempts}):`,
              err
            );
            failedChanges.push({ ...change, attempts });
          }
        }
      }

      if (failedChanges.length > 0) {
        await AsyncStorage.setItem(
          PENDING_CHANGES_KEY,
          JSON.stringify(failedChanges)
        );
        setHasPendingChanges(true);
      } else {
        await AsyncStorage.removeItem(PENDING_CHANGES_KEY);
        setHasPendingChanges(false);
      }

      console.log(
        `Synced ${changes.length - failedChanges.length}/${changes.length} pending changes`
      );
    } catch (error) {
      console.error("Error syncing pending changes:", error);
    } finally {
      isSyncingRef.current = false;
    }
  };

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        isLoading,
        hasPendingChanges,
        syncPendingChanges,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
}

export function useOffline() {
  const context = useContext(OfflineContext);
  if (context === undefined) {
    throw new Error("useOffline must be used within an OfflineProvider");
  }
  return context;
}

// Helper to queue changes when offline
export async function queueOfflineChange(
  change: Omit<PendingChange, "id" | "timestamp">
) {
  try {
    const stored = await AsyncStorage.getItem(PENDING_CHANGES_KEY);
    const changes: PendingChange[] = stored ? JSON.parse(stored) : [];

    changes.push({
      ...change,
      id: Date.now().toString(),
      timestamp: Date.now(),
    });

    await AsyncStorage.setItem(PENDING_CHANGES_KEY, JSON.stringify(changes));
  } catch (error) {
    console.error("Error queueing offline change:", error);
  }
}
