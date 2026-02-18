import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { useEditorStore } from '../../../features/design-editor/store/editor-store';
import { EditorShell } from '../../../features/design-editor/components/EditorShell';
import type { DesignDocument } from '../../../features/design-editor/types/document';
import { useTheme } from '../../../contexts/ThemeContext';

export default function DesignEditorPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const loadDocument = useEditorStore((s) => s.loadDocument);
  const resetEditor = useEditorStore((s) => s.resetEditor);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isShared, setIsShared] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!id) {
        setError('No design ID');
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('designs')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !data) {
        setError('Design not found');
        setLoading(false);
        return;
      }

      loadDocument(
        data.id,
        data.title,
        data.doc as unknown as DesignDocument,
      );
      setIsShared(data.is_shared ?? false);
      setShareToken(data.share_token ?? null);
      setLoading(false);
    }

    load();

    return () => {
      resetEditor();
    };
  }, [id, loadDocument, resetEditor]);

  const handleShareChange = useCallback(
    (shared: boolean, token: string | null) => {
      setIsShared(shared);
      setShareToken(token);
    },
    [],
  );

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.appBackground,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 12, color: colors.textLight, fontSize: 14 }}>
          Loading design...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.appBackground,
        }}
      >
        <Text
          style={{
            fontSize: 18,
            fontWeight: '600',
            color: colors.textDark,
            marginBottom: 8,
          }}
        >
          {error}
        </Text>
        <Text
          style={{ color: colors.primary, fontSize: 14 }}
          onPress={() => router.push('/(editor)/designs')}
        >
          Back to designs
        </Text>
      </View>
    );
  }

  return (
    <EditorShell
      isShared={isShared}
      shareToken={shareToken}
      onShareChange={handleShareChange}
    />
  );
}
