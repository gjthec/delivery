import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, User } from 'firebase/auth';
import { IS_FIREBASE_ENABLED, firebaseConfig } from './config';

const AUTH_FALLBACK_KEY = 'platform_admin_auth_fallback_v1';

let auth: ReturnType<typeof getAuth> | null = null;
if (IS_FIREBASE_ENABLED && firebaseConfig.apiKey) {
  try {
    const app = initializeApp(firebaseConfig, 'admin-auth-app');
    auth = getAuth(app);
  } catch (error) {
    console.error('Erro ao inicializar Firebase Auth:', error);
  }
}

const setFallbackAuth = (isAuthenticated: boolean) => {
  localStorage.setItem(AUTH_FALLBACK_KEY, JSON.stringify({ isAuthenticated }));
};

const getFallbackAuth = () => {
  const value = localStorage.getItem(AUTH_FALLBACK_KEY);
  return value ? JSON.parse(value).isAuthenticated === true : false;
};

export const authService = {
  login: async (email: string, password: string) => {
    if (auth) {
      return signInWithEmailAndPassword(auth, email, password);
    }

    if (email && password) {
      setFallbackAuth(true);
      return;
    }

    throw new Error('Credenciais inválidas');
  },
  logout: async () => {
    if (auth) {
      await signOut(auth);
      return;
    }
    setFallbackAuth(false);
  },
  subscribe: (callback: (user: User | null) => void) => {
    if (auth) {
      return onAuthStateChanged(auth, callback);
    }

    callback(getFallbackAuth() ? ({ uid: 'fallback-user' } as User) : null);
    return () => undefined;
  }
};
