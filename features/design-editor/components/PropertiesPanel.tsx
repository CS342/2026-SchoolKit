import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useEditorStore } from '../store/editor-store';
import { useTheme } from '../../../contexts/ThemeContext';
import type { DesignObject, InteractiveComponentObject, GradientConfig, ShadowConfig, StrokeDashPreset } from '../types/document';
import { InteractiveProperties } from './InteractiveProperties';
import { AlignmentToolbar } from './AlignmentToolbar';
import { GRADIENTS, SHADOW_SPECS } from '../../../constants/onboarding-theme';
import ionGlyphMap from '@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Ionicons.json';

function NumberInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  const { colors } = useTheme();
  return (
    <div style={{ flex: 1 }}>
      <label
        style={{
          fontSize: 10,
          color: colors.textLight,
          fontWeight: 600,
          display: 'block',
          marginBottom: 4,
          letterSpacing: 0.3,
        }}
      >
        {label}
      </label>
      <input
        type="number"
        value={Math.round(value * 10) / 10}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: '100%',
          padding: '5px 8px',
          borderRadius: 6,
          border: `1px solid ${colors.borderCard}`,
          fontSize: 12,
          color: colors.textDark,
          backgroundColor: colors.appBackground,
          boxSizing: 'border-box',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          outline: 'none',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = colors.primary;
          e.target.style.boxShadow = `0 0 0 2px ${colors.primary}22`;
        }}
        onBlur={(e) => {
          e.target.style.borderColor = colors.borderCard;
          e.target.style.boxShadow = 'none';
        }}
      />
    </div>
  );
}

function RangeInput({
  label,
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.01,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  const { colors } = useTheme();
  return (
    <div style={{ flex: 1 }}>
      <label
        style={{
          fontSize: 10,
          color: colors.textLight,
          fontWeight: 600,
          display: 'block',
          marginBottom: 4,
          letterSpacing: 0.3,
        }}
      >
        {label}
      </label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="range"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{
            flex: 1,
            accentColor: colors.primary,
            height: 4,
          }}
        />
        <span
          style={{
            fontSize: 11,
            color: colors.textDark,
            fontFamily: 'monospace',
            minWidth: 32,
            textAlign: 'right',
            backgroundColor: colors.appBackground,
            padding: '2px 6px',
            borderRadius: 4,
          }}
        >
          {Math.round(value * 100)}%
        </span>
      </div>
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const { colors } = useTheme();
  return (
    <div style={{ flex: 1 }}>
      <label
        style={{
          fontSize: 10,
          color: colors.textLight,
          fontWeight: 600,
          display: 'block',
          marginBottom: 4,
          letterSpacing: 0.3,
        }}
      >
        {label}
      </label>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '5px 8px',
          borderRadius: 6,
          border: `1px solid ${colors.borderCard}`,
          fontSize: 12,
          color: colors.textDark,
          backgroundColor: colors.appBackground,
          boxSizing: 'border-box',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          outline: 'none',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = colors.primary;
          e.target.style.boxShadow = `0 0 0 2px ${colors.primary}22`;
        }}
        onBlur={(e) => {
          e.target.style.borderColor = colors.borderCard;
          e.target.style.boxShadow = 'none';
        }}
      />
    </div>
  );
}

function ColorInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [showPresets, setShowPresets] = useState(false);
  return (
    <div style={{ flex: 1 }}>
      <label
        style={{
          fontSize: 10,
          color: colors.textLight,
          fontWeight: 600,
          display: 'block',
          marginBottom: 4,
          letterSpacing: 0.3,
        }}
      >
        {label}
      </label>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '3px 8px',
          borderRadius: 6,
          border: `1px solid ${colors.borderCard}`,
          backgroundColor: colors.appBackground,
          transition: 'border-color 0.15s',
        }}
      >
        <div style={{ position: 'relative' }}>
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: 5,
              backgroundColor: value || '#000000',
              border: `1px solid ${colors.borderCard}`,
              boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)',
            }}
          />
          <input
            type="color"
            value={value || '#000000'}
            onChange={(e) => onChange(e.target.value)}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: 20,
              height: 20,
              opacity: 0,
              cursor: 'pointer',
            }}
          />
        </div>
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t('design.props.colorNone')}
          style={{
            flex: 1,
            border: 'none',
            background: 'none',
            fontSize: 11,
            color: colors.textDark,
            outline: 'none',
            fontFamily: 'monospace',
            minWidth: 0,
          }}
        />
        <button
          onClick={() => setShowPresets(!showPresets)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 8,
            color: colors.textLight,
            padding: '2px',
            lineHeight: 1,
          }}
          title={t('design.props.colorPresets')}
        >
          {showPresets ? '▲' : '▼'}
        </button>
      </div>
      {showPresets && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 3,
            marginTop: 6,
            padding: '6px',
            backgroundColor: colors.appBackground,
            borderRadius: 6,
            border: `1px solid ${colors.borderCard}`,
          }}
        >
          {COLOR_PRESETS.map((preset) => (
            <button
              key={preset}
              onClick={() => { onChange(preset); setShowPresets(false); }}
              style={{
                width: 18,
                height: 18,
                borderRadius: 4,
                backgroundColor: preset,
                border: value?.toUpperCase() === preset.toUpperCase()
                  ? `2px solid ${colors.primary}`
                  : `1px solid rgba(0,0,0,0.08)`,
                cursor: 'pointer',
                padding: 0,
                flexShrink: 0,
                transition: 'transform 0.1s',
                boxShadow: value?.toUpperCase() === preset.toUpperCase()
                  ? `0 0 0 2px ${colors.primary}33`
                  : 'none',
              }}
              onMouseEnter={(e) => { (e.target as HTMLElement).style.transform = 'scale(1.2)'; }}
              onMouseLeave={(e) => { (e.target as HTMLElement).style.transform = 'scale(1)'; }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SelectInput({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  const { colors } = useTheme();
  return (
    <div style={{ flex: 1 }}>
      <label
        style={{
          fontSize: 10,
          color: colors.textLight,
          fontWeight: 600,
          display: 'block',
          marginBottom: 4,
          letterSpacing: 0.3,
        }}
      >
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '5px 8px',
          borderRadius: 6,
          border: `1px solid ${colors.borderCard}`,
          fontSize: 12,
          color: colors.textDark,
          backgroundColor: colors.appBackground,
          transition: 'border-color 0.15s',
          outline: 'none',
          cursor: 'pointer',
        }}
        onFocus={(e) => { e.target.style.borderColor = colors.primary; }}
        onBlur={(e) => { e.target.style.borderColor = colors.borderCard; }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function CheckboxInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const { colors } = useTheme();
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 12,
        color: colors.textDark,
        cursor: 'pointer',
        padding: '2px 0',
      }}
    >
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        style={{
          accentColor: colors.primary,
          width: 14,
          height: 14,
        }}
      />
      {label}
    </label>
  );
}

function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const { colors } = useTheme();
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div
      style={{
        marginBottom: 2,
        borderBottom: `1px solid ${colors.borderCard}`,
        paddingBottom: isOpen ? 12 : 0,
      }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '8px 0',
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          color: colors.textDark,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: 0.3,
          }}
        >
          {title}
        </span>
        <span
          style={{
            fontSize: 9,
            color: colors.textLight,
            transition: 'transform 0.2s',
            transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
            lineHeight: 1,
          }}
        >
          ▼
        </span>
      </button>
      {isOpen && (
        <div style={{ paddingTop: 2 }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Color presets — SchoolKit brand palette + neutrals + pastels ─────────
const COLOR_PRESETS = [
  // Brand purples
  '#7B68EE', '#5B4BC7', '#9B6EE8', '#C45CD6',
  // Role accents
  '#0EA5E9', '#EC4899', '#66D9A6',
  // Accent gradients (start colors)
  '#F59E0B', '#06B6D4', '#8B5CF6', '#F97316', '#10B981', '#EF4444', '#3B82F6',
  // Text shades
  '#2D2D44', '#6B6B85', '#8E8EA8', '#FFFFFF',
  // App backgrounds
  '#FBF9FF', '#F0EBFF', '#F8F5FF',
  // Soft pastels (for AI-generated card backgrounds)
  '#B5EAD7', '#FFDAC1', '#C7CEEA', '#FFB7B2', '#E2F0CB', '#CDB4DB',
];

// ─── Shared font options — Raleway (brand) first, then system fallbacks ───
const FONT_OPTIONS = [
  // Brand: Raleway weights loaded via app/_layout.tsx
  { value: 'Raleway_400Regular', label: 'Raleway Regular' },
  { value: 'Raleway_500Medium', label: 'Raleway Medium' },
  { value: 'Raleway_600SemiBold', label: 'Raleway Semibold' },
  { value: 'Raleway_700Bold', label: 'Raleway Bold' },
  { value: 'Raleway_800ExtraBold', label: 'Raleway ExtraBold' },
  { value: 'Raleway_400Regular_Italic', label: 'Raleway Italic' },
  // Sans-serif
  { value: 'Arial', label: 'Arial' },
  { value: 'Helvetica', label: 'Helvetica' },
  { value: 'Verdana', label: 'Verdana' },
  { value: 'Trebuchet MS', label: 'Trebuchet MS' },
  { value: 'Gill Sans', label: 'Gill Sans' },
  { value: 'Tahoma', label: 'Tahoma' },
  { value: 'Lucida Sans', label: 'Lucida Sans' },
  // Serif
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Palatino', label: 'Palatino' },
  { value: 'Garamond', label: 'Garamond' },
  { value: 'Baskerville', label: 'Baskerville' },
  // Monospace
  { value: 'Courier New', label: 'Courier New' },
  { value: 'Monaco', label: 'Monaco' },
  { value: 'Menlo', label: 'Menlo' },
  // Display
  { value: 'Impact', label: 'Impact' },
  { value: 'Copperplate', label: 'Copperplate' },
  { value: 'Papyrus', label: 'Papyrus' },
  { value: 'Brush Script MT', label: 'Brush Script MT' },
];

// ─── Gradient presets — wired to GRADIENTS in constants/onboarding-theme ──
const GRADIENT_PRESETS: { value: string; label: string; colors: string[]; angle: number }[] = [
  { value: 'primaryButton', label: 'Primary Button', colors: [...GRADIENTS.primaryButton], angle: 135 },
  { value: 'welcomeHero', label: 'Welcome Hero', colors: [...GRADIENTS.welcomeHero], angle: 135 },
  { value: 'authHeader', label: 'Auth Header', colors: [...GRADIENTS.authHeader], angle: 135 },
  { value: 'loadingScreen', label: 'Loading Screen', colors: [...GRADIENTS.loadingScreen], angle: 135 },
  { value: 'progressFill', label: 'Progress Fill', colors: [...GRADIENTS.progressFill], angle: 90 },
  { value: 'screenBackground', label: 'Screen Background', colors: [...GRADIENTS.screenBackground], angle: 180 },
  { value: 'roleStudentK8', label: 'Role: Student K-8', colors: [...GRADIENTS.roleStudentK8], angle: 135 },
  { value: 'roleStudentHS', label: 'Role: Student HS', colors: [...GRADIENTS.roleStudentHS], angle: 135 },
  { value: 'roleParent', label: 'Role: Parent', colors: [...GRADIENTS.roleParent], angle: 135 },
  { value: 'roleStaff', label: 'Role: Staff', colors: [...GRADIENTS.roleStaff], angle: 135 },
  { value: 'accentAmber', label: 'Accent: Amber', colors: [...GRADIENTS.accentAmber], angle: 135 },
  { value: 'accentCyan', label: 'Accent: Cyan', colors: [...GRADIENTS.accentCyan], angle: 135 },
  { value: 'accentViolet', label: 'Accent: Violet', colors: [...GRADIENTS.accentViolet], angle: 135 },
  { value: 'accentOrange', label: 'Accent: Orange', colors: [...GRADIENTS.accentOrange], angle: 135 },
  { value: 'accentEmerald', label: 'Accent: Emerald', colors: [...GRADIENTS.accentEmerald], angle: 135 },
  { value: 'errorRed', label: 'Error Red', colors: [...GRADIENTS.errorRed], angle: 135 },
  { value: 'infoBlue', label: 'Info Blue', colors: [...GRADIENTS.infoBlue], angle: 135 },
];

// ─── Shadow presets — wired to SHADOWS in constants/onboarding-theme ──────
// Konva uses {color, offsetX, offsetY, blur}. SHADOWS uses RN format; we
// convert: shadowColor + shadowOpacity → rgba, shadowRadius → blur.
function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const SHADOW_PRESETS: { value: string; label: string; shadow: ShadowConfig }[] = [
  {
    value: 'card',
    label: 'Card (soft)',
    shadow: { color: hexToRgba(SHADOW_SPECS.card.shadowColor, SHADOW_SPECS.card.shadowOpacity), offsetX: 0, offsetY: SHADOW_SPECS.card.shadowOffset.height, blur: SHADOW_SPECS.card.shadowRadius },
  },
  {
    value: 'cardLarge',
    label: 'Card Large',
    shadow: { color: hexToRgba(SHADOW_SPECS.cardLarge.shadowColor, SHADOW_SPECS.cardLarge.shadowOpacity), offsetX: 0, offsetY: SHADOW_SPECS.cardLarge.shadowOffset.height, blur: SHADOW_SPECS.cardLarge.shadowRadius },
  },
  {
    value: 'cardSelected',
    label: 'Card Selected (purple glow)',
    shadow: { color: hexToRgba(SHADOW_SPECS.cardSelected.shadowColor, SHADOW_SPECS.cardSelected.shadowOpacity), offsetX: 0, offsetY: SHADOW_SPECS.cardSelected.shadowOffset.height, blur: SHADOW_SPECS.cardSelected.shadowRadius },
  },
  {
    value: 'button',
    label: 'Button (strong purple)',
    shadow: { color: hexToRgba(SHADOW_SPECS.button.shadowColor, SHADOW_SPECS.button.shadowOpacity), offsetX: 0, offsetY: SHADOW_SPECS.button.shadowOffset.height, blur: SHADOW_SPECS.button.shadowRadius },
  },
  {
    value: 'small',
    label: 'Small (purple)',
    shadow: { color: hexToRgba(SHADOW_SPECS.small.shadowColor, SHADOW_SPECS.small.shadowOpacity), offsetX: 0, offsetY: SHADOW_SPECS.small.shadowOffset.height, blur: SHADOW_SPECS.small.shadowRadius },
  },
  {
    value: 'header',
    label: 'Header',
    shadow: { color: hexToRgba(SHADOW_SPECS.header.shadowColor, SHADOW_SPECS.header.shadowOpacity), offsetX: 0, offsetY: SHADOW_SPECS.header.shadowOffset.height, blur: SHADOW_SPECS.header.shadowRadius },
  },
  {
    value: 'iconCircle',
    label: 'Icon Circle',
    shadow: { color: hexToRgba(SHADOW_SPECS.iconCircle.shadowColor, SHADOW_SPECS.iconCircle.shadowOpacity), offsetX: 0, offsetY: SHADOW_SPECS.iconCircle.shadowOffset.height, blur: SHADOW_SPECS.iconCircle.shadowRadius },
  },
];

// ─── Text Decoration Input ────────────────────────────────────
function TextDecorationInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const { t } = useTranslation();
  const hasUnderline = (value || '').includes('underline');
  const hasLineThrough = (value || '').includes('line-through');

  const toggle = (part: string, on: boolean) => {
    const parts = (value || '').split(' ').filter(Boolean);
    const next = on ? [...parts, part] : parts.filter((p) => p !== part);
    onChange(next.join(' '));
  };

  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <CheckboxInput
        label={t('design.props.underline')}
        value={hasUnderline}
        onChange={(on) => toggle('underline', on)}
      />
      <CheckboxInput
        label={t('design.props.strikethrough')}
        value={hasLineThrough}
        onChange={(on) => toggle('line-through', on)}
      />
    </div>
  );
}

// ─── Stroke Dash Section ──────────────────────────────────────
function StrokeDashSection({
  dash,
  lineCap,
  lineJoin,
  onUpdate,
}: {
  dash: StrokeDashPreset | undefined;
  lineCap: string | undefined;
  lineJoin: string | undefined;
  onUpdate: (changes: Partial<DesignObject>) => void;
}) {
  const { t } = useTranslation();
  return (
    <Section title={t('design.props.strokeStyle')}>
      <div style={{ marginBottom: 6 }}>
        <SelectInput
          label={t('design.props.dashPattern')}
          value={dash ?? 'solid'}
          options={[
            { value: 'solid', label: t('design.props.options.solid') },
            { value: 'dashed', label: t('design.props.options.dashed') },
            { value: 'dotted', label: t('design.props.options.dotted') },
            { value: 'dash-dot', label: t('design.props.options.dash-dot') },
          ]}
          onChange={(v) => onUpdate({ dash: v } as any)}
        />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <SelectInput
          label={t('design.props.lineCap')}
          value={lineCap ?? 'butt'}
          options={[
            { value: 'butt', label: t('design.props.options.butt') },
            { value: 'round', label: t('design.props.options.round') },
            { value: 'square', label: t('design.props.options.square') },
          ]}
          onChange={(v) => onUpdate({ lineCap: v } as any)}
        />
        <SelectInput
          label={t('design.props.lineJoin')}
          value={lineJoin ?? 'miter'}
          options={[
            { value: 'miter', label: t('design.props.options.miter') },
            { value: 'round', label: t('design.props.options.round') },
            { value: 'bevel', label: t('design.props.options.bevel') },
          ]}
          onChange={(v) => onUpdate({ lineJoin: v } as any)}
        />
      </div>
    </Section>
  );
}

export function PropertiesPanel() {
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const objects = useEditorStore((s) => s.objects);
  const updateObject = useEditorStore((s) => s.updateObject);
  const canvas = useEditorStore((s) => s.canvas);
  const setCanvasBackground = useEditorStore((s) => s.setCanvasBackground);
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'properties' | 'canvas'>(
    'properties',
  );

  const editingComponentId = useEditorStore((s) => s.editingComponentId);
  const updateChildObject = useEditorStore((s) => s.updateChildObject);

  const selected =
    selectedIds.length === 1
      ? objects.find((o) => o.id === selectedIds[0])
      : null;

  const editingComponent = editingComponentId
    ? objects.find((o) => o.id === editingComponentId)
    : null;
  const selectedChild =
    editingComponentId && editingComponent && editingComponent.type === 'interactive' && selectedIds.length === 1
      ? editingComponent.children.find((c) => c.id === selectedIds[0])
      : null;

  const update = (changes: Partial<DesignObject>) => {
    if (editingComponentId && selectedChild) {
      updateChildObject(selectedChild.id, changes as any);
    } else if (selected) {
      updateObject(selected.id, changes);
    }
  };

  const displayObject = editingComponentId ? selectedChild : selected;

  return (
    <div
      style={{
        width: 280,
        backgroundColor: colors.white,
        borderLeft: `1px solid ${colors.borderCard}`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          padding: '8px 10px 0',
          gap: 4,
          borderBottom: `1px solid ${colors.borderCard}`,
        }}
      >
        {(['properties', 'canvas'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '7px 0 9px',
              border: 'none',
              backgroundColor: 'transparent',
              fontSize: 11,
              fontWeight: 600,
              color: activeTab === tab ? colors.primary : colors.textLight,
              borderBottom:
                activeTab === tab ? `2px solid ${colors.primary}` : '2px solid transparent',
              cursor: 'pointer',
              textTransform: 'capitalize',
              letterSpacing: 0.3,
              transition: 'color 0.15s',
              borderRadius: '6px 6px 0 0',
            }}
          >
            {tab === 'properties' ? t('design.props.tabDesign') : t('design.props.tabCanvas')}
          </button>
        ))}
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '6px 14px 14px',
        }}
      >
        {activeTab === 'canvas' ? (
          <CanvasProperties />
        ) : displayObject ? (
          displayObject.type === 'interactive' ? (
            <InteractiveProperties object={displayObject as InteractiveComponentObject} />
          ) : (
            <>
              <AlignmentToolbar />
              <ObjectProperties object={displayObject} onUpdate={update} />
            </>
          )
        ) : selectedIds.length > 1 ? (
          <>
            <AlignmentToolbar />
            <div
              style={{
                color: colors.textLight,
                fontSize: 12,
                textAlign: 'center',
                paddingTop: 20,
              }}
            >
              {t('design.props.objectsSelected', { count: selectedIds.length })}
            </div>
          </>
        ) : (
          <div
            style={{
              color: colors.textLight,
              fontSize: 12,
              textAlign: 'center',
              paddingTop: 48,
              lineHeight: 1.5,
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 8, opacity: 0.4 }}>&#9670;</div>
            {t('design.props.emptySelect')}
          </div>
        )}
      </div>
    </div>
  );
}

