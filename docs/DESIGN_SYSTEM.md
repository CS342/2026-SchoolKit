# SchoolKit Design System

## Overview

The single source of truth for all design tokens is **`constants/onboarding-theme.ts`**. Every screen and component should import tokens from this file rather than defining inline values.

```ts
import {
  COLORS, GRADIENTS, SHADOWS, TYPOGRAPHY,
  SPACING, SIZING, RADII, BORDERS, ANIMATION,
  SHARED_STYLES, APP_STYLES, withOpacity,
} from '@/constants/onboarding-theme';
```

---

## Colors

### Brand

| Token | Value | Usage |
|---|---|---|
| `COLORS.primary` | `#7B68EE` | Primary purple used for buttons, links, accents |

### Text

| Token | Value | Usage |
|---|---|---|
| `COLORS.textDark` | `#2D2D44` | Primary text, headings |
| `COLORS.textMuted` | `#6B6B85` | Secondary text, subtitles |
| `COLORS.textLight` | `#8E8EA8` | Tertiary text, captions, placeholders |
| `COLORS.disabledText` | `#B0A8C8` | Disabled/inactive text |

### Backgrounds

| Token | Value | Usage |
|---|---|---|
| `COLORS.white` | `#FFFFFF` | Card backgrounds, base layer |
| `COLORS.backgroundLight` | `#F0EBFF` | Light purple tint (icon circles, badges) |
| `COLORS.backgroundLighter` | `#F5F3FF` | Lighter purple tint |
| `COLORS.inputBackground` | `#F8F5FF` | Text input backgrounds |
| `COLORS.appBackground` | `#FBF9FF` | Main app screen background |
| `COLORS.appBackgroundAlt` | `#F8F7FF` | Alternate app screen background |
| `COLORS.tabActiveBg` | `#EDE9FE` | Active tab indicator background |

### Borders

| Token | Value | Usage |
|---|---|---|
| `COLORS.border` | `#E8E0F0` | General borders, onboarding |
| `COLORS.borderCard` | `#E8E8F0` | Card borders, header dividers |
| `COLORS.borderPurple` | `#E8E0FF` | Purple-tinted borders |

### Role Colors

| Token | Value | Role |
|---|---|---|
| `COLORS.studentK8` | `#0EA5E9` | Student K-8 |
| `COLORS.studentHS` | `#7B68EE` | Student High School |
| `COLORS.parent` | `#EC4899` | Parent / Caregiver |
| `COLORS.staff` | `#66D9A6` | School Staff |

### Semantic

| Token | Value | Usage |
|---|---|---|
| `COLORS.accent` | `#F59E0B` | Accent highlights |
| `COLORS.info` | `#3B82F6` | Informational elements |
| `COLORS.error` | `#EF4444` | Error states, destructive actions |
| `COLORS.successBg` | `#D1FAE5` | Success background |
| `COLORS.successText` | `#065F46` | Success text |
| `COLORS.warningBg` | `#FEF3C7` | Warning background |
| `COLORS.warningText` | `#D97706` | Warning text |
| `COLORS.offlineText` | `#92400E` | Offline status text |

### Utility

| Token | Value | Usage |
|---|---|---|
| `COLORS.inputPlaceholder` | `#A8A8B8` | Input placeholder text |
| `COLORS.indicatorInactive` | `#C8C8D8` | Inactive step indicators |
| `COLORS.disabledButton` | `#D8D8E8` | Disabled button background |
| `COLORS.shadow` | `#000000` | Shadow base color |
| `COLORS.whiteOverlay75` | `rgba(255,255,255,0.75)` | White overlay 75% opacity |
| `COLORS.whiteOverlay80` | `rgba(255,255,255,0.8)` | White overlay 80% opacity |

### Password Strength

`PASSWORD_STRENGTH_COLORS` is an array indexed 0-4 mapping to password strength levels:

| Index | Value | Strength |
|---|---|---|
| 0 | `#EF4444` | Very weak |
| 1 | `#F59E0B` | Weak |
| 2 | `#EAB308` | Fair |
| 3 | `#22C55E` | Strong |
| 4 | `#16A34A` | Very strong |

