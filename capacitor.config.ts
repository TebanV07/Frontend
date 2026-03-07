import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.redsocialai.app',
  appName: 'RedSocialIA',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    // Plugins adicionales pueden ir aquí
  }
};

export default config;
