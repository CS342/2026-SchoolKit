import React, { useState } from 'react';
import { useEditorStore } from '../store/editor-store';
import { useTheme } from '../../../contexts/ThemeContext';
import type { DesignObject, InteractiveComponentObject } from '../types/document';
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

  // In component editing mode, find child from the editing component
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
    </>
  );
}

function ShapeProperties({
  object,
  onUpdate,
}: {
  object: DesignObject & { fill: string; stroke: string; strokeWidth: number };
  onUpdate: (changes: Partial<DesignObject>) => void;
}) {
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
            options={[
              { value: 'Arial', label: 'Arial' },
              { value: 'Helvetica', label: 'Helvetica' },
              { value: 'Times New Roman', label: 'Times New Roman' },
              { value: 'Georgia', label: 'Georgia' },
              { value: 'Courier New', label: 'Courier New' },
              { value: 'Verdana', label: 'Verdana' },
              { value: 'Impact', label: 'Impact' },
            ]}
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
        <div style={{ display: 'flex', gap: 8 }}>
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
            ]}
            onChange={(align) =>
              onUpdate({ align } as Partial<DesignObject>)
            }
          />
        </div>
      </Section>

      <Section title="Color">
        <ColorInput
          label="Text Color"
          value={object.fill}
          onChange={(fill) => onUpdate({ fill } as Partial<DesignObject>)}
        />
      </Section>
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
  );
}
