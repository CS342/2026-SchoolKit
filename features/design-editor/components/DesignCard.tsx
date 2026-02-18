import React, { useState } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import type { Design } from '../../../lib/database.types';

interface DesignCardProps {
  design: Design;
  onOpen: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export function DesignCard({ design, onOpen, onDuplicate, onDelete }: DesignCardProps) {
  const { colors, shadows } = useTheme();
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div
      style={{
        backgroundColor: colors.white,
        borderRadius: 16,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        position: 'relative',
      }}
      onClick={() => onOpen(design.id)}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
      }}
    >
      {/* Thumbnail */}
      <div
        style={{
          width: '100%',
          aspectRatio: '16/9',
          backgroundColor: colors.backgroundLight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {design.thumbnail_url ? (
          <img
            src={design.thumbnail_url}
            alt={design.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, #7B68EE 0%, #0EA5E9 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: 32, opacity: 0.5 }}>🎨</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '12px 14px' }}>
        <div
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: colors.textDark,
            marginBottom: 4,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {design.title}
        </div>
        <div
          style={{
            fontSize: 13,
            color: colors.textLight,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span>{formatDate(design.updated_at)}</span>
          {design.is_shared && (
            <span
              style={{
                fontSize: 11,
                backgroundColor: colors.backgroundLight,
                color: colors.primary,
                padding: '2px 6px',
                borderRadius: 4,
                fontWeight: 500,
              }}
            >
              Shared
            </span>
          )}
        </div>
      </div>

      {/* Actions menu button */}
      <div
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          zIndex: 10,
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            border: 'none',
            backgroundColor: 'rgba(0,0,0,0.4)',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            backdropFilter: 'blur(4px)',
          }}
        >
          ⋯
        </button>

        {showMenu && (
          <div
            style={{
              position: 'absolute',
              top: 36,
              right: 0,
              backgroundColor: colors.white,
              borderRadius: 10,
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              overflow: 'hidden',
              minWidth: 140,
              zIndex: 20,
            }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(false);
                onDuplicate(design.id);
              }}
              style={{
                display: 'block',
                width: '100%',
                padding: '10px 14px',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: 14,
                color: colors.textDark,
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.backgroundColor = colors.backgroundLight;
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.backgroundColor = 'transparent';
              }}
            >
              Duplicate
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(false);
                if (window.confirm(`Delete "${design.title}"?`)) {
                  onDelete(design.id);
                }
              }}
              style={{
                display: 'block',
                width: '100%',
                padding: '10px 14px',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: 14,
                color: '#EF4444',
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.backgroundColor = colors.backgroundLight;
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.backgroundColor = 'transparent';
              }}
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
