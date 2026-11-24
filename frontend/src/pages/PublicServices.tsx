import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { publicServicesApi, profileApi, type PublicServicesResponse, type PublicServiceAgenda, type Profile } from '../services/api';
import {
  Building2,
  Calendar,
  ArrowLeft,
  ExternalLink,
  Globe,
  CheckCircle2,
  AlertCircle,
  Layers,
  FileText,
  Sparkles,
  Search,
  X,
  ChevronRight,
  Users,
  CreditCard,
  User,
  Mail,
  Image as ImageIcon,
  GraduationCap,
  Receipt,
  MapPin,
  Key,
  Wallet,
  Phone,
  HeartPulse,
  Briefcase,
  Stamp,
  Landmark,
} from 'lucide-react';

// ─── MAPPING LOGO RESMI ASLI DARI INSTANSI PEMERINTAH ──────────
const AGENCY_LOGO_MAP: Record<string, string> = {
  'lpdp': '/logos/lpdp.png',
  'bkn': '/logos/bkn.png',
  'snpmb': '/logos/kemendikbud.svg',
  'ltmpt': '/logos/kemendikbud.svg',
  'kemendikbud': '/logos/kemendikbud.svg',
  'pendidikan': '/logos/kemendikbud.svg',
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
  'bpjs ketenagakerjaan': '/logos/bpjs-ketenagakerjaan.svg',
  'bpjs kesehatan': '/logos/bpjs.svg',
  'bpjs': '/logos/bpjs.svg',
  'kesehatan': '/logos/kemenkes.svg',
  'kemenkes': '/logos/kemenkes.svg',
  'pupr': '/logos/pupr.svg',
  'cipta karya': '/logos/pupr.svg',
  'pu': '/logos/pupr.svg',
  'korlantas': '/logos/polri.svg',
  'polri': '/logos/polri.svg',
  'kepolisian': '/logos/polri.svg',
  'kemensos': '/logos/kemensos.svg',
  'sosial': '/logos/kemensos.svg',
};

function resolveAgencyLogo(agency: string, rawSrc?: string): string {
  if (rawSrc && (rawSrc.endsWith('.png') || rawSrc.endsWith('.svg'))) {
    const cleanSrc = rawSrc.toLowerCase();
    if (cleanSrc.includes('lpdp')) return '/logos/lpdp.png';
    if (cleanSrc.includes('bkn')) return '/logos/bkn.png';
    if (cleanSrc.includes('bpjs-ketenagakerjaan') || cleanSrc.includes('bpjs-ker')) return '/logos/bpjs-ketenagakerjaan.svg';
    if (cleanSrc.includes('bpjs')) return '/logos/bpjs.svg';
    if (cleanSrc.includes('pajak') || cleanSrc.includes('djp')) return '/logos/pajak.svg';
    if (cleanSrc.includes('kemenkeu') || cleanSrc.includes('djpk') || cleanSrc.includes('kemkeu')) return '/logos/kemenkeu.svg';
    if (cleanSrc.includes('dukcapil') || cleanSrc.includes('kemendagri')) return '/logos/dukcapil.svg';
    if (cleanSrc.includes('imigrasi')) return '/logos/imigrasi.svg';
    if (cleanSrc.includes('bkpm') || cleanSrc.includes('oss')) return '/logos/bkpm.svg';
    if (cleanSrc.includes('pupr') || cleanSrc.includes('pu')) return '/logos/pupr.svg';
    if (cleanSrc.includes('polri')) return '/logos/polri.svg';
    if (cleanSrc.includes('kemenkes')) return '/logos/kemenkes.svg';
    if (cleanSrc.includes('kemensos')) return '/logos/kemensos.svg';
    if (cleanSrc.includes('kemendikbud') || cleanSrc.includes('ltmpt')) return '/logos/kemendikbud.svg';
    return rawSrc;
  }

  const clean = (agency || '').toLowerCase();
  for (const [key, path] of Object.entries(AGENCY_LOGO_MAP)) {
    if (clean.includes(key)) {
      return path;
    }
  }
  return '/logos/kemendikbud.svg';
}

