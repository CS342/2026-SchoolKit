// Dynamic content-page route. Fetches the published ContentDoc from Supabase
// (`content_pages` by slug); falls back to the bundled fixture when offline or when
// the row hasn't been seeded yet, so the app always renders. Everything downstream
// (parse → render) is identical whichever source wins.
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../contexts/ThemeContext';
import { useAccomplishments } from '../../contexts/AccomplishmentContext';
import { ContentPage } from '../../components/content-blocks';
import { FIXTURE_DOCS } from '../../features/content/fixtures';
import { parseContentDoc } from '../../features/content/validate';
import type { ContentDoc } from '../../features/content/types';

export default function ContentPageRoute() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { fireResourceOpened, fireResourceScrolledToEnd } = useAccomplishments();
  const [loading, setLoading] = useState(true);
  const [doc, setDoc] = useState<ContentDoc | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      let raw: unknown = null;
      if (slug) {
        try {
          const { data, error } = await supabase
            .from('content_pages')
            .select('doc')
            .eq('slug', slug)
            .eq('status', 'published')
            .maybeSingle();
          if (!error && data?.doc) raw = data.doc;
        } catch {
          // network error / table not yet created → fall through to the fixture
        }
        if (!raw) raw = FIXTURE_DOCS[slug] ?? null; // bundled fallback (offline / unseeded)
      }
      const parsed = raw ? parseContentDoc(raw) : null;
      if (parsed?.warnings.length) console.warn(`[content:${slug}]`, parsed.warnings.join('; '));
      if (!cancelled) {
        setDoc(parsed?.doc ?? null);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  // Record read-progress so For You / Knowledge Tree can show In progress / Done.
  // Opened fires on load; scrolled-to-end is reported by ContentPage's onReachEnd.
  // Keyed by doc.resourceId — the same id bookmarks, downloads, and the resource
  // list use — so the status attaches to the right row.
  useEffect(() => {
    if (doc?.resourceId) fireResourceOpened(doc.resourceId);
  }, [doc?.resourceId]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.appBackground }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!doc) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.appBackground, padding: 24 }}>
        <Ionicons name="document-outline" size={48} color={colors.textLight} />
        <Text style={{ marginTop: 12, fontSize: 18, fontWeight: '600', color: colors.textDark }}>Page not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 12 }}>
          <Text style={{ color: colors.primary, fontSize: 14 }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ContentPage
      doc={doc}
      onReachEnd={() => { if (doc.resourceId) fireResourceScrolledToEnd(doc.resourceId); }}
    />
  );
}
