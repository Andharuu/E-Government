import { useEffect, useState, useCallback, useMemo } from 'react';
import { activityApi, type Activity } from '../services/api';
import {
  RotateCcw,
  Trash2,
  Globe,
  Clock,
  Zap,
  CheckCheck,
  AlertTriangle,
  ExternalLink,
  Search,
  CheckCircle2,
  X,
} from 'lucide-react';

export function ActivityPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'partial' | 'failed'>('all');

  // Action feedback
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [clearingAll, setClearingAll] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'single' | 'all';
    targetId?: number;
    title: string;
    message: string;
  } | null>(null);

  // Load activities
  const fetchActivities = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const res = await activityApi.get({
        limit: 100,
        offset: 0,
      }).catch(() => null);

      let data = res?.data || [];

      if (!data || data.length === 0) {
        const analyticsRes = await activityApi.getAnalytics().catch(() => null);
        if (analyticsRes?.data?.recent_activities && analyticsRes.data.recent_activities.length > 0) {
          data = analyticsRes.data.recent_activities;
        }
      }

      setActivities(data);
    } catch {
      // Quiet fail to preserve clean UI
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchActivities(true);
  }, [fetchActivities]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchActivities(false);
  };

  const handleDeleteItem = (id: number) => {
    setConfirmModal({
      isOpen: true,
      type: 'single',
      targetId: id,
      title: 'Hapus Catatan Aktivitas',
      message: 'Apakah Anda yakin ingin menghapus catatan riwayat autofill ini dari riwayat akun Anda?',
    });
  };

  const handleClearAll = () => {
    setConfirmModal({
      isOpen: true,
      type: 'all',
      title: 'Bersihkan Seluruh Riwayat',
      message: 'Apakah Anda yakin ingin menghapus SELURUH catatan riwayat aktivitas autofill? Tindakan ini permanen dan tidak dapat dibatalkan.',
    });
  };

  const executeConfirmedAction = async () => {
    if (!confirmModal) return;
    const { type, targetId } = confirmModal;
    setConfirmModal(null);

    if (type === 'single' && targetId !== undefined) {
      setDeletingId(targetId);
      try {
        await activityApi.delete(targetId);
        setActivities((prev) => prev.filter((a) => a.id !== targetId));
        setActionFeedback({ type: 'success', text: 'Catatan aktivitas berhasil dihapus.' });
        setTimeout(() => setActionFeedback(null), 3000);
      } catch (err: any) {
        setActionFeedback({
          type: 'error',
          text: err.response?.data?.detail || 'Gagal menghapus catatan aktivitas.',
        });
        setTimeout(() => setActionFeedback(null), 3500);
      } finally {
        setDeletingId(null);
      }
    } else if (type === 'all') {
      setClearingAll(true);
      try {
        const res = await activityApi.clearAll();
        setActivities([]);
        setActionFeedback({
          type: 'success',
          text: res.data.detail || 'Seluruh riwayat aktivitas berhasil dibersihkan.',
        });
        setTimeout(() => setActionFeedback(null), 3500);
      } catch (err: any) {
        setActionFeedback({
          type: 'error',
          text: err.response?.data?.detail || 'Gagal membersihkan riwayat aktivitas.',
        });
        setTimeout(() => setActionFeedback(null), 3500);
      } finally {
        setClearingAll(false);
      }
    }
  };

  // Metrics
  const totalFields = activities.reduce((sum, a) => sum + (a.fields_filled || 0), 0);
  const successCount = activities.filter((a) => a.status === 'success').length;
  const partialCount = activities.filter((a) => a.status === 'partial').length;
  const failedCount = activities.filter((a) => a.status === 'failed').length;

  // Filtered List
  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      const matchesSearch =
        searchQuery === '' ||
        (act.website_domain && act.website_domain.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (act.target_url && act.target_url.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (act.action && act.action.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === 'all' || act.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [activities, searchQuery, statusFilter]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-line">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">
            Riwayat Aktivitas Autofill
          </h1>
          <p className="text-xs sm:text-sm text-ink-2 mt-1">
            Audit log transparan mengenai pengisian formulir instansi oleh ekstensi browser GovConnect.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="px-4 h-11 rounded-xl text-xs sm:text-sm font-semibold border border-line bg-surface hover:bg-surface-2 text-ink flex items-center gap-2 transition-colors disabled:opacity-60"
          >
            <RotateCcw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Memperbarui...' : 'Perbarui'}</span>
          </button>

          {activities.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              disabled={clearingAll}
              className="px-4 h-11 rounded-xl text-xs sm:text-sm font-semibold border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 flex items-center gap-2 transition-colors disabled:opacity-60"
            >
              <Trash2 className="w-4 h-4" />
              <span>{clearingAll ? 'Membersihkan...' : 'Bersihkan Riwayat'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div
          className={`p-4 rounded-xl border text-xs sm:text-sm flex items-center gap-2.5 animate-fadeIn ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}
        >
          {actionFeedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span>{actionFeedback.text}</span>
        </div>
      )}

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-[20px] border border-line bg-surface shadow-xs">
          <div className="flex items-center justify-between text-xs text-ink-3 mb-2">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Total Log</span>
            <Clock className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-ink tabular-nums">{activities.length}</div>
          <p className="text-xs text-ink-2 mt-1">Sesi pengisian terarsip</p>
        </div>

        <div className="p-5 rounded-[20px] border border-line bg-surface shadow-xs">
          <div className="flex items-center justify-between text-xs text-ink-3 mb-2">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Field Terisi</span>
            <Zap className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-ink tabular-nums">{totalFields}</div>
          <p className="text-xs text-ink-2 mt-1">Kolom berhasil dipetakan</p>
        </div>

        <div className="p-5 rounded-[20px] border border-line bg-surface shadow-xs">
          <div className="flex items-center justify-between text-xs text-ink-3 mb-2">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Sukses Penuh</span>
            <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-emerald-400 tabular-nums">{successCount}</div>
          <p className="text-xs text-ink-2 mt-1">Seluruh kolom cocok</p>
        </div>

        <div className="p-5 rounded-[20px] border border-line bg-surface shadow-xs">
          <div className="flex items-center justify-between text-xs text-ink-3 mb-2">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Parsial / Gagal</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-amber-400 tabular-nums">
            {partialCount + failedCount}
          </div>
          <p className="text-xs text-ink-2 mt-1">Kolom dilewati / tidak cocok</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-[20px] border border-line bg-surface shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input (Tinggi 48px, Radius 12px) */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-ink-3 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari domain instansi, formulir, atau aksi..."
            className="w-full h-12 pl-11 pr-4 rounded-xl border border-line bg-surface-2 text-sm text-ink placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-blue-500/80 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="inline-flex p-1 rounded-xl border border-line bg-surface-2 text-xs font-semibold self-start sm:self-auto">
          {[
            { id: 'all', label: 'Semua' },
            { id: 'success', label: 'Sukses' },
            { id: 'partial', label: 'Parsial' },
            { id: 'failed', label: 'Gagal' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-2 rounded-lg transition-colors ${
                statusFilter === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-ink-2 hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Activity Table Container */}
      <div className="rounded-[20px] border border-line bg-surface shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 rounded-xl bg-white/[0.04] animate-pulse" />
            ))}
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="p-12 text-center text-ink-2">
            <Clock className="w-10 h-10 text-ink-3 mx-auto mb-3 opacity-60" />
            <h3 className="text-base font-bold text-ink">Tidak Ada Riwayat Ditemukan</h3>
            <p className="text-xs text-ink-3 mt-1 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'all'
                ? 'Tidak ada aktivitas yang sesuai dengan filter pencarian Anda.'
                : 'Ekstensi GovConnect belum merekam aktivitas pengisian formulir di akun ini.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="border-b border-line bg-surface-2 text-ink-3 font-mono uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Waktu Eksekusi</th>
                  <th className="py-3.5 px-4">Portal / Domain Target</th>
                  <th className="py-3.5 px-4">Kolom Terisi</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredActivities.map((act) => {
                  const hostname =
                    act.website_domain ||
                    (act.target_url && !act.target_url.startsWith('file:')
                      ? new URL(act.target_url).hostname
                      : 'Formulir Web Instansi');

                  const isSuccess = act.status === 'success';
                  const isPartial = act.status === 'partial';

                  return (
                    <tr key={act.id} className="hover:bg-surface-2/60 transition-colors">
                      {/* Monospace Timestamp */}
                      <td className="py-4 px-4 sm:px-6 font-mono text-xs text-ink-2 whitespace-nowrap">
                        {new Date(act.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      {/* Domain / Target Website */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 min-w-0">
                          <Globe className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          <span className="font-semibold text-ink truncate max-w-[240px]">
                            {hostname}
                          </span>
                        </div>
                      </td>

                      {/* Field Filled Count */}
                      <td className="py-4 px-4 font-mono text-xs tabular-nums text-ink-2">
                        <span className="font-bold text-ink">{act.fields_filled}</span>
                        <span className="text-ink-3"> / </span>
                        <span>{act.fields_detected || act.fields_filled} kolom</span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-4">
                        {isSuccess ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Sukses
                          </span>
                        ) : isPartial ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            Parsial
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 border border-rose-500/30 text-rose-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                            Gagal
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 sm:px-6 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {act.target_url && !act.target_url.startsWith('file:') && (
                            <a
                              href={act.target_url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg border border-line bg-surface hover:bg-surface-3 text-ink-2 hover:text-ink transition-colors"
                              title="Kunjungi website formulir"
                              aria-label="Kunjungi website formulir"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(act.id)}
                            disabled={deletingId === act.id}
                            className="p-1.5 rounded-lg border border-line bg-surface hover:bg-rose-500/10 text-ink-3 hover:text-rose-400 transition-colors"
                            title="Hapus riwayat ini"
                            aria-label="Hapus riwayat ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-[20px] border border-line bg-surface p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-ink">{confirmModal.title}</h3>
                <p className="text-xs text-ink-3 mt-0.5">Konfirmasi penghapusan data audit</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-ink-2 leading-relaxed">
              {confirmModal.message}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 h-10 rounded-xl text-xs sm:text-sm font-semibold border border-line bg-surface hover:bg-surface-2 text-ink transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={executeConfirmedAction}
                className="px-4 h-10 rounded-xl text-xs sm:text-sm font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-md transition-colors"
              >
                Ya, Hapus Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
