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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isExtensionConnected, setIsExtensionConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Cek apakah ada transfer token dari Extension via hash (#token=...)
    let initialToken = localStorage.getItem('govconnect_token');
    const hash = window.location.hash;

    if (hash && hash.includes('token=')) {
      try {
        const params = new URLSearchParams(hash.substring(1));
        const hashToken = params.get('token');
        if (hashToken) {
          initialToken = hashToken;
          localStorage.setItem('govconnect_token', hashToken);
          // Bersihkan hash dari URL agar rapi
          window.history.replaceState(null, '', window.location.pathname);
        }
      } catch (err) {
        console.error('Error parsing token from hash:', err);
      }
    }

    if (initialToken) {
      setToken(initialToken);
      authApi.me()
        .then(res => {
          setUser(res.data);
          // Sync balik ke extension
          window.postMessage({
            type: 'GOVCONNECT_WEB_AUTH_SYNC',
            token: initialToken,
            email: res.data.email
          }, '*');
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
      window.postMessage({ type: 'GOVCONNECT_PING_EXTENSION' }, '*');
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
    }, '*');
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
    }, '*');
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