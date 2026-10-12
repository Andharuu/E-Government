import { useEffect, useState, useMemo } from 'react';
import { adminApi, type AdminUserItem } from '../../services/api';
import { Button } from '../../components/ui';
import {
  AdminCard, SectionTitle, EmptyState, LoadingBlock, relativeTime,
} from '../../components/admin/adminUi';

export function AdminUsers() {
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
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
      // Mis. mencoba menonaktifkan akun sendiri -> diabaikan dengan aman.
    } finally {
      setBusyId(null);
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
        <h1 className="text-3xl font-extrabold text-[#0B1121] tracking-tight">Manajemen Pengguna</h1>
        <p className="text-sm text-slate-500 mt-1.5 font-medium">
          Kelola akun warga — hanya email & kelengkapan profil, tanpa data pribadi
        </p>
      </div>

      <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-blue-50 border border-blue-100">
        <span className="text-blue-600">🛡️</span>
        <p className="text-xs text-blue-700 font-medium">
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
            className="flex-1 h-10 px-3.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100/60 outline-none text-sm transition-all"
          />
          <div className="flex gap-2">
            {([
              ['all', 'Semua', counts.all],
              ['active', 'Aktif', counts.active],
              ['inactive', 'Nonaktif', counts.inactive],
              ['admin', 'Admin', counts.admin],
            ] as const).map(([key, label, count]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  filter === key
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                {label} {count}
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
                <tr className="text-left text-[11px] uppercase tracking-wide text-slate-400 border-b border-slate-100">
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
                  <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-blue-400 text-white text-xs font-bold flex items-center justify-center shrink-0">
                          {u.email.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-slate-700 font-medium">{u.email}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      {u.is_admin
                        ? <span className="text-[10px] px-2 py-1 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">ADMIN</span>
                        : <span className="text-[10px] px-2 py-1 rounded-full bg-slate-100 text-slate-600 font-semibold border border-slate-200">WARGA</span>}
                    </td>
                    <td className="px-5 py-3 text-slate-600">{u.complaint_count}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${Math.min(u.profile_completion, 100)}%` }} />
                        </div>
                        <span className="text-[11px] text-slate-500 font-medium">{u.profile_completion}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-500 text-xs whitespace-nowrap">{relativeTime(u.created_at)}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${u.is_active ? 'text-emerald-600' : 'text-rose-600'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        {u.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Button
                        size="sm"
                        variant={u.is_active ? 'outline' : 'primary'}
                        loading={busyId === u.id}
                        onClick={() => handleToggle(u)}
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
    </div>
  );
}
