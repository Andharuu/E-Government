import { useEffect, useState, useCallback, useMemo } from 'react';
import { activityApi, type Activity } from '../services/api';
import {
  Calendar,
  Globe,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Trash2,
  Search,
  ExternalLink,
  Loader2,
  RefreshCw,
  Inbox
} from 'lucide-react';

const statusConfig = {
  success: {
    label: 'Sukses',
    badge: 'bg-green-100 text-green-700 border-green-200',
    icon: CheckCircle,
    color: 'text-green-600'
  },
  partial: {
    label: 'Parsial',
    badge: 'bg-amber-100 text-amber-700 border-amber-200',
    icon: AlertTriangle,
    color: 'text-amber-600'
  },
  failed: {
    label: 'Gagal',
    badge: 'bg-red-100 text-red-700 border-red-200',
    icon: XCircle,
    color: 'text-red-600'
  },
};

function formatWebsiteDomain(domain: string | null, targetUrl: string): string {
  if (domain && domain.trim()) return domain;
  if (!targetUrl) return 'Layanan Publik';
  try {
    const parsed = new URL(targetUrl);
    if (parsed.protocol === 'file:') return 'File Pengujian Lokal (HTML)';
    return parsed.hostname || targetUrl;
  } catch {
    return targetUrl || 'Layanan Publik';
  }
}

const PAGE_SIZE = 15;

export function ActivityPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [pageOffset, setPageOffset] = useState(0);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'partial' | 'failed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Action feedback
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [clearingAll, setClearingAll] = useState(false);

  // Load activities
  const fetchActivities = useCallback(async (offset = 0, isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const res = await activityApi.get({
        limit: PAGE_SIZE,
        offset: offset,
        status: statusFilter === 'all' ? undefined : statusFilter,
        domain: searchQuery.trim() ? searchQuery.trim() : undefined,
      });

      const data = res.data || [];
      if (offset === 0) {
        setActivities(data);
      } else {
        setActivities(prev => [...prev, ...data]);
      }
      setHasMore(data.length === PAGE_SIZE);
      setPageOffset(offset + data.length);
    } catch (err) {
      console.error('Failed to fetch activities:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    fetchActivities(0, true);
  }, [fetchActivities]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchActivities(0, false);
  };

  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    fetchActivities(pageOffset, false);
  };

  const handleDeleteItem = async (id: number) => {
    if (!window.confirm('Hapus catatan riwayat autofill ini?')) return;
    setDeletingId(id);
    try {
      await activityApi.delete(id);
      setActivities(prev => prev.filter(a => a.id !== id));
      setActionFeedback({ type: 'success', text: 'Catatan aktivitas berhasil dihapus.' });
      setTimeout(() => setActionFeedback(null), 3000);
    } catch (err: any) {
      setActionFeedback({
        type: 'error',
        text: err.response?.data?.detail || 'Gagal menghapus catatan aktivitas.'
      });
      setTimeout(() => setActionFeedback(null), 3500);
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus SELURUH riwayat aktivitas autofill? Tindakan ini tidak dapat dibatalkan.')) {
      return;
    }
    setClearingAll(true);
    try {
      const res = await activityApi.clearAll();
      setActivities([]);
      setHasMore(false);
      setPageOffset(0);
      setActionFeedback({ type: 'success', text: res.data.detail || 'Seluruh riwayat berhasil dibersihkan.' });
      setTimeout(() => setActionFeedback(null), 3500);
    } catch (err: any) {
      setActionFeedback({
        type: 'error',
        text: err.response?.data?.detail || 'Gagal membersihkan riwayat aktivitas.'
      });
      setTimeout(() => setActionFeedback(null), 3500);
    } finally {
      setClearingAll(false);
    }
  };

  // Client-side quick counts
  const filteredActivities = useMemo(() => {
    if (!searchQuery.trim()) return activities;
    const q = searchQuery.toLowerCase();
    return activities.filter(a =>
      (a.website_domain && a.website_domain.toLowerCase().includes(q)) ||
      (a.target_url && a.target_url.toLowerCase().includes(q))
    );
  }, [activities, searchQuery]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Riwayat Aktivitas</h1>
          <p className="text-slate-500 mt-1">Audit log dan jejak privasi pengisian formulir autofill</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium"
            title="Segarkan data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          {activities.length > 0 && (
            <button
              onClick={handleClearAll}
              disabled={clearingAll}
              className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              {clearingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              <span>Bersihkan Riwayat</span>
            </button>
          )}
        </div>
      </div>

      {/* Feedback Toast */}
      {actionFeedback && (
        <div className={`p-3.5 rounded-lg border text-sm flex items-center gap-2.5 ${
          actionFeedback.type === 'success'
            ? 'bg-green-50 text-green-700 border-green-200'
            : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {actionFeedback.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          <span>{actionFeedback.text}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          {(['all', 'success', 'partial', 'failed'] as const).map(st => {
            const labels = {
              all: 'Semua',
              success: 'Sukses',
              partial: 'Parsial',
              failed: 'Gagal'
            };
            const isActive = statusFilter === st;
            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {labels[st]}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari domain website..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-xs text-slate-500">Memuat riwayat aktivitas autofill...</p>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Inbox className="w-6 h-6" />
            </div>
            <p className="text-slate-700 font-semibold text-sm">Tidak ada riwayat aktivitas yang cocok</p>
            <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto">
              {statusFilter !== 'all' || searchQuery
                ? 'Coba ganti kata kunci pencarian atau ubah filter status di atas.'
                : 'Gunakan ekstensi GovConnect di formulir layanan publik untuk merekam riwayat pengisian.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/80 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Website Target</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Waktu</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Kolom Terisi</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredActivities.map(activity => {
                  const config = statusConfig[activity.status] || statusConfig.success;
                  const Icon = config.icon;
                  const summaryFields = activity.filled_fields_summary
                    ? activity.filled_fields_summary.split(',').map(s => s.trim()).filter(Boolean)
                    : [];

                  return (
                    <tr key={activity.id} className="group hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                            <span className="text-sm font-semibold text-slate-900 truncate max-w-xs">
                              {formatWebsiteDomain(activity.website_domain, activity.target_url)}
                            </span>
                            {activity.target_url && !activity.target_url.startsWith('file:') && (
                              <a
                                href={activity.target_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-slate-400 hover:text-blue-600 transition-colors"
                                title="Buka URL formulir"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                          {summaryFields.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {summaryFields.slice(0, 3).map((f, idx) => (
                                <span key={idx} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                                  {f}
                                </span>
                              ))}
                              {summaryFields.length > 3 && (
                                <span className="text-[10px] text-slate-400 font-medium">
                                  +{summaryFields.length - 3} lainnya
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-xs text-slate-500 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {new Date(activity.created_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                          <span className="text-slate-400">
                            {new Date(activity.created_at).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{
                                width: `${activity.fields_detected > 0 ? Math.min(100, Math.round((activity.fields_filled / activity.fields_detected) * 100)) : 100}%`
                              }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-slate-700">
                            {activity.fields_filled}/{activity.fields_detected}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.badge}`}>
                          <Icon className="w-3 h-3" />
                          {config.label}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(activity.id)}
                          disabled={deletingId === activity.id}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus catatan ini"
                        >
                          {deletingId === activity.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Load More Footer */}
        {!loading && hasMore && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 text-center">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-2 mx-auto disabled:opacity-50"
            >
              {loadingMore && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />}
              {loadingMore ? 'Memuat...' : 'Muat Lebih Banyak Riwayat'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}