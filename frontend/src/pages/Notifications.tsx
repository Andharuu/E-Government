import { useState, useCallback } from 'react';
import { Button, Card, EmptyState, FontAwesome, Tabs } from '../components/ui';
import { type NotificationItem } from '../services/api';
import { useNotifications } from '../hooks/useNotifications';
import { useAuth } from '../context/AuthContext';

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
  success: { iconColor: 'text-ok' },
  warning: { iconColor: 'text-warn' },
  info: { iconColor: 'text-accent-text' },
  system: { iconColor: 'text-ink-3' },
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

function formatNotificationDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return iso;
  }
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
    <li
      onClick={() => !notif.read && onRead(notif.id)}
      className={`relative flex items-start gap-3 px-4 sm:px-5 py-3.5 border-b border-line last:border-b-0 transition-colors duration-150 ${
        notif.read ? 'bg-surface' : 'bg-surface hover:bg-surface-2 cursor-pointer'
      }`}
    >
      {!notif.read && (
        <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-accent" aria-hidden="true" />
      )}

      <span className={`shrink-0 mt-0.5 ${pal.iconColor}`}>
        <FontAwesome name={icon} variant="solid" className="text-[13px]" />
      </span>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <h3
            className={`text-[13px] leading-snug tracking-[-0.01em] truncate ${
              notif.read ? 'font-medium text-ink-2' : 'font-semibold text-ink'
            }`}
          >
            {notif.title}
          </h3>
          <div className="flex flex-col items-end shrink-0 text-right">
            <span className="text-[11.5px] font-medium text-ink-3 whitespace-nowrap tabular-nums">
              {timeAgo(notif.created_at)}
            </span>
            <span className="hidden sm:block text-[11px] text-ink-3 whitespace-nowrap tabular-nums">
              {formatNotificationDateTime(notif.created_at)}
            </span>
          </div>
        </div>

        {notif.desc && (
          <p className="text-[12.5px] leading-relaxed text-ink-2 mt-1">{notif.desc}</p>
        )}

        <div className="flex items-center justify-between gap-3 mt-2">
          {!notif.read ? (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onRead(notif.id); }}
              className="inline-flex items-center gap-1.5 text-[12px] font-medium text-accent-text hover:underline underline-offset-2 cursor-pointer"
            >
              <FontAwesome name="check" className="text-[11px]" />
              <span>Tandai sudah dibaca</span>
            </button>
          ) : <span />}

          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(notif.id); }}
            disabled={deleting}
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-3 hover:text-danger transition-colors cursor-pointer ml-auto disabled:opacity-50"
          >
            {deleting ? <FontAwesome name="spinner" spin className="text-[11px]" /> : <FontAwesome name="trash" className="text-[11px]" />}
            <span>Hapus</span>
          </button>
        </div>
      </div>
    </li>
  );
}

export function NotificationsPage() {
  const { token } = useAuth();
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
    <div className="page page-enter w-full max-w-5xl mx-auto pb-12">
      <div className="page-head">
        <div className="min-w-0">
          <h1 className="page-title">Notifikasi</h1>
          <p className="page-sub">Aktivitas autofill dan pembaruan sistem</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => refresh()}
            disabled={isLoading}
            loading={isLoading}
            icon={<FontAwesome name="rotate-right" />}
          >
            {isLoading ? 'Memperbarui...' : 'Perbarui'}
          </Button>

          {unreadCount > 0 && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleMarkAllRead}
              icon={<FontAwesome name="check-double" />}
            >
              Tandai semua dibaca
            </Button>
          )}

          {notifications.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              disabled={clearingAll}
              loading={clearingAll}
              icon={<FontAwesome name="trash" />}
              className="text-danger"
            >
              {clearingAll ? 'Menghapus...' : 'Hapus semua'}
            </Button>
          )}
        </div>
      </div>

      {actionFeedback && (
        <div
          className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-md border text-[12.5px] font-medium ${
            actionFeedback.type === 'success'
              ? 'bg-ok-soft text-ok border-ok-line'
              : 'bg-danger-soft text-danger border-danger-line'
          }`}
        >
          <FontAwesome
            name={actionFeedback.type === 'success' ? 'check-circle' : 'circle-x'}
            className="text-[12px] shrink-0"
          />
          <span>{actionFeedback.text}</span>
        </div>
      )}

      <Tabs
        items={FILTER_TABS.map((tab) => ({
          id: tab.key,
          label: tab.label,
          icon: <FontAwesome name={tab.icon} />,
          badge: counts[tab.key],
        }))}
        activeTab={filter}
        onChange={(id) => setFilter(id as FilterType)}
        className="max-w-full"
      />

      {isLoading ? (
        <Card className="overflow-hidden">
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="skeleton w-4 h-4 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-3 w-1/3" />
                  <div className="skeleton h-2.5 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<FontAwesome name="bell-slash" variant="solid" />}
            title={filter === 'unread' ? 'Semua sudah dibaca' : 'Belum ada notifikasi'}
            description={
              filter === 'unread'
                ? 'Tidak ada notifikasi yang belum dibaca.'
                : filter === 'all'
                ? 'Notifikasi aktivitas autofill akan muncul di sini secara realtime.'
                : `Tidak ada notifikasi dengan kategori "${FILTER_TABS.find((t) => t.key === filter)?.label}" saat ini.`
            }
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <ul>
            {filtered.map((n) => (
              <NotifCard key={n.id} notif={n} onRead={handleRead} onDelete={handleDelete} deleting={deletingId === n.id} />
            ))}
          </ul>
        </Card>
      )}

      {notifications.length > 0 && (
        <p className="text-center text-[12px] text-ink-3">
          Menampilkan {filtered.length} dari {notifications.length} notifikasi
          {unreadCount > 0 && (
            <span className="text-accent-text font-medium"> · {unreadCount} belum dibaca</span>
          )}
        </p>
      )}
    </div>
  );
}