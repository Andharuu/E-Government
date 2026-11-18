import { useEffect, useState, useCallback } from 'react';
import { activityApi, type Activity } from '../services/api';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  FontAwesome,
  StatCard,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  ConfirmDialog,
} from '../components/ui';

export function ActivityPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
    } catch {
      // Diamkan kegagalan fetch agar UI menampilkan state kosong yang bersih tanpa leak log ke console
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
      message: 'Apakah Anda yakin ingin menghapus catatan riwayat autofill ini dari riwayat?',
    });
  };

  const handleClearAll = () => {
    setConfirmModal({
      isOpen: true,
      type: 'all',
      title: 'Bersihkan Seluruh Riwayat',
      message: 'Apakah Anda yakin ingin menghapus SELURUH catatan riwayat aktivitas autofill? Tindakan ini tidak dapat dibatalkan.',
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
    }
  };

  // Ringkasan tampilan - diturunkan dari data yang sudah dimuat, tanpa state baru
  const totalFields = activities.reduce((sum, a) => sum + a.fields_filled, 0);
  const successCount = activities.filter((a) => a.status === 'success').length;
  const attentionCount = activities.length - successCount;

  return (
    <div className="page page-enter w-full max-w-5xl mx-auto pb-12">
      <div className="page-head">
        <div className="min-w-0">
          <h1 className="page-title">Riwayat Aktivitas</h1>
          <p className="page-sub">Audit log dan jejak privasi pengisian formulir autofill</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing || loading}
            loading={refreshing}
            icon={<FontAwesome name="rotate-right" />}
          >
            {refreshing ? 'Memperbarui...' : 'Perbarui data'}
          </Button>

          {activities.length > 0 && (
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
              {clearingAll ? 'Membersihkan...' : 'Bersihkan riwayat'}
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
            name={actionFeedback.type === 'success' ? 'check-pure' : 'info'}
            className="text-[12px] shrink-0"
          />
          <span>{actionFeedback.text}</span>
        </div>
      )}

      {!loading && activities.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total catatan" value={activities.length} />
          <StatCard title="Field terisi" value={totalFields} />
          <StatCard title="Sukses" value={successCount} />
          <StatCard title="Perlu perhatian" value={attentionCount} />
        </div>
      )}

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton h-9" />
            ))}
          </div>
        ) : activities.length === 0 ? (
          <EmptyState
            icon={<FontAwesome name="inbox" />}
            title="Tidak ada riwayat aktivitas"
            description="Gunakan ekstensi GovConnect di formulir layanan publik untuk merekam riwayat pengisian."
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Website Target</TableHead>
                  <TableHead>Field Terisi</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell className="cell-mono">
                      {new Date(activity.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2 min-w-0">
                        <FontAwesome name="globe" className="text-[11px] text-ink-3 shrink-0" />
                        <span className="cell-strong lowercase truncate max-w-[240px]">
                          {activity.website_domain ||
                            (activity.target_url
                              ? new URL(activity.target_url).hostname
                              : 'formulir web')}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="tabular-nums whitespace-nowrap">
                      <span className="cell-strong">{activity.fields_filled}</span>
                      <span className="text-ink-3"> dari </span>
                      <span>{activity.fields_detected}</span>
                      <span className="text-ink-3"> field</span>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={
                          activity.status === 'success'
                            ? 'ok'
                            : activity.status === 'partial'
                            ? 'warn'
                            : 'danger'
                        }
                        dot
                      >
                        {activity.status === 'success'
                          ? 'Sukses'
                          : activity.status === 'partial'
                          ? 'Parsial'
                          : 'Gagal'}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-1">
                        {activity.target_url && !activity.target_url.startsWith('file:') && (
                          <a
                            href={activity.target_url}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-ghost btn-icon btn-sm"
                            title="Buka situs formulir sasaran"
                            aria-label="Buka situs formulir sasaran"
                          >
                            <FontAwesome name="paper-plane" className="text-[11px]" />
                          </a>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          iconOnly
                          icon={<FontAwesome name="trash" className="text-[11px]" />}
                          onClick={() => handleDeleteItem(activity.id)}
                          disabled={deletingId === activity.id}
                          loading={deletingId === activity.id}
                          className="hover:text-danger"
                          title="Hapus catatan riwayat aktivitas"
                          aria-label="Hapus catatan riwayat aktivitas"
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="card-foot">
              <span className="text-[12px] text-ink-3">
                Menampilkan{' '}
                <span className="text-ink font-semibold tabular-nums">{activities.length}</span> catatan
              </span>
              <span className="text-[12px] text-ink-3 tabular-nums">{totalFields} field terisi</span>
            </div>
          </>
        )}
      </Card>

      <ConfirmDialog
        isOpen={Boolean(confirmModal?.isOpen)}
        onClose={() => setConfirmModal(null)}
        onConfirm={executeConfirmedAction}
        title={confirmModal?.title || ''}
        message={confirmModal?.message || ''}
        confirmLabel="Ya, Hapus"
        confirmVariant="danger"
        confirmLoading={deletingId !== null || clearingAll}
      />
    </div>
  );
}