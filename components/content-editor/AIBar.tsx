// "Ask AI" — the editor's edit-by-instruction bar. The instruction becomes validated
// ops applied through the store, so an AI edit is undoable like any other change.
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { TYPOGRAPHY, RADII } from '../../constants/onboarding-theme';
import { useEditorStore } from '../../features/content/editor/store';
import { editPage } from '../../features/content/ai/client';

export function AIBar() {
  const { colors } = useTheme();
  const dispatch = useEditorStore((s) => s.dispatch);
  const select = useEditorStore((s) => s.select);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  const run = async () => {
    const instruction = text.trim();
    if (!instruction || busy) return;
    setBusy(true); setResult(null);
    const res = await editPage(useEditorStore.getState().doc, instruction);
    if ('error' in res) {
      setResult({ kind: 'error', text: res.error });
    } else {
      dispatch(res.ops);
      select(null);
      setResult({ kind: 'ok', text: res.summary || 'Change applied.' });
      setText('');
    }
    setBusy(false);
  };

  const canSend = !!text.trim() && !busy;

  return (
    <View style={{ borderTopWidth: 1, borderTopColor: colors.borderCard, backgroundColor: colors.white, padding: 12, gap: 8 }}>
      {result ? (
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6, paddingHorizontal: 4 }}>
          <Ionicons name={result.kind === 'ok' ? 'checkmark-circle' : 'alert-circle'} size={14} color={result.kind === 'ok' ? colors.success : colors.error} style={{ marginTop: 1 }} />
          <Text style={{ ...TYPOGRAPHY.caption, color: result.kind === 'ok' ? colors.textMuted : colors.error, flex: 1 }}>
            {result.kind === 'ok' ? `${result.text}  ·  Undo above if it's not right.` : result.text}
          </Text>
        </View>
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.inputBackground, borderRadius: RADII.pill, borderWidth: 1.5, borderColor: colors.border, paddingLeft: 14, paddingRight: 5, paddingVertical: 4 }}>
        <Ionicons name="sparkles" size={16} color={colors.primary} />
        <TextInput
          value={text}
          onChangeText={setText}
          onSubmitEditing={run}
          editable={!busy}
          placeholder="Ask AI to change this page…"
          placeholderTextColor={colors.inputPlaceholder}
          style={{ flex: 1, ...TYPOGRAPHY.bodySmall, color: colors.textDark, paddingVertical: 8, outlineStyle: 'none' as any }}
        />
        <Pressable
          onPress={run}
          disabled={!canSend}
          accessibilityLabel="Send to AI"
          style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: canSend ? colors.primary : colors.disabledButton, cursor: (canSend ? 'pointer' : 'default') as any }}
        >
          {busy ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="arrow-up" size={18} color="#fff" />}
        </Pressable>
      </View>
    </View>
  );
}
