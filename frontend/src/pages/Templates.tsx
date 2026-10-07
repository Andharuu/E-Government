import React, { useState, useEffect, useMemo } from 'react';
import { profileApi, type Profile } from '../services/api';
import { Flaticon, FontAwesome } from '../components/ui';
import { Link } from 'react-router-dom';

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
    logoUrl: '/logos/bkn.svg',
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
    logoUrl: '/logos/djp.svg',
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

  // Filtered templates
  const filteredTemplates = useMemo(() => {
    return allTemplates.filter(t => {
      const matchCat =
        activeCategoryFilter === 'all'
          ? true
          : activeCategoryFilter === 'custom'
          ? t.isCustom
          : t.category === activeCategoryFilter;

      const matchSearch =
        searchQuery.trim() === ''
          ? true
          : t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.agency.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.description.toLowerCase().includes(searchQuery.toLowerCase());

      return matchCat && matchSearch;
    });
  }, [allTemplates, activeCategoryFilter, searchQuery]);

  // Helper to check value from profile
  const getProfileValue = (key: string): string => {
    if (!profile) return '';
    const val = (profile as unknown as Record<string, unknown>)[key];
    if (val !== null && val !== undefined && String(val).trim() !== '') {
      return String(val);
    }
    // Check extended JSON fields if stored
    if (profile.extended_fields && typeof profile.extended_fields === 'object') {
      const ext = profile.extended_fields as Record<string, unknown>;
      if (ext[key] && typeof ext[key] === 'object' && 'value' in (ext[key] as Record<string, unknown>)) {
        return String((ext[key] as Record<string, unknown>).value || '');
      }
    }
    return '';
  };

  // Calculate readiness % for a template
  const getReadiness = (template: ServiceTemplate) => {
    if (template.fields.length === 0) return { filled: 0, total: 0, percent: 100 };
    let filled = 0;
    template.fields.forEach(f => {
      const val = getProfileValue(f.key);
      if (val !== '') filled++;
    });
    const percent = Math.round((filled / template.fields.length) * 100);
    return { filled, total: template.fields.length, percent };
  };

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
    <div className="w-full space-y-6">
      {/* Top Banner / Header */}
      <div className="bg-transparent border-0 shadow-none p-0 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <h1 className="text-[28px] leading-[36px] font-semibold text-[#0F172A] tracking-[-0.02em]">Grup layanan & template formulir</h1>
          <p className="text-[14px] leading-[22px] font-normal text-[#475569] mt-1 max-w-2xl">
            Atur kumpulan data profil sesuai instansi tujuan (Dukcapil, Kepolisian, Seleksi ASN, Perpajakan, BPJS, dll). GovConnect akan otomatis memetakan bidang saat Anda membuka formulir terkait.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-[14px] font-medium text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-[10px] transition-colors cursor-pointer"
          >
            <FontAwesome name="plus" variant="solid" className="text-xs text-white" />
            <span>Buat template baru</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2 rounded-[12px] border border-[#E8ECF2] shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'Semua Template' },
            { id: 'dukcapil', label: 'Dukcapil' },
            { id: 'polisi', label: 'Kepolisian' },
            { id: 'bkn', label: 'SSCASN / BKN' },
            { id: 'pajak', label: 'Perpajakan' },
            { id: 'bpjs', label: 'BPJS' },
            { id: 'custom', label: 'Template Pribadi' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveCategoryFilter(tab.id)}
              className={`h-9 px-3.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
                activeCategoryFilter === tab.id
                  ? 'bg-[#2563EB] text-white'
                  : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#F6F8FB]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Flaticon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari nama instansi/layanan..."
            className="w-full h-10 pl-8 pr-3 text-[14px] bg-[#F6F8FB] border border-[#E8ECF2] rounded-[10px] focus:bg-white focus:border-[#2563EB] focus:ring-3 focus:ring-[#2563EB]/15 text-[#0F172A] placeholder:text-[#8A97A8] outline-none transition-all"
          />
        </div>
      </div>

      {/* Grid of Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map(template => {
          const readiness = getReadiness(template);
          const isCopied = copySuccessId === template.id;

          return (
            <div
              key={template.id}
              onClick={() => setSelectedTemplate(template)}
              className="bg-white rounded-[16px] border border-[#E8ECF2] hover:border-[#DCE6FB] shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all p-6 flex flex-col justify-between cursor-pointer group relative"
            >
              <div className="space-y-4">
                {/* Header Card */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {template.logoUrl ? (
                      <div className="w-10 h-10 min-w-[40px] max-h-[40px] flex items-center justify-center shrink-0 overflow-hidden">
                        <img
                          src={template.logoUrl}
                          alt={template.agency}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                    ) : (
                      <div className="text-[20px] text-[#2563EB] shrink-0">
                        <FontAwesome name={template.iconName || 'folder'} variant="solid" className="text-[20px]" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-[16px] leading-[24px] font-semibold text-[#0F172A] group-hover:text-[#2563EB] transition-colors line-clamp-1">
                        {template.name}
                      </h3>
                      <p className="text-[13px] leading-[20px] font-normal text-[#475569] line-clamp-1">{template.agency}</p>
                    </div>
                  </div>

                  {template.isCustom && (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteCustomTemplate(template.id, e)}
                      className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                      title="Hapus template kustom ini"
                    >
                      <Flaticon name="trash" className="text-xs" />
                    </button>
                  )}
                </div>

                {/* Description */}
                <p className="text-[14px] leading-[22px] font-normal text-[#475569] line-clamp-2">
                  {template.description}
                </p>

                {/* Fields pill list */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {template.fields.slice(0, 4).map(f => (
                    <span
                      key={f.key}
                      className="px-2.5 py-0.5 text-[12px] leading-[16px] font-normal bg-[#F6F8FB] text-[#475569] rounded-full"
                    >
                      {f.label.split('(')[0].trim()}
                    </span>
                  ))}
                  {template.fields.length > 4 && (
                    <span className="px-2.5 py-0.5 text-[12px] leading-[16px] font-medium bg-[#EFF4FF] text-[#2563EB] rounded-full">
                      +{template.fields.length - 4} kolom lain
                    </span>
                  )}
                </div>
              </div>

              {/* Card Footer: Readiness & Quick Action */}
              <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1 bg-[#E8ECF2] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 bg-[#2563EB]"
                      style={{ width: `${readiness.percent}%` }}
                    />
                  </div>
                  <span className="text-[13px] leading-[20px] font-medium text-[#475569] tabular-nums">
                    {readiness.filled}/{readiness.total} siap
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopySummary(template);
                    }}
                    className="p-1.5 text-xs text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    title="Salin ringkasan data template ini"
                  >
                    <Flaticon name={isCopied ? 'check' : 'copy'} className={`text-xs ${isCopied ? 'text-emerald-600' : ''}`} />
                  </button>
                  <span className="text-[14px] leading-[20px] font-medium text-[#2563EB]">
                    Detail &gt;
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* DETAIL MODAL / DRAWER */}
      {selectedTemplate && (
        <div className="fixed inset-0 z-50 bg-[rgba(15,23,42,0.45)] backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-white rounded-[16px] border border-[#E8ECF2] shadow-[0_12px_32px_rgba(15,23,42,0.12)] max-w-[640px] w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-[#F1F4F8] flex items-center justify-between gap-4 bg-white">
              <div className="flex items-center gap-3">
                {selectedTemplate.logoUrl ? (
                  <div className="w-10 h-10 min-w-[40px] max-h-[40px] flex items-center justify-center shrink-0 overflow-hidden">
                    <img
                      src={selectedTemplate.logoUrl}
                      alt={selectedTemplate.agency}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                ) : (
                  <div className="text-[20px] text-[#2563EB] shrink-0">
                    <FontAwesome name={selectedTemplate.iconName || 'folder'} variant="solid" className="text-[20px]" />
                  </div>
                )}
                <div>
                  <h2 className="text-[18px] leading-[26px] font-semibold text-[#0F172A]">{selectedTemplate.name}</h2>
                  <p className="text-[13px] leading-[20px] font-normal text-[#64748B]">{selectedTemplate.agency}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTemplate(null)}
                className="p-1 text-[#64748B] hover:text-[#0F172A] text-[20px] transition-colors cursor-pointer"
              >
                <Flaticon name="cross-small" className="text-sm" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              <div className="bg-[#EFF4FF] border border-[#DCE6FB] rounded-[10px] p-3.5 flex items-start gap-3">
                <Flaticon name="info" className="text-[#2563EB] text-[16px] shrink-0 mt-0.5" />
                <p className="text-[13px] leading-[20px] text-[#0F172A]">
                  {selectedTemplate.description}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[13px] leading-[20px] font-medium text-[#475569]">
                    Kolom yang Dibutuhkan ({selectedTemplate.fields.length} Kolom)
                  </h3>
                  <span className="text-[13px] leading-[20px] font-medium text-[#64748B]">
                    Status profil Anda
                  </span>
                </div>

                <div className="border border-[#E8ECF2] rounded-[12px] divide-y divide-[#F1F4F8] overflow-hidden">
                  {selectedTemplate.fields.map(field => {
                    const value = getProfileValue(field.key);
                    const isFilled = value !== '';

                    return (
                      <div key={field.key} className="p-3 bg-white hover:bg-slate-50/70 flex items-center justify-between gap-3 text-xs transition-colors">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[14px] leading-[20px] font-medium text-[#0F172A] truncate">{field.label}</span>
                            <span className="px-2 py-0.5 text-[12px] leading-[16px] font-medium bg-[#F6F8FB] text-[#475569] rounded-full shrink-0">
                              {field.categoryGroup}
                            </span>
                          </div>
                          <p className="text-[13px] leading-[20px] text-[#475569] truncate mt-0.5">
                            {isFilled ? value : <span className="text-[#64748B]">Belum terisi di profil</span>}
                          </p>
                        </div>

                        <div>
                          {isFilled ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[12px] leading-[16px] font-medium bg-[#ECFDF5] text-[#047857] rounded-full">
                              <Flaticon name="check" className="text-[9px]" /> Terisi
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[12px] leading-[16px] font-medium bg-[#F6F8FB] text-[#64748B] rounded-full">
                              Kosong
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 px-6 border-t border-[#F1F4F8] bg-white flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleCopySummary(selectedTemplate)}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-[14px] font-medium text-[#475569] bg-white hover:border-[#2563EB] hover:text-[#2563EB] border border-[#E8ECF2] rounded-[10px] transition-colors cursor-pointer"
              >
                <Flaticon name="copy" className="text-xs" />
                <span>Salin ringkasan data</span>
              </button>

              <div className="flex items-center gap-2">
                <Link
                  to="/profile"
                  className="inline-flex items-center gap-2 px-4 py-2 text-[14px] font-medium text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-[10px] transition-colors cursor-pointer"
                >
                  <Flaticon name="edit" className="text-xs" />
                  <span>Lengkapi data di profil</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE TEMPLATE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-[rgba(15,23,42,0.45)] backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-[#F1F4F8] flex items-center justify-between gap-4 bg-white">
              <div>
                <h2 className="text-[18px] leading-[26px] font-semibold text-[#0F172A]">Buat Template / Grup Layanan Baru</h2>
                <p className="text-[13px] leading-[20px] font-normal text-[#64748B]">Susun kumpulan kolom profil untuk kebutuhan instansi atau portal tertentu.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-[#64748B] hover:text-[#0F172A] text-[20px] transition-colors cursor-pointer"
              >
                <Flaticon name="cross-small" className="text-sm" />
              </button>
            </div>

            <form onSubmit={handleCreateTemplate} className="flex-1 flex flex-col overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Nama Template / Grup <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newTemplateName}
                    onChange={e => setNewTemplateName(e.target.value)}
                    placeholder="Contoh: Pendaftaran Beasiswa LPDP / Formulir Bank Mandiri"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">Nama Instansi / Sasaran</label>
                    <input
                      type="text"
                      value={newTemplateAgency}
                      onChange={e => setNewTemplateAgency(e.target.value)}
                      placeholder="Contoh: LPDP Kemenkeu"
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">Ikon Grup</label>
                    <select
                      value={newTemplateIcon}
                      onChange={e => setNewTemplateIcon(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all"
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

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Deskripsi Singkat</label>
                  <textarea
                    rows={2}
                    value={newTemplateDescription}
                    onChange={e => setNewTemplateDescription(e.target.value)}
                    placeholder="Jelaskan kebutuhan pengisian formulir ini..."
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-[13px] leading-[20px] font-medium text-[#475569]">
                      Pilih kolom data ({selectedFieldKeys.length} terpilih)
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedFieldKeys(AVAILABLE_PROFILE_FIELDS.map(f => f.key))}
                        className="text-[11px] text-blue-600 hover:underline font-semibold"
                      >
                        Pilih Semua
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => setSelectedFieldKeys([])}
                        className="text-[11px] text-slate-500 hover:underline"
                      >
                        Reset
                      </button>
                    </div>
                  </div>

                  <div className="max-h-52 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 p-1">
                    {AVAILABLE_PROFILE_FIELDS.map(field => {
                      const isChecked = selectedFieldKeys.includes(field.key);
                      return (
                        <label
                          key={field.key}
                          className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleFieldSelection(field.key)}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <span className="text-xs font-medium text-slate-700">{field.label}</span>
                          </div>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                            {field.categoryGroup}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!newTemplateName.trim() || selectedFieldKeys.length === 0}
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  Simpan Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
