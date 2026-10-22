import React from 'react';
import { useTranslation } from 'react-i18next';
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

function ColorInputInline({
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
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <input
          type="color"
          value={value.startsWith('#') ? value : '#7B68EE'}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: 28, height: 28, border: 'none', padding: 0, cursor: 'pointer' }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            flex: 1,
            padding: '4px 6px',
            borderRadius: 6,
            border: `1px solid ${colors.borderCard}`,
            fontSize: 11,
            color: colors.textDark,
            backgroundColor: colors.appBackground,
            boxSizing: 'border-box',
          }}
        />
      </div>
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
  const { t } = useTranslation();

  const update = (changes: Record<string, unknown>) => {
    updateInteractionConfig(object.id, changes as any);
  };

  const itemsNoun =
    object.interactionType === 'carousel'
      ? t('design.interactive.nouns.slides')
      : object.interactionType === 'tabs'
      ? t('design.interactive.nouns.tabs')
      : t('design.interactive.nouns.sheets');

  return (
    <>
      <Section title={t('design.interactive.component')}>
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
          {getTypeLabel(object.interactionType, t)}
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
          {t('design.interactive.editContents')}
        </button>
      </Section>

      <Section title={t('design.interactive.groups', { count: object.groups.length })}>
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
              {t(
                group.objectIds.length === 1
                  ? 'design.interactive.objectsCountOne'
                  : 'design.interactive.objectsCountOther',
                { count: group.objectIds.length },
              )}
            </span>
          </div>
        ))}
        {['carousel', 'tabs', 'bottom-sheet'].includes(object.interactionType) && (
          <div style={{ fontSize: 11, color: colors.textLight, marginTop: 4 }}>
            {t('design.interactive.groupsHint', { items: itemsNoun })}
          </div>
        )}
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
  const { t } = useTranslation();
  return (
    <Section title={t('design.interactive.flip.title')}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <NumberInput
          label={t('design.interactive.durationMs')}
          value={config.flipDuration}
          onChange={(v) => onUpdate({ flipDuration: v })}
          min={100}
          max={2000}
          step={50}
        />
        <SelectInput
          label={t('design.interactive.flip.direction')}
          value={config.flipDirection}
          options={[
            { value: 'horizontal', label: t('design.interactive.options.horizontal') },
            { value: 'vertical', label: t('design.interactive.options.vertical') },
          ]}
          onChange={(v) => onUpdate({ flipDirection: v })}
        />
      </div>
      <SelectInput
        label={t('design.interactive.flip.defaultSide')}
        value={config.defaultSide}
        options={[
          { value: 'front', label: t('design.interactive.options.front') },
          { value: 'back', label: t('design.interactive.options.back') },
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
  const { t } = useTranslation();
  return (
    <Section title={t('design.interactive.sheet.title')}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <NumberInput
          label={t('design.interactive.sheet.heightPercent')}
          value={config.sheetHeightPercent}
          onChange={(v) => onUpdate({ sheetHeightPercent: v })}
          min={20}
          max={100}
        />
        <NumberInput
          label={t('design.interactive.durationMs')}
          value={config.slideDuration}
          onChange={(v) => onUpdate({ slideDuration: v })}
          min={100}
          max={1000}
          step={50}
        />
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <NumberInput
          label={t('design.interactive.sheet.backdropOpacity')}
          value={config.backdropOpacity}
          onChange={(v) => onUpdate({ backdropOpacity: Math.max(0, Math.min(1, v)) })}
          min={0}
          max={1}
          step={0.1}
        />
      </div>
      <CheckboxInput
        label={t('design.interactive.sheet.dismissOnBackdropTap')}
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
  const { t } = useTranslation();
  return (
    <Section title={t('design.interactive.expand.title')}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <NumberInput
          label={t('design.interactive.durationMs')}
          value={config.expandDuration}
          onChange={(v) => onUpdate({ expandDuration: v })}
          min={100}
          max={1000}
          step={50}
        />
        <SelectInput
          label={t('design.interactive.expand.easing')}
          value={config.easing}
          options={[
            { value: 'ease', label: t('design.interactive.options.ease') },
            { value: 'ease-in', label: t('design.interactive.options.ease-in') },
            { value: 'ease-out', label: t('design.interactive.options.ease-out') },
            { value: 'ease-in-out', label: t('design.interactive.options.ease-in-out') },
            { value: 'linear', label: t('design.interactive.options.linear') },
          ]}
          onChange={(v) => onUpdate({ easing: v })}
        />
      </div>
      <CheckboxInput
        label={t('design.interactive.expand.defaultExpanded')}
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
  const { t } = useTranslation();
  return (
    <Section title={t('design.interactive.entrance.title')}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <SelectInput
          label={t('design.interactive.entrance.animation')}
          value={config.animation}
          options={[
            { value: 'fade-in', label: t('design.interactive.options.fade-in') },
            { value: 'slide-up', label: t('design.interactive.options.slide-up') },
            { value: 'scale-up', label: t('design.interactive.options.scale-up') },
            { value: 'bounce', label: t('design.interactive.options.bounce') },
          ]}
          onChange={(v) => onUpdate({ animation: v })}
        />
        <SelectInput
          label={t('design.interactive.entrance.trigger')}
          value={config.trigger}
          options={[
            { value: 'on-load', label: t('design.interactive.options.on-load') },
            { value: 'on-scroll', label: t('design.interactive.options.on-scroll') },
          ]}
          onChange={(v) => onUpdate({ trigger: v })}
        />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <NumberInput
          label={t('design.interactive.durationMs')}
          value={config.duration}
          onChange={(v) => onUpdate({ duration: v })}
          min={100}
          max={2000}
          step={50}
        />
        <NumberInput
          label={t('design.interactive.entrance.stagger')}
          value={config.staggerDelay}
          onChange={(v) => onUpdate({ staggerDelay: v })}
          min={0}
          max={500}
          step={25}
        />
      </div>
      {config.animation === 'bounce' && (
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <NumberInput
            label={t('design.interactive.entrance.springFriction')}
            value={config.springFriction ?? 8}
            onChange={(v) => onUpdate({ springFriction: v })}
            min={1}
            max={30}
            step={1}
          />
          <NumberInput
            label={t('design.interactive.entrance.springTension')}
            value={config.springTension ?? 40}
            onChange={(v) => onUpdate({ springTension: v })}
            min={10}
            max={200}
            step={5}
          />
        </div>
      )}
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
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <Section title={t('design.interactive.carousel.title')}>
      <div style={{ marginBottom: 8 }}>
        <CheckboxInput
          label={t('design.interactive.carousel.autoPlay')}
          value={config.autoPlay}
          onChange={(v) => onUpdate({ autoPlay: v })}
        />
      </div>
      {config.autoPlay && (
        <>
          <div style={{ marginBottom: 8 }}>
            <NumberInput
              label={t('design.interactive.carousel.interval')}
              value={config.autoPlayInterval}
              onChange={(v) => onUpdate({ autoPlayInterval: v })}
              min={1000}
              max={10000}
              step={500}
            />
          </div>
          <div style={{ marginBottom: 8 }}>
            <CheckboxInput
              label={t('design.interactive.carousel.pauseOnInteraction')}
              value={config.pauseOnInteraction !== false}
              onChange={(v) => onUpdate({ pauseOnInteraction: v })}
            />
          </div>
          {config.pauseOnInteraction !== false && (
            <div style={{ marginBottom: 8 }}>
              <NumberInput
                label={t('design.interactive.carousel.resumeDelay')}
                value={config.resumeDelay ?? 3000}
                onChange={(v) => onUpdate({ resumeDelay: v })}
                min={1000}
                max={10000}
                step={500}
              />
            </div>
          )}
        </>
      )}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <CheckboxInput
          label={t('design.interactive.carousel.showDots')}
          value={config.showDots}
          onChange={(v) => onUpdate({ showDots: v })}
        />
        <CheckboxInput
          label={t('design.interactive.carousel.showArrows')}
          value={config.showArrows}
          onChange={(v) => onUpdate({ showArrows: v })}
        />
      </div>
      <NumberInput
        label={t('design.interactive.carousel.transition')}
        value={config.transitionDuration}
        onChange={(v) => onUpdate({ transitionDuration: v })}
        min={100}
        max={1000}
        step={50}
      />

      {/* Arrow & Dot Styling */}
      {(config.showArrows || config.showDots) && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: colors.textLight, marginBottom: 8 }}>
            {t('design.interactive.carousel.navigationStyling')}
          </div>
          {config.showArrows && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <ColorInputInline
                label={t('design.interactive.carousel.arrowColor')}
                value={config.arrowColor ?? '#374151'}
                onChange={(v) => onUpdate({ arrowColor: v })}
              />
              <ColorInputInline
                label={t('design.interactive.carousel.arrowBg')}
                value={config.arrowBgColor ?? 'rgba(255,255,255,0.9)'}
                onChange={(v) => onUpdate({ arrowBgColor: v })}
              />
            </div>
          )}
          {config.showDots && (
            <>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <ColorInputInline
                  label={t('design.interactive.carousel.activeDot')}
                  value={config.dotActiveColor ?? '#ffffff'}
                  onChange={(v) => onUpdate({ dotActiveColor: v })}
                />
                <ColorInputInline
                  label={t('design.interactive.carousel.inactiveDot')}
                  value={config.dotInactiveColor ?? 'rgba(255,255,255,0.4)'}
                  onChange={(v) => onUpdate({ dotInactiveColor: v })}
                />
              </div>
              <SelectInput
                label={t('design.interactive.carousel.dotPosition')}
                value={config.dotPosition ?? 'bottom'}
                options={[
                  { value: 'bottom', label: t('design.interactive.options.bottom') },
                  { value: 'top', label: t('design.interactive.options.top') },
                ]}
                onChange={(v) => onUpdate({ dotPosition: v })}
              />
            </>
          )}
        </div>
      )}
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
  const { t } = useTranslation();
  return (
    <Section title={t('design.interactive.tabs.title')}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <NumberInput
          label={t('design.interactive.tabs.defaultTab')}
          value={config.defaultTab}
          onChange={(v) => onUpdate({ defaultTab: Math.max(0, Math.round(v)) })}
          min={0}
          max={10}
        />
        <SelectInput
          label={t('design.interactive.tabs.position')}
          value={config.tabPosition}
          options={[
            { value: 'top', label: t('design.interactive.options.top') },
            { value: 'bottom', label: t('design.interactive.options.bottom') },
          ]}
          onChange={(v) => onUpdate({ tabPosition: v })}
        />
      </div>
      <SelectInput
        label={t('design.interactive.tabs.tabStyle')}
        value={config.tabStyle}
        options={[
          { value: 'underline', label: t('design.interactive.options.underline') },
          { value: 'pill', label: t('design.interactive.options.pill') },
          { value: 'boxed', label: t('design.interactive.options.boxed') },
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
  const { t } = useTranslation();
  return (
    <>
    <Section title={t('design.interactive.quiz.title')}>
      <div style={{ marginBottom: 8 }}>
        <label style={{ fontSize: 11, color: colors.textLight, fontWeight: 500, display: 'block', marginBottom: 3 }}>
          {t('design.interactive.quiz.question')}
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
          {t('design.interactive.quiz.options')}
        </label>
        {config.options.map((opt, i) => (
          <div key={i} style={{ display: 'flex', gap: 4, marginBottom: 4, alignItems: 'center' }}>
            <input
              type="radio"
              name="correctAnswer"
              checked={config.correctIndex === i}
              onChange={() => onUpdate({ correctIndex: i })}
              style={{ accentColor: colors.primary }}
              title={t('design.interactive.quiz.markCorrect')}
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
            {t('design.interactive.quiz.addOption')}
          </button>
        )}
      </div>

      <div style={{ marginBottom: 8 }}>
        <CheckboxInput
          label={t('design.interactive.quiz.showFeedback')}
          value={config.showFeedback}
          onChange={(v) => onUpdate({ showFeedback: v })}
        />
      </div>

      {config.showFeedback && (
        <>
          <div style={{ marginBottom: 4 }}>
            <label style={{ fontSize: 11, color: colors.textLight, fontWeight: 500, display: 'block', marginBottom: 3 }}>
              {t('design.interactive.quiz.correctFeedback')}
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
              {t('design.interactive.quiz.incorrectFeedback')}
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
    <Section title={t('design.interactive.quiz.stylingTitle')}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <ColorInputInline
          label={t('design.interactive.quiz.correctColor')}
          value={config.correctColor ?? '#22C55E'}
          onChange={(v) => onUpdate({ correctColor: v })}
        />
        <ColorInputInline
          label={t('design.interactive.quiz.incorrectColor')}
          value={config.incorrectColor ?? '#EF4444'}
          onChange={(v) => onUpdate({ incorrectColor: v })}
        />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <ColorInputInline
          label={t('design.interactive.quiz.buttonColor')}
          value={config.buttonColor ?? '#7B68EE'}
          onChange={(v) => onUpdate({ buttonColor: v })}
        />
        <ColorInputInline
          label={t('design.interactive.quiz.optionHighlight')}
          value={config.optionHighlight ?? 'rgba(123,104,238,0.1)'}
          onChange={(v) => onUpdate({ optionHighlight: v })}
        />
      </div>
    </Section>
    </>
  );
}

function getTypeLabel(type: string, t: (key: string) => string): string {
  switch (type) {
    case 'flip-card': return t('design.interactive.types.flip-card');
    case 'bottom-sheet': return t('design.interactive.types.bottom-sheet');
    case 'expandable': return t('design.interactive.types.expandable');
    case 'entrance': return t('design.interactive.types.entrance');
    case 'carousel': return t('design.interactive.types.carousel');
    case 'tabs': return t('design.interactive.types.tabs');
    case 'quiz': return t('design.interactive.types.quiz');
    default: return t('design.interactive.types.interactive');
  }
}