---

## Gradients

All gradient values are `readonly` tuples used with `LinearGradient` `colors` prop.

| Token | Colors | Usage |
|---|---|---|
| `GRADIENTS.primaryButton` | `#7B68EE` -> `#9B6EE8` -> `#B06AE4` | Primary action buttons |
| `GRADIENTS.disabledButton` | `#D8D0E8` -> `#D0C8E0` | Disabled buttons |
| `GRADIENTS.welcomeHero` | `#7B68EE` -> `#9B59E8` -> `#C45CD6` | Welcome screen hero area |
| `GRADIENTS.screenBackground` | `#F8F5FF` -> `#FFFFFF` -> `#FFF5FA` | Onboarding screen backgrounds |
| `GRADIENTS.loadingScreen` | `#7B68EE` -> `#5B8DEE` -> `#0EA5E9` | Loading screen background |
| `GRADIENTS.authHeader` | `#7B68EE` -> `#8B60E8` -> `#B06AE4` | Auth screen headers |
| `GRADIENTS.progressFill` | `#7B68EE` -> `#9B6EE8` | Progress bar fills |
| `GRADIENTS.roleStudentK8` | `#0EA5E9` -> `#38BDF8` | Student K-8 role card |
| `GRADIENTS.roleStudentHS` | `#7B68EE` -> `#9B6EE8` | Student HS role card |
| `GRADIENTS.roleParent` | `#EC4899` -> `#F472B6` | Parent role card |
| `GRADIENTS.roleStaff` | `#66D9A6` -> `#86EFAC` | Staff role card |

---

## Typography

All presets include `fontSize` and `fontWeight`. Spread them into style objects.

```ts
<Text style={{ ...TYPOGRAPHY.h1, color: COLORS.textDark }}>Heading</Text>
```

| Preset | Size | Weight | Usage |
|---|---|---|---|
| `display` | 44 | 800 | Hero/splash display text (letterSpacing: -1) |
| `screenTitle` | 38 | 800 | Tab screen titles |
| `h1` | 30 | 800 | Onboarding page titles |
| `sectionTitle` | 28 | 800 | Section headings |
| `emptyTitle` | 26 | 800 | Empty state titles |
| `editTitle` | 24 | 800 | Edit screen header titles |
| `h2` | 24 | 700 | Secondary headings |
| `h3` | 22 | 700 | Tertiary headings |
| `input` | 22 | 700 | Text inputs |
| `button` | 19 | 800 | Primary button labels |
| `bodyLarge` | 18 | 600 | Large body text |
| `body` | 18 | 600 | Default body text |
| `buttonSmall` | 18 | 700 | Secondary button labels |
| `bodyDescription` | 17 | 500 | Descriptive/paragraph text |
| `bodySmall` | 16 | 600 | Small body text |
| `labelSmall` | 15 | 600 | Small labels |
| `caption` | 14 | 600 | Captions, metadata |

---

## Spacing

| Token | Value (px) | Usage |
|---|---|---|
| `SPACING.screenPadding` | 24 | Horizontal padding for screen edges |
| `SPACING.contentPadding` | 20 | Inner content padding |
| `SPACING.sectionGap` | 24 | Gap between major sections |
| `SPACING.itemGap` | 14 | Gap between list/grid items |
| `SPACING.smallGap` | 8 | Small gap between related elements |
| `SPACING.xs` | 4 | Minimal spacing |

---

## Sizing

### Icons

| Token | Value (px) | Usage |
|---|---|---|
| `SIZING.iconHero` | 56 | Hero/feature icons |
| `SIZING.iconPage` | 48 | Page-level icons |
| `SIZING.iconCard` | 24 | Card icons |
| `SIZING.iconRole` | 24 | Role selection icons |
| `SIZING.iconNav` | 22 | Navigation icons |
| `SIZING.iconButton` | 20 | Button icons |
| `SIZING.iconInput` | 20 | Input field icons |

### Circles

