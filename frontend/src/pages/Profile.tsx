import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { profileApi, type Profile } from '../services/api';
import {
  Loader2, Save, AlertCircle, CheckCircle2, User, MapPin, Phone,
  GraduationCap, Briefcase, HeartHandshake, FileText, Sparkles,
  Plus, Trash2, Edit3, Copy, Check, Info, ShieldCheck,
  Upload, Camera, FolderPlus, X, Eye, Calendar, AlignLeft,
  FileCheck2, ChevronDown
} from 'lucide-react';

export type CustomFieldType = 'text' | 'image' | 'date' | 'textarea';

export interface CustomFieldItem {
  id: string;
  category: string;
  key: string;
  label: string;
  value: string;
  type?: CustomFieldType;
  photoData?: string;
  photoName?: string;
  photoSize?: number;
}

export interface UserCategory {
  id: string;
  title: string;
  description: string;
  icon?: string;
}

export interface DocumentPhoto {
  name: string;
  type: string;
  data: string; // Base64 data URL
  size: number;
  uploadedAt?: string;
}

export type DocumentPhotosMap = Record<string, DocumentPhoto>;

const STANDARD_CATEGORIES = [
  { id: 'identity', title: 'Identitas & Kependudukan', icon: User, desc: 'Sesuai KTP resmi' },
  { id: 'address', title: 'Alamat & Domisili', icon: MapPin, desc: 'Tempat tinggal saat ini' },
  { id: 'contact', title: 'Kontak Pribadi', icon: Phone, desc: 'Nomor HP dan email' },
  { id: 'education', title: 'Pendidikan & Akademik', icon: GraduationCap, desc: 'Riwayat sekolah & kampus' },
  { id: 'career', title: 'Pekerjaan & Karir', icon: Briefcase, desc: 'Profesi dan instansi kerja' },
  { id: 'family', title: 'Keluarga & Kontak Darurat', icon: HeartHandshake, desc: 'Orang tua dan kontak darurat' },
  { id: 'documents', title: 'Dokumen Resmi & Berkas Foto', icon: FileText, desc: 'NPWP, BPJS & Foto KTP/KK' },
];

const PHOTO_DOCUMENT_SLOTS = [
  {
    id: 'ktp',
    title: 'Foto e-KTP Asli',
    desc: 'Foto KTP tampak depan, tulisan & NIK terbaca jelas.',
    icon: User,
    fieldKey: 'foto_ktp',
    badge: 'Autofill Berkas KTP'
  },
  {
    id: 'kk',
    title: 'Foto / Scan Kartu Keluarga',
    desc: 'Lembar Kartu Keluarga tampak penuh dan jelas.',
    icon: HeartHandshake,
    fieldKey: 'foto_kk',
    badge: 'Autofill Berkas KK'
  },
  {
    id: 'pasfoto',
    title: 'Pasfoto Formal Diri',
    desc: 'Foto wajah resmi 3x4 / 4x6 latar merah atau biru.',
    icon: Camera,
    fieldKey: 'pasfoto',
    badge: 'Autofill Pasfoto'
  },
  {
    id: 'npwp_card',
    title: 'Foto Kartu NPWP',
    desc: 'Foto fisik kartu NPWP atau bukti cetak resmi.',
    icon: FileText,
    fieldKey: 'foto_npwp',
    badge: 'Autofill NPWP'
  },
  {
    id: 'ijazah',
    title: 'Foto Ijazah / Dokumen Akademik',
    desc: 'Ijazah terakhir atau surat keterangan lulus.',
    icon: GraduationCap,
    fieldKey: 'foto_ijazah',
    badge: 'Autofill Ijazah'
  },
];

// Koleksi preset saran yang kaya untuk setiap kategori dan tipe data
interface RichPreset {
  label: string;
  key: string;
  type: CustomFieldType;
  placeholder?: string;
  badge?: string;
}

const RICH_CATEGORY_PRESETS: Record<string, RichPreset[]> = {
  identity: [
    { label: 'Nama Panggilan', key: 'nama_panggilan', type: 'text', placeholder: 'Raffi' },
    { label: 'Suku Bangsa', key: 'suku_bangsa', type: 'text', placeholder: 'Jawa / Sunda / Batak' },
    { label: 'Kewarganegaraan Asal', key: 'kewarganegaraan_asal', type: 'text', placeholder: 'Indonesia' },
    { label: 'Gelar Akademik', key: 'gelar_akademik', type: 'text', placeholder: 'S.Kom., M.Cs.' },
    { label: 'Foto Tanda Tangan Digital', key: 'foto_ttd', type: 'image', placeholder: 'Foto tanda tangan' },
  ],
  address: [
    { label: 'Nama Komplek / Perumahan', key: 'nama_komplek', type: 'text', placeholder: 'Griya Indah Asri Blok B No. 12' },
    { label: 'Nomor RT / RW', key: 'rt_rw', type: 'text', placeholder: 'RT 003 / RW 005' },
    { label: 'Patokan Alamat', key: 'patokan_alamat', type: 'textarea', placeholder: 'Depan Masjid Al-Ikhlas / sebelah Indomaret' },
    { label: 'Foto Rumah / Tempat Tinggal', key: 'foto_rumah', type: 'image', placeholder: 'Foto tampak depan rumah' },
  ],
  contact: [
    { label: 'Nomor Telepon Rumah', key: 'telepon_rumah', type: 'text', placeholder: '031-8912345' },
    { label: 'Username Telegram', key: 'telegram_username', type: 'text', placeholder: '@username' },
    { label: 'Email Alternatif / Kantor', key: 'email_kantor', type: 'text', placeholder: 'work@company.com' },
    { label: 'Nomor WhatsApp Darurat', key: 'wa_darurat', type: 'text', placeholder: '081298765432' },
  ],
  education: [
    { label: 'Fakultas / Program Studi', key: 'jurusan', type: 'text', placeholder: 'Informatika' },
    { label: 'Tahun Kelulusan', key: 'tahun_lulus', type: 'text', placeholder: '2024' },
    { label: 'Nilai IPK Terakhir', key: 'ipk', type: 'text', placeholder: '3.85' },
    { label: 'Nomor Ijazah Nasional', key: 'nomor_ijazah', type: 'text', placeholder: '12345/UN/2024' },
    { label: 'Foto Transkrip Nilai', key: 'foto_transkrip', type: 'image', placeholder: 'Foto transkrip nilai' },
  ],
  career: [
    { label: 'Nomor Induk Pegawai (NIP)', key: 'nip', type: 'text', placeholder: '199001012020121001' },
    { label: 'Divisi / Departemen', key: 'departemen', type: 'text', placeholder: 'Direktorat Sistem Informasi' },
    { label: 'Tanggal Mulai Bekerja', key: 'tgl_mulai_kerja', type: 'date' },
    { label: 'Nama Atasan Langsung', key: 'nama_atasan', type: 'text', placeholder: 'Nama Manajer / Kepala Dinas' },
    { label: 'Foto Kartu Pegawai (ID Card)', key: 'foto_id_card', type: 'image', placeholder: 'Foto ID Card kerja' },
  ],
  family: [
    { label: 'Jumlah Tanggungan Anak', key: 'jumlah_tanggungan', type: 'text', placeholder: '2 orang' },
    { label: 'Nama Pasangan (Suami/Istri)', key: 'nama_pasangan', type: 'text', placeholder: 'Nama lengkap pasangan' },
    { label: 'NIK Pasangan', key: 'nik_pasangan', type: 'text', placeholder: '16 digit NIK pasangan' },
    { label: 'Foto Buku Nikah / Akta Cerai', key: 'foto_buku_nikah', type: 'image', placeholder: 'Scan buku nikah' },
    { label: 'Foto Akta Kelahiran Anak', key: 'foto_akta_kelahiran', type: 'image', placeholder: 'Scan akta lahir' },
  ],
  documents: [
    { label: 'Nomor Paspor', key: 'nomor_paspor', type: 'text', placeholder: 'A 1234567' },
    { label: 'Masa Berlaku Paspor', key: 'paspor_expired', type: 'date' },
    { label: 'Foto Halaman Paspor', key: 'foto_paspor', type: 'image', placeholder: 'Foto identitas paspor' },
    { label: 'Nomor SIM (Surat Izin Mengemudi)', key: 'nomor_sim', type: 'text', placeholder: '1234-5678-9012' },
    { label: 'Foto Fisik SIM', key: 'foto_sim', type: 'image', placeholder: 'Foto SIM A / C' },
    { label: 'Nomor Rekening Bank', key: 'nomor_rekening', type: 'text', placeholder: '123-456-7890' },
    { label: 'Nama Bank', key: 'nama_bank', type: 'text', placeholder: 'Bank Mandiri / BCA / BNI' },
    { label: 'Foto Buku Tabungan', key: 'foto_buku_tabungan', type: 'image', placeholder: 'Foto nomor rekening' },
  ],
  other: [
    { label: 'Plat Nomor Kendaraan', key: 'plat_nomor', type: 'text', placeholder: 'B 1234 ABC' },
    { label: 'Foto STNK Kendaraan', key: 'foto_stnk', type: 'image', placeholder: 'Scan STNK asli' },
    { label: 'Nomor Polis Asuransi', key: 'nomor_polis', type: 'text', placeholder: 'POLIS-998877' },
    { label: 'Foto Kartu Asuransi', key: 'foto_asuransi', type: 'image', placeholder: 'Foto kartu asuransi' },
    { label: 'Tautan Profil LinkedIn', key: 'linkedin_url', type: 'text', placeholder: 'https://linkedin.com/in/...' },
  ]
};

