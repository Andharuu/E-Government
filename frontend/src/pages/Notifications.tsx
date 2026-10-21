import { useState, useCallback } from 'react';
import { FontAwesome } from '../components/ui';
import { type NotificationItem } from '../services/api';
import { useNotifications } from '../hooks/useNotifications';

type FilterType = 'all' | 'unread' | 'success' | 'warning' | 'info' | 'system';

const FILTER_TABS: { key: FilterType; label: string; icon: string }[] = [
  { key: 'all', label: 'Semua', icon: 'layer-group' },
  { key: 'unread', label: 'Belum dibaca', icon: 'envelope' },
  { key: 'success', label: 'Sukses', icon: 'circle-check' },
  { key: 'warning', label: 'Peringatan', icon: 'triangle-exclamation' },
  { key: 'info', label: 'Info', icon: 'circle-info' },
  { key: 'system', label: 'Sistem', icon: 'bell' },
];

const PALETTE: Record<string, { iconColor: string }> = {
  success: { iconColor: 'text-emerald-400' },
  warning: { iconColor: 'text-amber-400' },
  info: { iconColor: 'text-[#7BBDE8]' },
  system: { iconColor: 'text-[#6EA2B3]' },
};

const ICON_MAP: Record<string, string> = {
  success: 'circle-check',
  warning: 'triangle-exclamation',
  info: 'circle-info',
  system: 'bell',
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
  const icon = ICON_MAP[notif.type] ?? 'bell';

  return (
    <div
      onClick={() => !notif.read && onRead(notif.id)}
      className={`group relative flex items-start gap-4 p-5 rounded-2xl border transition-all duration-200 cursor-pointer ${
        notif.read
          ? 'bg-[#171F2F] border-[#243048] hover:border-[#7BBDE8]/60'
          : 'bg-[#171F2F] border-[#243048] hover:border-[#7BBDE8] border-l-4 border-l-[#7BBDE8] shadow-sm'
      }`}
    >
      {/* Icon tanpa pembungkus langsung dari FontAwesome */}
      <div className="shrink-0 pt-0.5">
        <FontAwesome name={icon} variant="solid" className={`text-xl ${pal.iconColor}`} />
      </div>

      <div className="flex-1 min-w-0">
        {/* Header: Judul dan Waktu terpisah jelas */}
        <div className="flex items-start justify-between gap-3">
          <h3 className={`text-[15px] font-bold leading-snug tracking-tight ${notif.read ? 'text-[#BDD8E9]/75' : 'text-white'}`}>
            {notif.title}
          </h3>
          <span className="text-[12px] text-[#6EA2B3] font-medium whitespace-nowrap tabular-nums shrink-0 mt-0.5">
            {timeAgo(notif.created_at)}
          </span>
        </div>

        {/* Isi Pesan dengan pemisahan tipografi yang jelas */}
        {notif.desc && (
          <p className="text-[13.5px] leading-relaxed text-[#BDD8E9]/85 mt-2">
            {notif.desc}
          </p>
        )}

        {/* Action Row tanpa garis pembatas */}
        <div className="flex items-center justify-between gap-3 mt-3.5">
          {!notif.read ? (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onRead(notif.id); }}
              className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#7BBDE8] hover:text-white transition-colors cursor-pointer"
            >
              <FontAwesome name="check" className="text-xs" />
              <span>Tandai sudah dibaca</span>
            </button>
          ) : <div />}

          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(notif.id); }}
            disabled={deleting}
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#6EA2B3] hover:text-rose-400 transition-colors cursor-pointer ml-auto"
          >
            {deleting ? <FontAwesome name="spinner" spin className="text-xs" /> : <FontAwesome name="trash" className="text-xs" />}
            <span>Hapus</span>
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
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header Halaman tanpa garis pembatas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Notifikasi</h1>
          <p className="text-sm text-[#6EA2B3] mt-1">Aktivitas autofill dan pembaruan sistem</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => refresh()}
            disabled={isLoading}
            className="group relative inline-flex items-center gap-2.5 h-10 px-4.5 text-[13px] font-semibold text-white bg-gradient-to-r from-[#172338] via-[#1a2942] to-[#1c2e4a] hover:from-[#1b2b45] hover:via-[#203454] hover:to-[#243c61] border border-[#2e476b]/70 hover:border-[#7BBDE8] rounded-xl shadow-xs hover:shadow-[0_0_18px_rgba(123,189,232,0.22)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
          >
            <FontAwesome
              name="rotate-right"
              className={`text-xs text-[#7BBDE8] transition-transform duration-500 ${
                isLoading ? 'animate-spin' : 'group-hover:rotate-180'
              }`}
            />
            <span className="tracking-wide">{isLoading ? 'Memperbarui...' : 'Perbarui'}</span>
          </button>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-2 h-10 px-4 text-[13px] font-bold text-[#101828] bg-[#7BBDE8] hover:bg-[#92cbef] rounded-xl transition-colors cursor-pointer shadow-xs active:scale-95"
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
              className="group relative inline-flex items-center gap-2.5 h-10 px-4.5 text-[13px] font-semibold text-rose-300 bg-gradient-to-r from-rose-950/40 via-rose-900/30 to-rose-950/40 hover:from-rose-900/60 hover:via-rose-800/40 hover:to-rose-900/60 border border-rose-800/50 hover:border-rose-500/80 rounded-xl shadow-xs hover:shadow-[0_0_18px_rgba(244,63,94,0.25)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
            >
              {clearingAll ? (
                <FontAwesome name="spinner" className="text-xs animate-spin text-rose-400" />
              ) : (
                <FontAwesome
                  name="trash"
                  className="text-xs text-rose-400 group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-200"
                />
              )}
              <span className="tracking-wide">{clearingAll ? 'Menghapus...' : 'Hapus semua'}</span>
            </button>
          )}
        </div>
      </div>

      {actionFeedback && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 text-[13px] font-semibold ${
            actionFeedback.type === 'success' ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60' : 'bg-rose-950/40 text-rose-300 border-rose-800/60'
          }`}
        >
          <FontAwesome
            name={actionFeedback.type === 'success' ? 'check-circle' : 'circle-x'}
            className={`text-sm shrink-0 ${actionFeedback.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}
          />
          <span>{actionFeedback.text}</span>
        </div>
      )}

      {/* Kategori Filter Pills & Counter (Mirrors PublicServices design) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {FILTER_TABS.map((tab) => {
            const count = counts[tab.key];
            const isActive = filter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilter(tab.key)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-[#7BBDE8] text-[#101828] font-bold shadow-xs'
                    : 'bg-[#171F2F] text-[#6EA2B3] border border-[#243048] hover:border-[#7BBDE8] hover:text-white'
                }`}
              >
                <FontAwesome name={tab.icon} className="text-xs" />
                <span>{tab.label}</span>
                <span
                  className={`inline-flex items-center justify-center min-w-[20px] h-5 text-[11px] font-bold rounded-full px-1.5 ${
                    isActive ? 'bg-[#101828]/20 text-[#101828]' : 'bg-[#101828] text-[#6EA2B3]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="text-[13px] font-medium text-[#6EA2B3] shrink-0 hidden sm:block">
          Menampilkan <span className="font-bold text-white">{filtered.length}</span> notifikasi
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-start gap-4 p-5 rounded-2xl border border-[#243048] bg-[#171F2F] animate-pulse">
              <div className="w-6 h-6 rounded-full bg-[#243048] shrink-0 mt-0.5" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-3.5 bg-[#243048] rounded w-1/3" />
                <div className="h-2.5 bg-[#243048] rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-6 bg-[#171F2F] rounded-2xl border border-[#243048] text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-[#101828] text-[#7BBDE8] border border-[#243048] flex items-center justify-center mb-4">
            <FontAwesome name="bell-slash" variant="solid" className="text-xl" />
          </div>
          <p className="text-[15px] font-bold text-white">{filter === 'unread' ? 'Semua sudah dibaca' : 'Belum ada notifikasi'}</p>
          <p className="text-[13px] text-[#6EA2B3] mt-1 text-center max-w-sm">
            {filter === 'unread'
              ? 'Tidak ada notifikasi yang belum dibaca.'
              : filter === 'all'
              ? 'Notifikasi aktivitas autofill akan muncul di sini secara realtime.'
              : `Tidak ada notifikasi dengan kategori "${FILTER_TABS.find((t) => t.key === filter)?.label}" saat ini.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((n) => (
            <NotifCard key={n.id} notif={n} onRead={handleRead} onDelete={handleDelete} deleting={deletingId === n.id} />
          ))}
        </div>
      )}

      {notifications.length > 0 && (
        <p className="text-center text-[12px] text-[#6EA2B3] font-medium pt-2">
          Menampilkan {filtered.length} dari {notifications.length} notifikasi
          {unreadCount > 0 && <span className="text-[#7BBDE8] font-semibold"> · {unreadCount} belum dibaca</span>}
        </p>
      )}
    </div>
  );
}