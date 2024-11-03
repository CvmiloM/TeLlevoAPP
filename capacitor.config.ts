import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'AutoAPP',
  webDir: 'www',
  bundledWebRuntime: false,
  plugins: {
    Geolocation: {
      enabled: true
    }
  }
};

export default config;