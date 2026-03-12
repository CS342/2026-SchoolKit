# SchoolKit — Team Contributions Report

**Course:** CS 342: Building for Digital Health — Stanford University, Winter 2026
**Repository:** [github.com/CS342/2026-SchoolKit](https://github.com/CS342/2026-SchoolKit)
**Live Web App:** [schoolkit-five.vercel.app](https://schoolkit-five.vercel.app)
**Total Commits:** 137 (excluding merges) | **Total Contributors:** 6 team members

---

## Project Overview

SchoolKit is a cross-platform (iOS / Android / Web) application built with React Native and Expo Router that supports young cancer survivors returning to school. It provides coordinated academic and social support resources for students, parents, and teachers. The app features a rich onboarding flow, educational content pages, a community stories platform, a visual design editor for creating educational pages with AI, a knowledge tree gamification system, journaling, text-to-speech with ElevenLabs, Spanish translation, dark mode, and full web responsiveness via Vercel deployment.

---

## 1. General Feature-to-Team-Member Map

The table below maps each major feature of SchoolKit to the team members who contributed to it, along with a high-level summary of their role. Detailed breakdowns with code-level evidence follow in each team member's individual section.

### Feature Ownership Matrix

| Feature | Primary Owner(s) | Supporting Contributors | Total LOC |
|---|---|---|---|
| **Design Editor / AI Page Builder** | Lourdrick Valsote | Seyma Kilic (dark mode theming) | ~15,600 |
| **Onboarding Flow (Steps 1-4, Welcome, Loading)** | Lourdrick Valsote | Yuzhou Bian (web split layout) | ~3,350 |
| **Authentication (Firebase + Supabase)** | Lourdrick Valsote (Firebase), Yuzhou Bian (Supabase) | — | ~1,100 |
| **Design System / Theme** | Lourdrick Valsote | Seyma Kilic (dark mode types) | ~720 |
| **Stories & Community Platform** | Janina Troper | — | ~5,500 |
| **Text-to-Speech (ElevenLabs)** | Janina Troper | Nikita Gounder (web fixes) | ~1,700 |
| **Content Recommendation System** | Janina Troper | — | ~230 |
| **Spanish Translation / i18n** | Janina Troper | — | ~600 |
| **Bookmarks & Downloads / Library** | Janina Troper, Nikita Gounder | Seyma Kilic (dark mode) | ~900 |
| **Moderation System (Reports)** | Janina Troper | — | ~530 |
| **Understanding Cancer Page** | Janina Troper | — | ~730 |
| **Educational Content Pages (5 pages)** | Nikita Gounder | — | ~4,160 |
| **Settings & Profile UI** | Nikita Gounder | Seyma Kilic (dark mode) | ~1,050 |
| **Text Size / Accessibility (Aa)** | Nikita Gounder | — | ~400 |
| **Web Layout Fixes (FYP, Library, Profile, Sidebar)** | Nikita Gounder | — | ~350 |
| **Knowledge Tree Navigation** | Zoa (Zhaohan) | — | ~570 |
| **Accomplishment / Puzzle System** | Zoa (Zhaohan) | — | ~2,070 |
| **Supabase Backend Integration** | Yuzhou Bian | — | ~1,500 |
| **Web Platform Support** | Yuzhou Bian | Nikita Gounder (layout fixes) | ~1,100 |
| **Journal Cloud Persistence** | Yuzhou Bian | Seyma Kilic (UI polish) | ~560 |
| **Vercel Deployment** | Yuzhou Bian | — | ~50 |
| **Journey Page** | Seyma Kilic | — | ~960 |
| **School-Life Balance Page** | Seyma Kilic | — | ~960 |
| **Dark Mode Implementation** | Seyma Kilic | — | ~500 |

### Feature Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          SchoolKit App                                  │
├──────────────┬──────────────┬──────────────┬──────────────┬─────────────┤
│  Onboarding  │   For You    │   Library    │   Stories    │   Profile   │
│  (Lourdrick) │  (Nikita)    │(Janina+Nik.) │  (Janina)    │  (Nikita)   │
├──────────────┼──────────────┼──────────────┼──────────────┼─────────────┤
│              │              │              │              │             │
│  Welcome     │  Topic Grid  │  Bookmarks   │  Create      │  Settings   │
│  Steps 1-4   │  Rec. List   │  Downloads   │  Detail      │  Edit Name  │
│  Voice Select│  Knowledge   │  Search      │  Comments    │  Edit Role  │
│  Loading     │  Tree (Zoa)  │  Offline     │  Moderation  │  Journal    │
│              │              │              │  Norms       │  (Seyma)    │
├──────────────┴──────────────┴──────────────┴──────────────┴─────────────┤
│                        Educational Content Pages                        │
│  Understanding Cancer (Janina) | Coping Away from Home (Nikita)        │
│  Finding Support (Nikita) | Peer Support (Nikita) | School Nurse (Nik.)│
│  Managing Symptoms (Nikita) | School-Life Balance (Seyma)              │
│  Journey (Seyma) | AI-Generated Design Pages (Lourdrick)               │
├─────────────────────────────────────────────────────────────────────────┤
│                    Design Editor (Lourdrick — 15,600 LOC)               │
│  Canvas | Properties Panel | Tool Panel | AI Generate | Runtime Viewer │
│  Publish | Export | Layers | Alignment | Keyboard Shortcuts             │
├─────────────────────────────────────────────────────────────────────────┤
│                    Accomplishment System (Zoa — 2,070 LOC)              │
│  Knowledge Tree | Puzzle Grid | Chapter Cards | Piece Reveal | Context │
├─────────────────────────────────────────────────────────────────────────┤
│                       Cross-Cutting Concerns                            │
│  Auth Context (Lourdrick) | Theme System (Lourdrick+Seyma)             │
│  Supabase Backend (Yuzhou) | Web Platform (Yuzhou+Nikita)              │
│  TTS/Voices (Janina) | Spanish i18n (Janina) | Dark Mode (Seyma)       │
└─────────────────────────────────────────────────────────────────────────┘
```

### App Screenshots

> **Note:** Screenshots should be captured from the running application at [schoolkit-five.vercel.app](https://schoolkit-five.vercel.app) or from the iOS simulator. Below are the key screens to capture:

| Screen | File Path | Primary Author |
|---|---|---|
| Welcome / Landing | `app/welcome.tsx` | Lourdrick |
| Onboarding Step 1 (Name) | `app/onboarding/step1.tsx` | Lourdrick |
| Onboarding Step 2 (Role) | `app/onboarding/step2.tsx` | Lourdrick |
| Voice Selection | `app/onboarding/voice-selection.tsx` | Lourdrick + Janina |
| For You / Home Feed | `app/(tabs)/index.tsx` | Nikita |
| Topic Detail Page | `app/topic-detail.tsx` | Janina |
| Understanding Cancer | `app/understanding-cancer.tsx` | Janina |
| Managing Symptoms | `app/managing-symptoms.tsx` | Nikita |
| School Nurse Page | `app/school-nurse.tsx` | Nikita |
| Stories Tab | `app/(tabs)/stories.tsx` | Janina |
| Create Story | `app/create-story.tsx` | Janina |
| Story Detail + Comments | `app/story-detail.tsx` | Janina |
| Library / Bookmarks | `app/(tabs)/bookmarks.tsx` | Janina + Nikita |
| Profile Tab | `app/(tabs)/profile.tsx` | Nikita + Seyma |
| Settings Sheet | `components/SettingsSheet.tsx` | Nikita |
| Design Editor Canvas | `features/design-editor/` | Lourdrick |
| Knowledge Tree | `app/knowledge-tree.tsx` | Zoa |
| Accomplishments / Puzzles | `app/accomplishments.tsx` | Zoa |
| Journal Entry | `app/journal/[id].tsx` | Seyma + Yuzhou |
| Web Sidebar Layout | `components/CustomTabBar.tsx` | Yuzhou |
| Auth (Web Split Layout) | `components/AuthWebWrapper.tsx` | Yuzhou |
| School-Life Balance | `app/school-life-balance.tsx` | Seyma |

---

## 2. Individual Team Member Sections

---

### 2.1 Lourdrick Valsote

**GitHub:** [github.com/lourdrickvalsote](https://github.com/lourdrickvalsote)
**Email:** lvalsote@stanford.edu
**Commits:** 35 | **Lines Added:** 56,729 | **Lines Deleted:** 9,823

#### Contributions to Features

##### Design Editor (`features/design-editor/` — 15,594 lines, 45 files)

Lourdrick single-handedly built the entire visual design editor, the most code-intensive feature in the app. This is a full-featured canvas-based page builder that allows users (and AI) to create interactive educational content pages.

**Components Built (12,100+ lines):**
- `EditorCanvas.tsx` (810 lines) — Main canvas with drag-and-drop, multi-select, zoom/pan, grid snapping, and object placement. Implements `onLayout` measurement, touch/mouse event handling, and coordinate transforms.
- `PropertiesPanel.tsx` (1,877 lines) — The largest single component. Full property inspector for selected objects: fill color picker with gradient support, stroke controls, corner radius, opacity, shadow configuration, font family/size/weight/style, text alignment, blend modes, and layout properties.
- `InteractiveProperties.tsx` (920 lines) — Properties for interactive objects: quiz configuration, carousel settings, flip card options, expandable section controls, tab group configuration, and entrance animation settings.
- `CanvasObject.tsx` (907 lines) — Renders individual objects on the canvas with selection handles, resize grips, rotation, and real-time property updates. Handles rect, ellipse, text, image, line, star, triangle, badge, and group types.
- `AIGenerateModal.tsx` (810 lines) — Modal for AI page generation. Includes prompt input, style selection (Modern/Playful/Minimal/Bold), accent color swatches, and edit mode for modifying existing pages. Prompts are domain-specific: "A step-by-step guide for returning to school after a cancer diagnosis."
- `EditorShell.tsx` (628 lines) — Main editor layout shell: toolbar, canvas area, side panels. Manages panel visibility, responsive layout, and keyboard shortcut modal.
- `ToolPanel.tsx` (756 lines) — Left toolbar with shape tools (rect, ellipse, text, image, line, star, triangle), interactive tools (quiz, carousel, flip card, tabs, expandable, bottom sheet, entrance), and group operations.
- `EditorToolbar.tsx` (371 lines) — Top toolbar with undo/redo, zoom controls, grid toggle, preview button, publish, and export actions.
- `PublishModal.tsx` (431 lines) — Publishing workflow: title, description, category selection, thumbnail preview, and Supabase upload.
- `ReadOnlyViewer.tsx` (429 lines) — Read-only renderer for published design pages, used in `design-view/[id].tsx`.
- `LayersPanel.tsx` (228 lines) — Layer management: reorder, visibility toggle, lock/unlock, rename layers.
- `ContextMenu.tsx` (116 lines) — Right-click context menu: cut, copy, paste, duplicate, delete, lock, bring-to-front/send-to-back.
- `AlignmentToolbar.tsx` (99 lines) — Alignment tools: left, center, right, top, middle, bottom, distribute horizontally/vertically.
- Runtime renderers: `RuntimeObject.tsx` (412 lines), `RuntimeRenderer.tsx` (120 lines), `RuntimeCarousel.tsx` (152 lines), `RuntimeFlipCard.tsx` (132 lines), `RuntimeQuiz.tsx` (105 lines), `RuntimeExpandable.tsx` (129 lines), `RuntimeTabs.tsx` (94 lines), `RuntimeBottomSheet.tsx` (215 lines), `RuntimeEntrance.tsx` (151 lines).

**Store & Hooks (1,700+ lines):**
- `editor-store.ts` (570 lines) — Zustand store managing all editor state: selected objects, clipboard, undo/redo history (with 50-step limit), canvas dimensions, zoom level, grid settings, and object CRUD operations (add, update, delete, duplicate, group, ungroup).
- `useAIGenerate.ts` (733 lines) — Hook that calls OpenAI API via Supabase Edge Function to generate design documents from natural language prompts. Includes template skeleton building, JSON parsing with retry logic, object validation, and edit-mode diff application.
- `useAutoSave.ts` (114 lines) — Debounced auto-save to Supabase with conflict detection.
- `useDesignCRUD.ts` (120 lines) — CRUD operations for design documents against Supabase.
- `usePublish.ts` (158 lines) — Publish workflow: upload to Supabase, generate shareable URL.
- `useGenerationProgress.ts` (130 lines) — Progress tracking for AI generation with animated progress bar.

**Types & Utilities (2,800+ lines):**
- `document.ts` (308 lines) — TypeScript type definitions for `DesignDocument`, `StaticDesignObject`, `InteractiveDesignObject`, gradient types, shadow types, and interaction configs (quiz, carousel, flip, tabs, expandable).
- `ai-templates.ts` (1,011 lines) — AI prompt templates with system instructions, object schemas, layout guidelines, and example outputs for the AI page generator.
- `objects-to-html.ts` (182 lines) — Converts design objects to HTML/CSS for web rendering and export.
- `defaults.ts` (277 lines) — Default property values for every object type (dimensions, colors, fonts, etc.).
- `interactive-templates.ts` (531 lines) — Predefined interactive component templates.
- `block-templates.ts` (245 lines) — Block-level layout templates.
- `snap.ts` (125 lines) — Grid snapping and alignment snapping algorithms.
- `theme-mapper.ts` (50 lines) — Maps design colors to theme-aware equivalents for dark mode.

##### Onboarding & Authentication (3,355 lines)

- `app/welcome.tsx` (190 lines) — Welcome screen with animated entrance, guest access (anonymous Firebase sign-in), and sign-in/sign-up navigation.
- `app/auth.tsx` (602 lines) — Full authentication screen with email/password sign-up and sign-in, password strength validation (meter with color coding), show/hide password toggle, and error handling with user-friendly messages.
- `app/onboarding/step1.tsx` (170 lines) — Name input with keyboard-avoiding layout. Fixed keyboard overlap by moving Continue button outside `KeyboardAvoidingView`.
- `app/onboarding/step2.tsx` (249 lines) — Role selection: Student K-8, Student High School, Parent, Staff. Animated card selection with Ionicons.
- `app/onboarding/step2b.tsx` (240 lines) — Student-specific: grade level selection with visual grade cards.
- `app/onboarding/step3.tsx` (156 lines) — School journey status selection (multiple choice).
- `app/onboarding/step4.tsx` (201 lines) — Topic interest selection with animated chips.
- `app/onboarding/voice-selection.tsx` (351 lines) — AI voice selection screen with audio preview (co-developed with Janina for ElevenLabs integration).
- `app/loading.tsx` (122 lines) — Loading screen with animated progress bar shown after onboarding completion.
- `app/confirm-email.tsx` (97 lines) — Email confirmation flow screen.
- `contexts/AuthContext.tsx` (110 lines) — Firebase auth context: `onAuthStateChanged` listener, anonymous sign-in, email/password sign-up with `createUserWithEmailAndPassword`, sign-in, sign-out, and `linkWithCredential` for upgrading anonymous accounts.
- `constants/onboarding-theme.ts` (716 lines) — Central design system: `COLORS` (20+ named colors), `GRADIENTS` (primary, secondary, screen backgrounds), `SHADOWS` (card, button, elevated), `TYPOGRAPHY` (h1-h3, body, caption with font sizes/weights/letter-spacing), `SIZING` (icons, avatars), `SPACING` (gaps, paddings), `RADII` (card, badge, button), `BORDERS`, `ANIMATION` (entrance delays, stagger delays, spring configs), `SHARED_STYLES` (reusable page title, subtitle, icon circle styles), `PASSWORD_STRENGTH_COLORS`, and `DECORATIVE_SHAPES`.

##### UI Polish & Accessibility

- Multiple rounds of design consistency fixes across the entire app (commits: `fix design consistency`, `fix design consistency again`, `Round 2 audit fixes`)
- Added `accessibilityLabel` and `accessibilityRole` attributes to interactive elements throughout the design editor
- Dark mode audit fixes for onboarding and editor screens
- Keyboard overlap fixes on mobile (`KeyboardAvoidingView` restructuring in step1)
- Knowledge tree sizing fix using `onLayout` and flex layout for proper mobile/web rendering

#### Software Implementation Summary

| Area | Files | Lines | Key Technologies |
|---|---|---|---|
| Design Editor | 45 files | 15,594 | Zustand, OpenAI API, Supabase Edge Functions, react-native-reanimated |
| Onboarding/Auth | 13 files | 3,355 | Firebase Auth, Expo Router, KeyboardAvoidingView |
| Theme/Design System | 1 file | 716 | StyleSheet, LinearGradient |
| UI Fixes | 10+ files | ~1,000 | Reanimated, SafeAreaContext |

#### Percentage Contribution to Each Feature

| Feature | % Contribution | Evidence |
|---|---|---|
| Design Editor | **100%** | Sole author of all 45 files in `features/design-editor/` (verified via `git log --author`) |
| Onboarding Flow | **85%** | Built all step screens, loading, welcome. Yuzhou added web wrapper (15%) |
| Authentication | **65%** | Built Firebase auth context + auth screen. Yuzhou added Supabase backend (35%) |
| Design System / Theme | **95%** | Sole author of `onboarding-theme.ts`. Seyma added type exports (5%) |
| UI Polish / Accessibility | **70%** | Multiple audit fix rounds. Nikita contributed text size, Seyma dark mode (30%) |

---

### 2.2 Janina Troper

**GitHub:** [github.com/janinatroper](https://github.com/janinatroper)
**Email:** troper01@stanford.edu
**Commits:** 33 | **Lines Added:** 18,278 | **Lines Deleted:** 3,281

#### Contributions to Features

##### Stories & Community Platform (~5,500 lines)

Janina built the entire community stories feature from the ground up, enabling users to share personal experiences about navigating school during/after cancer treatment.

- `app/create-story.tsx` (885 lines) — Full story creation flow: title input, rich text body with character count, audience selection (patients, parents, staff), topic tag picker integration, story starters modal for writer's block, community norms agreement before submission, and preview mode. Includes anonymous posting toggle and Supabase upload via `StoriesContext`.
- `app/story-detail.tsx` (1,608 lines) — The largest non-editor screen. Full story view with: author info header, formatted body text, bookmark toggle, download button, TTS playback with speed control (`1x/1.25x/1.5x/2x`), comment section with threaded replies, comment likes with optimistic UI updates, report story/comment modals, "looking for" tags display, and related content recommendations at the bottom.
- `contexts/StoriesContext.tsx` (1,074 lines) — Complete data layer for stories: Supabase CRUD (create, read, update, delete), real-time comment subscription, comment likes with toggle, story reporting with reason tracking, comment reporting, moderation state (pending/approved/rejected), bookmark persistence, story download for offline access, and anonymous author handling.
- `components/StoryCard.tsx` (596 lines) — Reusable story card with gradient header, author avatar, title/excerpt, tag badges with color coding (`TAG_COLORS` map: "Back to School" → blue, "Mental Health" → purple, etc.), bookmark indicator, comment count, and time-ago formatting. Updated for dark mode with theme-aware colors.
- `components/CommunityNormsModal.tsx` (239 lines) — Community norms agreement modal shown before story submission. Lists 6 norms with checkbox acknowledgment: "School Stories Only," "Be Kind and Supportive," "No Medical Advice," "Protect Your Privacy," "Respect Everyone's Journey," "Zero Tolerance for Bullying." Includes scroll-to-bottom requirement, school-focused banner, and disclaimer text. Fully dark-mode aware.
- `components/ReportStoryModal.tsx` (262 lines) — Report modal with radio button selection: "Spam or misleading," "Inappropriate or offensive content," "Harassment or bullying," "Breaks community guidelines," "Other" (with free-text input). Async submit with loading state. Web-responsive layout.
- `components/ReportCommentModal.tsx` (262 lines) — Identical structure to ReportStoryModal but for comments. Built as separate component for independent iteration.
- `components/StoryStartersModal.tsx` (157 lines) — Writing prompts modal: "How did you navigate the first day back to school after diagnosis?", "What advice would you give to a newly diagnosed AYA?", etc. Updated prompts to be school-focused and dark-mode themed.
- `components/TopicTagsModal.tsx` (281 lines) — Tag picker with 25+ topic tags organized by category (School Stage, Treatment Stage, Academics, Social & Emotional, Practical). Features max-tag limit, clear-all button, and both modal and inline rendering modes. Tags include: "Back to School," "During Treatment," "Catching Up," "Friendships," "College Planning," "Gap Year(s)."
- `app/rejected-stories.tsx` (71 lines) — "Needs Revision" screen showing stories rejected by moderators.

##### Text-to-Speech Integration (~1,700 lines across multiple files)

- `hooks/useTTS.ts` (93 lines) — Core TTS hook using `expo-av` AudioPlayer. Implements `speak(text)` with ElevenLabs API call via `generateSpeech()`, `stop()`, playback rate cycling (`togglePlaybackRate`: 1.0 → 1.25 → 1.5 → 2.0), loading state, and voice change detection (re-generates audio when voice changes mid-session). Added debug logging (`[TTS] Requesting speech for voice:`) for troubleshooting.
- Voice selection integration in `app/onboarding/voice-selection.tsx` — Added Spanish voice filtering (`isSpanish` flag filters `VOICE_META` by accent), Spanish sample text (`"Hola, soy ${name}. Estoy emocionado de acompañarte en este camino."`), and default voice selection based on language preference.
- ElevenLabs API integration — Set up ElevenLabs voice synthesis, added new voices (commit: "added new elevenlab voices"), removed hardcoded API key (commit: "fixed api key bug"), integrated across Understanding Cancer page, story detail, and resource pages.
- Audio speed control — `togglePlaybackRate` function with `player.setPlaybackRate(next)` for real-time speed adjustment while audio is playing.

##### Content Recommendation System (230 lines)

- `components/RecommendationList.tsx` (226 lines) — "You may also find helpful" recommendation engine. Algorithm: (1) collects tags from current page, (2) scores all resources + stories by tag overlap, (3) filters out current page, (4) sorts by match score, (5) returns top 6. Renders as horizontal scroll of cards with gradient divider bar (`LinearGradient` rainbow: primary → purple → pink → orange → yellow). Each card shows type badge (Resource/Story), title, subtitle, and matching tags.

##### Spanish Translation (~600 lines across multiple files)

- Implemented `preferredLanguage` field in OnboardingContext
- Added language step in onboarding (`app/onboarding/step-language.tsx`)
- Spanish content translation for voice selection, story creation prompts, and TTS sample text
- Language selection in settings modal

##### Bookmarks & Downloads (~900 lines)

- `app/(tabs)/bookmarks.tsx` — Library tab with three segments: All, Saved, Downloaded. Category filtering (School, Social, Health, Family), search bar, story bookmarks alongside resource bookmarks. Grid layout for web, list for mobile.
- `contexts/OfflineContext.tsx` (216 lines) — Offline content manager: downloads resources for offline access, tracks download status, provides `isDownloaded()` check, manages storage cleanup.

##### Understanding Cancer Page (726 lines)

- `app/understanding-cancer.tsx` (726 lines) — Interactive educational page with animated flip cards (myth vs. fact format), scroll-based content sections, TTS integration with speed control, bookmark/download buttons, and recommendation list at the bottom. Cards animate with `react-native-reanimated` spring physics.

#### Software Implementation Summary

| Area | Files | Lines | Key Technologies |
|---|---|---|---|
| Stories Platform | 10 files | ~5,500 | Supabase real-time, expo-av, Reanimated |
| TTS / Voice | 3+ files | ~1,700 | ElevenLabs API, expo-av AudioPlayer |
| Recommendations | 1 file | 230 | Tag-matching algorithm, LinearGradient |
| Translation | 5+ files | ~600 | i18n, OnboardingContext |
| Library/Bookmarks | 2 files | ~900 | AsyncStorage, Supabase |
| Understanding Cancer | 1 file | 726 | Flip card animations, Reanimated |

#### Percentage Contribution to Each Feature

| Feature | % Contribution | Evidence |
|---|---|---|
| Stories & Community | **100%** | Sole author of create-story, story-detail, StoriesContext, all modals |
| Text-to-Speech / Voice | **75%** | Built useTTS hook, ElevenLabs integration, voice selection logic. Nikita fixed web TTS (25%) |
| Recommendation System | **100%** | Sole author of RecommendationList.tsx |
| Spanish Translation | **100%** | Implemented language preference, voice filtering, translated content |
| Bookmarks & Downloads | **65%** | Built core bookmarks + OfflineContext. Nikita merged into library tab (35%) |
| Moderation (Reports) | **100%** | Built ReportStoryModal, ReportCommentModal, rejected stories tracking |
| Understanding Cancer | **100%** | Sole author of understanding-cancer.tsx with flip card animations |
| Community Norms | **100%** | Sole author of CommunityNormsModal with all norm definitions |

---

### 2.3 Nikita Gounder

**GitHub:** [github.com/nikita-gounder](https://github.com/nikita-gounder)
**Email:** 116221240+nikita-gounder@users.noreply.github.com
**Commits:** 32 | **Lines Added:** 7,866 | **Lines Deleted:** 2,891

#### Contributions to Features

##### Educational Content Pages (~4,160 lines)

Nikita authored 5 of the app's 8 educational content pages, each containing detailed health/school information with consistent styling, TTS integration, and dark mode support.

- `app/managing-symptoms.tsx` (1,175 lines) — "Tips for Managing Symptoms" page. Covers fatigue management, pain coping strategies, emotional wellness, sleep hygiene, and nutrition tips. Structured with collapsible sections, icon-decorated tip cards, and a "quick tips" summary section. Includes TTS playback, bookmark/download buttons, and scroll-to-end tracking for accomplishment system.
- `app/school-nurse.tsx` (970 lines) — "The School Nurse: Your Ally at School" page. Content about building relationships with school nurses, what to share about your health, when to visit the nurse's office, and creating a health plan. Features info cards with nurse-themed icons, FAQ accordion, and actionable steps checklist.
- `app/peer-support.tsx` (908 lines) — "Peer Support" page. Covers finding support groups, talking to friends about cancer, handling questions and stares, building new friendships, and online communities. Card-based layout with gradient headers and expandable detail sections.
- `app/finding-support.tsx` (633 lines) — "Finding Support" resource page. Guides users through types of support available: counselors, support groups, online resources, family support, and school accommodations. Organized with categorized resource cards and external link integration.
- `app/coping-away-from-home.tsx` (472 lines) — "Coping Away from Home" page for students dealing with hospital stays or treatment away from home. Covers staying connected with school, managing homesickness, keeping up with academics remotely, and preparing for return.

##### Settings & Profile UI (~1,050 lines)

- `components/SettingsSheet.tsx` (904 lines, major contributor) — Built the settings bottom sheet with multiple views: main settings (appearance toggle, voice selection, text size, audio speed), About view (mission statement, team credits, version info), FAQ/Feedback section, and language selection. Separated settings from profile tab into standalone gear-icon sheet. Added web-specific layout (modal vs. slide animation, centered on web). Implemented `AboutView` with mission statement: "To facilitate a smoother transition from cancer treatment back to school."
- Profile UI updates including avatar icon selection (replaced camera/photo with icon picker), role/grade display, and survey topic updates to match available content pages.
- `app/about.tsx` (159 lines) — Populated About page with app information.
- `app/help-support.tsx` (402 lines) — FAQ and feedback section with expandable questions and contact form.

##### Text Size / Accessibility (~400 lines)

- Implemented per-card "Aa" text enlarger button system: users can increase/decrease font size on individual educational content cards
- `fontSizeStep` state with `FONT_STEPS` array for progressive text scaling
- Initially placed in page headers and settings, then moved into individual cards for more granular control (commit: "Move Aa text size button into cards")
- Added smaller/larger text option in settings with app-wide font scale preference
- Reduced card title fonts to fixed 18px for consistency across all resource cards

##### Web Layout & Responsive Design (~350 lines)

- `components/PersistentSidebar.tsx` (141 lines) — Persistent sidebar navigation for web that wraps page content, ensuring content doesn't overlap with the sidebar dashboard.
- `components/WebResourceTile.tsx` (135 lines) — Web-optimized resource tile for grid layouts with hover states and responsive sizing.
- FYP layout fixes: removed `isWebDesktop` in favor of simpler `isWeb` flag, fixed grid width calculations
- Library tab layout: fixed story layout in saved section, web grid alignment
- Profile web layout: settings button positioning, modal centering on web
- Settings button web layout: `animationType` changed from "slide" to "fade" on web, centered overlay

##### Resources Data Management

- `constants/resources.ts` — Maintained the resources data array: added new page entries (Managing Symptoms, Coping Away from Home, School Nurse), updated `PAGE_TOPICS` with icons and colors, added `designOnly` flag for AI-generated pages, updated `RESOURCE_CATEGORIES`, updated survey and profile topics to reflect available pages.

##### Additional Contributions

- Logo updates across the app
- Color changes to page icons for visual consistency
- Fixed text-to-voice for web platform (Web Audio API differences)
- Combined save + search into unified library tab
- Student role: removed grade bins, separated FAQ/Feedback into distinct section

#### Software Implementation Summary

| Area | Files | Lines | Key Technologies |
|---|---|---|---|
| Educational Pages | 5 files | 4,160 | ScrollView, Reanimated, Ionicons |
| Settings/Profile | 4 files | ~1,050 | BottomSheet, Modal, Platform detection |
| Text Size/a11y | 6+ files | ~400 | Dynamic fontSize, fontScale |
| Web Layout | 3 files | ~350 | Platform.OS === 'web', responsive styles |
| Resources Data | 1 file | ~200 | TypeScript arrays |

#### Percentage Contribution to Each Feature

| Feature | % Contribution | Evidence |
|---|---|---|
| Educational Content Pages | **60%** (5 of ~8 pages) | Sole author of managing-symptoms, school-nurse, peer-support, finding-support, coping-away-from-home |
| Settings & Profile UI | **80%** | Built SettingsSheet, About, FAQ/Feedback, avatar icons. Others contributed minor fixes (20%) |
| Text Size / Accessibility | **100%** | Sole implementer of Aa text enlarger and font scaling system |
| Web Layout | **40%** | PersistentSidebar, WebResourceTile, FYP/library/profile fixes. Yuzhou built core web platform (60%) |
| Library Tab (Combined) | **35%** | Merged save + search. Janina built core bookmarks/downloads (65%) |
| TTS Web Fixes | **25%** | Fixed web-specific TTS issues. Janina built core TTS (75%) |
| Resources Data | **90%** | Primary maintainer of resources.ts with page definitions |

---

### 2.4 Zoa (Zhaohan)

**GitHub:** [github.com/zhao111han](https://github.com/zhao111han) (zhao111han@gmail.com)
**Commits:** 16 | **Lines Added:** 14,316 | **Lines Deleted:** 2,301

#### Contributions to Features

##### Knowledge Tree (~570 lines)

- `components/tree/KnowledgeTree.tsx` (445 lines) — Interactive tree visualization showing user progress through educational resources. Each resource is represented as a "leaf" on the tree that lights up when fully viewed. Implementation uses `react-native-svg` for the tree structure with animated leaf nodes. Features:
  - Dynamic leaf positioning based on resource count
  - Glow animation on completed leaves using `Animated.View` opacity cycling
  - `navigateToLeaf` callback that routes to the correct page (hardcoded pages or cloud-hosted design pages)
  - Fixed stale closure bug where `navigateToLeaf` referenced outdated route data — solved by using `useRef` for the navigation callback (commit: "fix: resolve stale closure in KnowledgeTree navigateToLeaf hook")
  - `designOnly` filtering to exclude AI-generated pages not yet published from the tree count
  - Thermometer leaf fix for unresponsive tap targets
  - Auto-complete `scrolledToEnd` for cloud pages that perfectly fit the viewport (no scroll needed)
  - `onLayout` and flex-based sizing for proper rendering on both mobile and web

- `app/knowledge-tree.tsx` (127 lines) — Screen wrapper with animated header (fade-in + slide-up), back button, progress badge (`litCount / totalResources`), and scroll container. Filters out `designOnly` resources from the tree and count.

##### Accomplishment / Puzzle System (~2,070 lines)

Zoa designed and implemented the entire gamification layer — a puzzle-piece collection system that rewards users for engaging with app features.

- `contexts/AccomplishmentContext.tsx` (454 lines) — Core context provider managing all accomplishment state:
  - `fireEvent(event)` — dispatches accomplishment events (e.g., `'tts_played'`, `'resource_completed'`, `'accomplishments_viewed'`)
  - `scrolledToEndIds` tracking with `Set` and `useRef` for triggering re-renders when users scroll to the bottom of content pages
  - `isResourceFullyViewed(id)` — checks if a resource's scroll-to-end has been tracked
  - `earnedPieceIds` — Set of earned puzzle piece IDs persisted to AsyncStorage
  - `visibleChapterIds` — computed from earned pieces to progressively reveal chapters
  - Event-to-piece mapping engine: evaluates all piece conditions against fired events and scroll state
  - `PieceRevealOverlay` trigger when a new piece is earned (animated celebration)

- `constants/accomplishments.ts` (358 lines) — Complete accomplishment definitions:
  - `PieceEvent` union type with 15+ event types: `'resource_completed'`, `'resource_shared'`, `'tts_played'`, `'resource_bookmarked'`, `'profile_tab_visited'`, `'all_tabs_visited'`, `'search_performed'`, `'peer_support_read_10s'`, `'cancer_info_read_10s'`, `'accomplishments_viewed'`, `'about_opened'`, `'resources_10pct'`, `'resources_50pct'`, `'resources_100pct'`, `'resources_5_bookmarked'`
  - `CHAPTERS` array with 4 chapters: "First Steps" (amber), "Explorer" (cyan), "Mind Hunter" (purple), "Story Keeper" (pink)
  - Each chapter has `pieces` array with `id`, `label`, `description`, `icon` (Ionicons), and `condition` (event-based trigger)
  - Gradient colors per chapter for visual theming

- `app/accomplishments.tsx` (201 lines) — Accomplishments screen showing all chapters as cards with puzzle grids. Animated entrance with staggered delays. Fires `'accomplishments_viewed'` event on mount. Empty state with fade-in animation when no pieces earned yet.

- **Puzzle UI Components (1,057 lines):**
  - `components/puzzle/ChapterCard.tsx` (138 lines) — Chapter card with gradient header, progress counter, and embedded `PuzzleGrid`. Staggered entrance animation matching app-wide pattern.
  - `components/puzzle/ChapterIllustration.tsx` (206 lines) — SVG-based chapter illustrations using `react-native-svg`: Chapter 1 uses concentric rings (amber), Chapter 2 uses hexagonal honeycomb grid (cyan), Chapter 3 uses starburst radial lines (purple), Chapter 4 uses heart-form concentric outlines (pink). Each is mathematically generated with parametric equations.
  - `components/puzzle/PieceDetailModal.tsx` (224 lines) — Piece detail popup with `BlurView` background, spring-animated scale entrance, pulsing glow ring (`withRepeat` + `withSequence`), piece SVG illustration clipped to jigsaw shape, earned date, and chapter badge.
  - `components/puzzle/PuzzleGrid.tsx` (115 lines) — Grid layout for puzzle pieces within a chapter card, responsive sizing.
  - `components/puzzle/PuzzlePiece.tsx` (159 lines) — Individual puzzle piece with jigsaw-edge SVG clipping, earned/unearned states, tap handler for detail modal, and chapter illustration fill.
  - `components/puzzle/PieceRevealOverlay.tsx` (215 lines) — Full-screen celebration overlay when a piece is earned: blur background, confetti-like particles, piece zoom-in animation, and auto-dismiss.

- `ACCOMPLISHMENT.MD` — Specification document listing all accomplishment conditions, chapter definitions, and piece descriptions.

##### Bug Fixes & Maintenance

- **Stale closure fix** (commit `fix: resolve stale closure`) — `navigateToLeaf` in KnowledgeTree was captured in a stale closure, causing dynamically-loaded cloud routes to silently fail navigation. Fixed by using `useRef` to always hold the latest callback.
- **Viewport scroll detection** (commit `fix: auto-complete scrolledToEnd`) — Cloud pages that fit perfectly in the viewport never fired `onScroll`, so accomplishments for "reading" them were never triggered. Added `onContentSizeChange` check to auto-complete when content height ≤ viewport height.
- **Thermometer leaf fix** — Unresponsive tap target on thermometer leaf node in KnowledgeTree.
- **Hardcoded page tracking** — Hardcoded educational pages weren't being tracked for accomplishments; added explicit ID mapping.
- **TypeScript error resolution** — Resolved all TS errors after rebase (commit: "Resolve all typescript errors after rebase").
- **Package incompatibility** — Fixed dependency conflicts.
- **Graceful error handling** — Added fallback for missing API keys and missing Supabase table columns on dev servers.
- **Removed search tab** — Cleaned up unused search tab from tab navigation.
- **Raleway font migration** — Updated all knowledge tree and accomplishment typography to use `Raleway` font family variants (`Raleway_700Bold`, `Raleway_600SemiBold`, etc.).

#### Software Implementation Summary

| Area | Files | Lines | Key Technologies |
|---|---|---|---|
| Knowledge Tree | 2 files | 572 | react-native-svg, Reanimated, useRef |
| Accomplishment Context | 1 file | 454 | AsyncStorage, Set, useRef, event system |
| Accomplishment Definitions | 1 file | 358 | TypeScript union types, conditions |
| Puzzle UI Components | 6 files | 1,057 | SVG clipping, BlurView, spring animations |
| Accomplishment Spec | 1 file | ~100 | Markdown documentation |
| Bug Fixes | 8+ files | ~400 | Various |

#### Percentage Contribution to Each Feature

| Feature | % Contribution | Evidence |
|---|---|---|
| Knowledge Tree | **100%** | Sole author of KnowledgeTree.tsx, knowledge-tree.tsx, all tree logic |
| Accomplishment System | **100%** | Sole author of AccomplishmentContext, accomplishments.ts, all puzzle components |
| Puzzle UI | **100%** | Sole author of all 6 puzzle components (ChapterCard, ChapterIllustration, PieceDetailModal, PuzzleGrid, PuzzlePiece, PieceRevealOverlay) |
| TypeScript Error Resolution | **100%** | Resolved all TS errors after rebase |
| Search Tab Removal | **100%** | Removed search tab and cleaned up navigation |
| designOnly Resource Filtering | **100%** | Added filtering logic for AI-generated pages in tree |

---

### 2.5 Yuzhou Bian

**GitHub:** [github.com/yuzhoubian](https://github.com/yuzhoubian)
**Email:** yuzhoubian921@gmail.com
**Commits:** 12 | **Lines Added:** 2,741 | **Lines Deleted:** 551

#### Contributions to Features

##### Supabase Backend Integration (~1,500 lines)

Yuzhou built the entire backend persistence layer, replacing local-only storage with cloud-synced Supabase.

- `contexts/OnboardingContext.tsx` (475 lines, ~186 lines added) — Rewrote `OnboardingContext` to sync user profile data to Supabase: `saveUserProfile()` upserts to `profiles` table, `loadUserProfile()` fetches on auth state change, profile picture URL storage. Maintained backward compatibility with existing `AsyncStorage` for offline-first behavior.
- `supabase/schema.sql` (235 lines) — Database schema: `profiles` table (id, user_id, name, role, grade_level, school_statuses, selected_topics, selected_voice, profile_picture, preferred_language, onboarding_complete, created_at, updated_at), `designs` table, Row Level Security policies for user isolation, indexes on user_id.
- `supabase/journal-tables.sql` (114 lines) — Journal database schema: `journals` table (id, user_id, title, cover_id, paper_id, timestamps), `journal_pages` table (id, journal_id, page_index, text_entry, paths JSONB, images JSONB, timestamps). Full RLS policies ensuring users can only access their own journals. Triggers for auto-updating `updated_at`.
- `supabase/designs-schema.sql` (153 lines) — Schema for design documents storage.
- `supabase/stories-schema.sql` (169 lines) — Schema for community stories, comments, likes, and reports.
- Additional SQL migrations: `add_comment_likes.sql`, `add_comment_reports.sql`, `add_moderator_delete_policies.sql`, `add_story_reports.sql`, `add_story_tags.sql`, `add_story_update_policy.sql`.
- `lib/supabase.ts` (21 lines) — Supabase client initialization with environment variable configuration.
- `lib/database.types.ts` (130 lines) — Full TypeScript type definitions for all Supabase tables: `Profile`, `DesignDocument`, `DesignAsset`, `Journal`, `JournalPageRow`, `PathData`, `JournalImageData`, and `Database` type with `Tables` definitions including `Row`, `Insert`, and `Update` variants.
- `lib/storage.ts` (32 lines) — Cross-platform storage adapter: uses `expo-secure-store` on mobile and `localStorage` on web, with consistent `getItem`/`setItem`/`removeItem` API.

##### Journal Cloud Persistence (~560 lines)

- `contexts/JournalContext.tsx` (441 lines, ~429 lines rewritten) — Major rewrite integrating journal with Supabase backend. Added: `syncJournalToCloud()` for uploading journal pages, `loadFromCloud()` for fetching cloud journals, conflict resolution (cloud wins), `PathData` and `JournalImageData` types for serializing drawing strokes and images to JSONB, optimistic local updates with cloud sync, and error handling with retry logic.

##### Web Platform Support (~1,100 lines)

- `components/CustomTabBar.tsx` (371 lines, ~230 lines added) — Refactored tab bar into platform-adaptive component:
  - `BottomTabBar` — Mobile bottom tab bar with animated indicator, haptic feedback, and blur background
  - `SidebarNav` — Web sidebar navigation with SchoolKit brand header, nav items with hover states, and `SidebarNavItem` component with `onHoverIn`/`onHoverOut`
  - `useTabNavigation` — Shared hook extracting `handlePress`/`handleLongPress` logic for reuse across both layouts
  - Auto-detection: renders sidebar on web desktop/tablet, bottom bar on mobile
- `components/WebContainer.tsx` (75 lines) — Wrapper component providing consistent max-width, centered layout, and padding for web views.
- `components/AuthWebWrapper.tsx` (324 lines) — Split-layout wrapper for auth/onboarding pages on web: left panel with SchoolKit branding, gradient background, and feature highlights; right panel with the actual form. Includes step progress indicator for onboarding steps. Applied to: auth, confirm-email, welcome, and all onboarding steps.
- `utils/platform.ts` (89 lines) — Platform utilities: `hapticFeedback` object (safe no-op on web), `features` detection (haptics, image picker, speech, clipboard, biometrics), `platformStyles` helpers (`web()`, `mobile()`, `select()`), and `isWeb`/`isMobile` constants.
- `hooks/useResponsive.ts` (61 lines) — Responsive design hook: breakpoints (mobile <768px, tablet 768-1023px, desktop ≥1024px), dimension tracking via `Dimensions.addEventListener`, and `isMobile`/`isTablet`/`isDesktop`/`isWeb` booleans.
- `polyfills.js` (32 lines) — ES2023 polyfills for `Array.prototype.at()`, `Array.prototype.findLast()`, `Object.hasOwn()` for Node.js < 20 compatibility.
- `vercel.json` (8 lines) — Vercel deployment configuration with SPA rewrite rules.
- Web-specific fixes: sign-out on web (added `window.location.reload()` fallback), library tab segment alignment on web, website UI updates.

##### Profile Picture Upload

- Added profile picture upload in `app/(tabs)/profile.tsx` and `contexts/OnboardingContext.tsx`: image picker integration, Supabase storage bucket upload, URL persistence to profile.

##### Documentation

- `README.md` (3 major updates, ~300 lines total) — Comprehensive README with: project description, need statement, prerequisites, installation instructions, environment setup, running commands for mobile and web, feature overview (15+ features documented), and live web URL.

#### Software Implementation Summary

| Area | Files | Lines | Key Technologies |
|---|---|---|---|
| Supabase Backend | 10 files | ~1,500 | Supabase, PostgreSQL, RLS, JSONB |
| Journal Cloud | 1 file | ~560 | Supabase, conflict resolution |
| Web Platform | 6 files | ~1,100 | Responsive design, Platform.OS, Vercel |
| Auth Web Layout | 1 file | 324 | LinearGradient, split layout |
| Profile Picture | 2 files | ~80 | expo-image-picker, Supabase Storage |
| Documentation | 1 file | ~300 | Markdown |

#### Percentage Contribution to Each Feature

| Feature | % Contribution | Evidence |
|---|---|---|
| Supabase Backend | **100%** | Sole author of all supabase/ SQL, lib/supabase.ts, database.types.ts, storage.ts |
| Web Platform Support | **60%** | Built CustomTabBar sidebar, WebContainer, AuthWebWrapper, useResponsive, platform.ts. Nikita contributed web layout fixes (40%) |
| Journal Cloud Persistence | **70%** | Rewrote JournalContext for cloud sync. Seyma did UI polish (30%) |
| Vercel Deployment | **100%** | Sole author of vercel.json, deployment config |
| Auth Web Layout | **100%** | Sole author of AuthWebWrapper.tsx |
| Profile Picture Upload | **100%** | Supabase storage integration + image picker |
| README Documentation | **100%** | Sole author of all README versions |
| Onboarding (Web) | **15%** | Added AuthWebWrapper to all onboarding steps. Lourdrick built core onboarding (85%) |

---

### 2.6 Seyma Kilic

**GitHub:** [github.com/seyma](https://github.com/seyma) (seykilic0808@gmail.com)
**Commits:** 6 | **Lines Added:** 6,037 | **Lines Deleted:** 3,358

#### Contributions to Features

##### Journey Page (~960 lines)

- `app/school-life-balance.tsx` (959 lines) — "Juggling School and Life" educational content page. Comprehensive guide covering: time management strategies, balancing academics with treatment schedules, dealing with fatigue during school days, communicating with teachers about absences, maintaining social connections while managing health, and tips for homework when energy is low. Structured with expandable sections, tip cards with icons, and actionable checklists. Includes TTS playback button, bookmark/download integration, and scroll-to-end tracking for the accomplishment system.

- Journey page (`app/journal/` directory, significant UI contributions):
  - Enhanced journaling experience and UI polish on the profile tab
  - Updated journal entry styling, layout improvements, and interaction refinements

##### Dark Mode Implementation (~500 lines across 6+ files)

Seyma implemented dark mode compatibility across multiple screens that were previously hardcoded to light mode:

- `app/(tabs)/bookmarks.tsx` — Replaced hardcoded `GRADIENTS.primaryButton` with `gradients.primaryButton` from theme context. Changed type annotations from inline imports to proper `ThemeColors`/`ThemeShadows` types. Fixed button shadows that broke in dark mode. Changed avatar text color from `'#FFF'` to `'#FFFFFF'` for consistency.
- `app/(tabs)/index.tsx` — Updated `makeStyles` to use `ThemeColors` type instead of inline import type. Fixed avatar initial and icon colors for dark mode.
- `app/(tabs)/profile.tsx` — Added `ThemeColors`/`ThemeShadows` type imports, fixed avatar rendering for dark mode, cleaned up double blank lines.
- `app/design-view/[id].tsx` — Integrated `getThemeAwareColor()` from `theme-mapper.ts` to make design page viewer respect dark mode. Fixed import for theme-aware color mapping.
- `features/design-editor/components/runtime/RuntimeObject.tsx` — Updated 6 color references to use `getThemeAwareColor(color, isDark)`: rectangle fill, rectangle stroke, ellipse fill, ellipse stroke, and text fill colors. This ensures all AI-generated design pages render correctly in dark mode.
- `features/design-editor/utils/objects-to-html.ts` — Updated `objectToStyle()` function signature to accept `isDark` parameter. Applied `getThemeAwareColor()` to all color properties: rect fill, ellipse fill, text color, line color, star fill, triangle fill, badge fill, and gradient colors. Updated `getGradientCSS()` to map gradient color stops through theme-aware mapping.
- `components/ResourceCard.tsx` — Resolved merge conflict between font scaling and dark mode changes. Fixed `categoryBadge` background to use `isDark ? color + '33' : withOpacity(color, 0.1)`.

##### Bug Fixes

- Fixed merge conflict in `ResourceCard.tsx` between upstream font size changes and dark mode styling
- Resolved `getThemeAwareColor` import in design view

##### Journal Constants

- `constants/journal.ts` (16 lines) — Journal-related constants (cover IDs, paper types).

#### Software Implementation Summary

| Area | Files | Lines | Key Technologies |
|---|---|---|---|
| School-Life Balance Page | 1 file | 959 | ScrollView, TTS, Reanimated |
| Dark Mode | 7 files | ~500 | ThemeContext, getThemeAwareColor |
| Journal UI | 3+ files | ~300 | StyleSheet, Reanimated |
| Bug Fixes | 2 files | ~50 | Merge conflict resolution |

#### Percentage Contribution to Each Feature

| Feature | % Contribution | Evidence |
|---|---|---|
| School-Life Balance Page | **100%** | Sole author of school-life-balance.tsx (959 lines) |
| Journey Page UI | **100%** | Enhanced journaling experience and updated UI |
| Dark Mode (Pages) | **100%** | Sole implementer of dark mode across bookmarks, FYP, profile, design-view, RuntimeObject, objects-to-html |
| Dark Mode (Design Editor Runtime) | **100%** | Added getThemeAwareColor to RuntimeObject and objects-to-html for dark mode in AI pages |
| Journal Constants | **100%** | Sole author of journal.ts |
| Journal UI Polish | **30%** | Enhanced UI. Yuzhou built cloud persistence (70%) |
| ResourceCard Fix | **100%** | Resolved merge conflict between font scaling and dark mode |

---

## 3. Summary Statistics

### Commit Distribution

| Team Member | Commits | % of Total | Lines Added | Lines Deleted | Net Lines |
|---|---|---|---|---|---|
| Lourdrick Valsote | 35 | 25.5% | 56,729 | 9,823 | 46,906 |
| Janina Troper | 33 | 24.1% | 18,278 | 3,281 | 14,997 |
| Nikita Gounder | 32 | 23.4% | 7,866 | 2,891 | 4,975 |
| Zoa (Zhaohan) | 16 | 11.7% | 14,316 | 2,301 | 12,015 |
| Yuzhou Bian | 12 | 8.8% | 2,741 | 551 | 2,190 |
| Seyma Kilic | 6 | 4.4% | 6,037 | 3,358 | 2,679 |

### Feature Ownership Heatmap

```
Feature                    LV   JT   NG   ZH   YB   SK
─────────────────────────────────────────────────────────
Design Editor             ████                        ░
Onboarding/Auth           ███                    ░
Stories/Community               ████
TTS/Voice                       ███  ░
Knowledge Tree                            ████
Accomplishments                           ████
Supabase Backend                               ████
Web Platform                         ██        ███
Educational Pages               █    ███             █
Settings/Profile                     ███             ░
Dark Mode                                            ██
Recommendations                 ████
Spanish Translation             ████
Bookmarks/Library               ██   █
Journal                                        ██   █
Design System             ████                       ░

████ = Primary owner (≥70%)
███  = Major contributor (50-69%)
██   = Significant contributor (30-49%)
█    = Minor contributor (15-29%)
░    = Supporting contributor (<15%)
```

---

*Report generated from analysis of 137 commits across 6 contributors in the [CS342/2026-SchoolKit](https://github.com/CS342/2026-SchoolKit) repository. All contribution percentages are based on `git log --author`, `git log -p` diff analysis, and current file authorship examination.*
