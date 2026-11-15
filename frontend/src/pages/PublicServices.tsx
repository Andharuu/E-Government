import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { publicServicesApi, profileApi, type PublicServicesResponse, type PublicServiceAgenda, type Profile } from '../services/api';
import { Card, EmptyState, Badge, FontAwesome } from '../components/ui';

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

// Format jadwal & periode tanpa kata 'varies', menggunakan data operasional resmi Indonesia
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
  icon: string;
}

function isFieldFilled(fieldCode: string, profile: Profile | null): boolean {
  if (!profile) return false;

  let docsMap: Record<string, any> = {};
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
    return Object.keys(docsMap).some((key) => key.toLowerCase().includes(k) && Boolean(docsMap[key]?.data || docsMap[key]));
  };

  const hasVal = (val: any) => (typeof val === 'string' ? val.trim().length > 0 : Boolean(val));

  switch (fieldCode) {
    case 'nik':
      return hasVal(profile.nik);
    case 'no_kk':
      return hasVal((profile as any).no_kk) || hasVal(profile.father_name) || hasVal(profile.mother_name) || hasCustomValue('kk') || hasDoc('kk');
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
      return hasCustomValue('efin') || hasVal((profile as any).efin);
    case 'bank_account':
      return hasCustomValue('bank') || hasCustomValue('rekening') || hasVal((profile as any).bank_account);
    case 'doc_scan':
      return Object.keys(docsMap).length > 0 || hasCustomValue('dokumen');
    case 'no_bpjs':
      return hasVal(profile.bpjs_number) || hasCustomValue('bpjs');
    case 'fktp':
      return hasCustomValue('fktp') || hasCustomValue('puskesmas') || hasCustomValue('klinik') || hasVal((profile as any).fktp);
    case 'autodebet':
      return hasCustomValue('autodebet') || hasCustomValue('rekening') || hasCustomValue('bank') || hasVal((profile as any).autodebet);
    case 'nib':
      return hasCustomValue('nib') || hasVal((profile as any).nib);
    case 'kbli':
      return hasCustomValue('kbli') || hasVal(profile.occupation);
    case 'business_location':
      return hasVal(profile.work_address) || hasVal(profile.address);
    case 'env_doc':
      return hasCustomValue('sppl') || hasCustomValue('lingkungan') || hasCustomValue('amdal') || hasDoc('sppl') || hasDoc('env');
    case 'kks_number':
      return hasCustomValue('kks') || hasVal((profile as any).kks_number);
    case 'home_photo':
      return hasDoc('rumah') || hasDoc('home') || hasDoc('bangunan') || hasCustomValue('rumah');
    default:
      return hasVal((profile as any)[fieldCode]) || hasCustomValue(fieldCode);
  }
}

