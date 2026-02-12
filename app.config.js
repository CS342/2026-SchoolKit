module.exports = {
  expo: {
    name: "SchoolKit",
    slug: "schoolkit",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "automatic",
    splash: {
      resizeMode: "contain",
      backgroundColor: "#7B68EE"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.schoolkit.app"
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#7B68EE"
      },
      package: "com.schoolkit.app"
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/favicon.png"
    },
    plugins: [
      "expo-router"
    ],
    experiments: {
      typedRoutes: true
    },
    scheme: "schoolkit"
  }
};
