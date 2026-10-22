import React, { useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Modal,
  Image,
} from "react-native";
import { ScreenHeader } from "../../components/ui";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useOnboarding } from "../../contexts/OnboardingContext";
import { useAuth } from "../../contexts/AuthContext";
import { useAccomplishments } from "../../contexts/AccomplishmentContext";
import { useStories } from "../../contexts/StoriesContext";
import { useResources, useVisibleTopics, matchesSavedTopic } from "../../hooks/useResources";
import { TOTAL_PIECES } from "../../constants/accomplishments";
import { SHOW_KNOWLEDGE_TREE, SHOW_PUZZLES } from "../../constants/features";
import {
  RADII,
  SIZING,
  SPACING,
  BORDERS,
  ANIMATION,
} from "../../constants/onboarding-theme";
import { useTheme } from "../../contexts/ThemeContext";
import { useResponsive, CONTENT_WIDTH } from "../../hooks/useResponsive";
import type { AppTheme, ThemeColors, ThemeShadows } from "../../constants/theme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function SettingRow({
  icon,
  label,
  value,
  onPress,
  isLast = false,
  tint,
  theme,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress: () => void;
  isLast?: boolean;
  tint?: string;
  theme: AppTheme;
}) {
  const scale = useSharedValue(1);
  const { colors } = theme;

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withTiming(0.98, { duration: 80 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, ANIMATION.springBouncy);
      }}
      style={[styles.row, pressStyle]}
    >
      <View style={[styles.rowIconWrap, { backgroundColor: tint || colors.backgroundLight }]}>
        <Ionicons
          name={icon}
          size={18}
          color={tint ? '#FFFFFF' : colors.primary}
        />
      </View>
      <View style={[styles.rowBody, !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderCard }]}>
        <Text style={[styles.rowLabel, { color: colors.textDark }]}>{label}</Text>
        <View style={styles.rowRight}>
          {value ? (
            <Text style={[styles.rowValue, { color: colors.textLight }]}>
              {value}
            </Text>
          ) : null}
          <Ionicons name="chevron-forward" size={18} color={colors.indicatorInactive} />
        </View>
      </View>
    </AnimatedPressable>
  );
}

function AnimatedSection({
  children,
  delay,
}: {
  children: React.ReactNode;
  delay: number;
}) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(24);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
    translateY.value = withDelay(
      delay,
      withSpring(0, ANIMATION.springSmooth)
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
}

/**
 * Web-only vertical progress stat card. Shows a REAL, computed value / total
 * (never fabricated) with a mini progress bar — same numbers the For You and
 * Knowledge Tree screens display. Native rendering never uses this.
 */
function WebStatCard({
  icon,
  tint,
  glassTint,
  title,
  subtitle,
  value,
  total,
  onPress,
  colors,
  shadows,
  isDark,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  glassTint: string;
  title: string;
  subtitle: string;
  value: number;
  total: number;
  onPress: () => void;
  colors: ThemeColors;
  shadows: ThemeShadows;
  isDark: boolean;
}) {
  const hasTotal = total > 0;
  const pct = hasTotal ? Math.min(100, Math.round((value / total) * 100)) : 0;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.webStatCard,
        shadows.card,
        pressed && { transform: [{ scale: 0.98 }] },
      ]}
    >
      <LinearGradient
        colors={isDark ? ['rgba(28,28,46,0.9)', glassTint] : ['rgba(255,255,255,0.9)', glassTint]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.webStatGlass}
      >
        <View style={styles.webStatTop}>
          <View style={[styles.webStatIcon, { backgroundColor: tint, ...styles.iconGlow, shadowColor: tint }]}>
            <Ionicons name={icon} size={24} color="#FFFFFF" />
          </View>
          <View style={[styles.journalArrow, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.5)', borderColor: colors.border }]}>
            <Ionicons name="arrow-forward" size={16} color={tint} />
          </View>
        </View>
        <Text style={[styles.webStatTitle, { color: colors.textDark }]}>{title}</Text>
        {hasTotal && (
          <>
            <View style={styles.webStatValueRow}>
              <Text style={[styles.webStatValue, { color: colors.textDark }]}>{value}</Text>
              <Text style={[styles.webStatTotal, { color: colors.textMuted }]}>/ {total}</Text>
            </View>
            <View style={[styles.webStatTrack, { backgroundColor: colors.backgroundLighter }]}>
              <View style={[styles.webStatFill, { width: `${pct}%`, backgroundColor: tint }]} />
            </View>
          </>
        )}
        <Text style={[styles.webStatSubtitle, { color: colors.textMuted }]}>{subtitle}</Text>
      </LinearGradient>
    </Pressable>
  );
}


