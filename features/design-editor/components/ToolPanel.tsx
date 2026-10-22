import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useEditorStore } from '../store/editor-store';
import { createImage, createStar, createTriangle, createArrow, createBadge, createIcon } from '../utils/defaults';
import {
  createFlipCard,
  createBottomSheet,
  createExpandable,
  createEntrance,
  createCarousel,
  createTabs,
  createQuiz,
} from '../utils/interactive-templates';
import {
  createInfoCard,
  createStatCounter,
  createNumberedList,
  createQuoteBlock,
  createCTABlock,
  createHeaderSection,
  createIconGrid,
  createImageCaption,
} from '../utils/block-templates';
import { useTheme } from '../../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

interface ToolPanelProps {
  onImageUpload: (file: File) => Promise<{ assetId: string; url: string } | null>;
}

type CategoryId = 'select' | 'shapes' | 'text' | 'media' | 'interactive' | 'blocks' | 'settings';

// Map active tools to their parent category for rail highlighting
const TOOL_TO_CATEGORY: Record<string, CategoryId> = {
  rect: 'shapes',
  ellipse: 'shapes',
  star: 'shapes',
  triangle: 'shapes',
  line: 'shapes',
  arrow: 'shapes',
  text: 'text',
  badge: 'text',
  image: 'media',
  select: 'select',
};

// Labels/descriptions are rendered via i18n (keyed by id); icons stay literal.
const CATEGORIES: { id: CategoryId; icon: string; bottom?: boolean }[] = [
  { id: 'select', icon: '↖' },
  { id: 'shapes', icon: '◇' },
  { id: 'text', icon: 'T' },
  { id: 'media', icon: '🖼' },
  { id: 'interactive', icon: '⚡' },
  { id: 'blocks', icon: '◫' },
  { id: 'settings', icon: '⚙', bottom: true },
];

const INTERACTIVE_PRESETS = [
  { id: 'flip-card' as const, icon: '🔄' },
  { id: 'bottom-sheet' as const, icon: '📋' },
  { id: 'expandable' as const, icon: '📐' },
  { id: 'entrance' as const, icon: '✨' },
  { id: 'carousel' as const, icon: '◀▶' },
  { id: 'tabs' as const, icon: '📑' },
  { id: 'quiz' as const, icon: '❓' },
] as const;

const BLOCK_PRESETS = [
  { id: 'info-card' as const, icon: 'ℹ' },
  { id: 'stat-counter' as const, icon: '##' },
  { id: 'numbered-list' as const, icon: '1.' },
  { id: 'quote-block' as const, icon: '\u201C' },
  { id: 'cta-block' as const, icon: '▶' },
  { id: 'header-section' as const, icon: 'H' },
  { id: 'icon-grid' as const, icon: '⊞' },
  { id: 'image-caption' as const, icon: '📷' },
] as const;

// ─── Inject flyout animation ────────────────────────────────────
const FLYOUT_STYLE_ID = 'toolpanel-flyout-anim';
if (typeof document !== 'undefined' && !document.getElementById(FLYOUT_STYLE_ID)) {
  const style = document.createElement('style');
  style.id = FLYOUT_STYLE_ID;
  style.textContent = `
    @keyframes slideInFlyout {
      from { opacity: 0; transform: translateX(-8px); }
      to   { opacity: 1; transform: translateX(0); }
    }
  `;
  document.head.appendChild(style);
}

// ─── HoverButton ────────────────────────────────────────────────
function HoverButton({
  children,
  onClick,
  style,
  hoverBg,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  style: React.CSSProperties;
  hoverBg: string;
  title?: string;
}) {
  const { colors } = useTheme();
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={title}
      style={{
        color: colors.textDark,
        ...style,
        backgroundColor: hovered ? hoverBg : (style.backgroundColor || 'transparent'),
        border: 'none',
        cursor: 'pointer',
        transition: 'background-color 0.15s',
      }}
    >
      {children}
    </button>
  );
}

// ─── Flyout sub-components ──────────────────────────────────────

