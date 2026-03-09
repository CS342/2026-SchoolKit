import React, { useState } from 'react';
import { useEditorStore } from '../store/editor-store';
import { useTheme } from '../../../contexts/ThemeContext';
import type { DesignObject, InteractiveComponentObject, GradientConfig, ShadowConfig, StrokeDashPreset } from '../types/document';
import { InteractiveProperties } from './InteractiveProperties';
import { AlignmentToolbar } from './AlignmentToolbar';

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
          placeholder="none"
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
          title="Color presets"
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

// ─── Color presets ────────────────────────────────────────────
const COLOR_PRESETS = [
  '#7B68EE', '#5B4BC7', '#0EA5E9', '#22C55E', '#F59E0B', '#EC4899',
  '#EF4444', '#6366F1', '#2D2D44', '#6B6B85', '#8E8EA8', '#FFFFFF',
  '#F0EBFF', '#FBF9FF', '#B5EAD7', '#FFDAC1', '#C7CEEA', '#FFB7B2',
];

// ─── Shared font options ──────────────────────────────────────
const FONT_OPTIONS = [
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

// ─── Text Decoration Input ────────────────────────────────────
function TextDecorationInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
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
        label="Underline"
        value={hasUnderline}
        onChange={(on) => toggle('underline', on)}
      />
      <CheckboxInput
        label="Strikethrough"
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
  return (
    <Section title="Stroke Style">
      <div style={{ marginBottom: 6 }}>
        <SelectInput
          label="Dash Pattern"
          value={dash ?? 'solid'}
          options={[
            { value: 'solid', label: 'Solid' },
            { value: 'dashed', label: 'Dashed' },
            { value: 'dotted', label: 'Dotted' },
            { value: 'dash-dot', label: 'Dash-Dot' },
          ]}
          onChange={(v) => onUpdate({ dash: v } as any)}
        />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <SelectInput
          label="Line Cap"
          value={lineCap ?? 'butt'}
          options={[
            { value: 'butt', label: 'Butt' },
            { value: 'round', label: 'Round' },
            { value: 'square', label: 'Square' },
          ]}
          onChange={(v) => onUpdate({ lineCap: v } as any)}
        />
        <SelectInput
          label="Line Join"
          value={lineJoin ?? 'miter'}
          options={[
            { value: 'miter', label: 'Miter' },
            { value: 'round', label: 'Round' },
            { value: 'bevel', label: 'Bevel' },
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
            {tab === 'properties' ? 'Design' : 'Canvas'}
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
              {selectedIds.length} objects selected
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
            Select an object to edit
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
  const gradient = canvas.backgroundGradient;

  return (
    <>
      <Section title="Canvas Size">
        <div style={{ display: 'flex', gap: 8 }}>
          <NumberInput
            label="Width"
            value={canvas.width}
            onChange={(w) => setCanvasSize(w, canvas.height)}
            min={100}
            max={5000}
          />
          <NumberInput
            label="Height"
            value={canvas.height}
            onChange={(h) => setCanvasSize(canvas.width, h)}
            min={100}
            max={5000}
          />
        </div>
      </Section>
      <Section title="Background">
        <ColorInput
          label="Color"
          value={canvas.background}
          onChange={setCanvasBackground}
        />
      </Section>
      <Section title="Background Gradient">
        <div style={{ marginBottom: 8 }}>
          <CheckboxInput
            label="Enable gradient"
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
                label="Type"
                value={gradient.type}
                options={[
                  { value: 'linear', label: 'Linear' },
                  { value: 'radial', label: 'Radial' },
                ]}
                onChange={(v) => setCanvasGradient({ ...gradient, type: v as 'linear' | 'radial' })}
              />
              {gradient.type === 'linear' && (
                <NumberInput
                  label="Angle"
                  value={gradient.angle ?? 0}
                  onChange={(v) => setCanvasGradient({ ...gradient, angle: v })}
                  min={0}
                  max={360}
                />
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <ColorInput
                label="Start"
                value={gradient.colors[0] || '#7B68EE'}
                onChange={(c) => {
                  const colors = [...gradient.colors];
                  colors[0] = c;
                  setCanvasGradient({ ...gradient, colors });
                }}
              />
              <ColorInput
                label="End"
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
  return (
    <>
      {/* Position & Size - all objects */}
      <Section title="Position & Size">
        <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
          <NumberInput
            label="X"
            value={object.x}
            onChange={(x) => onUpdate({ x })}
          />
          <NumberInput
            label="Y"
            value={object.y}
            onChange={(y) => onUpdate({ y })}
          />
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
          <NumberInput
            label="W"
            value={object.width}
            onChange={(width) => onUpdate({ width })}
            min={1}
          />
          <NumberInput
            label="H"
            value={object.height}
            onChange={(height) => onUpdate({ height })}
            min={1}
          />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <NumberInput
            label="Rotation"
            value={object.rotation}
            onChange={(rotation) => onUpdate({ rotation })}
            min={-360}
            max={360}
          />
          <RangeInput
            label="Opacity"
            value={object.opacity}
            onChange={(opacity) => onUpdate({ opacity })}
          />
        </div>
      </Section>

      {/* Accessibility & Blend Mode */}
      <Section title="Accessibility">
        <TextInput
          label="A11y Label"
          value={(object as any).accessibilityLabel ?? ''}
          onChange={(v) => onUpdate({ accessibilityLabel: v || undefined } as any)}
          placeholder="Screen reader label..."
        />
      </Section>

      {object.type !== 'line' && object.type !== 'arrow' && (
        <Section title="Blend Mode">
          <SelectInput
            label="Mode"
            value={(object as any).blendMode ?? 'normal'}
            options={[
              { value: 'normal', label: 'Normal' },
              { value: 'multiply', label: 'Multiply' },
              { value: 'screen', label: 'Screen' },
              { value: 'overlay', label: 'Overlay' },
              { value: 'darken', label: 'Darken' },
              { value: 'lighten', label: 'Lighten' },
            ]}
            onChange={(v) => onUpdate({ blendMode: v === 'normal' ? undefined : v } as any)}
          />
        </Section>
      )}

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
  const enabled = !!gradient;
  return (
    <Section title="Gradient">
      <div style={{ marginBottom: 8 }}>
        <CheckboxInput
          label="Enable gradient"
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
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <SelectInput
              label="Type"
              value={gradient.type}
              options={[
                { value: 'linear', label: 'Linear' },
                { value: 'radial', label: 'Radial' },
              ]}
              onChange={(v) => onUpdate({ gradient: { ...gradient, type: v as 'linear' | 'radial' } } as any)}
            />
            {gradient.type === 'linear' && (
              <NumberInput
                label="Angle"
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
                label={i === 0 ? 'Start' : i === gradient.colors.length - 1 ? 'End' : `Stop ${i + 1}`}
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
              + Add Stop
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
  const enabled = !!shadow;
  return (
    <Section title="Shadow">
      <div style={{ marginBottom: 8 }}>
        <CheckboxInput
          label="Enable shadow"
          value={enabled}
          onChange={(on) => {
            if (on) {
              onUpdate({ shadow: { color: 'rgba(0,0,0,0.25)', offsetX: 0, offsetY: 4, blur: 12 } } as any);
            } else {
              onUpdate({ shadow: null } as any);
            }
          }}
        />
      </div>
      {enabled && shadow && (
        <>
          <div style={{ marginBottom: 8 }}>
            <ColorInput
              label="Color"
              value={shadow.color}
              onChange={(c) => onUpdate({ shadow: { ...shadow, color: c } } as any)}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <NumberInput
              label="Offset X"
              value={shadow.offsetX}
              onChange={(v) => onUpdate({ shadow: { ...shadow, offsetX: v } } as any)}
              min={-50}
              max={50}
            />
            <NumberInput
              label="Offset Y"
              value={shadow.offsetY}
              onChange={(v) => onUpdate({ shadow: { ...shadow, offsetY: v } } as any)}
              min={-50}
              max={50}
            />
          </div>
          <NumberInput
            label="Blur"
            value={shadow.blur}
            onChange={(v) => onUpdate({ shadow: { ...shadow, blur: v } } as any)}
            min={0}
            max={50}
          />
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
  return (
    <Section title="Blur">
      <NumberInput
        label="Blur Radius"
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

  return (
    <>
      <Section title="Fill & Stroke">
        <div style={{ marginBottom: 8, opacity: gradient ? 0.5 : 1, position: 'relative' }}>
          <ColorInput
            label="Fill"
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
              Overridden by gradient
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <ColorInput
            label="Stroke"
            value={object.stroke}
            onChange={(stroke) =>
              onUpdate({ stroke } as Partial<DesignObject>)
            }
          />
          <NumberInput
            label="Width"
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
        <Section title="Corner Radius">
          <NumberInput
            label="Radius"
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
  const shadow = (object as any).shadow as ShadowConfig | null | undefined;
  return (
    <>
      <Section title="Text">
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

      <Section title="Font">
        <div style={{ marginBottom: 6 }}>
          <SelectInput
            label="Family"
            value={object.fontFamily}
            options={FONT_OPTIONS}
            onChange={(fontFamily) =>
              onUpdate({ fontFamily } as Partial<DesignObject>)
            }
          />
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
          <NumberInput
            label="Size"
            value={object.fontSize}
            onChange={(fontSize) =>
              onUpdate({ fontSize } as Partial<DesignObject>)
            }
            min={8}
            max={200}
          />
          <NumberInput
            label="Line Height"
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
            label="Style"
            value={object.fontStyle}
            options={[
              { value: 'normal', label: 'Normal' },
              { value: 'bold', label: 'Bold' },
              { value: 'italic', label: 'Italic' },
              { value: 'bold italic', label: 'Bold Italic' },
            ]}
            onChange={(fontStyle) =>
              onUpdate({ fontStyle } as Partial<DesignObject>)
            }
          />
          <SelectInput
            label="Weight"
            value={(object as any).fontWeight ?? ''}
            options={[
              { value: '', label: 'Auto' },
              { value: '100', label: '100 Thin' },
              { value: '200', label: '200 Extra Light' },
              { value: '300', label: '300 Light' },
              { value: '400', label: '400 Regular' },
              { value: '500', label: '500 Medium' },
              { value: '600', label: '600 Semi Bold' },
              { value: '700', label: '700 Bold' },
              { value: '800', label: '800 Extra Bold' },
              { value: '900', label: '900 Black' },
            ]}
            onChange={(v) => onUpdate({ fontWeight: v || undefined } as any)}
          />
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
          <SelectInput
            label="Align"
            value={object.align}
            options={[
              { value: 'left', label: 'Left' },
              { value: 'center', label: 'Center' },
              { value: 'right', label: 'Right' },
              { value: 'justify', label: 'Justify' },
            ]}
            onChange={(align) =>
              onUpdate({ align } as Partial<DesignObject>)
            }
          />
          <SelectInput
            label="Transform"
            value={(object as any).textTransform ?? 'none'}
            options={[
              { value: 'none', label: 'None' },
              { value: 'uppercase', label: 'UPPERCASE' },
              { value: 'lowercase', label: 'lowercase' },
              { value: 'capitalize', label: 'Capitalize' },
            ]}
            onChange={(v) => onUpdate({ textTransform: v } as any)}
          />
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
          <NumberInput
            label="Letter Spacing"
            value={object.letterSpacing ?? 0}
            onChange={(v) => onUpdate({ letterSpacing: v } as any)}
            min={-5}
            max={50}
            step={0.5}
          />
          <NumberInput
            label="Padding"
            value={object.padding ?? 0}
            onChange={(v) => onUpdate({ padding: v } as any)}
            min={0}
            max={100}
          />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <SelectInput
            label="Vertical Align"
            value={object.verticalAlign ?? 'top'}
            options={[
              { value: 'top', label: 'Top' },
              { value: 'middle', label: 'Middle' },
              { value: 'bottom', label: 'Bottom' },
            ]}
            onChange={(v) => onUpdate({ verticalAlign: v } as any)}
          />
          <SelectInput
            label="Font Variant"
            value={object.fontVariant ?? 'normal'}
            options={[
              { value: 'normal', label: 'Normal' },
              { value: 'small-caps', label: 'Small Caps' },
            ]}
            onChange={(v) => onUpdate({ fontVariant: v } as any)}
          />
        </div>
      </Section>

      <Section title="Text Decoration">
        <TextDecorationInput
          value={object.textDecoration ?? ''}
          onChange={(v) => onUpdate({ textDecoration: v } as any)}
        />
      </Section>

      <Section title="Color">
        <ColorInput
          label="Text Color"
          value={object.fill}
          onChange={(fill) => onUpdate({ fill } as Partial<DesignObject>)}
        />
      </Section>

      <Section title="Text Outline">
        <div style={{ display: 'flex', gap: 8 }}>
          <ColorInput
            label="Outline Color"
            value={object.stroke ?? ''}
            onChange={(v) => onUpdate({ stroke: v } as any)}
          />
          <NumberInput
            label="Outline Width"
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
  return (
    <>
      <Section title="Line">
        <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
          <ColorInput
            label="Stroke"
            value={object.stroke}
            onChange={(stroke) =>
              onUpdate({ stroke } as Partial<DesignObject>)
            }
          />
          <NumberInput
            label="Width"
            value={object.strokeWidth}
            onChange={(strokeWidth) =>
              onUpdate({ strokeWidth } as Partial<DesignObject>)
            }
            min={1}
            max={20}
          />
        </div>
      </Section>

      <Section title="Stroke Style">
        <div style={{ marginBottom: 6 }}>
          <SelectInput
            label="Dash Pattern"
            value={object.dash ?? 'solid'}
            options={[
              { value: 'solid', label: 'Solid' },
              { value: 'dashed', label: 'Dashed' },
              { value: 'dotted', label: 'Dotted' },
              { value: 'dash-dot', label: 'Dash-Dot' },
            ]}
            onChange={(v) => onUpdate({ dash: v } as any)}
          />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <SelectInput
            label="Line Cap"
            value={object.lineCap}
            options={[
              { value: 'butt', label: 'Butt' },
              { value: 'round', label: 'Round' },
              { value: 'square', label: 'Square' },
            ]}
            onChange={(v) => onUpdate({ lineCap: v } as any)}
          />
          <SelectInput
            label="Line Join"
            value={object.lineJoin}
            options={[
              { value: 'miter', label: 'Miter' },
              { value: 'round', label: 'Round' },
              { value: 'bevel', label: 'Bevel' },
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
  return (
    <>
      <Section title="Star">
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <NumberInput
            label="Points"
            value={object.points}
            onChange={(v) => onUpdate({ points: Math.max(3, Math.min(12, Math.round(v))) } as any)}
            min={3}
            max={12}
          />
          <NumberInput
            label="Inner Radius"
            value={object.innerRadius}
            onChange={(v) => onUpdate({ innerRadius: Math.max(0.3, Math.min(0.9, v)) } as any)}
            min={0.3}
            max={0.9}
            step={0.05}
          />
        </div>
      </Section>

      <Section title="Fill & Stroke">
        <div style={{ marginBottom: 8 }}>
          <ColorInput
            label="Fill"
            value={object.fill}
            onChange={(fill) => onUpdate({ fill } as any)}
          />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <ColorInput
            label="Stroke"
            value={object.stroke}
            onChange={(stroke) => onUpdate({ stroke } as any)}
          />
          <NumberInput
            label="Width"
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
  return (
    <>
      <Section title="Fill & Stroke">
        <div style={{ marginBottom: 8 }}>
          <ColorInput
            label="Fill"
            value={object.fill}
            onChange={(fill) => onUpdate({ fill } as any)}
          />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <ColorInput
            label="Stroke"
            value={object.stroke}
            onChange={(stroke) => onUpdate({ stroke } as any)}
          />
          <NumberInput
            label="Width"
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
  return (
    <>
      <Section title="Arrow">
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <ColorInput
            label="Stroke"
            value={object.stroke}
            onChange={(stroke) => onUpdate({ stroke } as any)}
          />
          <NumberInput
            label="Width"
            value={object.strokeWidth}
            onChange={(strokeWidth) => onUpdate({ strokeWidth } as any)}
            min={1}
            max={20}
          />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <NumberInput
            label="Pointer Length"
            value={object.pointerLength}
            onChange={(v) => onUpdate({ pointerLength: v } as any)}
            min={5}
            max={50}
          />
          <NumberInput
            label="Pointer Width"
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
  return (
    <>
      <Section title="Image Style">
        <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
          <NumberInput
            label="Corner Radius"
            value={(object as any).cornerRadius ?? 0}
            onChange={(v) => onUpdate({ cornerRadius: v } as any)}
            min={0}
            max={200}
          />
          <SelectInput
            label="Object Fit"
            value={(object as any).objectFit ?? 'cover'}
            options={[
              { value: 'cover', label: 'Cover' },
              { value: 'contain', label: 'Contain' },
              { value: 'fill', label: 'Fill' },
            ]}
            onChange={(v) => onUpdate({ objectFit: v } as any)}
          />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <ColorInput
            label="Stroke"
            value={(object as any).stroke ?? ''}
            onChange={(v) => onUpdate({ stroke: v } as any)}
          />
          <NumberInput
            label="Stroke Width"
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
  return (
    <>
      <Section title="Badge Text">
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
            label="Font Family"
            value={object.fontFamily}
            options={FONT_OPTIONS}
            onChange={(v) => onUpdate({ fontFamily: v } as any)}
          />
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <NumberInput
            label="Font Size"
            value={object.fontSize}
            onChange={(v) => onUpdate({ fontSize: v } as any)}
            min={8}
            max={48}
          />
          <ColorInput
            label="Text Color"
            value={object.textColor}
            onChange={(v) => onUpdate({ textColor: v } as any)}
          />
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
          <SelectInput
            label="Weight"
            value={(object as any).fontWeight ?? ''}
            options={[
              { value: '', label: 'Auto' },
              { value: '100', label: '100 Thin' },
              { value: '300', label: '300 Light' },
              { value: '400', label: '400 Regular' },
              { value: '500', label: '500 Medium' },
              { value: '600', label: '600 Semi Bold' },
              { value: '700', label: '700 Bold' },
              { value: '800', label: '800 Extra Bold' },
              { value: '900', label: '900 Black' },
            ]}
            onChange={(v) => onUpdate({ fontWeight: v || undefined } as any)}
          />
          <SelectInput
            label="Transform"
            value={(object as any).textTransform ?? 'none'}
            options={[
              { value: 'none', label: 'None' },
              { value: 'uppercase', label: 'UPPERCASE' },
              { value: 'lowercase', label: 'lowercase' },
              { value: 'capitalize', label: 'Capitalize' },
            ]}
            onChange={(v) => onUpdate({ textTransform: v } as any)}
          />
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
          <SelectInput
            label="Align"
            value={object.align ?? 'center'}
            options={[
              { value: 'left', label: 'Left' },
              { value: 'center', label: 'Center' },
              { value: 'right', label: 'Right' },
              { value: 'justify', label: 'Justify' },
            ]}
            onChange={(v) => onUpdate({ align: v } as any)}
          />
          <SelectInput
            label="Vertical Align"
            value={object.verticalAlign ?? 'middle'}
            options={[
              { value: 'top', label: 'Top' },
              { value: 'middle', label: 'Middle' },
              { value: 'bottom', label: 'Bottom' },
            ]}
            onChange={(v) => onUpdate({ verticalAlign: v } as any)}
          />
        </div>
        <div style={{ marginBottom: 6 }}>
          <NumberInput
            label="Letter Spacing"
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

      <Section title="Background">
        <div style={{ marginBottom: 8 }}>
          <ColorInput
            label="Fill"
            value={object.fill}
            onChange={(fill) => onUpdate({ fill } as any)}
          />
        </div>
        <NumberInput
          label="Corner Radius"
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
