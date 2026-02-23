import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, Platform, ScrollView, Image, TouchableOpacity, Share, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../contexts/ThemeContext';
import { BookmarkButton } from '../../components/BookmarkButton';
import { DownloadButton } from '../../components/DownloadButton';
import { COLORS, SHADOWS } from '../../constants/onboarding-theme';
import type { DesignDocument } from '../../features/design-editor/types/document';
import { RuntimeRenderer } from '../../features/design-editor/components/runtime/RuntimeRenderer';

// Dynamically import Konva components only on web
let Stage: any = null;
let Layer: any = null;
let KonvaRect: any = null;
let ReadOnlyObjectComponent: any = null;
let WebPreviewObject: any = null;
let WebPreviewFlipCard: any = null;
let WebPreviewBottomSheet: any = null;
let WebPreviewExpandable: any = null;
let WebPreviewEntrance: any = null;
let WebPreviewCarousel: any = null;
let WebPreviewTabs: any = null;
let WebPreviewQuiz: any = null;

if (Platform.OS === 'web') {
  const konva = require('react-konva');
  Stage = konva.Stage;
  Layer = konva.Layer;
  KonvaRect = konva.Rect;
  ReadOnlyObjectComponent =
    require('../../features/design-editor/components/ReadOnlyViewer').ReadOnlyObject;
  WebPreviewObject =
    require('../../features/design-editor/components/preview/PreviewObject').PreviewObject;
  WebPreviewFlipCard =
    require('../../features/design-editor/components/preview/PreviewFlipCard').PreviewFlipCard;
  WebPreviewBottomSheet =
    require('../../features/design-editor/components/preview/PreviewBottomSheet').PreviewBottomSheet;
  WebPreviewExpandable =
    require('../../features/design-editor/components/preview/PreviewExpandable').PreviewExpandable;
  WebPreviewEntrance =
    require('../../features/design-editor/components/preview/PreviewEntrance').PreviewEntrance;
  WebPreviewCarousel =
    require('../../features/design-editor/components/preview/PreviewCarousel').PreviewCarousel;
  WebPreviewTabs =
    require('../../features/design-editor/components/preview/PreviewTabs').PreviewTabs;
  WebPreviewQuiz =
    require('../../features/design-editor/components/preview/PreviewQuiz').PreviewQuiz;
}

interface DesignData {
  title: string;
  doc: DesignDocument;
  thumbnail_url: string | null;
  owner_name: string;
}