function ShapesFlyout({
  colors,
  onAction,
}: {
  colors: any;
  onAction: (action: () => void) => void;
}) {
  const { t } = useTranslation();
  const setActiveTool = useEditorStore((s) => s.setActiveTool);
  const addObject = useEditorStore((s) => s.addObject);
  const canvas = useEditorStore((s) => s.canvas);
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  const shapes = [
    { icon: '▢', k: 'rectangle', label: t('design.tools.shapes.rectangle'), hint: 'R', action: () => setActiveTool('rect') },
    { icon: '○', k: 'ellipse', label: t('design.tools.shapes.ellipse'), hint: 'E', action: () => setActiveTool('ellipse') },
    {
      icon: '★',
      k: 'star',
      label: t('design.tools.shapes.star'),
      hint: 'S',
      action: () => { addObject(createStar({ x: cx - 60, y: cy - 60 })); setActiveTool('select'); },
    },
    {
      icon: '△',
      k: 'triangle',
      label: t('design.tools.shapes.triangle'),
      hint: '',
      action: () => { addObject(createTriangle({ x: cx - 75, y: cy - 65 })); setActiveTool('select'); },
    },
    { icon: '╱', k: 'line', label: t('design.tools.shapes.line'), hint: 'L', action: () => setActiveTool('line') },
    {
      icon: '→',
      k: 'arrow',
      label: t('design.tools.shapes.arrow'),
      hint: '',
      action: () => { addObject(createArrow({ points: [cx - 100, cy, cx + 100, cy] })); setActiveTool('select'); },
    },
    {
      icon: '✦',
      k: 'icon',
      label: t('design.tools.shapes.icon'),
      hint: '',
      action: () => { addObject(createIcon({ x: cx - 24, y: cy - 24 })); setActiveTool('select'); },
    },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      {shapes.map((s) => (
        <HoverButton
          key={s.k}
          onClick={() => onAction(s.action)}
          hoverBg={colors.backgroundLight}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px 8px',
            borderRadius: 12,
            backgroundColor: colors.appBackground,
          }}
        >
          <span style={{ fontSize: 28, lineHeight: 1 }}>{s.icon}</span>
          <span style={{ fontSize: 12, color: colors.textDark, marginTop: 6, fontWeight: 500 }}>{s.label}</span>
          {s.hint && (
            <span style={{ fontSize: 10, color: colors.textLight, marginTop: 2 }}>{s.hint}</span>
          )}
        </HoverButton>
      ))}
    </div>
  );
}

function TextFlyout({
  colors,
  onAction,
}: {
  colors: any;
  onAction: (action: () => void) => void;
}) {
  const { t } = useTranslation();
  const setActiveTool = useEditorStore((s) => s.setActiveTool);
  const addObject = useEditorStore((s) => s.addObject);
  const canvas = useEditorStore((s) => s.canvas);
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <HoverButton
        onClick={() => onAction(() => setActiveTool('text'))}
        hoverBg={colors.backgroundLight}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 12px',
          borderRadius: 12,
          backgroundColor: colors.appBackground,
          width: '100%',
          textAlign: 'left',
        }}
      >
        <span style={{
          fontSize: 24,
          width: 40,
          height: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 10,
          backgroundColor: colors.primaryFill,
          color: '#fff',
          fontWeight: 700,
          flexShrink: 0,
        }}>T</span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: colors.textDark }}>{t('design.tools.text.addText.label')}</div>
          <div style={{ fontSize: 12, color: colors.textLight }}>{t('design.tools.text.addText.hint')}</div>
        </div>
      </HoverButton>
      <HoverButton
        onClick={() => onAction(() => {
          addObject(createBadge({ x: cx - 60, y: cy - 18 }));
          setActiveTool('select');
        })}
        hoverBg={colors.backgroundLight}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 12px',
          borderRadius: 12,
          backgroundColor: colors.appBackground,
          width: '100%',
          textAlign: 'left',
        }}
      >
        <span style={{
          fontSize: 20,
          width: 40,
          height: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 10,
          backgroundColor: '#F59E0B',
          color: '#fff',
          flexShrink: 0,
        }}>⬮</span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: colors.textDark }}>{t('design.tools.text.badge.label')}</div>
          <div style={{ fontSize: 12, color: colors.textLight }}>{t('design.tools.text.badge.hint')}</div>
        </div>
      </HoverButton>
    </div>
  );
}

