import { useEffect, useState, useCallback } from 'react';
import { activityApi, type Activity } from '../services/api';
import { Card, EmptyState, FontAwesome } from '../components/ui';

export function ActivityPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Action feedback
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [clearingAll, setClearingAll] = useState(false);

  // Load activities - langsung tampil semua & sinkron dengan aktivitas dashboard
  const fetchActivities = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      // 1. Ambil dari endpoint list aktivitas
      const res = await activityApi.get({
        limit: 100,
        offset: 0,
      }).catch(() => null);

      let data = res?.data || [];

      // 2. Jika list kosong atau ingin memastikan konektivitas dengan recent_activities dasbor
      if (!data || data.length === 0) {
        const analyticsRes = await activityApi.getAnalytics().catch(() => null);
        if (analyticsRes?.data?.recent_activities && analyticsRes.data.recent_activities.length > 0) {
          data = analyticsRes.data.recent_activities;
        }
      }

      setActivities(data);
    } catch (err) {
      console.error('Failed to fetch activities:', err);
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

  const handleDeleteItem = async (id: number) => {
    if (!window.confirm('Hapus catatan riwayat autofill ini?')) return;
    setDeletingId(id);
    try {
      await activityApi.delete(id);
      setActivities((prev) => prev.filter((a) => a.id !== id));
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
  };

  const handleClearAll = async () => {
    if (
      !window.confirm(
        'Apakah Anda yakin ingin menghapus SELURUH riwayat aktivitas autofill? Tindakan ini tidak dapat dibatalkan.'
      )
    ) {
      return;
    }
    setClearingAll(true);
    try {
      const res = await activityApi.clearAll();
      setActivities([]);
      setActionFeedback({
        type: 'success',
        text: res.data.detail || 'Seluruh riwayat berhasil dibersihkan.',
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
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header Title & Top Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Riwayat Aktivitas
          </h1>
          <p className="text-sm text-[#6EA2B3] mt-1">
            Audit log dan jejak privasi pengisian formulir autofill
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="group relative inline-flex items-center gap-2.5 h-10 px-4.5 text-[13px] font-semibold text-white bg-gradient-to-r from-[#172338] via-[#1a2942] to-[#1c2e4a] hover:from-[#1b2b45] hover:via-[#203454] hover:to-[#243c61] border border-[#2e476b]/70 hover:border-[#7BBDE8] rounded-xl shadow-xs hover:shadow-[0_0_18px_rgba(123,189,232,0.22)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
          >
            <FontAwesome
              name="rotate-right"
              className={`text-xs text-[#7BBDE8] transition-transform duration-500 ${
                refreshing ? 'animate-spin' : 'group-hover:rotate-180'
              }`}
            />
            <span className="tracking-wide">
              {refreshing ? 'Memperbarui...' : 'Perbarui data'}
            </span>
          </button>
          {activities.length > 0 && (
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
              <span className="tracking-wide">
                {clearingAll ? 'Membersihkan...' : 'Bersihkan riwayat'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Feedback Alert Toast */}
      {actionFeedback && (
        <div
          className={`p-4 rounded-2xl border shadow-xs flex items-center gap-2.5 text-xs font-semibold transition-all ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60'
              : 'bg-rose-950/40 text-rose-300 border-rose-800/60'
          }`}
        >
          {actionFeedback.type === 'success' ? (
            <FontAwesome name="check-pure" className="text-xs text-emerald-400 shrink-0" />
          ) : (
            <FontAwesome name="info" className="text-xs text-rose-400 shrink-0" />
          )}
          <span>{actionFeedback.text}</span>
        </div>
      )}

      {/* Table Container */}
      <Card className="overflow-hidden border border-[#243048] bg-[#171F2F] shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <FontAwesome name="spinner" className="text-3xl text-[#7BBDE8] animate-spin" />
            <p className="text-xs text-[#6EA2B3] font-medium">Memuat riwayat aktivitas autofill...</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="p-12 text-center">
            <EmptyState
              icon={<FontAwesome name="inbox" className="text-3xl text-[#6EA2B3]" />}
              title="Tidak ada riwayat aktivitas"
              description="Gunakan ekstensi GovConnect di formulir layanan publik untuk merekam riwayat pengisian."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="h-12 bg-[#101828] text-[12px] leading-[16px] font-semibold text-[#6EA2B3]">
                  <th className="py-3 px-5 font-semibold">Tanggal</th>
                  <th className="py-3 px-5 font-semibold">Website Target</th>
                  <th className="py-3 px-5 font-semibold">Field Terisi</th>
                  <th className="py-3 px-5 font-semibold">Status</th>
                  <th className="py-3 px-5 font-semibold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((activity) => (
                  <tr
                    key={activity.id}
                    className="h-14 hover:bg-[#101828]/50 transition-colors duration-150"
                  >
                    <td className="py-3 px-5 text-[14px] leading-[20px] font-normal text-[#6EA2B3] whitespace-nowrap tabular-nums">
                      {new Date(activity.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-2.5">
                        <FontAwesome name="globe" className="text-[16px] text-[#7BBDE8] shrink-0" />
                        <span className="text-[14px] leading-[20px] font-medium text-white lowercase truncate max-w-[260px]">
                          {activity.website_domain ||
                            (activity.target_url
                              ? new URL(activity.target_url).hostname
                              : 'formulir web')}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-5 text-[14px] leading-[20px] font-normal text-[#6EA2B3]">
                      <span className="font-semibold text-white tabular-nums">
                        {activity.fields_filled}
                      </span>{' '}
                      dari{' '}
                      <span className="tabular-nums text-[#BDD8E9]">{activity.fields_detected}</span> field
                    </td>
                    <td className="py-3 px-5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] leading-[16px] font-semibold border ${
                          activity.status === 'success'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : activity.status === 'partial'
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            activity.status === 'success'
                              ? 'bg-emerald-400'
                              : activity.status === 'partial'
                              ? 'bg-amber-400'
                              : 'bg-rose-400'
                          }`}
                        />
                        <span>
                          {activity.status === 'success'
                            ? 'Sukses'
                            : activity.status === 'partial'
                            ? 'Parsial'
                            : 'Gagal'}
                        </span>
                      </span>
                    </td>
                    <td className="py-3 px-5 text-center">
                      <div className="inline-flex items-center justify-center gap-1.5">
                        {activity.target_url && !activity.target_url.startsWith('file:') && (
                          <a
                            href={activity.target_url}
                            target="_blank"
                            rel="noreferrer"
                            className="group/visit w-8 h-8 flex items-center justify-center text-[#6EA2B3] hover:text-[#7BBDE8] hover:bg-[#7BBDE8]/10 rounded-lg active:scale-90 transition-all duration-150"
                            title="Buka situs formulir sasaran"
                            aria-label="Buka situs formulir sasaran"
                          >
                            <FontAwesome name="paper-plane" className="text-[13px] group-hover/visit:translate-x-0.5 group-hover/visit:-translate-y-0.5 transition-transform" />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(activity.id)}
                          disabled={deletingId === activity.id}
                          className="group/del w-8 h-8 flex items-center justify-center text-[#6EA2B3] hover:text-rose-300 hover:bg-rose-500/20 rounded-lg active:scale-90 transition-all duration-150 cursor-pointer disabled:opacity-50"
                          title="Hapus catatan riwayat aktivitas"
                          aria-label="Hapus catatan riwayat aktivitas"
                        >
                          {deletingId === activity.id ? (
                            <FontAwesome
                              name="spinner"
                              className="text-[13px] animate-spin text-rose-400"
                            />
                          ) : (
                            <FontAwesome name="trash" className="text-[13px] group-hover/del:scale-110 group-hover/del:-rotate-6 transition-transform" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}