const SECTOR_REQUIREMENTS_MAP: Record<string, RequirementDetail[]> = {
  pendidikan: [
    {
      name: 'Nomor Induk Kependudukan (NIK)',
      fieldCode: 'nik',
      desc: 'Validasi identitas pendaftar terintegrasi langsung dengan database kependudukan Ditjen Dukcapil.',
      icon: 'id-card',
    },
    {
      name: 'Nomor Kartu Keluarga (KK)',
      fieldCode: 'no_kk',
      desc: 'Verifikasi susunan keluarga, hubungan perwalian, dan domisili pendaftar seleksi perguruan tinggi.',
      icon: 'users',
    },
    {
      name: 'Nama Lengkap & Tanggal Lahir',
      fieldCode: 'full_name_dob',
      desc: 'Pencocokan data ijazah nasional, akun SNPMB, dan database Dapodik Kemendikbudristek.',
      icon: 'user',
    },
    {
      name: 'Email Aktif & Nomor WhatsApp',
      fieldCode: 'contact',
      desc: 'Penerimaan token autentikasi 2FA, jadwal ujian berbasis komputer (UTBK), dan status kelulusan.',
      icon: 'envelope',
    },
    {
      name: 'Pasfoto Digital Resmi (JPG/PNG)',
      fieldCode: 'photo',
      desc: 'Pasfoto formal ukuran 4x6 latar belakang polos terstandar untuk pencetakan kartu peserta ujian.',
      icon: 'image',
    },
    {
      name: 'NISN / NPSN Sekolah Asal',
      fieldCode: 'nisn',
      desc: 'Sinkronisasi riwayat nilai rapor dan akreditasi sekolah asal dari Pusat Data & Informasi (Pusdatin).',
      icon: 'graduation-cap',
    },
  ],
  ekonomi: [
    {
      name: 'Nomor Pokok Wajib Pajak (NPWP 16 Digit)',
      fieldCode: 'npwp',
      desc: 'Identitas perpajakan 16 digit terintegrasi NIK untuk autentikasi sistem CoreTax dan DJP Online.',
      icon: 'file-invoice-dollar',
    },
    {
      name: 'Nomor Induk Kependudukan (NIK KTP)',
      fieldCode: 'nik',
      desc: 'Autentikasi pemotong pajak atau penanggung jawab SPT Masa / Tahunan secara realtime ke DJP.',
      icon: 'id-card',
    },
    {
      name: 'Alamat Domisili & Kode Pos KPP',
      fieldCode: 'address',
      desc: 'Penentuan yurisdiksi Kantor Pelayanan Pajak (KPP) Pratama dan korespondensi surat ketetapan pajak.',
      icon: 'map-pin',
    },
    {
      name: 'Email & Nomor HP Terverifikasi',
      fieldCode: 'contact',
      desc: 'Penerimaan kode verifikasi token SMS/Email dan Bukti Penerimaan Elektronik (BPE) resmi.',
      icon: 'envelope',
    },
    {
      name: 'Kode Otorisasi EFIN / Sertifikat Elektronik',
      fieldCode: 'efin',
      desc: 'Kunci enkripsi penandatanganan dokumen pelaporan elektronik dan e-Filing DJP.',
      icon: 'key',
    },
    {
      name: 'Nomor Rekening Bank Terdaftar',
      fieldCode: 'bank_account',
      desc: 'Rekening bank atas nama Wajib Pajak untuk keperluan restitusi / pengembalian kelebihan bayar pajak.',
      icon: 'wallet',
    },
  ],
  administrasi: [
    {
      name: 'Nomor Induk Kependudukan (NIK)',
      fieldCode: 'nik',
      desc: 'Kunci induk database kependudukan nasional untuk penerbitan berkas resmi Disdukcapil.',
      icon: 'id-card',
    },
    {
      name: 'Nomor Kartu Keluarga (KK)',
      fieldCode: 'no_kk',
      desc: 'Verifikasi status kepala keluarga dan anggota dalam database Sistem Informasi Administrasi Kependudukan (SIAK).',
      icon: 'users',
    },
    {
      name: 'Alamat Domisili Lengkap (RT/RW, Desa/Kel)',
      fieldCode: 'full_address',
      desc: 'Pencetakan alamat domisili resmi pada dokumen KTP-El, KK baru, atau surat pindah.',
      icon: 'map-pin',
    },
    {
      name: 'Nomor HP & WhatsApp Aktif',
      fieldCode: 'phone',
      desc: 'Penerimaan notifikasi SMS jadwal pengambilan blangko fisik atau barcode verifikasi berkas.',
      icon: 'phone',
    },
    {
      name: 'Alamat Email Terdaftar BSrE',
      fieldCode: 'email',
      desc: 'Pengiriman salinan berkas digital resmi dengan Tanda Tangan Elektronik (TTE) Balai Sertifikasi Elektronik.',
      icon: 'envelope',
    },
    {
      name: 'Berkas Dokumen Pendukung (PDF/JPG)',
      fieldCode: 'doc_scan',
      desc: 'Unggah berkas akta lahir, buku nikah, atau surat keterangan pengantar RT/RW dalam format terstandar.',
      icon: 'file-lines',
    },
  ],
  kesehatan: [
    {
      name: 'Nomor Kartu BPJS Kesehatan / KIS',
      fieldCode: 'no_bpjs',
      desc: 'Nomor identitas kepesertaan jaminan kesehatan nasional terintegrasi fasilitas kesehatan se-Indonesia.',
      icon: 'heart-pulse',
    },
    {
      name: 'Nomor Induk Kependudukan (NIK KTP)',
      fieldCode: 'nik',
      desc: 'Pengecekan keaktifan kepesertaan melalui bridging system BPJS Kesehatan dengan Dukcapil.',
      icon: 'id-card',
    },
    {
      name: 'Nomor Kartu Keluarga (KK)',
      fieldCode: 'no_kk',
      desc: 'Pendaftaran anggota keluarga dalam satu tanggungan premi iuran bulanan jaminan sosial.',
      icon: 'users',
    },
    {
      name: 'Fasilitas Kesehatan Tingkat 1 (FKTP)',
      fieldCode: 'fktp',
      desc: 'Puskesmas atau klinik dokter keluarga terdaftar sebagai rujukan fasilitas pelayanan primer peserta.',
      icon: 'hospital',
    },
    {
      name: 'Nomor HP & WhatsApp Aktif',
      fieldCode: 'phone',
      desc: 'Pengambilan nomor antrean online melalui Mobile JKN dan pengingat skrining kesehatan berkala.',
      icon: 'phone',
    },
    {
      name: 'Rekening Autodebet Iuran',
      fieldCode: 'autodebet',
      desc: 'Informasi rekening bank Himbara atau dompet digital untuk pembayaran iuran bulanan peserta mandiri.',
      icon: 'credit-card',
    },
  ],
  perizinan: [
    {
      name: 'Nomor Induk Berusaha (NIB OSS RBA)',
      fieldCode: 'nib',
      desc: 'Identitas legalitas usaha tunggal terintegrasi perizinan berbasis risiko Kementerian Investasi/BKPM.',
      icon: 'briefcase',
    },
    {
      name: 'Nomor Induk Kependudukan (NIK Pemohon)',
      fieldCode: 'nik',
      desc: 'Validasi pemohon, penanggung jawab badan usaha, atau direksi sesuai akta notaris Kemenkumham.',
      icon: 'id-card',
    },
    {
      name: 'Nomor Pokok Wajib Pajak (NPWP Usaha/Pribadi)',
      fieldCode: 'npwp',
      desc: 'Konfirmasi Status Wajib Pajak (KSWP) aktif sebagai syarat penerbitan izin berusaha.',
      icon: 'file-invoice-dollar',
    },
    {
      name: 'Klasifikasi Baku Lapangan Usaha (KBLI)',
      fieldCode: 'kbli',
      desc: 'Kode 5 digit klasifikasi kegiatan usaha resmi untuk menentukan tingkat risiko dan sertifikasi teknis.',
      icon: 'file-contract',
    },
    {
      name: 'Alamat Lokasi & Titik Koordinat Usaha',
      fieldCode: 'business_location',
      desc: 'Kesesuaian Kegiatan Pemanfaatan Ruang (KKPR) dan Persetujuan Bangunan Gedung (PBG) di lokasi usaha.',
      icon: 'map-pin',
    },
    {
      name: 'Dokumen Persetujuan Lingkungan / SPPL',
      fieldCode: 'env_doc',
      desc: 'Surat Pernyataan Kesanggupan Pengelolaan dan Pemantauan Lingkungan Hidup sesuai regulasi daerah.',
      icon: 'stamp',
    },
  ],
  sosial: [
    {
      name: 'Nomor Induk Kependudukan (NIK Terdaftar DTKS)',
      fieldCode: 'nik',
      desc: 'Pengecekan integrasi NIK dengan Data Terpadu Kesejahteraan Sosial (DTKS) Kementerian Sosial.',
      icon: 'id-card',
    },
    {
      name: 'Nomor Kartu Keluarga (KK)',
      fieldCode: 'no_kk',
      desc: 'Verifikasi komposisi keluarga, jumlah tanggungan anak sekolah, lansia, dan penyandang disabilitas.',
      icon: 'users',
    },
    {
      name: 'Alamat Domisili Sesuai Wilayah DTKS',
      fieldCode: 'address',
      desc: 'Penyaluran bantuan oleh petugas pendamping sosial dan verifikasi musyawarah kelurahan/desa.',
      icon: 'map-pin',
    },
    {
      name: 'Nomor Kartu Keluarga Sejahtera (KKS / KIP)',
      fieldCode: 'kks_number',
      desc: 'Kartu debit kombo bansos untuk pencairan bantuan tunai program PKH, BPNT, atau KIP Kuliah.',
      icon: 'credit-card',
    },
    {
      name: 'Nomor Telepon Pendamping / Keluarga',
      fieldCode: 'phone',
      desc: 'Penyampaian informasi jadwal penyaluran di kantor pos/e-warong dan pertemuan kelompok berkala.',
      icon: 'phone',
    },
    {
      name: 'Foto Kondisi Rumah / Tempat Tinggal',
      fieldCode: 'home_photo',
      desc: 'Dokumentasi verifikasi faktual kelayakan penerima bantuan sosial berbasis geospasial.',
      icon: 'image',
    },
  ],
};

