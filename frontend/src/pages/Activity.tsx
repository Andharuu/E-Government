import { useEffect, useState, useCallback } from 'react';
import { activityApi, type Activity } from '../services/api';
import { Card, Button, EmptyState, Flaticon, FontAwesome } from '../components/ui';

export function ActivityPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

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

  const toggleSelectAll = () => {
    if (selectedIds.length === activities.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(activities.map((a) => a.id));
    }
  };

  const toggleSelectRow = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleDeleteItem = async (id: number) => {
    if (!window.confirm('Hapus catatan riwayat autofill ini?')) return;
    setDeletingId(id);
    try {
      await activityApi.delete(id);
      setActivities((prev) => prev.filter((a) => a.id !== id));
      setSelectedIds((prev) => prev.filter((x) => x !== id));
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
      setSelectedIds([]);
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
    <div className="w-full space-y-6 pb-12">
      {/* Header Title & Top Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] leading-[36px] font-semibold text-[#0F172A] tracking-[-0.02em]">
            Riwayat aktivitas
          </h1>
          <p className="text-[14px] leading-[22px] font-normal text-[#475569] mt-0.5">
            Audit log dan jejak privasi pengisian formulir autofill
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-[14px] font-medium text-white bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 disabled:cursor-not-allowed rounded-[10px] transition-colors cursor-pointer"
          >
            <Flaticon
              name="rotate-right"
              className={`text-xs text-white ${refreshing ? 'animate-spin' : ''}`}
            />
            <span>{refreshing ? 'Memperbarui...' : 'Perbarui data'}</span>
          </button>
          {activities.length > 0 && (
            <Button
              variant="danger"
              size="md"
              onClick={handleClearAll}
              disabled={clearingAll}
              icon={
                clearingAll ? (
                  <Flaticon name="spinner" className="text-xs animate-spin" />
                ) : (
                  <Flaticon name="trash" className="text-xs" />
                )
              }
              className="shadow-xs"
            >
              <span>{clearingAll ? 'Membersihkan...' : 'Bersihkan riwayat'}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Feedback Alert Toast */}
      {actionFeedback && (
        <div
          className={`p-4 rounded-2xl border shadow-xs flex items-center gap-2.5 text-xs font-semibold transition-all ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {actionFeedback.type === 'success' ? (
            <Flaticon name="check" className="text-xs text-emerald-600 shrink-0" />
          ) : (
            <Flaticon name="info" className="text-xs text-rose-600 shrink-0" />
          )}
          <span>{actionFeedback.text}</span>
        </div>
      )}

      {/* Table Container (Sesuai Desain Tabel Dasbor & Langsung Tampil Semua) */}
      <Card className="overflow-hidden border border-[#E8ECF2]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <Flaticon name="spinner" className="text-3xl text-blue-600 animate-spin" />
            <p className="text-xs text-slate-500 font-medium">Memuat riwayat aktivitas autofill...</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="p-12 text-center">
            <EmptyState
              icon={<Flaticon name="inbox" className="text-3xl text-slate-300" />}
              title="Tidak ada riwayat aktivitas"
              description="Gunakan ekstensi GovConnect di formulir layanan publik untuk merekam riwayat pengisian."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="h-11 bg-[#F6F8FB] border-b border-[#F1F4F8] text-[12px] leading-[16px] font-medium text-[#64748B]">
                  <th className="py-3 px-4 w-10 text-center font-medium">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === activities.length && activities.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded-[4px] border-[#E8ECF2] text-[#2563EB] focus:ring-[#2563EB] cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-4 font-medium">
                    <div className="flex items-center gap-1.5">
                      <span>Tanggal</span>
                      <FontAwesome name="sort" variant="solid" className="text-[12px] text-[#64748B]" />
                    </div>
                  </th>
                  <th className="py-3 px-4 font-medium">
                    <div className="flex items-center gap-1.5">
                      <span>Website target</span>
                      <FontAwesome name="sort" variant="solid" className="text-[12px] text-[#64748B]" />
                    </div>
                  </th>
                  <th className="py-3 px-4 font-medium">
                    <div className="flex items-center gap-1.5">
                      <span>Field terisi</span>
                      <FontAwesome name="sort" variant="solid" className="text-[12px] text-[#64748B]" />
                    </div>
                  </th>
                  <th className="py-3 px-4 font-medium">
                    <div className="flex items-center gap-1.5">
                      <span>Status</span>
                      <FontAwesome name="sort" variant="solid" className="text-[12px] text-[#64748B]" />
                    </div>
                  </th>
                  <th className="py-3 px-4 font-medium text-center">
                    <span>Aksi</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F4F8]">
                {activities.map((activity) => {
                  const isSelected = selectedIds.includes(activity.id);
                  return (
                    <tr
                      key={activity.id}
                      className={`h-14 hover:bg-[#F8FAFC] transition-colors duration-150 ${
                        isSelected ? 'bg-blue-50/30' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(activity.id)}
                          className="w-4 h-4 rounded-[4px] border-[#E8ECF2] text-[#2563EB] focus:ring-[#2563EB] cursor-pointer"
                        />
                      </td>
                      <td className="py-3.5 px-4 text-[14px] leading-[20px] font-normal text-[#475569] whitespace-nowrap tabular-nums">
                        {new Date(activity.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <Flaticon name="globe" className="text-[16px] text-[#64748B] shrink-0" />
                          <span className="text-[14px] leading-[20px] font-medium text-[#0F172A] lowercase truncate max-w-[240px]">
                            {activity.website_domain ||
                              (activity.target_url
                                ? new URL(activity.target_url).hostname
                                : 'formulir web')}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-[14px] leading-[20px] font-normal text-[#475569]">
                        <span className="font-medium text-[#0F172A] tabular-nums">
                          {activity.fields_filled}
                        </span>{' '}
                        dari{' '}
                        <span className="tabular-nums">{activity.fields_detected}</span> field
                      </td>
                      <td className="py-3.5 px-4">
                        {/* Badge Status */}
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] leading-[16px] font-medium ${
                            activity.status === 'success'
                              ? 'bg-[#ECFDF5] text-[#047857] border border-[#ECFDF5]'
                              : activity.status === 'partial'
                              ? 'bg-[#FFFBEB] text-[#B45309] border border-[#FFFBEB]'
                              : 'bg-[#FFF1F2] text-[#BE123C] border border-[#FFF1F2]'
                          }`}
                        >
                          {activity.status === 'success'
                            ? 'Sukses'
                            : activity.status === 'partial'
                            ? 'Parsial'
                            : 'Gagal'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center justify-center gap-2">
                          {activity.target_url && !activity.target_url.startsWith('file:') && (
                            <a
                              href={activity.target_url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 text-[#64748B] hover:text-[#2563EB] transition-colors"
                              title="Buka URL Formulir"
                            >
                              <FontAwesome name="paper-plane" className="text-[14px]" />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(activity.id)}
                            disabled={deletingId === activity.id}
                            className="p-1.5 text-[#64748B] hover:text-[#E11D48] transition-colors cursor-pointer"
                            title="Hapus Catatan Riwayat"
                          >
                            {deletingId === activity.id ? (
                              <FontAwesome
                                name="spinner"
                                className="text-[14px] animate-spin text-[#E11D48]"
                              />
                            ) : (
                              <FontAwesome name="trash" className="text-[14px]" />
                            )}
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
      </Card>
    </div>
  );
}