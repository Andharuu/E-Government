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
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    const handleExpired = () => {
      setUser(null);
      setToken(null);
      setSessionExpired(true);
    };

    window.addEventListener('govconnect:session-expired', handleExpired);

    // Periodic check token expiration (F-M1)
    const checkTimer = setInterval(() => {
      const currentToken = localStorage.getItem('govconnect_token');
      if (currentToken) {
        try {
          const payload = JSON.parse(atob(currentToken.split('.')[1]));
          if (payload.exp && Date.now() >= payload.exp * 1000) {
            handleExpired();
          }
        } catch {}
      }
    }, 60000);

    return () => {
      window.removeEventListener('govconnect:session-expired', handleExpired);
      clearInterval(checkTimer);
    };
  }, []);

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

      {/* Grace period / Session Expiry Modal (F-M1) */}
      {sessionExpired && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#171F2F] text-slate-900 dark:text-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-[#243048]">
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center mb-4 text-xl">
              <i className="fa-solid fa-clock-rotate-left"></i>
            </div>
            <h3 className="text-lg font-bold mb-2">Sesi Masuk Berakhir</h3>
            <p className="text-sm text-slate-600 dark:text-[#BDD8E9]/80 mb-6 leading-relaxed">
              Sesi autentikasi Anda telah kedaluwarsa demi menjaga keamanan akun. Silakan masuk kembali untuk melanjutkan aktivitas.
            </p>
            <button
              type="button"
              onClick={() => {
                setSessionExpired(false);
                window.location.href = '/login';
              }}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors cursor-pointer text-sm"
            >
              Masuk Kembali
            </button>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}