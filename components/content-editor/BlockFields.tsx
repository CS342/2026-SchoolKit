// The editing surface for one block. Scalar fields come from BLOCK_CONFIG; hero and
// resourceRefList get bespoke controls; item-blocks (accordion/cardGrid/stepper/
// linkList) get a nested item editor. Every change dispatches an op.
import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { TYPOGRAPHY, SPACING, RADII } from '../../constants/onboarding-theme';
import { useResources } from '../../hooks/useResources';
import { isListable } from '../../hooks/useAudienceFilter';
import { useAuth } from '../../contexts/AuthContext';
import { useEditorStore } from '../../features/content/editor/store';
import { BLOCK_CONFIG, FieldDef, ItemConfig } from '../../features/content/editor/templates';
import type { ContentBlock, ColorToken } from '../../features/content/types';
import { pickFiles, uploadContentImage } from '../../features/content/uploads';
import { suggestImageText } from '../../features/content/ai/client';
import { TextField, ColorSwatches, IconField, ToggleRow, IconBtn, SectionLabel } from './primitives';

function SelectRow({ label, options, value, onChange }: { label: string; options: { value: string; label: string }[]; value: string; onChange: (v: string) => void }) {
  const { colors } = useTheme();
  return (
    <View style={{ marginBottom: SPACING.md }}>
      <SectionLabel>{label}</SectionLabel>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {options.map((opt) => {
          const on = value === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => onChange(opt.value)}
              style={{ paddingVertical: 7, paddingHorizontal: 14, borderRadius: RADII.pill, borderWidth: 1.5, borderColor: on ? colors.primary : colors.border, backgroundColor: on ? colors.primarySoft : colors.white, cursor: 'pointer' as any }}
            >
              <Text style={{ ...TYPOGRAPHY.caption, fontFamily: 'Raleway_700Bold', color: on ? colors.primary : colors.textMuted }}>{opt.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// A URL text field that normalizes on blur (prepends https:// when a scheme is
// missing) and shows an inline hint when the value doesn't look like a URL.
function UrlField({ label, value, onChange, placeholder }: { label?: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const v = value ?? '';
  const trimmed = v.trim();
  const hasScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed);
  const candidate = trimmed && !hasScheme ? `https://${trimmed}` : trimmed;
  const invalid = trimmed.length > 0 && !/^https?:\/\/[^\s.]+(\.[^\s.]+)+(\/[^\s]*)?$/i.test(candidate);
  const normalize = () => {
    setFocused(false);
    if (trimmed && !hasScheme) onChange(candidate);
    else if (trimmed !== v) onChange(trimmed);
  };
  return (
    <View style={{ marginBottom: SPACING.md }}>
      {label ? <SectionLabel>{label}</SectionLabel> : null}
      <TextInput
        value={v}
        onChangeText={onChange}
        onFocus={() => setFocused(true)}
        onBlur={normalize}
        placeholder={placeholder}
        placeholderTextColor={colors.inputPlaceholder}
        autoCapitalize="none"
        autoCorrect={false}
        style={{ ...TYPOGRAPHY.body, color: colors.textDark, backgroundColor: colors.inputBackground, borderWidth: 1.5, borderColor: invalid ? colors.error : focused ? colors.primary : colors.border, borderRadius: RADII.md, paddingHorizontal: 12, paddingVertical: 10, outlineStyle: 'none' as any }}
      />
      {invalid ? <Text style={{ ...TYPOGRAPHY.caption, color: colors.error, marginTop: 4 }}>That doesn’t look like a valid URL.</Text> : null}
    </View>
  );
}

function FieldInput({ field, value, onChange }: { field: FieldDef; value: any; onChange: (v: any) => void }) {
  switch (field.kind) {
    case 'text': return <TextField label={field.label} value={value ?? ''} onChangeText={onChange} placeholder={field.placeholder} />;
    case 'textarea': return <TextField label={field.label} value={value ?? ''} onChangeText={onChange} placeholder={field.placeholder} multiline />;
    case 'url': return <UrlField label={field.label} value={value ?? ''} onChange={onChange} placeholder={field.placeholder} />;
    case 'color': return <ColorSwatches value={(value ?? 'primary') as ColorToken} onChange={onChange} />;
    case 'icon': return field.optional
      ? <IconField value={value} onChange={onChange} allowNone />
      : <IconField value={value ?? 'ellipse-outline'} onChange={onChange} />;
    case 'toggle': return <ToggleRow label={field.label} value={!!value} onValueChange={onChange} />;
    case 'select': return <SelectRow label={field.label} options={field.options ?? []} value={value ?? field.options?.[0]?.value ?? ''} onChange={onChange} />;
  }
}

// ─── hero (title + highlighted word + eyebrow) ─────────────────────────────────
function HeroFields({ block }: { block: any }) {
  const { colors } = useTheme();
  const dispatch = useEditorStore((s) => s.dispatch);
  const fullTitle = (block.titleParts ?? []).map((p: any) => p.text).join('');
  const accentWord = (block.titleParts ?? []).find((p: any) => p.accent)?.text?.trim() ?? '';
  const [title, setTitle] = useState(fullTitle);
  const [word, setWord] = useState(accentWord);

  const rebuild = (full: string, w: string) => {
    const clean = w.trim();
    if (!clean) return [{ text: full }];
    const i = full.indexOf(clean);
    if (i < 0) return [{ text: full }];
    const parts: any[] = [];
    if (i > 0) parts.push({ text: full.slice(0, i) });
    parts.push({ text: clean, accent: true });
    if (i + clean.length < full.length) parts.push({ text: full.slice(i + clean.length) });
    return parts;
  };
  const push = (full: string, w: string) => dispatch([{ op: 'updateBlock', id: block.id, patch: { titleParts: rebuild(full, w) } }]);
  const set = (patch: any) => dispatch([{ op: 'updateBlock', id: block.id, patch }]);

  return (
    <View>
      <TextField label="Title" value={title} onChangeText={(t) => { setTitle(t); push(t, word); }} />
      <TextField label="Highlight this word" placeholder="One word from the title" value={word} onChangeText={(t) => { setWord(t); push(title, t); }} />
      <Text style={{ ...TYPOGRAPHY.caption, color: colors.textLight, marginTop: -6, marginBottom: SPACING.md }}>
        The highlighted word uses the page accent color (set in Page settings).
      </Text>
      <TextField label="Eyebrow" placeholder="Small label above the title" value={block.eyebrow ?? ''} onChangeText={(t) => set({ eyebrow: t })} />
      <IconField value={block.eyebrowIcon} onChange={(v) => set({ eyebrowIcon: v })} allowNone />
      <ColorSwatches value={(block.eyebrowColor ?? 'teal') as ColorToken} onChange={(v) => set({ eyebrowColor: v })} />
      <TextField label="Subtitle" placeholder="Optional" value={block.subtitle ?? ''} onChangeText={(t) => set({ subtitle: t })} />
    </View>
  );
}

// ─── resourceRefList (pick existing resources) ─────────────────────────────────
function ResourceRefFields({ block }: { block: any }) {
  const { colors } = useTheme();
  const dispatch = useEditorStore((s) => s.dispatch);
  const selected: string[] = block.resourceIds ?? [];
  // The guides the Library lists (published pages included, in place of the built-ins
  // they replace), plus any already selected so they can still be removed.
  const { allResources } = useResources();
  const guides = allResources.filter((r) => selected.includes(r.id) || (!r.designOnly && isListable(r)));
  const toggle = (id: string) => {
    const next = selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id];
    dispatch([{ op: 'updateBlock', id: block.id, patch: { resourceIds: next } }]);
  };
  return (
    <View style={{ marginTop: SPACING.xs }}>
      <SectionLabel>Guides to include{selected.length ? ` · ${selected.length} selected` : ''}</SectionLabel>
      <View style={{ gap: 8 }}>
        {guides.length === 0 ? (
          <Text style={{ ...TYPOGRAPHY.bodySmall, color: colors.textMuted }}>No guides are listed in the Library yet. Publish a page to link to it here.</Text>
        ) : null}
        {guides.map((r) => {
          const on = selected.includes(r.id);
          const rank = selected.indexOf(r.id) + 1;
          return (
            <Pressable
              key={r.id}
              onPress={() => toggle(r.id)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: RADII.md, borderWidth: 1.5, borderColor: on ? r.color : colors.border, backgroundColor: on ? r.color + '12' : colors.white, cursor: 'pointer' as any }}
            >
              <View style={{ width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? r.color : colors.appBackgroundAlt }}>
                {on ? <Text style={{ color: '#fff', fontSize: 12, fontFamily: 'Raleway_800ExtraBold' }}>{rank}</Text> : <Ionicons name={r.icon as any} size={13} color={colors.textLight} />}
              </View>
              <Text style={{ ...TYPOGRAPHY.bodySmall, color: colors.textDark, flex: 1 }} numberOfLines={1}>{r.title}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ─── comparison table (columns + rows) ─────────────────────────────────────────
function ComparisonFields({ block }: { block: any }) {
  const { colors } = useTheme();
  const dispatch = useEditorStore((s) => s.dispatch);
  const columns: string[] = block.columns ?? [];
  const rows: { id: string; cells: string[] }[] = block.rows ?? [];
  const setBlock = (patch: any) => dispatch([{ op: 'updateBlock', id: block.id, patch }]);

  const setColumn = (ci: number, v: string) => { const next = columns.slice(); next[ci] = v; setBlock({ columns: next }); };
  const addColumn = () => setBlock({ columns: [...columns, `Column ${columns.length + 1}`], rows: rows.map((r) => ({ ...r, cells: [...r.cells, ''] })) });
  const removeColumn = (ci: number) => {
    if (columns.length <= 1) return;
    setBlock({ columns: columns.filter((_, i) => i !== ci), rows: rows.map((r) => ({ ...r, cells: r.cells.filter((_, i) => i !== ci) })) });
  };
  const setCell = (rowId: string, ci: number, v: string) => {
    const row = rows.find((r) => r.id === rowId);
    if (!row) return;
    const cells = columns.map((_, i) => (i === ci ? v : row.cells[i] ?? ''));
    dispatch([{ op: 'updateItem', block: block.id, item: rowId, patch: { cells } }]);
  };
  const addRow = () => dispatch([{ op: 'insertItem', block: block.id, at: rows.length, item: { cells: columns.map(() => '') } }]);
  const removeRow = (rowId: string) => dispatch([{ op: 'removeItem', block: block.id, item: rowId }]);

  return (
    <View style={{ marginTop: SPACING.xs }}>
      <SectionLabel>Columns · {columns.length}</SectionLabel>
      <View style={{ gap: 8 }}>
        {columns.map((c, ci) => (
          <View key={ci} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ flex: 1 }}><TextField label="" value={c} onChangeText={(v) => setColumn(ci, v)} placeholder={`Column ${ci + 1}`} /></View>
            <IconBtn icon="trash-outline" label="Remove column" danger disabled={columns.length <= 1} onPress={() => removeColumn(ci)} />
          </View>
        ))}
      </View>
      <Pressable onPress={addColumn} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8, paddingVertical: 8, borderRadius: RADII.md, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.border, cursor: 'pointer' as any }}>
        <Ionicons name="add" size={16} color={colors.primary} />
        <Text style={{ ...TYPOGRAPHY.caption, fontFamily: 'Raleway_700Bold', color: colors.primary }}>Add column</Text>
      </Pressable>

      <View style={{ height: SPACING.md }} />
      <SectionLabel>Rows · {rows.length}</SectionLabel>
      <View style={{ gap: 12 }}>
        {rows.map((row, ri) => (
          <View key={row.id} style={{ borderWidth: 1, borderColor: colors.borderCard, borderRadius: RADII.md, padding: 10, gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ ...TYPOGRAPHY.caption, color: colors.textLight }}>Row {ri + 1}</Text>
              <IconBtn icon="trash-outline" label="Remove row" danger disabled={rows.length <= 1} onPress={() => removeRow(row.id)} />
            </View>
            {columns.map((col, ci) => (
              <TextField key={ci} label={col || `Column ${ci + 1}`} value={row.cells[ci] ?? ''} onChangeText={(v) => setCell(row.id, ci, v)} />
            ))}
          </View>
        ))}
      </View>
      <Pressable onPress={addRow} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10, paddingVertical: 9, borderRadius: RADII.md, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.border, cursor: 'pointer' as any }}>
        <Ionicons name="add" size={16} color={colors.primary} />
        <Text style={{ ...TYPOGRAPHY.caption, fontFamily: 'Raleway_700Bold', color: colors.primary }}>Add row</Text>
      </Pressable>
    </View>
  );
}

// ─── item list (accordion/cardGrid/stepper/linkList) ───────────────────────────
function ItemRow({ block, cfg, item, index, count }: { block: ContentBlock; cfg: ItemConfig; item: any; index: number; count: number }) {
  const { colors } = useTheme();
  const dispatch = useEditorStore((s) => s.dispatch);
  const [open, setOpen] = useState(false);
  const title = item.title ?? item.name ?? `${cfg.noun} ${index + 1}`;
  const set = (key: string, value: any) => dispatch([{ op: 'updateItem', block: block.id, item: item.id, patch: { [key]: value } }]);

  return (
    <View style={{ borderWidth: 1, borderColor: colors.borderCard, borderRadius: RADII.md, backgroundColor: colors.white, overflow: 'hidden' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 8, gap: 4 }}>
        <Pressable onPress={() => setOpen((o) => !o)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, cursor: 'pointer' as any }}>
          <Ionicons name={(item.icon ?? 'ellipse-outline') as any} size={16} color={colors.textMuted} />
          <Text style={{ ...TYPOGRAPHY.bodySmall, color: colors.textDark, flex: 1 }} numberOfLines={1}>{title}</Text>
          <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={14} color={colors.textLight} />
        </Pressable>
        <IconBtn icon="arrow-up" label="Move up" disabled={index === 0} onPress={() => dispatch([{ op: 'moveItem', block: block.id, item: item.id, to: index - 1 }])} />
        <IconBtn icon="arrow-down" label="Move down" disabled={index === count - 1} onPress={() => dispatch([{ op: 'moveItem', block: block.id, item: item.id, to: index + 1 }])} />
        <IconBtn icon="trash-outline" label="Delete" danger disabled={count <= 1} onPress={() => dispatch([{ op: 'removeItem', block: block.id, item: item.id }])} />
      </View>
      {open ? (
        <View style={{ padding: 12, paddingTop: 4, borderTopWidth: 1, borderTopColor: colors.appBackgroundAlt }}>
          {cfg.fields.map((f) => <FieldInput key={f.key} field={f} value={item[f.key]} onChange={(v) => set(f.key, v)} />)}
        </View>
      ) : null}
    </View>
  );
}

function ItemListEditor({ block, cfg }: { block: any; cfg: ItemConfig }) {
  const { colors } = useTheme();
  const dispatch = useEditorStore((s) => s.dispatch);
  const items: any[] = block[cfg.arrayKey] ?? [];
  return (
    <View style={{ marginTop: SPACING.xs }}>
      <SectionLabel>{cfg.noun === 'step' ? 'Steps' : 'Items'} · {items.length}</SectionLabel>
      <View style={{ gap: 8 }}>
        {items.map((it, i) => <ItemRow key={it.id} block={block} cfg={cfg} item={it} index={i} count={items.length} />)}
      </View>
      <Pressable
        onPress={() => dispatch([{ op: 'insertItem', block: block.id, at: items.length, item: cfg.make() }])}
        style={({ hovered }: any) => ({ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10, paddingVertical: 9, borderRadius: RADII.md, borderWidth: 1.5, borderStyle: 'dashed', borderColor: hovered ? colors.primary : colors.border, cursor: 'pointer' as any })}
      >
        <Ionicons name="add" size={16} color={colors.primary} />
        <Text style={{ ...TYPOGRAPHY.caption, fontFamily: 'Raleway_700Bold', color: colors.primary }}>Add {cfg.noun}</Text>
      </Pressable>
    </View>
  );
}

// ─── image (upload + AI alt text, on top of the url/alt/caption fields) ─────────
function ImageFields({ block }: { block: any }) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const dispatch = useEditorStore((s) => s.dispatch);
  const [busy, setBusy] = useState<null | 'upload' | 'alt'>(null);
  const [err, setErr] = useState<string | null>(null);
  const set = (patch: any) => dispatch([{ op: 'updateBlock', id: block.id, patch }]);

  const upload = async () => {
    if (!user) { setErr('Sign in to upload images.'); return; }
    const files = await pickFiles('image/*', false);
    if (!files.length) return;
    setBusy('upload'); setErr(null);
    const res = await uploadContentImage(files[0], user.id);
    setBusy(null);
    if ('error' in res) { setErr(res.error); return; }
    set({ url: res.url });
  };

  const suggest = async () => {
    if (!block.url) return;
    setBusy('alt'); setErr(null);
    const res = await suggestImageText(block.url);
    setBusy(null);
    if ('error' in res) { setErr(res.error); return; }
    set({ alt: res.alt, ...(res.caption ? { caption: res.caption } : {}) });
  };

  return (
    <View style={{ marginBottom: SPACING.md, gap: 8 }}>
      {block.url ? (
        <Image source={{ uri: block.url }} resizeMode="cover" style={{ width: '100%', height: 150, borderRadius: RADII.md, backgroundColor: colors.appBackgroundAlt }} />
      ) : (
        <View style={{ width: '100%', height: 90, borderRadius: RADII.md, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="image-outline" size={22} color={colors.textLight} />
        </View>
      )}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <Pressable onPress={busy ? undefined : upload} disabled={!!busy} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: RADII.md, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.white, cursor: (busy ? 'default' : 'pointer') as any }}>
          {busy === 'upload' ? <ActivityIndicator size="small" color={colors.primary} /> : <Ionicons name="cloud-upload-outline" size={15} color={colors.primary} />}
          <Text style={{ ...TYPOGRAPHY.caption, fontFamily: 'Raleway_700Bold', color: colors.primary }}>{block.url ? 'Replace image' : 'Upload image'}</Text>
        </Pressable>
        <Pressable onPress={busy || !block.url ? undefined : suggest} disabled={!!busy || !block.url} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: RADII.md, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.white, opacity: block.url ? 1 : 0.5, cursor: (busy || !block.url ? 'default' : 'pointer') as any }}>
          {busy === 'alt' ? <ActivityIndicator size="small" color={colors.primary} /> : <Ionicons name="sparkles" size={15} color={colors.primary} />}
          <Text style={{ ...TYPOGRAPHY.caption, fontFamily: 'Raleway_700Bold', color: colors.primary }}>Suggest alt text</Text>
        </Pressable>
      </View>
      {err ? <Text style={{ ...TYPOGRAPHY.caption, color: colors.error }}>{err}</Text> : null}
    </View>
  );
}

