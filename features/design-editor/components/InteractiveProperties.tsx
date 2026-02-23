import React from 'react';
import { useEditorStore } from '../store/editor-store';
import { useTheme } from '../../../contexts/ThemeContext';
import type {
  InteractiveComponentObject,
  FlipCardConfig,
  BottomSheetConfig,
  ExpandableConfig,
  EntranceConfig,
  CarouselConfig,
  TabsConfig,
  QuizConfig,
} from '../types/document';

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

export function InteractiveProperties({
  object,
}: {
  object: InteractiveComponentObject;
}) {
  const updateInteractionConfig = useEditorStore((s) => s.updateInteractionConfig);
  const enterComponent = useEditorStore((s) => s.enterComponent);
  const { colors } = useTheme();

  const update = (changes: Record<string, unknown>) => {
    updateInteractionConfig(object.id, changes as any);
  };

  return (
    <>
      <Section title="Component">
        <div
          style={{
            padding: '8px 12px',
            backgroundColor: colors.backgroundLight,
            borderRadius: 8,
            fontSize: 13,
            color: colors.textDark,
            fontWeight: 600,
            marginBottom: 8,
          }}
        >
          {getTypeLabel(object.interactionType)}
        </div>
        <button
          onClick={() => {
            const firstGroup = object.groups[0];
            if (firstGroup) enterComponent(object.id, firstGroup.role);
          }}
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: 8,
            border: `1px solid ${colors.primary}`,
            backgroundColor: 'transparent',
            color: colors.primary,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Edit Contents
        </button>
      </Section>

      <Section title="Groups">
        {object.groups.map((group) => (
          <div
            key={group.role}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '6px 0',
              fontSize: 13,
              color: colors.textDark,
            }}
          >
            <span>{group.label}</span>
            <span style={{ fontSize: 11, color: colors.textLight }}>
              {group.objectIds.length} objects
            </span>
          </div>
        ))}
      </Section>

      {object.interactionType === 'flip-card' && (
        <FlipCardProperties
          config={object.interactionConfig as FlipCardConfig}
          onUpdate={update}
        />
      )}

      {object.interactionType === 'bottom-sheet' && (
        <BottomSheetProperties
          config={object.interactionConfig as BottomSheetConfig}
          onUpdate={update}
        />
      )}

      {object.interactionType === 'expandable' && (
        <ExpandableProperties
          config={object.interactionConfig as ExpandableConfig}
          onUpdate={update}
        />
      )}

      {object.interactionType === 'entrance' && (
        <EntranceProperties
          config={object.interactionConfig as EntranceConfig}
          onUpdate={update}
        />
      )}

      {object.interactionType === 'carousel' && (
        <CarouselProperties
          config={object.interactionConfig as CarouselConfig}
          onUpdate={update}
        />
      )}

      {object.interactionType === 'tabs' && (
        <TabsProperties
          config={object.interactionConfig as TabsConfig}
          onUpdate={update}
        />
      )}

      {object.interactionType === 'quiz' && (
        <QuizProperties
          config={object.interactionConfig as QuizConfig}
          onUpdate={update}
        />
      )}
    </>
  );
}

function FlipCardProperties({
  config,
  onUpdate,
}: {
  config: FlipCardConfig;
  onUpdate: (c: Record<string, unknown>) => void;
}) {
  return (
    <Section title="Flip Settings">
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <NumberInput
          label="Duration (ms)"
          value={config.flipDuration}
          onChange={(v) => onUpdate({ flipDuration: v })}
          min={100}
          max={2000}
          step={50}
        />
        <SelectInput
          label="Direction"
          value={config.flipDirection}
          options={[
            { value: 'horizontal', label: 'Horizontal' },
            { value: 'vertical', label: 'Vertical' },
          ]}
          onChange={(v) => onUpdate({ flipDirection: v })}
        />
      </div>
      <SelectInput
        label="Default Side"
        value={config.defaultSide}
        options={[
          { value: 'front', label: 'Front' },
          { value: 'back', label: 'Back' },
        ]}
        onChange={(v) => onUpdate({ defaultSide: v })}
      />
    </Section>
  );
}

function BottomSheetProperties({
  config,
  onUpdate,
}: {
  config: BottomSheetConfig;
  onUpdate: (c: Record<string, unknown>) => void;
}) {
  return (
    <Section title="Sheet Settings">
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <NumberInput
          label="Height %"
          value={config.sheetHeightPercent}
          onChange={(v) => onUpdate({ sheetHeightPercent: v })}
          min={20}
          max={100}
        />
        <NumberInput
          label="Duration (ms)"
          value={config.slideDuration}
          onChange={(v) => onUpdate({ slideDuration: v })}
          min={100}
          max={1000}
          step={50}
        />
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <NumberInput
          label="Backdrop Opacity"
          value={config.backdropOpacity}
          onChange={(v) => onUpdate({ backdropOpacity: Math.max(0, Math.min(1, v)) })}
          min={0}
          max={1}
          step={0.1}
        />
      </div>
      <CheckboxInput
        label="Dismiss on backdrop tap"
        value={config.dismissOnBackdropTap}
        onChange={(v) => onUpdate({ dismissOnBackdropTap: v })}
      />
    </Section>
  );
}