function CanvasProperties() {
  const canvas = useEditorStore((s) => s.canvas);
  const setCanvasSize = useEditorStore((s) => s.setCanvasSize);
  const setCanvasBackground = useEditorStore((s) => s.setCanvasBackground);
  const setCanvasGradient = useEditorStore((s) => s.setCanvasGradient);
  const { t } = useTranslation();
  const gradient = canvas.backgroundGradient;

  return (
    <>
      <Section title={t('design.props.canvasSize')}>
        <div style={{ display: 'flex', gap: 8 }}>
          <NumberInput
            label={t('design.props.width')}
            value={canvas.width}
            onChange={(w) => setCanvasSize(w, canvas.height)}
            min={100}
            max={5000}
          />
          <NumberInput
            label={t('design.props.height')}
            value={canvas.height}
            onChange={(h) => setCanvasSize(canvas.width, h)}
            min={100}
            max={5000}
          />
        </div>
      </Section>
      <Section title={t('design.props.background')}>
        <ColorInput
          label={t('design.props.color')}
          value={canvas.background}
          onChange={setCanvasBackground}
        />
      </Section>
      <Section title={t('design.props.backgroundGradient')}>
        <div style={{ marginBottom: 8 }}>
          <CheckboxInput
            label={t('design.props.enableGradient')}
            value={!!gradient}
            onChange={(on) => {
              if (on) {
                setCanvasGradient({ type: 'linear', colors: ['#7B68EE', '#0EA5E9'], angle: 135 });
              } else {
                setCanvasGradient(null);
              }
            }}
          />
        </div>
        {gradient && (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <SelectInput
                label={t('design.props.type')}
                value={gradient.type}
                options={[
                  { value: 'linear', label: t('design.props.options.linear') },
                  { value: 'radial', label: t('design.props.options.radial') },
                ]}
                onChange={(v) => setCanvasGradient({ ...gradient, type: v as 'linear' | 'radial' })}
              />
              {gradient.type === 'linear' && (
                <NumberInput
                  label={t('design.props.angle')}
                  value={gradient.angle ?? 0}
                  onChange={(v) => setCanvasGradient({ ...gradient, angle: v })}
                  min={0}
                  max={360}
                />
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <ColorInput
                label={t('design.props.start')}
                value={gradient.colors[0] || '#7B68EE'}
                onChange={(c) => {
                  const colors = [...gradient.colors];
                  colors[0] = c;
                  setCanvasGradient({ ...gradient, colors });
                }}
              />
              <ColorInput
                label={t('design.props.end')}
                value={gradient.colors[1] || '#0EA5E9'}
                onChange={(c) => {
                  const colors = [...gradient.colors];
                  colors[1] = c;
                  setCanvasGradient({ ...gradient, colors });
                }}
              />
            </div>
          </>
        )}
      </Section>
    </>
  );
}

function ObjectProperties({
  object,
  onUpdate,
}: {
  object: DesignObject;
  onUpdate: (changes: Partial<DesignObject>) => void;
}) {
  const { t } = useTranslation();
  return (
    <>
      {/* Position & Size - all objects */}
      <Section title={t('design.props.positionSize')}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
          <NumberInput
            label={t('design.props.axisX')}
            value={object.x}
            onChange={(x) => onUpdate({ x })}
          />
          <NumberInput
            label={t('design.props.axisY')}
            value={object.y}
            onChange={(y) => onUpdate({ y })}
          />
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
          <NumberInput
            label={t('design.props.axisW')}
            value={object.width}
            onChange={(width) => onUpdate({ width })}
            min={1}
          />
          <NumberInput
            label={t('design.props.axisH')}
            value={object.height}
            onChange={(height) => onUpdate({ height })}
            min={1}
          />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <NumberInput
            label={t('design.props.rotation')}
            value={object.rotation}
            onChange={(rotation) => onUpdate({ rotation })}
            min={-360}
            max={360}
          />
          <RangeInput
            label={t('design.props.opacity')}
            value={object.opacity}
            onChange={(opacity) => onUpdate({ opacity })}
          />
        </div>
      </Section>

      {/* Accessibility & Blend Mode */}
      <Section title={t('design.props.accessibility')}>
        <TextInput
          label={t('design.props.a11yLabel')}
          value={(object as any).accessibilityLabel ?? ''}
          onChange={(v) => onUpdate({ accessibilityLabel: v || undefined } as any)}
          placeholder={t('design.props.a11yPlaceholder')}
        />
      </Section>

      {object.type !== 'line' && object.type !== 'arrow' && (
        <Section title={t('design.props.blendMode')}>
          <SelectInput
            label={t('design.props.mode')}
            value={(object as any).blendMode ?? 'normal'}
            options={[
              { value: 'normal', label: t('design.props.options.normal') },
              { value: 'multiply', label: t('design.props.options.multiply') },
              { value: 'screen', label: t('design.props.options.screen') },
              { value: 'overlay', label: t('design.props.options.overlay') },
              { value: 'darken', label: t('design.props.options.darken') },
              { value: 'lighten', label: t('design.props.options.lighten') },
            ]}
            onChange={(v) => onUpdate({ blendMode: v === 'normal' ? undefined : v } as any)}
          />
        </Section>
      )}

      <EntranceAnimationSection
        animation={(object as any).animation}
        onUpdate={onUpdate}
      />

      {/* Type-specific properties */}
      {(object.type === 'rect' || object.type === 'ellipse') && (
        <ShapeProperties object={object} onUpdate={onUpdate} />
      )}

      {object.type === 'text' && (
        <TextProperties object={object} onUpdate={onUpdate} />
      )}

      {object.type === 'line' && (
        <LineProperties object={object} onUpdate={onUpdate} />
      )}

      {object.type === 'star' && (
        <StarProperties object={object} onUpdate={onUpdate} />
      )}

      {object.type === 'triangle' && (
        <TriangleProperties object={object} onUpdate={onUpdate} />
      )}

      {object.type === 'arrow' && (
        <ArrowProperties object={object} onUpdate={onUpdate} />
      )}

      {object.type === 'image' && (
        <ImageProperties object={object} onUpdate={onUpdate} />
      )}

      {object.type === 'badge' && (
        <BadgeProperties object={object} onUpdate={onUpdate} />
      )}

      {object.type === 'icon' && (
        <IconProperties object={object} onUpdate={onUpdate} />
      )}
    </>
  );
}

// ─── Gradient / Shadow / Blur sections ─────────────────────────

function GradientSection({
  gradient,
  onUpdate,
}: {
  gradient: GradientConfig | null | undefined;
  onUpdate: (changes: Partial<DesignObject>) => void;
}) {
  const { t } = useTranslation();
  const enabled = !!gradient;
  return (
    <Section title={t('design.props.gradient')}>
      <div style={{ marginBottom: 8 }}>
        <CheckboxInput
          label={t('design.props.enableGradient')}
          value={enabled}
          onChange={(on) => {
            if (on) {
              onUpdate({ gradient: { type: 'linear', colors: ['#7B68EE', '#0EA5E9'], angle: 90 } } as any);
            } else {
              onUpdate({ gradient: null } as any);
            }
          }}
        />
      </div>
      {enabled && gradient && (
        <>
          {/* Brand gradient presets */}
          <div style={{ marginBottom: 8 }}>
            <SelectInput
              label={t('design.props.preset')}
              value=""
              options={[{ value: '', label: t('design.props.options.custom') }, ...GRADIENT_PRESETS.map((p) => ({ value: p.value, label: t('design.props.gradientPresets.' + p.value) }))]}
              onChange={(v) => {
                const preset = GRADIENT_PRESETS.find((p) => p.value === v);
                if (preset) {
                  onUpdate({ gradient: { type: gradient.type, colors: preset.colors, angle: preset.angle } } as any);
                }
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <SelectInput
              label={t('design.props.type')}
              value={gradient.type}
              options={[
                { value: 'linear', label: t('design.props.options.linear') },
                { value: 'radial', label: t('design.props.options.radial') },
              ]}
              onChange={(v) => onUpdate({ gradient: { ...gradient, type: v as 'linear' | 'radial' } } as any)}
            />
            {gradient.type === 'linear' && (
              <NumberInput
                label={t('design.props.angle')}
                value={gradient.angle ?? 0}
                onChange={(v) => onUpdate({ gradient: { ...gradient, angle: v } } as any)}
                min={0}
                max={360}
              />
            )}
          </div>
          {gradient.colors.map((color, i) => (
            <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'flex-end' }}>
              <ColorInput
                label={i === 0 ? t('design.props.start') : i === gradient.colors.length - 1 ? t('design.props.end') : t('design.props.stop', { n: i + 1 })}
                value={color}
                onChange={(c) => {
                  const colors = [...gradient.colors];
                  colors[i] = c;
                  onUpdate({ gradient: { ...gradient, colors } } as any);
                }}
              />
              {gradient.colors.length > 2 && (
                <button
                  onClick={() => {
                    const colors = gradient.colors.filter((_, j) => j !== i);
                    onUpdate({ gradient: { ...gradient, colors } } as any);
                  }}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    border: '1px solid #E8E8F0',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    fontSize: 14,
                    color: '#EF4444',
                    flexShrink: 0,
                    marginBottom: 3,
                  }}
                >
                  ×
                </button>
              )}
            </div>
          ))}
          {gradient.colors.length < 4 && (
            <button
              onClick={() => {
                const colors = [...gradient.colors, '#F59E0B'];
                onUpdate({ gradient: { ...gradient, colors } } as any);
              }}
              style={{
                width: '100%',
                padding: '5px 0',
                border: '1px dashed #E8E8F0',
                borderRadius: 6,
                backgroundColor: 'transparent',
                cursor: 'pointer',
                fontSize: 11,
                color: '#8E8EA8',
                marginTop: 4,
                transition: 'background-color 0.15s, color 0.15s',
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.backgroundColor = '#F8F8FC';
                (e.target as HTMLElement).style.color = '#6B6B85';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.backgroundColor = 'transparent';
                (e.target as HTMLElement).style.color = '#8E8EA8';
              }}
            >
              {t('design.props.addStop')}
            </button>
          )}
        </>
      )}
    </Section>
  );
}

