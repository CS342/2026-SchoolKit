// Dynamic content-page route. `slug` is a topic's slug: the viewer gets that topic's
// version picked for their role/grade (features/content/versions.ts), or the
// least-targeted version when none is meant for them — direct links always open.
// `?v=<pageId>` opens one exact version (the editor's "View live"), and a page's own
// slug still works for older links. Falls back to the bundled fixture when offline or
// unseeded, so the app always renders. Everything downstream (parse → render) is
// identical whichever source wins.
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
import { parseAudience } from '../../features/content/audience';
import { pickVersion, fallbackVersion } from '../../features/content/versions';
import { useAudienceViewer } from '../../hooks/useAudienceFilter';
import { replacedBuiltInId } from '../../hooks/useResources';
import type { ContentDoc } from '../../features/content/types';

type Row = { id: string; topic_id?: string; title: string; doc: any };

export default function ContentPageRoute() {
  const { slug, v } = useLocalSearchParams<{ slug: string; v?: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const viewer = useAudienceViewer();
  const { fireResourceOpened, fireResourceScrolledToEnd } = useAccomplishments();
  const [loading, setLoading] = useState(true);
  const [doc, setDoc] = useState<ContentDoc | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      let raw: unknown = null;
      // The id bookmarks, downloads and progress use — the same one the library card has.
      let resourceId: string | undefined;
      if (slug) {
        try {
          const published = () => supabase.from('content_pages').select('*').eq('status', 'published');
          let topicId: string | undefined;
          let exact: Row | null = null;
          if (v) {
            const { data } = await published().eq('id', v).maybeSingle();
            if (data) exact = data as Row;
          }
          if (!exact) {
            const { data: topic } = await supabase.from('content_topics').select('id').eq('slug', slug).maybeSingle();
            if (topic) topicId = (topic as any).id;
          }
          if (!exact && !topicId) {
            const { data } = await published().eq('slug', slug).maybeSingle();
            if (data) exact = data as Row;
          }
          topicId = topicId ?? exact?.topic_id ?? exact?.id;
          if (topicId) {
            const { data } = await published().eq('topic_id', topicId).order('created_at', { ascending: true });
            const versions = ((data ?? []) as Row[]).map((r) => ({ ...r, audience: parseAudience(r.doc?.audience) }));
            const all = versions.length ? versions : exact ? [{ ...exact, audience: undefined }] : [];
            const chosen = exact ?? pickVersion(all, viewer) ?? fallbackVersion(all);
            if (chosen) {
              raw = chosen.doc;
              resourceId = replacedBuiltInId(all) ?? chosen.doc?.resourceId ?? `cp_${topicId}`;
            }
          }
        } catch {
          // network error / table not yet created → fall through to the fixture
        }
        if (!raw) raw = FIXTURE_DOCS[slug] ?? null; // bundled fallback (offline / unseeded)
      }
      const parsed = raw ? parseContentDoc(raw) : null;
      if (parsed?.warnings.length) console.warn(`[content:${slug}]`, parsed.warnings.join('; '));
      if (!cancelled) {
        setDoc(parsed?.doc ? { ...parsed.doc, resourceId: resourceId ?? parsed.doc.resourceId } : null);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [slug, v, viewer]);

  // Record read-progress so For You / Knowledge Tree can show In progress / Done.
  // Opened fires on load; scrolled-to-end is reported by ContentPage's onReachEnd.
  // Keyed by doc.resourceId — set above to the same id bookmarks, downloads, and the
  // resource list use — so the status attaches to the right row.
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
