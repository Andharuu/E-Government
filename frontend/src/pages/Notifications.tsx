import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { type NotificationItem } from '../services/api';
import { useNotifications } from '../hooks/useNotifications';
import { useAuth } from '../context/AuthContext';
import {
  Bell,
  BellOff,
  CheckCircle2,
  AlertTriangle,
  Info,
  CheckCheck,
  Check,
  Trash2,
  RefreshCw,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Globe,
  Sliders,
  RotateCcw,
  X,
  ShieldCheck,
  AlertCircle,
  Inbox,
} from 'lucide-react';

type StatusFilter = 'all' | 'unread';
type TypeFilter = 'all' | 'success' | 'warning' | 'info' | 'system';

interface GroupedNotification {
  groupKey: string;
  mainItem: NotificationItem;
  items: NotificationItem[];
  count: number;
  hasUnread: boolean;
  unreadCount: number;
  domain: string | null;
}

// ─── HELPER FORMAT WAKTU LENGKAP & RELATIF ─────────────────────────
function formatRelativeTime(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const s = Math.max(0, Math.floor(diff / 1000));
    if (s < 60) return 'Baru saja';
    const m = Math.floor(s / 60);
    if (m < 60) return `${m} menit lalu`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} jam lalu`;
    const d = Math.floor(h / 24);
    if (d === 1) return '1 hari lalu';
    if (d < 7) return `${d} hari lalu`;
    const w = Math.floor(d / 7);
    if (w < 4) return `${w} minggu lalu`;
    return new Date(iso).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return 'Baru saja';
  }
}

function formatAbsoluteTime(iso: string): string {
  try {
    const d = new Date(iso);
    const datePart = d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const timePart = d.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    }).replace(':', '.');
    return `${datePart}, ${timePart} WIB`;
  } catch {
    return iso;
  }
}

function formatHourMinute(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    }).replace(':', '.');
  } catch {
    return '';
  }
}

// ─── HELPER EKSTRAK DOMAIN DARI NOTIFIKASI ─────────────────────────
function extractDomain(item: NotificationItem): string | null {
  if (item.source) {
    const cleanSource = item.source.trim();
    if (cleanSource.startsWith('http://') || cleanSource.startsWith('https://')) {
      try {
        return new URL(cleanSource).hostname;
      } catch {
        // fallback
      }
    }
    if (cleanSource.includes('.') && !cleanSource.includes(' ')) {
      return cleanSource.replace(/^https?:\/\//, '').split('/')[0];
    }
  }

  // Cek pada teks judul atau deskripsi bila ada format domain (mis. www.roboform.com)
  const fullText = `${item.title} ${item.desc || ''}`;
  const domainMatch = fullText.match(/(?:https?:\/\/)?([a-zA-Z0-9-]+\.(?:go\.id|id|com|org|net|edu|io)[a-zA-Z0-9-._/]*)/i);
  if (domainMatch && domainMatch[1]) {
    return domainMatch[1].replace(/^https?:\/\//, '').split('/')[0];
  }

  return item.source ? item.source.trim() : null;
}

// ─── KOMPONEN FAVICON DOMAIN ───────────────────────────────────────
function DomainFavicon({ domain }: { domain: string }) {
  const [hasError, setHasError] = useState(false);
  const cleanDomain = domain.replace(/^https?:\/\//, '').split('/')[0];

  if (hasError || !cleanDomain.includes('.')) {
    return <Globe className="w-3.5 h-3.5 text-ink-3 shrink-0" strokeWidth={1.5} />;
  }

  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${cleanDomain}&sz=32`}
      alt={cleanDomain}
      className="w-3.5 h-3.5 object-contain rounded-xs shrink-0"
      onError={() => setHasError(true)}
    />
  );
}

