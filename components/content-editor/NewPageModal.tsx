// New-page flow: start blank, or describe a page and let AI draft it. Generated
// pages are created as drafts and opened in the editor for review before publishing.
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Modal, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { TYPOGRAPHY, RADII, SPACING } from '../../constants/onboarding-theme';

const EXAMPLES = [
  'A guide to coping with hair loss during treatment, for teens',
  'The top SchoolKit guides for a student just starting chemo',
  'How to talk to teachers about missing school for appointments',
];

export function NewPageModal({ visible, onClose, onBlank, onGenerate }: {
  visible: boolean;
  onClose: () => void;
  onBlank: () => void;
  /** Returns an error message to show, or undefined once it has navigated away. */
  onGenerate: (prompt: string) => Promise<string | undefined>;
}) {
  const { colors, shadows } = useTheme();
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    const p = prompt.trim();
    if (!p || busy) return;
    setBusy(true); setError(null);
    const err = await onGenerate(p);
    if (err) { setError(err); setBusy(false); } // success navigates; leave busy until unmount
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={busy ? undefined : onClose}>
      <Pressable onPress={busy ? undefined : onClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' }}>
        <Pressable onPress={() => {}} style={[{ width: 560, maxWidth: '92%', backgroundColor: colors.white, borderRadius: RADII.xl, padding: SPACING.xxl }, st.shadow]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <View style={{ width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft }}>
              <Ionicons name="sparkles" size={19} color={colors.primary} />
            </View>
            <Text style={{ ...TYPOGRAPHY.h3, color: colors.textDark }}>Create a page</Text>
          </View>
          <Text style={{ ...TYPOGRAPHY.bodySmall, color: colors.textMuted, marginBottom: 16 }}>
            Describe the page you want. AI drafts it — you review and edit before publishing.
          </Text>

          <TextInput
            value={prompt}
            onChangeText={setPrompt}
            editable={!busy}
            multiline
            placeholder="e.g. A guide to returning to school after treatment — what feels different, a plan, and who can help."
            placeholderTextColor={colors.inputPlaceholder}
            style={{ ...TYPOGRAPHY.body, color: colors.textDark, backgroundColor: colors.inputBackground, borderWidth: 1.5, borderColor: colors.border, borderRadius: RADII.md, padding: 14, minHeight: 100, textAlignVertical: 'top', outlineStyle: 'none' as any }}
          />

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
            {EXAMPLES.map((ex) => (
              <Pressable key={ex} onPress={() => !busy && setPrompt(ex)} style={{ paddingVertical: 6, paddingHorizontal: 10, borderRadius: RADII.pill, backgroundColor: colors.appBackgroundAlt, cursor: 'pointer' as any }}>
                <Text style={{ ...TYPOGRAPHY.caption, color: colors.textMuted }} numberOfLines={1}>{ex}</Text>
              </Pressable>
            ))}
          </View>

          {error ? (
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 12 }}>
              <Ionicons name="alert-circle" size={15} color={colors.error} style={{ marginTop: 1 }} />
              <Text style={{ ...TYPOGRAPHY.bodySmall, color: colors.error, flex: 1 }}>{error}</Text>
            </View>
          ) : null}

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 }}>
            <Pressable onPress={busy ? undefined : onBlank} style={{ cursor: 'pointer' as any }}>
              <Text style={{ ...TYPOGRAPHY.bodySmall, fontFamily: 'Raleway_700Bold', color: colors.textMuted }}>Start from blank</Text>
            </Pressable>
            <Pressable
              onPress={generate}
              disabled={!prompt.trim() || busy}
              style={[{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 11, paddingHorizontal: 20, borderRadius: RADII.button, backgroundColor: prompt.trim() && !busy ? colors.primary : colors.disabledButton, cursor: (prompt.trim() && !busy ? 'pointer' : 'default') as any }, prompt.trim() && !busy ? shadows.button : null]}
            >
              {busy ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="sparkles" size={16} color="#fff" />}
              <Text style={{ ...TYPOGRAPHY.button, fontSize: 15, color: '#fff' }}>{busy ? 'Drafting…' : 'Generate page'}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const st = StyleSheet.create({
  shadow: { shadowColor: '#2C2A3A', shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.22, shadowRadius: 40, elevation: 16 },
});
