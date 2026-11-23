import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authApi, type User } from '../services/api';
import { FontAwesome } from '../components/ui';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isExtensionConnected: boolean;
  login: (email: string, password: string) => Promise<User>;
    register: (email: string, password: string) => Promise<User>;
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
      // Hanya tampilkan modal kedaluwarsa sesi jika sebelumnya user memang sedang aktif login
      setUser((currentUser) => {
        if (currentUser) {
          setSessionExpired(true);
        }
        return null;
      });
      setToken(null);
    };

    window.addEventListener('govconnect:session-expired', handleExpired);

    return () => {
      window.removeEventListener('govconnect:session-expired', handleExpired);
    };
  }, []);

  useEffect(() => {
    // Sesi diotentikasi via HttpOnly Cookie (Credentials).
    // Panggil authApi.me() secara langsung untuk bootstrapping sesi.
    authApi.me()
      .then(res => {
        setUser(res.data);
        setToken('cookie_session');
        // Bersihkan token lama dari localStorage bila ada (migrasi P1)
        localStorage.removeItem('govconnect_token');
        if (res.data.email) {
          localStorage.setItem('govconnect_email', res.data.email);
        }
        // Sync ke extension content script
        window.postMessage({
          type: 'GOVCONNECT_WEB_AUTH_SYNC',
          authenticated: true,
          isLogout: false,
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

    // 2. Listener komunikasi dengan Chrome Extension Content Script
    const handleMessage = (event: MessageEvent) => {
      // Verifikasi ketat: hanya terima pesan dari window sendiri + origin yang diizinkan.
      if (event.source !== window) return;
      if (!ALLOWED_ORIGINS.includes(event.origin)) return;
      if (!event.data || typeof event.data !== 'object') return;

      if (event.data.type === 'GOVCONNECT_EXTENSION_READY' || event.data.type === 'GOVCONNECT_EXTENSION_PONG') {
        setIsExtensionConnected(true);

        // Jika web belum login, tapi extension sudah punya token -> fetch me
        if (event.data.token) {
          setUser(currentUser => {
            if (!currentUser) {
              setToken(event.data.token);
              authApi.me()
                .then(res => setUser(res.data))
                .catch(() => {});
            }
            return currentUser;
          });
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
    // Token kini diamankan di HttpOnly Cookie, TIDAK lagi disimpan di localStorage.
    localStorage.removeItem('govconnect_token');
    localStorage.setItem('govconnect_email', email);
    setToken('cookie_session');

    const me = await authApi.me();
    setUser(me.data);

    // Broadcast ke extension content script (one-time in-memory relay untuk sinkronisasi instan)
    window.postMessage({
      type: 'GOVCONNECT_WEB_AUTH_SYNC',
      authenticated: true,
      isLogout: false,
      token: access_token,
      email: email
    }, WEB_ORIGIN);

    return me.data;
  };

  const register = async (email: string, password: string) => {
    await authApi.register(email, password);
    return await login(email, password);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      console.warn("Logout API request error:", e);
    }
    localStorage.removeItem('govconnect_token');
    localStorage.removeItem('govconnect_email');
    setToken(null);
    setUser(null);

    // Broadcast logout ke extension content script
    window.postMessage({
      type: 'GOVCONNECT_WEB_AUTH_SYNC',
      authenticated: false,
      isLogout: true,
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="card w-full max-w-[400px] p-6 shadow-lg">
            <div className="w-9 h-9 rounded-md bg-warn-soft border border-warn-line text-warn flex items-center justify-center mb-4 text-[14px]">
              <FontAwesome name="clock" />
            </div>
            <h3 className="text-[15px] font-semibold text-ink">Sesi masuk berakhir</h3>
            <p className="text-[12.5px] text-ink-2 mt-1.5 mb-5 leading-relaxed">
              Sesi autentikasi Anda telah kedaluwarsa demi menjaga keamanan akun. Silakan masuk
              kembali untuk melanjutkan aktivitas.
            </p>
            <button
              type="button"
              onClick={() => {
                setSessionExpired(false);
                if (window.location.pathname !== '/login') {
                  window.location.href = '/login';
                }
              }}
              className="btn btn-primary w-full"
            >
              Masuk kembali
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