function ExpandableProperties({
  config,
  onUpdate,
}: {
  config: ExpandableConfig;
  onUpdate: (c: Record<string, unknown>) => void;
}) {
  return (
    <Section title="Expand Settings">
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <NumberInput
          label="Duration (ms)"
          value={config.expandDuration}
          onChange={(v) => onUpdate({ expandDuration: v })}
          min={100}
          max={1000}
          step={50}
        />
        <SelectInput
          label="Easing"
          value={config.easing}
          options={[
            { value: 'ease', label: 'Ease' },
            { value: 'ease-in', label: 'Ease In' },
            { value: 'ease-out', label: 'Ease Out' },
            { value: 'ease-in-out', label: 'Ease In-Out' },
            { value: 'linear', label: 'Linear' },
          ]}
          onChange={(v) => onUpdate({ easing: v })}
        />
      </div>
      <CheckboxInput
        label="Default expanded"
        value={config.defaultExpanded}
        onChange={(v) => onUpdate({ defaultExpanded: v })}
      />
    </Section>
  );
}

function EntranceProperties({
  config,
  onUpdate,
}: {
  config: EntranceConfig;
  onUpdate: (c: Record<string, unknown>) => void;
}) {
  return (
    <Section title="Entrance Settings">
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <SelectInput
          label="Animation"
          value={config.animation}
          options={[
            { value: 'fade-in', label: 'Fade In' },
            { value: 'slide-up', label: 'Slide Up' },
            { value: 'scale-up', label: 'Scale Up' },
            { value: 'bounce', label: 'Bounce' },
          ]}
          onChange={(v) => onUpdate({ animation: v })}
        />
        <SelectInput
          label="Trigger"
          value={config.trigger}
          options={[
            { value: 'on-load', label: 'On Load' },
            { value: 'on-scroll', label: 'On Scroll' },
          ]}
          onChange={(v) => onUpdate({ trigger: v })}
        />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <NumberInput
          label="Duration (ms)"
          value={config.duration}
          onChange={(v) => onUpdate({ duration: v })}
          min={100}
          max={2000}
          step={50}
        />
        <NumberInput
          label="Stagger (ms)"
          value={config.staggerDelay}
          onChange={(v) => onUpdate({ staggerDelay: v })}
          min={0}
          max={500}
          step={25}
        />
      </div>
    </Section>
  );
}

// ─── New interactive type properties ────────────────────────