function ShadowSection({
  shadow,
  onUpdate,
}: {
  shadow: ShadowConfig | null | undefined;
  onUpdate: (changes: Partial<DesignObject>) => void;
}) {
  const { t } = useTranslation();
  const enabled = !!shadow;
  return (
    <Section title={t('design.props.shadow')}>
      <div style={{ marginBottom: 8 }}>
        <CheckboxInput
          label={t('design.props.enableShadow')}
          value={enabled}
          onChange={(on) => {
            if (on) {
              // Default to the brand "card" shadow preset (purple-tinted) rather than black.
              onUpdate({ shadow: SHADOW_PRESETS[0].shadow } as any);
            } else {
              onUpdate({ shadow: null } as any);
            }
          }}
        />
      </div>
      {enabled && shadow && (
        <>
          {/* Brand shadow presets */}
          <div style={{ marginBottom: 8 }}>
            <SelectInput
              label={t('design.props.preset')}
              value=""
              options={[{ value: '', label: t('design.props.options.custom') }, ...SHADOW_PRESETS.map((p) => ({ value: p.value, label: t('design.props.shadowPresets.' + p.value) }))]}
              onChange={(v) => {
                const preset = SHADOW_PRESETS.find((p) => p.value === v);
                if (preset) onUpdate({ shadow: preset.shadow } as any);
              }}
            />
          </div>
          <div style={{ marginBottom: 8 }}>
            <ColorInput
              label={t('design.props.color')}
              value={shadow.color}
              onChange={(c) => onUpdate({ shadow: { ...shadow, color: c } } as any)}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <NumberInput
              label={t('design.props.offsetX')}
              value={shadow.offsetX}
              onChange={(v) => onUpdate({ shadow: { ...shadow, offsetX: v } } as any)}
              min={-100}
              max={100}
            />
            <NumberInput
              label={t('design.props.offsetY')}
              value={shadow.offsetY}
              onChange={(v) => onUpdate({ shadow: { ...shadow, offsetY: v } } as any)}
              min={-100}
              max={100}
            />
          </div>
          <NumberInput
            label={t('design.props.blur')}
            value={shadow.blur}
            onChange={(v) => onUpdate({ shadow: { ...shadow, blur: v } } as any)}
            min={0}
            max={100}
          />
        </>
      )}
    </Section>
  );
}