// ─── KOMPONEN LOGO ASLI DARI INSTANSI ─────────────────────────
function LogoDisplay({ src, alt, size = 'w-11 h-11' }: { src?: string; alt: string; size?: string }) {
  const [hasError, setHasError] = useState(false);
  const targetLogo = resolveAgencyLogo(alt, src);

  if (hasError) {
    return (
      <div className={`shrink-0 ${size} flex items-center justify-center rounded-md border border-line bg-surface-2 text-ink-3`}>
        <FontAwesome name="landmark" variant="solid" className="text-[15px]" />
      </div>
    );
  }

  return (
    <div className={`shrink-0 ${size} flex items-center justify-center rounded-md border border-line bg-surface-2 p-1.5`}>
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
      <div className="page max-w-6xl mx-auto w-full">
        <div className="skeleton h-4 w-44" />
        <div className="card p-5 md:p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="skeleton w-16 h-16" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-5 w-2/3" />
              <div className="skeleton h-3.5 w-1/3" />
            </div>
          </div>
          <div className="skeleton h-3.5 w-full" />
          <div className="skeleton h-3.5 w-5/6" />
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="page max-w-6xl mx-auto">
        <EmptyState title="Layanan tidak ditemukan" description="Layanan yang Anda cari tidak tersedia atau telah dipindahkan." />
        <Link to="/public-services" className="link inline-flex items-center gap-2 text-[12.5px] self-start">
          <FontAwesome name="arrow-left" className="text-[11px]" />
          Kembali ke Katalog Layanan Publik
        </Link>
      </div>
    );
  }

  return (
    <div className="page max-w-6xl mx-auto w-full pb-12 page-enter">
      {/* Back link */}
      <Link
        to="/public-services"
        className="link inline-flex items-center gap-2 text-[12.5px] self-start"
      >
        <FontAwesome name="arrow-left" className="text-[11px]" />
        Kembali ke Katalog Layanan Publik
      </Link>

      <Card className="overflow-hidden">
        {/* Header Hero: Logo Asli & Judul Sejajar, Kategori di Pojok Kanan Atas */}
        <div className="p-5 md:p-6 border-b border-line bg-surface-2">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            {/* Logo Asli Instansi Sejajar dengan Judul Layanan */}
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <LogoDisplay src={item.logo_url} alt={item.agency} size="w-16 h-16 sm:w-18 sm:h-18" />
              <div className="min-w-0">
                <h1 className="text-[20px] md:text-[22px] font-bold text-ink leading-tight tracking-[-0.025em]">{item.title}</h1>
                <p className="text-[12.5px] text-ink-3 font-medium mt-1 flex items-center gap-1.5 min-w-0">
                  <FontAwesome name="building-columns" className="text-[11px] shrink-0" />
                  <span className="truncate">{item.agency}</span>
                </p>
              </div>
            </div>

            {/* Kategori di Pojok Kanan Atas */}
            <Badge variant="info" className="uppercase tracking-wider shrink-0 self-start">
              Sektor {item.category}
            </Badge>
          </div>
        </div>

        {/* Body Informasi Terstruktur */}
        <div className="card-body space-y-6">
          {/* Info Grid 3 Kolom Terstruktur */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-surface-2 rounded-md p-3.5 border border-line">
              <p className="text-[11px] text-ink-3 font-semibold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <FontAwesome name="layer-group" className="text-[10px]" />
                Sektor Layanan
              </p>
              <p className="font-semibold text-ink capitalize text-[13px]">{item.category}</p>
            </div>

            <div className="bg-surface-2 rounded-md p-3.5 border border-line">
              <p className="text-[11px] text-ink-3 font-semibold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <FontAwesome name="calendar-days" className="text-[10px]" />
                Jadwal &amp; Periode
              </p>
              <p className="font-semibold text-ink text-[13px]">
                {formatDeadlineText(item.deadline, item.category, item.title)}
              </p>
            </div>

            <div className="bg-surface-2 rounded-md p-3.5 border border-line">
              <p className="text-[11px] text-ink-3 font-semibold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <FontAwesome name="building-columns" className="text-[10px]" />
                Instansi Penyelenggara
              </p>
              <p className="font-semibold text-ink text-[13px] truncate">{item.agency}</p>
            </div>
          </div>

          {/* Deskripsi Layanan */}
          <div>
            <h3 className="font-semibold text-[13px] text-ink mb-2 flex items-center gap-2">
              <FontAwesome name="circle-info" className="text-[12px] text-ink-3" />
              Deskripsi Layanan Resmi
            </h3>
            <p className="text-ink-2 leading-relaxed text-[13px] bg-surface-2 p-4 rounded-md border border-line">
              {item.description}
            </p>
          </div>

          {/* Persyaratan & Kelengkapan Data */}
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold text-[13px] text-ink flex items-center gap-2">
                <FontAwesome name="file-lines" className="text-[12px] text-ink-3" />
                Persyaratan &amp; Kelengkapan Data
              </h3>
              <p className="text-[12px] text-ink-3 mt-1">
                Status kelengkapan data profil Anda untuk keperluan pengisian formulir {item.agency}.
              </p>
            </div>

            {/* Grid Kartu Persyaratan */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 stagger">
              {requirements.map((req) => {
                const filled = isFieldFilled(req.fieldCode, profile);
                return (
                  <div
                    key={req.fieldCode}
                    className="bg-surface rounded-md border border-line p-3.5 transition-colors hover:border-line-2 flex flex-col justify-between"
                  >
                    <div>
                      {/* Baris Atas: Icon FontAwesome tanpa pembungkus, Nama Informasi, dan Badge Terisi / Belum Terisi */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FontAwesome name={req.icon} className="text-[13px] text-ink-3 shrink-0" />
                          <h4 className="text-[12.5px] font-semibold text-ink leading-snug">
                            {req.name}
                          </h4>
                        </div>

                        {filled ? (
                          <Badge variant="ok" dot className="shrink-0">
                            <span>Terisi</span>
                          </Badge>
                        ) : (
                          <Badge variant="danger" dot className="shrink-0">
                            <span>Belum Terisi</span>
                          </Badge>
                        )}
                      </div>

                      {/* Deskripsi Keperluan */}
                      <p className="text-[12px] text-ink-3 leading-relaxed pl-7 mt-1.5">
                        {req.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CTA Akses Portal Resmi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-5 border-t border-line">
            <a
              href={item.agency_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-lg"
            >
              <FontAwesome name="globe" className="text-[12px]" />
              <span>Website Portal Resmi</span>
            </a>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-lg"
            >
              <FontAwesome name="arrow-up-right-from-square" className="text-[12px]" />
              <span>Akses Formulir Layanan</span>
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
    if (selectedCategory === 'all') return data.agendas;
    return data.agendas.filter((a) => a.category === selectedCategory);
  }, [data, selectedCategory]);

  if (loading) {
    return (
      <div className="page pb-12 w-full max-w-6xl mx-auto">
        <div className="space-y-2">
          <div className="skeleton h-6 w-72" />
          <div className="skeleton h-3.5 w-full max-w-2xl" />
        </div>
        <div className="skeleton h-9 w-full max-w-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="card p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="skeleton w-11 h-11" />
                <div className="skeleton h-4 flex-1" />
              </div>
              <div className="skeleton h-3 w-2/3" />
              <div className="skeleton h-3 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return <EmptyState title="Gagal memuat data" description="Koneksi ke server terputus. Silakan coba beberapa saat lagi." />;
  }

  return (
    <div className="page pb-12 w-full max-w-6xl mx-auto page-enter">
      {/* Header Halaman */}
      <div className="page-head">
        <div className="min-w-0">
          <h1 className="page-title">
            Portal Layanan Publik Terpadu
          </h1>
          <p className="page-sub max-w-3xl">
            Katalog resmi agenda, perizinan, dan portal administrasi kementerian &amp; lembaga negara Republik Indonesia yang terintegrasi dengan ekstensi autofill GovConnect.
          </p>
        </div>
      </div>

      {/* Kategori Filter Pills & Counter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="segmented no-scrollbar max-w-full">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            data-active={selectedCategory === 'all'}
            className="segmented-item"
          >
            <FontAwesome name="layer-group" className="text-[11px] opacity-70" />
            <span>Semua Sektor</span>
            <span className="tabular-nums text-[11px] opacity-60">
              {data.agendas.length}
            </span>
          </button>

          {data.categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              data-active={selectedCategory === cat.id}
              className="segmented-item"
            >
              <FontAwesome name={cat.icon || 'landmark'} className="text-[11px] opacity-70" />
              <span>{cat.label}</span>
              <span className="tabular-nums text-[11px] opacity-60">
                {cat.count}
              </span>
            </button>
          ))}
        </div>

        <div className="text-[12px] text-ink-3 shrink-0">
          Menampilkan <span className="font-semibold text-ink tabular-nums">{filteredAgendas.length}</span> layanan
        </div>
      </div>

      {/* Grid Kartu Layanan Publik Terstruktur */}
      {filteredAgendas.length === 0 ? (
        <EmptyState title="Tidak ada layanan yang sesuai" description="Tidak ada agenda yang terdaftar pada sektor ini saat ini." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
          {filteredAgendas.map((item) => (
            <Link
              key={item.id}
              to={`/public-services/${item.id}`}
              className="group card card-hover flex flex-col justify-between overflow-hidden"
            >
              <div className="card-body space-y-3">
                {/* Header Card: Logo Asli & Judul Sejajar, Kategori di Pojok Kanan Atas */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <LogoDisplay src={item.logo_url} alt={item.agency} size="w-11 h-11" />
                    <h3 className="font-semibold text-[13.5px] leading-snug text-ink group-hover:text-accent-text transition-colors line-clamp-2">
                      {item.title}
                    </h3>
                  </div>
                  <Badge variant="neutral" size="sm" className="capitalize shrink-0 self-start">
                    {item.category}
                  </Badge>
                </div>

                {/* Nama Instansi Resmi */}
                <div className="flex items-center gap-1.5 text-[12px] font-medium text-ink-3 min-w-0">
                  <FontAwesome name="building-columns" className="text-[10px] shrink-0" />
                  <span className="truncate">{item.agency}</span>
                </div>

                {/* Deskripsi Ringkas */}
                <p className="text-[12.5px] leading-relaxed text-ink-2 line-clamp-2 font-normal">
                  {item.description}
                </p>
              </div>

              {/* Footer Terstruktur: Jadwal / Periode Realtime & Tombol Aksi */}
              <div className="card-foot">
                <div className="flex items-center gap-1.5 text-[11.5px] font-medium text-ink-3 min-w-0">
                  <FontAwesome name="calendar-days" className="text-[10px] shrink-0" />
                  <span className="truncate" title={formatDeadlineText(item.deadline, item.category, item.title)}>
                    {formatDeadlineText(item.deadline, item.category, item.title)}
                  </span>
                </div>

                <div className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-accent-text shrink-0">
                  <span>Detail</span>
                  <FontAwesome name="chevron-right" className="text-[9px]" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
