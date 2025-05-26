import 'dotenv/config';
import { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'ELIX',
  slug: 'elix',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'dark',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#000000'
  },
  assetBundlePatterns: [
    '**/*'
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.elix.app'
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#000000'
    },
    package: 'com.elix.app'
  },
  web: {
    favicon: './assets/favicon.png'
  },
  extra: {
    googleAiApiKey: process.env.GOOGLE_AI_API_KEY,
    eas: {
      projectId: "your-project-id"
    }
  },
  plugins: [
    'expo-router'
  ],
  env: {
    GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY
  }
}); 