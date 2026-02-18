import React, { useState } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { supabase } from '../../../lib/supabase';
import { useEditorStore } from '../store/editor-store';

interface ShareModalProps {
  visible: boolean;
  onClose: () => void;
  isShared: boolean;
  shareToken: string | null;
  onShareChange: (isShared: boolean, token: string | null) => void;
}

export function ShareModal({
  visible,
  onClose,
  isShared,
  shareToken,
  onShareChange,
}: ShareModalProps) {
  const { colors } = useTheme();
  const designId = useEditorStore((s) => s.designId);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!visible) return null;

  const shareUrl = shareToken
    ? `${window.location.origin}/share/${shareToken}`
    : null;

  const handleCreateLink = async () => {
    if (!designId) return;
    setLoading(true);

    const token = crypto.randomUUID();
    const { error } = await supabase
      .from('designs')
      .update({ is_shared: true, share_token: token })
      .eq('id', designId);

    if (!error) {
      onShareChange(true, token);
    }
    setLoading(false);
  };

  const handleRevoke = async () => {
    if (!designId) return;
    setLoading(true);

    const { error } = await supabase
      .from('designs')
      .update({ is_shared: false, share_token: null })
      .eq('id', designId);

    if (!error) {
      onShareChange(false, null);
    }
    setLoading(false);
  };

  const handleCopy = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
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
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: colors.white,
          borderRadius: 16,
          padding: 28,
          width: 420,
          maxWidth: '90vw',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: colors.textDark,
            margin: '0 0 4px',
          }}
        >
          Share Design
        </h3>
        <p
          style={{
            fontSize: 14,
            color: colors.textLight,
            margin: '0 0 20px',
          }}
        >
          Anyone with the link can view this design
        </p>

        {isShared && shareUrl ? (
          <>
            <div
              style={{
                display: 'flex',
                gap: 8,
                marginBottom: 16,
              }}
            >
              <input
                readOnly
                value={shareUrl}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: `1px solid ${colors.borderCard}`,
                  fontSize: 13,
                  color: colors.textDark,
                  backgroundColor: colors.appBackground,
                  outline: 'none',
                }}
              />
              <button
                onClick={handleCopy}
                style={{
                  padding: '10px 16px',
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor: colors.primary,
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <button
              onClick={handleRevoke}
              disabled={loading}
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                border: `1px solid #EF4444`,
                backgroundColor: 'transparent',
                color: '#EF4444',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              {loading ? 'Revoking...' : 'Revoke Link'}
            </button>
          </>
        ) : (
          <button
            onClick={handleCreateLink}
            disabled={loading}
            style={{
              padding: '12px 20px',
              borderRadius: 10,
              border: 'none',
              backgroundColor: colors.primary,
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              width: '100%',
            }}
          >
            {loading ? 'Creating...' : 'Create Share Link'}
          </button>
        )}

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginTop: 16,
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: `1px solid ${colors.borderCard}`,
              backgroundColor: 'transparent',
              cursor: 'pointer',
              fontSize: 13,
              color: colors.textDark,
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
