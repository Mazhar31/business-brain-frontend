import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.40548bc00bed4c3da483cace29c77fbf',
  appName: 'brain-byte-nexus',
  webDir: 'dist',
  server: {
    url: 'https://40548bc0-0bed-4c3d-a483-cace29c77fbf.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true
    }
  },
  ios: {
    contentInset: 'automatic',
    allowsLinkPreview: false,
    handleApplicationNotifications: false
  }
};

export default config;