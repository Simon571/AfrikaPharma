import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pajopharma.app',
  appName: 'PAJO PHARMA',
  // For mobile builds we emit static files under `.next/server/pages` when
  // Next is run with `output: 'export'`. Use that directory for Capacitor
  // so `npx cap sync` can find an index.html. Keep 'out' as the default if
  // MOBILE_BUILD is not set in other environments.
  webDir: process.env.MOBILE_BUILD === 'true' ? '.next/server/pages' : 'out',
  server: process.env.CAPACITOR_SERVER_URL
    ? { url: process.env.CAPACITOR_SERVER_URL, androidScheme: 'https' }
    : { androidScheme: 'https' },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#ffffff",
      showSpinner: false
    },
    StatusBar: {
      style: "dark",
      backgroundColor: "#ffffff"
    },
    App: {
      statusBarStyle: "dark"
    }
  }
};

export default config;