function CarouselProperties({
  config,
  onUpdate,
}: {
  config: CarouselConfig;
  onUpdate: (c: Record<string, unknown>) => void;
}) {
  return (
    <Section title="Carousel Settings">
      <div style={{ marginBottom: 8 }}>
        <CheckboxInput
          label="Auto-play"
          value={config.autoPlay}
          onChange={(v) => onUpdate({ autoPlay: v })}
        />
      </div>
      {config.autoPlay && (
        <div style={{ marginBottom: 8 }}>
          <NumberInput
            label="Interval (ms)"
            value={config.autoPlayInterval}
            onChange={(v) => onUpdate({ autoPlayInterval: v })}
            min={1000}
            max={10000}
            step={500}
          />
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <CheckboxInput
          label="Show dots"
          value={config.showDots}
          onChange={(v) => onUpdate({ showDots: v })}
        />
        <CheckboxInput
          label="Show arrows"
          value={config.showArrows}
          onChange={(v) => onUpdate({ showArrows: v })}
        />
      </div>
      <NumberInput
        label="Transition (ms)"
        value={config.transitionDuration}
        onChange={(v) => onUpdate({ transitionDuration: v })}
        min={100}
        max={1000}
        step={50}
      />
    </Section>
  );
}

function TabsProperties({
  config,
  onUpdate,
}: {
  config: TabsConfig;
  onUpdate: (c: Record<string, unknown>) => void;
}) {
  return (
    <Section title="Tabs Settings">
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <NumberInput
          label="Default Tab"
          value={config.defaultTab}
          onChange={(v) => onUpdate({ defaultTab: Math.max(0, Math.round(v)) })}
          min={0}
          max={10}
        />
        <SelectInput
          label="Position"
          value={config.tabPosition}
          options={[
            { value: 'top', label: 'Top' },
            { value: 'bottom', label: 'Bottom' },
          ]}
          onChange={(v) => onUpdate({ tabPosition: v })}
        />
      </div>
      <SelectInput
        label="Tab Style"
        value={config.tabStyle}
        options={[
          { value: 'underline', label: 'Underline' },
          { value: 'pill', label: 'Pill' },
          { value: 'boxed', label: 'Boxed' },
        ]}
        onChange={(v) => onUpdate({ tabStyle: v })}
      />
    </Section>
  );
}

function QuizProperties({
  config,
  onUpdate,
}: {
  config: QuizConfig;
  onUpdate: (c: Record<string, unknown>) => void;
}) {
  const { colors } = useTheme();
  return (
    <Section title="Quiz Settings">
      <div style={{ marginBottom: 8 }}>
        <label style={{ fontSize: 11, color: colors.textLight, fontWeight: 500, display: 'block', marginBottom: 3 }}>
          Question
        </label>
        <textarea
          value={config.questionText}
          onChange={(e) => onUpdate({ questionText: e.target.value })}
          style={{
            width: '100%',
            minHeight: 50,
            padding: '6px 8px',
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
      </div>

      <div style={{ marginBottom: 8 }}>
        <label style={{ fontSize: 11, color: colors.textLight, fontWeight: 500, display: 'block', marginBottom: 3 }}>
          Options
        </label>
        {config.options.map((opt, i) => (
          <div key={i} style={{ display: 'flex', gap: 4, marginBottom: 4, alignItems: 'center' }}>
            <input
              type="radio"
              name="correctAnswer"
              checked={config.correctIndex === i}
              onChange={() => onUpdate({ correctIndex: i })}
              style={{ accentColor: colors.primary }}
              title="Mark as correct"
            />
            <input
              type="text"
              value={opt}
              onChange={(e) => {
                const newOptions = [...config.options];
                newOptions[i] = e.target.value;
                onUpdate({ options: newOptions });
              }}
              style={{
                flex: 1,
                padding: '4px 8px',
                borderRadius: 6,
                border: `1px solid ${colors.borderCard}`,
                fontSize: 13,
                color: colors.textDark,
                backgroundColor: colors.appBackground,
              }}
            />
            {config.options.length > 2 && (
              <button
                onClick={() => {
                  const newOptions = config.options.filter((_, idx) => idx !== i);
                  const newCorrect = config.correctIndex >= i && config.correctIndex > 0
                    ? config.correctIndex - 1
                    : config.correctIndex;
                  onUpdate({ options: newOptions, correctIndex: Math.min(newCorrect, newOptions.length - 1) });
                }}
                style={{
                  border: 'none',
                  background: 'none',
                  color: colors.textLight,
                  cursor: 'pointer',
                  fontSize: 16,
                  padding: '0 4px',
                }}
              >
                ×
              </button>
            )}
          </div>
        ))}
        {config.options.length < 6 && (
          <button
            onClick={() => onUpdate({ options: [...config.options, `Option ${config.options.length + 1}`] })}
            style={{
              border: `1px dashed ${colors.borderCard}`,
              background: 'none',
              color: colors.textLight,
              cursor: 'pointer',
              fontSize: 12,
              padding: '4px 8px',
              borderRadius: 6,
              width: '100%',
            }}
          >
            + Add option
          </button>
        )}
      </div>

      <div style={{ marginBottom: 8 }}>
        <CheckboxInput
          label="Show feedback"
          value={config.showFeedback}
          onChange={(v) => onUpdate({ showFeedback: v })}
        />
      </div>

      {config.showFeedback && (
        <>
          <div style={{ marginBottom: 4 }}>
            <label style={{ fontSize: 11, color: colors.textLight, fontWeight: 500, display: 'block', marginBottom: 3 }}>
              Correct Feedback
            </label>
            <input
              type="text"
              value={config.feedbackCorrect}
              onChange={(e) => onUpdate({ feedbackCorrect: e.target.value })}
              style={{
                width: '100%',
                padding: '4px 8px',
                borderRadius: 6,
                border: `1px solid ${colors.borderCard}`,
                fontSize: 13,
                color: colors.textDark,
                backgroundColor: colors.appBackground,
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, color: colors.textLight, fontWeight: 500, display: 'block', marginBottom: 3 }}>
              Incorrect Feedback
            </label>
            <input
              type="text"
              value={config.feedbackIncorrect}
              onChange={(e) => onUpdate({ feedbackIncorrect: e.target.value })}
              style={{
                width: '100%',
                padding: '4px 8px',
                borderRadius: 6,
                border: `1px solid ${colors.borderCard}`,
                fontSize: 13,
                color: colors.textDark,
                backgroundColor: colors.appBackground,
                boxSizing: 'border-box',
              }}
            />
          </div>
        </>
      )}
    </Section>
  );
}

function getTypeLabel(type: string): string {
  switch (type) {
    case 'flip-card': return 'Flip Card';
    case 'bottom-sheet': return 'Bottom Sheet';
    case 'expandable': return 'Expandable';
    case 'entrance': return 'Entrance Animation';
    case 'carousel': return 'Carousel';
    case 'tabs': return 'Tabs';
    case 'quiz': return 'Quiz';
    default: return 'Interactive';
  }
}
