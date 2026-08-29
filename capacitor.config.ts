import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize, KeyboardStyle } from '@capacitor/keyboard';
import { Style } from '@capacitor/status-bar';

const config: CapacitorConfig = {
  appId: 'lat.timqu.app',
  appName: 'TIMQU',
  webDir: 'dist/frontend/browser',
  server: {
    androidScheme: 'https'
  },
  plugins: {
  StatusBar: { overlaysWebView: false, style: Style.Dark, backgroundColor: '#0b0d13' },
  Keyboard: { resize: KeyboardResize.Body, style: KeyboardStyle.Dark, resizeOnFullScreen: true },
  GoogleAuth: {
    scopes: ['profile', 'email'],
    androidClientId: '259954016870-carbome69mftn4pcfirb31qbc6uqq08v.apps.googleusercontent.com',
    serverClientId: '259954016870-carbome69mftn4pcfirb31qbc6uqq08v.apps.googleusercontent.com',
    forceCodeForRefreshToken: true
  }
  }
};

export default config;
