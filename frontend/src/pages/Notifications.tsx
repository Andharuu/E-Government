import { useState, useCallback } from 'react';
import { FontAwesome } from '../components/ui';
import { type NotificationItem } from '../services/api';
import { useNotifications } from '../hooks/useNotifications';

type FilterType = 'all' | 'unread' | 'success' | 'warning' | 'info' | 'system';

const FILTER_TABS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'Semua' },
  { key: 'unread', label: 'Belum dibaca' },
  { key: 'success', label: 'Sukses' },
  { key: 'warning', label: 'Peringatan' },
  { key: 'info', label: 'Info' },
  { key: 'system', label: 'Sistem' },
];

const PALETTE: Record<string, { icon: string; badge: string; border: string; accent: string }> = {
  success: { icon: 'bg-emerald-100 text-emerald-600', badge: 'bg-emerald-100 text-emerald-700', border: 'border-emerald-100', accent: '#10B981' },
  warning: { icon: 'bg-amber-100 text-amber-600', badge: 'bg-amber-100 text-amber-700', border: 'border-amber-100', accent: '#F59E0B' },
  info: { icon: 'bg-[#BDD8E9]/40 text-[#0A4174]', badge: 'bg-[#BDD8E9]/40 text-[#0A4174]', border: 'border-[#BDD8E9]/60', accent: '#0A4174' },
  system: { icon: 'bg-[#BDD8E9]/25 text-[#49769F]', badge: 'bg-[#BDD8E9]/25 text-[#49769F]', border: 'border-[#BDD8E9]/40', accent: '#49769F' },
};

