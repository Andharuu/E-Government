import { useState, useMemo } from 'react';
import { usePolling } from '../../hooks/usePolling';
import { adminApi, type AdminUserItem } from '../../services/api';
import {
  Button, FontAwesome, Badge, Card, CardHeader, CardTitle, CardDescription,
  EmptyState, Input, Tabs,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Modal,
} from '../../components/ui';
import { relativeTime } from '../../components/admin/adminUi';

const FILTERS = [
  { id: 'all', label: 'Semua' },
  { id: 'active', label: 'Aktif' },
  { id: 'inactive', label: 'Nonaktif' },
  { id: 'admin', label: 'Admin' },
] as const;

type FilterKey = typeof FILTERS[number]['id'];

export function AdminUsers() {
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<AdminUserItem | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');

  const load = () => {
    setLoading(true);
    adminApi.getUsers().then(res => {
      setUsers(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  // Data pengguna ikut diperbarui otomatis (pendaftaran baru langsung terlihat).
  usePolling(load, { interval: 10000 });

  const handleToggle = async (u: AdminUserItem) => {
    setBusyId(u.id);
    try {
      await adminApi.toggleUserActive(u.id);
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, is_active: !x.is_active } : x));
    } catch {
      // Abaikan
    } finally {
      setBusyId(null);
      setConfirmTarget(null);
    }
  };

  const filtered = useMemo(() => {
    return users.filter(u => {
      if (filter === 'active' && !u.is_active) return false;
      if (filter === 'inactive' && u.is_active) return false;
      if (filter === 'admin' && !u.is_admin) return false;
      if (query && !u.email.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [users, filter, query]);

  const counts = useMemo(() => ({
    all: users.length,
    active: users.filter(u => u.is_active).length,
    inactive: users.filter(u => !u.is_active).length,
    admin: users.filter(u => u.is_admin).length,
  }), [users]);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <p className="eyebrow">Pengguna</p>
          <h1 className="page-title">Manajemen Pengguna</h1>
          <p className="page-sub">
            Kelola akun pengguna — hanya email &amp; kelengkapan profil, tanpa data pribadi
          </p>
        </div>
      </div>

      <div className="flex items-start gap-2.5 rounded-lg border border-line bg-surface px-4 py-3">
        <FontAwesome name="shield-halved" className="text-[12px] text-ink-3 mt-0.5 shrink-0" />
        <p className="text-[12px] text-ink-2 leading-relaxed">
          Sesuai prinsip privasi: admin mengelola <b className="text-ink font-semibold">akun</b>, bukan mengintip identitas. NIK, telepon, alamat &amp; data keluarga tetap terenkripsi.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Daftar Pengguna</CardTitle>
            <CardDescription>{filtered.length} dari {users.length} pengguna</CardDescription>
          </div>
        </CardHeader>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border-b border-line">
          <div className="flex-1 min-w-0">
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Cari email pengguna..."
              aria-label="Cari email pengguna"
            />
          </div>
          <Tabs
            items={FILTERS.map(f => ({ id: f.id, label: f.label, badge: counts[f.id] }))}
            activeTab={filter}
            onChange={id => setFilter(id as FilterKey)}
          />
        </div>

        {loading ? (
          <div className="empty">
            <FontAwesome name="spinner" spin className="text-[15px] text-ink-3 mb-3" />
            <p className="text-[12.5px] text-ink-3">Memuat data...</p>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={<FontAwesome name="users" />} title="Tidak ada pengguna" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Pengaduan</TableHead>
                <TableHead>Kelengkapan Profil</TableHead>
                <TableHead>Terdaftar</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(u => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-md border border-line bg-surface-3 text-ink-2 text-[11px] font-semibold flex items-center justify-center shrink-0">
                        {u.email.charAt(0).toUpperCase()}
                      </span>
                      <span className="cell-strong">{u.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {u.is_admin
                      ? <Badge variant="info">ADMIN</Badge>
                      : <Badge variant="neutral">WARGA</Badge>}
                  </TableCell>
                  <TableCell className="tabular-nums">{u.complaint_count}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 rounded-full bg-surface-3 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-accent transition-[width] duration-200"
                          style={{ width: `${Math.min(u.profile_completion, 100)}%` }}
                        />
                      </div>
                      <span className="text-[11.5px] text-ink-3 tabular-nums">{u.profile_completion}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-[12px] text-ink-3 whitespace-nowrap">{relativeTime(u.created_at)}</TableCell>
                  <TableCell>
                    <Badge variant={u.is_active ? 'ok' : 'danger'} dot>
                      {u.is_active ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant={u.is_active ? 'secondary' : 'primary'}
                      loading={busyId === u.id}
                      onClick={() => setConfirmTarget(u)}
                    >
                      {u.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Modal Konfirmasi Toggle Status Pengguna */}
      {confirmTarget && (
        <Modal isOpen={Boolean(confirmTarget)} onClose={() => setConfirmTarget(null)}>
          <div className="card w-full max-w-md">
            <div className="card-head">
              <h3 className="card-title">
                Konfirmasi {confirmTarget.is_active ? 'Nonaktifkan' : 'Aktifkan'} Pengguna
              </h3>
            </div>
            <div className="card-body">
              <p className="text-[13px] text-ink-2 leading-relaxed">
                Apakah Anda yakin ingin {confirmTarget.is_active ? 'menonaktifkan' : 'mengaktifkan'} akun <strong className="text-ink font-semibold">{confirmTarget.email}</strong>?
                {confirmTarget.is_active
                  ? ' Pengguna tidak akan dapat masuk atau menggunakan layanan autofill saat akun nonaktif.'
                  : ' Pengguna akan dapat masuk kembali dan menggunakan layanan GovConnect.'}
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-line bg-surface-2 rounded-b-lg">
              <Button variant="ghost" onClick={() => setConfirmTarget(null)}>Batal</Button>
              <Button
                variant={confirmTarget.is_active ? 'secondary' : 'primary'}
                loading={busyId === confirmTarget.id}
                onClick={() => handleToggle(confirmTarget)}
              >
                {confirmTarget.is_active ? 'Ya, Nonaktifkan' : 'Ya, Aktifkan'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