| Token | Value (px) | Usage |
|---|---|---|
| `SIZING.circleAvatar` | 120 | Profile avatar circle |
| `SIZING.circlePage` | 80 | Page header icon circle |
| `SIZING.circleResource` | 72 | Resource card icon circle |
| `SIZING.circleSettings` | 56 | Settings/profile icon circle |
| `SIZING.circleRole` | 52 | Role selection icon circle |
| `SIZING.circleCard` | 44 | General card icon circle |

---

## Radii

| Token | Value (px) | Usage |
|---|---|---|
| `RADII.headerBottom` | 32 | Rounded header bottom corners |
| `RADII.formCard` | 24 | Form cards, large containers |
| `RADII.cardLarge` | 24 | Large resource cards |
| `RADII.userCard` | 28 | User profile cards |
| `RADII.card` | 20 | Standard cards |
| `RADII.badge` | 20 | Pill-shaped badges |
| `RADII.button` | 16 | Buttons |
| `RADII.grid` | 16 | Grid items |
| `RADII.input` | 14 | Text inputs |
| `RADII.badgeSmall` | 10 | Small badges |

---

## Borders

| Token | Value (px) | Usage |
|---|---|---|
| `BORDERS.cardLarge` | 3 | Large/resource card borders |
| `BORDERS.cardSelected` | 2.5 | Selected card state |
| `BORDERS.card` | 2 | Default card borders |
| `BORDERS.input` | 1.5 | Input field borders |
| `BORDERS.backButton` | 1.5 | Back button outline |
| `BORDERS.innerGlow` | 1 | Subtle inner glow effect |

---

## Shadows

Each shadow preset is a complete style object (shadowColor, shadowOffset, shadowOpacity, shadowRadius, elevation).

```ts
<View style={[styles.card, SHADOWS.card]} />
```

| Preset | Color | Offset Y | Opacity | Radius | Elevation | Usage |
|---|---|---|---|---|---|---|
| `card` | `#2D2D44` | 4 | 0.06 | 12 | 4 | Default card shadow |
| `cardSelected` | `#7B68EE` | 6 | 0.25 | 16 | 8 | Selected/active card |
| `button` | `#7B68EE` | 8 | 0.40 | 20 | 8 | Primary buttons |
| `small` | `#7B68EE` | 4 | 0.12 | 8 | 4 | Subtle purple shadow |
| `header` | `#7B68EE` | 4 | 0.10 | 12 | 5 | Screen headers |
| `cardLarge` | `#000000` | 6 | 0.12 | 16 | 6 | Large resource cards |
| `iconCircle` | `#000000` | 2 | 0.10 | 4 | 3 | Icon circles |

---

## Animation

### Spring Configs

Used with `react-native-reanimated` `withSpring`.

| Token | Damping | Stiffness | Usage |
|---|---|---|---|
| `ANIMATION.springBouncy` | 20 | 180 | Bouncy entrance animations |
| `ANIMATION.springSmooth` | 22 | 120 | Smooth, subtle transitions |

### Delay Values

| Token | Value (ms) | Usage |
|---|---|---|
| `ANIMATION.entranceDelay` | 80 | Base delay before entrance animation |
| `ANIMATION.staggerDelay` | 100 | Delay between staggered items |
| `ANIMATION.fastStaggerDelay` | 50 | Faster stagger (e.g., grid items) |

---

## Shared Styles

### `SHARED_STYLES` (Onboarding Screens)

Pre-built `StyleSheet` styles for onboarding flow screens.

| Style | Purpose |
|---|---|
| `pageIconCircle` | 80x80 purple-tinted circle for page header icons |
| `pageTitle` | Large bold page title (30px / 800) |
| `pageSubtitle` | Muted subtitle below page title |
| `buttonContainer` | Bottom-pinned container for action buttons |
| `skipButton` | Touchable area for "Skip" action |
| `skipText` | "Skip" label styling |
| `skipPlaceholder` | Invisible spacer matching skip button height (for screens without skip) |
| `badge` | Pill-shaped badge container |
| `badgeText` | Badge label text |

