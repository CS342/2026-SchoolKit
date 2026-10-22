import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import type { DesignDocument } from '../../features/design-editor/types/document';

// Dynamically import ReadOnlyViewer only on web (uses Konva/Canvas API)
let ReadOnlyViewerComponent: React.ComponentType<{
  doc: DesignDocument;
  title: string;
  author: string;
}> | null = null;

if (Platform.OS === 'web') {
  ReadOnlyViewerComponent =
    require('../../features/design-editor/components/ReadOnlyViewer').ReadOnlyViewer;
}

interface SharedDesign {
  id: string;
  title: string;
  doc: DesignDocument;
  author: string;
}

export default function ShareViewerPage() {
  const { t } = useTranslation();
  const { token } = useLocalSearchParams<{ token: string }>();
  const [design, setDesign] = useState<SharedDesign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSharedDesign() {
      if (!token) {
        setError(t('stories.share.invalidLink'));
        setLoading(false);
        return;
      }

      try {
        // Call the Edge Function to get the shared design
        const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
        const response = await fetch(
          `${supabaseUrl}/functions/v1/get-shared-design?token=${token}`,
        );

        if (!response.ok) {
          setError(t('stories.share.notFoundOrRevoked'));
          setLoading(false);
          return;
        }

        const result = await response.json();
        setDesign(result);
      } catch (err) {
        setError(t('stories.share.failedToLoad'));
      } finally {
        setLoading(false);
      }
    }

    fetchSharedDesign();
  }, [token]);

  if (Platform.OS !== 'web') {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}
      >
        <Text style={{ fontSize: 16, textAlign: 'center', color: '#666' }}>
          {t('stories.share.webOnly')}
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#F3F4F6',
        }}
      >
        <ActivityIndicator size="large" color="#7B68EE" />
        <Text style={{ marginTop: 12, color: '#6B7280', fontSize: 14 }}>
          {t('stories.share.loading')}
        </Text>
      </View>
    );
  }

  if (error || !design) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#F3F4F6',
        }}
      >
        <Text
          style={{
            fontSize: 48,
            marginBottom: 16,
            opacity: 0.3,
          }}
        >
          🔗
        </Text>
        <Text
          style={{
            fontSize: 18,
            fontWeight: '600',
            color: '#111',
            marginBottom: 8,
          }}
        >
          {error || t('stories.share.notFound')}
        </Text>
        <Text style={{ fontSize: 14, color: '#6B7280' }}>
          {t('stories.share.mayHaveExpired')}
        </Text>
      </View>
    );
  }

  if (!ReadOnlyViewerComponent) return null;

  return (
    <ReadOnlyViewerComponent
      doc={design.doc}
      title={design.title}
      author={design.author}
    />
  );
}