function MediaFlyout({
  colors,
  fileInputRef,
}: {
  colors: any;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const { t } = useTranslation();
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={() => fileInputRef.current?.click()}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%',
        height: 160,
        border: `2px dashed ${hovered ? colors.primary : colors.borderCard}`,
        borderRadius: 16,
        backgroundColor: hovered ? colors.backgroundLight : colors.appBackground,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      <span style={{ fontSize: 36 }}>🖼</span>
      <span style={{ fontSize: 14, fontWeight: 600, color: colors.textDark }}>{t('design.tools.media.label')}</span>
      <span style={{ fontSize: 12, color: colors.textLight }}>{t('design.tools.media.hint')}</span>
    </button>
  );
}

function InteractiveFlyout({
  colors,
  onAction,
}: {
  colors: any;
  onAction: (action: () => void) => void;
}) {
  const { t } = useTranslation();
  const addInteractiveComponent = useEditorStore((s) => s.addInteractiveComponent);
  const canvas = useEditorStore((s) => s.canvas);
  const cy = canvas.height / 2;
  const cw = canvas.width;
  const creators: Record<string, () => void> = {
    'flip-card': () => addInteractiveComponent(createFlipCard(cy, cw)),
    'bottom-sheet': () => addInteractiveComponent(createBottomSheet(cy, cw)),
    'expandable': () => addInteractiveComponent(createExpandable(cy, cw)),
    'entrance': () => addInteractiveComponent(createEntrance(cy, cw)),
    'carousel': () => addInteractiveComponent(createCarousel(cy, cw)),
    'tabs': () => addInteractiveComponent(createTabs(cy, cw)),
    'quiz': () => addInteractiveComponent(createQuiz(cy, cw)),
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {INTERACTIVE_PRESETS.map((p) => (
        <HoverButton
          key={p.id}
          onClick={() => onAction(creators[p.id])}
          hoverBg={colors.backgroundLight}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 10px',
            borderRadius: 10,
            backgroundColor: 'transparent',
            width: '100%',
            textAlign: 'left',
          }}
        >
          <span style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            backgroundColor: colors.backgroundLight,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            flexShrink: 0,
          }}>{p.icon}</span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: colors.textDark }}>{t(`design.tools.interactive.${p.id}.label`)}</div>
            <div style={{ fontSize: 11, color: colors.textLight, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t(`design.tools.interactive.${p.id}.desc`)}</div>
          </div>
        </HoverButton>
      ))}
    </div>
  );
}

function BlocksFlyout({
  colors,
  onAction,
}: {
  colors: any;
  onAction: (action: () => void) => void;
}) {
  const { t } = useTranslation();
  const addObjects = useEditorStore((s) => s.addObjects);
  const canvas = useEditorStore((s) => s.canvas);
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  const creators: Record<string, () => void> = {
    'info-card': () => addObjects(createInfoCard(cx, cy)),
    'stat-counter': () => addObjects(createStatCounter(cx, cy)),
    'numbered-list': () => addObjects(createNumberedList(cx, cy, 3)),
    'quote-block': () => addObjects(createQuoteBlock(cx, cy)),
    'cta-block': () => addObjects(createCTABlock(cx, cy)),
    'header-section': () => addObjects(createHeaderSection(cx, cy)),
    'icon-grid': () => addObjects(createIconGrid(cx, cy, 3, 2)),
    'image-caption': () => addObjects(createImageCaption(cx, cy)),
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {BLOCK_PRESETS.map((b) => (
        <HoverButton
          key={b.id}
          onClick={() => onAction(creators[b.id])}
          hoverBg={colors.backgroundLight}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 10px',
            borderRadius: 10,
            backgroundColor: 'transparent',
            width: '100%',
            textAlign: 'left',
          }}
        >
          <span style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            backgroundColor: colors.backgroundLight,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            fontWeight: 600,
            flexShrink: 0,
          }}>{b.icon}</span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: colors.textDark }}>{t(`design.tools.blocks.${b.id}.label`)}</div>
            <div style={{ fontSize: 11, color: colors.textLight, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t(`design.tools.blocks.${b.id}.desc`)}</div>
          </div>
        </HoverButton>
      ))}
    </div>
  );
}

