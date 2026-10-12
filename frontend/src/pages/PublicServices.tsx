import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { publicServicesApi, type PublicServicesResponse, type PublicServiceAgenda } from '../services/api';
import { Card, EmptyState, FontAwesome } from '../components/ui';

// Mapping nama instansi ke file logo resmi asli
const AGENCY_LOGO_MAP: Record<string, string> = {
  'ltmpt': '/logos/ltmpt.svg',
  'bkn': '/logos/bkn.svg',
  'kemendikbud': '/logos/kemendikbud.svg',
  'pendidikan': '/logos/kemendikbud.svg',
  'lpdp': '/logos/lpdp.svg',
  'pajak': '/logos/pajak.svg',
  'djp': '/logos/pajak.svg',
  'bkpm': '/logos/bkpm.svg',
  'oss': '/logos/bkpm.svg',
  'kemenkeu': '/logos/kemenkeu.svg',
  'djpk': '/logos/kemenkeu.svg',
  'kemkeu': '/logos/kemenkeu.svg',
  'dukcapil': '/logos/dukcapil.svg',
  'kemendagri': '/logos/dukcapil.svg',
  'imigrasi': '/logos/imigrasi.svg',
  'bpjs kesehatan': '/logos/bpjs-kes.svg',
  'bpjs ketenagakerjaan': '/logos/bpjs-ker.svg',
  'bpjs': '/logos/bpjs-kes.svg',
  'kesehatan': '/logos/kemenkes.svg',
  'kemenkes': '/logos/kemenkes.svg',
  'pupr': '/logos/pupr.svg',
  'cipta karya': '/logos/pupr.svg',
  'pu': '/logos/pupr.svg',
  'polri': '/logos/polri.svg',
  'kepolisian': '/logos/polri.svg',
  'korlantas': '/logos/polri.svg',
  'kemensos': '/logos/kemensos.svg',
  'sosial': '/logos/kemensos.svg',
};

function resolveAgencyLogo(agency: string, rawSrc?: string): string {
  if (rawSrc && rawSrc.startsWith('/logos/')) {
    return rawSrc;
  }
  const clean = (agency || '').toLowerCase();
  for (const [key, path] of Object.entries(AGENCY_LOGO_MAP)) {
    if (clean.includes(key)) {
      return path;
    }
  }
  return rawSrc || '/logos/kemendikbud.svg';
}

function formatImportance(imp: 'tinggi' | 'sedang' | 'biasa') {
  if (imp === 'tinggi') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
        Prioritas Tinggi
      </span>
    );
  }
  if (imp === 'sedang') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        Prioritas Sedang
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#BDD8E9]/25 text-[#0A4174] border border-[#BDD8E9]/60">
      <span className="w-1.5 h-1.5 rounded-full bg-[#7BBDE8]" />
      Reguler
    </span>
  );
}

// Logo display dengan vector SVG resmi instansi & fallback aman
function LogoDisplay({ src, alt, size = 'w-14 h-14' }: { src?: string; alt: string; size?: string }) {
  const [hasError, setHasError] = useState(false);
  const targetLogo = resolveAgencyLogo(alt, src);

  if (hasError) {
    return (
      <div className={`shrink-0 ${size} rounded-[14px] bg-[#BDD8E9]/20 border border-[#BDD8E9]/70 shadow-xs flex items-center justify-center p-2 text-[#0A4174]`}>
        <FontAwesome name="landmark" variant="solid" className="text-xl" />
      </div>
    );
  }

  return (
    <div className={`shrink-0 ${size} rounded-[14px] bg-white border border-[#BDD8E9]/70 shadow-xs flex items-center justify-center p-2 overflow-hidden group-hover:scale-105 group-hover:border-[#7BBDE8] transition-transform`}>
      <img
        src={targetLogo}
        alt={alt}
        className="w-full h-full object-contain"
        onError={() => setHasError(true)}
      />
    </div>
  );
}

