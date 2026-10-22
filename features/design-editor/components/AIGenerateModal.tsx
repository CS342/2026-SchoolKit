import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAIGenerate } from '../hooks/useAIGenerate';
import { useGenerationProgress } from '../hooks/useGenerationProgress';
import { AI_TEMPLATES } from '../utils/ai-templates';
import { MOBILE_CANVAS } from '../types/document';
import type { DesignDocument } from '../types/document';
import type { GenerateRequest } from '../hooks/useAIGenerate';

interface AIGenerateModalProps {
  visible: boolean;
  onClose: () => void;
  canvasSize?: { width: number; height: number };
  onDesignGenerated: (doc: DesignDocument, title: string) => void;
  existingDocument?: DesignDocument | null;
}

type Step = 'mode' | 'content';
type GenerationType = 'template' | 'freestyle';
type InputTab = 'structured' | 'prompt';

const ACCENT_SWATCHES = [
  '#6366F1', '#8B5CF6', '#EC4899', '#EF4444',
  '#F59E0B', '#10B981', '#0EA5E9', '#1A1A2E',
];

// Stable values stored in state and sent to the API; display labels are
// translated via t(`design.ai.styleOptions.<value>`).
const STYLE_OPTIONS = ['Modern', 'Playful', 'Minimal', 'Bold'];

// Example-prompt suggestion chips. Keys resolve to translated display text
// via t(`design.ai.examples.<key>`) / t(`design.ai.editExamples.<key>`).
const EXAMPLE_PROMPT_KEYS = ['returningGuide', 'mythFact', 'feelingsCheckin', 'talkingToFriends'];

const EDIT_EXAMPLE_PROMPT_KEYS = ['titleColor', 'darkerBg', 'addSubtitle', 'removeFooter'];

