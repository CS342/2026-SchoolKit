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
          fontSize: 11,
          color: colors.textLight,
          fontWeight: 500,
          display: 'block',
          marginBottom: 3,
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
          padding: '6px 8px',
          borderRadius: 6,
          border: `1px solid ${colors.borderCard}`,
          fontSize: 13,
          color: colors.textDark,
          backgroundColor: colors.appBackground,
          boxSizing: 'border-box',
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
  return (
    <div style={{ flex: 1 }}>
      <label
        style={{
          fontSize: 11,
          color: colors.textLight,
          fontWeight: 500,
          display: 'block',
          marginBottom: 3,
        }}
      >
        {label}
      </label>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 8px',
          borderRadius: 6,
          border: `1px solid ${colors.borderCard}`,
          backgroundColor: colors.appBackground,
        }}
      >
        <input
          type="color"
          value={value || '#000000'}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: 22,
            height: 22,
            padding: 0,
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        />
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="none"
          style={{
            flex: 1,
            border: 'none',
            background: 'none',
            fontSize: 12,
            color: colors.textDark,
            outline: 'none',
            fontFamily: 'monospace',
          }}
        />
      </div>
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
          fontSize: 11,
          color: colors.textLight,
          fontWeight: 500,
          display: 'block',
          marginBottom: 3,
        }}
      >
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '6px 8px',
          borderRadius: 6,
          border: `1px solid ${colors.borderCard}`,
          fontSize: 13,
          color: colors.textDark,
          backgroundColor: colors.appBackground,
        }}
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
        fontSize: 13,
        color: colors.textDark,
        cursor: 'pointer',
      }}
    >
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        style={{ accentColor: colors.primary }}
      />
      {label}
    </label>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: colors.textLight,
          textTransform: 'uppercase',
          letterSpacing: 0.8,
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

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
        width: 260,
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
          borderBottom: `1px solid ${colors.borderCard}`,
        }}
      >
        {(['properties', 'canvas'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '10px 0',
              border: 'none',
              backgroundColor: 'transparent',
              fontSize: 12,
              fontWeight: 600,
              color: activeTab === tab ? colors.primary : colors.textLight,
              borderBottom:
                activeTab === tab ? `2px solid ${colors.primary}` : '2px solid transparent',
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 14,
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
                fontSize: 13,
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
              fontSize: 13,
              textAlign: 'center',
              paddingTop: 40,
            }}
          >
            Select an object to edit its properties
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
          <NumberInput
            label="Opacity"
            value={object.opacity}
            onChange={(opacity) =>
              onUpdate({ opacity: Math.max(0, Math.min(1, opacity)) })
            }
            min={0}
            max={1}
            step={0.1}
          />
        </div>
      </Section>

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
          <div style={{ display: 'flex', gap: 8 }}>
            <ColorInput
              label="Start"
              value={gradient.colors[0] || '#7B68EE'}
              onChange={(c) => {
                const colors = [...gradient.colors];
                colors[0] = c;
                onUpdate({ gradient: { ...gradient, colors } } as any);
              }}
            />
            <ColorInput
              label="End"
              value={gradient.colors[1] || '#0EA5E9'}
              onChange={(c) => {
                const colors = [...gradient.colors];
                colors[1] = c;
                onUpdate({ gradient: { ...gradient, colors } } as any);
              }}
            />
          </div>
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

  return (
    <>
      <Section title="Fill & Stroke">
        <div style={{ marginBottom: 8 }}>
          <ColorInput
            label="Fill"
            value={object.fill}
            onChange={(fill) => onUpdate({ fill } as Partial<DesignObject>)}
          />
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
            minHeight: 60,
            padding: '8px',
            borderRadius: 6,
            border: `1px solid ${colors.borderCard}`,
            fontSize: 13,
            color: colors.textDark,
            backgroundColor: colors.appBackground,
            resize: 'vertical',
            fontFamily: 'inherit',
            boxSizing: 'border-box',
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
            padding: '6px 8px',
            borderRadius: 6,
            border: `1px solid ${colors.borderCard}`,
            fontSize: 13,
            color: colors.textDark,
            backgroundColor: colors.appBackground,
            boxSizing: 'border-box',
            marginBottom: 8,
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
