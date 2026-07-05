import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.korixa.app',
  appName: 'Korixa',
  webDir: 'public',
  server: {
    url: 'https://www.korixapay.com',
    cleartext: true
  }
};

export default config;
