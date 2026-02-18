import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useDesignCRUD } from '../../features/design-editor/hooks/useDesignCRUD';
import { DesignCard } from '../../features/design-editor/components/DesignCard';
import { CANVAS_PRESETS } from '../../features/design-editor/types/document';
import type { DesignDocument } from '../../features/design-editor/types/document';

export default function DesignsDashboard() {
  const router = useRouter();
  const { colors } = useTheme();
  const { designs, loading, fetchDesigns, createDesign, deleteDesign, duplicateDesign } =
    useDesignCRUD();
  const [showNewModal, setShowNewModal] = useState(false);

  useEffect(() => {
    fetchDesigns();
  }, [fetchDesigns]);

  const handleCreate = async (preset?: (typeof CANVAS_PRESETS)[number]) => {
    const doc: DesignDocument = {
      version: 1,
      canvas: {
        width: preset?.width ?? 1280,
        height: preset?.height ?? 720,
        background: '#FFFFFF',
      },
      objects: [],
      assets: {},
    };
    const id = await createDesign('Untitled Design', doc);
    if (id) {
      router.push(`/(editor)/design/${id}`);
    }
    setShowNewModal(false);
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
            ← Back to Profile
          </button>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: colors.textDark,
              margin: 0,
            }}
          >
            My Designs
          </h1>
          <p
            style={{
              fontSize: 15,
              color: colors.textLight,
              margin: '4px 0 0',
            }}
          >
            Create and manage visual content
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
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
          + New Design
        </button>
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
            Loading...
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
              No designs yet
            </div>
            <div style={{ fontSize: 15, color: colors.textLight }}>
              Create your first design to get started
            </div>
            <button
              onClick={() => setShowNewModal(true)}
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
              + New Design
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

      {/* New Design Modal */}
      {showNewModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowNewModal(false)}
        >
          <div
            style={{
              backgroundColor: colors.white,
              borderRadius: 20,
              padding: 32,
              width: 420,
              maxWidth: '90vw',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: colors.textDark,
                margin: '0 0 4px',
              }}
            >
              New Design
            </h2>
            <p
              style={{
                fontSize: 14,
                color: colors.textLight,
                margin: '0 0 24px',
              }}
            >
              Choose a canvas size
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 10,
              }}
            >
              {CANVAS_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => handleCreate(preset)}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 12,
                    border: `1px solid ${colors.borderCard}`,
                    backgroundColor: colors.appBackground,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor =
                      colors.primary;
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                      colors.backgroundLight;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor =
                      colors.borderCard;
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                      colors.appBackground;
                  }}
                >
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: colors.textDark,
                      marginBottom: 2,
                    }}
                  >
                    {preset.label}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: colors.textLight,
                    }}
                  >
                    {preset.width} x {preset.height}
                  </div>
                </button>
              ))}
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginTop: 20,
                gap: 10,
              }}
            >
              <button
                onClick={() => setShowNewModal(false)}
                style={{
                  padding: '10px 20px',
                  borderRadius: 10,
                  border: `1px solid ${colors.borderCard}`,
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  fontSize: 14,
                  color: colors.textDark,
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
