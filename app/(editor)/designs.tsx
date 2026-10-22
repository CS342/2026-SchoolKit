import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { useDesignCRUD } from '../../features/design-editor/hooks/useDesignCRUD';
import { DesignCard } from '../../features/design-editor/components/DesignCard';
import { AIGenerateModal } from '../../features/design-editor/components/AIGenerateModal';
import { MOBILE_CANVAS } from '../../features/design-editor/types/document';
import type { DesignDocument } from '../../features/design-editor/types/document';

export default function DesignsDashboard() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { designs, loading, fetchDesigns, createDesign, deleteDesign, duplicateDesign } =
    useDesignCRUD();
  const [showAIGenerate, setShowAIGenerate] = useState(false);

  useEffect(() => {
    fetchDesigns();
  }, [fetchDesigns]);

  const handleCreate = async () => {
    const doc: DesignDocument = {
      version: 1,
      canvas: {
        width: MOBILE_CANVAS.width,
        height: MOBILE_CANVAS.height,
        background: '#FFFFFF',
      },
      objects: [],
      assets: {},
    };
    const id = await createDesign(t('design.dashboard.untitledDesign'), doc);
    if (id) {
      router.push(`/(editor)/design/${id}`);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: colors.appBackground,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '32px 40px 24px',
          borderBottom: `1px solid ${colors.borderCard}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <button
            onClick={() => router.push('/(tabs)/profile')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 14,
              color: colors.primary,
              padding: 0,
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            ← {t('design.dashboard.backToProfile')}
          </button>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: colors.textDark,
              margin: 0,
            }}
          >
            {t('design.dashboard.myDesigns')}
          </h1>
          <p
            style={{
              fontSize: 15,
              color: colors.textLight,
              margin: '4px 0 0',
            }}
          >
            {t('design.dashboard.subtitle')}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => setShowAIGenerate(true)}
            style={{
              background: 'linear-gradient(135deg, #8B5CF6, #6366F1)',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              padding: '12px 24px',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span style={{ fontSize: 16 }}>&#9733;</span>
            {t('design.dashboard.generateWithAI')}
          </button>
          <button
            onClick={handleCreate}
            style={{
              backgroundColor: colors.primary,
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              padding: '12px 24px',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            + {t('design.dashboard.newDesign')}
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '24px 40px' }}>
        {loading ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              padding: 80,
              color: colors.textLight,
            }}
          >
            {t('design.dashboard.loading')}
          </div>
        ) : designs.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 80,
              gap: 16,
            }}
          >
            <div style={{ fontSize: 48, opacity: 0.3 }}>🎨</div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 600,
                color: colors.textDark,
              }}
            >
              {t('design.dashboard.noDesignsYet')}
            </div>
            <div style={{ fontSize: 15, color: colors.textLight }}>
              {t('design.dashboard.emptyHint')}
            </div>
            <button
              onClick={handleCreate}
              style={{
                backgroundColor: colors.primary,
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                padding: '10px 20px',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                marginTop: 8,
              }}
            >
              + {t('design.dashboard.newDesign')}
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 20,
            }}
          >
            {designs.map((design) => (
              <DesignCard
                key={design.id}
                design={design}
                onOpen={(id) => router.push(`/(editor)/design/${id}`)}
                onDuplicate={duplicateDesign}
                onDelete={deleteDesign}
              />
            ))}
          </div>
        )}
      </div>

      {/* AI Generate Modal */}
      <AIGenerateModal
        visible={showAIGenerate}
        onClose={() => setShowAIGenerate(false)}
        onDesignGenerated={async (doc: DesignDocument, title: string) => {
          const id = await createDesign(title || t('design.dashboard.aiGeneratedDesign'), doc);
          if (id) {
            router.push(`/(editor)/design/${id}`);
          }
        }}
      />
    </div>
  );
}
