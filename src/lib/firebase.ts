import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

type FirebaseServices = {
  app: FirebaseApp;
  db: Firestore;
};

let servicesPromise: Promise<FirebaseServices | null> | null = null;

function readConfig() {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  const appId = import.meta.env.VITE_FIREBASE_APP_ID;

  if (!apiKey || !authDomain || !projectId || !appId) return null;

  return {
    apiKey,
    authDomain,
    projectId,
    appId,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  };
}

export function isFirebaseConfigured(): boolean {
  return readConfig() != null;
}

export function loadFirebase(): Promise<FirebaseServices | null> {
  const config = readConfig();
  if (!config) return Promise.resolve(null);
  if (servicesPromise) return servicesPromise;

  servicesPromise = (async () => {
    const [{ getApps, initializeApp }, { getFirestore }] = await Promise.all([
      import('firebase/app'),
      import('firebase/firestore'),
    ]);
    const app = getApps().length ? getApps()[0] : initializeApp(config);

    if (config.measurementId) {
      try {
        const { getAnalytics, isSupported } = await import('firebase/analytics');
        if (await isSupported()) getAnalytics(app);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'unknown error';
        console.warn('[Firebase] Analytics skipped:', message);
      }
    }

    return { app, db: getFirestore(app) };
  })().catch((error: unknown) => {
    servicesPromise = null;
    throw error;
  });

  return servicesPromise;
}

export async function loadFirebaseAuth(): Promise<(FirebaseServices & { auth: Auth }) | null> {
  const services = await loadFirebase();
  if (!services) return null;
  const { getAuth } = await import('firebase/auth');
  return { ...services, auth: getAuth(services.app) };
}