export default function ProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { colors, shadows, appStyles, isDark } = theme;
  const { data, updateProfilePicture, bookmarks } = useOnboarding();
  const { user, isAnonymous } = useAuth();
  const { stories, storyBookmarks } = useStories();
  const { fireEvent, earnedPieceIds, isResourceFullyViewed } = useAccomplishments();
  const { resources } = useResources();

  const { isWeb, isDesktop } = useResponsive();
  const isWebDesktop = isWeb && isDesktop;

  // ── Real progress numbers (never fabricated) ──────────────────────────────
  // Identical to the For You / Knowledge Tree computations so Profile shows the
  // same "X / total": puzzles = earned pieces, tree = fully-viewed resources.
  const puzzlesEarned = earnedPieceIds.size;
  const treeResources = useMemo(() => resources.filter(r => !r.designOnly), [resources]);
  const treeLit = useMemo(
    () => treeResources.filter(r => isResourceFullyViewed(r.id)).length,
    [treeResources, isResourceFullyViewed]
  );
  const visibleTopics = useVisibleTopics();
  const selectedTopics = useMemo(
    () => visibleTopics.filter(t => data.topics.some(s => matchesSavedTopic(s, { id: t.id, title: t.label }))),
    [visibleTopics, data.topics]
  );

  const myStoriesCount = stories.filter(s => s.author_id === user?.id).length;
  const savedCount = bookmarks.length + storyBookmarks.length;
  const [showEditProfile, setShowEditProfile] = React.useState(false);
  const [showIconPicker, setShowIconPicker] = React.useState(false);

  const AVATAR_OPTIONS = [
    { key: 'icon:star',    icon: 'star'    as const, label: t('profile.avatar.star')    },
    { key: 'icon:heart',   icon: 'heart'   as const, label: t('profile.avatar.heart')   },
    { key: 'icon:sparkles', icon: 'sparkles' as const, label: t('profile.avatar.sparkle') },
    { key: 'icon:initial', icon: null,                label: t('profile.avatar.initial') },
  ] as const;

  function renderAvatarInner(size = 88) {
    const pic = data.profilePicture;
    if (!pic || pic === 'icon:initial') {
      return <Text style={[styles.avatarInitial, { fontSize: size * 0.41, color: '#FFFFFF' }]}>{data.name.charAt(0).toUpperCase()}</Text>;
    }
    if (pic.startsWith('icon:')) {
      return <Ionicons name={pic.replace('icon:', '') as any} size={size * 0.45} color="#FFFFFF" />;
    }
    return <Image source={{ uri: pic }} style={[styles.avatarImage, { width: size, height: size, borderRadius: size / 2 }]} />;
  }

  // Avatar entrance
  const avatarScale = useSharedValue(0);
  const avatarOpacity = useSharedValue(0);
  const nameOpacity = useSharedValue(0);
  const nameTranslateY = useSharedValue(12);
  const footerOpacity = useSharedValue(0);

  useEffect(() => {
    avatarOpacity.value = withDelay(80, withTiming(1, { duration: 300 }));
    avatarScale.value = withDelay(80, withSpring(1, ANIMATION.springBouncy));
    nameOpacity.value = withDelay(200, withTiming(1, { duration: 350 }));
    nameTranslateY.value = withDelay(200, withSpring(0, ANIMATION.springSmooth));
    footerOpacity.value = withDelay(700, withTiming(1, { duration: 500 }));
  }, []);

  const avatarStyle = useAnimatedStyle(() => ({
    opacity: avatarOpacity.value,
    transform: [{ scale: avatarScale.value }],
  }));
  const nameStyle = useAnimatedStyle(() => ({
    opacity: nameOpacity.value,
    transform: [{ translateY: nameTranslateY.value }],
  }));
  const footerStyle = useAnimatedStyle(() => ({
    opacity: footerOpacity.value,
  }));

  const roleDisplayName = data.role ? t(`profile.roleOptions.${data.role}`) : t('profile.notSet');

  return (
    <View style={[styles.container, { backgroundColor: colors.appBackground }]}>
      <ScreenHeader title={t('profile.title')} subtitle={t('profile.headerSubtitle')} />

      <ScrollView
        contentContainerStyle={isWebDesktop ? styles.scrollWeb : styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Edit Profile Modal */}
        <Modal
          visible={showEditProfile}
          animationType="slide"
          transparent
          onRequestClose={() => setShowEditProfile(false)}
        >
          <View style={styles.modalOverlay}>
            <Pressable style={styles.modalBackdrop} onPress={() => setShowEditProfile(false)} />
            <View style={[styles.editModalContent, { backgroundColor: colors.white, paddingBottom: insets.bottom + 16 }]}>
              <View style={[styles.editModalHandle, { backgroundColor: colors.border }]} />
              <Text style={[styles.editModalTitle, { color: colors.textDark }]}>{t('profile.editProfile')}</Text>
              <View style={[styles.groupCard, { backgroundColor: colors.appBackground, marginHorizontal: 0, marginBottom: 0 }]}>
                <SettingRow icon="person-outline" label={t('profile.name')} value={data.name} onPress={() => { setShowEditProfile(false); router.push("/edit-name"); }} theme={theme} />
                <SettingRow icon="school-outline" label={t('profile.role')} value={roleDisplayName} onPress={() => { setShowEditProfile(false); router.push("/edit-role"); }} theme={theme} />
                <SettingRow icon="book-outline" label={t('profile.schoolStatus')} value={data.schoolStatuses.length > 0 ? t('profile.selectedCount', { count: data.schoolStatuses.length }) : t('profile.notSet')} onPress={() => { setShowEditProfile(false); router.push("/edit-school-status"); }} theme={theme} />
                <SettingRow icon="list-outline" label={t('profile.topics')} value={t('profile.selectedCount', { count: selectedTopics.length })} onPress={() => { setShowEditProfile(false); router.push("/edit-topics"); }} isLast theme={theme} />
              </View>
            </View>
          </View>
        </Modal>

        {/* Icon picker modal */}
        <Modal
          visible={showIconPicker}
          animationType="slide"
          transparent
          onRequestClose={() => setShowIconPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <Pressable style={styles.modalBackdrop} onPress={() => setShowIconPicker(false)} />
            <View style={[styles.editModalContent, { backgroundColor: colors.white, paddingBottom: insets.bottom + 24 }]}>
              <View style={[styles.editModalHandle, { backgroundColor: colors.border }]} />
              <Text style={[styles.editModalTitle, { color: colors.textDark }]}>{t('profile.chooseAvatar')}</Text>
              <View style={styles.iconPickerGrid}>
                {AVATAR_OPTIONS.map((opt) => {
                  const isSelected = (data.profilePicture ?? 'icon:initial') === opt.key;
                  return (
                    <Pressable
                      key={opt.key}
                      onPress={async () => { await updateProfilePicture(opt.key); setShowIconPicker(false); }}
                      style={[styles.iconPickerItem, isSelected && { borderColor: colors.primary, borderWidth: 2.5 }, { backgroundColor: colors.backgroundLight }]}
                    >
                      <View style={[styles.iconPickerCircle, { backgroundColor: colors.primary }]}>
                        {opt.icon ? (
                          <Ionicons name={opt.icon} size={32} color="#FFFFFF" />
                        ) : (
                          <Text style={[styles.avatarInitial, { fontSize: 32, color: '#FFFFFF' }]}>{data.name.charAt(0).toUpperCase()}</Text>
                        )}
                      </View>
                      <Text style={[styles.iconPickerLabel, { color: colors.textDark }]}>{opt.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        </Modal>

        {isWebDesktop ? (
          <View style={styles.webShell}>
            <View style={styles.webColumns}>
              <View style={styles.webLeft}>
                <LinearGradient
                  colors={isDark ? ['rgba(123,104,238,0.18)', 'rgba(123,104,238,0.04)'] : ['rgba(123,104,238,0.10)', 'rgba(123,104,238,0.02)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.identityCard, styles.webIdentityCard, { borderColor: colors.border }]}
                >
                  <View style={styles.webIdentity}>
                    <Pressable onPress={() => setShowIconPicker(true)}>
                      <Animated.View style={avatarStyle}>
                        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                          {renderAvatarInner()}
                        </View>
                        <View style={[styles.cameraBadge, { backgroundColor: colors.primary, borderColor: colors.appBackground }]}>
                          <Ionicons name="pencil" size={13} color="#FFFFFF" />
                        </View>
                      </Animated.View>
                    </Pressable>

                    <Animated.View style={[styles.webIdentityText, nameStyle]}>
                      <Text style={[styles.userName, styles.webUserName, { color: colors.textDark }]}>{data.name}</Text>
                      <View style={[styles.badgeWrapRow, styles.webBadgeRow]}>
                        {isAnonymous && (
                          <View style={[styles.rolePill, { backgroundColor: colors.borderCard }]}>
                            <Text style={[styles.rolePillText, { color: colors.textMuted }]}>{t('profile.guest')}</Text>
                          </View>
                        )}
                        <View style={[styles.rolePill, { backgroundColor: colors.backgroundLight }]}>
                          <Text style={[styles.rolePillText, { color: colors.primary }]}>{roleDisplayName}</Text>
                        </View>
                        {data.schoolStatuses.length > 0 && data.schoolStatuses.map((status: string) => {
                          const label = t(`profile.statusOptions.${status}`, status.replace(/-/g, ' '));
                          return (
                            <View key={status} style={[styles.rolePill, { backgroundColor: colors.backgroundLight }]}>
                              <Text style={[styles.rolePillText, { color: colors.primary }]}>{label}</Text>
                            </View>
                          );
                        })}
                      </View>
                      <View style={[styles.statsRow, styles.webStatsRow, { borderTopColor: colors.borderCard }]}>
                        <View style={styles.webStatBlock}>
                          <Text style={[styles.statNumber, { color: colors.textDark }]}>{myStoriesCount}</Text>
                          <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t('profile.statStories')}</Text>
                        </View>
                        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                        <View style={styles.webStatBlock}>
                          <Text style={[styles.statNumber, { color: colors.textDark }]}>{savedCount}</Text>
                          <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t('profile.statSaved')}</Text>
                        </View>
                      </View>

                      <Pressable
                        onPress={() => setShowEditProfile(true)}
                        style={[styles.editProfileBtn, styles.webEditProfileBtn, { borderColor: colors.border }]}
                      >
                        <Ionicons name="pencil-outline" size={13} color={colors.textMuted} />
                        <Text style={[styles.editProfileBtnText, { color: colors.textMuted }]}>{t('profile.editProfile')}</Text>
                      </Pressable>
                    </Animated.View>
                  </View>
                </LinearGradient>

                {selectedTopics.length > 0 && (
                  <AnimatedSection delay={420}>
                    <Text style={[styles.sectionLabel, styles.webSectionLabel, { color: colors.textLight }]}>{t('profile.sectionInterests')}</Text>
                    <View style={[styles.webPanel, { backgroundColor: colors.white, borderColor: colors.border }]}>
                      <View style={styles.webTopicsWrap}>
                        {selectedTopics.map((topic) => (
                          <View key={topic.label} style={[styles.webTopicChip, { backgroundColor: colors.backgroundLight }]}>
                            <Ionicons name={topic.icon as any} size={13} color={topic.color} />
                            <Text style={[styles.webTopicChipText, { color: colors.textDark }]} numberOfLines={1}>{topic.label}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </AnimatedSection>
                )}
              </View>

              <View style={styles.webRight}>
                {(SHOW_PUZZLES || SHOW_KNOWLEDGE_TREE) && (
                <AnimatedSection delay={460}>
                  <Text style={[styles.sectionLabel, styles.webSectionLabel, { color: colors.textLight }]}>{t('profile.sectionProgress')}</Text>

                  <View style={styles.webProgressRow}>
                    {SHOW_KNOWLEDGE_TREE && (
                    <WebStatCard
                      icon="leaf"
                      tint="#10B981"
                      glassTint="rgba(16, 185, 129, 0.15)"
                      title={t('profile.knowledgeTree')}
                      subtitle={t('profile.conceptsExplored')}
                      value={treeLit}
                      total={treeResources.length}
                      onPress={() => router.push('/knowledge-tree' as any)}
                      colors={colors}
                      shadows={shadows}
                      isDark={isDark}
                    />
                    )}
                    {SHOW_PUZZLES && (
                    <WebStatCard
                      icon="extension-puzzle"
                      tint="#F59E0B"
                      glassTint="rgba(245, 158, 11, 0.15)"
                      title={t('profile.myPuzzles')}
                      subtitle={t('profile.piecesEarned')}
                      value={puzzlesEarned}
                      total={TOTAL_PIECES}
                      onPress={() => router.push('/accomplishments' as any)}
                      colors={colors}
                      shadows={shadows}
                      isDark={isDark}
                    />
                    )}
                  </View>
                </AnimatedSection>
                )}

                <AnimatedSection delay={500}>
                  <Text style={[styles.sectionLabel, styles.webSectionLabel, { color: colors.textLight }]}>{t('profile.sectionJournal')}</Text>

                  <Pressable
                    onPress={() => router.push("/journal")}
                    style={({ pressed }) => [
                      styles.journalWidget,
                      styles.webCard,
                      shadows.card,
                      pressed && { transform: [{ scale: 0.98 }] }
                    ]}
                  >
                    <LinearGradient
                      colors={isDark ? ['rgba(28,28,46,0.9)', 'rgba(123, 104, 238, 0.15)'] : ['rgba(255,255,255,0.9)', 'rgba(123, 104, 238, 0.15)']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.journalGlass}
                    >
                      <View style={[styles.journalIconContainer, { backgroundColor: colors.primary, ...styles.iconGlow, shadowColor: colors.shadow }]}>
                        <Ionicons name="journal" size={28} color="#FFFFFF" />
                      </View>
                      <View style={styles.journalInfo}>
                        <Text style={[styles.journalTitle, { color: colors.textDark }]}>{t('profile.notebookLibrary')}</Text>
                        <Text style={[styles.journalCount, { color: colors.textMuted }]}>{t('profile.notebookSubtitle')}</Text>
                      </View>
                      <View style={[styles.journalArrow, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.5)', borderColor: colors.border }]}>
                        <Ionicons name="arrow-forward" size={18} color={colors.primary} />
                      </View>
                    </LinearGradient>
                  </Pressable>
                </AnimatedSection>
              </View>
            </View>

            <Animated.View style={[styles.footer, styles.webFooter, footerStyle]}>
              <Text style={[styles.footerText, { color: colors.indicatorInactive }]}>SchoolKit v{Constants.expoConfig?.version ?? '1.0.0'}</Text>
            </Animated.View>
          </View>
        ) : (
          <>
            <LinearGradient
              colors={isDark ? ['rgba(123,104,238,0.18)', 'rgba(123,104,238,0.04)'] : ['rgba(123,104,238,0.10)', 'rgba(123,104,238,0.02)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.identityCard, { borderColor: colors.border }]}
            >
            <View style={styles.identity}>
              <Pressable onPress={() => setShowIconPicker(true)}>
                <Animated.View style={avatarStyle}>
                  <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                    {renderAvatarInner()}
                  </View>
                  <View style={[styles.cameraBadge, { backgroundColor: colors.primary, borderColor: colors.appBackground }]}>
                    <Ionicons name="pencil" size={13} color="#FFFFFF" />
                  </View>
                </Animated.View>
              </Pressable>

              <Animated.View style={[styles.identityText, nameStyle]}>
                <Text style={[styles.userName, { color: colors.textDark }]}>{data.name}</Text>
                <View style={styles.badgeWrapRow}>
                  {isAnonymous && (
                    <View style={[styles.rolePill, { backgroundColor: colors.borderCard }]}>
                      <Text style={[styles.rolePillText, { color: colors.textMuted }]}>{t('profile.guest')}</Text>
                    </View>
                  )}
                  <View style={[styles.rolePill, { backgroundColor: colors.backgroundLight }]}>
                    <Text style={[styles.rolePillText, { color: colors.primary }]}>{roleDisplayName}</Text>
                  </View>
                  {data.schoolStatuses.length > 0 && data.schoolStatuses.map((status: string) => {
                    const label = t(`profile.statusOptions.${status}`, status.replace(/-/g, ' '));
                    return (
                      <View key={status} style={[styles.rolePill, { backgroundColor: colors.backgroundLight }]}>
                        <Text style={[styles.rolePillText, { color: colors.primary }]}>{label}</Text>
                      </View>
                    );
                  })}
                </View>
                <View style={[styles.statsRow, { borderTopColor: colors.borderCard }]}>
                  <View style={styles.statItem}>
                    <Text style={[styles.statNumber, { color: colors.textDark }]}>{myStoriesCount}</Text>
                    <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t('profile.statStories')}</Text>
                  </View>
                  <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.statItem}>
                    <Text style={[styles.statNumber, { color: colors.textDark }]}>{savedCount}</Text>
                    <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t('profile.statSaved')}</Text>
                  </View>
                </View>

                <Pressable
                  onPress={() => setShowEditProfile(true)}
                  style={[styles.editProfileBtn, { borderColor: colors.border }]}
                >
                  <Ionicons name="pencil-outline" size={13} color={colors.textMuted} />
                  <Text style={[styles.editProfileBtnText, { color: colors.textMuted }]}>{t('profile.editProfile')}</Text>
                </Pressable>
              </Animated.View>
            </View>
            </LinearGradient>

            {(SHOW_PUZZLES || SHOW_KNOWLEDGE_TREE) && (
            <AnimatedSection delay={460}>
              <Text style={[styles.sectionLabel, { color: colors.textLight }]}>{t('profile.sectionProgress')}</Text>

              {SHOW_KNOWLEDGE_TREE && (
              <Pressable
                onPress={() => router.push('/knowledge-tree' as any)}
                style={({ pressed }) => [
                  styles.journalWidget,
                  { marginBottom: 16 },
                  shadows.card,
                  pressed && { transform: [{ scale: 0.98 }] }
                ]}
              >
                <LinearGradient
                  colors={isDark ? ['rgba(28,28,46,0.9)', 'rgba(16, 185, 129, 0.15)'] : ['rgba(255,255,255,0.9)', 'rgba(16, 185, 129, 0.15)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.journalGlass}
                >
                  <View style={[styles.journalIconContainer, { backgroundColor: '#10B981', ...styles.iconGlow, shadowColor: '#10B981' }]}>
                    <Ionicons name="leaf" size={28} color="#FFFFFF" />
                  </View>
                  <View style={styles.journalInfo}>
                    <Text style={[styles.journalTitle, { color: colors.textDark }]}>{t('profile.knowledgeTree')}</Text>
                    <Text style={[styles.journalCount, { color: colors.textMuted }]}>{t('profile.exploreConcepts')}</Text>
                  </View>
                  <View style={[styles.journalArrow, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.5)', borderColor: colors.border }]}>
                    <Ionicons name="arrow-forward" size={18} color="#10B981" />
                  </View>
                </LinearGradient>
              </Pressable>
              )}

              {SHOW_PUZZLES && (
              <Pressable
                onPress={() => router.push('/accomplishments' as any)}
                style={({ pressed }) => [
                  styles.journalWidget,
                  { marginBottom: 24 },
                  shadows.card,
                  pressed && { transform: [{ scale: 0.98 }] }
                ]}
              >
                <LinearGradient
                  colors={isDark ? ['rgba(28,28,46,0.9)', 'rgba(245, 158, 11, 0.15)'] : ['rgba(255,255,255,0.9)', 'rgba(245, 158, 11, 0.15)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.journalGlass}
                >
                  <View style={[styles.journalIconContainer, { backgroundColor: '#F59E0B', ...styles.iconGlow, shadowColor: '#F59E0B' }]}>
                    <Ionicons name="extension-puzzle" size={28} color="#FFFFFF" />
                  </View>
                  <View style={styles.journalInfo}>
                    <Text style={[styles.journalTitle, { color: colors.textDark }]}>{t('profile.myPuzzles')}</Text>
                    <Text style={[styles.journalCount, { color: colors.textMuted }]}>{t('profile.viewAccomplishments')}</Text>
                  </View>
                  <View style={[styles.journalArrow, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.5)', borderColor: colors.border }]}>
                    <Ionicons name="arrow-forward" size={18} color="#F59E0B" />
                  </View>
                </LinearGradient>
              </Pressable>
              )}
            </AnimatedSection>
            )}

            <AnimatedSection delay={500}>
              <Text style={[styles.sectionLabel, { color: colors.textLight }]}>{t('profile.sectionJournal')}</Text>

              <Pressable
                onPress={() => router.push("/journal")}
                style={({ pressed }) => [
                  styles.journalWidget,
                  shadows.card,
                  pressed && { transform: [{ scale: 0.98 }] }
                ]}
              >
                <LinearGradient
                  colors={isDark ? ['rgba(28,28,46,0.9)', 'rgba(123, 104, 238, 0.15)'] : ['rgba(255,255,255,0.9)', 'rgba(123, 104, 238, 0.15)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.journalGlass}
                >


                  <View style={[styles.journalIconContainer, { backgroundColor: colors.primary, ...styles.iconGlow, shadowColor: colors.shadow }]}>
                    <Ionicons name="journal" size={28} color="#FFFFFF" />
                  </View>
                  <View style={styles.journalInfo}>
                    <Text style={[styles.journalTitle, { color: colors.textDark }]}>{t('profile.notebookLibrary')}</Text>
                  </View>
                  <View style={[styles.journalArrow, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.5)', borderColor: colors.border }]}>
                    <Ionicons name="arrow-forward" size={18} color={colors.primary} />
                  </View>
                </LinearGradient>
              </Pressable>
            </AnimatedSection>

            <Animated.View style={[styles.footer, footerStyle]}>
              <Text style={[styles.footerText, { color: colors.indicatorInactive }]}>SchoolKit v{Constants.expoConfig?.version ?? '1.0.0'}</Text>
            </Animated.View>
          </>
        )}
      </ScrollView>
      {/* Modals removed to settings sheet */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingBottom: 48,
  },
  identityCard: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 24,
    borderWidth: 1,
  },
  identity: {
    alignItems: "center",
    paddingTop: 32,
    paddingBottom: 28,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  avatarInitial: {
    fontSize: 36,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  cameraBadge: {
    position: "absolute",
    bottom: 0,
    right: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
  },
  identityText: {
    alignItems: "center",
    marginTop: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  badgeWrapRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 24,
  },
  rolePill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 100,
  },
  rolePillText: {
    fontSize: 13,
    fontWeight: "600",
  },
  schoolStatusText: {
    fontSize: 13,
    fontWeight: "400",
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 24,
  },
  topicsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 16,
  },
  topicChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
  },
  topicChipText: {
    fontSize: 12,
    fontWeight: "500",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 32,
  },
  statItem: {
    alignItems: "center",
    gap: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  statDivider: {
    width: 1,
    height: 28,
  },
  editProfileBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 100,
    borderWidth: 1,
  },
  editProfileBtnText: {
    fontSize: 13,
    fontWeight: "500",
  },
  editModalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  editModalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  editModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
    paddingLeft: 4,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: SPACING.screenPadding + 4,
  },
  groupCard: {
    marginHorizontal: SPACING.screenPadding,
    borderRadius: 16,
    marginBottom: 24,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 14,
    paddingRight: 16,
    minHeight: 52,
  },
  rowIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  rowBody: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginLeft: 12,
    paddingVertical: 14,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: "500",
    flexShrink: 0,
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexShrink: 1,
    marginLeft: 12,
  },
  rowValue: {
    fontSize: 15,
    fontWeight: "400",
    flexShrink: 1,
    textAlign: "right",
  },
  footer: {
    alignItems: "center",
    paddingTop: 8,
  },
  footerText: {
    fontSize: 13,
    fontWeight: "500",
  },
  journalWidget: {
    marginHorizontal: 24,
    borderRadius: 24,
    marginBottom: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
  },
  journalGlass: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
  },
  journalIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  journalInfo: {
    flex: 1,
  },
  journalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  journalCount: {
    fontSize: 14,
    fontWeight: '500',
  },
  journalArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  iconGlow: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 4,
  },
  iconPickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    paddingVertical: 8,
  },
  iconPickerItem: {
    width: 120,
    alignItems: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconPickerCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPickerLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  scrollWeb: {
    paddingBottom: 48,
  },
  webShell: {
    width: '100%' as any,
    maxWidth: CONTENT_WIDTH.app,
    alignSelf: 'center',
    paddingHorizontal: 32,
    paddingTop: 28,
    paddingBottom: 8,
  },
  webColumns: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 28,
  },
  webLeft: {
    width: 320,
  },
  webRight: {
    flex: 1,
  },
  // ── Left identity card (web, left-aligned) ──────────────────────────────
  webIdentityCard: {
    marginHorizontal: 0,
    marginTop: 0,
    marginBottom: 20,
    borderRadius: 24,
  },
  webIdentity: {
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
  },
  webIdentityText: {
    alignItems: 'flex-start',
    alignSelf: 'stretch',
    marginTop: 16,
  },
  webUserName: {
    marginBottom: 4,
  },
  webBadgeRow: {
    justifyContent: 'flex-start',
    paddingHorizontal: 0,
    marginTop: 6,
  },
  webStatsRow: {
    alignSelf: 'stretch',
    justifyContent: 'flex-start',
    gap: 28,
  },
  webStatBlock: {
    alignItems: 'flex-start',
    gap: 2,
  },
  webEditProfileBtn: {
    alignSelf: 'flex-start',
  },
  // ── Left panels (interests + account) ───────────────────────────────────
  webPanel: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    marginBottom: 20,
  },
  webAccountPanel: {
    padding: 0,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  webTopicsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  webTopicChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 100,
    maxWidth: '100%' as any,
  },
  webTopicChipText: {
    fontSize: 13,
    fontWeight: '500',
    flexShrink: 1,
  },
  // ── Right progress stat cards ───────────────────────────────────────────
  webProgressRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  webStatCard: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
  },
  webStatGlass: {
    padding: 18,
  },
  webStatTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  webStatIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  webStatTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  webStatValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
    marginBottom: 12,
  },
  webStatValue: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  webStatTotal: {
    fontSize: 16,
    fontWeight: '600',
  },
  webStatTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  webStatFill: {
    height: '100%',
    borderRadius: 4,
  },
  webStatSubtitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  webCard: {
    marginHorizontal: 0,
    marginBottom: 0,
    borderWidth: 0,
  },
  webSectionLabel: {
    marginLeft: 4,
  },
  webFooter: {
    marginTop: 12,
    paddingTop: 16,
  },
});