### `APP_STYLES` (App Screens)

Pre-built `StyleSheet` styles for post-onboarding app screens.

| Style | Purpose |
|---|---|
| `tabHeader` | Full-width header for tab screens (safe area padding, bottom border, shadow) |
| `tabHeaderTitle` | Tab screen title (30px / 800) |
| `tabHeaderSubtitle` | Tab screen subtitle |
| `editHeader` | Row-layout header for edit screens (back button + title + save button) |
| `editHeaderTitle` | Edit screen header title |
| `editBackButton` | Circular back button with border |
| `editSaveButton` | Purple save button |
| `editSaveText` | Save button label |
| `editSaveButtonDisabled` | Disabled save button background |
| `editSaveTextDisabled` | Disabled save button text |
| `editScrollContent` | Scroll content padding for edit screens |
| `resourceCard` | Resource list card (row layout, bordered, shadowed) |
| `resourceIconCircle` | 72px icon circle inside resource cards |
| `selectableCard` | Selectable option card (edit-role, edit-topics, etc.) |
| `emptyState` | Centered empty state container |
| `emptyTitle` | Empty state heading |
| `emptyText` | Empty state description |
| `checkmarkCircle` | 34px circle for selection checkmarks |

---

## Utilities

### `withOpacity(color, opacity)`

Appends a hex alpha channel to any hex color string. Returns the color with opacity baked in.

```ts
withOpacity(COLORS.primary, 0.1)   // '#7B68EE1A'
withOpacity(COLORS.primary, 0.15)  // '#7B68EE26'
withOpacity(COLORS.primary, 0.2)   // '#7B68EE33'
withOpacity(COLORS.textDark, 0.05) // '#2D2D440D'
```

Common opacity mappings:

| Opacity | Hex | Typical use |
|---|---|---|
| 0.03 | `08` | Barely visible tint |
| 0.05 | `0D` | Subtle background tint |
| 0.08 | `14` | Light card selection tint |
| 0.10 | `1A` | Light borders, shadows |
| 0.15 | `26` | Medium tint |
| 0.20 | `33` | Visible overlay |

---

## Decorative Shapes

`DECORATIVE_SHAPES` provides positioned, semi-transparent circles for screen backgrounds.

| Key | Screen | Description |
|---|---|---|
| `welcome` | Welcome screen | White circles on dark gradient |
| `step` | Onboarding steps | Purple/pink circles on light gradient |
| `loading` | Loading screen | White circles on blue gradient |
| `auth` | Auth screens | Purple circles |
| `confirm` | Confirmation screen | Purple/pink circles |

Each shape has `size`, `color` (rgba), and absolute positioning (`top`/`bottom`/`left`/`right`).

---

## Conventions

### Use tokens for...

- All colors visible on screen (backgrounds, text, borders, shadows)
- All spacing, sizing, radius, and border width values
- Typography presets for font size and weight
- Shadow presets for elevation
- Animation spring configs and delay values

### Do NOT tokenize (intentionally hardcoded)...

- **Data-array colors**: Role colors in onboarding data arrays, grade-level colors, topic colors. These are per-item identity colors defined alongside the data.
- **`understanding-cancer.tsx` flashcard pastels**: Unique pastel palette specific to that educational content.
- **`rgba()` overlays on gradients**: The `DECORATIVE_SHAPES` values use rgba with low opacity for layering on gradient backgrounds. These are tightly coupled to specific gradient contexts.
- **One-off layout values**: Screen-specific paddings or sizes that don't repeat across screens.

### Import pattern

Always use the `@/` alias:

```ts
import { COLORS, TYPOGRAPHY, SPACING } from '@/constants/onboarding-theme';
```

Import only what you need. The full list of exports:

```
COLORS, GRADIENTS, SHADOWS, TYPOGRAPHY, SPACING, SIZING, RADII, BORDERS,
ANIMATION, SHARED_STYLES, APP_STYLES, PASSWORD_STRENGTH_COLORS,
DECORATIVE_SHAPES, withOpacity
```
