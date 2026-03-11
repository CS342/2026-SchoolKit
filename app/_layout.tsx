import { View } from 'react-native';
import { useFonts, Raleway_400Regular, Raleway_500Medium, Raleway_600SemiBold, Raleway_700Bold, Raleway_800ExtraBold, Raleway_400Regular_Italic } from '@expo-google-fonts/raleway';
import { StatusBar } from 'expo-status-bar';
import { Stack, usePathname } from 'expo-router';
import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from '../contexts/AuthContext';
import { OnboardingProvider } from '../contexts/OnboardingContext';
import { OfflineProvider } from '../contexts/OfflineContext';
import { StoriesProvider } from '../contexts/StoriesContext';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { JournalProvider } from '../contexts/JournalContext';
import { AccomplishmentProvider } from '../contexts/AccomplishmentContext';
import { OfflineBanner } from '../components/OfflineBanner';
import PieceRevealOverlay from '../components/puzzle/PieceRevealOverlay';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { PersistentSidebar } from '../components/PersistentSidebar';
import { useResponsive } from '../hooks/useResponsive';

function InnerLayout() {
  const { isDark, colors } = useTheme();
  const { isWeb, isDesktop, isTablet } = useResponsive();
  const isWebDesktop = isWeb && (isDesktop || isTablet);
  const pathname = usePathname();
  const isWelcomePage = pathname === '/welcome' || pathname === '/welcome/';
  const isOnboardingPage = pathname.startsWith('/onboarding');
  const isAuthPage = pathname === '/auth' || pathname.startsWith('/auth');
  const isEditorPage = pathname.startsWith('/design/');
  const hideSidebar = isWelcomePage || isOnboardingPage || isAuthPage || isEditorPage;

  const navigationTheme = isDark
    ? {
      ...DarkTheme,
      colors: {
        ...DarkTheme.colors,
        background: colors.appBackground,
        card: colors.white,
        text: colors.textDark,
        primary: colors.primary,
      },
    }
    : {
      ...DefaultTheme,
      colors: {
        ...DefaultTheme.colors,
        background: colors.appBackground,
        card: colors.white,
        text: colors.textDark,
        primary: colors.primary,
      },
    };

  const stack = (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(editor)" />
      <Stack.Screen name="share/[token]" />
      <Stack.Screen name="design-view/[id]" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="accomplishments" />
      <Stack.Screen name="chapter-detail" />
    </Stack>
  );

  return (
    <NavThemeProvider value={navigationTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <OfflineBanner />
      {isWebDesktop ? (
        <View style={{ flex: 1, flexDirection: 'row' }}>
          {!hideSidebar && <PersistentSidebar />}
          <View style={{ flex: 1 }}>
            {stack}
            <PieceRevealOverlay />
          </View>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {stack}
          <PieceRevealOverlay />
        </View>
      )}
    </NavThemeProvider>
  );
}

// Exporting RootLayout as default component
export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Raleway_400Regular,
    Raleway_500Medium,
    Raleway_600SemiBold,
    Raleway_700Bold,
    Raleway_800ExtraBold,
    Raleway_400Regular_Italic,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AuthProvider>
          <OfflineProvider>
            <OnboardingProvider>
              <StoriesProvider>
                <JournalProvider>
                  <AccomplishmentProvider>
                    <ErrorBoundary>
                      <InnerLayout />
                    </ErrorBoundary>
                  </AccomplishmentProvider>
                </JournalProvider>
              </StoriesProvider>
            </OnboardingProvider>
          </OfflineProvider>
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
