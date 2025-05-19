module.exports = {
  expo: {
    name: "iphyto",
    slug: "iphyto",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    "scheme": "iphyto",
    "deepLinks": ["success", "cancel"],
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/images/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff"
      }
    },
    web: {
      favicon: "./assets/images/favicon.png"
    },
    extra: {
      supabaseUrl: "https://qmcbspkauhvufodbbwdn.supabase.co",
      supabaseAnonKey:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtY2JzcGthdWh2dWZvZGJid2RuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIzODk4OTksImV4cCI6MjA1Nzk2NTg5OX0.vY9M45YxaKZZ0vBFD8WGgbE6s8TP3Bf7PhJZfWao_qA",
      stripePublishableKey:"pk_test_51RQUNq4KRNSut1EI28mDH6m8GHEQacVfHeYRRGPP0qsmhuKDJaeuqi7dLQH2HOnIb3xEYdrRrK7Pz6dGY7rVej1i00Nn8SPrXi",
    },
  }
}; 