// Helper kompresi gambar client-side (maks 1200px, ~150-250KB JPEG)
function compressImage(file: File): Promise<DocumentPhoto> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 1200;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({
            name: file.name,
            type: file.type || 'image/jpeg',
            data: e.target?.result as string,
            size: file.size,
            uploadedAt: new Date().toISOString(),
          });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        resolve({
          name: file.name,
          type: 'image/jpeg',
          data: dataUrl,
          size: Math.round((dataUrl.length * 3) / 4),
          uploadedAt: new Date().toISOString(),
        });
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [customFields, setCustomFields] = useState<CustomFieldItem[]>([]);
  const [userCategories, setUserCategories] = useState<UserCategory[]>([]);
  const [documentPhotos, setDocumentPhotos] = useState<DocumentPhotosMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Modal / Form Tambah Custom Field
  const [showAddFieldModal, setShowAddFieldModal] = useState(false);
  const [targetCategory, setTargetCategory] = useState('identity');
  const [newFieldType, setNewFieldType] = useState<CustomFieldType>('text');
  const [newLabel, setNewLabel] = useState('');
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newPhotoData, setNewPhotoData] = useState<DocumentPhoto | null>(null);
  const [fieldError, setFieldError] = useState('');

  // Inline Category Creator inside Modal
  const [showInlineCategoryCreator, setShowInlineCategoryCreator] = useState(false);
  const [inlineCategoryTitle, setInlineCategoryTitle] = useState('');
  const [inlineCategoryDesc, setInlineCategoryDesc] = useState('');

  // Modal Standalone Buat Kategori Baru (di luar)
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryTitle, setNewCategoryTitle] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');
  const [categoryError, setCategoryError] = useState('');

  // Inline Editing Custom Field State
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editKey, setEditKey] = useState('');
  const [editValue, setEditValue] = useState('');

  // Image Preview Lightbox Modal
  const [previewPhoto, setPreviewPhoto] = useState<{ title: string; data: string; name: string } | null>(null);

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const modalPhotoInputRef = useRef<HTMLInputElement | null>(null);

  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  };

  const handleLabelChange = (val: string) => {
    setNewLabel(val);
    if (!newKey || newKey === slugify(newLabel)) {
      setNewKey(slugify(val));
    }
  };

  useEffect(() => {
    profileApi.get()
      .then(res => {
        const data = res.data;
        setProfile(data);

        // Parse custom_fields (support { categories: [], fields: [] } and flat array)
        if (data.custom_fields) {
          try {
            const parsed = typeof data.custom_fields === 'string'
              ? JSON.parse(data.custom_fields)
              : data.custom_fields;

            if (parsed && typeof parsed === 'object') {
              if (Array.isArray(parsed.fields)) {
                setCustomFields(parsed.fields);
                if (Array.isArray(parsed.categories)) {
                  setUserCategories(parsed.categories);
                }
              } else if (Array.isArray(parsed)) {
                setCustomFields(parsed.map((item, idx) => ({
                  id: item.id || `cf_${idx}_${Date.now()}`,
                  category: item.category || 'documents',
                  key: item.key || `field_${idx}`,
                  label: item.label || item.key,
                  value: item.value || '',
                  type: item.type || 'text',
                  photoData: item.photoData,
                  photoName: item.photoName,
                  photoSize: item.photoSize,
                })));
              }
            }
          } catch (e) {
            console.error('Failed to parse custom_fields:', e);
          }
        }

        // Parse document_photos
        if (data.document_photos) {
          try {
            const parsedDocs = typeof data.document_photos === 'string'
              ? JSON.parse(data.document_photos)
              : data.document_photos;
            if (parsedDocs && typeof parsedDocs === 'object') {
              setDocumentPhotos(parsedDocs);
            }
          } catch (e) {
            console.error('Failed to parse document_photos:', e);
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (key: string, value: string) => {
    setProfile(prev => prev ? { ...prev, [key]: value } : null);
    setHasUnsavedChanges(true);
  };

  // Upload Foto Dokumen Resmi Standar
  const handleStandardPhotoUpload = async (slotId: string, file: File) => {
    try {
      const compressed = await compressImage(file);
      setDocumentPhotos(prev => ({
        ...prev,
        [slotId]: compressed,
      }));
      setHasUnsavedChanges(true);
      setMessage({ type: 'success', text: `Foto ${file.name} berhasil dimuat dan siap untuk autofill!` });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error('Failed to compress image:', err);
      setMessage({ type: 'error', text: 'Gagal memproses berkas gambar.' });
    }
  };

  const handleRemoveStandardPhoto = (slotId: string) => {
    setDocumentPhotos(prev => {
      const updated = { ...prev };
      delete updated[slotId];
      return updated;
    });
    setHasUnsavedChanges(true);
  };

  // Upload Foto untuk Kolom Kustom di Modal
  const handleModalPhotoSelected = async (file: File) => {
    try {
      const compressed = await compressImage(file);
      setNewPhotoData(compressed);
      setNewValue(compressed.name);
      if (!newLabel) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setNewLabel(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
        setNewKey(slugify(cleanName));
      }
    } catch (err) {
      console.error('Failed to compress modal image:', err);
      setFieldError('Gagal memproses berkas gambar.');
    }
  };

  // Buka Modal Tambah Field dengan kategori tertentu
  const openAddFieldModal = (categoryId: string) => {
    setTargetCategory(categoryId);
    setNewFieldType('text');
    setNewLabel('');
    setNewKey('');
    setNewValue('');
    setNewPhotoData(null);
    setFieldError('');
    setShowInlineCategoryCreator(false);
    setShowAddFieldModal(true);
  };

  // Pilih preset di modal
  const applyPresetToModal = (preset: RichPreset) => {
    setNewFieldType(preset.type);
    setNewLabel(preset.label);
    setNewKey(preset.key);
    setNewValue(preset.type === 'image' ? '' : (preset.placeholder || ''));
    setNewPhotoData(null);
    setFieldError('');
  };

  // Buat kategori baru langsung dari form modal
  const handleCreateCategoryInline = (e: React.FormEvent) => {
    e.preventDefault();
    const title = inlineCategoryTitle.trim();
    if (!title) return;

    const catId = `cat_${slugify(title)}_${Date.now().toString(36)}`;
    const newCat: UserCategory = {
      id: catId,
      title,
      description: inlineCategoryDesc.trim() || 'Kategori kustom pengguna',
    };

    setUserCategories(prev => [...prev, newCat]);
    setTargetCategory(catId);
    setShowInlineCategoryCreator(false);
    setInlineCategoryTitle('');
    setInlineCategoryDesc('');
    setHasUnsavedChanges(true);
  };

  // Submit Field Kustom Baru
  const handleSaveNewField = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError('');

    const trimmedLabel = newLabel.trim();
    const finalKey = (newKey.trim() || slugify(trimmedLabel)).trim();

    if (!trimmedLabel) {
      setFieldError('Nama data / label wajib diisi.');
      return;
    }
    if (!finalKey) {
      setFieldError('Kunci atribut (key) tidak boleh kosong.');
      return;
    }

    if (newFieldType === 'image') {
      if (!newPhotoData?.data) {
        setFieldError('Silakan pilih atau unggah berkas gambar foto.');
        return;
      }
    } else {
      if (!newValue.trim()) {
        setFieldError('Nilai data wajib diisi.');
        return;
      }
    }

    if (customFields.some(f => f.key === finalKey)) {
      setFieldError(`Kunci atribut "${finalKey}" sudah digunakan.`);
      return;
    }

    const newItem: CustomFieldItem = {
      id: `cf_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      category: targetCategory,
      key: finalKey,
      label: trimmedLabel,
      value: newFieldType === 'image' ? (newPhotoData?.name || 'document.jpg') : newValue.trim(),
      type: newFieldType,
      photoData: newFieldType === 'image' ? newPhotoData?.data : undefined,
      photoName: newFieldType === 'image' ? newPhotoData?.name : undefined,
      photoSize: newFieldType === 'image' ? newPhotoData?.size : undefined,
    };

    setCustomFields(prev => [...prev, newItem]);

    // Jika berupa gambar, daftarkan juga ke documentPhotos agar autofill file input langsung mengenali
    if (newFieldType === 'image' && newPhotoData) {
      setDocumentPhotos(prev => ({
        ...prev,
        [finalKey]: newPhotoData,
      }));
    }

    setShowAddFieldModal(false);
    setHasUnsavedChanges(true);
  };

  // Submit Kategori Baru dari Modal Luar
  const handleCreateCategoryStandalone = (e: React.FormEvent) => {
    e.preventDefault();
    setCategoryError('');

    const title = newCategoryTitle.trim();
    if (!title) {
      setCategoryError('Nama kategori wajib diisi.');
      return;
    }

    const catId = `cat_${slugify(title)}_${Date.now().toString(36)}`;
    const newCat: UserCategory = {
      id: catId,
      title,
      description: newCategoryDesc.trim() || 'Kategori kustom pengguna',
    };

    setUserCategories(prev => [...prev, newCat]);
    setShowAddCategoryModal(false);
    setNewCategoryTitle('');
    setNewCategoryDesc('');
    setHasUnsavedChanges(true);
    openAddFieldModal(catId);
  };

  const handleDeleteCategory = (catId: string) => {
    if (!confirm('Hapus kategori kustom ini beserta semua data di dalamnya?')) return;
    setUserCategories(prev => prev.filter(c => c.id !== catId));
    setCustomFields(prev => prev.filter(f => f.category !== catId));
    setHasUnsavedChanges(true);
  };

  // Inline Edit Custom Field
  const startEditField = (field: CustomFieldItem) => {
    setEditingFieldId(field.id);
    setEditLabel(field.label);
    setEditKey(field.key);
    setEditValue(field.value);
  };

  const saveEditField = (id: string) => {
    if (!editLabel.trim() || !editKey.trim() || !editValue.trim()) return;
    setCustomFields(prev =>
      prev.map(f => f.id === id ? { ...f, label: editLabel.trim(), key: editKey.trim(), value: editValue.trim() } : f)
    );
    setEditingFieldId(null);
    setHasUnsavedChanges(true);
  };

  const handleDeleteField = (id: string, key?: string) => {
    setCustomFields(prev => prev.filter(f => f.id !== id));
    if (key) {
      setDocumentPhotos(prev => {
        const updated = { ...prev };
        delete updated[key];
        return updated;
      });
    }
    setHasUnsavedChanges(true);
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  // Simpan Seluruh Profil ke Backend
  const handleSave = useCallback(async () => {
    if (!profile) return;
    setSaving(true);
    setMessage(null);

    try {
      const customPayload = {
        categories: userCategories,
        fields: customFields,
      };

      const payload: Partial<Profile> = {
        ...profile,
        custom_fields: JSON.stringify(customPayload),
        document_photos: JSON.stringify(documentPhotos),
      };

      const res = await profileApi.update(payload);
      setProfile(res.data);
      setHasUnsavedChanges(false);
      
      // Beritahu ekstensi GovConnect bahwa profil telah diperbarui
      try {
        localStorage.setItem('govconnect_profile_updated_at', Date.now().toString());
        window.postMessage({ type: 'GOVCONNECT_PROFILE_UPDATED', profile: res.data }, '*');
      } catch (storageErr) {
        console.warn('Gagal sinkronisasi event ekstensi:', storageErr);
      }

      setMessage({ type: 'success', text: 'Semua data profil, berkas foto, dan kolom kustom berhasil disimpan!' });
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setMessage({ type: 'error', text: err?.response?.data?.detail || 'Gagal menyimpan profil. Silakan coba lagi.' });
    } finally {
      setSaving(false);
    }
  }, [profile, customFields, userCategories, documentPhotos]);

  // Keyboard shortcut: Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  // Kelengkapan Profil (Completeness)
  const completeness = useMemo(() => {
    if (!profile) return { percentage: 0, filled: 0, total: 0 };

    const coreKeys = [
      'full_name', 'nik', 'birth_place', 'birth_date', 'gender', 'religion', 'marital_status',
      'blood_type', 'address', 'province', 'city', 'district', 'village', 'postal_code',
      'phone', 'email', 'education_level', 'institution', 'student_id', 'nisn',
      'occupation', 'organization', 'work_address', 'mother_name', 'father_name',
      'emergency_contact_name', 'emergency_contact_phone', 'npwp', 'bpjs_number'
    ];

    let filledCount = 0;
    coreKeys.forEach(k => {
      const val = profile[k];
      if (val && String(val).trim() !== '') filledCount++;
    });

    customFields.forEach(cf => {
      if (cf.type === 'image' ? cf.photoData : (cf.value && cf.value.trim() !== '')) {
        filledCount++;
      }
    });

    PHOTO_DOCUMENT_SLOTS.forEach(slot => {
      if (documentPhotos[slot.id]?.data) filledCount++;
    });

    const totalTracked = coreKeys.length + customFields.length + PHOTO_DOCUMENT_SLOTS.length;
    const percentage = totalTracked > 0 ? Math.round((filledCount / totalTracked) * 100) : 0;

    return { percentage, filled: filledCount, total: totalTracked };
  }, [profile, customFields, documentPhotos]);

  // Semua kategori yang tersedia
  const allCategories = useMemo(() => {
    return [
      ...STANDARD_CATEGORIES.map(c => ({ ...c, isCustom: false })),
      ...userCategories.map(c => ({ ...c, icon: FolderPlus, desc: c.description, isCustom: true }))
    ];
  }, [userCategories]);

  // Helper render Custom Fields di dalam Setiap Kategori
  const renderCategoryCustomFields = (catId: string, catTitle: string) => {
    const fieldsInCat = customFields.filter(f => f.category === catId);
    return (
      <div className="mt-6 pt-5 border-t border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            Data Kustom pada {catTitle} ({fieldsInCat.length})
          </span>
          <button
            type="button"
            onClick={() => openAddFieldModal(catId)}
            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            + Tambah Data di Kategori Ini
          </button>
        </div>

        {fieldsInCat.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {fieldsInCat.map(field => {
              const isEditing = editingFieldId === field.id;
              const isImage = field.type === 'image';

              // Tampilan Kartu Berkas Gambar
              if (isImage) {
                return (
                  <div
                    key={field.id}
                    className="p-3.5 bg-blue-50/40 hover:bg-blue-50/70 rounded-xl border border-blue-200 shadow-sm flex items-center justify-between gap-3 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {field.photoData ? (
                        <div
                          onClick={() => setPreviewPhoto({ title: field.label, data: field.photoData!, name: field.photoName || field.value })}
                          className="w-12 h-12 rounded-lg bg-slate-100 border border-blue-200 overflow-hidden cursor-pointer flex-shrink-0 relative group"
                        >
                          <img src={field.photoData} alt={field.label} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                            <Eye className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                          <Camera className="w-6 h-6" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900 truncate">{field.label}</span>
                          <span className="text-[9px] font-mono text-blue-700 bg-blue-100/70 px-1.5 py-0.5 rounded">
                            {field.key}
                          </span>
                        </div>
                        <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                          <FileCheck2 className="w-3 h-3" />
                          {field.photoName || field.value} {field.photoSize ? `(${Math.round(field.photoSize / 1024)} KB)` : ''} · Siap Autofill
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      {field.photoData && (
                        <button
                          type="button"
                          onClick={() => setPreviewPhoto({ title: field.label, data: field.photoData!, name: field.photoName || field.value })}
                          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg"
                          title="Lihat foto"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteField(field.id, field.key)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              }

              // Tampilan Kartu Teks / Tanggal / Textarea
              if (isEditing) {
                return (
                  <div key={field.id} className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-300 space-y-2.5">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-600">Label</label>
                        <input
                          type="text"
                          value={editLabel}
                          onChange={e => setEditLabel(e.target.value)}
                          className="w-full px-2.5 py-1 text-xs bg-white border border-slate-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-600">Kunci</label>
                        <input
                          type="text"
                          value={editKey}
                          onChange={e => setEditKey(slugify(e.target.value))}
                          className="w-full px-2.5 py-1 text-xs font-mono bg-white border border-slate-300 rounded"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-600">Nilai</label>
                      <input
                        type="text"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        className="w-full px-2.5 py-1 text-xs bg-white border border-slate-300 rounded"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setEditingFieldId(null)}
                        className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-200/60 rounded"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={() => saveEditField(field.id)}
                        className="px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Simpan
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={field.id}
                  className="p-3 bg-slate-50/70 hover:bg-white rounded-xl border border-slate-200 hover:border-slate-300 flex items-center justify-between gap-2.5 transition-all shadow-sm"
                >
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900 truncate">{field.label}</span>
                      <span className="text-[9px] font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                        {field.key}
                      </span>
                      {field.type === 'date' && (
                        <span className="text-[9px] text-amber-700 bg-amber-50 px-1 rounded">Tanggal</span>
                      )}
                    </div>
                    <div className="text-xs font-medium text-slate-700 truncate">{field.value}</div>
                  </div>

                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopy(field.value, field.id)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-lg"
                      title="Salin nilai"
                    >
                      {copiedKey === field.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => startEditField(field)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="Edit"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteField(field.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium text-slate-500">Memuat profil GovConnect...</span>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 pb-24">
      {/* Top Banner & Action Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
                My Profile
              </h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                Data & Berkas Terenkripsi
              </span>
            </div>
            <p className="text-sm text-slate-500 max-w-2xl leading-relaxed">
              Kelola identitas, foto dokumen asli, dan data kustom (kolom teks maupun berkas gambar) per kategori untuk autofill otomatis oleh ekstensi GovConnect.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setShowAddCategoryModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium text-sm rounded-xl border border-slate-300 transition-colors"
            >
              <FolderPlus className="w-4 h-4 text-blue-600" />
              + Buat Kategori Baru
            </button>

            {hasUnsavedChanges && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Ada perubahan belum disimpan
              </span>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-sm rounded-xl shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Menyimpan...' : 'Simpan Semua Perubahan'}
              <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.5 text-[10px] font-mono bg-blue-700 rounded text-blue-100">
                Ctrl+S
              </kbd>
            </button>
          </div>
        </div>

        {/* Completeness Bar */}
        <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          <div className="md:col-span-3 space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-slate-700">
              <span className="flex items-center gap-2">
                <span className="font-semibold text-slate-900">Kelengkapan Profil & Berkas:</span>
                <span>{completeness.filled} dari {completeness.total} data & foto terisi</span>
              </span>
              <span className="text-blue-600 font-bold text-sm">{completeness.percentage}% Lengkap</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${completeness.percentage}%` }}
              />
            </div>
          </div>
          <div className="text-xs text-slate-500 md:text-right bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            Kolom teks maupun berkas foto akan otomatis diisikan oleh ekstensi saat Anda membuka formulir web.
          </div>
        </div>
      </div>

      {/* Alert Messages */}
      {message && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 border shadow-sm transition-all ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          )}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      {/* Navigation Quick Links */}
      <div className="sticky top-20 z-20 bg-white/90 backdrop-blur-md p-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-1.5 overflow-x-auto text-xs font-medium">
        <a href="#section-identity" className="px-3 py-1.5 rounded-lg hover:bg-slate-100 text-slate-600 whitespace-nowrap">
          🪪 Identitas
        </a>
        <a href="#section-address" className="px-3 py-1.5 rounded-lg hover:bg-slate-100 text-slate-600 whitespace-nowrap">
          📍 Alamat
        </a>
        <a href="#section-contact" className="px-3 py-1.5 rounded-lg hover:bg-slate-100 text-slate-600 whitespace-nowrap">
          📞 Kontak
        </a>
        <a href="#section-education" className="px-3 py-1.5 rounded-lg hover:bg-slate-100 text-slate-600 whitespace-nowrap">
          🎓 Pendidikan
        </a>
        <a href="#section-career" className="px-3 py-1.5 rounded-lg hover:bg-slate-100 text-slate-600 whitespace-nowrap">
          💼 Pekerjaan
        </a>
        <a href="#section-family" className="px-3 py-1.5 rounded-lg hover:bg-slate-100 text-slate-600 whitespace-nowrap">
          👨‍👩‍👧 Keluarga
        </a>
        <a href="#section-documents" className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 font-semibold border border-blue-200 whitespace-nowrap">
          📄 Dokumen & Foto Berkas
        </a>
        {userCategories.map(cat => (
          <a
            key={cat.id}
            href={`#section-${cat.id}`}
            className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium border border-indigo-200 whitespace-nowrap"
          >
            📁 {cat.title}
          </a>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: IDENTITAS KEPENDUDUKAN (KTP) */}
      {/* ========================================================================= */}
      <section id="section-identity" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Identitas & Kependudukan (Sesuai KTP)</h2>
              <p className="text-xs text-slate-500">Data identitas utama kependudukan warga negara Republik Indonesia.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => openAddFieldModal('identity')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            + Tambah Data Identitas
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Nama Lengkap */}
          <div className="space-y-1.5 lg:col-span-2">
            <label className="block text-xs font-semibold text-slate-700">
              Nama Lengkap <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={profile?.full_name || ''}
              onChange={e => handleChange('full_name', e.target.value)}
              placeholder="Contoh: Andharu Raffi Pratama"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50/50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* NIK */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700">
                NIK (Nomor Induk Kependudukan) <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-slate-400 font-mono">16 Digit</span>
            </div>
            <input
              type="text"
              maxLength={16}
              value={profile?.nik || ''}
              onChange={e => handleChange('nik', e.target.value)}
              placeholder="351508xxxxxxxxxx"
              className="w-full px-3.5 py-2.5 text-sm font-mono bg-slate-50/50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Tempat Lahir */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Tempat Lahir</label>
            <input
              type="text"
              value={profile?.birth_place || ''}
              onChange={e => handleChange('birth_place', e.target.value)}
              placeholder="Contoh: Sidoarjo"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50/50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Tanggal Lahir */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Tanggal Lahir <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={profile?.birth_date || ''}
              onChange={e => handleChange('birth_date', e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50/50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Jenis Kelamin */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Jenis Kelamin <span className="text-rose-500">*</span>
            </label>
            <select
              value={profile?.gender || ''}
              onChange={e => handleChange('gender', e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50/50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="">-- Pilih Jenis Kelamin --</option>
              <option value="Laki-laki">Laki-laki</option>
              <option value="Perempuan">Perempuan</option>
            </select>
          </div>

          {/* Agama */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Agama</label>
            <select
              value={profile?.religion || ''}
              onChange={e => handleChange('religion', e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50/50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="">-- Pilih Agama --</option>
              <option value="Islam">Islam</option>
              <option value="Kristen Protestan">Kristen Protestan</option>
              <option value="Katolik">Katolik</option>
              <option value="Hindu">Hindu</option>
              <option value="Buddha">Buddha</option>
              <option value="Khonghucu">Khonghucu</option>
              <option value="Lainnya">Lainnya / Penghayat</option>
            </select>
          </div>

          {/* Status Perkawinan */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Status Perkawinan</label>
            <select
              value={profile?.marital_status || ''}
              onChange={e => handleChange('marital_status', e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50/50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="">-- Pilih Status Perkawinan --</option>
              <option value="Belum Kawin">Belum Kawin</option>
              <option value="Kawin">Kawin</option>
              <option value="Cerai Hidup">Cerai Hidup</option>
              <option value="Cerai Mati">Cerai Mati</option>
            </select>
          </div>

          {/* Golongan Darah */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Golongan Darah</label>
            <select
              value={profile?.blood_type || ''}
              onChange={e => handleChange('blood_type', e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50/50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="">-- Pilih Golongan Darah --</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="AB">AB</option>
              <option value="O">O</option>
              <option value="Tidak Tahu">Tidak Tahu</option>
            </select>
          </div>
        </div>

        {/* Custom Fields in Identity */}
        {renderCategoryCustomFields('identity', 'Identitas')}
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2: ALAMAT & DOMISILI */}
      {/* ========================================================================= */}
      <section id="section-address" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Alamat Lengkap & Domisili</h2>
              <p className="text-xs text-slate-500">Alamat tempat tinggal resmi sesuai dokumen kependudukan.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => openAddFieldModal('address')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            + Tambah Data Alamat
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="space-y-1.5 lg:col-span-3">
            <label className="block text-xs font-semibold text-slate-700">
              Alamat Jalan / RT / RW / No. Rumah <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              value={profile?.address || ''}
              onChange={e => handleChange('address', e.target.value)}
              placeholder="Contoh: Jl. Pahlawan No. 45 RT 02 / RW 03"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50/50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Provinsi <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={profile?.province || ''}
              onChange={e => handleChange('province', e.target.value)}
              placeholder="Contoh: Jawa Timur"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50/50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Kabupaten / Kota <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={profile?.city || ''}
              onChange={e => handleChange('city', e.target.value)}
              placeholder="Contoh: Kabupaten Sidoarjo"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50/50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Kecamatan <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={profile?.district || ''}
              onChange={e => handleChange('district', e.target.value)}
              placeholder="Contoh: Waru"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50/50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Kelurahan / Desa <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={profile?.village || ''}
              onChange={e => handleChange('village', e.target.value)}
              placeholder="Contoh: Pepelegi"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50/50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Kode Pos</label>
            <input
              type="text"
              maxLength={5}
              value={profile?.postal_code || ''}
              onChange={e => handleChange('postal_code', e.target.value)}
              placeholder="61256"
              className="w-full px-3.5 py-2.5 text-sm font-mono bg-slate-50/50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Custom Fields in Address */}
        {renderCategoryCustomFields('address', 'Alamat')}
      </section>

      {/* ========================================================================= */}
      {/* SECTION 3: KONTAK PRIBADI */}
      {/* ========================================================================= */}
      <section id="section-contact" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Kontak Pribadi</h2>
              <p className="text-xs text-slate-500">Nomor kontak dan alamat email untuk komunikasi layanan.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => openAddFieldModal('contact')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            + Tambah Data Kontak
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Nomor Telepon / WhatsApp</label>
            <input
              type="tel"
              value={profile?.phone || ''}
              onChange={e => handleChange('phone', e.target.value)}
              placeholder="Contoh: 081234567890"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50/50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Alamat Email Aktif</label>
            <input
              type="email"
              value={profile?.email || ''}
              onChange={e => handleChange('email', e.target.value)}
              placeholder="Contoh: user@email.com"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50/50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Custom Fields in Contact */}
        {renderCategoryCustomFields('contact', 'Kontak')}
      </section>

      {/* ========================================================================= */}
      {/* SECTION 4: PENDIDIKAN & AKADEMIK */}
      {/* ========================================================================= */}
      <section id="section-education" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Pendidikan & Akademik</h2>
              <p className="text-xs text-slate-500">Informasi riwayat akademik untuk formulir beasiswa atau pendaftaran universitas.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => openAddFieldModal('education')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            + Tambah Data Pendidikan
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Jenjang Pendidikan</label>
            <select
              value={profile?.education_level || ''}
              onChange={e => handleChange('education_level', e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50/50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="">-- Pilih Jenjang --</option>
              <option value="SD / Sederajat">SD / Sederajat</option>
              <option value="SMP / Sederajat">SMP / Sederajat</option>
              <option value="SMA / SMK / Sederajat">SMA / SMK / Sederajat</option>
              <option value="Diploma (D1 - D4)">Diploma (D1 - D4)</option>
              <option value="Sarjana (S1)">Sarjana (S1)</option>
              <option value="Magister (S2)">Magister (S2)</option>
              <option value="Doktoral (S3)">Doktoral (S3)</option>
            </select>
          </div>

          <div className="space-y-1.5 lg:col-span-3">
            <label className="block text-xs font-semibold text-slate-700">Nama Sekolah / Universitas</label>
            <input
              type="text"
              value={profile?.institution || ''}
              onChange={e => handleChange('institution', e.target.value)}
              placeholder="Contoh: Universitas Gadjah Mada"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50/50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="space-y-1.5 lg:col-span-2">
            <label className="block text-xs font-semibold text-slate-700">Nomor Induk Mahasiswa (NIM)</label>
            <input
              type="text"
              value={profile?.student_id || ''}
              onChange={e => handleChange('student_id', e.target.value)}
              placeholder="Contoh: 21/478921/TK/52910"
              className="w-full px-3.5 py-2.5 text-sm font-mono bg-slate-50/50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="space-y-1.5 lg:col-span-2">
            <label className="block text-xs font-semibold text-slate-700">NISN (Nomor Induk Siswa Nasional)</label>
            <input
              type="text"
              value={profile?.nisn || ''}
              onChange={e => handleChange('nisn', e.target.value)}
              placeholder="Contoh: 0041234567"
              className="w-full px-3.5 py-2.5 text-sm font-mono bg-slate-50/50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Custom Fields in Education */}
        {renderCategoryCustomFields('education', 'Pendidikan')}
      </section>

      {/* ========================================================================= */}
      {/* SECTION 5: PEKERJAAN & KARIR */}
      {/* ========================================================================= */}
      <section id="section-career" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Pekerjaan & Karir</h2>
              <p className="text-xs text-slate-500">Informasi profesi dan tempat bekerja saat ini.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => openAddFieldModal('career')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            + Tambah Data Pekerjaan
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Pekerjaan / Profesi</label>
            <input
              type="text"
              value={profile?.occupation || ''}
              onChange={e => handleChange('occupation', e.target.value)}
              placeholder="Contoh: Software Engineer / ASN"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50/50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Nama Instansi / Perusahaan</label>
            <input
              type="text"
              value={profile?.organization || ''}
              onChange={e => handleChange('organization', e.target.value)}
              placeholder="Contoh: PT Teknologi Indonesia"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50/50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Alamat Kantor / Tempat Kerja</label>
            <input
              type="text"
              value={profile?.work_address || ''}
              onChange={e => handleChange('work_address', e.target.value)}
              placeholder="Contoh: Jl. Sudirman Kav. 21, Jakarta"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50/50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Custom Fields in Career */}
        {renderCategoryCustomFields('career', 'Pekerjaan')}
      </section>

      {/* ========================================================================= */}
      {/* SECTION 6: KELUARGA & KONTAK DARURAT */}
      {/* ========================================================================= */}
      <section id="section-family" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Data Keluarga & Kontak Darurat</h2>
              <p className="text-xs text-slate-500">Data orang tua dan kontak darurat untuk kebutuhan verifikasi resmi.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => openAddFieldModal('family')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            + Tambah Data Keluarga
          </button>
        </div>

        <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-blue-800">
          <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <span>
            <b>Penting:</b> Nama ibu kandung sangat sering dibutuhkan sebagai verifikasi keamanan standar pada perbankan, beasiswa, dan instansi kependudukan.
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Nama Lengkap Ibu Kandung</label>
            <input
              type="text"
              value={profile?.mother_name || ''}
              onChange={e => handleChange('mother_name', e.target.value)}
              placeholder="Contoh: Siti Aminah"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50/50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Nama Lengkap Ayah</label>
            <input
              type="text"
              value={profile?.father_name || ''}
              onChange={e => handleChange('father_name', e.target.value)}
              placeholder="Contoh: Bambang Supriyanto"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50/50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Nama Kontak Darurat</label>
            <input
              type="text"
              value={profile?.emergency_contact_name || ''}
              onChange={e => handleChange('emergency_contact_name', e.target.value)}
              placeholder="Contoh: Rina (Saudara Kandung)"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50/50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Nomor Telepon Kontak Darurat</label>
            <input
              type="tel"
              value={profile?.emergency_contact_phone || ''}
              onChange={e => handleChange('emergency_contact_phone', e.target.value)}
              placeholder="Contoh: 081987654321"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50/50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Custom Fields in Family */}
        {renderCategoryCustomFields('family', 'Keluarga')}
      </section>

      {/* ========================================================================= */}
      {/* SECTION 7: DOKUMEN RESMI & BERKAS FOTO DOKUMEN */}
      {/* ========================================================================= */}
      <section id="section-documents" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:p-8 space-y-7">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center border border-cyan-100">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Dokumen Resmi & Berkas Foto Dokumen</h2>
              <p className="text-xs text-slate-500">Nomor dokumen negara serta berkas foto asli untuk autofill upload berkas instan.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => openAddFieldModal('documents')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            + Tambah Data Dokumen
          </button>
        </div>

        {/* Text Numbers: NPWP & BPJS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">NPWP (Nomor Pokok Wajib Pajak)</label>
            <input
              type="text"
              value={profile?.npwp || ''}
              onChange={e => handleChange('npwp', e.target.value)}
              placeholder="Contoh: 12.345.678.9-012.000 atau 16 digit NIK"
              className="w-full px-3.5 py-2.5 text-sm font-mono bg-slate-50/50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Nomor Kartu BPJS (Kesehatan / Ketenagakerjaan)</label>
            <input
              type="text"
              value={profile?.bpjs_number || ''}
              onChange={e => handleChange('bpjs_number', e.target.value)}
              placeholder="Contoh: 0001234567890"
              className="w-full px-3.5 py-2.5 text-sm font-mono bg-slate-50/50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Berkas & Foto Dokumen Asli */}
        <div className="space-y-4 pt-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Camera className="w-4 h-4 text-blue-600" />
              Unggah Berkas & Foto Dokumen (Autofill Berkas)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Foto dienkripsi dan disimpan secara lokal. Ekstensi GovConnect akan mengisikan berkas ini otomatis pada formulir web berkas.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PHOTO_DOCUMENT_SLOTS.map(slot => {
              const photo = documentPhotos[slot.id];
              const hasPhoto = !!photo?.data;

              return (
                <div
                  key={slot.id}
                  className={`rounded-2xl border transition-all p-4 flex flex-col justify-between ${
                    hasPhoto
                      ? 'bg-blue-50/30 border-blue-200 hover:border-blue-300 shadow-sm'
                      : 'bg-slate-50/70 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/20'
                  }`}
                >
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    ref={el => { fileInputRefs.current[slot.id] = el; }}
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) handleStandardPhotoUpload(slot.id, file);
                    }}
                    className="hidden"
                  />

                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${hasPhoto ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                          <slot.icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 leading-tight">{slot.title}</div>
                          <span className="text-[10px] text-blue-700 bg-blue-100/70 px-1.5 py-0.5 rounded font-medium">
                            {slot.badge}
                          </span>
                        </div>
                      </div>
                    </div>

                    {hasPhoto ? (
                      <div className="relative group rounded-xl overflow-hidden border border-blue-200 bg-white aspect-[16/10] mb-3 flex items-center justify-center">
                        <img src={photo.data} alt={slot.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => setPreviewPhoto({ title: slot.title, data: photo.data, name: photo.name })}
                            className="p-2 bg-white text-slate-800 rounded-lg hover:bg-slate-100 shadow-sm"
                            title="Lihat ukuran penuh"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => fileInputRefs.current[slot.id]?.click()}
                            className="p-2 bg-white text-blue-600 rounded-lg hover:bg-slate-100 shadow-sm"
                            title="Ganti Foto"
                          >
                            <Upload className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRefs.current[slot.id]?.click()}
                        className="w-full aspect-[16/10] mb-3 rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-400 bg-white flex flex-col items-center justify-center gap-1.5 text-slate-500 hover:text-blue-600 transition-colors p-3"
                      >
                        <Upload className="w-5 h-5 text-slate-400" />
                        <span className="text-xs font-medium">Pilih / Unggah Berkas</span>
                        <span className="text-[10px] text-slate-400">JPG, PNG, WebP</span>
                      </button>
                    )}

                    <p className="text-[11px] text-slate-500 leading-relaxed mb-3">{slot.desc}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    {hasPhoto ? (
                      <>
                        <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          {Math.round(photo.size / 1024)} KB · Siap
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => fileInputRefs.current[slot.id]?.click()}
                            className="text-[11px] text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-100/50"
                          >
                            Ganti
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveStandardPhoto(slot.id)}
                            className="text-[11px] text-rose-600 hover:text-rose-800 font-medium px-2 py-1 rounded hover:bg-rose-100/50"
                          >
                            Hapus
                          </button>
                        </div>
                      </>
                    ) : (
                      <span className="text-[10px] text-slate-400">Belum ada foto</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Custom Fields in Documents */}
        {renderCategoryCustomFields('documents', 'Dokumen Resmi')}
      </section>

      {/* ========================================================================= */}
      {/* SECTION UNTUK KATEGORI KUSTOM YANG DIBUAT SENDIRI OLEH USER */}
      {/* ========================================================================= */}
      {userCategories.map(cat => {
        const fieldsInCat = customFields.filter(f => f.category === cat.id);

        return (
          <section
            key={cat.id}
            id={`section-${cat.id}`}
            className="bg-white rounded-2xl border-2 border-indigo-200 shadow-sm p-6 lg:p-8 space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
                  <FolderPlus className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900">{cat.title}</h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                      Kategori Kustom
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{cat.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openAddFieldModal(cat.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  + Tambah Data di Kategori Ini
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteCategory(cat.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Hapus kategori ini"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {fieldsInCat.length === 0 ? (
              <div className="p-8 text-center bg-slate-50/60 rounded-xl border border-dashed border-slate-200 space-y-2">
                <p className="text-sm font-medium text-slate-700">Kategori ini belum memiliki kolom data</p>
                <button
                  type="button"
                  onClick={() => openAddFieldModal(cat.id)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-indigo-700 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tambah Data Pertama ke "{cat.title}"
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {fieldsInCat.map(field => {
                  const isEditing = editingFieldId === field.id;
                  const isImage = field.type === 'image';

                  if (isImage) {
                    return (
                      <div
                        key={field.id}
                        className="p-3.5 bg-indigo-50/30 hover:bg-indigo-50/60 rounded-xl border border-indigo-200 shadow-sm flex items-center justify-between gap-3 transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {field.photoData ? (
                            <div
                              onClick={() => setPreviewPhoto({ title: field.label, data: field.photoData!, name: field.photoName || field.value })}
                              className="w-12 h-12 rounded-lg bg-slate-100 border border-indigo-200 overflow-hidden cursor-pointer flex-shrink-0 relative group"
                            >
                              <img src={field.photoData} alt={field.label} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                                <Eye className="w-3.5 h-3.5" />
                              </div>
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
                              <Camera className="w-6 h-6" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-900 truncate">{field.label}</span>
                              <span className="text-[9px] font-mono text-indigo-700 bg-indigo-100/70 px-1.5 py-0.5 rounded">
                                {field.key}
                              </span>
                            </div>
                            <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                              <FileCheck2 className="w-3 h-3" />
                              {field.photoName || field.value} {field.photoSize ? `(${Math.round(field.photoSize / 1024)} KB)` : ''} · Berkas Siap
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          {field.photoData && (
                            <button
                              type="button"
                              onClick={() => setPreviewPhoto({ title: field.label, data: field.photoData!, name: field.photoName || field.value })}
                              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg"
                              title="Lihat foto"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteField(field.id, field.key)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  }

                  if (isEditing) {
                    return (
                      <div key={field.id} className="p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-300 space-y-2.5">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-semibold text-slate-600">Label</label>
                            <input
                              type="text"
                              value={editLabel}
                              onChange={e => setEditLabel(e.target.value)}
                              className="w-full px-2.5 py-1 text-xs bg-white border border-slate-300 rounded"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold text-slate-600">Kunci</label>
                            <input
                              type="text"
                              value={editKey}
                              onChange={e => setEditKey(slugify(e.target.value))}
                              className="w-full px-2.5 py-1 text-xs font-mono bg-white border border-slate-300 rounded"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-slate-600">Nilai</label>
                          <input
                            type="text"
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            className="w-full px-2.5 py-1 text-xs bg-white border border-slate-300 rounded"
                          />
                        </div>
                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setEditingFieldId(null)}
                            className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-200/60 rounded"
                          >
                            Batal
                          </button>
                          <button
                            type="button"
                            onClick={() => saveEditField(field.id)}
                            className="px-3 py-1 text-xs font-medium bg-indigo-600 text-white rounded hover:bg-indigo-700"
                          >
                            Simpan
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={field.id}
                      className="p-3.5 bg-white rounded-xl border border-slate-200 hover:border-slate-300 shadow-sm flex items-center justify-between gap-3 transition-all"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 truncate">{field.label}</span>
                          <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                            {field.key}
                          </span>
                        </div>
                        <div className="text-sm font-medium text-slate-700 truncate">{field.value}</div>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCopy(field.value, field.id)}
                          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Salin nilai"
                        >
                          {copiedKey === field.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => startEditField(field)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteField(field.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}

      {/* Floating Bottom Bar */}
      <div className="fixed bottom-6 right-8 z-30 flex items-center gap-3 bg-white/95 backdrop-blur-md px-5 py-3 rounded-2xl border border-slate-200 shadow-xl">
        <div className="hidden sm:block text-right">
          <div className="text-xs font-semibold text-slate-800">
            {hasUnsavedChanges ? 'Perubahan belum disimpan' : 'Semua data tersimpan aman'}
          </div>
          <div className="text-[10px] text-slate-400">Tekan Simpan atau shortcut Ctrl+S</div>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-sm rounded-xl shadow-md transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Menyimpan...' : 'Simpan Semua Perubahan'}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: TAMBAH DATA KUSTOM KE DALAM KATEGORI */}
      {/* Dilengkapi Banyak Opsi (Kolom / Gambar / Tanggal / Catatan) */}
      {/* Serta Tombol Buat Kategori Baru Langsung di Dalam Form Ini */}
      {/* ========================================================================= */}
      {showAddFieldModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200 my-8">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Tambah Data Kustom</h3>
                  <p className="text-xs text-slate-500">Pilih opsi format isian: teks, gambar/foto dokumen, tanggal, atau catatan.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddFieldModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* SELEKTOR KATEGORI + TOMBOL BUAT KATEGORI BARU LANGSUNG DI FORM INI */}
            <div className="space-y-2 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">Kategori Penempatan Data</label>
                <button
                  type="button"
                  onClick={() => setShowInlineCategoryCreator(!showInlineCategoryCreator)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-white hover:bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 shadow-2xs transition-colors"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  {showInlineCategoryCreator ? 'Tutup Kategori Baru' : '+ Buat Kategori Baru'}
                </button>
              </div>

              {/* Inline Form Pembuatan Kategori Baru */}
              {showInlineCategoryCreator ? (
                <div className="p-3 bg-white rounded-xl border border-blue-300 shadow-sm space-y-2.5 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                      <FolderPlus className="w-3.5 h-3.5 text-blue-600" />
                      Nama Kategori Baru Anda:
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowInlineCategoryCreator(false)}
                      className="text-[11px] text-slate-400 hover:text-slate-600"
                    >
                      Batal
                    </button>
                  </div>
                  <input
                    type="text"
                    value={inlineCategoryTitle}
                    onChange={e => setInlineCategoryTitle(e.target.value)}
                    placeholder="Misal: Kendaraan Pribadi / Finansial / Asuransi"
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    value={inlineCategoryDesc}
                    onChange={e => setInlineCategoryDesc(e.target.value)}
                    placeholder="Keterangan singkat kategori (opsional)"
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleCreateCategoryInline}
                      disabled={!inlineCategoryTitle.trim()}
                      className="px-3.5 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 shadow-sm"
                    >
                      Simpan & Pilih Kategori Ini
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <select
                    value={targetCategory}
                    onChange={e => {
                      if (e.target.value === '__create_new__') {
                        setShowInlineCategoryCreator(true);
                      } else {
                        setTargetCategory(e.target.value);
                      }
                    }}
                    className="w-full px-3 py-2 text-xs font-medium bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-8 cursor-pointer"
                  >
                    {allCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.isCustom ? `📁 [Kategori Kustom] ${cat.title}` : `📍 ${cat.title}`}
                      </option>
                    ))}
                    <option value="__create_new__">✨ + Buat Kategori Baru Sendiri...</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              )}
            </div>

            {/* BANYAK OPSI TIPE DATA: KOLOM TEKS, BERKAS FOTO, TANGGAL, TEKS PANJANG */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Pilih Tipe / Format Isian Data:</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setNewFieldType('text')}
                  className={`p-2.5 rounded-xl border text-left transition-all flex flex-col items-center sm:items-start gap-1.5 ${
                    newFieldType === 'text'
                      ? 'bg-blue-50 border-blue-600 text-blue-800 shadow-2xs ring-1 ring-blue-500'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <span className="p-1 rounded-lg bg-blue-100 text-blue-700"><FileText className="w-4 h-4" /></span>
                  <span className="text-xs font-bold">Kolom Teks</span>
                  <span className="text-[10px] text-slate-400 hidden sm:inline">Angka / huruf biasa</span>
                </button>

                <button
                  type="button"
                  onClick={() => setNewFieldType('image')}
                  className={`p-2.5 rounded-xl border text-left transition-all flex flex-col items-center sm:items-start gap-1.5 ${
                    newFieldType === 'image'
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-800 shadow-2xs ring-1 ring-emerald-500'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <span className="p-1 rounded-lg bg-emerald-100 text-emerald-700"><Camera className="w-4 h-4" /></span>
                  <span className="text-xs font-bold">Berkas / Foto</span>
                  <span className="text-[10px] text-slate-400 hidden sm:inline">Autofill unggah file</span>
                </button>

                <button
                  type="button"
                  onClick={() => setNewFieldType('date')}
                  className={`p-2.5 rounded-xl border text-left transition-all flex flex-col items-center sm:items-start gap-1.5 ${
                    newFieldType === 'date'
                      ? 'bg-amber-50 border-amber-600 text-amber-800 shadow-2xs ring-1 ring-amber-500'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <span className="p-1 rounded-lg bg-amber-100 text-amber-700"><Calendar className="w-4 h-4" /></span>
                  <span className="text-xs font-bold">Tanggal</span>
                  <span className="text-[10px] text-slate-400 hidden sm:inline">Masa berlaku / tgl</span>
                </button>

                <button
                  type="button"
                  onClick={() => setNewFieldType('textarea')}
                  className={`p-2.5 rounded-xl border text-left transition-all flex flex-col items-center sm:items-start gap-1.5 ${
                    newFieldType === 'textarea'
                      ? 'bg-purple-50 border-purple-600 text-purple-800 shadow-2xs ring-1 ring-purple-500'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <span className="p-1 rounded-lg bg-purple-100 text-purple-700"><AlignLeft className="w-4 h-4" /></span>
                  <span className="text-xs font-bold">Teks Panjang</span>
                  <span className="text-[10px] text-slate-400 hidden sm:inline">Catatan / alamat</span>
                </button>
              </div>
            </div>

            {/* BANYAK PILIHAN SARAN CEPAT / PRESET SESUAI KATEGORI & TIPE */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-600 block">Saran Rekomendasi Populer (Klik untuk mengisi):</span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                {(RICH_CATEGORY_PRESETS[targetCategory] || RICH_CATEGORY_PRESETS.other).map(preset => (
                  <button
                    key={preset.key}
                    type="button"
                    onClick={() => applyPresetToModal(preset)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border transition-colors ${
                      preset.type === 'image'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-blue-50 hover:text-blue-700'
                    }`}
                  >
                    <span>{preset.type === 'image' ? '🖼️' : preset.type === 'date' ? '📅' : '📝'}</span>
                    <span>{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSaveNewField} className="space-y-4 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Nama Data / Label</label>
                  <input
                    type="text"
                    value={newLabel}
                    onChange={e => handleLabelChange(e.target.value)}
                    placeholder={newFieldType === 'image' ? 'Contoh: Foto SIM C / STNK' : 'Contoh: Nomor Rekening BCA'}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">Kunci Atribut</label>
                    <span className="text-[10px] text-slate-400 font-mono">Untuk autofill</span>
                  </div>
                  <input
                    type="text"
                    value={newKey}
                    onChange={e => setNewKey(slugify(e.target.value))}
                    placeholder="nomor_rekening"
                    className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* INPUT NILAI SESUAI TIPE DATA YANG DIPILIH */}
              {newFieldType === 'image' ? (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                    <span>Pilih Berkas / Foto Gambar</span>
                    <span className="text-[10px] text-slate-400">JPG, PNG, WebP</span>
                  </label>

                  <input
                    type="file"
                    accept="image/*"
                    ref={modalPhotoInputRef}
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) handleModalPhotoSelected(file);
                    }}
                    className="hidden"
                  />

                  {newPhotoData ? (
                    <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <img
                          src={newPhotoData.data}
                          alt="Preview"
                          className="w-14 h-14 object-cover rounded-lg border border-blue-200 flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-slate-900 truncate">{newPhotoData.name}</div>
                          <div className="text-[11px] text-emerald-700 font-medium">
                            {Math.round(newPhotoData.size / 1024)} KB · Siap diisi ke form web
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => modalPhotoInputRef.current?.click()}
                        className="px-3 py-1.5 text-xs font-semibold bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-slate-700"
                      >
                        Ganti Berkas
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => modalPhotoInputRef.current?.click()}
                      className="w-full py-6 rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-400 bg-slate-50/60 hover:bg-blue-50/30 flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                        <Upload className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-slate-700">Pilih Berkas Foto dari Komputer</span>
                      <span className="text-[10px] text-slate-400">Foto akan otomatis dikompresi dan siap untuk autofill berkas</span>
                    </button>
                  )}
                </div>
              ) : newFieldType === 'date' ? (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Pilih Tanggal</label>
                  <input
                    type="date"
                    value={newValue}
                    onChange={e => setNewValue(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ) : newFieldType === 'textarea' ? (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Nilai Isian Teks Panjang</label>
                  <textarea
                    rows={3}
                    value={newValue}
                    onChange={e => setNewValue(e.target.value)}
                    placeholder="Masukkan rincian alamat, catatan, atau informasi panjang..."
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Nilai Isian Kolom</label>
                  <input
                    type="text"
                    value={newValue}
                    onChange={e => setNewValue(e.target.value)}
                    placeholder="Contoh: 123-456-7890 / B 1234 XYZ"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {fieldError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {fieldError}
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddFieldModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm"
                >
                  Tambahkan ke Profil
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: BUAT KATEGORI BARU STANDALONE */}
      {/* ========================================================================= */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <FolderPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Buat Kategori Baru</h3>
                  <p className="text-xs text-slate-500">Kelompokkan data khusus sesuai kebutuhan Anda</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCategoryModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCategoryStandalone} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Nama Kategori</label>
                <input
                  type="text"
                  value={newCategoryTitle}
                  onChange={e => setNewCategoryTitle(e.target.value)}
                  placeholder="Contoh: Kendaraan Pribadi / Finansial / Asuransi"
                  className="w-full px-3 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Keterangan Singkat (Opsional)</label>
                <input
                  type="text"
                  value={newCategoryDesc}
                  onChange={e => setNewCategoryDesc(e.target.value)}
                  placeholder="Contoh: Data plat nomor, nomor mesin, dan STNK"
                  className="w-full px-3 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {categoryError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {categoryError}
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddCategoryModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm"
                >
                  Buat Kategori
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* LIGHTBOX MODAL: PREVIEW FOTO DOKUMEN UKURAN PENUH */}
      {/* ========================================================================= */}
      {previewPhoto && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div>
                <h4 className="text-sm font-bold text-slate-900">{previewPhoto.title}</h4>
                <p className="text-xs text-slate-500">{previewPhoto.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center max-h-[70vh]">
              <img
                src={previewPhoto.data}
                alt={previewPhoto.title}
                className="max-h-[70vh] w-auto object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}