// ─── entry point ────────────────────────────────────────────────────────────────
export function BlockFields({ block }: { block: ContentBlock }) {
  const { colors } = useTheme();
  const dispatch = useEditorStore((s) => s.dispatch);
  const cfg = BLOCK_CONFIG[block.type];
  const setField = (key: string, value: any) => dispatch([{ op: 'updateBlock', id: block.id, patch: { [key]: value } }]);

  if (cfg.special === 'hero') return <HeroFields block={block} />;

  return (
    <View>
      {cfg.special === 'image' ? <ImageFields block={block} /> : null}
      {cfg.fields.map((f) => <FieldInput key={f.key} field={f} value={(block as any)[f.key]} onChange={(v) => setField(f.key, v)} />)}
      {cfg.special === 'resourceRefList' ? <ResourceRefFields block={block} /> : null}
      {cfg.special === 'comparisonTable' ? <ComparisonFields block={block} /> : null}
      {cfg.item ? <ItemListEditor block={block} cfg={cfg.item} /> : null}
      {block.type === 'recommendations' ? (
        <Text style={{ ...TYPOGRAPHY.bodySmall, color: colors.textLight }}>
          Automatically suggests related pages from this page’s tags. Nothing to set.
        </Text>
      ) : null}
    </View>
  );
}
