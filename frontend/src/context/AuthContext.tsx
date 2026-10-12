import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authApi, type User } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isExtensionConnected: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Origin dashboard GovConnect yang diizinkan (untuk verifikasi postMessage).
const ALLOWED_ORIGINS = [
  window.location.origin,
].filter(Boolean);
const WEB_ORIGIN = window.location.origin;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isExtensionConnected, setIsExtensionConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Token HANYA diambil dari storage (tidak lagi dari URL hash — hash bocor
    // ke riwayat browser/Referer & dapat disuntik oleh tautan jahat).
    const initialToken = localStorage.getItem('govconnect_token');

    if (initialToken) {
      setToken(initialToken);
      authApi.me()
        .then(res => {
          setUser(res.data);
          // Sync balik ke extension (targetOrigin spesifik, bukan "*")
          window.postMessage({
            type: 'GOVCONNECT_WEB_AUTH_SYNC',
            token: initialToken,
            email: res.data.email
          }, WEB_ORIGIN);
        })
        .catch(() => {
          localStorage.removeItem('govconnect_token');
          localStorage.removeItem('govconnect_email');
          setToken(null);
          setUser(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }

    // 2. Listener komunikasi dengan Chrome Extension Content Script
    const handleMessage = (event: MessageEvent) => {
      // Verifikasi ketat: hanya terima pesan dari window sendiri + origin yang diizinkan.
      if (event.source !== window) return;
      if (!ALLOWED_ORIGINS.includes(event.origin)) return;
      if (!event.data || typeof event.data !== 'object') return;

      if (event.data.type === 'GOVCONNECT_EXTENSION_READY' || event.data.type === 'GOVCONNECT_EXTENSION_PONG') {
        setIsExtensionConnected(true);

        // Jika web belum login, tapi extension sudah punya token -> auto-sync
        const currentSavedToken = localStorage.getItem('govconnect_token');
        if (!currentSavedToken && event.data.token) {
          localStorage.setItem('govconnect_token', event.data.token);
          if (event.data.email) {
            localStorage.setItem('govconnect_email', event.data.email);
          }
          setToken(event.data.token);
          authApi.me()
            .then(res => setUser(res.data))
            .catch(() => {});
        }
      }
    };

    window.addEventListener('message', handleMessage);

    // Ping extension untuk cek keterhubungan
    const pingTimer = setTimeout(() => {
      window.postMessage({ type: 'GOVCONNECT_PING_EXTENSION' }, WEB_ORIGIN);
    }, 400);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearTimeout(pingTimer);
    };
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    const { access_token } = res.data;
    localStorage.setItem('govconnect_token', access_token);
    localStorage.setItem('govconnect_email', email);
    setToken(access_token);
    const me = await authApi.me();
    setUser(me.data);

    // Broadcast ke extension content script
    window.postMessage({
      type: 'GOVCONNECT_WEB_AUTH_SYNC',
      token: access_token,
      email: email
    }, WEB_ORIGIN);
  };

  const register = async (email: string, password: string) => {
    await authApi.register(email, password);
    await login(email, password);
  };

  const logout = () => {
    localStorage.removeItem('govconnect_token');
    localStorage.removeItem('govconnect_email');
    setToken(null);
    setUser(null);

    // Broadcast logout ke extension content script
    window.postMessage({
      type: 'GOVCONNECT_WEB_AUTH_SYNC',
      token: null,
      email: null
    }, WEB_ORIGIN);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isExtensionConnected,
      login,
      register,
      logout,
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}