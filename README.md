# SchoolKit

SchoolKit is a cross-platform application developed for the CS342: Building for Digital Health course at Stanford University (Winter 2026). This project aims to support young cancer survivors by providing coordinated academic and social support from parents and teachers to ensure a smoother, more successful transition back into the classroom.

**GitHub Repository:** [https://github.com/CS342/2026-SchoolKit](https://github.com/CS342/2026-SchoolKit)

## Need Statement

Young cancer survivors returning to school need coordinated academic and social support from parents and teachers to ensure a smoother, more successful transition back into the classroom.

## Download / Access

- **iOS:** Download via [TestFlight](https://testflight.apple.com/) (invite required)
- **Web:** Access the live web version at [https://schoolkit-five.vercel.app](https://schoolkit-five.vercel.app)

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

2. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```

3. Set up environment variables:
   - Create a `.env` file in the root directory with your Supabase credentials.

### Running the App

**Mobile (iOS / Android):**
```bash
npx expo start
```
Scan the QR code with the Expo Go app on your device, or press `i` for iOS simulator / `a` for Android emulator.

**Web:**
```bash
npm run web
```
This launches the app in your browser at `http://localhost:8081`.

## Implemented Features

### Authentication & Onboarding
- Email/password sign-up and sign-in with password strength validation
- Email confirmation flow
- Guest access (anonymous sign-in)
- Multi-step onboarding: name entry, role selection (student K-8, student high school, parent, staff), grade level, school journey status, topic preferences, and AI voice selection
- Web-optimized split layout for auth/onboarding pages (branded panel + form)

### Home Feed (For You)
- Personalized topic recommendations based on user role and selected interests
- Topic cards with category-based icons and gradients
- Topic detail pages with in-depth educational content

### Resource Topics
- Understanding Cancer
- Finding Support
- Peer Support
- School-Life Balance
- School Nurse resources
- Help & Support page

### Stories
- Community stories shared by other users
- Story creation with text input
- Story detail view
- Moderation system with rejected stories tracking

### Library (Bookmarks)
- Save and organize favorite resources
- Segmented tabs: All, Saved, Downloaded
- Offline access to downloaded content

### Journal
- Personal journal entries for reflection
- Create, view, and manage journal entries

### Profile & Settings
- Role-based user profiles
- Edit name, role, grade level, school status, and topic preferences
- Dark mode / light mode toggle
- About page
- Sign out

### Design Editor
- Visual design editor with canvas
- Design templates and custom creation
- Shareable designs via unique token links

### Cross-Platform (iOS, Android, Web)
- Single shared codebase using React Native + Expo
- Responsive web layout with sidebar navigation on desktop/tablet and bottom tabs on mobile
- Web-specific adaptations: `window.confirm()` dialogs, layout-aware width calculations, split-layout auth pages
- Dark mode support across all platforms

## Architecture

- **Frontend:** React Native + Expo with Expo Router (file-based routing) and TypeScript
- **Backend:** Supabase (Auth, PostgreSQL database, auto-generated REST API)
- **State Management:** React Context (Auth, Onboarding, Theme) + Zustand
- **AI Integration:** OpenAI API for content generation and voice features
- **Styling:** React Native StyleSheet with responsive breakpoints via `useResponsive` hook

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [React Native](https://reactnative.dev/) + [Expo](https://expo.dev/) |
| Routing | [Expo Router](https://docs.expo.dev/router/introduction/) |
| Language | [TypeScript](https://www.typescriptlang.org/) |
| Backend | [Supabase](https://supabase.io/) (Auth, PostgreSQL, APIs) |
| AI | [OpenAI API](https://platform.openai.com/) |
| State | React Context + [Zustand](https://github.com/pmndrs/zustand) |
| Animations | [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/) |

## The Team

### Project Leads
- Dr. Yosiah Yarbrough
- Nicole Fernandez-Vina

### CS342 Student Team
| Name | GitHub |
|------|--------|
| Yuzhou Bian | [yuzhoubian](https://github.com/yuzhoubian) |
| Yihan Zhao | [ehan1han](https://github.com/ehan1han) |
| Janina Troper | [troper01](https://github.com/troper01) |
| Lour Drick Valsote | [lourdrickvalsote](https://github.com/lourdrickvalsote) |
| Seyma Kilic | [Solskilic](https://github.com/Solskilic) |
| Nikita Gounder | [nikita-gounder](https://github.com/nikita-gounder) |

## License

This project is developed as part of Stanford University's CS342 course.