// ─── HALAMAN UTAMA NOTIFIKASI ──────────────────────────────────────
export function NotificationsPage() {
  const { token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL query params
  const statusParam = (searchParams.get('status') as StatusFilter) || 'all';
  const typeParam = (searchParams.get('type') as TypeFilter) || 'all';

  const {
    notifications,
    unreadCount,
    isLoading,
    hasError,
    markRead,
    markAllRead,
    remove,
    clearAll,
    refresh,
  } = useNotifications(token, { pollInterval: 15000, useSSE: true });

  // State tampilan & kontrol
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>(() =>
    new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(':', '.')
  );
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isConfirmClearModalOpen, setIsConfirmClearModalOpen] = useState(false);
  const [selectedDrawerNotif, setSelectedDrawerNotif] = useState<NotificationItem | null>(null);
  const [expandedGroupKeys, setExpandedGroupKeys] = useState<Set<string>>(new Set());
  const [pageSize, setPageSize] = useState<number>(15);

  // Undo delete per item buffer
  const [undoToast, setUndoToast] = useState<{
    items: NotificationItem[];
    timeoutId: ReturnType<typeof setTimeout>;
    message: string;
  } | null>(null);

  // Loading states
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);

  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Update last updated timestamp when notifications change or refresh succeeds
  useEffect(() => {
    if (!isLoading) {
      setLastUpdatedTime(
        new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(':', '.')
      );
    }
  }, [isLoading, notifications]);

  // Click outside to close more menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut Esc to close drawer or modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedDrawerNotif) setSelectedDrawerNotif(null);
        if (isConfirmClearModalOpen) setIsConfirmClearModalOpen(false);
        if (isMoreMenuOpen) setIsMoreMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDrawerNotif, isConfirmClearModalOpen, isMoreMenuOpen]);

  // Filter setters with URL synchronization
  const handleStatusFilterChange = (status: StatusFilter) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (status === 'all') next.delete('status');
      else next.set('status', status);
      return next;
    }, { replace: true });
    setPageSize(15);
  };

  const handleTypeFilterChange = (type: TypeFilter) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (type === 'all') next.delete('type');
      else next.set('type', type);
      return next;
    }, { replace: true });
    setPageSize(15);
  };

  const handleClearFilters = () => {
    setSearchParams(new URLSearchParams(), { replace: true });
    setPageSize(15);
  };

  // Manual refresh with spinner feedback
  const handleManualRefresh = async () => {
    await refresh();
    setLastUpdatedTime(
      new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(':', '.')
    );
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    if (unreadCount === 0 || isMarkingAll) return;
    setIsMarkingAll(true);
    try {
      await markAllRead();
    } finally {
      setIsMarkingAll(false);
    }
  };

  // Confirm clear all
  const handleConfirmClearAll = async () => {
    setIsClearingAll(true);
    try {
      await clearAll();
      setIsConfirmClearModalOpen(false);
    } finally {
      setIsClearingAll(false);
    }
  };

  // Handle single or group delete with 6-second undo toast
  const handleDeleteWithUndo = useCallback((targetItems: NotificationItem[], e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (targetItems.length === 0) return;

    // Close any previous undo timer and commit its delete
    if (undoToast) {
      clearTimeout(undoToast.timeoutId);
      undoToast.items.forEach(it => {
        remove(it.id).catch(() => {});
      });
    }

    const itemIds = new Set(targetItems.map(it => it.id));

    // Optimistically remove from state by triggering remove after 6 seconds
    const timeoutId = setTimeout(() => {
      targetItems.forEach(it => {
        remove(it.id).catch(() => {});
      });
      setUndoToast(null);
    }, 6000);

    const message = targetItems.length === 1
      ? '1 notifikasi dihapus.'
      : `${targetItems.length} notifikasi dihapus.`;

    setUndoToast({
      items: targetItems,
      timeoutId,
      message,
    });

    // Close drawer if the open item was just deleted
    if (selectedDrawerNotif && itemIds.has(selectedDrawerNotif.id)) {
      setSelectedDrawerNotif(null);
    }
  }, [undoToast, remove, selectedDrawerNotif]);

  // Undo the deletion
  const handleUndoDelete = () => {
    if (!undoToast) return;
    clearTimeout(undoToast.timeoutId);
    setUndoToast(null);
  };

  // Dismiss toast and commit delete immediately
  const handleDismissUndoToast = () => {
    if (!undoToast) return;
    clearTimeout(undoToast.timeoutId);
    undoToast.items.forEach(it => {
      remove(it.id).catch(() => {});
    });
    setUndoToast(null);
  };

  // Open drawer and automatically mark read if unread
  const handleOpenDrawer = (item: NotificationItem) => {
    setSelectedDrawerNotif(item);
    if (!item.read) {
      markRead(item.id).catch(() => {});
    }
  };

  // Toggle group expansion
  const toggleGroupExpand = (groupKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedGroupKeys(prev => {
      const next = new Set(prev);
      if (next.has(groupKey)) next.delete(groupKey);
      else next.add(groupKey);
      return next;
    });
  };

  // Exclude items that are currently pending in undo buffer
  const pendingDeletedIds = useMemo(() => {
    if (!undoToast) return new Set<number>();
    return new Set(undoToast.items.map(it => it.id));
  }, [undoToast]);

  const activeNotifications = useMemo(() => {
    return notifications.filter(n => !pendingDeletedIds.has(n.id));
  }, [notifications, pendingDeletedIds]);

  // Counts for filters
  const counts = useMemo(() => {
    const unread = activeNotifications.filter(n => !n.read).length;
    return {
      all: activeNotifications.length,
      unread,
      success: activeNotifications.filter(n => n.type === 'success').length,
      warning: activeNotifications.filter(n => n.type === 'warning').length,
      info: activeNotifications.filter(n => n.type === 'info').length,
      system: activeNotifications.filter(n => n.type === 'system').length,
    };
  }, [activeNotifications]);

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    return activeNotifications.filter(n => {
      if (statusParam === 'unread' && n.read) return false;
      if (typeParam !== 'all' && n.type !== typeParam) return false;
      return true;
    });
  }, [activeNotifications, statusParam, typeParam]);

  // Date Grouping & Identical Notification Aggregation
  const groupedSections = useMemo(() => {
    const now = new Date();
    const todayStr = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStr = todayStr - 86400000;
    const oneWeekAgoStr = todayStr - 86400000 * 6;

    const sections: {
      id: 'today' | 'yesterday' | 'week' | 'older';
      title: string;
      items: GroupedNotification[];
    }[] = [
      { id: 'today', title: 'Hari Ini', items: [] },
      { id: 'yesterday', title: 'Kemarin', items: [] },
      { id: 'week', title: 'Minggu Ini', items: [] },
      { id: 'older', title: 'Lebih Lama', items: [] },
    ];

    // Helper map per section for aggregation
    const groupMaps: Record<string, Map<string, GroupedNotification>> = {
      today: new Map(),
      yesterday: new Map(),
      week: new Map(),
      older: new Map(),
    };

    filteredNotifications.forEach(notif => {
      const notifTime = new Date(notif.created_at).getTime();
      let sectionId: 'today' | 'yesterday' | 'week' | 'older' = 'older';

      if (notifTime >= todayStr) {
        sectionId = 'today';
      } else if (notifTime >= yesterdayStr) {
        sectionId = 'yesterday';
      } else if (notifTime >= oneWeekAgoStr) {
        sectionId = 'week';
      }

      const domain = extractDomain(notif);
      const dayKey = notif.created_at.slice(0, 10);
      const aggKey = `${notif.type}_${notif.title.trim().toLowerCase()}_${(domain || '').toLowerCase()}_${dayKey}`;

      const map = groupMaps[sectionId];
      const existing = map.get(aggKey);

      if (existing) {
        existing.items.push(notif);
        existing.count += 1;
        if (!notif.read) {
          existing.hasUnread = true;
          existing.unreadCount += 1;
        }
      } else {
        map.set(aggKey, {
          groupKey: aggKey,
          mainItem: notif,
          items: [notif],
          count: 1,
          hasUnread: !notif.read,
          unreadCount: notif.read ? 0 : 1,
          domain,
        });
      }
    });

    sections.forEach(sec => {
      sec.items = Array.from(groupMaps[sec.id].values());
    });

    return sections.filter(sec => sec.items.length > 0);
  }, [filteredNotifications]);

  // Total count of visible groups for pagination
  const totalGroupCount = useMemo(() => {
    return groupedSections.reduce((acc, sec) => acc + sec.items.length, 0);
  }, [groupedSections]);

  // Paginated sections
  const paginatedSections = useMemo(() => {
    let remaining = pageSize;
    return groupedSections.map(sec => {
      if (remaining <= 0) return { ...sec, items: [] };
      const slice = sec.items.slice(0, remaining);
      remaining -= slice.length;
      return { ...sec, items: slice };
    }).filter(sec => sec.items.length > 0);
  }, [groupedSections, pageSize]);

  // Status icon component helper
  const getStatusIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" strokeWidth={1.5} />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500" strokeWidth={1.5} />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" strokeWidth={1.5} />;
      default:
        return <Bell className="w-5 h-5 text-ink-3" strokeWidth={1.5} />;
    }
  };

  return (
    <div className="page page-enter max-w-5xl mx-auto space-y-6 pb-20">
      {/* ── BREADCRUMB & HEADER HALAMAN ── */}
      <div className="space-y-3">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-ink-3">
          <Link to="/" className="hover:text-ink transition-colors">
            Beranda
          </Link>
          <span>/</span>
          <span className="text-ink font-semibold">Notifikasi</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">
              Notifikasi
            </h1>
            <p className="text-xs sm:text-sm text-ink-3 max-w-xl leading-relaxed">
              Aktivitas autofill, keamanan sesi, dan pembaruan sistem.
            </p>
          </div>

          {/* AKSI SATU BARIS RATA KANAN (TIDAK PERNAH WRAP) */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 self-start sm:self-center">
            {/* Teks kecil status pembaruan otomatis */}
            <span className="text-xs text-ink-3 hidden md:inline tabular-nums mr-1">
              Diperbarui {lastUpdatedTime}
            </span>

            {/* Tombol Cadangan Manual Refresh dengan Tooltip */}
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isLoading}
              title="Perbarui notifikasi"
              aria-label="Perbarui notifikasi"
              className="w-10 h-10 rounded-xl border border-line bg-surface hover:bg-surface-2 text-ink flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            {/* Aksi Utama: Tandai Semua Dibaca */}
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0 || isMarkingAll}
              className="h-10 px-4 rounded-xl bg-accent text-accent-fg hover:bg-accent-hover text-xs font-semibold inline-flex items-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs whitespace-nowrap"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Tandai semua dibaca</span>
            </button>

            {/* Menu ⋯ (More Options) */}
            <div className="relative" ref={moreMenuRef}>
              <button
                type="button"
                onClick={() => setIsMoreMenuOpen(prev => !prev)}
                title="Menu opsi lainnya"
                aria-label="Menu opsi lainnya"
                aria-expanded={isMoreMenuOpen}
                className="w-10 h-10 rounded-xl border border-line bg-surface hover:bg-surface-2 text-ink flex items-center justify-center transition-colors cursor-pointer"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {isMoreMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-line bg-surface shadow-xl py-1.5 z-40 animate-in fade-in zoom-in-95 duration-150">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      setIsConfirmClearModalOpen(true);
                    }}
                    disabled={activeNotifications.length === 0}
                    className="w-full px-3.5 py-2.5 text-left text-xs font-semibold text-danger hover:bg-danger-soft flex items-center gap-2.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus semua ({activeNotifications.length})</span>
                  </button>
                  <Link
                    to="/settings"
                    onClick={() => setIsMoreMenuOpen(false)}
                    className="w-full px-3.5 py-2.5 text-left text-xs font-medium text-ink hover:bg-surface-2 flex items-center gap-2.5 cursor-pointer border-t border-line"
                  >
                    <Sliders className="w-3.5 h-3.5 text-ink-3" />
                    <span>Pengaturan notifikasi</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── BAR FILTER STICKY DUA DIMENSI ── */}
      <div className="sticky top-0 z-30 bg-canvas/95 backdrop-blur-md py-3 border-b border-line -mx-4 px-4 sm:-mx-6 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Dimensi A: Segmented Control Status (Semua | Belum Dibaca) */}
          <div className="flex items-center p-1 rounded-xl border border-line bg-surface-2 self-start shrink-0">
            <button
              type="button"
              onClick={() => handleStatusFilterChange('all')}
              className={`h-8 px-3.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                statusParam === 'all'
                  ? 'bg-surface text-ink shadow-xs font-bold'
                  : 'text-ink-3 hover:text-ink'
              }`}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => handleStatusFilterChange('unread')}
              className={`h-8 px-3.5 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer ${
                statusParam === 'unread'
                  ? 'bg-surface text-ink shadow-xs font-bold'
                  : 'text-ink-3 hover:text-ink'
              }`}
            >
              <span>Belum dibaca</span>
              {counts.unread > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-500/20 text-accent-text">
                  {counts.unread}
                </span>
              )}
            </button>
          </div>

          {/* Dimensi B: Filter Jenis (Chips Horizontal Scrollable) */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 max-w-full">
            {(
              [
                { key: 'all', label: 'Semua jenis', count: counts.all },
                { key: 'success', label: 'Sukses', count: counts.success },
                { key: 'warning', label: 'Peringatan', count: counts.warning },
                { key: 'info', label: 'Info', count: counts.info },
                { key: 'system', label: 'Sistem', count: counts.system },
              ] as const
            ).map(chip => {
              const isActive = typeParam === chip.key;
              const isZero = chip.count === 0 && chip.key !== 'all';

              return (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => handleTypeFilterChange(chip.key)}
                  className={`h-8 px-3 rounded-lg border text-xs font-medium whitespace-nowrap inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                    isActive
                      ? 'border-blue-500/40 bg-blue-500/10 text-accent-text font-bold shadow-xs'
                      : isZero
                        ? 'border-line/60 bg-surface/50 text-ink-3/60 hover:text-ink-3 hover:border-line'
                        : 'border-line bg-surface text-ink-2 hover:bg-surface-2 hover:text-ink'
                  }`}
                >
                  <span>{chip.label}</span>
                  {!isZero && (
                    <span className={`text-[10.5px] px-1.5 py-0.2 rounded-full tabular-nums ${
                      isActive ? 'bg-blue-500/20 text-accent-text font-bold' : 'bg-surface-3 text-ink-3'
                    }`}>
                      {chip.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── DAFTAR NOTIFIKASI / STATES ── */}
      <div aria-live="polite">
        {/* State Memuat (Skeleton 4 baris) */}
        {isLoading && activeNotifications.length === 0 ? (
          <div className="rounded-[20px] border border-line bg-surface divide-y divide-line overflow-hidden">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="p-4 sm:p-5 flex items-start gap-4 animate-pulse">
                <div className="w-10 h-10 rounded-xl bg-surface-2 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 bg-surface-2 rounded-md" />
                  <div className="h-3 w-3/4 bg-surface-2 rounded-md" />
                </div>
                <div className="h-3 w-16 bg-surface-2 rounded-md shrink-0" />
              </div>
            ))}
          </div>
        ) : hasError && activeNotifications.length === 0 ? (
          /* State Error */
          <div className="p-12 text-center rounded-[20px] border border-red-500/20 bg-surface space-y-3">
            <AlertCircle className="w-10 h-10 text-danger mx-auto opacity-70" />
            <h3 className="text-base font-bold text-ink">Gagal Memuat Notifikasi</h3>
            <p className="text-xs text-ink-3 max-w-sm mx-auto">
              Terjadi kendala saat menghubungkan ke server notifikasi. Silakan periksa koneksi lalu coba kembali.
            </p>
            <button
              type="button"
              onClick={handleManualRefresh}
              className="h-9 px-4 rounded-xl bg-accent text-accent-fg text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Coba lagi</span>
            </button>
          </div>
        ) : filteredNotifications.length === 0 ? (
          /* State Kosong */
          <div className="p-14 text-center rounded-[20px] border border-line bg-surface space-y-3">
            {typeParam === 'warning' ? (
              <>
                <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto opacity-80" strokeWidth={1.5} />
                <h3 className="text-base font-bold text-ink">
                  Tidak Ada Peringatan
                </h3>
                <p className="text-xs text-ink-3 max-w-sm mx-auto">
                  Semua sesi dan aktivitas pengisian formulir Anda terpantau aman dan terlindungi.
                </p>
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="h-9 px-4 rounded-xl border border-line bg-surface-2 hover:bg-surface-3 text-xs font-semibold text-ink transition-colors"
                >
                  Hapus filter
                </button>
              </>
            ) : statusParam === 'unread' ? (
              <>
                <CheckCircle2 className="w-12 h-12 text-blue-500 mx-auto opacity-70" strokeWidth={1.5} />
                <h3 className="text-base font-bold text-ink">
                  Semua Sudah Dibaca
                </h3>
                <p className="text-xs text-ink-3 max-w-sm mx-auto">
                  Tidak ada notifikasi yang belum dibaca saat ini. Anda telah meninjau semua pemberitahuan.
                </p>
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="h-9 px-4 rounded-xl border border-line bg-surface-2 hover:bg-surface-3 text-xs font-semibold text-ink transition-colors"
                >
                  Tampilkan semua notifikasi
                </button>
              </>
            ) : activeNotifications.length === 0 ? (
              /* Kosong Total */
              <>
                <BellOff className="w-12 h-12 text-ink-3 mx-auto opacity-40" strokeWidth={1.5} />
                <h3 className="text-base font-bold text-ink">
                  Belum Ada Notifikasi
                </h3>
                <p className="text-xs text-ink-3 max-w-sm mx-auto leading-relaxed">
                  Aktivitas pengisian otomatis dan pembaruan sistem akan muncul di sini secara realtime.
                </p>
                <Link
                  to="/settings"
                  className="h-9 px-4 rounded-xl border border-line bg-surface-2 hover:bg-surface-3 text-xs font-semibold text-ink inline-flex items-center gap-1.5 transition-colors"
                >
                  <Sliders className="w-3.5 h-3.5 text-ink-3" />
                  <span>Pengaturan notifikasi</span>
                </Link>
              </>
            ) : (
              /* Kosong per Filter Jenis */
              <>
                <Inbox className="w-12 h-12 text-ink-3 mx-auto opacity-50" strokeWidth={1.5} />
                <h3 className="text-base font-bold text-ink">
                  Tidak Ditemukan Notifikasi
                </h3>
                <p className="text-xs text-ink-3 max-w-sm mx-auto">
                  Tidak ada pemberitahuan dengan filter yang sedang dipilih saat ini.
                </p>
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="h-9 px-4 rounded-xl border border-line bg-surface-2 hover:bg-surface-3 text-xs font-semibold text-ink transition-colors"
                >
                  Hapus filter
                </button>
              </>
            )}
          </div>
        ) : (
          /* DAFTAR NOTIFIKASI BERKELOMPOK PER TANGGAL */
          <div className="space-y-6">
            {paginatedSections.map(section => (
              <div key={section.id} className="space-y-2">
                {/* Header Tanggal Sticky */}
                <div className="sticky top-14 z-20 bg-canvas/90 backdrop-blur-md py-1.5 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink-3">
                    {section.title}
                  </span>
                  <span className="text-[11px] text-ink-3 tabular-nums font-medium">
                    {section.items.reduce((acc, it) => acc + it.count, 0)} aktivitas
                  </span>
                </div>

                {/* Kartu List Notifikasi */}
                <div className="rounded-[20px] border border-line bg-surface divide-y divide-line overflow-hidden shadow-xs">
                  {section.items.map(group => {
                    const isGrouped = group.count > 1;
                    const isExpanded = expandedGroupKeys.has(group.groupKey);
                    const isUnread = group.hasUnread;
                    const main = group.mainItem;

                    return (
                      <div
                        key={group.groupKey}
                        className={`group relative transition-colors ${
                          isUnread
                            ? 'bg-blue-500/[0.03] hover:bg-blue-500/[0.06]'
                            : 'bg-surface hover:bg-surface-2/60'
                        }`}
                      >
                        {/* Garis Aksen Kiri untuk yang Belum Dibaca */}
                        {isUnread && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent rounded-r" aria-hidden="true" />
                        )}

                        {/* Baris Utama Notifikasi */}
                        <div
                          tabIndex={0}
                          role="button"
                          aria-label={`Notifikasi: ${main.title}`}
                          onClick={() => handleOpenDrawer(main)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleOpenDrawer(main);
                            }
                          }}
                          className="p-4 sm:p-5 flex items-start gap-3.5 sm:gap-4 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/80 rounded-lg"
                        >
                          {/* Kotak Ikon Status Berwarna 40px */}
                          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
                            main.type === 'success'
                              ? 'bg-emerald-500/10 border-emerald-500/20'
                              : main.type === 'warning'
                                ? 'bg-amber-500/10 border-amber-500/20'
                                : main.type === 'info'
                                  ? 'bg-blue-500/10 border-blue-500/20'
                                  : 'bg-surface-2 border-line'
                          }`}>
                            {getStatusIcon(main.type)}
                          </div>

                          {/* Konten Notifikasi */}
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              {/* Titik Biru Belum Dibaca */}
                              {isUnread && (
                                <span className="w-2 h-2 rounded-full bg-accent shrink-0" title="Belum dibaca" />
                              )}

                              {/* Judul Notifikasi */}
                              <h3 className={`text-xs sm:text-sm leading-snug truncate ${
                                isUnread ? 'font-bold text-ink' : 'font-medium text-ink-2'
                              }`}>
                                {main.title}
                              </h3>

                              {/* Domain Monospace Chip */}
                              {group.domain && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-line bg-surface-2 text-[11px] font-mono text-ink-2 shrink-0">
                                  <DomainFavicon domain={group.domain} />
                                  <span>{group.domain}</span>
                                </span>
                              )}

                              {/* Badge Penggabungan Identik (mis. ×3) */}
                              {isGrouped && (
                                <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-blue-500/20 text-accent-text border border-blue-500/30 shrink-0">
                                  ×{group.count}
                                </span>
                              )}
                            </div>

                            {/* Deskripsi Informatif */}
                            {main.desc && (
                              <p className="text-xs leading-relaxed text-ink-3 line-clamp-2">
                                {main.desc}
                              </p>
                            )}

                            {/* Aksi Kontekstual & Expand */}
                            <div className="flex flex-wrap items-center gap-3 pt-1">
                              <span className="text-[11.5px] font-semibold text-accent-text group-hover:underline">
                                Lihat detail
                              </span>

                              {group.domain && (
                                <a
                                  href={`https://${group.domain}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-[11.5px] font-medium text-ink-3 hover:text-ink inline-flex items-center gap-1"
                                >
                                  <span>Buka situs</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}

                              {isGrouped && (
                                <button
                                  type="button"
                                  onClick={(e) => toggleGroupExpand(group.groupKey, e)}
                                  className="text-[11.5px] font-semibold text-ink-2 hover:text-ink inline-flex items-center gap-1 ml-auto"
                                >
                                  <span>{isExpanded ? 'Tutup riwayat' : `Lihat ${group.count} kejadian`}</span>
                                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Sisi Kanan: Waktu Relatif & Aksi Hover Desktop */}
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            {/* Waktu Relatif Lengkap */}
                            <time
                              dateTime={main.created_at}
                              title={formatAbsoluteTime(main.created_at)}
                              className="text-[11.5px] text-ink-3 font-medium whitespace-nowrap cursor-help"
                            >
                              {formatRelativeTime(main.created_at)}
                            </time>

                            {/* Aksi Administratif Desktop (Muncul saat hover/fokus) */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                              {isUnread && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    group.items.forEach(it => markRead(it.id).catch(() => {}));
                                  }}
                                  title="Tandai sudah dibaca"
                                  className="p-1.5 rounded-lg border border-line bg-surface hover:bg-surface-2 text-ink-3 hover:text-ink transition-colors cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={(e) => handleDeleteWithUndo(group.items, e)}
                                title="Hapus notifikasi"
                                className="p-1.5 rounded-lg border border-line bg-surface hover:bg-danger-soft text-ink-3 hover:text-danger transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* SUB-DAFTAR KEJADIAN PENGGABUNGAN IDENTIK */}
                        {isGrouped && isExpanded && (
                          <div className="bg-surface-2/60 border-t border-line px-5 py-3 space-y-2 animate-in slide-in-from-top-1 duration-150">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-3">
                              Daftar Kejadian ({group.count})
                            </span>
                            <div className="divide-y divide-line/60 rounded-xl border border-line/60 bg-surface overflow-hidden">
                              {group.items.map(subItem => (
                                <div
                                  key={subItem.id}
                                  onClick={() => handleOpenDrawer(subItem)}
                                  className="p-3 flex items-center justify-between gap-3 hover:bg-surface-2 transition-colors cursor-pointer text-xs"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    {!subItem.read && (
                                      <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                                    )}
                                    <span className="font-mono text-ink-3 tabular-nums shrink-0">
                                      {formatHourMinute(subItem.created_at)}
                                    </span>
                                    <span className="text-ink-2 truncate">
                                      {subItem.desc || subItem.title}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    {!subItem.read && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          markRead(subItem.id).catch(() => {});
                                        }}
                                        className="text-accent-text hover:underline text-[11px] font-medium"
                                      >
                                        Tandai dibaca
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={(e) => handleDeleteWithUndo([subItem], e)}
                                      className="p-1 text-ink-3 hover:text-danger rounded"
                                      title="Hapus kejadian ini"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Paginasi / Muat Lebih Banyak */}
            {totalGroupCount > pageSize && (
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setPageSize(prev => prev + 15)}
                  className="h-11 px-5 rounded-xl border border-line bg-surface hover:bg-surface-2 text-xs font-semibold text-ink transition-colors cursor-pointer inline-flex items-center gap-2 shadow-xs"
                >
                  <span>Muat 15 notifikasi lebih lama</span>
                  <span className="text-ink-3">({totalGroupCount - pageSize} tersisa)</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── DETAIL DRAWER (SIDE OVER) ── */}
      {selectedDrawerNotif && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
          onClick={() => setSelectedDrawerNotif(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Detail Notifikasi"
            className="w-full max-w-md h-full bg-surface border-l border-line shadow-2xl p-6 sm:p-7 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200"
          >
            <div className="space-y-6">
              {/* Header Drawer */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-line">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
                    selectedDrawerNotif.type === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/20'
                      : selectedDrawerNotif.type === 'warning'
                        ? 'bg-amber-500/10 border-amber-500/20'
                        : selectedDrawerNotif.type === 'info'
                          ? 'bg-blue-500/10 border-blue-500/20'
                          : 'bg-surface-2 border-line'
                  }`}>
                    {getStatusIcon(selectedDrawerNotif.type)}
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-ink-3">
                      Tipe: {selectedDrawerNotif.type}
                    </span>
                    <p className="text-xs text-ink-2 font-medium">Detail Notifikasi</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedDrawerNotif(null)}
                  className="p-1.5 rounded-xl text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
                  title="Tutup dialog"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Judul & Domain */}
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-ink leading-snug">
                  {selectedDrawerNotif.title}
                </h2>
                {extractDomain(selectedDrawerNotif) && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-line bg-surface-2 text-xs font-mono text-ink">
                    <DomainFavicon domain={extractDomain(selectedDrawerNotif)!} />
                    <span>{extractDomain(selectedDrawerNotif)}</span>
                  </div>
                )}
              </div>

              {/* Timestamp */}
              <div className="p-3.5 rounded-xl border border-line bg-surface-2 space-y-1">
                <span className="text-[11px] font-semibold text-ink-3 uppercase tracking-wider">
                  Waktu Pengiriman
                </span>
                <p className="text-xs text-ink font-medium">
                  {formatAbsoluteTime(selectedDrawerNotif.created_at)}
                </p>
                <p className="text-[11px] text-ink-3">
                  ({formatRelativeTime(selectedDrawerNotif.created_at)})
                </p>
              </div>

              {/* Isi Deskripsi */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-3">
                  Rincian Informasi
                </span>
                <div className="p-4 rounded-xl border border-line bg-surface-2 text-xs text-ink-2 leading-relaxed whitespace-pre-line">
                  {selectedDrawerNotif.desc || 'Tidak ada detail tambahan pada notifikasi ini.'}
                </div>
              </div>

              {/* Aksi Kontekstual */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-3">
                  Tindakan Cepat
                </span>
                <div className="grid grid-cols-1 gap-2">
                  {extractDomain(selectedDrawerNotif) && (
                    <a
                      href={`https://${extractDomain(selectedDrawerNotif)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-10 px-4 rounded-xl border border-line bg-surface hover:bg-surface-2 text-xs font-semibold text-ink inline-flex items-center justify-between transition-colors"
                    >
                      <span>Kunjungi Situs Portal</span>
                      <ExternalLink className="w-3.5 h-3.5 text-ink-3" />
                    </a>
                  )}
                  <Link
                    to="/demo"
                    className="h-10 px-4 rounded-xl border border-line bg-surface hover:bg-surface-2 text-xs font-semibold text-ink inline-flex items-center justify-between transition-colors"
                  >
                    <span>Coba Simulator Ekstensi</span>
                    <ExternalLink className="w-3.5 h-3.5 text-ink-3" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Tombol Hapus & Batal pada Drawer */}
            <div className="pt-6 border-t border-line flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleDeleteWithUndo([selectedDrawerNotif])}
                className="h-10 px-4 rounded-xl border border-line hover:bg-danger-soft text-danger text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Notifikasi</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedDrawerNotif(null)}
                className="h-10 px-4 rounded-xl bg-surface border border-line hover:bg-surface-2 text-xs font-semibold text-ink transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DIALOG KONFIRMASI HAPUS SEMUA ── */}
      {isConfirmClearModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsConfirmClearModalOpen(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-[24px] border border-line bg-surface shadow-2xl p-6 sm:p-7 space-y-5 animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-danger-soft border border-red-500/20 text-danger flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-ink">
                  Hapus Seluruh Notifikasi?
                </h3>
                <p className="text-xs text-ink-3 leading-relaxed">
                  Apakah Anda yakin ingin menghapus seluruh <strong className="text-ink font-semibold">{activeNotifications.length} notifikasi</strong>? Tindakan ini akan membersihkan semua riwayat pemberitahuan secara permanen.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-line">
              <button
                type="button"
                onClick={() => setIsConfirmClearModalOpen(false)}
                disabled={isClearingAll}
                className="h-10 px-4 rounded-xl border border-line bg-surface hover:bg-surface-2 text-xs font-semibold text-ink-2 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmClearAll}
                disabled={isClearingAll}
                className="h-10 px-5 rounded-xl bg-danger text-white text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isClearingAll ? 'Menghapus...' : `Ya, Hapus ${activeNotifications.length} Notifikasi`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST HAPUS DENGAN URUNGKAN (UNDO 6 DETIK) ── */}
      {undoToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-in slide-in-from-bottom-3 duration-200">
          <div className="p-4 rounded-2xl border border-line bg-surface shadow-2xl flex items-center justify-between gap-3 backdrop-blur-md">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
              <p className="text-xs font-semibold text-ink truncate">
                {undoToast.message}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleUndoDelete}
                className="h-8 px-3 rounded-lg bg-blue-500/10 text-accent-text hover:bg-blue-500/20 text-xs font-bold transition-colors cursor-pointer"
              >
                Urungkan
              </button>
              <button
                type="button"
                onClick={handleDismissUndoToast}
                className="p-1.5 rounded-lg text-ink-3 hover:text-ink cursor-pointer"
                title="Tutup & hapus permanen"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationsPage;
