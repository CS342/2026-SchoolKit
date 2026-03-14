<p align="center">
  <img src="assets/images/SchoolKit-transparent.png" alt="SchoolKit Logo" width="200" />
</p>

<h1 align="center">SchoolKit</h1>

<p align="center">
  Supporting young cancer survivors' transition back to school
</p>

<p align="center">
  <a href="https://schoolkit-five.vercel.app/welcome">Web App</a> · <a href="https://github.com/CS342/2026-SchoolKit">GitHub</a>
</p>

---

SchoolKit is a cross-platform application developed for the CS342: Building for Digital Health course at Stanford University (Winter 2026). It facilitates a smoother transition from cancer treatment back to school for young cancer survivors and their support systems — reducing anxiety, confusion, and feelings of isolation during reintegration.

## Download / Access

| Platform | Link |
| -------- | ---- |
| **Web** | [schoolkit-five.vercel.app/welcome](https://schoolkit-five.vercel.app/welcome) |
| **iOS** | [TestFlight](https://testflight.apple.com/) (invite required) |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [npm](https://www.npmjs.com/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- For iOS development: Xcode (macOS only)
- For Android development: Android Studio

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/CS342/2026-SchoolKit.git
   cd 2026-SchoolKit
   ```

2. Install dependencies (the `--legacy-peer-deps` flag is required due to peer dependency conflicts between React 19 and some packages):

   ```bash
   npm install --legacy-peer-deps
   ```

3. Set up environment variables — create a `.env` file in the root directory:

   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   EXPO_PUBLIC_OPEN_AI_MODERATION_KEY=your_openai_key
   ```

### Running the App

| Command | Description |
| ------- | ----------- |
| `npm start` | Start the Expo dev server |
| `npm run ios` | Start on iOS simulator |
| `npm run android` | Start on Android emulator |
| `npm run web` | Launch in browser at `http://localhost:8081` |
| `npm run lint` | Run ESLint |

For mobile, scan the QR code with the Expo Go app on your device, or press `i` for iOS simulator / `a` for Android emulator.

## Implemented Features

### Authentication & Onboarding
- Email/password sign-up and sign-in with password strength validation
- Email confirmation flow
- Guest access (anonymous sign-in)
- Multi-step onboarding: name, role selection (student K–8, student high school, parent, staff), grade level, school journey status, topic preferences, and AI voice selection
- Web-optimized split layout for auth/onboarding pages

### Home Feed (For You)
- Personalized topic recommendations based on user role and interests
- Topic cards with category-based icons and gradients
- Topic detail pages with in-depth educational content

### Resource Topics
- Understanding Cancer
- Finding Support
- Peer Support
- School-Life Balance
- Managing Symptoms
- Coping Away From Home
- School Nurse resources
- Help & Support page

### Stories
- Community stories shared by other users
- Story creation with text input and tags
- Story detail view with moderation system and rejected stories tracking

### Library (Bookmarks)
- Save and organize favorite resources
- Segmented tabs: All, Saved, Downloaded
- Offline access to downloaded content

### Knowledge Tree & Accomplishments
- Visual knowledge tree tracking learning progress
- Accomplishment badges for completed topics and milestones

### Journal
- Personal journal entries for reflection
- Create, view, and manage journal entries

### Design Editor
- Visual design editor with Konva canvas
- Design templates and custom creation
- Undo/redo support via Zustand + Zundo
- Shareable designs via unique token links

### Profile & Settings
- Role-based user profiles
- Edit name, role, grade level, school status, and topic preferences
- Language selection
- Dark mode / light mode toggle
- About page and sign out

### Accessibility & Internationalization
- Text-to-Speech for content read-aloud
- Language selection support

### Cross-Platform (iOS, Android, Web)
- Single shared codebase using React Native + Expo
- Responsive web layout with sidebar navigation on desktop/tablet and bottom tabs on mobile
- Platform-specific adaptations and dark mode support across all platforms

### Offline Support
- Download content for offline access
- Network status detection and graceful degradation

## Tech Stack

| Layer | Technology |
| ----- | ---------- |
| Framework | [React Native](https://reactnative.dev/) 0.81 + [Expo](https://expo.dev/) 54 |
| Routing | [Expo Router](https://docs.expo.dev/router/introduction/) (file-based) |
| Language | [TypeScript](https://www.typescriptlang.org/) 5.9 |
| UI | [React](https://react.dev/) 19 |
| Backend | [Supabase](https://supabase.io/) (Auth, PostgreSQL, REST API) |
| AI | [OpenAI API](https://platform.openai.com/) (content generation, moderation) |
| TTS | [Expo Speech](https://docs.expo.dev/versions/latest/sdk/speech/) + [ElevenLabs](https://elevenlabs.io/) (fallback) |
| State | [React Context](https://react.dev/reference/react/createContext) + [Zustand](https://github.com/pmndrs/zustand) |
| Undo/Redo | [Zundo](https://github.com/charkour/zundo) + [Immer](https://immerjs.github.io/immer/) |
| Canvas | [Konva](https://konvajs.org/) + [react-konva](https://github.com/konvajs/react-konva) |
| Animations | [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/) |

## Project Structure

```
├── app/            # Screens and routes (Expo Router file-based routing)
├── components/     # Reusable UI components
├── constants/      # Theme, colors, and configuration
├── contexts/       # React Context providers (Auth, Onboarding, Theme)
├── features/       # Feature-specific modules
├── hooks/          # Custom React hooks
├── lib/            # Library utilities and clients
├── services/       # API and backend service layers
├── supabase/       # Supabase migrations and configuration
├── types/          # TypeScript type definitions
├── utils/          # General utility functions
└── assets/         # Images, fonts, and static assets
```

## The Team

### Project Leads

- Dr. Yosiah Yarbrough
- Nicole Fernandez-Vina

### CS342 Student Team

| Name | GitHub |
| ---- | ------ |
| Yuzhou Bian | [yuzhoubian](https://github.com/yuzhoubian) |
| Yihan Zhao | [ehan1han](https://github.com/ehan1han) |
| Janina Troper | [troper01](https://github.com/troper01) |
| Lour Drick Valsote | [lourdrickvalsote](https://github.com/lourdrickvalsote) |
| Seyma Kilic | [Solskilic](https://github.com/Solskilic) |
| Nikita Gounder | [nikita-gounder](https://github.com/nikita-gounder) |

## License

This project is developed as part of Stanford University's CS342 course.