function formatDeadlineText(deadline?: string, category?: string, title?: string): string {
  if (!deadline || deadline.toLowerCase().includes('varies')) {
    const t = (title || '').toLowerCase();
    if (t.includes('snmptn') || t.includes('sbmptn')) {
      return 'Februari – Maret 2026 (SNBP / SNBT)';
    }
    if (t.includes('casn') || t.includes('pppk')) {
      return 'Agustus – Oktober 2026 (Seleksi Nasional)';
    }
    if (t.includes('ppg')) {
      return 'Mei – Juli 2026 (Gelombang 1 & 2)';
    }
    if (t.includes('lpdp')) {
      return 'Tahap 1 (Februari) & Tahap 2 (Juli 2026)';
    }
    if (t.includes('kesehatan') || t.includes('puskesmas')) {
      return 'Senin – Sabtu (08.00 – 14.00 WIB) / UGD 24 Jam';
    }
    if (t.includes('pkh')) {
      return 'Penyaluran Triwulan (Tahap 1 – 4 2026)';
    }
    if (t.includes('kip') || t.includes('prakerja')) {
      return 'Gelombang Aktif Dibuka Setiap Bulan';
    }
    if (category === 'pendidikan') return 'Sesuai Kalender Akademik 2026';
    if (category === 'ekonomi') return 'Setiap Hari Kerja (Online 24 Jam)';
    return 'Aktif Berjalan (Sesuai Jam Operasional)';
  }
  return deadline;
}

// ─── SPESIFIKASI PERSYARATAN & KELENGKAPAN AUTOFILL ───────────
interface RequirementDetail {
  name: string;
  fieldCode: string;
  desc: string;
  IconComponent: typeof User;
}

function isFieldFilled(fieldCode: string, profile: Profile | null): boolean {
  if (!profile) return false;

  let docsMap: Record<string, unknown> = {};
  if (profile.document_photos) {
    try {
      docsMap = typeof profile.document_photos === 'string'
        ? JSON.parse(profile.document_photos)
        : profile.document_photos;
    } catch {
      docsMap = {};
    }
  }

  let customFieldsList: Array<{ key?: string; label?: string; value?: string; photoData?: string }> = [];
  if (profile.custom_fields) {
    try {
      const parsed = typeof profile.custom_fields === 'string'
        ? JSON.parse(profile.custom_fields)
        : profile.custom_fields;
      if (Array.isArray(parsed)) {
        customFieldsList = parsed;
      } else if (parsed && Array.isArray(parsed.fields)) {
        customFieldsList = parsed.fields;
      }
    } catch {
      customFieldsList = [];
    }
  }

  const hasCustomValue = (matchKey: string) => {
    const k = matchKey.toLowerCase();
    return customFieldsList.some(
      (f) =>
        (f.key && f.key.toLowerCase().includes(k) && (Boolean(f.value?.trim()) || Boolean(f.photoData))) ||
        (f.label && f.label.toLowerCase().includes(k) && (Boolean(f.value?.trim()) || Boolean(f.photoData)))
    );
  };

  const hasDoc = (matchKey: string) => {
    const k = matchKey.toLowerCase();
    return Object.keys(docsMap).some((key) => key.toLowerCase().includes(k) && Boolean((docsMap[key] as { data?: string })?.data || docsMap[key]));
  };

  const hasVal = (val: unknown) => (typeof val === 'string' ? val.trim().length > 0 : Boolean(val));

  const pAny = profile as unknown as Record<string, unknown>;

  switch (fieldCode) {
    case 'nik':
      return hasVal(profile.nik);
    case 'no_kk':
      return hasVal(pAny.no_kk) || hasVal(profile.father_name) || hasVal(profile.mother_name) || hasCustomValue('kk') || hasDoc('kk');
    case 'full_name_dob':
      return hasVal(profile.full_name) && hasVal(profile.birth_date);
    case 'contact':
      return hasVal(profile.email) || hasVal(profile.phone);
    case 'phone':
      return hasVal(profile.phone);
    case 'email':
      return hasVal(profile.email);
    case 'photo':
      return hasDoc('photo') || hasDoc('pasfoto') || hasDoc('foto') || hasDoc('ktp') || hasCustomValue('foto') || hasCustomValue('photo');
    case 'nisn':
      return hasVal(profile.nisn) || hasCustomValue('nisn');
    case 'npwp':
      return hasVal(profile.npwp) || hasCustomValue('npwp');
    case 'address':
    case 'full_address':
      return hasVal(profile.address);
    case 'efin':
      return hasCustomValue('efin') || hasVal(pAny.efin);
    case 'bank_account':
      return hasCustomValue('bank') || hasCustomValue('rekening') || hasVal(pAny.bank_account);
    case 'doc_scan':
      return Object.keys(docsMap).length > 0 || hasCustomValue('dokumen');
    case 'no_bpjs':
      return hasVal(profile.bpjs_number) || hasCustomValue('bpjs');
    case 'fktp':
      return hasCustomValue('fktp') || hasCustomValue('puskesmas') || hasCustomValue('klinik') || hasVal(pAny.fktp);
    case 'autodebet':
      return hasCustomValue('autodebet') || hasCustomValue('rekening') || hasCustomValue('bank') || hasVal(pAny.autodebet);
    case 'nib':
      return hasCustomValue('nib') || hasVal(pAny.nib);
    case 'kbli':
      return hasCustomValue('kbli') || hasVal(profile.occupation);
    case 'business_location':
      return hasVal(profile.work_address) || hasVal(profile.address);
    case 'env_doc':
      return hasCustomValue('sppl') || hasCustomValue('lingkungan') || hasCustomValue('amdal') || hasDoc('sppl') || hasDoc('env');
    case 'kks_number':
      return hasCustomValue('kks') || hasVal(pAny.kks_number);
    case 'home_photo':
      return hasDoc('rumah') || hasDoc('home') || hasDoc('bangunan') || hasCustomValue('rumah');
    default:
      return hasVal(pAny[fieldCode]) || hasCustomValue(fieldCode);
  }
}

