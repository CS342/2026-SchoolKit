import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { useEditorStore } from '../store/editor-store';
import { usePublish } from '../hooks/usePublish';
import { RESOURCE_CATEGORIES } from '../../../constants/resources';

interface PublishModalProps {
  visible: boolean;
  onClose: () => void;
}

const ROLE_OPTIONS = [
  { value: 'student-k8', label: 'Students (K-8)' },
  { value: 'student-hs', label: 'Students (High School+)' },
  { value: 'parent', label: 'Parents/Caregivers' },
  { value: 'staff', label: 'School Staff' },
];

const ICON_OPTIONS = [
  'book-outline',
  'school-outline',
  'heart-outline',
  'people-outline',
  'document-outline',
  'information-circle-outline',
  'medical-outline',
  'megaphone-outline',
  'color-palette-outline',
  'star-outline',
];

export function PublishModal({ visible, onClose }: PublishModalProps) {
  const { colors } = useTheme();
  const designTitle = useEditorStore((s) => s.title);
  const { publish, unpublish, getPublishedResourceId, getPublishedResource } = usePublish();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>(RESOURCE_CATEGORIES[0]);
  const [icon, setIcon] = useState('color-palette-outline');
  const [targetRoles, setTargetRoles] = useState<string[]>([
    'student-k8',
    'student-hs',
    'parent',
    'staff',
  ]);
  const [isPublished, setIsPublished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (visible) {
      setChecking(true);
      getPublishedResource().then((resource) => {
        if (resource) {
          setIsPublished(true);
          setTitle(resource.title);
          setDescription(resource.description);
          setCategory(resource.category || RESOURCE_CATEGORIES[0]);
          setIcon(resource.icon || 'color-palette-outline');
          setTargetRoles(resource.targetRoles.length > 0 ? resource.targetRoles : ['student-k8', 'student-hs', 'parent', 'staff']);
        } else {
          setIsPublished(false);
          setTitle(designTitle);
          setDescription('');
          setCategory(RESOURCE_CATEGORIES[0]);
          setIcon('color-palette-outline');
          setTargetRoles(['student-k8', 'student-hs', 'parent', 'staff']);
        }
        setChecking(false);
      });
    }
  }, [visible, designTitle, getPublishedResource]);

  if (!visible) return null;

  const toggleRole = (role: string) => {
    setTargetRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  };

  const handlePublish = async () => {
    setLoading(true);
    const resourceId = await publish({
      title,
      description,
      category,
      icon,
      targetRoles,
    });
    if (resourceId) {
      setIsPublished(true);
    }
    setLoading(false);
  };

  const handleUnpublish = async () => {
    setLoading(true);
    await unpublish();
    setIsPublished(false);
    setLoading(false);
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
          width: 460,
          maxWidth: '90vw',
          maxHeight: '80vh',
          overflowY: 'auto',
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
          Publish as Resource
        </h3>
        <p
          style={{
            fontSize: 14,
            color: colors.textLight,
            margin: '0 0 20px',
          }}
        >
          Make this design available as an app resource for users
        </p>

        {checking ? (
          <div style={{ textAlign: 'center', padding: 20, color: colors.textLight }}>
            Checking status...
          </div>
        ) : (
          <>
            {isPublished && (
              <div
                style={{
                  padding: 16,
                  borderRadius: 10,
                  backgroundColor: '#ECFDF5',
                  border: '1px solid #A7F3D0',
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#065F46',
                    marginBottom: 4,
                  }}
                >
                  Published
                </div>
                <div style={{ fontSize: 13, color: '#047857' }}>
                  This design is live as a resource in the app. Update the fields below to change it.
                </div>
              </div>
            )}

            {/* Title */}
            <div style={{ marginBottom: 14 }}>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: colors.textLight,
                  display: 'block',
                  marginBottom: 4,
                }}
              >
                Title
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: `1px solid ${colors.borderCard}`,
                  fontSize: 14,
                  color: colors.textDark,
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Description */}
            <div style={{ marginBottom: 14 }}>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: colors.textLight,
                  display: 'block',
                  marginBottom: 4,
                }}
              >
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description for users..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: `1px solid ${colors.borderCard}`,
                  fontSize: 14,
                  color: colors.textDark,
                  minHeight: 60,
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Category */}
            <div style={{ marginBottom: 14 }}>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: colors.textLight,
                  display: 'block',
                  marginBottom: 4,
                }}
              >
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: `1px solid ${colors.borderCard}`,
                  fontSize: 14,
                  color: colors.textDark,
                }}
              >
                {RESOURCE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Icon */}
            <div style={{ marginBottom: 14 }}>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: colors.textLight,
                  display: 'block',
                  marginBottom: 4,
                }}
              >
                Icon
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {ICON_OPTIONS.map((iconName) => (
                  <button
                    key={iconName}
                    onClick={() => setIcon(iconName)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 8,
                      border:
                        icon === iconName
                          ? `2px solid ${colors.primary}`
                          : `1px solid ${colors.borderCard}`,
                      backgroundColor:
                        icon === iconName
                          ? colors.backgroundLight
                          : 'transparent',
                      cursor: 'pointer',
                      fontSize: 11,
                      color: colors.textDark,
                    }}
                  >
                    {iconName.replace('-outline', '')}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Roles */}
            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: colors.textLight,
                  display: 'block',
                  marginBottom: 4,
                }}
              >
                Visible to
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {ROLE_OPTIONS.map((role) => {
                  const isActive = targetRoles.includes(role.value);
                  return (
                    <button
                      key={role.value}
                      onClick={() => toggleRole(role.value)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 8,
                        border: isActive
                          ? `2px solid ${colors.primary}`
                          : `1px solid ${colors.borderCard}`,
                        backgroundColor: isActive
                          ? colors.backgroundLight
                          : 'transparent',
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: 500,
                        color: isActive ? colors.primary : colors.textDark,
                      }}
                    >
                      {role.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handlePublish}
              disabled={loading || !title.trim()}
              style={{
                width: '100%',
                padding: '12px 20px',
                borderRadius: 10,
                border: 'none',
                backgroundColor:
                  loading || !title.trim()
                    ? colors.textLight
                    : colors.primary,
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: loading || !title.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              {loading
                ? isPublished
                  ? 'Updating...'
                  : 'Publishing...'
                : isPublished
                  ? 'Update Resource'
                  : 'Publish'}
            </button>

            {isPublished && (
              <button
                onClick={handleUnpublish}
                disabled={loading}
                style={{
                  width: '100%',
                  marginTop: 8,
                  padding: '10px 16px',
                  borderRadius: 10,
                  border: '1px solid #EF4444',
                  backgroundColor: 'transparent',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: 13,
                  fontWeight: 500,
                  color: '#EF4444',
                }}
              >
                Unpublish
              </button>
            )}
          </>
        )}

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginTop: 12,
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
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