function EntranceAnimationSection({
  animation,
  onUpdate,
}: {
  animation: { type: string; delay: number; duration: number } | undefined;
  onUpdate: (changes: Partial<DesignObject>) => void;
}) {
  const { t } = useTranslation();
  const enabled = !!animation && animation.type !== 'none';
  const a = animation ?? { type: 'none', delay: 0, duration: 400 };
  return (
    <Section title={t('design.props.entranceAnimation')}>
      <div style={{ marginBottom: 8 }}>
        <CheckboxInput
          label={t('design.props.animateOnPreview')}
          value={enabled}
          onChange={(on) => {
            if (on) {
              onUpdate({ animation: { type: 'fade-in', delay: 0, duration: 400 } } as any);
            } else {
              onUpdate({ animation: undefined } as any);
            }
          }}
        />
      </div>
      {enabled && (
        <>
          <div style={{ marginBottom: 8 }}>
            <SelectInput
              label={t('design.props.type')}
              value={a.type}
              options={[
                { value: 'fade-in', label: t('design.props.options.fade-in') },
                { value: 'slide-up', label: t('design.props.options.slide-up') },
                { value: 'slide-down', label: t('design.props.options.slide-down') },
                { value: 'scale-up', label: t('design.props.options.scale-up') },
              ]}
              onChange={(v) =>
                onUpdate({ animation: { ...a, type: v as any } } as any)
              }
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <NumberInput
              label={t('design.props.delayMs')}
              value={a.delay}
              onChange={(v) =>
                onUpdate({ animation: { ...a, delay: Math.max(0, v) } } as any)
              }
              min={0}
              max={5000}
              step={50}
            />
            <NumberInput
              label={t('design.props.durationMs')}
              value={a.duration}
              onChange={(v) =>
                onUpdate({ animation: { ...a, duration: Math.max(50, v) } } as any)
              }
              min={50}
              max={5000}
              step={50}
            />
          </div>
        </>
      )}
    </Section>
  );
}

function BlurSection({
  blur,
  onUpdate,
}: {
  blur: number | undefined;
  onUpdate: (changes: Partial<DesignObject>) => void;
}) {
  const { t } = useTranslation();
  return (
    <Section title={t('design.props.blur')}>
      <NumberInput
        label={t('design.props.blurRadius')}
        value={blur || 0}
        onChange={(v) => onUpdate({ blur: Math.max(0, Math.min(20, v)) } as any)}
        min={0}
        max={20}
      />
    </Section>
  );
}

// ─── Shape properties (rect/ellipse) ──────────────────────────

