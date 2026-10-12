import { useEffect, useState, useCallback, useRef } from 'react';
import { notificationApi, type NotificationItem } from '../services/api';

interface UseNotificationsOptions {
  pollInterval?: number;
  initialLimit?: number;
  useSSE?: boolean;
}

interface UseNotificationsResult {
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  hasError: boolean;
  isRealtimeConnected: boolean;
  markRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
  remove: (id: number) => Promise<void>;
  clearAll: () => Promise<void>;
  pushLocal: (n: NotificationItem) => void;
  refresh: () => Promise<void>;
}

/**
 * Hook untuk memuat notifikasi realtime dengan fallback polling.
 * - Jika `useSSE` aktif, hook membuka EventSource agar notifikasi baru diterima secara langsung.
 * - Polling dilakukan setiap `pollInterval` ms (default 20 detik) untuk konsistensi.
 */
export function useNotifications(
  token: string | null,
  { pollInterval = 20000, initialLimit = 30, useSSE = true }: UseNotificationsOptions = {}
): UseNotificationsResult {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const lastIdRef = useRef(0);
  const sseCleanupRef = useRef<(() => void) | null>(null);

  const fetchInitial = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setHasError(false);
    try {
      const res = await notificationApi.get({ limit: initialLimit });
      setNotifications(res.data);
      if (res.data.length > 0) {
        lastIdRef.current = Math.max(...res.data.map(n => n.id));
      }
      const cnt = await notificationApi.getUnreadCount();
      setUnreadCount(cnt.data.count);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [token, initialLimit]);

  const fetchSince = useCallback(async () => {
    if (!token || lastIdRef.current === 0) return;
    try {
      const res = await notificationApi.get({ since_id: lastIdRef.current, limit: 50 });
      if (res.data.length > 0) {
        setNotifications(prev => [...res.data, ...prev].slice(0, 100));
        lastIdRef.current = Math.max(lastIdRef.current, ...res.data.map(n => n.id));
        setUnreadCount(prev => prev + res.data.filter(n => !n.read).length);
      }
    } catch {
      setHasError(true);
    }
  }, [token]);

  const refresh = useCallback(async () => {
    await fetchInitial();
  }, [fetchInitial]);

  const markRead = useCallback(async (id: number) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount(prev => Math.max(0, prev - 1));
    try {
      await notificationApi.markRead(id);
    } catch (e) {
      setHasError(true);
      throw e;
    }
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
    try {
      await notificationApi.markAllRead();
    } catch (e) {
      setHasError(true);
      throw e;
    }
  }, []);

  const remove = useCallback(async (id: number) => {
    const target = notifications.find(n => n.id === id);
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (target && !target.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    try {
      await notificationApi.delete(id);
    } catch (e) {
      setHasError(true);
      throw e;
    }
  }, [notifications]);

  const clearAll = useCallback(async () => {
    setNotifications([]);
    setUnreadCount(0);
    try {
      await notificationApi.clearAll();
    } catch (e) {
      setHasError(true);
      throw e;
    }
  }, []);

  const pushLocal = useCallback((n: NotificationItem) => {
    setNotifications(prev => [n, ...prev]);
    if (!n.read) setUnreadCount(prev => prev + 1);
    lastIdRef.current = Math.max(lastIdRef.current, n.id);
  }, []);

  // Initial load
  useEffect(() => {
    if (!token) {
      setNotifications([]);
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }
    fetchInitial();
  }, [token, fetchInitial]);

  // Polling fallback
  useEffect(() => {
    if (!token) return;
    const t = setInterval(() => {
      fetchSince();
    }, pollInterval);
    return () => clearInterval(t);
  }, [token, pollInterval, fetchSince]);

  // SSE realtime
  useEffect(() => {
    if (!token || !useSSE) return;
    let reconnectTimer: number | null = null;
    let cancelled = false;

    const connect = () => {
      if (cancelled) return;
      try {
        sseCleanupRef.current = notificationApi.stream(
          (notif) => {
            setIsRealtimeConnected(true);
            setNotifications(prev => {
              if (prev.some(n => n.id === notif.id)) return prev;
              lastIdRef.current = Math.max(lastIdRef.current, notif.id);
              return [notif, ...prev].slice(0, 100);
            });
            if (!notif.read) {
              setUnreadCount(prev => prev + 1);
            }
          },
          (data) => {
            setIsRealtimeConnected(true);
            if (typeof data.last_id === 'number') {
              lastIdRef.current = Math.max(lastIdRef.current, data.last_id);
            }
          },
          () => {
            setIsRealtimeConnected(false);
            if (sseCleanupRef.current) {
              sseCleanupRef.current();
              sseCleanupRef.current = null;
            }
            if (!cancelled) {
              reconnectTimer = window.setTimeout(connect, 4000);
            }
          }
        );
      } catch {
        setIsRealtimeConnected(false);
        if (!cancelled) {
          reconnectTimer = window.setTimeout(connect, 4000);
        }
      }
    };

    connect();
    return () => {
      cancelled = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      if (sseCleanupRef.current) {
        sseCleanupRef.current();
        sseCleanupRef.current = null;
      }
    };
  }, [token, useSSE]);

  return {
    notifications,
    unreadCount,
    isLoading,
    hasError,
    isRealtimeConnected,
    markRead,
    markAllRead,
    remove,
    clearAll,
    pushLocal,
    refresh,
  };
}