const ICON_MAP: Record<string, string> = {
  success: 'check-circle',
  warning: 'triangle-exclamation',
  info: 'circle-info',
  system: 'sparkles',
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'Baru saja';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}j lalu`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}h lalu`;
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function NotifCard({
  notif,
  onRead,
  onDelete,
  deleting,
}: {
  notif: NotificationItem;
  onRead: (id: number) => void;
  onDelete: (id: number) => void;
  deleting: boolean;
}) {
  const pal = PALETTE[notif.type] ?? PALETTE.system;
  const icon = ICON_MAP[notif.type] ?? 'sparkles';

  return (
    <div
      onClick={() => !notif.read && onRead(notif.id)}
      className={`group relative flex items-start gap-4 p-5 rounded-2xl border transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-lg ${
        notif.read ? 'bg-white border-slate-100 hover:border-[#BDD8E9]/50' : `bg-white/80 ${pal.border} hover:shadow-xl`
      }`}
    >
      {!notif.read && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-10 rounded-r-full" style={{ backgroundColor: pal.accent }} />
      )}
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110 ${pal.icon}`}>
        <FontAwesome name={icon} variant="solid" className="text-sm" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className={`text-[14px] font-bold leading-snug ${notif.read ? 'text-[#49769F]' : 'text-[#001D39]'}`}>
              {notif.title}
            </h3>
            <p className="text-[13px] text-[#49769F] mt-1 leading-relaxed line-clamp-3">{notif.desc || '-'}</p>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <span className="text-[11px] text-[#6EA2B3] font-medium whitespace-nowrap tabular-nums">{timeAgo(notif.created_at)}</span>
            {!notif.read && (
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${pal.badge}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                Baru
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          {!notif.read && (
            <button
              onClick={(e) => { e.stopPropagation(); onRead(notif.id); }}
              className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#49769F] hover:text-[#0A4174] transition-colors cursor-pointer"
            >
              <FontAwesome name="check" className="text-xs" />
              Tandai sudah dibaca
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(notif.id); }}
            disabled={deleting}
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-slate-400 hover:text-rose-600 transition-colors cursor-pointer ml-auto"
          >
            {deleting ? <FontAwesome name="spinner" spin className="text-xs" /> : <FontAwesome name="trash" className="text-xs" />}
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
}

export function NotificationsPage() {
  const token = localStorage.getItem('govconnect_token');
  const {
    notifications,
    unreadCount,
    isLoading,
    isRealtimeConnected,
    markRead,
    markAllRead,
    remove,
    clearAll,
    refresh,
  } = useNotifications(token, { pollInterval: 20000, useSSE: true });

  const [filter, setFilter] = useState<FilterType>('all');
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [clearingAll, setClearingAll] = useState(false);

  const showFeedback = useCallback((type: 'success' | 'error', text: string) => {
    setActionFeedback({ type, text });
    setTimeout(() => setActionFeedback(null), 3000);
  }, []);

  const handleRead = useCallback(async (id: number) => {
    await markRead(id);
    showFeedback('success', 'Notifikasi ditandai sudah dibaca.');
  }, [markRead, showFeedback]);

  const handleDelete = useCallback(async (id: number) => {
    if (!window.confirm('Hapus notifikasi ini?')) return;
    setDeletingId(id);
    try {
      await remove(id);
      showFeedback('success', 'Notifikasi berhasil dihapus.');
    } catch {
      showFeedback('error', 'Gagal menghapus notifikasi.');
    } finally {
      setDeletingId(null);
    }
  }, [remove, showFeedback]);

  const handleMarkAllRead = useCallback(async () => {
    try {
      await markAllRead();
      showFeedback('success', 'Semua notifikasi ditandai sudah dibaca.');
    } catch {
      showFeedback('error', 'Gagal menandai semua notifikasi.');
    }
  }, [markAllRead, showFeedback]);

  const handleClearAll = useCallback(async () => {
    if (!window.confirm('Hapus SELURUH notifikasi? Tindakan ini tidak dapat dibatalkan.')) return;
    setClearingAll(true);
    try {
      await clearAll();
      showFeedback('success', 'Seluruh notifikasi berhasil dibersihkan.');
    } catch {
      showFeedback('error', 'Gagal membersihkan notifikasi.');
    } finally {
      setClearingAll(false);
    }
  }, [clearAll, showFeedback]);

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'success' || filter === 'warning' || filter === 'info' || filter === 'system') return n.type === filter;
    return true;
  });

  const counts: Record<FilterType, number> = {
    all: notifications.length,
    unread: notifications.filter((n) => !n.read).length,
    success: notifications.filter((n) => n.type === 'success').length,
    warning: notifications.filter((n) => n.type === 'warning').length,
    info: notifications.filter((n) => n.type === 'info').length,
    system: notifications.filter((n) => n.type === 'system').length,
  };

  return (
    <div className="w-full space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] leading-[36px] font-semibold text-[#001D39] tracking-[-0.02em]">Notifikasi</h1>
          <p className="text-[14px] leading-[22px] font-normal text-[#49769F] mt-0.5">Notifikasi realtime aktivitas autofill &amp; sistem</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span
            className={`inline-flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-full border transition-all ${
              isRealtimeConnected ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm' : 'bg-slate-50 text-slate-500 border-slate-200'
            }`}
            title={isRealtimeConnected ? 'SSE realtime aktif' : 'Polling fallback aktif setiap 20 detik'}
          >
            <span className={`w-2 h-2 rounded-full ${isRealtimeConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            {isRealtimeConnected ? 'Realtime aktif' : 'Polling · 20s'}
          </span>
          <button
            type="button"
            onClick={() => refresh()}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 text-[13px] font-medium text-[#49769F] bg-white border border-[#BDD8E9]/70 hover:border-[#0A4174] hover:text-[#0A4174] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all cursor-pointer shadow-xs"
          >
            <FontAwesome name="rotate-right" className={`text-xs ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 text-[13px] font-medium text-white bg-[#0A4174] hover:bg-[#001D39] rounded-xl transition-colors cursor-pointer shadow-sm"
            >
              <FontAwesome name="check-double" className="text-xs" />
              <span>Tandai semua dibaca</span>
            </button>
          )}
          {notifications.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              disabled={clearingAll}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 text-[13px] font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <FontAwesome name="trash" className="text-xs" />
              <span>{clearingAll ? 'Menghapus...' : 'Hapus semua'}</span>
            </button>
          )}
        </div>
      </div>

      {actionFeedback && (
        <div
          className={`p-4 rounded-2xl border shadow-sm flex items-center gap-2.5 text-[13px] font-semibold ${
            actionFeedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <FontAwesome
            name={actionFeedback.type === 'success' ? 'check-circle' : 'circle-x'}
            className={`text-sm shrink-0 ${actionFeedback.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}
          />
          <span>{actionFeedback.text}</span>
        </div>
      )}

      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {FILTER_TABS.map((tab) => {
          const count = counts[tab.key];
          const isActive = filter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-semibold transition-all whitespace-nowrap cursor-pointer ${
                isActive ? 'bg-[#0A4174] text-white shadow-sm' : 'bg-white text-[#49769F] border border-[#BDD8E9]/60 hover:border-[#7BBDE8] hover:text-[#001D39]'
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] text-[10px] font-bold rounded-full px-1 ${isActive ? 'bg-white/20 text-white' : 'bg-[#BDD8E9]/25 text-[#0A4174]'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-start gap-4 p-5 rounded-2xl border border-slate-100 bg-white animate-pulse">
              <div className="w-11 h-11 rounded-xl bg-slate-200 shrink-0" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-3.5 bg-slate-200 rounded w-2/3" />
                <div className="h-2.5 bg-slate-200 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4 shadow-inner">
            <FontAwesome name="bell-slash" variant="solid" className="text-2xl" />
          </div>
          <p className="text-[15px] font-bold text-slate-700">{filter === 'unread' ? 'Semua sudah dibaca' : 'Belum ada notifikasi'}</p>
          <p className="text-[13px] text-slate-400 mt-1 text-center max-w-sm">
            {filter === 'unread'
              ? 'Tidak ada notifikasi yang belum dibaca.'
              : filter === 'all'
              ? 'Notifikasi aktivitas autofill akan muncul di sini secara realtime.'
              : `Tidak ada notifikasi dengan tipe "${FILTER_TABS.find((t) => t.key === filter)?.label}" saat ini.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((n) => (
            <NotifCard key={n.id} notif={n} onRead={handleRead} onDelete={handleDelete} deleting={deletingId === n.id} />
          ))}
        </div>
      )}

      {notifications.length > 0 && (
        <p className="text-center text-[12px] text-slate-400 font-medium">
          Menampilkan {filtered.length} dari {notifications.length} notifikasi
          {unreadCount > 0 && <span className="text-blue-500"> · {unreadCount} belum dibaca</span>}
        </p>
      )}
    </div>
  );
}