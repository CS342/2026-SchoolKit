import React, { useState } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAIGenerate } from '../hooks/useAIGenerate';
import { AI_TEMPLATES } from '../utils/ai-templates';
import { MOBILE_CANVAS } from '../types/document';
import type { DesignDocument } from '../types/document';
import type { GenerateRequest } from '../hooks/useAIGenerate';

interface AIGenerateModalProps {
  visible: boolean;
  onClose: () => void;
  canvasSize?: { width: number; height: number };
  onDesignGenerated: (doc: DesignDocument, title: string) => void;
}

type Step = 'mode' | 'content';
type GenerationType = 'template' | 'freestyle';
type InputTab = 'structured' | 'prompt';

const ACCENT_SWATCHES = [
  '#6366F1', '#8B5CF6', '#EC4899', '#EF4444',
  '#F59E0B', '#10B981', '#0EA5E9', '#1A1A2E',
];

const STYLE_OPTIONS = ['Modern', 'Playful', 'Minimal', 'Bold'];

const EXAMPLE_PROMPTS = [
  'A colorful welcome slide for new students',
  'A clean infographic about healthy eating habits',
  'An announcement for the school science fair',
  'A motivational quote card with warm colors',
];

export function AIGenerateModal({
  visible,
  onClose,
  canvasSize,
  onDesignGenerated,
}: AIGenerateModalProps) {
  const { colors } = useTheme();
  const { generate, isGenerating, error, clearError } = useAIGenerate();

  const [step, setStep] = useState<Step>('mode');
  const [generationType, setGenerationType] = useState<GenerationType>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [inputTab, setInputTab] = useState<InputTab>('structured');

  // Structured fields
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [accentColor, setAccentColor] = useState(ACCENT_SWATCHES[0]);
  const [style, setStyle] = useState('Modern');

  // Prompt field
  const [prompt, setPrompt] = useState('');

  const resolvedCanvas = canvasSize || {
    width: MOBILE_CANVAS.width,
    height: MOBILE_CANVAS.height,
  };

  if (!visible) return null;

  const handleReset = () => {
    setStep('mode');
    setGenerationType('template');
    setSelectedTemplate(null);
    setInputTab('structured');
    setTitle('');
    setSubtitle('');
    setBodyText('');
    setAccentColor(ACCENT_SWATCHES[0]);
    setStyle('Modern');
    setPrompt('');
    clearError();
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleModeSelect = (type: GenerationType) => {
    setGenerationType(type);
    if (type === 'freestyle') {
      setSelectedTemplate(null);
    }
    setStep('content');
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    setStep('content');
  };

  const handleGenerate = async () => {
    clearError();

    const request: GenerateRequest = {
      mode: inputTab,
      canvas: resolvedCanvas,
    };

    if (inputTab === 'structured') {
      request.structured = {
        title: title || undefined,
        subtitle: subtitle || undefined,
        bodyText: bodyText || undefined,
        accentColor,
        style,
      };
    } else {
      request.prompt = prompt;
    }

    if (selectedTemplate) {
      request.templateId = selectedTemplate;
    }

    const doc = await generate(request);
    if (doc) {
      const generatedTitle = title || 'AI Generated Design';
      onDesignGenerated(doc, generatedTitle);
      handleClose();
    }
  };

  const canGenerate =
    inputTab === 'structured' ? title.trim().length > 0 : prompt.trim().length > 0;

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  };

  const modalStyle: React.CSSProperties = {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 32,
    width: step === 'mode' ? 520 : 560,
    maxWidth: '90vw',
    maxHeight: '85vh',
    overflowY: 'auto',
  };

  const btnBase: React.CSSProperties = {
    border: 'none',
    cursor: 'pointer',
    borderRadius: 10,
    fontWeight: 600,
    fontSize: 14,
    transition: 'opacity 0.15s',
  };

  return (
    <div style={overlayStyle} onClick={handleClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
          {step === 'content' && (
            <button
              onClick={() => { setStep('mode'); clearError(); }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 16,
                color: colors.textLight,
                padding: '4px 8px 4px 0',
              }}
            >
              &larr;
            </button>
          )}
          <h2
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: colors.textDark,
              margin: 0,
            }}
          >
            {step === 'mode' ? 'Generate with AI' : 'Describe Your Design'}
          </h2>
        </div>
        <p
          style={{
            fontSize: 14,
            color: colors.textLight,
            margin: '0 0 24px',
          }}
        >
          {step === 'mode'
            ? 'Choose how you want to create your design'
            : selectedTemplate
              ? `Template: ${AI_TEMPLATES.find((t) => t.id === selectedTemplate)?.name}`
              : 'AI Freestyle — describe anything'}
        </p>

        {/* Step 1: Mode Selection */}
        {step === 'mode' && (
          <div>
            {/* Template grid */}
            <div style={{ marginBottom: 20 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: colors.textDark,
                  marginBottom: 10,
                }}
              >
                Use a Template
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: 10,
                }}
              >
                {AI_TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleTemplateSelect(t.id)}
                    style={{
                      padding: '14px 12px',
                      borderRadius: 12,
                      border: `1px solid ${colors.borderCard}`,
                      backgroundColor: colors.appBackground,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = colors.primary;
                      e.currentTarget.style.backgroundColor = colors.backgroundLight;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = colors.borderCard;
                      e.currentTarget.style.backgroundColor = colors.appBackground;
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: colors.textDark,
                        marginBottom: 4,
                      }}
                    >
                      {t.name}
                    </div>
                    <div style={{ fontSize: 11, color: colors.textLight, lineHeight: 1.3 }}>
                      {t.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                margin: '16px 0',
              }}
            >
              <div style={{ flex: 1, height: 1, backgroundColor: colors.borderCard }} />
              <span style={{ fontSize: 12, color: colors.textLight }}>or</span>
              <div style={{ flex: 1, height: 1, backgroundColor: colors.borderCard }} />
            </div>

            {/* Freestyle card */}
            <button
              onClick={() => handleModeSelect('freestyle')}
              style={{
                width: '100%',
                padding: '18px 20px',
                borderRadius: 14,
                border: `1px solid ${colors.borderCard}`,
                backgroundColor: colors.appBackground,
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = colors.primary;
                e.currentTarget.style.backgroundColor = colors.backgroundLight;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = colors.borderCard;
                e.currentTarget.style.backgroundColor = colors.appBackground;
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  backgroundColor: `${colors.primary}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  flexShrink: 0,
                }}
              >
                &#9733;
              </div>
              <div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: colors.textDark,
                    marginBottom: 2,
                  }}
                >
                  AI Freestyle
                </div>
                <div style={{ fontSize: 12, color: colors.textLight }}>
                  Describe anything and AI will create the layout from scratch
                </div>
              </div>
            </button>

            {/* Footer */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginTop: 20,
              }}
            >
              <button
                onClick={handleClose}
                style={{
                  ...btnBase,
                  padding: '10px 20px',
                  border: `1px solid ${colors.borderCard}`,
                  backgroundColor: 'transparent',
                  color: colors.textDark,
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Content Input */}
        {step === 'content' && (
          <div>
            {/* Tab toggle */}
            <div
              style={{
                display: 'flex',
                gap: 2,
                backgroundColor: colors.appBackground,
                borderRadius: 10,
                padding: 3,
                marginBottom: 18,
              }}
            >
              {(['structured', 'prompt'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setInputTab(tab)}
                  style={{
                    flex: 1,
                    padding: '8px 0',
                    borderRadius: 8,
                    border: 'none',
                    backgroundColor:
                      inputTab === tab ? colors.white : 'transparent',
                    boxShadow:
                      inputTab === tab ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 600,
                    color:
                      inputTab === tab ? colors.textDark : colors.textLight,
                  }}
                >
                  {tab === 'structured' ? 'Structured' : 'Describe It'}
                </button>
              ))}
            </div>

            {/* Structured tab */}
            {inputTab === 'structured' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Title */}
                <div>
                  <label style={labelStyle(colors)}>
                    Title <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Welcome to Science Class"
                    disabled={isGenerating}
                    style={inputStyle(colors)}
                  />
                </div>

                {/* Subtitle */}
                <div>
                  <label style={labelStyle(colors)}>Subtitle</label>
                  <input
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="e.g. Chapter 3: The Solar System"
                    disabled={isGenerating}
                    style={inputStyle(colors)}
                  />
                </div>

                {/* Body text */}
                <div>
                  <label style={labelStyle(colors)}>Body Text</label>
                  <textarea
                    value={bodyText}
                    onChange={(e) => setBodyText(e.target.value)}
                    placeholder="Additional content to include..."
                    disabled={isGenerating}
                    rows={3}
                    style={{
                      ...inputStyle(colors),
                      resize: 'vertical',
                      minHeight: 60,
                    }}
                  />
                </div>

                {/* Style */}
                <div>
                  <label style={labelStyle(colors)}>Style</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {STYLE_OPTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => setStyle(s)}
                        disabled={isGenerating}
                        style={{
                          padding: '6px 14px',
                          borderRadius: 8,
                          border: `1px solid ${style === s ? colors.primary : colors.borderCard}`,
                          backgroundColor:
                            style === s ? `${colors.primary}12` : 'transparent',
                          cursor: 'pointer',
                          fontSize: 12,
                          fontWeight: style === s ? 600 : 400,
                          color: style === s ? colors.primary : colors.textDark,
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Accent color */}
                <div>
                  <label style={labelStyle(colors)}>Accent Color</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {ACCENT_SWATCHES.map((c) => (
                      <button
                        key={c}
                        onClick={() => setAccentColor(c)}
                        disabled={isGenerating}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          backgroundColor: c,
                          border:
                            accentColor === c
                              ? '2px solid #111'
                              : '2px solid transparent',
                          cursor: 'pointer',
                          outline:
                            accentColor === c
                              ? `2px solid ${colors.white}`
                              : 'none',
                          outlineOffset: -3,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Prompt tab */}
            {inputTab === 'prompt' && (
              <div>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the design you want..."
                  disabled={isGenerating}
                  rows={5}
                  style={{
                    ...inputStyle(colors),
                    resize: 'vertical',
                    minHeight: 100,
                  }}
                />
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 6,
                    marginTop: 10,
                  }}
                >
                  {EXAMPLE_PROMPTS.map((ex) => (
                    <button
                      key={ex}
                      onClick={() => setPrompt(ex)}
                      disabled={isGenerating}
                      style={{
                        padding: '5px 10px',
                        borderRadius: 8,
                        border: `1px solid ${colors.borderCard}`,
                        backgroundColor: colors.appBackground,
                        cursor: 'pointer',
                        fontSize: 11,
                        color: colors.textLight,
                      }}
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div
                style={{
                  marginTop: 14,
                  padding: '10px 14px',
                  borderRadius: 10,
                  backgroundColor: '#FEF2F2',
                  color: '#DC2626',
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span style={{ flex: 1 }}>{error}</span>
                <button
                  onClick={handleGenerate}
                  style={{
                    ...btnBase,
                    padding: '4px 12px',
                    fontSize: 12,
                    backgroundColor: '#DC2626',
                    color: '#fff',
                  }}
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Footer */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 10,
                marginTop: 20,
              }}
            >
              <button
                onClick={handleClose}
                disabled={isGenerating}
                style={{
                  ...btnBase,
                  padding: '10px 20px',
                  border: `1px solid ${colors.borderCard}`,
                  backgroundColor: 'transparent',
                  color: colors.textDark,
                  opacity: isGenerating ? 0.5 : 1,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={!canGenerate || isGenerating}
                style={{
                  ...btnBase,
                  padding: '10px 24px',
                  backgroundColor: canGenerate && !isGenerating ? colors.primary : colors.borderCard,
                  color: canGenerate && !isGenerating ? '#fff' : colors.textLight,
                }}
              >
                {isGenerating ? 'Generating...' : 'Generate Design'}
              </button>
            </div>

            {/* Loading overlay */}
            {isGenerating && (
              <div
                style={{
                  marginTop: 16,
                  textAlign: 'center',
                  padding: '12px 0',
                  color: colors.textLight,
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    border: `2px solid ${colors.primary}`,
                    borderTopColor: 'transparent',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
                Generating your design...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function labelStyle(colors: Record<string, string>): React.CSSProperties {
  return {
    fontSize: 12,
    fontWeight: 600,
    color: colors.textLight,
    display: 'block',
    marginBottom: 5,
  };
}

function inputStyle(colors: Record<string, string>): React.CSSProperties {
  return {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 10,
    border: `1px solid ${colors.borderCard}`,
    fontSize: 14,
    color: colors.textDark,
    backgroundColor: colors.appBackground,
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  };
}