export function AIGenerateModal({
  visible,
  onClose,
  canvasSize,
  onDesignGenerated,
  existingDocument,
}: AIGenerateModalProps) {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const { generate, isGenerating, error, clearError } = useAIGenerate();

  const isEditMode = !!(existingDocument && existingDocument.objects.length > 0);

  const { currentStepIndex, currentStep, progress, isComplete, totalSteps } =
    useGenerationProgress(isGenerating, isEditMode);

  const pendingResult = useRef<{ doc: DesignDocument; title: string } | null>(null);

  // When generation completes, wait 800ms so user sees 100% before closing
  useEffect(() => {
    if (isComplete && pendingResult.current) {
      const timer = setTimeout(() => {
        const { doc, title: genTitle } = pendingResult.current!;
        pendingResult.current = null;
        onDesignGenerated(doc, genTitle);
        handleReset();
        onClose();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isComplete]);

  const [step, setStep] = useState<Step>(isEditMode ? 'content' : 'mode');
  const [generationType, setGenerationType] = useState<GenerationType>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [inputTab, setInputTab] = useState<InputTab>(isEditMode ? 'prompt' : 'structured');

  // Reset step and input tab when modal opens based on edit mode
  useEffect(() => {
    if (visible) {
      if (isEditMode) {
        setStep('content');
        setInputTab('prompt');
      } else {
        setStep('mode');
        setInputTab('structured');
      }
    }
  }, [visible, isEditMode]);

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
    setStep(isEditMode ? 'content' : 'mode');
    setGenerationType('template');
    setSelectedTemplate(null);
    setInputTab(isEditMode ? 'prompt' : 'structured');
    setTitle('');
    setSubtitle('');
    setBodyText('');
    setAccentColor(ACCENT_SWATCHES[0]);
    setStyle('Modern');
    setPrompt('');
    clearError();
  };

  const handleClose = () => {
    pendingResult.current = null;
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

  // Generate directly from the hero prompt on the mode step (skip content step).
  const handleFreestyleGenerate = async () => {
    if (!prompt.trim()) return;
    clearError();
    setGenerationType('freestyle');
    setSelectedTemplate(null);
    setInputTab('prompt');
    setStep('content');

    const request: GenerateRequest = {
      mode: 'prompt',
      canvas: resolvedCanvas,
      prompt,
    };

    const doc = await generate(request);
    if (doc) {
      pendingResult.current = { doc, title: 'AI Generated Design' };
    }
  };

  const handleGenerate = async () => {
    clearError();

    const request: GenerateRequest = {
      mode: isEditMode ? 'prompt' : inputTab,
      canvas: resolvedCanvas,
    };

    if (isEditMode) {
      request.prompt = prompt;
      request.existingDocument = existingDocument!;
    } else if (inputTab === 'structured') {
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

    if (!isEditMode && selectedTemplate) {
      request.templateId = selectedTemplate;
    }

    const doc = await generate(request);
    if (doc) {
      const generatedTitle = isEditMode ? '' : (title || 'AI Generated Design');
      pendingResult.current = { doc, title: generatedTitle };
    }
  };

  const canGenerate = isEditMode
    ? prompt.trim().length > 0
    : inputTab === 'structured' ? title.trim().length > 0 : prompt.trim().length > 0;

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
    backgroundColor: isDark ? colors.backgroundLight : colors.white,
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
          {step === 'content' && !isGenerating && !isEditMode && (
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
            {step === 'mode'
              ? t('design.ai.title.generate')
              : isGenerating
                ? (isEditMode ? t('design.ai.title.updating') : t('design.ai.title.creating'))
                : (isEditMode ? t('design.ai.title.editWithAi') : t('design.ai.title.describe'))}
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
            ? t('design.ai.subtitle.mode')
            : isGenerating
              ? t('design.ai.subtitle.generating')
              : isEditMode
                ? t('design.ai.subtitle.editDescribe')
                : selectedTemplate
                  ? t('design.ai.subtitle.template', { name: AI_TEMPLATES.find((tpl) => tpl.id === selectedTemplate)?.name })
                  : t('design.ai.subtitle.freestyle')}
        </p>

        {/* Step 1: Mode Selection — chat input is the hero, templates are secondary */}
        {step === 'mode' && (
          <div>
            {/* Hero: AI Freestyle prompt input */}
            <div
              style={{
                padding: 20,
                borderRadius: 16,
                backgroundColor: `${colors.primary}0A`,
                border: `1px solid ${colors.primary}22`,
                marginBottom: 22,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 9,
                    backgroundColor: `${colors.primary}1F`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                    flexShrink: 0,
                  }}
                >
                  &#10024;
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: colors.textDark,
                      lineHeight: 1.2,
                    }}
                  >
                    {t('design.ai.freestyle.title')}
                  </div>
                  <div style={{ fontSize: 12, color: colors.textLight, marginTop: 2 }}>
                    {t('design.ai.freestyle.subtitle')}
                  </div>
                </div>
              </div>

              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && prompt.trim()) {
                    e.preventDefault();
                    handleFreestyleGenerate();
                  }
                }}
                placeholder={t('design.ai.freestyle.placeholder')}
                rows={4}
                autoFocus
                style={{
                  ...inputStyle(colors),
                  backgroundColor: isDark ? colors.backgroundLight : colors.white,
                  resize: 'vertical',
                  minHeight: 96,
                  fontSize: 14,
                }}
              />

              {/* Example chips */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 6,
                  marginTop: 10,
                }}
              >
                {EXAMPLE_PROMPT_KEYS.map((k) => {
                  const ex = t(`design.ai.examples.${k}`);
                  return (
                  <button
                    key={k}
                    onClick={() => setPrompt(ex)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: 8,
                      border: `1px solid ${colors.borderCard}`,
                      backgroundColor: isDark ? colors.backgroundLight : colors.white,
                      cursor: 'pointer',
                      fontSize: 11,
                      color: colors.textLight,
                    }}
                  >
                    {ex}
                  </button>
                  );
                })}
              </div>

              {/* Generate button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
                <button
                  onClick={handleFreestyleGenerate}
                  disabled={!prompt.trim()}
                  style={{
                    ...btnBase,
                    padding: '10px 22px',
                    backgroundColor: prompt.trim() ? colors.primary : colors.borderCard,
                    color: prompt.trim() ? '#fff' : colors.textLight,
                    fontSize: 14,
                  }}
                >
                  {t('design.ai.generateDesign')}
                </button>
              </div>
            </div>

            {/* Secondary: templates */}
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: colors.textLight,
                textTransform: 'uppercase',
                letterSpacing: 0.4,
                marginBottom: 10,
              }}
            >
              {t('design.ai.orTemplate')}
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: 8,
              }}
            >
              {AI_TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleTemplateSelect(t.id)}
                  style={{
                    padding: '10px 10px',
                    borderRadius: 10,
                    border: `1px solid ${colors.borderCard}`,
                    backgroundColor: colors.appBackground,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = colors.primary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = colors.borderCard;
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: colors.textDark,
                      marginBottom: 2,
                    }}
                  >
                    {t.name}
                  </div>
                  <div style={{ fontSize: 10, color: colors.textLight, lineHeight: 1.3 }}>
                    {t.description}
                  </div>
                </button>
              ))}
            </div>

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
                {t('common.cancel')}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Content Input */}
        {step === 'content' && (
          <div>
            {/* Progress overlay (replaces form during generation) */}
            {isGenerating && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '32px 0 16px',
                  gap: 20,
                }}
              >
                {/* Sparkle icon */}
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 20,
                    backgroundColor: `${colors.primary}12`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: 'pulse-glow 2s ease-in-out infinite',
                  }}
                >
                  <span style={{ fontSize: 36, lineHeight: 1 }}>&#10024;</span>
                </div>

                {/* Status message */}
                <div
                  key={currentStepIndex}
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: colors.textDark,
                    animation: 'fade-in-up 0.35s ease-out',
                  }}
                >
                  {currentStep}
                </div>

                {/* Progress bar */}
                <div
                  style={{
                    width: '100%',
                    maxWidth: 320,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: `${colors.primary}15`,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.min(progress, 100)}%`,
                        borderRadius: 4,
                        backgroundColor: colors.primary,
                        backgroundImage: `linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)`,
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 1.8s ease-in-out infinite',
                        transition: 'width 0.15s ease-out',
                      }}
                    />
                  </div>

                  {/* Step counter */}
                  <div
                    style={{
                      fontSize: 12,
                      color: colors.textLight,
                      textAlign: 'center',
                    }}
                  >
                    {t('design.ai.stepCounter', { current: currentStepIndex + 1, total: totalSteps })}
                  </div>
                </div>
              </div>
            )}

            {/* Form fields (hidden during generation) */}
            {!isGenerating && (
              <>
                {/* Tab toggle (hidden in edit mode — always freeform) */}
                {!isEditMode && (
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
                            inputTab === tab ? (isDark ? colors.backgroundLight : colors.white) : 'transparent',
                          boxShadow:
                            inputTab === tab ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                          cursor: 'pointer',
                          fontSize: 13,
                          fontWeight: 600,
                          color:
                            inputTab === tab ? colors.textDark : colors.textLight,
                        }}
                      >
                        {tab === 'structured' ? t('design.ai.tab.structured') : t('design.ai.tab.describe')}
                      </button>
                    ))}
                  </div>
                )}

                {/* Structured tab */}
                {inputTab === 'structured' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {/* Title */}
                    <div>
                      <label style={labelStyle(colors)}>
                        {t('design.ai.field.title')} <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder={t('design.ai.field.titlePlaceholder')}
                        style={inputStyle(colors)}
                      />
                    </div>

                    {/* Subtitle */}
                    <div>
                      <label style={labelStyle(colors)}>{t('design.ai.field.subtitle')}</label>
                      <input
                        value={subtitle}
                        onChange={(e) => setSubtitle(e.target.value)}
                        placeholder={t('design.ai.field.subtitlePlaceholder')}
                        style={inputStyle(colors)}
                      />
                    </div>

                    {/* Body text */}
                    <div>
                      <label style={labelStyle(colors)}>{t('design.ai.field.bodyText')}</label>
                      <textarea
                        value={bodyText}
                        onChange={(e) => setBodyText(e.target.value)}
                        placeholder={t('design.ai.field.bodyPlaceholder')}
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
                      <label style={labelStyle(colors)}>{t('design.ai.field.style')}</label>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {STYLE_OPTIONS.map((s) => (
                          <button
                            key={s}
                            onClick={() => setStyle(s)}
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
                            {t(`design.ai.styleOptions.${s}`)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Accent color */}
                    <div>
                      <label style={labelStyle(colors)}>{t('design.ai.field.accentColor')}</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {ACCENT_SWATCHES.map((c) => (
                          <button
                            key={c}
                            onClick={() => setAccentColor(c)}
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
                {(inputTab === 'prompt' || isEditMode) && (
                  <div>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder={isEditMode ? t('design.ai.promptPlaceholder.edit') : t('design.ai.promptPlaceholder.create')}
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
                      {(isEditMode ? EDIT_EXAMPLE_PROMPT_KEYS : EXAMPLE_PROMPT_KEYS).map((k) => {
                        const ex = t(`design.ai.${isEditMode ? 'editExamples' : 'examples'}.${k}`);
                        return (
                        <button
                          key={k}
                          onClick={() => setPrompt(ex)}
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
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
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
                  {t('design.ai.tryAgain')}
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
                style={{
                  ...btnBase,
                  padding: '10px 20px',
                  border: `1px solid ${colors.borderCard}`,
                  backgroundColor: 'transparent',
                  color: colors.textDark,
                  opacity: isGenerating ? 0.5 : 1,
                  cursor: isGenerating ? 'default' : 'pointer',
                }}
              >
                {t('common.cancel')}
              </button>
              {!isGenerating && (
                <button
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                  style={{
                    ...btnBase,
                    padding: '10px 24px',
                    backgroundColor: canGenerate ? colors.primary : colors.borderCard,
                    color: canGenerate ? '#fff' : colors.textLight,
                  }}
                >
                  {isEditMode ? t('design.ai.updateDesign') : t('design.ai.generateDesign')}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* CSS keyframes for progress animations */}
      {isGenerating && (
        <style>{`
          @keyframes pulse-glow {
            0%, 100% { transform: scale(1); opacity: 0.85; }
            50% { transform: scale(1.12); opacity: 1; }
          }
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          @keyframes fade-in-up {
            0% { opacity: 0; transform: translateY(6px); }
            100% { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      )}
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
