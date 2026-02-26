# SchoolKit

SchoolKit is a mobile application developed for the CS342: Building for Digital Health course at Stanford University (Winter 2026). This project aims to support young cancer survivors by providing coordinated academic and social support from parents and teachers to ensure a smoother, more successful transition back into the classroom.

## 🎯 Need Statement

Young cancer survivors returning to school need coordinated academic and social support from parents and teachers to ensure a smoother, more successful transition back into the classroom.

## ✨ Features

*   **User Onboarding:** A guided, multi-step process for new users (survivors, parents, and teachers) to set up their profiles.
*   **Role-Based Profiles:** Customizable profiles for each user type, capturing relevant information.
*   **Topic Exploration:** A section for users to find and learn about relevant topics concerning the back-to-school transition.
*   **Search Functionality:** The ability to search for resources or connect with others.
*   **Secure Backend:** User data and authentication managed by Supabase.

## 🏗️ Architecture

The application is built with a client-server architecture.

*   **Frontend (Client):**
    *   A mobile application built with **React Native** and **Expo**.
    *   Handles all user interface, state management, and user interactions.

*   **Backend (Server):**
    *   **Supabase** provides the backend-as-a-service.
    *   **Supabase Auth:** Manages user authentication (signup, login).
    *   **PostgreSQL Database:** A relational database for storing all application data (user profiles, topics, etc.).
    *   **Supabase API:** A PostgREST API that provides a secure interface for the frontend to communicate with the database.

*   **Data Flow:**
    1.  The user interacts with the **React Native App**.
    2.  The app sends secure HTTPS requests to **Supabase** endpoints.
    3.  **Supabase Auth** handles authentication requests.
    4.  The **Supabase API** handles data-related requests (Create, Read, Update, Delete).
    5.  The API layer reads from or writes to the **PostgreSQL Database** and returns the result to the mobile app.


## 🛠️ Tech Stack

*   **Frontend:**
    *   [React Native](https://reactnative.dev/): Mobile application framework.
    *   [Expo](https://expo.dev/): Platform for building and deploying React Native apps.
    *   [Expo Router](https://expo.github.io/router/): File-based routing for React Native.
    *   [TypeScript](https://www.typescriptlang.org/): Typed superset of JavaScript.
*   **Backend:**
    *   [Supabase](https://supabase.io/): Backend-as-a-Service platform.
        *   **Authentication:** Manages user sign-up, login, and sessions.
        *   **PostgreSQL Database:** For relational data storage.
        *   **Auto-generated APIs:** Provides instant, secure APIs for database interaction.

## 🚀 Getting Started

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Start the development server:**
    ```bash
    npx expo start
    ```
    This will provide you with a QR code to run the app on your device using the Expo Go app or to run it in an iOS/Android simulator.

3.  **Start the web version:**
    ```bash
    npm run web
    ```
    This launches the app in your browser at `http://localhost:8081`. The web version features responsive design that adapts to both desktop and mobile screen sizes.

## 🌐 Web Platform

SchoolKit also runs as a web application via Expo Web, sharing the same codebase as the mobile app.

*   **Responsive Design:** Adaptive layouts for desktop and mobile browsers using a `WebContainer` component.
*   **Cross-Platform Storage:** A unified storage adapter that uses `AsyncStorage` on mobile and `localStorage` on web.
*   **Web Authentication:** OAuth login flow configured for browser environments.
*   **Environment Variables:** Loaded via `.env` using `dotenv` for the web build process.

## 👥 The Team

### Project Leads
*   Dr. Yosiah Yarbrough
*   Nicole Fernandez-Vina

### CS342 Student Team
| Name                 | GitHub                                     |
| -------------------- | ------------------------------------------ |
| Yuzhou Bian          | [yuzhoubian](https://github.com/yuzhoubian) |
| Yihan Zhao           | [ehan1han](https://github.com/ehan1han)     |
| Janina Troper        | [troper01](https://github.com/troper01)     |
| Lour Drick Valsote   | [lourdrickvalsote](https://github.com/lourdrickvalsote) |
| Seyma Kilic          | [Solskilic](https://github.com/Solskilic) |
| Nikita Gounder       | [nikita-gounder](https://github.com/nikita-gounder) |