export default function DesignViewPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [design, setDesign] = useState<DesignData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewportWidth, setViewportWidth] = useState(
    Platform.OS === 'web' ? window.innerWidth : 0,
  );
  const [viewportHeight, setViewportHeight] = useState(
    Platform.OS === 'web' ? window.innerHeight : 0,
  );

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
      setViewportHeight(window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    async function fetchDesign() {
      if (!id) {
        setError('Invalid design');
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('designs')
          .select('title, doc, thumbnail_url, owner_id')
          .eq('id', id)
          .single();

        if (fetchError || !data) {
          setError('Design not found');
          setLoading(false);
          return;
        }

        // Fetch owner name
        const { data: profile } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', data.owner_id)
          .single();

        setDesign({
          title: data.title,
          doc: data.doc as unknown as DesignDocument,
          thumbnail_url: data.thumbnail_url,
          owner_name: profile?.name || 'SchoolKit',
        });
      } catch {
        setError('Failed to load design');
      } finally {
        setLoading(false);
      }
    }

    fetchDesign();
  }, [id]);

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

  if (error || !design) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.appBackground,
          padding: 20,
        }}
      >
        <Ionicons name="alert-circle-outline" size={48} color={colors.textLight} />
        <Text
          style={{
            fontSize: 18,
            fontWeight: '600',
            color: colors.textDark,
            marginTop: 12,
            marginBottom: 8,
          }}
        >
          {error || 'Design not found'}
        </Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ fontSize: 14, color: colors.primary }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // On web, render the design full-width with the same header as other pages
  if (Platform.OS === 'web' && Stage) {
    const scale = viewportWidth / design.doc.canvas.width;
    const scaledHeight = design.doc.canvas.height * scale;
    const webHasInteractive = design.doc.objects.some((o: any) => o.type === 'interactive');

    const handleShare = async () => {
      try {
        await Share.share({
          message: `Check out "${design.title}" on SchoolKit`,
        });
      } catch {}
    };

    const resourceId = id || '';

    return (
      <View style={{ flex: 1, height: viewportHeight }}>
        {/* Header — same as topic-detail and understanding-cancer */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 24,
            paddingTop: insets.top + 10,
            paddingBottom: 20,
            backgroundColor: COLORS.white,
            borderBottomWidth: 3,
            borderBottomColor: colors.primary,
            shadowColor: COLORS.shadow,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 5,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ padding: 4 }}
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={28} color={COLORS.textDark} />
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <TouchableOpacity
              onPress={handleShare}
              style={{ padding: 8 }}
              accessibilityLabel="Share"
            >
              <Ionicons name="share-outline" size={24} color={COLORS.textMuted} />
            </TouchableOpacity>
            <DownloadButton resourceId={resourceId} size={24} />
            <BookmarkButton resourceId={resourceId} color={colors.primary} size={26} />
          </View>
        </View>

        {webHasInteractive ? (
          /* HTML/CSS-based renderer for documents with interactive components */
          <ScrollView
            style={{ flex: 1, backgroundColor: design.doc.canvas.background }}
            contentContainerStyle={{
              minHeight: '100%',
              justifyContent: scaledHeight <= (viewportHeight - 100) ? 'center' : 'flex-start',
              alignItems: 'center',
            } as any}
          >
            <div
              style={{
                width: viewportWidth,
                height: scaledHeight,
                position: 'relative' as const,
                overflow: 'hidden' as const,
              }}
            >
              <div
                style={{
                  width: design.doc.canvas.width,
                  height: design.doc.canvas.height,
                  backgroundColor: design.doc.canvas.background,
                  position: 'relative' as const,
                  transform: `scale(${scale})`,
                  transformOrigin: '0 0',
                }}
              >
                {design.doc.objects
                  .filter((o: any) => o.visible)
                  .map((obj: any) => (
                    <WebDesignObject key={obj.id} object={obj} />
                  ))}
              </div>
            </div>
          </ScrollView>
        ) : (
          /* Konva-based renderer for static-only documents */
          <ScrollView
            style={{ flex: 1, backgroundColor: design.doc.canvas.background }}
            contentContainerStyle={{
              minHeight: '100%',
              justifyContent: scaledHeight <= (viewportHeight - 100) ? 'center' : 'flex-start',
            } as any}
          >
            <Stage
              width={viewportWidth}
              height={scaledHeight}
              scaleX={scale}
              scaleY={scale}
            >
              <Layer>
                <KonvaRect
                  x={0}
                  y={0}
                  width={design.doc.canvas.width}
                  height={design.doc.canvas.height}
                  fill={design.doc.canvas.background}
                />
                {design.doc.objects
                  .filter((o: any) => o.visible)
                  .map((obj: any) => (
                    <ReadOnlyObjectComponent key={obj.id} object={obj} />
                  ))}
              </Layer>
            </Stage>
          </ScrollView>
        )}
      </View>
    );
  }

  // Check if design has interactive components
  const hasInteractive = design.doc.objects.some((o) => o.type === 'interactive');
  const screenWidth = Dimensions.get('window').width;

  // On mobile with interactive components, use RuntimeRenderer
  if (hasInteractive) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.appBackground }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingTop: insets.top + 10,
            paddingBottom: 12,
            backgroundColor: colors.white,
            borderBottomWidth: 1,
            borderBottomColor: colors.borderCard,
          }}
        >
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
            <Ionicons name="arrow-back" size={24} color={colors.textDark} />
          </TouchableOpacity>
          <Text
            style={{
              flex: 1,
              fontSize: 17,
              fontWeight: '600',
              color: colors.textDark,
              marginLeft: 12,
            }}
            numberOfLines={1}
          >
            {design.title}
          </Text>
        </View>
        <RuntimeRenderer doc={design.doc} width={screenWidth} />
      </View>
    );
  }

  // On mobile, show the thumbnail image with details
  return (
    <View style={{ flex: 1, backgroundColor: colors.appBackground }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingTop: insets.top + 10,
          paddingBottom: 12,
          backgroundColor: colors.white,
          borderBottomWidth: 1,
          borderBottomColor: colors.borderCard,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color={colors.textDark} />
        </TouchableOpacity>
        <Text
          style={{
            flex: 1,
            fontSize: 17,
            fontWeight: '600',
            color: colors.textDark,
            marginLeft: 12,
          }}
          numberOfLines={1}
        >
          {design.title}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {design.thumbnail_url ? (
          <Image
            source={{ uri: design.thumbnail_url }}
            style={{
              width: '100%',
              aspectRatio: design.doc.canvas.width / design.doc.canvas.height,
              borderRadius: 12,
              backgroundColor: colors.backgroundLight,
            }}
            resizeMode="contain"
          />
        ) : (
          <View
            style={{
              width: '100%',
              aspectRatio: 16 / 9,
              borderRadius: 12,
              backgroundColor: colors.backgroundLight,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Ionicons name="image-outline" size={48} color={colors.textLight} />
            <Text style={{ marginTop: 8, color: colors.textLight, fontSize: 13 }}>
              View this design in a web browser for the full experience
            </Text>
          </View>
        )}

        <Text
          style={{
            fontSize: 13,
            color: colors.textLight,
            marginTop: 12,
            textAlign: 'center',
          }}
        >
          by {design.owner_name}
        </Text>
      </ScrollView>
    </View>
  );
}

/** Renders a single design object as HTML on web — dispatches interactive
 *  components to the appropriate preview component. */
function WebDesignObject({ object }: { object: any }) {
  if (object.type === 'interactive') {
    switch (object.interactionType) {
      case 'flip-card':
        return WebPreviewFlipCard ? <WebPreviewFlipCard object={object} /> : null;
      case 'bottom-sheet':
        return WebPreviewBottomSheet ? <WebPreviewBottomSheet object={object} /> : null;
      case 'expandable':
        return WebPreviewExpandable ? <WebPreviewExpandable object={object} /> : null;
      case 'entrance':
        return WebPreviewEntrance ? <WebPreviewEntrance object={object} /> : null;
      case 'carousel':
        return WebPreviewCarousel ? <WebPreviewCarousel object={object} /> : null;
      case 'tabs':
        return WebPreviewTabs ? <WebPreviewTabs object={object} /> : null;
      case 'quiz':
        return WebPreviewQuiz ? <WebPreviewQuiz object={object} /> : null;
      default:
        return null;
    }
  }
  return WebPreviewObject ? <WebPreviewObject object={object} /> : null;
}
