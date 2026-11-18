import React, { useState, useEffect, useMemo } from 'react';
import { profileApi, type Profile } from '../services/api';
import { FontAwesome, Button, Card, Badge, FormField, Input, Textarea, Select, Modal } from '../components/ui';
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

  // Kategori filter pills with icons and item counts
  const templateCategories = useMemo(() => {
    return [
      { id: 'all', label: 'Semua Template', icon: 'layer-group', count: allTemplates.length },
      { id: 'dukcapil', label: 'Dukcapil', icon: 'id-card', count: allTemplates.filter(t => t.category === 'dukcapil').length },
      { id: 'polisi', label: 'Kepolisian', icon: 'shield-halved', count: allTemplates.filter(t => t.category === 'polisi').length },
      { id: 'bkn', label: 'SSCASN / BKN', icon: 'graduation-cap', count: allTemplates.filter(t => t.category === 'bkn').length },
      { id: 'pajak', label: 'Perpajakan', icon: 'file-invoice-dollar', count: allTemplates.filter(t => t.category === 'pajak').length },
      { id: 'bpjs', label: 'BPJS', icon: 'heart', count: allTemplates.filter(t => t.category === 'bpjs').length },
      { id: 'imigrasi', label: 'Imigrasi', icon: 'passport', count: allTemplates.filter(t => t.category === 'imigrasi').length },
      { id: 'custom', label: 'Template Pribadi', icon: 'folder-plus', count: allTemplates.filter(t => t.isCustom).length },
    ];
  }, [allTemplates]);

  // Filtered templates
  const filteredTemplates = useMemo(() => {
    return allTemplates.filter(t => {
      if (activeCategoryFilter === 'all') return true;
      if (activeCategoryFilter === 'custom') return t.isCustom;
      return t.category === activeCategoryFilter;
    });
  }, [allTemplates, activeCategoryFilter]);

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
    <div className="page page-enter">
      {/* Top Banner / Header */}
      <div className="page-head">
        <div className="min-w-0">
          <h1 className="page-title">Grup Layanan &amp; Template Formulir</h1>
          <p className="page-sub max-w-2xl">
            Atur kumpulan data profil sesuai instansi tujuan (Dukcapil, Kepolisian, Seleksi ASN, Perpajakan, BPJS, dll). GovConnect akan otomatis memetakan bidang saat Anda membuka formulir terkait.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="primary"
            icon={<FontAwesome name="plus" className="text-[11px]" />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Buat Template Baru
          </Button>
        </div>
      </div>

      {/* Kategori Filter Pills & Counter (Mirrors PublicServices design) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="segmented no-scrollbar max-w-full">
          {templateCategories.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategoryFilter(cat.id)}
              data-active={activeCategoryFilter === cat.id}
              className="segmented-item"
            >
              <FontAwesome name={cat.icon} className="text-[11px] opacity-70" />
              <span>{cat.label}</span>
              <span className="tabular-nums text-[11px] opacity-60">{cat.count}</span>
            </button>
          ))}
        </div>

        <div className="text-[12px] text-ink-3 shrink-0 hidden sm:block">
          Menampilkan <span className="font-semibold text-ink tabular-nums">{filteredTemplates.length}</span> grup template
        </div>
      </div>

      {/* Grid of Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
        {filteredTemplates.map(template => {
          const readiness = getReadiness(template);
          const isCopied = copySuccessId === template.id;

          return (
            <Card
              key={template.id}
              hover
              onClick={() => setSelectedTemplate(template)}
              className="flex flex-col justify-between overflow-hidden cursor-pointer group"
            >
              <div className="card-body flex-1 space-y-3.5">
                {/* Header Card */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {template.logoUrl ? (
                      <div className="w-11 h-11 min-w-[44px] flex items-center justify-center shrink-0 rounded-md border border-line bg-surface-2 p-1.5">
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
                      <div className="w-11 h-11 min-w-[44px] flex items-center justify-center shrink-0 rounded-md border border-line bg-surface-2 text-ink-3">
                        <FontAwesome name={template.iconName || 'folder'} variant="solid" className="text-[15px]" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[14px] leading-snug font-semibold text-ink group-hover:text-accent-text transition-colors line-clamp-1">
                        {template.name}
                      </h3>
                      <p className="text-[12px] leading-[18px] font-normal text-ink-3 line-clamp-1 mt-0.5">{template.agency}</p>
                    </div>
                  </div>

                  {template.isCustom && (
                    <Button
                      variant="ghost"
                      size="sm"
                      iconOnly
                      onClick={(e) => handleDeleteCustomTemplate(template.id, e)}
                      className="text-ink-3 hover:text-danger shrink-0"
                      title="Hapus template kustom ini"
                      icon={<FontAwesome name="trash" className="text-[11px]" />}
                    />
                  )}
                </div>

                {/* Description */}
                <p className="text-[12.5px] leading-relaxed font-normal text-ink-2 line-clamp-2">
                  {template.description}
                </p>

                {/* Fields pill list */}
                <div className="flex flex-wrap gap-1.5">
                  {template.fields.slice(0, 4).map(f => (
                    <Badge key={f.key} variant="neutral" size="sm">
                      {f.label.split('(')[0].trim()}
                    </Badge>
                  ))}
                  {template.fields.length > 4 && (
                    <Badge variant="primary" size="sm">
                      +{template.fields.length - 4} kolom lain
                    </Badge>
                  )}
                </div>
              </div>

              {/* Card Footer: Readiness & Quick Action */}
              <div className="card-foot">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-16 h-1.5 bg-surface-3 rounded-full overflow-hidden shrink-0">
                    <div
                      className="h-full rounded-full transition-all duration-300 bg-accent"
                      style={{ width: `${readiness.percent}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-medium text-ink-3 tabular-nums whitespace-nowrap">
                    {readiness.filled}/{readiness.total} siap
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopySummary(template);
                    }}
                    title="Salin ringkasan data template ini"
                    icon={<FontAwesome name={isCopied ? 'check-pure' : 'copy'} className={`text-[11px] ${isCopied ? 'text-ok' : ''}`} />}
                  >
                    {isCopied ? 'Tersalin' : 'Salin'}
                  </Button>
                  <span className="text-[12px] font-semibold text-accent-text group-hover:underline">
                    Detail
                  </span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* DETAIL MODAL / DRAWER */}
      {selectedTemplate && (
        <Modal isOpen onClose={() => setSelectedTemplate(null)}>
          <div className="card w-full max-w-[640px] max-h-[90vh] flex flex-col overflow-hidden shadow-lg">
            {/* Modal Header */}
            <div className="card-head">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {selectedTemplate.logoUrl ? (
                  <div className="w-12 h-12 min-w-[48px] flex items-center justify-center shrink-0 rounded-md border border-line bg-surface-2 p-1.5">
                    <img
                      src={selectedTemplate.logoUrl}
                      alt={selectedTemplate.agency}
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
                  <div className="w-12 h-12 flex items-center justify-center shrink-0 rounded-md border border-line bg-surface-2 text-ink-3">
                    <FontAwesome name={selectedTemplate.iconName || 'folder'} variant="solid" className="text-[16px]" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="text-[15px] leading-snug font-semibold text-ink">{selectedTemplate.name}</h2>
                  <p className="text-[12px] leading-[18px] font-normal text-ink-3 mt-0.5 truncate">{selectedTemplate.agency}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                iconOnly
                onClick={() => setSelectedTemplate(null)}
                className="text-ink-3 shrink-0"
                icon={<FontAwesome name="xmark" className="text-[12px]" />}
              />
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              <div className="rounded-md border border-line bg-surface-2 p-3.5 flex items-start gap-2.5">
                <FontAwesome name="circle-info" className="text-accent-text text-[13px] shrink-0 mt-0.5" />
                <p className="text-[12.5px] leading-relaxed text-ink-2">
                  {selectedTemplate.description}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between gap-3 mb-2.5">
                  <h3 className="text-[13px] leading-[20px] font-semibold text-ink">
                    Kolom yang Dibutuhkan ({selectedTemplate.fields.length} Kolom)
                  </h3>
                  <span className="text-[11.5px] leading-[18px] font-medium text-ink-3 shrink-0">
                    Status profil Anda
                  </span>
                </div>

                <div className="rounded-md border border-line divide-y divide-line overflow-hidden">
                  {selectedTemplate.fields.map(field => {
                    const value = getProfileValue(field.key);
                    const isFilled = value !== '';

                    return (
                      <div key={field.key} className="px-3.5 py-2.5 flex items-center justify-between gap-3 hover:bg-surface-2 transition-colors">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[12.5px] leading-[18px] font-medium text-ink truncate">{field.label}</span>
                            <Badge variant="neutral" size="sm" className="shrink-0">
                              {field.categoryGroup}
                            </Badge>
                          </div>
                          <p className={`text-[12px] leading-[18px] truncate mt-0.5 ${isFilled ? 'text-ink-2' : 'text-ink-3'}`}>
                            {isFilled ? value : 'Belum terisi di profil'}
                          </p>
                        </div>

                        <div className="shrink-0">
                          {isFilled ? (
                            <Badge variant="ok" dot>Terisi</Badge>
                          ) : (
                            <Badge variant="neutral">Kosong</Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="card-foot">
              <Button
                variant="secondary"
                onClick={() => handleCopySummary(selectedTemplate)}
                icon={<FontAwesome name="copy" className="text-[11px]" />}
              >
                Salin ringkasan data
              </Button>

              <Link to="/profile" className="btn btn-primary">
                <FontAwesome name="pen-to-square" className="text-[11px]" />
                <span>Lengkapi data di profil</span>
              </Link>
            </div>
          </div>
        </Modal>
      )}

      {/* CREATE TEMPLATE MODAL */}
      {isCreateModalOpen && (
        <Modal isOpen onClose={() => setIsCreateModalOpen(false)}>
          <div className="card w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden shadow-lg">
            <div className="card-head items-start">
              <div className="min-w-0">
                <h2 className="text-[15px] leading-snug font-semibold text-ink">Buat Template / Grup Layanan Baru</h2>
                <p className="text-[12px] leading-[18px] font-normal text-ink-3 mt-0.5">Susun kumpulan kolom profil untuk kebutuhan instansi atau portal tertentu.</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                iconOnly
                onClick={() => setIsCreateModalOpen(false)}
                className="text-ink-3 shrink-0"
                icon={<FontAwesome name="xmark" className="text-[12px]" />}
              />
            </div>

            <form onSubmit={handleCreateTemplate} className="flex-1 flex flex-col overflow-hidden">
              <div className="p-5 overflow-y-auto space-y-4 flex-1">
                <FormField label="Nama Template / Grup" required htmlFor="tpl-name">
                  <Input
                    id="tpl-name"
                    type="text"
                    required
                    value={newTemplateName}
                    onChange={e => setNewTemplateName(e.target.value)}
                    placeholder="Contoh: Pendaftaran Beasiswa LPDP / Formulir Bank Mandiri"
                  />
                </FormField>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField label="Nama Instansi / Sasaran" htmlFor="tpl-agency">
                    <Input
                      id="tpl-agency"
                      type="text"
                      value={newTemplateAgency}
                      onChange={e => setNewTemplateAgency(e.target.value)}
                      placeholder="Contoh: LPDP Kemenkeu"
                    />
                  </FormField>

                  <FormField label="Ikon Grup" htmlFor="tpl-icon">
                    <Select
                      id="tpl-icon"
                      value={newTemplateIcon}
                      onChange={e => setNewTemplateIcon(e.target.value)}
                    >
                      <option value="folder">Folder Umum</option>
                      <option value="document">Dokumen / Form</option>
                      <option value="graduation-cap">Pendidikan / Akademik</option>
                      <option value="briefcase">Pekerjaan / Karir</option>
                      <option value="building">Instansi Pemerintah</option>
                      <option value="shield">Keamanan / Kepolisian</option>
                      <option value="bank">Perbankan / Finansial</option>
                      <option value="heart">Kesehatan / BPJS</option>
                    </Select>
                  </FormField>
                </div>

                <FormField label="Deskripsi Singkat" htmlFor="tpl-desc">
                  <Textarea
                    id="tpl-desc"
                    rows={2}
                    value={newTemplateDescription}
                    onChange={e => setNewTemplateDescription(e.target.value)}
                    placeholder="Jelaskan kebutuhan pengisian formulir ini..."
                  />
                </FormField>

                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-[12px] leading-[18px] font-medium text-ink-2">
                      Pilih kolom data ({selectedFieldKeys.length} terpilih)
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedFieldKeys(AVAILABLE_PROFILE_FIELDS.map(f => f.key))}
                        className="text-[11px] text-accent-text hover:underline font-semibold"
                      >
                        Pilih Semua
                      </button>
                      <span className="text-line-2">|</span>
                      <button
                        type="button"
                        onClick={() => setSelectedFieldKeys([])}
                        className="text-[11px] text-ink-3 hover:underline"
                      >
                        Reset
                      </button>
                    </div>
                  </div>

                  <div className="max-h-52 overflow-y-auto rounded-md border border-line bg-surface-2 divide-y divide-line">
                    {AVAILABLE_PROFILE_FIELDS.map(field => {
                      const isChecked = selectedFieldKeys.includes(field.key);
                      return (
                        <label
                          key={field.key}
                          className="flex items-center justify-between gap-2 px-3 py-2 hover:bg-surface-3 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleFieldSelection(field.key)}
                              className="accent-accent cursor-pointer shrink-0"
                            />
                            <span className="text-[12.5px] font-medium text-ink truncate">{field.label}</span>
                          </div>
                          <Badge variant="neutral" size="sm" className="shrink-0">
                            {field.categoryGroup}
                          </Badge>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="card-foot justify-end">
                <Button
                  variant="ghost"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={!newTemplateName.trim() || selectedFieldKeys.length === 0}
                >
                  Simpan Template
                </Button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
}