const SECTOR_REQUIREMENTS_MAP: Record<string, RequirementDetail[]> = {
  pendidikan: [
    {
      name: 'Nomor Induk Kependudukan (NIK)',
      fieldCode: 'nik',
      desc: 'Validasi identitas pendaftar terintegrasi langsung dengan database kependudukan Ditjen Dukcapil.',
      IconComponent: CreditCard,
    },
    {
      name: 'Nomor Kartu Keluarga (KK)',
      fieldCode: 'no_kk',
      desc: 'Verifikasi susunan keluarga, hubungan perwalian, dan domisili pendaftar seleksi perguruan tinggi.',
      IconComponent: Users,
    },
    {
      name: 'Nama Lengkap & Tanggal Lahir',
      fieldCode: 'full_name_dob',
      desc: 'Pencocokan data ijazah nasional, akun SNPMB, dan database Dapodik Kemendikbudristek.',
      IconComponent: User,
    },
    {
      name: 'Email Aktif & Nomor WhatsApp',
      fieldCode: 'contact',
      desc: 'Penerimaan token autentikasi 2FA, jadwal ujian UTBK, dan pengumuman seleksi.',
      IconComponent: Mail,
    },
    {
      name: 'Pasfoto Digital Resmi (JPG/PNG)',
      fieldCode: 'photo',
      desc: 'Pasfoto formal ukuran 4x6 latar belakang polos terstandar untuk pencetakan kartu peserta ujian.',
      IconComponent: ImageIcon,
    },
    {
      name: 'NISN / NPSN Sekolah Asal',
      fieldCode: 'nisn',
      desc: 'Sinkronisasi riwayat nilai rapor dan akreditasi sekolah asal dari Pusat Data & Informasi (Pusdatin).',
      IconComponent: GraduationCap,
    },
  ],
  ekonomi: [
    {
      name: 'Nomor Pokok Wajib Pajak (NPWP 16 Digit)',
      fieldCode: 'npwp',
      desc: 'Identitas perpajakan 16 digit terintegrasi NIK untuk autentikasi sistem CoreTax dan DJP Online.',
      IconComponent: Receipt,
    },
    {
      name: 'Nomor Induk Kependudukan (NIK KTP)',
      fieldCode: 'nik',
      desc: 'Autentikasi pemotong pajak atau penanggung jawab SPT Masa / Tahunan secara realtime ke DJP.',
      IconComponent: CreditCard,
    },
    {
      name: 'Alamat Domisili & Kode Pos KPP',
      fieldCode: 'address',
      desc: 'Penentuan yurisdiksi Kantor Pelayanan Pajak (KPP) Pratama dan korespondensi resmi.',
      IconComponent: MapPin,
    },
    {
      name: 'Email & Nomor HP Terverifikasi',
      fieldCode: 'contact',
      desc: 'Penerimaan kode verifikasi token SMS/Email dan Bukti Penerimaan Elektronik (BPE) resmi.',
      IconComponent: Mail,
    },
    {
      name: 'Kode Otorisasi EFIN / Sertifikat Elektronik',
      fieldCode: 'efin',
      desc: 'Kunci enkripsi penandatanganan dokumen pelaporan elektronik dan e-Filing DJP.',
      IconComponent: Key,
    },
    {
      name: 'Nomor Rekening Bank Terdaftar',
      fieldCode: 'bank_account',
      desc: 'Rekening bank atas nama Wajib Pajak untuk keperluan restitusi / pengembalian kelebihan bayar pajak.',
      IconComponent: Wallet,
    },
  ],
  administrasi: [
    {
      name: 'Nomor Induk Kependudukan (NIK)',
      fieldCode: 'nik',
      desc: 'Kunci induk database kependudukan nasional untuk penerbitan berkas resmi Disdukcapil.',
      IconComponent: CreditCard,
    },
    {
      name: 'Nomor Kartu Keluarga (KK)',
      fieldCode: 'no_kk',
      desc: 'Verifikasi status kepala keluarga dan anggota dalam database SIAK Kemendagri.',
      IconComponent: Users,
    },
    {
      name: 'Alamat Domisili Lengkap (RT/RW, Desa/Kel)',
      fieldCode: 'full_address',
      desc: 'Pencetakan alamat domisili resmi pada dokumen KTP-El, KK baru, atau surat pindah.',
      IconComponent: MapPin,
    },
    {
      name: 'Nomor HP & WhatsApp Aktif',
      fieldCode: 'phone',
      desc: 'Penerimaan notifikasi SMS jadwal pengambilan blangko fisik atau barcode verifikasi berkas.',
      IconComponent: Phone,
    },
    {
      name: 'Alamat Email Terdaftar BSrE',
      fieldCode: 'email',
      desc: 'Pengiriman salinan berkas digital resmi dengan Tanda Tangan Elektronik (TTE) Balai Sertifikasi Elektronik.',
      IconComponent: Mail,
    },
    {
      name: 'Berkas Dokumen Pendukung (PDF/JPG)',
      fieldCode: 'doc_scan',
      desc: 'Unggah berkas akta lahir, buku nikah, atau surat keterangan pengantar RT/RW dalam format terstandar.',
      IconComponent: FileText,
    },
  ],
  kesehatan: [
    {
      name: 'Nomor Kartu BPJS Kesehatan / KIS',
      fieldCode: 'no_bpjs',
      desc: 'Nomor identitas kepesertaan jaminan kesehatan nasional terintegrasi fasilitas kesehatan se-Indonesia.',
      IconComponent: HeartPulse,
    },
    {
      name: 'Nomor Induk Kependudukan (NIK KTP)',
      fieldCode: 'nik',
      desc: 'Pengecekan keaktifan kepesertaan melalui bridging system BPJS Kesehatan dengan Dukcapil.',
      IconComponent: CreditCard,
    },
    {
      name: 'Nomor Kartu Keluarga (KK)',
      fieldCode: 'no_kk',
      desc: 'Pendaftaran anggota keluarga dalam satu tanggungan premi iuran bulanan jaminan sosial.',
      IconComponent: Users,
    },
    {
      name: 'Fasilitas Kesehatan Tingkat 1 (FKTP)',
      fieldCode: 'fktp',
      desc: 'Puskesmas atau klinik dokter keluarga terdaftar sebagai rujukan fasilitas pelayanan primer peserta.',
      IconComponent: Building2,
    },
    {
      name: 'Nomor HP & WhatsApp Aktif',
      fieldCode: 'phone',
      desc: 'Pengambilan nomor antrean online melalui Mobile JKN dan pengingat skrining kesehatan berkala.',
      IconComponent: Phone,
    },
    {
      name: 'Rekening Autodebet Iuran',
      fieldCode: 'autodebet',
      desc: 'Informasi rekening bank Himbara atau dompet digital untuk pembayaran iuran bulanan peserta mandiri.',
      IconComponent: CreditCard,
    },
  ],
  perizinan: [
    {
      name: 'Nomor Induk Berusaha (NIB OSS RBA)',
      fieldCode: 'nib',
      desc: 'Identitas legalitas usaha tunggal terintegrasi perizinan berbasis risiko Kementerian Investasi/BKPM.',
      IconComponent: Briefcase,
    },
    {
      name: 'Nomor Induk Kependudukan (NIK Pemohon)',
      fieldCode: 'nik',
      desc: 'Validasi pemohon, penanggung jawab badan usaha, atau direksi sesuai akta notaris Kemenkumham.',
      IconComponent: CreditCard,
    },
    {
      name: 'Nomor Pokok Wajib Pajak (NPWP Usaha/Pribadi)',
      fieldCode: 'npwp',
      desc: 'Konfirmasi Status Wajib Pajak (KSWP) aktif sebagai syarat penerbitan izin berusaha.',
      IconComponent: Receipt,
    },
    {
      name: 'Klasifikasi Baku Lapangan Usaha (KBLI)',
      fieldCode: 'kbli',
      desc: 'Kode 5 digit klasifikasi kegiatan usaha resmi untuk menentukan tingkat risiko dan sertifikasi teknis.',
      IconComponent: FileText,
    },
    {
      name: 'Alamat Lokasi & Titik Koordinat Usaha',
      fieldCode: 'business_location',
      desc: 'Kesesuaian Kegiatan Pemanfaatan Ruang (KKPR) dan Persetujuan Bangunan Gedung (PBG) di lokasi usaha.',
      IconComponent: MapPin,
    },
    {
      name: 'Dokumen Persetujuan Lingkungan / SPPL',
      fieldCode: 'env_doc',
      desc: 'Surat Pernyataan Kesanggupan Pengelolaan dan Pemantauan Lingkungan Hidup sesuai regulasi daerah.',
      IconComponent: Stamp,
    },
  ],
  sosial: [
    {
      name: 'Nomor Induk Kependudukan (NIK Terdaftar DTKS)',
      fieldCode: 'nik',
      desc: 'Pengecekan integrasi NIK dengan Data Terpadu Kesejahteraan Sosial (DTKS) Kementerian Sosial.',
      IconComponent: CreditCard,
    },
    {
      name: 'Nomor Kartu Keluarga (KK)',
      fieldCode: 'no_kk',
      desc: 'Verifikasi komposisi keluarga, jumlah tanggungan anak sekolah, lansia, dan penyandang disabilitas.',
      IconComponent: Users,
    },
    {
      name: 'Alamat Domisili Sesuai Wilayah DTKS',
      fieldCode: 'address',
      desc: 'Penyaluran bantuan oleh petugas pendamping sosial dan verifikasi musyawarah kelurahan/desa.',
      IconComponent: MapPin,
    },
    {
      name: 'Nomor Kartu Keluarga Sejahtera (KKS / KIP)',
      fieldCode: 'kks_number',
      desc: 'Kartu debit kombo bansos untuk pencairan bantuan tunai program PKH, BPNT, atau KIP Kuliah.',
      IconComponent: CreditCard,
    },
    {
      name: 'Nomor Telepon Pendamping / Keluarga',
      fieldCode: 'phone',
      desc: 'Penyampaian informasi jadwal penyaluran di kantor pos/e-warong dan pertemuan kelompok berkala.',
      IconComponent: Phone,
    },
    {
      name: 'Foto Kondisi Rumah / Tempat Tinggal',
      fieldCode: 'home_photo',
      desc: 'Dokumentasi verifikasi faktual kelayakan penerima bantuan sosial berbasis geospasial.',
      IconComponent: ImageIcon,
    },
  ],
};