// ─── DETAIL PAGE ───────────────────────────────────────────────
export function PublicServiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<PublicServicesResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    publicServicesApi
      .get()
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const item: PublicServiceAgenda | null = useMemo(() => {
    if (!data || !id) return null;
    return data.agendas.find((a) => a.id === Number(id)) || null;
  }, [data, id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <FontAwesome name="spinner" className="w-8 h-8 text-[#0A4174] animate-spin" />
        <span className="text-sm font-medium text-[#49769F]">Memuat informasi layanan publik...</span>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="space-y-6">
        <EmptyState title="Layanan tidak ditemukan" description="Layanan yang Anda cari tidak tersedia atau telah dipindahkan." />
        <Link to="/public-services" className="text-[#0A4174] hover:underline inline-flex items-center gap-2 text-sm font-semibold">
          <FontAwesome name="arrow-left" className="w-4 h-4" />
          Kembali ke Katalog Layanan Publik
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back link */}
      <Link
        to="/public-services"
        className="inline-flex items-center gap-2 text-[#49769F] hover:text-[#001D39] transition-colors text-sm font-semibold"
      >
        <FontAwesome name="arrow-left" className="w-4 h-4" />
        Kembali ke Katalog Layanan Publik
      </Link>

      <Card className="overflow-hidden border border-[#BDD8E9]/70 rounded-[20px] shadow-sm">
        {/* Hero Header dengan Logo Resmi & Gradien Navy */}
        <div className="bg-gradient-to-r from-[#001D39] via-[#0A4174] to-[#001D39] p-6 md:p-8 border-b border-[#BDD8E9]/20 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="w-20 h-20 rounded-[18px] bg-white p-2.5 shadow-md flex items-center justify-center shrink-0 border border-white/20">
              <LogoDisplay src={item.logo_url} alt={item.agency} size="w-full h-full" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#7BBDE8]/20 text-[#7BBDE8] border border-[#7BBDE8]/30 uppercase tracking-wider">
                  {item.category}
                </span>
                {formatImportance(item.importance)}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">{item.title}</h1>
              <p className="text-[#BDD8E9] text-sm font-medium mt-1.5 flex items-center gap-1.5 truncate">
                <FontAwesome name="building-columns" className="text-xs text-[#7BBDE8]" />
                {item.agency}
              </p>
            </div>
          </div>
        </div>

        {/* Body Informasi Terstruktur */}
        <div className="p-6 md:p-8 space-y-6 bg-white">
          {/* Info Grid 4 Kotak */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#BDD8E9]/15 rounded-[14px] p-4 border border-[#BDD8E9]/60">
              <p className="text-[11px] text-[#49769F] font-bold uppercase tracking-wider mb-1">Sektor</p>
              <p className="font-bold text-[#001D39] capitalize text-sm">{item.category}</p>
            </div>
            <div className="bg-[#BDD8E9]/15 rounded-[14px] p-4 border border-[#BDD8E9]/60">
              <p className="text-[11px] text-[#49769F] font-bold uppercase tracking-wider mb-1">Jadwal / Periode</p>
              <p className="font-bold text-[#001D39] text-sm truncate">{item.deadline}</p>
            </div>
            <div className="bg-[#BDD8E9]/15 rounded-[14px] p-4 border border-[#BDD8E9]/60">
              <p className="text-[11px] text-[#49769F] font-bold uppercase tracking-wider mb-1">Instansi Penyelenggara</p>
              <p className="font-bold text-[#001D39] text-sm truncate">{item.agency}</p>
            </div>
            <div className="bg-[#BDD8E9]/15 rounded-[14px] p-4 border border-[#BDD8E9]/60">
              <p className="text-[11px] text-[#49769F] font-bold uppercase tracking-wider mb-1">Status Prioritas</p>
              <div>{formatImportance(item.importance)}</div>
            </div>
          </div>

          {/* Deskripsi Layanan */}
          <div>
            <h3 className="font-bold text-[16px] text-[#001D39] mb-2.5 flex items-center gap-2">
              <FontAwesome name="circle-info" className="text-base text-[#0A4174]" />
              Deskripsi Layanan
            </h3>
            <p className="text-slate-600 leading-relaxed text-[14px]">{item.description}</p>
          </div>

          {/* Persyaratan & Data yang Dibutuhkan */}
          <div>
            <h3 className="font-bold text-[16px] text-[#001D39] mb-3 flex items-center gap-2">
              <FontAwesome name="file-lines" className="text-base text-[#0A4174]" />
              Persyaratan &amp; Data yang Dibutuhkan untuk Autofill
            </h3>
            <div className="bg-[#BDD8E9]/15 border border-[#BDD8E9]/70 rounded-[14px] p-5">
              <p className="text-xs text-[#001D39] font-bold mb-3 uppercase tracking-wide">
                Persyaratan Umum Sektor {item.category}:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {[
                  'Nomor Induk Kependudukan (NIK) & Kartu Tanda Penduduk (KTP)',
                  'Nomor Kartu Keluarga (KK) yang masih berlaku',
                  'Nomor Pokok Wajib Pajak (NPWP jika dipersyaratkan)',
                  'Alamat email aktif & nomor HP terverifikasi',
                  'Berkas pasfoto digital & dokumen pendukung resmi',
                  'Data profil GovConnect yang telah terverifikasi',
                ].map((req) => (
                  <div key={req} className="flex items-start gap-2.5 text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-[#BDD8E9]/40">
                    <span className="text-emerald-600 font-bold shrink-0">✓</span>
                    <span>{req}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CTA Akses Portal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3">
            <a
              href={item.agency_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl bg-white text-[#0A4174] hover:bg-[#BDD8E9]/20 border border-[#BDD8E9]/80 font-semibold text-sm transition-all shadow-xs"
            >
              <FontAwesome name="globe" className="text-base" />
              <span>Website Portal Resmi</span>
            </a>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl bg-[#0A4174] text-white hover:bg-[#001D39] font-semibold text-sm transition-all shadow-xs"
            >
              <FontAwesome name="arrow-up-right-from-square" className="text-base" />
              <span>Akses Langsung Formulir Layanan</span>
            </a>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── LIST PAGE UTAMA ───────────────────────────────────────────
export function PublicServicesPage() {
  const [data, setData] = useState<PublicServicesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    try {
      const res = await publicServicesApi.get();
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch public services:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredAgendas = useMemo(() => {
    if (!data) return [];
    let filtered = data.agendas;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((a) => a.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.agency.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q),
      );
    }

    return filtered;
  }, [data, selectedCategory, searchQuery]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <FontAwesome name="spinner" className="w-8 h-8 text-[#0A4174] animate-spin" />
        <p className="text-[#49769F] text-sm font-medium">Memuat katalog layanan publik...</p>
      </div>
    );
  }

  if (!data) {
    return <EmptyState title="Gagal memuat data" description="Koneksi ke server terputus. Silakan coba beberapa saat lagi." />;
  }

  return (
    <div className="space-y-6 pb-12 w-full">
      {/* Header Halaman */}
      <div>
        <h1 className="text-[28px] leading-[36px] font-bold text-[#001D39] tracking-[-0.02em]">
          Portal Layanan Publik Terpadu
        </h1>
        <p className="text-[14px] leading-[22px] font-normal text-[#49769F] mt-1 max-w-3xl">
          Katalog resmi agenda, perizinan, dan portal administrasi kementerian &amp; lembaga negara Republik Indonesia yang terintegrasi dengan ekstensi autofill GovConnect.
        </p>
      </div>

      {/* Search & Counter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2 rounded-[14px] border border-[#BDD8E9]/70 shadow-[0_1px_3px_rgba(0,29,57,0.04)]">
        <div className="relative flex-1">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#49769F] text-sm pointer-events-none">
            <FontAwesome name="magnifying-glass" className="text-xs" />
          </div>
          <input
            type="text"
            placeholder="Cari nama layanan, instansi (DJP, BKN, Kemendikbud, BPJS...), atau kata kunci..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-8 text-[14px] bg-[#F6F8FB] border border-[#BDD8E9]/50 rounded-[10px] focus:bg-white focus:border-[#0A4174] focus:ring-3 focus:ring-[#7BBDE8]/25 text-[#001D39] placeholder:text-[#6EA2B3] outline-none transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs p-1 cursor-pointer"
              title="Hapus kata kunci"
            >
              <FontAwesome name="xmark" />
            </button>
          )}
        </div>
        <div className="text-[12.5px] font-medium text-[#49769F] px-2 sm:px-3 text-right shrink-0">
          Menampilkan <span className="font-bold text-[#001D39]">{filteredAgendas.length}</span> layanan
        </div>
      </div>

      {/* Kategori Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold transition-all whitespace-nowrap cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-[#0A4174] text-white shadow-xs'
              : 'bg-white text-[#49769F] border border-[#BDD8E9]/70 hover:border-[#7BBDE8] hover:text-[#001D39]'
          }`}
        >
          <FontAwesome name="layer-group" className="text-xs" />
          <span>Semua Sektor</span>
          <span className={`inline-flex items-center justify-center min-w-[20px] h-5 text-[11px] font-bold rounded-full px-1.5 ${
            selectedCategory === 'all' ? 'bg-white/20 text-white' : 'bg-[#BDD8E9]/30 text-[#0A4174]'
          }`}>
            {data.agendas.length}
          </span>
        </button>

        {data.categories.map((cat) => {
          const isAct = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold transition-all whitespace-nowrap cursor-pointer ${
                isAct
                  ? 'bg-[#0A4174] text-white shadow-xs'
                  : 'bg-white text-[#49769F] border border-[#BDD8E9]/70 hover:border-[#7BBDE8] hover:text-[#001D39]'
              }`}
            >
              <FontAwesome name={cat.icon || 'landmark'} className="text-xs" />
              <span>{cat.label}</span>
              <span className={`inline-flex items-center justify-center min-w-[20px] h-5 text-[11px] font-bold rounded-full px-1.5 ${
                isAct ? 'bg-white/20 text-white' : 'bg-[#BDD8E9]/30 text-[#0A4174]'
              }`}>
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid Kartu Layanan Publik Terstruktur */}
      {filteredAgendas.length === 0 ? (
        <EmptyState title="Tidak ada layanan yang sesuai" description="Coba ubah kata kunci pencarian atau pilih kategori sektor lain." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAgendas.map((item) => (
            <Link
              key={item.id}
              to={`/public-services/${item.id}`}
              className="group bg-white border border-[#BDD8E9]/70 hover:border-[#7BBDE8] rounded-[18px] p-5 shadow-[0_2px_8px_rgba(0,29,57,0.04)] hover:shadow-[0_10px_25px_rgba(0,29,57,0.09)] transition-all duration-200 flex flex-col justify-between cursor-pointer relative overflow-hidden"
            >
              <div>
                {/* Header Card: Logo Asli Resmi + Badges */}
                <div className="flex items-start gap-3.5">
                  <LogoDisplay src={item.logo_url} alt={item.agency} size="w-14 h-14" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#BDD8E9]/25 text-[#0A4174] border border-[#BDD8E9]/60 capitalize">
                        {item.category}
                      </span>
                      {formatImportance(item.importance)}
                    </div>
                    <h3 className="font-bold text-[15px] leading-[22px] text-[#001D39] group-hover:text-[#0A4174] transition-colors line-clamp-2 mt-1.5">
                      {item.title}
                    </h3>
                  </div>
                </div>

                {/* Nama Instansi Resmi */}
                <div className="flex items-center gap-1.5 text-[12.5px] font-medium text-[#49769F] mt-3 truncate">
                  <FontAwesome name="building-columns" className="text-xs text-[#6EA2B3] shrink-0" />
                  <span className="truncate">{item.agency}</span>
                </div>

                {/* Deskripsi Ringkas */}
                <p className="text-[13px] leading-[20px] text-slate-500 mt-2 line-clamp-2 font-normal">
                  {item.description}
                </p>
              </div>

              {/* Footer Terstruktur: Deadline & Aksi */}
              <div className="pt-3.5 mt-4 border-t border-[#BDD8E9]/40 flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#49769F] min-w-0">
                  <FontAwesome name="calendar-days" className="text-xs text-[#0A4174] shrink-0" />
                  <span className="truncate">{item.deadline || 'Sesuai jadwal'}</span>
                </div>

                <div className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#0A4174] group-hover:text-[#001D39] group-hover:translate-x-0.5 transition-all shrink-0">
                  <span>Detail</span>
                  <FontAwesome name="chevron-right" className="text-[10px]" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
