import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { profileApi, type Profile } from '../services/api';
import {
  Plus,
  Search,
  Layers,
  Shield,
  GraduationCap,
  Receipt,
  HeartPulse,
  Compass,
  FolderPlus,
  Folder,
  Copy,
  Check,
  Trash2,
  FileText,
  X,
  Info,
  ChevronRight,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export interface ServiceTemplate {
  id: string;
  name: string;
  agency: string;
  category: 'dukcapil' | 'polisi' | 'bkn' | 'pajak' | 'bpjs' | 'imigrasi' | 'custom';
  description: string;
  badgeColor: string;
  iconName: string;
  logoUrl?: string;
  fields: {
    key: string;
    label: string;
    required: boolean;
    categoryGroup: string;
  }[];
  isCustom?: boolean;
}

const DEFAULT_TEMPLATES: ServiceTemplate[] = [
  {
    id: 'tpl-dukcapil',
    name: 'Dukcapil (Kependudukan & Akta)',
    agency: 'Ditjen Dukcapil Kemendagri',
    category: 'dukcapil',
    description: 'Template formulir permohonan KTP-el, Kartu Keluarga baru, Akta Kelahiran, dan Surat Pindah Domisili.',
    badgeColor: 'blue',
    iconName: 'id-card',
    logoUrl: '/logos/kemendagri.svg',
    fields: [
      { key: 'nik', label: 'Nomor Induk Kependudukan (NIK)', required: true, categoryGroup: 'Identitas' },
      { key: 'family_card_number', label: 'Nomor Kartu Keluarga (KK)', required: true, categoryGroup: 'Identitas' },
      { key: 'full_name', label: 'Nama Lengkap', required: true, categoryGroup: 'Identitas' },
      { key: 'birth_place', label: 'Tempat Lahir', required: true, categoryGroup: 'Identitas' },
      { key: 'birth_date', label: 'Tanggal Lahir', required: true, categoryGroup: 'Identitas' },
      { key: 'gender', label: 'Jenis Kelamin', required: true, categoryGroup: 'Identitas' },
      { key: 'religion', label: 'Agama', required: false, categoryGroup: 'Identitas' },
      { key: 'marital_status', label: 'Status Perkawinan', required: false, categoryGroup: 'Identitas' },
      { key: 'blood_type', label: 'Golongan Darah', required: false, categoryGroup: 'Identitas' },
      { key: 'address', label: 'Alamat Jalan / RT / RW', required: true, categoryGroup: 'Alamat' },
      { key: 'province', label: 'Provinsi', required: true, categoryGroup: 'Alamat' },
      { key: 'city', label: 'Kabupaten / Kota', required: true, categoryGroup: 'Alamat' },
      { key: 'district', label: 'Kecamatan', required: true, categoryGroup: 'Alamat' },
      { key: 'village', label: 'Kelurahan / Desa', required: true, categoryGroup: 'Alamat' },
      { key: 'postal_code', label: 'Kode Pos', required: false, categoryGroup: 'Alamat' },
      { key: 'mother_name', label: 'Nama Ibu Kandung', required: true, categoryGroup: 'Keluarga' },
      { key: 'father_name', label: 'Nama Ayah', required: false, categoryGroup: 'Keluarga' },
    ],
  },
  {
    id: 'tpl-polisi',
    name: 'Kepolisian RI (SKCK & SIM)',
    agency: 'Kepolisian Negara Republik Indonesia (Polri)',
    category: 'polisi',
    description: 'Template formulir penerbitan SKCK Online, perpanjangan SIM Nasional, dan surat izin keramaian.',
    badgeColor: 'slate',
    iconName: 'shield',
    logoUrl: '/logos/polri.svg',
    fields: [
      { key: 'nik', label: 'Nomor Induk Kependudukan (NIK)', required: true, categoryGroup: 'Identitas' },
      { key: 'full_name', label: 'Nama Lengkap', required: true, categoryGroup: 'Identitas' },
      { key: 'driver_license', label: 'Nomor SIM (Surat Izin Mengemudi)', required: false, categoryGroup: 'Dokumen' },
      { key: 'passport_number', label: 'Nomor Paspor RI', required: false, categoryGroup: 'Dokumen' },
      { key: 'birth_place', label: 'Tempat Lahir', required: true, categoryGroup: 'Identitas' },
      { key: 'birth_date', label: 'Tanggal Lahir', required: true, categoryGroup: 'Identitas' },
      { key: 'gender', label: 'Jenis Kelamin', required: true, categoryGroup: 'Identitas' },
      { key: 'occupation', label: 'Pekerjaan / Profesi', required: true, categoryGroup: 'Pekerjaan' },
      { key: 'address', label: 'Alamat Domisili KTP', required: true, categoryGroup: 'Alamat' },
      { key: 'phone', label: 'Nomor Telepon / WhatsApp', required: true, categoryGroup: 'Kontak' },
      { key: 'email', label: 'Alamat Email', required: true, categoryGroup: 'Kontak' },
      { key: 'father_name', label: 'Nama Lengkap Ayah', required: true, categoryGroup: 'Keluarga' },
      { key: 'mother_name', label: 'Nama Lengkap Ibu', required: true, categoryGroup: 'Keluarga' },
      { key: 'emergency_contact_name', label: 'Kontak Darurat (Nama)', required: false, categoryGroup: 'Keluarga' },
      { key: 'emergency_contact_phone', label: 'Kontak Darurat (Nomor HP)', required: false, categoryGroup: 'Keluarga' },
    ],
  },
  {
    id: 'tpl-bkn',
    name: 'BKN / SSCASN (Seleksi CASN & PPPK)',
    agency: 'Badan Kepegawaian Negara',
    category: 'bkn',
    description: 'Template formulir portal SSCASN untuk pendaftaran seleksi Calon Pegawai Negeri Sipil & PPPK.',
    badgeColor: 'violet',
    iconName: 'graduation-cap',
    logoUrl: '/logos/bkn.png',
    fields: [
      { key: 'nik', label: 'Nomor Induk Kependudukan (NIK)', required: true, categoryGroup: 'Identitas' },
      { key: 'family_card_number', label: 'Nomor Kartu Keluarga (KK)', required: true, categoryGroup: 'Identitas' },
      { key: 'full_name', label: 'Nama Lengkap Sesuai Ijazah', required: true, categoryGroup: 'Identitas' },
      { key: 'birth_place', label: 'Tempat Lahir Sesuai Ijazah', required: true, categoryGroup: 'Identitas' },
      { key: 'birth_date', label: 'Tanggal Lahir', required: true, categoryGroup: 'Identitas' },
      { key: 'gender', label: 'Jenis Kelamin', required: true, categoryGroup: 'Identitas' },
      { key: 'education_level', label: 'Jenjang Pendidikan Terakhir', required: true, categoryGroup: 'Pendidikan' },
      { key: 'institution', label: 'Nama Universitas / Sekolah', required: true, categoryGroup: 'Pendidikan' },
      { key: 'student_id', label: 'NIM / Nomor Induk Mahasiswa', required: true, categoryGroup: 'Pendidikan' },
      { key: 'gpa', label: 'Indeks Prestasi Kumulatif (IPK)', required: true, categoryGroup: 'Pendidikan' },
      { key: 'graduation_year', label: 'Tahun Kelulusan', required: true, categoryGroup: 'Pendidikan' },
      { key: 'email', label: 'Email Aktif', required: true, categoryGroup: 'Kontak' },
      { key: 'phone', label: 'Nomor Ponsel', required: true, categoryGroup: 'Kontak' },
      { key: 'address', label: 'Alamat KTP', required: true, categoryGroup: 'Alamat' },
    ],
  },
  {
    id: 'tpl-pajak',
    name: 'Perpajakan / CoreTax (DJP Online)',
    agency: 'Direktorat Jenderal Pajak (Kemenkeu)',
    category: 'pajak',
    description: 'Template formulir portal CoreTax DJP untuk pelaporan SPT Tahunan, verifikasi NPWP 16 digit, dan validasi pajak.',
    badgeColor: 'emerald',
    iconName: 'file-invoice-dollar',
    logoUrl: '/logos/pajak.svg',
    fields: [
      { key: 'npwp', label: 'NPWP (16 Digit NIK Terpadu)', required: true, categoryGroup: 'Dokumen' },
      { key: 'nik', label: 'Nomor Induk Kependudukan (NIK)', required: true, categoryGroup: 'Identitas' },
      { key: 'full_name', label: 'Nama Wajib Pajak', required: true, categoryGroup: 'Identitas' },
      { key: 'occupation', label: 'Pekerjaan / Sumber Penghasilan', required: true, categoryGroup: 'Pekerjaan' },
      { key: 'organization', label: 'Nama Instansi / Pemberi Kerja', required: true, categoryGroup: 'Pekerjaan' },
      { key: 'work_address', label: 'Alamat Tempat Kerja', required: false, categoryGroup: 'Pekerjaan' },
      { key: 'income', label: 'Penghasilan Bruto / Gaji Bulanan', required: true, categoryGroup: 'Pekerjaan' },
      { key: 'marital_status', label: 'Status PTKP Perkawinan', required: true, categoryGroup: 'Identitas' },
      { key: 'phone', label: 'Nomor HP Terdaftar', required: true, categoryGroup: 'Kontak' },
      { key: 'email', label: 'Email Resmi', required: true, categoryGroup: 'Kontak' },
      { key: 'address', label: 'Alamat Tempat Tinggal', required: true, categoryGroup: 'Alamat' },
    ],
  },
  {
    id: 'tpl-bpjs',
    name: 'BPJS Kesehatan & Ketenagakerjaan',
    agency: 'BPJS Kesehatan & BPJS Ketenagakerjaan',
    category: 'bpjs',
    description: 'Template formulir pendaftaran peserta, mutasi Faskes tingkat I, dan klaim Jaminan Hari Tua (JHT).',
    badgeColor: 'cyan',
    iconName: 'heart',
    logoUrl: '/logos/bpjs.svg',
    fields: [
      { key: 'bpjs_number', label: 'Nomor Kartu BPJS', required: true, categoryGroup: 'Dokumen' },
      { key: 'nik', label: 'Nomor Induk Kependudukan (NIK)', required: true, categoryGroup: 'Identitas' },
      { key: 'family_card_number', label: 'Nomor Kartu Keluarga (KK)', required: true, categoryGroup: 'Identitas' },
      { key: 'full_name', label: 'Nama Peserta', required: true, categoryGroup: 'Identitas' },
      { key: 'birth_place', label: 'Tempat Lahir', required: true, categoryGroup: 'Identitas' },
      { key: 'birth_date', label: 'Tanggal Lahir', required: true, categoryGroup: 'Identitas' },
      { key: 'phone', label: 'Nomor Handphone WhatsApp', required: true, categoryGroup: 'Kontak' },
      { key: 'email', label: 'Alamat Email', required: true, categoryGroup: 'Kontak' },
      { key: 'address', label: 'Alamat Domisili', required: true, categoryGroup: 'Alamat' },
      { key: 'mother_name', label: 'Nama Ibu Kandung', required: true, categoryGroup: 'Keluarga' },
    ],
  },
  {
    id: 'tpl-imigrasi',
    name: 'Imigrasi (M-Paspor RI)',
    agency: 'Direktorat Jenderal Imigrasi (Kemenkumham)',
    category: 'imigrasi',
    description: 'Template formulir pembuatan paspor baru 48 halaman dan penggantian paspor habis masa berlaku.',
    badgeColor: 'sky',
    iconName: 'globe',
    logoUrl: '/logos/imigrasi.svg',
    fields: [
      { key: 'nik', label: 'Nomor Induk Kependudukan (NIK)', required: true, categoryGroup: 'Identitas' },
      { key: 'full_name', label: 'Nama Lengkap Sesuai Akta', required: true, categoryGroup: 'Identitas' },
      { key: 'birth_place', label: 'Tempat Lahir', required: true, categoryGroup: 'Identitas' },
      { key: 'birth_date', label: 'Tanggal Lahir', required: true, categoryGroup: 'Identitas' },
      { key: 'gender', label: 'Jenis Kelamin', required: true, categoryGroup: 'Identitas' },
      { key: 'passport_number', label: 'Nomor Paspor Sebelumnya', required: false, categoryGroup: 'Dokumen' },
      { key: 'mother_name', label: 'Nama Lengkap Ibu', required: true, categoryGroup: 'Keluarga' },
      { key: 'father_name', label: 'Nama Lengkap Ayah', required: true, categoryGroup: 'Keluarga' },
      { key: 'address', label: 'Alamat Tempat Tinggal KTP', required: true, categoryGroup: 'Alamat' },
      { key: 'phone', label: 'Nomor Telepon / WhatsApp', required: true, categoryGroup: 'Kontak' },
      { key: 'emergency_contact_name', label: 'Kontak Darurat (Nama)', required: true, categoryGroup: 'Keluarga' },
      { key: 'emergency_contact_phone', label: 'Kontak Darurat (Nomor HP)', required: true, categoryGroup: 'Keluarga' },
    ],
  },
];

const AVAILABLE_PROFILE_FIELDS = [
  { key: 'nik', label: 'NIK (Nomor Induk Kependudukan)', categoryGroup: 'Identitas' },
  { key: 'full_name', label: 'Nama Lengkap', categoryGroup: 'Identitas' },
  { key: 'family_card_number', label: 'Nomor Kartu Keluarga (KK)', categoryGroup: 'Identitas' },
  { key: 'birth_place', label: 'Tempat Lahir', categoryGroup: 'Identitas' },
  { key: 'birth_date', label: 'Tanggal Lahir', categoryGroup: 'Identitas' },
  { key: 'age', label: 'Umur / Usia', categoryGroup: 'Identitas' },
  { key: 'gender', label: 'Jenis Kelamin', categoryGroup: 'Identitas' },
  { key: 'religion', label: 'Agama', categoryGroup: 'Identitas' },
  { key: 'marital_status', label: 'Status Perkawinan', categoryGroup: 'Identitas' },
  { key: 'blood_type', label: 'Golongan Darah', categoryGroup: 'Identitas' },
  { key: 'address', label: 'Alamat Jalan / No Rumah', categoryGroup: 'Alamat' },
  { key: 'province', label: 'Provinsi', categoryGroup: 'Alamat' },
  { key: 'city', label: 'Kabupaten / Kota', categoryGroup: 'Alamat' },
  { key: 'district', label: 'Kecamatan', categoryGroup: 'Alamat' },
  { key: 'village', label: 'Kelurahan / Desa', categoryGroup: 'Alamat' },
  { key: 'postal_code', label: 'Kode Pos', categoryGroup: 'Alamat' },
  { key: 'phone', label: 'Nomor Handphone / WA', categoryGroup: 'Kontak' },
  { key: 'email', label: 'Alamat Email', categoryGroup: 'Kontak' },
  { key: 'institution', label: 'Nama Universitas / Sekolah', categoryGroup: 'Pendidikan' },
  { key: 'education_level', label: 'Jenjang Pendidikan', categoryGroup: 'Pendidikan' },
  { key: 'student_id', label: 'NIM / Nomor Siswa', categoryGroup: 'Pendidikan' },
  { key: 'gpa', label: 'IPK / Nilai Rata-rata', categoryGroup: 'Pendidikan' },
  { key: 'graduation_year', label: 'Tahun Kelulusan', categoryGroup: 'Pendidikan' },
  { key: 'occupation', label: 'Profesi / Pekerjaan', categoryGroup: 'Pekerjaan' },
  { key: 'organization', label: 'Instansi / Perusahaan', categoryGroup: 'Pekerjaan' },
  { key: 'work_address', label: 'Alamat Kantor', categoryGroup: 'Pekerjaan' },
  { key: 'income', label: 'Gaji / Penghasilan', categoryGroup: 'Pekerjaan' },
  { key: 'mother_name', label: 'Nama Lengkap Ibu Kandung', categoryGroup: 'Keluarga' },
  { key: 'father_name', label: 'Nama Lengkap Ayah', categoryGroup: 'Keluarga' },
  { key: 'emergency_contact_name', label: 'Kontak Darurat (Nama)', categoryGroup: 'Keluarga' },
  { key: 'emergency_contact_phone', label: 'Kontak Darurat (Nomor Telepon)', categoryGroup: 'Keluarga' },
  { key: 'npwp', label: 'Nomor NPWP 16 Digit', categoryGroup: 'Dokumen' },
  { key: 'bpjs_number', label: 'Nomor BPJS', categoryGroup: 'Dokumen' },
  { key: 'driver_license', label: 'Nomor SIM (Surat Izin Mengemudi)', categoryGroup: 'Dokumen' },
  { key: 'passport_number', label: 'Nomor Paspor', categoryGroup: 'Dokumen' },
];

export function TemplatesPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [customTemplates, setCustomTemplates] = useState<ServiceTemplate[]>([]);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<ServiceTemplate | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [copySuccessId, setCopySuccessId] = useState<string | null>(null);

  // Form states for Create Modal
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateAgency, setNewTemplateAgency] = useState('');
  const [newTemplateDescription, setNewTemplateDescription] = useState('');
  const [newTemplateIcon, setNewTemplateIcon] = useState('folder');
  const [selectedFieldKeys, setSelectedFieldKeys] = useState<string[]>([
    'nik', 'full_name', 'address', 'phone', 'email'
  ]);

  // Load profile & custom templates from localStorage
  useEffect(() => {
    profileApi.get()
      .then((res: { data: Profile }) => setProfile(res.data))
      .catch((err: unknown) => console.error('Gagal memuat data profil untuk templates:', err));

    const saved = localStorage.getItem('govconnect_service_templates');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setCustomTemplates(parsed);
        }
      } catch (e) {
        console.error('Error parsing custom templates', e);
      }
    }
  }, []);

  // Save custom templates to localStorage
  const saveCustomTemplates = (updated: ServiceTemplate[]) => {
    setCustomTemplates(updated);
    localStorage.setItem('govconnect_service_templates', JSON.stringify(updated));
  };

  // Combine default & custom templates
  const allTemplates = useMemo(() => {
    return [...customTemplates, ...DEFAULT_TEMPLATES];
  }, [customTemplates]);

  // Category filter tabs
  const templateCategories = useMemo(() => {
    return [
      { id: 'all', label: 'Semua Template', icon: Layers, count: allTemplates.length },
      { id: 'dukcapil', label: 'Dukcapil', icon: FileText, count: allTemplates.filter(t => t.category === 'dukcapil').length },
      { id: 'polisi', label: 'Kepolisian', icon: Shield, count: allTemplates.filter(t => t.category === 'polisi').length },
      { id: 'bkn', label: 'SSCASN / BKN', icon: GraduationCap, count: allTemplates.filter(t => t.category === 'bkn').length },
      { id: 'pajak', label: 'Perpajakan', icon: Receipt, count: allTemplates.filter(t => t.category === 'pajak').length },
      { id: 'bpjs', label: 'BPJS', icon: HeartPulse, count: allTemplates.filter(t => t.category === 'bpjs').length },
      { id: 'imigrasi', label: 'Imigrasi', icon: Compass, count: allTemplates.filter(t => t.category === 'imigrasi').length },
      { id: 'custom', label: 'Template Pribadi', icon: FolderPlus, count: allTemplates.filter(t => t.isCustom).length },
    ];
  }, [allTemplates]);

  // Filtered templates by category and search query
  const filteredTemplates = useMemo(() => {
    return allTemplates.filter(t => {
      const matchCat = activeCategoryFilter === 'all'
        ? true
        : activeCategoryFilter === 'custom'
          ? t.isCustom
          : t.category === activeCategoryFilter;

      if (!matchCat) return false;
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      return (
        t.name.toLowerCase().includes(q) ||
        t.agency.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.fields.some(f => f.label.toLowerCase().includes(q) || f.key.toLowerCase().includes(q))
      );
    });
  }, [allTemplates, activeCategoryFilter, searchQuery]);

  // Helper to check value from profile
  const getProfileValue = useCallback((key: string): string => {
    if (!profile) return '';
    const val = (profile as unknown as Record<string, unknown>)[key];
    if (val !== null && val !== undefined && String(val).trim() !== '') {
      return String(val);
    }
    if (profile.extended_fields && typeof profile.extended_fields === 'object') {
      const ext = profile.extended_fields as Record<string, unknown>;
      if (ext[key] && typeof ext[key] === 'object' && 'value' in (ext[key] as Record<string, unknown>)) {
        return String((ext[key] as Record<string, unknown>).value || '');
      }
    }
    return '';
  }, [profile]);

  // Calculate readiness % for a template
  const getReadiness = useCallback((template: ServiceTemplate) => {
    if (template.fields.length === 0) return { filled: 0, total: 0, percent: 100 };
    let filled = 0;
    template.fields.forEach(f => {
      const val = getProfileValue(f.key);
      if (val !== '') filled++;
    });
    const percent = Math.round((filled / template.fields.length) * 100);
    return { filled, total: template.fields.length, percent };
  }, [getProfileValue]);

  // Overall average readiness
  const averageReadiness = useMemo(() => {
    if (allTemplates.length === 0) return 0;
    const totalPercent = allTemplates.reduce((acc, t) => acc + getReadiness(t).percent, 0);
    return Math.round(totalPercent / allTemplates.length);
  }, [allTemplates, getReadiness]);

  // Handle Copy summary
  const handleCopySummary = (template: ServiceTemplate) => {
    const lines = [
      `=== RINGKASAN DATA: ${template.name.toUpperCase()} ===`,
      `Instansi: ${template.agency}`,
      `Waktu: ${new Date().toLocaleString('id-ID')}`,
      '----------------------------------------',
    ];
    template.fields.forEach(f => {
      const val = getProfileValue(f.key);
      lines.push(`${f.label}: ${val || '(Belum terisi di profil)'}`);
    });
    lines.push('----------------------------------------');
    lines.push('Dihasilkan via GovConnect Autofill Assistant');

    navigator.clipboard.writeText(lines.join('\n'));
    setCopySuccessId(template.id);
    setTimeout(() => setCopySuccessId(null), 2500);
  };

  // Handle create custom template
  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName.trim()) return;

    const fieldsToAdd = AVAILABLE_PROFILE_FIELDS
      .filter(f => selectedFieldKeys.includes(f.key))
      .map(f => ({
        key: f.key,
        label: f.label,
        required: true,
        categoryGroup: f.categoryGroup,
      }));

    const newTemplate: ServiceTemplate = {
      id: `custom-${Date.now()}`,
      name: newTemplateName.trim(),
      agency: newTemplateAgency.trim() || 'Layanan Mandiri / Kustom',
      category: 'custom',
      description: newTemplateDescription.trim() || 'Template kelompok formulir buatan pengguna.',
      badgeColor: 'blue',
      iconName: newTemplateIcon,
      fields: fieldsToAdd,
      isCustom: true,
    };

    saveCustomTemplates([newTemplate, ...customTemplates]);
    setIsCreateModalOpen(false);
    setNewTemplateName('');
    setNewTemplateAgency('');
    setNewTemplateDescription('');
    setSelectedFieldKeys(['nik', 'full_name', 'address', 'phone', 'email']);
  };

  const handleDeleteCustomTemplate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Apakah Anda yakin ingin menghapus template kustom ini?')) {
      const updated = customTemplates.filter(t => t.id !== id);
      saveCustomTemplates(updated);
      if (selectedTemplate?.id === id) {
        setSelectedTemplate(null);
      }
    }
  };

  const toggleFieldSelection = (key: string) => {
    setSelectedFieldKeys(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  return (
    <div className="page page-enter max-w-7xl mx-auto space-y-8 pb-16">
      {/* ── Page Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2 border-b border-line">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-400 text-xs font-semibold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Katalog Grup Formulir</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink">
            Grup Layanan &amp; Template
          </h1>
          <p className="text-base text-ink-2 max-w-3xl leading-relaxed">
            Petakan dan atur kelompok data profil sesuai kebutuhan portal instansi (Dukcapil, Polri, SSCASN, DJP, BPJS).
            GovConnect mendeteksi dan memetakan bidang secara presisi dalam satu klik persetujuan.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="h-12 px-5 rounded-xl bg-accent text-accent-fg font-semibold text-sm inline-flex items-center gap-2 hover:bg-accent-hover transition-all shadow-sm active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4" strokeWidth={2} />
            <span>Buat Template Baru</span>
          </button>
        </div>
      </div>

      {/* ── Metric Summary Strip ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-[20px] border border-line bg-surface flex flex-col justify-between">
          <span className="text-xs font-medium text-ink-3">Total Template</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-ink tracking-tight">
              {allTemplates.length}
            </span>
            <span className="text-xs text-ink-3 font-medium">Aktif</span>
          </div>
        </div>

        <div className="p-4 rounded-[20px] border border-line bg-surface flex flex-col justify-between">
          <span className="text-xs font-medium text-ink-3">Instansi Resmi</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-ink tracking-tight">
              {DEFAULT_TEMPLATES.length}
            </span>
            <span className="text-xs text-ok font-medium flex items-center gap-1">
              <Check className="w-3 h-3" /> Terverifikasi
            </span>
          </div>
        </div>

        <div className="p-4 rounded-[20px] border border-line bg-surface flex flex-col justify-between">
          <span className="text-xs font-medium text-ink-3">Template Kustom</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-ink tracking-tight">
              {customTemplates.length}
            </span>
            <span className="text-xs text-ink-3 font-medium">Mandiri</span>
          </div>
        </div>

        <div className="p-4 rounded-[20px] border border-line bg-surface flex flex-col justify-between">
          <span className="text-xs font-medium text-ink-3">Rata-rata Kesiapan</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-accent-text tracking-tight">
              {averageReadiness}%
            </span>
            <span className="text-xs text-ink-3 font-medium">Profil</span>
          </div>
        </div>
      </div>

      {/* ── Filter Bar & Search ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Category Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 max-w-full">
          {templateCategories.map(cat => {
            const Icon = cat.icon;
            const isActive = activeCategoryFilter === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategoryFilter(cat.id)}
                className={`h-10 px-3.5 rounded-xl border text-xs font-medium inline-flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'border-blue-500/40 bg-blue-500/10 text-accent-text font-semibold shadow-xs'
                    : 'border-line bg-surface text-ink-2 hover:bg-surface-2 hover:text-ink'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-accent-text' : 'text-ink-3'}`} strokeWidth={1.5} />
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
            placeholder="Cari template atau kolom..."
            className="w-full h-10 pl-10 pr-9 rounded-xl border border-line bg-surface text-xs text-ink placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 transition-all"
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

      {/* ── Grid of Template Cards ── */}
      {filteredTemplates.length === 0 ? (
        <div className="p-12 text-center rounded-[20px] border border-line bg-surface space-y-3">
          <Folder className="w-10 h-10 text-ink-3 mx-auto opacity-50" strokeWidth={1.5} />
          <h3 className="text-base font-semibold text-ink">Tidak Ada Template yang Cocok</h3>
          <p className="text-xs text-ink-3 max-w-sm mx-auto">
            Tidak ditemukan template dengan filter atau kata kunci &quot;{searchQuery}&quot;. Silakan ubah filter atau buat template kustom baru.
          </p>
          <button
            type="button"
            onClick={() => { setActiveCategoryFilter('all'); setSearchQuery(''); }}
            className="h-9 px-4 rounded-xl border border-line bg-surface-2 text-xs font-semibold text-ink hover:bg-surface-3 transition-colors mt-2"
          >
            Reset Filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTemplates.map(template => {
            const readiness = getReadiness(template);
            const isCopied = copySuccessId === template.id;

            return (
              <div
                key={template.id}
                onClick={() => setSelectedTemplate(template)}
                className="group rounded-[20px] border border-line bg-surface hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-200 flex flex-col justify-between overflow-hidden cursor-pointer p-5 space-y-5"
              >
                {/* Header Card */}
                <div className="space-y-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {template.logoUrl ? (
                        <div className="w-12 h-12 rounded-xl border border-line bg-surface-2 p-2 flex items-center justify-center shrink-0">
                          <img
                            src={template.logoUrl}
                            alt={template.agency}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              const img = e.target as HTMLImageElement;
                              if (!img.src.includes('bkn.png')) {
                                img.src = '/logos/bkn.png';
                              }
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-xl border border-line bg-surface-2 flex items-center justify-center shrink-0 text-accent-text">
                          <Folder className="w-6 h-6" strokeWidth={1.5} />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold text-ink group-hover:text-accent-text transition-colors truncate">
                          {template.name}
                        </h3>
                        <p className="text-xs text-ink-3 truncate mt-0.5">
                          {template.agency}
                        </p>
                      </div>
                    </div>

                    {template.isCustom && (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteCustomTemplate(template.id, e)}
                        className="p-1.5 rounded-lg text-ink-3 hover:text-danger hover:bg-danger-soft transition-colors shrink-0"
                        title="Hapus template kustom ini"
                      >
                        <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-ink-2 leading-relaxed line-clamp-2 min-h-[34px]">
                    {template.description}
                  </p>

                  {/* Fields pill list */}
                  <div className="flex flex-wrap gap-1.5">
                    {template.fields.slice(0, 3).map(f => (
                      <span
                        key={f.key}
                        className="px-2 py-0.5 rounded-md border border-line bg-surface-2 text-[11px] font-medium text-ink-2"
                      >
                        {f.label.split('(')[0].trim()}
                      </span>
                    ))}
                    {template.fields.length > 3 && (
                      <span className="px-2 py-0.5 rounded-md border border-blue-500/20 bg-blue-500/10 text-[11px] font-semibold text-accent-text">
                        +{template.fields.length - 3} kolom
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer: Readiness meter & Quick Action */}
                <div className="pt-4 border-t border-line flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-medium text-ink-3">
                      <span>Kesiapan data</span>
                      <span className="tabular-nums font-semibold text-ink">
                        {readiness.filled}/{readiness.total} siap ({readiness.percent}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-surface-3 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          readiness.percent === 100
                            ? 'bg-ok'
                            : readiness.percent > 50
                              ? 'bg-accent'
                              : 'bg-warn'
                        }`}
                        style={{ width: `${readiness.percent}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopySummary(template);
                      }}
                      className="h-8 px-2.5 rounded-lg border border-line bg-surface-2 text-xs font-semibold text-ink-2 hover:text-ink hover:bg-surface-3 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                      title="Salin ringkasan data template"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-ok" strokeWidth={2} />
                          <span className="text-ok">Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-ink-3" strokeWidth={1.5} />
                          <span>Salin</span>
                        </>
                      )}
                    </button>
                    <span className="text-xs font-semibold text-accent-text group-hover:translate-x-0.5 transition-transform inline-flex items-center">
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── DETAIL MODAL ── */}
      {selectedTemplate && createPortal(
        <div
          className="fixed inset-0 z-50 bg-slate-950/45 dark:bg-[#030d18]/65 backdrop-blur-[3px] flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedTemplate(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="w-full max-w-2xl max-h-[90vh] rounded-[24px] border border-line bg-surface shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
          >
            {/* Header */}
            <div className="p-6 border-b border-line flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                {selectedTemplate.logoUrl ? (
                  <div className="w-14 h-14 rounded-2xl border border-line bg-surface-2 p-2 flex items-center justify-center shrink-0">
                    <img
                      src={selectedTemplate.logoUrl}
                      alt={selectedTemplate.agency}
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-2xl border border-line bg-surface-2 flex items-center justify-center shrink-0 text-accent-text">
                    <Folder className="w-7 h-7" strokeWidth={1.5} />
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-ink truncate">
                    {selectedTemplate.name}
                  </h2>
                  <p className="text-xs text-ink-3 truncate mt-0.5">
                    {selectedTemplate.agency}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTemplate(null)}
                className="p-2 rounded-xl text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              <div className="p-4 rounded-xl border border-line bg-surface-2 flex items-start gap-3">
                <Info className="w-4 h-4 text-accent-text shrink-0 mt-0.5" strokeWidth={1.5} />
                <p className="text-xs text-ink-2 leading-relaxed">
                  {selectedTemplate.description}
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-ink">
                    Kolom yang Dibutuhkan ({selectedTemplate.fields.length} Kolom)
                  </span>
                  <span className="text-ink-3">
                    Status Data Profil Anda
                  </span>
                </div>

                <div className="rounded-xl border border-line divide-y divide-line overflow-hidden bg-surface-2">
                  {selectedTemplate.fields.map(field => {
                    const value = getProfileValue(field.key);
                    const isFilled = value !== '';

                    return (
                      <div key={field.key} className="p-3.5 flex items-center justify-between gap-3 hover:bg-surface-3 transition-colors">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-ink truncate">{field.label}</span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-surface border border-line text-ink-3">
                              {field.categoryGroup}
                            </span>
                          </div>
                          <p className={`text-xs mt-0.5 truncate font-mono ${isFilled ? 'text-ink-2' : 'text-ink-3 italic'}`}>
                            {isFilled ? value : 'Belum terisi di profil Anda'}
                          </p>
                        </div>

                        <div className="shrink-0">
                          {isFilled ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Cocok</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-surface-3 text-ink-3 border border-line">
                              <AlertCircle className="w-3 h-3 text-amber-500" />
                              <span>Kosong</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-6 border-t border-line bg-surface-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleCopySummary(selectedTemplate)}
                className="h-11 px-4 rounded-xl border border-line bg-surface hover:bg-surface-3 text-xs font-semibold text-ink transition-colors inline-flex items-center gap-2 cursor-pointer"
              >
                <Copy className="w-4 h-4 text-ink-3" />
                <span>Salin Ringkasan Data</span>
              </button>

              <div className="flex items-center gap-2">
                <Link
                  to="/profile"
                  className="h-11 px-5 rounded-xl bg-accent text-accent-fg hover:bg-accent-hover text-xs font-semibold transition-colors inline-flex items-center gap-2 cursor-pointer"
                >
                  <span>Lengkapi di Profil</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── CREATE CUSTOM TEMPLATE MODAL ── */}
      {isCreateModalOpen && createPortal(
        <div
          className="fixed inset-0 z-50 bg-slate-950/45 dark:bg-[#030d18]/65 backdrop-blur-[3px] flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsCreateModalOpen(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="w-full max-w-xl max-h-[90vh] rounded-[24px] border border-line bg-surface shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
          >
            <div className="p-6 border-b border-line flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-ink">
                  Buat Template Formulir Baru
                </h2>
                <p className="text-xs text-ink-3 mt-1">
                  Kelompokkan kolom profil spesifik untuk kebutuhan portal pendaftaran atau instansi lain.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 rounded-xl text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTemplate} className="flex-1 flex flex-col overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5">
                    Nama Template / Grup <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newTemplateName}
                    onChange={e => setNewTemplateName(e.target.value)}
                    placeholder="Contoh: Pendaftaran Beasiswa LPDP / Formulir Bank Mandiri"
                    className="w-full h-12 px-4 rounded-xl border border-line bg-surface-2 text-xs text-ink placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1.5">
                      Instansi / Sasaran
                    </label>
                    <input
                      type="text"
                      value={newTemplateAgency}
                      onChange={e => setNewTemplateAgency(e.target.value)}
                      placeholder="Contoh: LPDP Kemenkeu"
                      className="w-full h-12 px-4 rounded-xl border border-line bg-surface-2 text-xs text-ink placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1.5">
                      Ikon Template
                    </label>
                    <select
                      value={newTemplateIcon}
                      onChange={e => setNewTemplateIcon(e.target.value)}
                      className="w-full h-12 px-4 rounded-xl border border-line bg-surface-2 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 transition-all cursor-pointer"
                    >
                      <option value="folder">Folder Umum</option>
                      <option value="document">Dokumen / Form</option>
                      <option value="graduation-cap">Pendidikan / Akademik</option>
                      <option value="briefcase">Pekerjaan / Karir</option>
                      <option value="building">Instansi Pemerintah</option>
                      <option value="shield">Keamanan / Kepolisian</option>
                      <option value="bank">Perbankan / Finansial</option>
                      <option value="heart">Kesehatan / BPJS</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5">
                    Deskripsi Singkat
                  </label>
                  <textarea
                    rows={2}
                    value={newTemplateDescription}
                    onChange={e => setNewTemplateDescription(e.target.value)}
                    placeholder="Jelaskan kebutuhan pengisian formulir ini..."
                    className="w-full p-3 rounded-xl border border-line bg-surface-2 text-xs text-ink placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 transition-all"
                  />
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-ink">
                      Pilih Kolom Data ({selectedFieldKeys.length} terpilih)
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedFieldKeys(AVAILABLE_PROFILE_FIELDS.map(f => f.key))}
                        className="text-accent-text hover:underline font-semibold"
                      >
                        Pilih Semua
                      </button>
                      <span className="text-ink-3">·</span>
                      <button
                        type="button"
                        onClick={() => setSelectedFieldKeys([])}
                        className="text-ink-3 hover:underline"
                      >
                        Reset
                      </button>
                    </div>
                  </div>

                  <div className="max-h-56 overflow-y-auto rounded-xl border border-line bg-surface-2 divide-y divide-line p-1">
                    {AVAILABLE_PROFILE_FIELDS.map(field => {
                      const isChecked = selectedFieldKeys.includes(field.key);
                      return (
                        <label
                          key={field.key}
                          className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-3 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleFieldSelection(field.key)}
                              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500/40 cursor-pointer shrink-0"
                            />
                            <span className="text-xs font-medium text-ink truncate">{field.label}</span>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-surface border border-line text-ink-3 shrink-0">
                            {field.categoryGroup}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-line bg-surface-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="h-11 px-4 rounded-xl border border-line bg-surface hover:bg-surface-3 text-xs font-semibold text-ink transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!newTemplateName.trim() || selectedFieldKeys.length === 0}
                  className="h-11 px-5 rounded-xl bg-accent text-accent-fg hover:bg-accent-hover text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Simpan Template
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default TemplatesPage;
