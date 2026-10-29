import { useEffect, useState, useMemo } from 'react';
import { adminApi, type AdminUserItem } from '../../services/api';
import { Button, FontAwesome } from '../../components/ui';
import {
  AdminCard, SectionTitle, EmptyState, LoadingBlock, relativeTime,
} from '../../components/admin/adminUi';

export function AdminUsers() {
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<AdminUserItem | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'admin'>('all');

  const load = () => {
    setLoading(true);
    adminApi.getUsers().then(res => {
      setUsers(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

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
    <div className="w-full space-y-5 pb-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Manajemen Pengguna</h1>
        <p className="text-sm text-slate-500 dark:text-[#6EA2B3] mt-1.5 font-medium">
          Kelola akun warga — hanya email & kelengkapan profil, tanpa data pribadi
        </p>
      </div>

      <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-800/40">
        <FontAwesome name="shield-halved" className="text-blue-600 dark:text-blue-400 text-sm shrink-0" />
        <p className="text-xs text-blue-700 dark:text-blue-300 font-medium leading-relaxed">
          Sesuai prinsip privasi: admin mengelola <b>akun</b>, bukan mengintip identitas. NIK, telepon, alamat & data keluarga tetap terenkripsi.
        </p>
      </div>

      <AdminCard>
        <SectionTitle icon="users" title="Daftar Pengguna" subtitle={`${filtered.length} dari ${users.length} pengguna`} />
        <div className="p-5 flex flex-col sm:flex-row gap-3">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Cari email pengguna..."
            className="flex-1 h-10 px-3.5 rounded-xl border border-slate-200 dark:border-[#243048] bg-white dark:bg-[#101828] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#6EA2B3]/50 focus:border-blue-500 dark:focus:border-[#7BBDE8] focus:ring-4 focus:ring-blue-100/60 dark:focus:ring-blue-900/30 outline-none text-sm transition-all"
          />
          <div className="flex gap-2 flex-wrap">
            {([
              ['all', 'Semua', counts.all],
              ['active', 'Aktif', counts.active],
              ['inactive', 'Nonaktif', counts.inactive],
              ['admin', 'Admin', counts.admin],
            ] as const).map(([key, label, count]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  filter === key
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white dark:bg-[#101828] text-slate-600 dark:text-[#6EA2B3] border-slate-200 dark:border-[#243048] hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <span>{label}</span> <span className={`${filter === key ? 'text-white/80' : 'text-slate-400 dark:text-[#6EA2B3]'}`}>{count}</span>
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <LoadingBlock />
        ) : filtered.length === 0 ? (
          <EmptyState icon="users" title="Tidak ada pengguna" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-slate-400 dark:text-[#6EA2B3] border-b border-slate-200 dark:border-[#243048]">
                  <th className="px-5 py-3 font-bold">Email</th>
                  <th className="px-5 py-3 font-bold">Role</th>
                  <th className="px-5 py-3 font-bold">Pengaduan</th>
                  <th className="px-5 py-3 font-bold">Kelengkapan Profil</th>
                  <th className="px-5 py-3 font-bold">Terdaftar</th>
                  <th className="px-5 py-3 font-bold">Status</th>
                  <th className="px-5 py-3 font-bold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id} className="border-b border-slate-100 dark:border-[#1E293B] hover:bg-slate-50/80 dark:hover:bg-[#1E293B]/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-sm">
                          {u.email.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-slate-800 dark:text-slate-200 font-medium">{u.email}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      {u.is_admin
                        ? <span className="text-[10px] px-2 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800/60">ADMIN</span>
                        : <span className="text-[10px] px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700">WARGA</span>}
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-[#6EA2B3]">{u.complaint_count}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div className="h-full rounded-full bg-blue-500 dark:bg-[#7BBDE8] transition-all" style={{ width: `${Math.min(u.profile_completion, 100)}%` }} />
                        </div>
                        <span className="text-[11px] text-slate-500 dark:text-[#6EA2B3] font-medium">{u.profile_completion}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-500 dark:text-[#6EA2B3] text-xs whitespace-nowrap">{relativeTime(u.created_at)}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${u.is_active ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <span>{u.is_active ? 'Aktif' : 'Nonaktif'}</span>
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Button
                        size="sm"
                        variant={u.is_active ? 'outline' : 'primary'}
                        loading={busyId === u.id}
                        onClick={() => setConfirmTarget(u)}
                      >
                        {u.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>

      {/* Modal Konfirmasi Toggle Status Pengguna */}
      {confirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#171F2F] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-[#243048] text-slate-900 dark:text-white animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Konfirmasi {confirmTarget.is_active ? 'Nonaktifkan' : 'Aktifkan'} Pengguna
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
              Apakah Anda yakin ingin {confirmTarget.is_active ? 'menonaktifkan' : 'mengaktifkan'} akun <strong>{confirmTarget.email}</strong>?
              {confirmTarget.is_active
                ? ' Pengguna tidak akan dapat masuk atau menggunakan layanan autofill saat akun nonaktif.'
                : ' Pengguna akan dapat masuk kembali dan menggunakan layanan GovConnect.'}
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button variant="ghost" onClick={() => setConfirmTarget(null)}>Batal</Button>
              <Button
                variant={confirmTarget.is_active ? 'outline' : 'primary'}
                loading={busyId === confirmTarget.id}
                onClick={() => handleToggle(confirmTarget)}
              >
                {confirmTarget.is_active ? 'Ya, Nonaktifkan' : 'Ya, Aktifkan'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
