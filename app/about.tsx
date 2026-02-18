import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { RADII, SPACING } from '../constants/onboarding-theme';

export default function AboutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, shadows, appStyles } = useTheme();

  const styles = useMemo(() => makeStyles(colors, shadows), [colors, shadows]);

  return (
    <View style={styles.container}>
      <View style={[appStyles.editHeader, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={appStyles.editBackButton} accessibilityLabel="Go back">
          <Ionicons name="chevron-back" size={22} color={colors.textDark} />
        </TouchableOpacity>
        <Text style={appStyles.editHeaderTitle}>About SchoolKit</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo / Icon */}
        <View style={[styles.iconCircle, { backgroundColor: colors.primary + '15' }]}>
          <Ionicons name="school" size={48} color={colors.primary} />
        </View>

        <Text style={[styles.appName, { color: colors.textDark }]}>SchoolKit</Text>

        {/* Mission */}
        <View style={[styles.card, { backgroundColor: colors.white, ...shadows.card }]}>
          <Text style={[styles.sectionLabel, { color: colors.textLight }]}>OUR MISSION</Text>
          <Text style={[styles.body, { color: colors.textDark }]}>
            Cancer survivors who are returning to school, their parents, and their education team need a centralized, accessible platform that addresses the shared educational and social challenges of re-entry — in order to support a smoother transition back into the school environment.
          </Text>
        </View>

        {/* Who it's for */}
        <View style={[styles.card, { backgroundColor: colors.white, ...shadows.card }]}>
          <Text style={[styles.sectionLabel, { color: colors.textLight }]}>WHO IT'S FOR</Text>
          {[
            { icon: 'school-outline' as const, label: 'Students', desc: 'Young cancer survivors navigating their return to school after treatment.' },
            { icon: 'people-outline' as const, label: 'Parents & Caregivers', desc: 'Families supporting their child through the re-entry process.' },
            { icon: 'briefcase-outline' as const, label: 'School Staff', desc: 'Teachers and staff creating an inclusive environment for returning students.' },
          ].map((item, i, arr) => (
            <View
              key={item.label}
              style={[
                styles.whoRow,
                i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderCard },
              ]}
            >
              <View style={[styles.whoIcon, { backgroundColor: colors.primary + '12' }]}>
                <Ionicons name={item.icon} size={20} color={colors.primary} />
              </View>
              <View style={styles.whoText}>
                <Text style={[styles.whoLabel, { color: colors.textDark }]}>{item.label}</Text>
                <Text style={[styles.whoDesc, { color: colors.textLight }]}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const makeStyles = (
  c: typeof import('../constants/theme').COLORS_LIGHT,
  s: typeof import('../constants/theme').SHADOWS_LIGHT,
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.appBackground,
    },
    scroll: {
      padding: SPACING.screenPadding,
      paddingBottom: 60,
      alignItems: 'center',
    },
    iconCircle: {
      width: 88,
      height: 88,
      borderRadius: 44,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
      marginTop: 8,
    },
    appName: {
      fontSize: 26,
      fontWeight: '800',
      marginBottom: 28,
      letterSpacing: 0.2,
    },
    card: {
      borderRadius: RADII.card,
      padding: 20,
      marginBottom: 20,
      width: '100%',
    },
    sectionLabel: {
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.9,
      marginBottom: 12,
    },
    body: {
      fontSize: 15,
      lineHeight: 24,
    },
    whoRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingVertical: 14,
      gap: 14,
    },
    whoIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    whoText: {
      flex: 1,
    },
    whoLabel: {
      fontSize: 15,
      fontWeight: '600',
      marginBottom: 3,
    },
    whoDesc: {
      fontSize: 13,
      lineHeight: 19,
    },
  });
