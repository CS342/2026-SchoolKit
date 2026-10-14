module.exports = {
  expo: {
    name: "SchoolKit",
    slug: "schoolkit",
    version: "1.0.0",
    scheme: "schoolkit",
    orientation: "portrait",
    icon: "./assets/images/SchoolKit.png",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/images/SchoolKit.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "assets/**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.schoolkit.app"
    },
    android: {
      package: "com.schoolkit.app",
      adaptiveIcon: {
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundColor: "#ffffff"
      }
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      "expo-audio",
      "expo-asset",
      "expo-font",
      "expo-image",
      "expo-splash-screen",
      "expo-status-bar",
      "expo-web-browser"
    ],
    experiments: {
      typedRoutes: true
    }
  }
};