function SettingsFlyout({ colors }: { colors: any }) {
  const { t } = useTranslation();
  const showGrid = useEditorStore((s) => s.showGrid);
  const setShowGrid = useEditorStore((s) => s.setShowGrid);
  const snapToGrid = useEditorStore((s) => s.snapToGrid);
  const setSnapToGrid = useEditorStore((s) => s.setSnapToGrid);
  const snapToObjects = useEditorStore((s) => s.snapToObjects);
  const setSnapToObjects = useEditorStore((s) => s.setSnapToObjects);
  const gridSize = useEditorStore((s) => s.gridSize);
  const setGridSize = useEditorStore((s) => s.setGridSize);

  const toggles = [
    { k: 'showGrid', label: t('design.tools.settings.showGrid'), value: showGrid, onChange: () => setShowGrid(!showGrid) },
    { k: 'snapToGrid', label: t('design.tools.settings.snapToGrid'), value: snapToGrid, onChange: () => setSnapToGrid(!snapToGrid) },
    { k: 'magneticSnap', label: t('design.tools.settings.magneticSnap'), value: snapToObjects, onChange: () => setSnapToObjects(!snapToObjects) },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {toggles.map((tog) => (
        <div
          key={tog.k}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 8px',
            borderRadius: 10,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 500, color: colors.textDark }}>{tog.label}</span>
          <button
            onClick={tog.onChange}
            style={{
              width: 44,
              height: 24,
              borderRadius: 12,
              border: 'none',
              backgroundColor: tog.value ? colors.primaryFill : colors.borderCard,
              position: 'relative',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              flexShrink: 0,
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: 2,
                left: tog.value ? 22 : 2,
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: '#fff',
                transition: 'left 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }}
            />
          </button>
        </div>
      ))}

      {/* Grid size slider */}
      {showGrid && (
        <div style={{ padding: '8px 8px 12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 12, color: colors.textLight }}>{t('design.tools.settings.gridSize')}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: colors.textDark }}>{gridSize}px</span>
          </div>
          <input
            type="range"
            min={5}
            max={50}
            step={5}
            value={gridSize}
            onChange={(e) => setGridSize(Number(e.target.value))}
            style={{ width: '100%', accentColor: colors.primary }}
          />
        </div>
      )}
    </div>
  );
}

// ─── FlyoutPanel ────────────────────────────────────────────────

function FlyoutPanel({
  category,
  colors,
  railRef,
  fileInputRef,
  onClose,
}: {
  category: CategoryId;
  colors: any;
  railRef: React.RefObject<HTMLDivElement | null>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [pos, setPos] = useState({ top: 0, left: 0, height: 0 });

  useEffect(() => {
    if (railRef.current) {
      const rect = railRef.current.getBoundingClientRect();
      setPos({ top: rect.top, left: rect.right, height: rect.height });
    }
  }, [category, railRef]);

  const flyoutTitle = category === 'select' ? '' : t(`design.tools.categories.${category}`);

  // Close flyout after an action (except settings)
  const handleItemAction = useCallback((action: () => void) => {
    action();
    if (category !== 'settings') {
      onClose();
    }
  }, [category, onClose]);

  return (
    <div
      style={{
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        width: 260,
        height: pos.height,
        backgroundColor: colors.white,
        borderRight: `1px solid ${colors.borderCard}`,
        boxShadow: '4px 0 16px rgba(0,0,0,0.08)',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideInFlyout 0.15s ease-out',
      }}
    >
      <div style={{
        padding: '16px 16px 12px',
        fontSize: 15,
        fontWeight: 700,
        color: colors.textDark,
        borderBottom: `1px solid ${colors.borderCard}`,
        flexShrink: 0,
      }}>
        {flyoutTitle}
      </div>
      <div style={{ padding: 12, overflowY: 'auto', flex: 1 }}>
        {category === 'shapes' && <ShapesFlyout colors={colors} onAction={handleItemAction} />}
        {category === 'text' && <TextFlyout colors={colors} onAction={handleItemAction} />}
        {category === 'media' && <MediaFlyout colors={colors} fileInputRef={fileInputRef} />}
        {category === 'interactive' && <InteractiveFlyout colors={colors} onAction={handleItemAction} />}
        {category === 'blocks' && <BlocksFlyout colors={colors} onAction={handleItemAction} />}
        {category === 'settings' && <SettingsFlyout colors={colors} />}
      </div>
    </div>
  );
}

// ─── Main ToolPanel ─────────────────────────────────────────────

export function ToolPanel({ onImageUpload }: ToolPanelProps) {
  const activeTool = useEditorStore((s) => s.activeTool);
  const setActiveTool = useEditorStore((s) => s.setActiveTool);
  const editingComponentId = useEditorStore((s) => s.editingComponentId);
  const { colors } = useTheme();
  const { t } = useTranslation();

  const [openCategory, setOpenCategory] = useState<CategoryId | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Determine which category is "active" based on current tool
  const activeCategory = TOOL_TO_CATEGORY[activeTool] || 'select';

  // Outside-click handler
  useEffect(() => {
    if (!openCategory) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenCategory(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [openCategory]);

  const handleCategoryClick = (id: CategoryId) => {
    if (id === 'select') {
      setActiveTool('select');
      setOpenCategory(null);
      return;
    }
    // Toggle flyout
    setOpenCategory((prev) => (prev === id ? null : id));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const addObject = useEditorStore.getState().addObject;
    const result = await onImageUpload(file);
    if (result) {
      addObject(createImage(result.assetId, result.url, file.name));
    }
    e.target.value = '';
    setOpenCategory(null);
  };

  // Filter categories when editing a component
  const visibleCategories = CATEGORIES.filter((cat) => {
    if (editingComponentId && (cat.id === 'interactive' || cat.id === 'blocks')) {
      return false;
    }
    return true;
  });

  const mainCategories = visibleCategories.filter((c) => !c.bottom);
  const bottomCategories = visibleCategories.filter((c) => c.bottom);

  return (
    <div ref={containerRef} style={{ display: 'flex', flexShrink: 0, height: '100%' }}>
      {/* Icon Rail */}
      <div
        ref={railRef}
        style={{
          width: 64,
          backgroundColor: colors.white,
          borderRight: `1px solid ${colors.borderCard}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: 8,
          paddingBottom: 8,
        }}
      >
        {mainCategories.map((cat) => {
          const isActive = openCategory === cat.id || (openCategory === null && activeCategory === cat.id);
          return (
            <HoverButton
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              title={t(`design.tools.categories.${cat.id}`)}
              hoverBg={colors.backgroundLight}
              style={{
                width: 52,
                height: 52,
                borderRadius: 12,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                backgroundColor: isActive ? colors.backgroundLight : 'transparent',
                color: isActive ? colors.primary : colors.textDark,
                marginBottom: 2,
              }}
            >
              <span style={{ fontSize: 20, lineHeight: 1 }}>{cat.icon}</span>
              <span style={{ fontSize: 9, fontWeight: 600, lineHeight: 1 }}>{t(`design.tools.categories.${cat.id}`)}</span>
            </HoverButton>
          );
        })}

        {/* Spacer pushes settings to bottom */}
        <div style={{ flex: 1 }} />

        {bottomCategories.map((cat) => {
          const isActive = openCategory === cat.id;
          return (
            <HoverButton
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              title={t(`design.tools.categories.${cat.id}`)}
              hoverBg={colors.backgroundLight}
              style={{
                width: 52,
                height: 52,
                borderRadius: 12,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                backgroundColor: isActive ? colors.backgroundLight : 'transparent',
                color: isActive ? colors.primary : colors.textDark,
                marginTop: 2,
              }}
            >
              <span style={{ fontSize: 20, lineHeight: 1 }}>{cat.icon}</span>
              <span style={{ fontSize: 9, fontWeight: 600, lineHeight: 1 }}>{t(`design.tools.categories.${cat.id}`)}</span>
            </HoverButton>
          );
        })}
      </div>

      {/* Flyout */}
      {openCategory && openCategory !== 'select' && (
        <FlyoutPanel
          category={openCategory}
          colors={colors}
          railRef={railRef}
          fileInputRef={fileInputRef}
          onClose={() => setOpenCategory(null)}
        />
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </div>
  );
}
