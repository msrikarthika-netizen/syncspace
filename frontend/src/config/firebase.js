import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'appId'];
const missingKeys = requiredKeys.filter((key) => !firebaseConfig[key]);

if (missingKeys.length) {
  throw new Error(`Firebase is not configured. Missing: ${missingKeys.join(', ')}`);
}

const app = initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(app);

// Keep the Firebase session across browser restarts. Firebase stores only its
// own refresh/session state; the application never stores the user password.
setPersistence(firebaseAuth, browserLocalPersistence).catch((error) => {
  console.error('Unable to persist Firebase authentication:', error);
});

export default app;