// ─── KOMPONEN LOGO ASLI INSTANSI ──────────────────────────────
function LogoDisplay({ src, alt, size = 'w-12 h-12' }: { src?: string; alt: string; size?: string }) {
  const [hasError, setHasError] = useState(false);
  const targetLogo = resolveAgencyLogo(alt, src);

  if (hasError) {
    return (
      <div className={`shrink-0 ${size} flex items-center justify-center rounded-xl border border-line bg-surface-2 text-ink-3`}>
        <Landmark className="w-5 h-5" strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <div className={`shrink-0 ${size} flex items-center justify-center rounded-xl border border-line bg-surface-2 p-2`}>
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
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      publicServicesApi.get().then((res) => setData(res.data)).catch(() => {}),
      profileApi.get().then((res) => setProfile(res.data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const item: PublicServiceAgenda | null = useMemo(() => {
    if (!data || !id) return null;
    return data.agendas.find((a) => a.id === Number(id)) || null;
  }, [data, id]);

  const requirements = useMemo(() => {
    if (!item) return [];
    return SECTOR_REQUIREMENTS_MAP[item.category] || SECTOR_REQUIREMENTS_MAP.administrasi;
  }, [item]);

  if (loading) {
    return (
      <div className="page max-w-6xl mx-auto w-full space-y-6 pb-16">
        <div className="h-5 w-44 bg-surface-2 rounded-lg animate-pulse" />
        <div className="p-8 rounded-[24px] border border-line bg-surface space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-surface-2 rounded-2xl animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-6 w-2/3 bg-surface-2 rounded-lg animate-pulse" />
              <div className="h-4 w-1/3 bg-surface-2 rounded-lg animate-pulse" />
            </div>
          </div>
          <div className="h-4 w-full bg-surface-2 rounded-lg animate-pulse" />
          <div className="h-4 w-5/6 bg-surface-2 rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="page max-w-6xl mx-auto py-16 text-center space-y-4">
        <Landmark className="w-12 h-12 text-ink-3 mx-auto opacity-50" strokeWidth={1.5} />
        <h2 className="text-xl font-bold text-ink">Layanan Tidak Ditemukan</h2>
        <p className="text-xs text-ink-3">Layanan yang Anda cari tidak tersedia atau telah dipindahkan.</p>
        <Link
          to="/public-services"
          className="inline-flex items-center gap-2 text-xs font-semibold text-accent-text hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Katalog Layanan Publik</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="page max-w-6xl mx-auto w-full pb-16 space-y-6 page-enter">
      {/* Back button */}
      <Link
        to="/public-services"
        className="inline-flex items-center gap-2 text-xs font-semibold text-ink-2 hover:text-ink transition-colors self-start"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Kembali ke Katalog Layanan Publik</span>
      </Link>

      <div className="rounded-[24px] border border-line bg-surface shadow-xs overflow-hidden">
        {/* Header Hero */}
        <div className="p-6 md:p-8 border-b border-line bg-surface-2">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <LogoDisplay src={item.logo_url} alt={item.agency} size="w-16 h-16 sm:w-20 sm:h-20" />
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">
                  {item.title}
                </h1>
                <p className="text-xs text-ink-3 font-medium mt-1 flex items-center gap-1.5 truncate">
                  <Building2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{item.agency}</span>
                </p>
              </div>
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-blue-500/10 text-accent-text border border-blue-500/20 shrink-0 self-start">
              Sektor {item.category}
            </span>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 md:p-8 space-y-8">
          {/* 3-Column Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-line bg-surface-2 space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-3 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>Sektor Layanan</span>
              </p>
              <p className="text-xs font-bold text-ink capitalize">
                {item.category}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-line bg-surface-2 space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-3 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Jadwal &amp; Periode</span>
              </p>
              <p className="text-xs font-bold text-ink">
                {formatDeadlineText(item.deadline, item.category, item.title)}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-line bg-surface-2 space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-3 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                <span>Instansi Penyelenggara</span>
              </p>
              <p className="text-xs font-bold text-ink truncate">
                {item.agency}
              </p>
            </div>
          </div>

          {/* Deskripsi */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-3">
              Deskripsi Layanan Resmi
            </h3>
            <p className="text-xs text-ink-2 leading-relaxed p-4 rounded-xl border border-line bg-surface-2">
              {item.description}
            </p>
          </div>

          {/* Persyaratan & Kelengkapan Data */}
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-ink">
                Persyaratan &amp; Status Kesiapan Autofill
              </h3>
              <p className="text-xs text-ink-3 mt-0.5">
                Evaluasi otomatis kesiapan kolom data profil Anda untuk pengisian formulir {item.agency}.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {requirements.map(req => {
                const filled = isFieldFilled(req.fieldCode, profile);
                const IconComp = req.IconComponent;

                return (
                  <div
                    key={req.fieldCode}
                    className="p-4 rounded-2xl border border-line bg-surface hover:border-blue-500/40 transition-colors flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <IconComp className="w-4 h-4 text-ink-3 shrink-0" strokeWidth={1.5} />
                          <h4 className="text-xs font-bold text-ink truncate">
                            {req.name}
                          </h4>
                        </div>

                        {filled ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Terisi</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
                            <AlertCircle className="w-3 h-3" />
                            <span>Perlu Ditinjau</span>
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-ink-3 leading-relaxed mt-2">
                        {req.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CTA Akses Portal Resmi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-line">
            <a
              href={item.agency_url}
              target="_blank"
              rel="noopener noreferrer"
              className="h-12 px-5 rounded-xl border border-line bg-surface hover:bg-surface-2 text-ink font-semibold text-xs inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Globe className="w-4 h-4 text-ink-3" />
              <span>Website Portal Resmi</span>
            </a>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="h-12 px-5 rounded-xl bg-accent hover:bg-accent-hover text-accent-fg font-semibold text-xs inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Buka Formulir Layanan (Aktifkan Asisten)</span>
            </a>
          </div>
        </div>
      </div>
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
    return data.agendas.filter(a => {
      const matchCat = selectedCategory === 'all' || a.category === selectedCategory;
      if (!matchCat) return false;
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      return (
        a.title.toLowerCase().includes(q) ||
        a.agency.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q)
      );
    });
  }, [data, selectedCategory, searchQuery]);

  if (loading) {
    return (
      <div className="page max-w-7xl mx-auto space-y-6 pb-16">
        <div className="space-y-2">
          <div className="h-8 w-72 bg-surface-2 rounded-xl animate-pulse" />
          <div className="h-4 w-96 bg-surface-2 rounded-lg animate-pulse" />
        </div>
        <div className="h-10 w-full max-w-md bg-surface-2 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-48 rounded-[20px] bg-surface-2 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page max-w-7xl mx-auto py-16 text-center space-y-3">
        <Landmark className="w-12 h-12 text-ink-3 mx-auto opacity-50" strokeWidth={1.5} />
        <h2 className="text-lg font-bold text-ink">Gagal Memuat Data Layanan</h2>
        <p className="text-xs text-ink-3">Koneksi ke server terputus. Silakan periksa koneksi lalu coba kembali.</p>
        <button
          type="button"
          onClick={fetchData}
          className="h-10 px-4 rounded-xl bg-accent text-accent-fg text-xs font-semibold"
        >
          Muat Ulang
        </button>
      </div>
    );
  }

  return (
    <div className="page page-enter max-w-7xl mx-auto space-y-8 pb-16">
      {/* ── Page Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2 border-b border-line">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-400 text-xs font-semibold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Katalog Resmi Republik Indonesia</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink">
            Portal Layanan Publik Terpadu
          </h1>
          <p className="text-base text-ink-2 max-w-3xl leading-relaxed">
            Katalog resmi agenda, perizinan, dan portal administrasi kementerian &amp; lembaga negara yang terintegrasi dengan ekstensi autofill GovConnect.
          </p>
        </div>
      </div>

      {/* ── Filter Bar & Search ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Category Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 max-w-full">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`h-10 px-3.5 rounded-xl border text-xs font-medium inline-flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'border-blue-500/40 bg-blue-500/10 text-accent-text font-semibold shadow-xs'
                : 'border-line bg-surface text-ink-2 hover:bg-surface-2 hover:text-ink'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Semua Sektor</span>
            <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${
              selectedCategory === 'all' ? 'bg-blue-500/20 text-accent-text font-bold' : 'bg-surface-3 text-ink-3'
            }`}>
              {data.agendas.length}
            </span>
          </button>

          {data.categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`h-10 px-3.5 rounded-xl border text-xs font-medium inline-flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'border-blue-500/40 bg-blue-500/10 text-accent-text font-semibold shadow-xs'
                    : 'border-line bg-surface text-ink-2 hover:bg-surface-2 hover:text-ink'
                }`}
              >
                <span>{cat.label}</span>
                <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-blue-500/20 text-accent-text font-bold' : 'bg-surface-3 text-ink-3'
                }`}>
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72 shrink-0">
          <Search className="w-4 h-4 text-ink-3 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari portal atau instansi..."
            className="w-full h-10 pl-10 pr-9 rounded-xl border border-line bg-surface text-xs text-ink placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── Grid of Services ── */}
      {filteredAgendas.length === 0 ? (
        <div className="p-12 text-center rounded-[20px] border border-line bg-surface space-y-3">
          <Landmark className="w-10 h-10 text-ink-3 mx-auto opacity-50" strokeWidth={1.5} />
          <h3 className="text-base font-semibold text-ink">Tidak Ada Layanan Ditemukan</h3>
          <p className="text-xs text-ink-3 max-w-sm mx-auto">
            Tidak ditemukan agenda atau portal yang cocok dengan &quot;{searchQuery}&quot;. Silakan coba kata kunci lain.
          </p>
          <button
            type="button"
            onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
            className="h-9 px-4 rounded-xl border border-line bg-surface-2 text-xs font-semibold text-ink hover:bg-surface-3 transition-colors mt-2"
          >
            Reset Filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAgendas.map((item) => (
            <Link
              key={item.id}
              to={`/public-services/${item.id}`}
              className="group rounded-[20px] border border-line bg-surface hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-200 flex flex-col justify-between overflow-hidden p-5 space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <LogoDisplay src={item.logo_url} alt={item.agency} size="w-12 h-12" />
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-ink group-hover:text-accent-text transition-colors line-clamp-2">
                        {item.title}
                      </h3>
                      <p className="text-xs text-ink-3 truncate mt-0.5">
                        {item.agency}
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10.5px] font-semibold uppercase tracking-wider bg-surface-2 border border-line text-ink-3 shrink-0">
                    {item.category}
                  </span>
                </div>

                <p className="text-xs text-ink-2 leading-relaxed line-clamp-2 min-h-[34px]">
                  {item.description}
                </p>
              </div>

              <div className="pt-3 border-t border-line flex items-center justify-between text-xs">
                <span className="text-[11px] text-ink-3 font-medium truncate max-w-[200px]">
                  {formatDeadlineText(item.deadline, item.category, item.title)}
                </span>
                <span className="text-xs font-semibold text-accent-text group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
                  <span>Detail</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default PublicServicesPage;