function ShapeProperties({
  object,
  onUpdate,
}: {
  object: DesignObject & { fill: string; stroke: string; strokeWidth: number };
  onUpdate: (changes: Partial<DesignObject>) => void;
}) {
  const gradient = (object as any).gradient as GradientConfig | null | undefined;
  const shadow = (object as any).shadow as ShadowConfig | null | undefined;
  const blur = (object as any).blur as number | undefined;

  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <>
      <Section title={t('design.props.fillStroke')}>
        <div style={{ marginBottom: 8, opacity: gradient ? 0.5 : 1, position: 'relative' }}>
          <ColorInput
            label={t('design.props.fill')}
            value={object.fill}
            onChange={(fill) => onUpdate({ fill } as Partial<DesignObject>)}
          />
          {gradient && (
            <div style={{
              fontSize: 10,
              color: colors.textLight,
              fontStyle: 'italic',
              marginTop: 4,
            }}>
              {t('design.props.overriddenByGradient')}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <ColorInput
            label={t('design.props.stroke')}
            value={object.stroke}
            onChange={(stroke) =>
              onUpdate({ stroke } as Partial<DesignObject>)
            }
          />
          <NumberInput
            label={t('design.props.width')}
            value={object.strokeWidth}
            onChange={(strokeWidth) =>
              onUpdate({ strokeWidth } as Partial<DesignObject>)
            }
            min={0}
            max={20}
          />
        </div>
      </Section>

      {object.type === 'rect' && 'cornerRadius' in object && (
        <Section title={t('design.props.cornerRadius')}>
          <NumberInput
            label={t('design.props.radius')}
            value={(object as { cornerRadius: number }).cornerRadius}
            onChange={(cornerRadius) =>
              onUpdate({ cornerRadius } as Partial<DesignObject>)
            }
            min={0}
            max={200}
          />
        </Section>
      )}

      <StrokeDashSection
        dash={(object as any).dash}
        lineCap={(object as any).lineCap}
        lineJoin={(object as any).lineJoin}
        onUpdate={onUpdate}
      />

      <GradientSection gradient={gradient} onUpdate={onUpdate} />
      <ShadowSection shadow={shadow} onUpdate={onUpdate} />
      <BlurSection blur={blur} onUpdate={onUpdate} />
    </>
  );
}

function TextProperties({
  object,
  onUpdate,
}: {
  object: DesignObject & { type: 'text' };
  onUpdate: (changes: Partial<DesignObject>) => void;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const shadow = (object as any).shadow as ShadowConfig | null | undefined;
  return (
    <>
      <Section title={t('design.props.text')}>
        <textarea
          value={object.text}
          onChange={(e) =>
            onUpdate({ text: e.target.value } as Partial<DesignObject>)
          }
          style={{
            width: '100%',
            minHeight: 56,
            padding: '6px 8px',
            borderRadius: 6,
            border: `1px solid ${colors.borderCard}`,
            fontSize: 12,
            color: colors.textDark,
            backgroundColor: colors.appBackground,
            resize: 'vertical',
            fontFamily: 'inherit',
            boxSizing: 'border-box',
            transition: 'border-color 0.15s, box-shadow 0.15s',
            outline: 'none',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = colors.primary;
            e.target.style.boxShadow = `0 0 0 2px ${colors.primary}22`;
          }}
          onBlur={(e) => {
            e.target.style.borderColor = colors.borderCard;
            e.target.style.boxShadow = 'none';
          }}
        />
      </Section>

      <Section title={t('design.props.font')}>
        <div style={{ marginBottom: 6 }}>
          <SelectInput
            label={t('design.props.family')}
            value={object.fontFamily}
            options={FONT_OPTIONS}
            onChange={(fontFamily) =>
              onUpdate({ fontFamily } as Partial<DesignObject>)
            }
          />
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
          <NumberInput
            label={t('design.props.size')}
            value={object.fontSize}
            onChange={(fontSize) =>
              onUpdate({ fontSize } as Partial<DesignObject>)
            }
            min={8}
            max={200}
          />
          <NumberInput
            label={t('design.props.lineHeight')}
            value={object.lineHeight}
            onChange={(lineHeight) =>
              onUpdate({ lineHeight } as Partial<DesignObject>)
            }
            min={0.5}
            max={3}
            step={0.1}
          />
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
          <SelectInput
            label={t('design.props.style')}
            value={object.fontStyle}
            options={[
              { value: 'normal', label: t('design.props.options.normal') },
              { value: 'bold', label: t('design.props.options.bold') },
              { value: 'italic', label: t('design.props.options.italic') },
              { value: 'bold italic', label: t('design.props.options.boldItalic') },
            ]}
            onChange={(fontStyle) =>
              onUpdate({ fontStyle } as Partial<DesignObject>)
            }
          />
          <SelectInput
            label={t('design.props.weight')}
            value={(object as any).fontWeight ?? ''}
            options={[
              { value: '', label: t('design.props.options.weightAuto') },
              { value: '100', label: t('design.props.options.weight100') },
              { value: '200', label: t('design.props.options.weight200') },
              { value: '300', label: t('design.props.options.weight300') },
              { value: '400', label: t('design.props.options.weight400') },
              { value: '500', label: t('design.props.options.weight500') },
              { value: '600', label: t('design.props.options.weight600') },
              { value: '700', label: t('design.props.options.weight700') },
              { value: '800', label: t('design.props.options.weight800') },
              { value: '900', label: t('design.props.options.weight900') },
            ]}
            onChange={(v) => onUpdate({ fontWeight: v || undefined } as any)}
          />
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
          <SelectInput
            label={t('design.props.align')}
            value={object.align}
            options={[
              { value: 'left', label: t('design.props.options.left') },
              { value: 'center', label: t('design.props.options.center') },
              { value: 'right', label: t('design.props.options.right') },
              { value: 'justify', label: t('design.props.options.justify') },
            ]}
            onChange={(align) =>
              onUpdate({ align } as Partial<DesignObject>)
            }
          />
          <SelectInput
            label={t('design.props.transform')}
            value={(object as any).textTransform ?? 'none'}
            options={[
              { value: 'none', label: t('design.props.options.none') },
              { value: 'uppercase', label: t('design.props.options.uppercase') },
              { value: 'lowercase', label: t('design.props.options.lowercase') },
              { value: 'capitalize', label: t('design.props.options.capitalize') },
            ]}
            onChange={(v) => onUpdate({ textTransform: v } as any)}
          />
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
          <NumberInput
            label={t('design.props.letterSpacing')}
            value={object.letterSpacing ?? 0}
            onChange={(v) => onUpdate({ letterSpacing: v } as any)}
            min={-5}
            max={50}
            step={0.5}
          />
          <NumberInput
            label={t('design.props.padding')}
            value={object.padding ?? 0}
            onChange={(v) => onUpdate({ padding: v } as any)}
            min={0}
            max={100}
          />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <SelectInput
            label={t('design.props.verticalAlign')}
            value={object.verticalAlign ?? 'top'}
            options={[
              { value: 'top', label: t('design.props.options.top') },
              { value: 'middle', label: t('design.props.options.middle') },
              { value: 'bottom', label: t('design.props.options.bottom') },
            ]}
            onChange={(v) => onUpdate({ verticalAlign: v } as any)}
          />
          <SelectInput
            label={t('design.props.fontVariant')}
            value={object.fontVariant ?? 'normal'}
            options={[
              { value: 'normal', label: t('design.props.options.normal') },
              { value: 'small-caps', label: t('design.props.options.small-caps') },
            ]}
            onChange={(v) => onUpdate({ fontVariant: v } as any)}
          />
        </div>
      </Section>

      <Section title={t('design.props.textDecoration')}>
        <TextDecorationInput
          value={object.textDecoration ?? ''}
          onChange={(v) => onUpdate({ textDecoration: v } as any)}
        />
      </Section>

      <Section title={t('design.props.color')}>
        <ColorInput
          label={t('design.props.textColor')}
          value={object.fill}
          onChange={(fill) => onUpdate({ fill } as Partial<DesignObject>)}
        />
      </Section>

      <Section title={t('design.props.textOutline')}>
        <div style={{ display: 'flex', gap: 8 }}>
          <ColorInput
            label={t('design.props.outlineColor')}
            value={object.stroke ?? ''}
            onChange={(v) => onUpdate({ stroke: v } as any)}
          />
          <NumberInput
            label={t('design.props.outlineWidth')}
            value={object.strokeWidth ?? 0}
            onChange={(v) => onUpdate({ strokeWidth: v } as any)}
            min={0}
            max={10}
            step={0.5}
          />
        </div>
      </Section>

      <ShadowSection shadow={shadow} onUpdate={onUpdate} />
    </>
  );
}

function LineProperties({
  object,
  onUpdate,
}: {
  object: DesignObject & { type: 'line' };
  onUpdate: (changes: Partial<DesignObject>) => void;
}) {
  const { t } = useTranslation();
  return (
    <>
      <Section title={t('design.props.line')}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
          <ColorInput
            label={t('design.props.stroke')}
            value={object.stroke}
            onChange={(stroke) =>
              onUpdate({ stroke } as Partial<DesignObject>)
            }
          />
          <NumberInput
            label={t('design.props.width')}
            value={object.strokeWidth}
            onChange={(strokeWidth) =>
              onUpdate({ strokeWidth } as Partial<DesignObject>)
            }
            min={1}
            max={20}
          />
        </div>
      </Section>

      <Section title={t('design.props.strokeStyle')}>
        <div style={{ marginBottom: 6 }}>
          <SelectInput
            label={t('design.props.dashPattern')}
            value={object.dash ?? 'solid'}
            options={[
              { value: 'solid', label: t('design.props.options.solid') },
              { value: 'dashed', label: t('design.props.options.dashed') },
              { value: 'dotted', label: t('design.props.options.dotted') },
              { value: 'dash-dot', label: t('design.props.options.dash-dot') },
            ]}
            onChange={(v) => onUpdate({ dash: v } as any)}
          />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <SelectInput
            label={t('design.props.lineCap')}
            value={object.lineCap}
            options={[
              { value: 'butt', label: t('design.props.options.butt') },
              { value: 'round', label: t('design.props.options.round') },
              { value: 'square', label: t('design.props.options.square') },
            ]}
            onChange={(v) => onUpdate({ lineCap: v } as any)}
          />
          <SelectInput
            label={t('design.props.lineJoin')}
            value={object.lineJoin}
            options={[
              { value: 'miter', label: t('design.props.options.miter') },
              { value: 'round', label: t('design.props.options.round') },
              { value: 'bevel', label: t('design.props.options.bevel') },
            ]}
            onChange={(v) => onUpdate({ lineJoin: v } as any)}
          />
        </div>
      </Section>
    </>
  );
}

// ─── New shape property sections ──────────────────────────────

function StarProperties({
  object,
  onUpdate,
}: {
  object: DesignObject & { type: 'star' };
  onUpdate: (changes: Partial<DesignObject>) => void;
}) {
  const { t } = useTranslation();
  return (
    <>
      <Section title={t('design.props.star')}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <NumberInput
            label={t('design.props.points')}
            value={object.points}
            onChange={(v) => onUpdate({ points: Math.max(3, Math.min(12, Math.round(v))) } as any)}
            min={3}
            max={12}
          />
          <NumberInput
            label={t('design.props.innerRadius')}
            value={object.innerRadius}
            onChange={(v) => onUpdate({ innerRadius: Math.max(0.3, Math.min(0.9, v)) } as any)}
            min={0.3}
            max={0.9}
            step={0.05}
          />
        </div>
      </Section>

      <Section title={t('design.props.fillStroke')}>
        <div style={{ marginBottom: 8 }}>
          <ColorInput
            label={t('design.props.fill')}
            value={object.fill}
            onChange={(fill) => onUpdate({ fill } as any)}
          />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <ColorInput
            label={t('design.props.stroke')}
            value={object.stroke}
            onChange={(stroke) => onUpdate({ stroke } as any)}
          />
          <NumberInput
            label={t('design.props.width')}
            value={object.strokeWidth}
            onChange={(strokeWidth) => onUpdate({ strokeWidth } as any)}
            min={0}
            max={20}
          />
        </div>
      </Section>

      <StrokeDashSection
        dash={object.dash}
        lineCap={object.lineCap}
        lineJoin={object.lineJoin}
        onUpdate={onUpdate}
      />

      <GradientSection gradient={object.gradient} onUpdate={onUpdate} />
      <ShadowSection shadow={object.shadow} onUpdate={onUpdate} />
    </>
  );
}

function TriangleProperties({
  object,
  onUpdate,
}: {
  object: DesignObject & { type: 'triangle' };
  onUpdate: (changes: Partial<DesignObject>) => void;
}) {
  const { t } = useTranslation();
  return (
    <>
      <Section title={t('design.props.fillStroke')}>
        <div style={{ marginBottom: 8 }}>
          <ColorInput
            label={t('design.props.fill')}
            value={object.fill}
            onChange={(fill) => onUpdate({ fill } as any)}
          />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <ColorInput
            label={t('design.props.stroke')}
            value={object.stroke}
            onChange={(stroke) => onUpdate({ stroke } as any)}
          />
          <NumberInput
            label={t('design.props.width')}
            value={object.strokeWidth}
            onChange={(strokeWidth) => onUpdate({ strokeWidth } as any)}
            min={0}
            max={20}
          />
        </div>
      </Section>

      <StrokeDashSection
        dash={object.dash}
        lineCap={object.lineCap}
        lineJoin={object.lineJoin}
        onUpdate={onUpdate}
      />

      <GradientSection gradient={object.gradient} onUpdate={onUpdate} />
      <ShadowSection shadow={object.shadow} onUpdate={onUpdate} />
    </>
  );
}

function ArrowProperties({
  object,
  onUpdate,
}: {
  object: DesignObject & { type: 'arrow' };
  onUpdate: (changes: Partial<DesignObject>) => void;
}) {
  const { t } = useTranslation();
  return (
    <>
      <Section title={t('design.props.arrow')}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <ColorInput
            label={t('design.props.stroke')}
            value={object.stroke}
            onChange={(stroke) => onUpdate({ stroke } as any)}
          />
          <NumberInput
            label={t('design.props.width')}
            value={object.strokeWidth}
            onChange={(strokeWidth) => onUpdate({ strokeWidth } as any)}
            min={1}
            max={20}
          />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <NumberInput
            label={t('design.props.pointerLength')}
            value={object.pointerLength}
            onChange={(v) => onUpdate({ pointerLength: v } as any)}
            min={5}
            max={50}
          />
          <NumberInput
            label={t('design.props.pointerWidth')}
            value={object.pointerWidth}
            onChange={(v) => onUpdate({ pointerWidth: v } as any)}
            min={5}
            max={50}
          />
        </div>
      </Section>

      <StrokeDashSection
        dash={object.dash}
        lineCap={object.lineCap}
        lineJoin={object.lineJoin}
        onUpdate={onUpdate}
      />
    </>
  );
}

function ImageProperties({
  object,
  onUpdate,
}: {
  object: DesignObject & { type: 'image' };
  onUpdate: (changes: Partial<DesignObject>) => void;
}) {
  const shadow = (object as any).shadow as import('../types/document').ShadowConfig | null | undefined;
  const { t } = useTranslation();
  return (
    <>
      <Section title={t('design.props.imageStyle')}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
          <NumberInput
            label={t('design.props.cornerRadius')}
            value={(object as any).cornerRadius ?? 0}
            onChange={(v) => onUpdate({ cornerRadius: v } as any)}
            min={0}
            max={200}
          />
          <SelectInput
            label={t('design.props.objectFit')}
            value={(object as any).objectFit ?? 'cover'}
            options={[
              { value: 'cover', label: t('design.props.options.cover') },
              { value: 'contain', label: t('design.props.options.contain') },
              { value: 'fill', label: t('design.props.options.fill') },
            ]}
            onChange={(v) => onUpdate({ objectFit: v } as any)}
          />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <ColorInput
            label={t('design.props.stroke')}
            value={(object as any).stroke ?? ''}
            onChange={(v) => onUpdate({ stroke: v } as any)}
          />
          <NumberInput
            label={t('design.props.strokeWidthLabel')}
            value={(object as any).strokeWidth ?? 0}
            onChange={(v) => onUpdate({ strokeWidth: v } as any)}
            min={0}
            max={20}
          />
        </div>
      </Section>
      <ShadowSection shadow={shadow} onUpdate={onUpdate} />
    </>
  );
}

function BadgeProperties({
  object,
  onUpdate,
}: {
  object: DesignObject & { type: 'badge' };
  onUpdate: (changes: Partial<DesignObject>) => void;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <>
      <Section title={t('design.props.badgeText')}>
        <input
          type="text"
          value={object.text}
          onChange={(e) => onUpdate({ text: e.target.value } as any)}
          style={{
            width: '100%',
            padding: '5px 8px',
            borderRadius: 6,
            border: `1px solid ${colors.borderCard}`,
            fontSize: 12,
            color: colors.textDark,
            backgroundColor: colors.appBackground,
            boxSizing: 'border-box',
            marginBottom: 8,
            transition: 'border-color 0.15s, box-shadow 0.15s',
            outline: 'none',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = colors.primary;
            e.target.style.boxShadow = `0 0 0 2px ${colors.primary}22`;
          }}
          onBlur={(e) => {
            e.target.style.borderColor = colors.borderCard;
            e.target.style.boxShadow = 'none';
          }}
        />
        <div style={{ marginBottom: 6 }}>
          <SelectInput
            label={t('design.props.fontFamily')}
            value={object.fontFamily}
            options={FONT_OPTIONS}
            onChange={(v) => onUpdate({ fontFamily: v } as any)}
          />
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <NumberInput
            label={t('design.props.fontSize')}
            value={object.fontSize}
            onChange={(v) => onUpdate({ fontSize: v } as any)}
            min={8}
            max={48}
          />
          <ColorInput
            label={t('design.props.textColor')}
            value={object.textColor}
            onChange={(v) => onUpdate({ textColor: v } as any)}
          />
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
          <SelectInput
            label={t('design.props.weight')}
            value={(object as any).fontWeight ?? ''}
            options={[
              { value: '', label: t('design.props.options.weightAuto') },
              { value: '100', label: t('design.props.options.weight100') },
              { value: '300', label: t('design.props.options.weight300') },
              { value: '400', label: t('design.props.options.weight400') },
              { value: '500', label: t('design.props.options.weight500') },
              { value: '600', label: t('design.props.options.weight600') },
              { value: '700', label: t('design.props.options.weight700') },
              { value: '800', label: t('design.props.options.weight800') },
              { value: '900', label: t('design.props.options.weight900') },
            ]}
            onChange={(v) => onUpdate({ fontWeight: v || undefined } as any)}
          />
          <SelectInput
            label={t('design.props.transform')}
            value={(object as any).textTransform ?? 'none'}
            options={[
              { value: 'none', label: t('design.props.options.none') },
              { value: 'uppercase', label: t('design.props.options.uppercase') },
              { value: 'lowercase', label: t('design.props.options.lowercase') },
              { value: 'capitalize', label: t('design.props.options.capitalize') },
            ]}
            onChange={(v) => onUpdate({ textTransform: v } as any)}
          />
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
          <SelectInput
            label={t('design.props.align')}
            value={object.align ?? 'center'}
            options={[
              { value: 'left', label: t('design.props.options.left') },
              { value: 'center', label: t('design.props.options.center') },
              { value: 'right', label: t('design.props.options.right') },
              { value: 'justify', label: t('design.props.options.justify') },
            ]}
            onChange={(v) => onUpdate({ align: v } as any)}
          />
          <SelectInput
            label={t('design.props.verticalAlign')}
            value={object.verticalAlign ?? 'middle'}
            options={[
              { value: 'top', label: t('design.props.options.top') },
              { value: 'middle', label: t('design.props.options.middle') },
              { value: 'bottom', label: t('design.props.options.bottom') },
            ]}
            onChange={(v) => onUpdate({ verticalAlign: v } as any)}
          />
        </div>
        <div style={{ marginBottom: 6 }}>
          <NumberInput
            label={t('design.props.letterSpacing')}
            value={object.letterSpacing ?? 0}
            onChange={(v) => onUpdate({ letterSpacing: v } as any)}
            min={-5}
            max={50}
            step={0.5}
          />
        </div>
        <TextDecorationInput
          value={object.textDecoration ?? ''}
          onChange={(v) => onUpdate({ textDecoration: v } as any)}
        />
      </Section>

      <Section title={t('design.props.background')}>
        <div style={{ marginBottom: 8 }}>
          <ColorInput
            label={t('design.props.fill')}
            value={object.fill}
            onChange={(fill) => onUpdate({ fill } as any)}
          />
        </div>
        <NumberInput
          label={t('design.props.cornerRadius')}
          value={object.cornerRadius}
          onChange={(v) => onUpdate({ cornerRadius: v } as any)}
          min={0}
          max={100}
        />
      </Section>

      <GradientSection gradient={object.gradient} onUpdate={onUpdate} />
      <ShadowSection shadow={object.shadow} onUpdate={onUpdate} />
    </>
  );
}

// ─── Icon (Ionicons) properties ──────────────────────────────────
const COMMON_ICONS = [
  'star', 'heart', 'school', 'book', 'home', 'person', 'people', 'settings',
  'help-circle', 'information-circle', 'checkmark-circle', 'close-circle',
  'add', 'remove', 'arrow-forward', 'arrow-back', 'chevron-forward', 'chevron-down',
  'mail', 'call', 'chatbubble', 'camera', 'image', 'document-text',
  'sunny', 'moon', 'flower', 'leaf', 'medkit', 'pulse', 'fitness',
  'trophy', 'ribbon', 'flame', 'sparkles', 'lock-closed', 'shield-checkmark',
  'time', 'calendar', 'location', 'map', 'compass', 'globe',
  'bookmark', 'cloud', 'download', 'share', 'search', 'pencil',
];

function IconProperties({
  object,
  onUpdate,
}: {
  object: DesignObject & { type: 'icon' };
  onUpdate: (changes: Partial<DesignObject>) => void;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  return (
    <>
      <Section title={t('design.props.icon')}>
        <label style={{ fontSize: 10, color: colors.textLight, fontWeight: 600, display: 'block', marginBottom: 4, letterSpacing: 0.3 }}>
          {t('design.props.ioniconName')}
        </label>
        <input
          type="text"
          value={object.iconName}
          onChange={(e) => onUpdate({ iconName: e.target.value } as any)}
          placeholder={t('design.props.iconNamePlaceholder')}
          style={{
            width: '100%',
            padding: '6px 8px',
            borderRadius: 6,
            border: `1px solid ${colors.borderCard}`,
            fontSize: 12,
            color: colors.textDark,
            backgroundColor: colors.appBackground,
            boxSizing: 'border-box',
            marginBottom: 8,
            outline: 'none',
            fontFamily: 'monospace',
          }}
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('design.props.filterIcons')}
          style={{
            width: '100%',
            padding: '5px 8px',
            borderRadius: 6,
            border: `1px solid ${colors.borderCard}`,
            fontSize: 11,
            color: colors.textDark,
            backgroundColor: colors.appBackground,
            boxSizing: 'border-box',
            marginBottom: 6,
            outline: 'none',
          }}
        />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: 4,
            maxHeight: 160,
            overflowY: 'auto',
            padding: 4,
            backgroundColor: colors.appBackground,
            borderRadius: 6,
            border: `1px solid ${colors.borderCard}`,
          }}
        >
          {COMMON_ICONS.filter((n) => n.includes(query.toLowerCase())).map((n) => (
            <button
              key={n}
              title={n}
              onClick={() => onUpdate({ iconName: n } as any)}
              style={{
                aspectRatio: '1',
                borderRadius: 4,
                border: object.iconName === n ? `2px solid ${colors.primary}` : `1px solid ${colors.borderCard}`,
                backgroundColor: object.iconName === n ? `${colors.primary}15` : colors.white,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                color: colors.textDark,
                padding: 0,
                fontFamily: 'Ionicons',
              }}
            >
              {(() => {
                const code = (ionGlyphMap as Record<string, number>)[n];
                return code ? String.fromCharCode(code) : '?';
              })()}
            </button>
          ))}
        </div>
      </Section>
      <Section title={t('design.props.style')}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <NumberInput
            label={t('design.props.size')}
            value={object.fontSize}
            onChange={(v) =>
              onUpdate({
                fontSize: v,
                width: v,
                height: v,
              } as any)
            }
            min={8}
            max={400}
          />
        </div>
        <ColorInput
          label={t('design.props.color')}
          value={object.color}
          onChange={(c) => onUpdate({ color: c } as any)}
        />
      </Section>
      <ShadowSection shadow={object.shadow} onUpdate={onUpdate} />
    </>
  );
}
