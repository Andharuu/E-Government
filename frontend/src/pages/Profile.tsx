import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { profileApi, type Profile } from '../services/api';
import type {
  CustomFieldType,
  CustomFieldItem,
  UserCategory,
  DocumentPhoto,
  DocumentPhotosMap,
} from '../types/profile';
import {
  STANDARD_CATEGORIES,
  PHOTO_DOCUMENT_SLOTS,
  RICH_CATEGORY_PRESETS,
  type RichPreset,
} from '../constants/profilePresets';
import { compressImage } from '../utils/image';
import {
  User,
  MapPin,
  Phone,
  GraduationCap,
  Building2,
  Heart,
  FileText,
  Folder,
  FolderPlus,
  Search,
  Copy,
  Check,
  Camera,
  UploadCloud,
  Eye,
  Trash2,
  Edit3,
  Plus,
  CheckCircle2,
  AlertCircle,
  X,
  Layers,
  Save,
  Sparkles,
} from 'lucide-react';

export type {
  CustomFieldType,
  CustomFieldItem,
  UserCategory,
  DocumentPhoto,
  DocumentPhotosMap,
  RichPreset,
};

const ALL_CATEGORY_FIELD_KEYS: Record<string, string[]> = {
  identity: [
    'full_name', 'nik', 'birth_place', 'birth_date', 'age', 'gender', 'religion',
    'marital_status', 'blood_type', 'title', 'first_name', 'middle_initial', 'last_name'
  ],
  address: [
    'address', 'address_line_2', 'rt_rw', 'village', 'district', 'city',
    'province', 'postal_code', 'country'
  ],
  contact: [
    'phone', 'email', 'home_phone', 'work_telephone', 'fax', 'website'
  ],
  education: [
    'education_level', 'institution', 'major_field', 'student_id', 'nisn', 'gpa_score'
  ],
  career: [
    'occupation', 'organization', 'work_address', 'income'
  ],
  family: [
    'mother_name', 'father_name', 'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relation'
  ],
  documents: [
    'npwp', 'bpjs_number', 'driver_license'
  ],
};

const CATEGORY_ICON_COMPONENT: Record<string, typeof User> = {
  identity: User,
  address: MapPin,
  contact: Phone,
  education: GraduationCap,
  career: Building2,
  family: Heart,
  documents: FileText,
};

// Global anchors used by Layout search index
const SECTION_ANCHOR_BY_CATEGORY: Record<string, string> = {
  identity: 'section-identity',
  address: 'section-address',
  contact: 'section-contact',
  documents: 'section-documents',
  education: 'section-education',
  career: 'section-occupation',
};

const CATEGORY_BY_ANCHOR: Record<string, string> = {
  'section-identity': 'identity',
  'section-address': 'address',
  'section-contact': 'contact',
  'section-documents': 'documents',
  'section-education': 'education',
  'section-occupation': 'career',
};

const sectionIdFor = (catId: string) => SECTION_ANCHOR_BY_CATEGORY[catId] ?? `section-${catId}`;

function getSmartAliasSuggestions(label: string, key: string, presetAliases?: string[]): string[] {
  const set = new Set<string>();
  if (presetAliases && Array.isArray(presetAliases)) {
    presetAliases.forEach(a => {
      const clean = a.toLowerCase().trim();
      if (clean) set.add(clean);
    });
  }
  const cleanKey = key.toLowerCase().trim();
  if (cleanKey) {
    set.add(cleanKey);
    if (cleanKey.includes('_')) {
      set.add(cleanKey.replace(/_/g, ' '));
    }
  }
  const cleanLabel = label.toLowerCase().trim();
  if (cleanLabel) {
    set.add(cleanLabel);
    const words = cleanLabel.split(/[\s_-]+/);
    words.forEach(w => {
      if (w.length > 2) set.add(w);
    });
  }

  const lower = `${cleanLabel} ${cleanKey}`.toLowerCase();
  if (lower.includes('paspor') || lower.includes('passport')) {
    ['paspor', 'passport', 'no_paspor', 'passport_number', 'passport_no', 'pass_no'].forEach(x => set.add(x));
  }
  if (lower.includes('rekening') || lower.includes('bank') || lower.includes('account')) {
    ['rekening', 'nomor_rekening', 'no_rekening', 'account_number', 'bank_account', 'acc_number'].forEach(x => set.add(x));
  }
  if (lower.includes('sim') || lower.includes('driving')) {
    ['sim', 'no_sim', 'nomor_sim', 'driving_license', 'driver_license', 'sim_a', 'sim_c'].forEach(x => set.add(x));
  }
  if (lower.includes('plat') || lower.includes('kendaraan') || lower.includes('vehicle') || lower.includes('nopol')) {
    ['plat', 'plat_nomor', 'nopol', 'nomor_polisi', 'license_plate', 'plat_kendaraan'].forEach(x => set.add(x));
  }
  if (lower.includes('stnk')) {
    ['stnk', 'nomor_stnk', 'no_stnk', 'vehicle_registration'].forEach(x => set.add(x));
  }
  if (lower.includes('bpkb')) {
    ['bpkb', 'nomor_bpkb', 'no_bpkb'].forEach(x => set.add(x));
  }
  if (lower.includes('npwp') || lower.includes('tax')) {
    ['npwp', 'nomor_npwp', 'tax_id', 'tin'].forEach(x => set.add(x));
  }
  if (lower.includes('bpjs')) {
    ['bpjs', 'no_bpjs', 'nomor_bpjs', 'bpjs_ketenagakerjaan', 'bpjs_kesehatan'].forEach(x => set.add(x));
  }
  if (lower.includes('nip') || lower.includes('pegawai') || lower.includes('employee')) {
    ['nip', 'nomor_induk_pegawai', 'employee_id', 'id_pegawai'].forEach(x => set.add(x));
  }
  if (lower.includes('nisn') || lower.includes('siswa')) {
    ['nisn', 'nomor_induk_siswa_nasional', 'student_id'].forEach(x => set.add(x));
  }
  if (lower.includes('nim') || lower.includes('mahasiswa')) {
    ['nim', 'nomor_induk_mahasiswa', 'student_id'].forEach(x => set.add(x));
  }
  if (lower.includes('ijazah') || lower.includes('diploma') || lower.includes('degree')) {
    ['ijazah', 'nomor_ijazah', 'no_ijazah', 'diploma_number', 'degree_certificate'].forEach(x => set.add(x));
  }
  if (lower.includes('linkedin')) {
    ['linkedin', 'linkedin_url', 'profil_linkedin', 'profile_linkedin'].forEach(x => set.add(x));
  }
  if (lower.includes('github')) {
    ['github', 'github_url', 'profil_github', 'github_profile'].forEach(x => set.add(x));
  }
  if (lower.includes('darurat') || lower.includes('emergency')) {
    ['kontak_darurat', 'emergency_contact', 'emergency_phone'].forEach(x => set.add(x));
  }
  if (lower.includes('wa') || lower.includes('whatsapp')) {
    ['whatsapp', 'wa', 'no_wa', 'nomor_whatsapp', 'wa_number'].forEach(x => set.add(x));
  }

  return Array.from(set).filter(s => s.trim().length > 0);
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

  // Active Category State
  const [activeCategoryId, setActiveCategoryId] = useState<string>('identity');
  const [categorySearchQuery, setCategorySearchQuery] = useState('');

  // Modal Custom Field
  const [showAddFieldModal, setShowAddFieldModal] = useState(false);
  const [targetCategory, setTargetCategory] = useState('identity');
  const [newFieldType, setNewFieldType] = useState<CustomFieldType>('text');
  const [newLabel, setNewLabel] = useState('');
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newAliases, setNewAliases] = useState('');
  const [suggestedAliases, setSuggestedAliases] = useState<string[]>([]);
  const [newPhotoData, setNewPhotoData] = useState<DocumentPhoto | null>(null);
  const [fieldError, setFieldError] = useState('');

  // Modal Category Standalone
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryTitle, setNewCategoryTitle] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');
  const [categoryError, setCategoryError] = useState('');

  // Inline Editing Custom Field State
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editKey, setEditKey] = useState('');
  const [editValue, setEditValue] = useState('');
  const [editAliases, setEditAliases] = useState('');

  // Image Preview Lightbox Modal
  const [previewPhoto, setPreviewPhoto] = useState<{ title: string; data: string; name: string } | null>(null);

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const modalPhotoInputRef = useRef<HTMLInputElement | null>(null);
  const isSavingRef = useRef(false);
  const lastSaveTimestampRef = useRef<number>(0);

  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  };

  const handleLabelChange = (val: string) => {
    setNewLabel(val);
    const generatedKey = slugify(val);
    let targetKey = newKey;
    if (!newKey || newKey === slugify(newLabel)) {
      targetKey = generatedKey;
      setNewKey(generatedKey);
    }
    const suggestions = getSmartAliasSuggestions(val, targetKey);
    setSuggestedAliases(suggestions);
  };

  // Warning before leave
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    profileApi.get()
      .then(res => {
        const data = res.data;
        setProfile(data);

        // Parse custom_fields
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
                  aliases: Array.isArray(item.aliases) ? item.aliases : undefined,
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
    if (key === 'nik') {
      value = value.replace(/\D/g, '').slice(0, 16);
    }
    setProfile(prev => {
      if (!prev) return null;
      const updated = { ...prev, [key]: value };
      if (key === 'full_name' && value.trim()) {
        const parts = value.trim().split(/\s+/);
        if (!updated.first_name) updated.first_name = parts[0] || '';
        if (!updated.last_name) updated.last_name = parts.slice(1).join(' ') || parts[0] || '';
      }
      if (key === 'birth_date' && value) {
        const parts = value.split('-');
        if (parts.length === 3) {
          const birthYear = parseInt(parts[0], 10);
          const birthMonth = parseInt(parts[1], 10) - 1;
          const birthDay = parseInt(parts[2], 10);
          const today = new Date();
          let calculatedAge = today.getFullYear() - birthYear;
          const m = today.getMonth() - birthMonth;
          if (m < 0 || (m === 0 && today.getDate() < birthDay)) {
            calculatedAge--;
          }
          if (calculatedAge >= 0 && !isNaN(calculatedAge)) {
            updated.age = String(calculatedAge);
          }
        }
      }
      return updated;
    });
    setHasUnsavedChanges(true);
  };

  const getExtendedField = useCallback((key: string, defaultVal: string = '') => {
    if (profile && (profile as unknown as Record<string, unknown>)[key] !== undefined && (profile as unknown as Record<string, unknown>)[key] !== null && String((profile as unknown as Record<string, unknown>)[key]).trim() !== '') {
      return String((profile as unknown as Record<string, unknown>)[key]);
    }
    const cf = customFields.find(f => f.key === key);
    return cf?.value !== undefined && cf?.value !== null ? cf.value : defaultVal;
  }, [profile, customFields]);

  const handleExtendedChange = (key: string, value: string, category: string, label: string, type: CustomFieldType = 'text') => {
    setProfile(prev => {
      if (!prev) return null;
      const updated = { ...prev, [key]: value };
      if (key === 'first_name' || key === 'last_name') {
        const fn = key === 'first_name' ? value : (updated.first_name || '');
        const ln = key === 'last_name' ? value : (updated.last_name || '');
        const mi = getExtendedField('middle_initial');
        if (fn || ln) {
          updated.full_name = [fn, mi ? `${mi}.` : '', ln].filter(Boolean).join(' ');
        }
      }
      return updated;
    });

    setCustomFields(prev => {
      const exists = prev.some(f => f.key === key);
      if (exists) {
        return prev.map(f => f.key === key ? { ...f, value } : f);
      } else {
        return [
          ...prev,
          {
            id: `cf_${key}_${Date.now()}`,
            category,
            key,
            label,
            value,
            type,
          }
        ];
      }
    });

    setHasUnsavedChanges(true);
  };

  // Upload Foto Dokumen Resmi
  const handleStandardPhotoUpload = async (slotId: string, file: File) => {
    try {
      const compressed = await compressImage(file);
      setDocumentPhotos(prev => ({
        ...prev,
        [slotId]: compressed,
      }));
      setHasUnsavedChanges(true);
      setMessage({ type: 'success', text: `Berkas ${file.name} berhasil dimuat.` });
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

  // Upload Foto untuk Modal
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

  const openAddFieldModal = (categoryId: string) => {
    setTargetCategory(categoryId);
    setNewFieldType('text');
    setNewLabel('');
    setNewKey('');
    setNewValue('');
    setNewAliases('');
    setSuggestedAliases([]);
    setNewPhotoData(null);
    setFieldError('');
    setShowAddFieldModal(true);
  };

  const applyPresetToModal = (preset: RichPreset) => {
    setNewFieldType(preset.type);
    setNewLabel(preset.label);
    setNewKey(preset.key);
    setNewValue(preset.type === 'image' ? '' : (preset.placeholder || ''));
    setNewPhotoData(null);
    setFieldError('');

    const suggestions = getSmartAliasSuggestions(preset.label, preset.key, preset.aliases);
    setSuggestedAliases(suggestions);
    setNewAliases(preset.aliases && preset.aliases.length > 0 ? preset.aliases.join(', ') : suggestions.slice(0, 4).join(', '));
  };

  const handleSaveNewField = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError('');
    const trimmedLabel = newLabel.trim();
    const finalKey = (newKey.trim() || slugify(trimmedLabel)).trim();

    if (!trimmedLabel) {
      setFieldError('Nama data wajib diisi.');
      return;
    }
    if (!finalKey) {
      setFieldError('Kunci atribut tidak boleh kosong.');
      return;
    }

    if (newFieldType === 'image') {
      if (!newPhotoData?.data) {
        setFieldError('Silakan pilih berkas gambar foto.');
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

    const parsedAliases = newAliases
      .split(/[,;\n]+/)
      .map(s => s.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/^_+|_+$/g, ''))
      .filter(Boolean);
    const finalAliases = Array.from(new Set([finalKey, ...parsedAliases]));

    const newItem: CustomFieldItem = {
      id: `cf_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      category: targetCategory,
      key: finalKey,
      label: trimmedLabel,
      value: newFieldType === 'image' ? (newPhotoData?.name || 'document.jpg') : newValue.trim(),
      type: newFieldType,
      aliases: finalAliases,
      photoData: newFieldType === 'image' ? newPhotoData?.data : undefined,
      photoName: newFieldType === 'image' ? newPhotoData?.name : undefined,
      photoSize: newFieldType === 'image' ? newPhotoData?.size : undefined,
    };

    setCustomFields(prev => [...prev, newItem]);

    if (newFieldType === 'image' && newPhotoData) {
      setDocumentPhotos(prev => ({
        ...prev,
        [finalKey]: newPhotoData,
      }));
    }

    setShowAddFieldModal(false);
    setHasUnsavedChanges(true);
  };

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
      description: newCategoryDesc.trim() || 'Kategori data kustom pengguna',
    };

    setUserCategories(prev => [...prev, newCat]);
    setShowAddCategoryModal(false);
    setNewCategoryTitle('');
    setNewCategoryDesc('');
    setActiveCategoryId(catId);
    setHasUnsavedChanges(true);
  };

  const handleDeleteCategory = (catId: string) => {
    if (!confirm('Hapus kategori kustom ini beserta semua data di dalamnya?')) return;
    setUserCategories(prev => prev.filter(c => c.id !== catId));
    setCustomFields(prev => prev.filter(f => f.category !== catId));
    setActiveCategoryId('identity');
    setHasUnsavedChanges(true);
  };

  const startEditField = (field: CustomFieldItem) => {
    setEditingFieldId(field.id);
    setEditLabel(field.label);
    setEditKey(field.key);
    setEditValue(field.value);
    setEditAliases((field.aliases || []).join(', '));
  };

  const saveEditField = (id: string) => {
    if (!editLabel.trim() || !editKey.trim() || !editValue.trim()) return;
    const parsedAliases = editAliases
      .split(/[,;\n]+/)
      .map(s => s.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/^_+|_+$/g, ''))
      .filter(Boolean);
    const finalAliases = Array.from(new Set([editKey.trim(), ...parsedAliases]));

    setCustomFields(prev =>
      prev.map(f =>
        f.id === id
          ? {
            ...f,
            label: editLabel.trim(),
            key: editKey.trim(),
            value: editValue.trim(),
            aliases: finalAliases,
          }
          : f
      )
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

  // Save profile to backend
  const handleSave = useCallback(async () => {
    if (isSavingRef.current || !profile) return;
    const now = Date.now();
    if (now - lastSaveTimestampRef.current < 800 && lastSaveTimestampRef.current !== 0) {
      return;
    }
    lastSaveTimestampRef.current = now;
    isSavingRef.current = true;
    setSaving(true);
    setMessage(null);

    try {
      if (profile.nik && profile.nik.trim()) {
        const cleanNik = profile.nik.trim();
        if (!/^\d{16}$/.test(cleanNik)) {
          setMessage({
            type: 'error',
            text: 'Format NIK tidak valid. Nomor Induk Kependudukan (NIK) harus terdiri tepat dari 16 digit angka.',
          });
          setSaving(false);
          isSavingRef.current = false;
          return;
        }
      }

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

      try {
        localStorage.setItem('govconnect_profile_updated_at', Date.now().toString());
        window.postMessage({ type: 'GOVCONNECT_PROFILE_UPDATED', profile: res.data }, window.location.origin);
      } catch (storageErr) {
        console.warn('Gagal sinkronisasi event ekstensi:', storageErr);
      }

      setMessage({ type: 'success', text: 'Semua perubahan data profil berhasil disimpan.' });
      setTimeout(() => setMessage(null), 4000);
    } catch (err: unknown) {
      console.error('Error saving profile:', err);
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setMessage({ type: 'error', text: detail || 'Gagal menyimpan profil. Silakan coba kembali.' });
    } finally {
      isSavingRef.current = false;
      setSaving(false);
    }
  }, [profile, customFields, userCategories, documentPhotos]);

  const handleResetChanges = useCallback(async () => {
    try {
      setLoading(true);
      const res = await profileApi.get();
      const data = res.data;
      setProfile(data);
      if (data.custom_fields) {
        try {
          const parsed = typeof data.custom_fields === 'string'
            ? JSON.parse(data.custom_fields)
            : data.custom_fields;
          if (Array.isArray(parsed)) {
            setCustomFields(parsed);
          } else if (parsed && typeof parsed === 'object') {
            if (Array.isArray(parsed.categories)) setUserCategories(parsed.categories);
            if (Array.isArray(parsed.fields)) setCustomFields(parsed.fields);
          }
        } catch (e) {
          console.error('Failed to parse custom fields on reset:', e);
        }
      }
      if (data.document_photos) {
        try {
          const parsedPhotos = typeof data.document_photos === 'string'
            ? JSON.parse(data.document_photos)
            : data.document_photos;
          if (parsedPhotos && typeof parsedPhotos === 'object') {
            setDocumentPhotos(parsedPhotos);
          }
        } catch (e) {
          console.error('Failed to parse document photos on reset:', e);
        }
      }
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error('Error resetting changes:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Keyboard shortcut: Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (e.repeat || isSavingRef.current) return;
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  const isKeyFilled = useCallback((key: string): boolean => {
    const extVal = getExtendedField(key);
    if (extVal && extVal.trim() !== '') return true;
    const rawVal = profile ? (profile as unknown as Record<string, unknown>)[key] : null;
    return Boolean(rawVal && String(rawVal).trim() !== '');
  }, [profile, getExtendedField]);

  // Kelengkapan Profil (Completeness)
  const completeness = useMemo(() => {
    if (!profile) return { percentage: 0, filled: 0, total: 0 };
    const allStandardKeys = Object.values(ALL_CATEGORY_FIELD_KEYS).flat();
    let filledCount = 0;

    allStandardKeys.forEach(k => {
      if (isKeyFilled(k)) filledCount++;
    });

    PHOTO_DOCUMENT_SLOTS.forEach(slot => {
      if (documentPhotos[slot.id]?.data) filledCount++;
    });

    const standardKeySet = new Set(allStandardKeys);
    const extraCustomFields = customFields.filter(f => !standardKeySet.has(f.key));
    extraCustomFields.forEach(cf => {
      if (cf.type === 'image' ? Boolean(cf.photoData) : Boolean(cf.value && cf.value.trim() !== '')) {
        filledCount++;
      }
    });

    const totalTracked = allStandardKeys.length + PHOTO_DOCUMENT_SLOTS.length + extraCustomFields.length;
    const percentage = totalTracked > 0 ? Math.round((filledCount / totalTracked) * 100) : 0;
    return { percentage, filled: filledCount, total: totalTracked };
  }, [profile, customFields, documentPhotos, isKeyFilled]);

  // Hitung jumlah data per kategori
  const getCategoryStats = useCallback((catId: string) => {
    if (!profile) return { filled: 0, total: 0 };
    let filled = 0;
    let total = 0;

    const standardKeys = ALL_CATEGORY_FIELD_KEYS[catId] || [];
    standardKeys.forEach(k => {
      total++;
      if (isKeyFilled(k)) filled++;
    });

    if (catId === 'documents') {
      PHOTO_DOCUMENT_SLOTS.forEach(slot => {
        total++;
        if (documentPhotos[slot.id]?.data) filled++;
      });
    }

    const standardKeySet = new Set(Object.values(ALL_CATEGORY_FIELD_KEYS).flat());
    const extraCustomFields = customFields.filter(f => f.category === catId && !standardKeySet.has(f.key));
    extraCustomFields.forEach(f => {
      total++;
      if (f.type === 'image' ? Boolean(f.photoData) : Boolean(f.value?.trim())) filled++;
    });

    return { filled, total };
  }, [profile, customFields, documentPhotos, isKeyFilled]);

  // Semua kategori yang tersedia
  const allCategories = useMemo(() => {
    return [
      ...STANDARD_CATEGORIES.map(c => ({
        id: c.id,
        title: c.title,
        desc: c.desc,
        IconComp: CATEGORY_ICON_COMPONENT[c.id] || Folder,
        isCustom: false,
      })),
      ...userCategories.map(c => ({
        id: c.id,
        title: c.title,
        desc: c.description,
        IconComp: Folder,
        isCustom: true,
      }))
    ];
  }, [userCategories]);

  // Filter kategori berdasarkan pencarian
  const filteredCategories = useMemo(() => {
    if (!categorySearchQuery.trim()) return allCategories;
    const q = categorySearchQuery.toLowerCase();
    return allCategories.filter(c =>
      c.title.toLowerCase().includes(q) ||
      c.desc.toLowerCase().includes(q)
    );
  }, [allCategories, categorySearchQuery]);

  // Sinkronisasi anchor global (#section-identity, ...)
  useEffect(() => {
    const syncFromHash = () => {
      const hash = window.location.hash.replace(/^#/, '');
      if (!hash) return;
      const catId = CATEGORY_BY_ANCHOR[hash] ?? (hash.startsWith('section-') ? hash.slice(8) : '');
      if (!catId) return;
      setActiveCategoryId(catId);
      window.setTimeout(() => {
        document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
    };
    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, [loading]);

  // Render input field reusable dengan 48px height, WCAG AA contrast, copy button
  const renderField = (
    label: string,
    key: string,
    value: string,
    onValueChange: (val: string) => void,
    options?: {
      placeholder?: string;
      type?: 'text' | 'date' | 'select' | 'textarea';
      selectOptions?: string[];
      isPii?: boolean;
      badge?: string;
    }
  ) => {
    const type = options?.type ?? 'text';
    const fieldId = `field-${key}`;
    const placeholder = options?.placeholder || `Masukkan ${label.toLowerCase()}...`;
    const isCopied = copiedKey === key;

    return (
      <div className="space-y-1.5" key={key}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <label htmlFor={fieldId} className="text-xs font-semibold text-ink truncate">
              {label}
            </label>
            {options?.badge && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-surface-2 border border-line text-ink-3">
                {options.badge}
              </span>
            )}
          </div>
          {value && (
            <button
              type="button"
              onClick={() => handleCopy(value, key)}
              title="Salin nilai ke clipboard"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-ink-3 hover:text-accent-text transition-colors cursor-pointer"
            >
              {isCopied ? (
                <>
                  <Check className="w-3 h-3 text-ok" />
                  <span className="text-ok font-semibold">Tersalin</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Salin</span>
                </>
              )}
            </button>
          )}
        </div>

        {type === 'select' ? (
          <select
            id={fieldId}
            value={value}
            onChange={e => onValueChange(e.target.value)}
            className="w-full h-12 px-3.5 rounded-xl border border-line bg-surface text-xs text-ink focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 transition-all cursor-pointer"
          >
            <option value="">Pilih opsi...</option>
            {options?.selectOptions?.map(opt => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        ) : type === 'date' ? (
          <input
            id={fieldId}
            type="date"
            value={value}
            onChange={e => onValueChange(e.target.value)}
            className="w-full h-12 px-3.5 rounded-xl border border-line bg-surface text-xs text-ink focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 transition-all cursor-pointer"
          />
        ) : type === 'textarea' ? (
          <textarea
            id={fieldId}
            value={value}
            onChange={e => onValueChange(e.target.value)}
            placeholder={placeholder}
            rows={3}
            className="w-full p-3.5 rounded-xl border border-line bg-surface text-xs text-ink placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 transition-all"
          />
        ) : (
          <input
            id={fieldId}
            type={type}
            value={value}
            onChange={e => onValueChange(e.target.value)}
            placeholder={placeholder}
            className={`w-full h-12 px-3.5 rounded-xl border border-line bg-surface text-xs text-ink placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 transition-all ${
              options?.isPii ? 'font-mono' : ''
            }`}
          />
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="page max-w-7xl mx-auto space-y-6 pb-16">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-surface-2 rounded-xl animate-pulse" />
          <div className="h-4 w-96 bg-surface-2 rounded-lg animate-pulse" />
        </div>
        <div className="h-24 w-full bg-surface-2 rounded-[20px] animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="h-80 lg:col-span-4 bg-surface-2 rounded-[20px] animate-pulse" />
          <div className="h-96 lg:col-span-8 bg-surface-2 rounded-[20px] animate-pulse" />
        </div>
      </div>
    );
  }

  // Render konten per kategori
  const renderCategoryContent = (catId: string) => {
    const fieldsInCat = customFields.filter(f => f.category === catId);

    return (
      <div className="space-y-6" key={catId}>
        {catId === 'identity' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {renderField('Nama Lengkap (Sesuai KTP)', 'full_name', profile?.full_name || '', v => handleChange('full_name', v), { badge: 'Wajib KTP' })}
            {renderField('NIK (16 Digit Angka)', 'nik', profile?.nik || '', v => handleChange('nik', v), { isPii: true, badge: '16 Digit' })}
            {renderField('Tempat Lahir', 'birth_place', profile?.birth_place || '', v => handleChange('birth_place', v))}
            {renderField('Tanggal Lahir', 'birth_date', profile?.birth_date || '', v => handleChange('birth_date', v), { type: 'date' })}
            {renderField('Umur / Usia', 'age', profile?.age || '', v => handleChange('age', v), { placeholder: 'Contoh: 28' })}
            {renderField('Jenis Kelamin', 'gender', profile?.gender || '', v => handleChange('gender', v), {
              type: 'select',
              selectOptions: ['Laki-laki', 'Perempuan']
            })}
            {renderField('Agama', 'religion', profile?.religion || '', v => handleChange('religion', v), {
              type: 'select',
              selectOptions: ['Islam', 'Kristen Protestan', 'Katolik', 'Hindu', 'Buddha', 'Konghucu', 'Lainnya']
            })}
            {renderField('Status Perkawinan', 'marital_status', profile?.marital_status || '', v => handleChange('marital_status', v), {
              type: 'select',
              selectOptions: ['Belum Kawin', 'Kawin', 'Cerai Hidup', 'Cerai Mati']
            })}
            {renderField('Golongan Darah', 'blood_type', profile?.blood_type || '', v => handleChange('blood_type', v), {
              type: 'select',
              selectOptions: ['A', 'B', 'AB', 'O', 'Tidak Tahu']
            })}
            {renderField('Title / Gelar Sapaan', 'title', getExtendedField('title'), v => handleExtendedChange('title', v, 'identity', 'Title / Sapaan'))}
            {renderField('Nama Depan (First Name)', 'first_name', profile?.first_name || '', v => handleChange('first_name', v))}
            {renderField('Inisial Tengah', 'middle_initial', getExtendedField('middle_initial'), v => handleExtendedChange('middle_initial', v, 'identity', 'Inisial Tengah'))}
            {renderField('Nama Belakang (Last Name)', 'last_name', profile?.last_name || '', v => handleChange('last_name', v))}
          </div>
        )}

        {catId === 'address' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <div className="sm:col-span-2 xl:col-span-3">
              {renderField('Alamat Domisili KTP Utama', 'address', profile?.address || '', v => handleChange('address', v), { isPii: true, type: 'textarea' })}
            </div>
            {renderField('Alamat Baris 2 (Gedung/Kavling)', 'address_line_2', getExtendedField('address_line_2'), v => handleExtendedChange('address_line_2', v, 'address', 'Address Line 2'))}
            {renderField('RT / RW', 'rt_rw', getExtendedField('rt_rw'), v => handleExtendedChange('rt_rw', v, 'address', 'RT / RW'))}
            {renderField('Kelurahan / Desa', 'village', profile?.village || '', v => handleChange('village', v))}
            {renderField('Kecamatan', 'district', profile?.district || '', v => handleChange('district', v))}
            {renderField('Kota / Kabupaten', 'city', profile?.city || '', v => handleChange('city', v))}
            {renderField('Provinsi', 'province', profile?.province || '', v => handleChange('province', v))}
            {renderField('Kode Pos', 'postal_code', profile?.postal_code || '', v => handleChange('postal_code', v))}
            {renderField('Negara (Country)', 'country', getExtendedField('country', 'Indonesia'), v => handleExtendedChange('country', v, 'address', 'Negara'))}
          </div>
        )}

        {catId === 'contact' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {renderField('Nomor Handphone / WhatsApp', 'phone', profile?.phone || '', v => handleChange('phone', v), { isPii: true, badge: 'Kontak Utama' })}
            {renderField('Alamat Surel / Email', 'email', profile?.email || '', v => handleChange('email', v))}
            {renderField('Telepon Rumah', 'home_phone', profile?.home_phone ?? getExtendedField('home_phone'), v => { handleChange('home_phone', v); handleExtendedChange('home_phone', v, 'contact', 'Telepon Rumah'); }, { isPii: true })}
            {renderField('Telepon Kantor', 'work_telephone', profile?.work_telephone ?? getExtendedField('work_telephone'), v => { handleChange('work_telephone', v); handleExtendedChange('work_telephone', v, 'contact', 'Telepon Kantor'); })}
            {renderField('Nomor Fax', 'fax', profile?.fax ?? getExtendedField('fax'), v => { handleChange('fax', v); handleExtendedChange('fax', v, 'contact', 'Nomor Fax'); })}
            {renderField('Situs Web / Portofolio', 'website', profile?.website ?? getExtendedField('website'), v => { handleChange('website', v); handleExtendedChange('website', v, 'contact', 'Website'); })}
          </div>
        )}

        {catId === 'education' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {renderField('Jenjang Pendidikan Terakhir', 'education_level', profile?.education_level || '', v => handleChange('education_level', v), {
              type: 'select',
              selectOptions: ['SD/Sederajat', 'SMP/Sederajat', 'SMA/SMK/Sederajat', 'D1/D2/D3', 'D4/S1', 'S2', 'S3', 'Lainnya']
            })}
            {renderField('Nama Universitas / Sekolah', 'institution', profile?.institution || '', v => handleChange('institution', v))}
            {renderField('Program Studi / Jurusan', 'major_field', getExtendedField('major_field'), v => handleExtendedChange('major_field', v, 'education', 'Jurusan'))}
            {renderField('Nomor Induk Mahasiswa (NIM)', 'student_id', profile?.student_id || '', v => handleChange('student_id', v))}
            {renderField('NISN (Nomor Induk Siswa)', 'nisn', profile?.nisn || '', v => handleChange('nisn', v), { isPii: true })}
            {renderField('Indeks Prestasi Kumulatif (IPK)', 'gpa_score', getExtendedField('gpa_score'), v => handleExtendedChange('gpa_score', v, 'education', 'IPK'))}
          </div>
        )}

        {catId === 'career' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {renderField('Profesi / Pekerjaan Saat Ini', 'occupation', profile?.occupation || '', v => handleChange('occupation', v))}
            {renderField('Instansi / Perusahaan', 'organization', profile?.organization || '', v => handleChange('organization', v))}
            {renderField('Alamat Tempat Kerja', 'work_address', profile?.work_address || '', v => handleChange('work_address', v))}
            {renderField('Penghasilan Bulanan (Est.)', 'income', getExtendedField('income'), v => handleExtendedChange('income', v, 'career', 'Penghasilan'), { isPii: true })}
          </div>
        )}

        {catId === 'family' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {renderField('Nama Ibu Kandung', 'mother_name', profile?.mother_name || '', v => handleChange('mother_name', v), { isPii: true, badge: 'Validasi Resmi' })}
            {renderField('Nama Ayah Kandung', 'father_name', profile?.father_name || '', v => handleChange('father_name', v))}
            {renderField('Nama Kontak Darurat', 'emergency_contact_name', profile?.emergency_contact_name || '', v => handleChange('emergency_contact_name', v))}
            {renderField('Nomor Kontak Darurat', 'emergency_contact_phone', profile?.emergency_contact_phone || '', v => handleChange('emergency_contact_phone', v), { isPii: true })}
            {renderField('Hubungan Kontak Darurat', 'emergency_contact_relation', getExtendedField('emergency_contact_relation'), v => handleExtendedChange('emergency_contact_relation', v, 'family', 'Hubungan Kontak Darurat'))}
          </div>
        )}

        {catId === 'documents' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {renderField('Nomor Pokok Wajib Pajak (NPWP)', 'npwp', profile?.npwp || '', v => handleChange('npwp', v), { isPii: true, badge: '16 Digit' })}
              {renderField('Nomor BPJS Kesehatan', 'bpjs_number', profile?.bpjs_number || '', v => handleChange('bpjs_number', v), { isPii: true, badge: '13 Digit' })}
              {renderField('Nomor SIM (Surat Izin Mengemudi)', 'driver_license', getExtendedField('driver_license'), v => handleExtendedChange('driver_license', v, 'documents', 'Nomor SIM'), { isPii: true })}
            </div>

            <div className="pt-4 border-t border-line space-y-4">
              <div>
                <h3 className="text-sm font-bold text-ink">
                  Berkas Foto Resmi &amp; Lampiran Autofill
                </h3>
                <p className="text-xs text-ink-3 mt-0.5">
                  Foto dienkripsi secara lokal di peramban dan otomatis diunggah saat Anda menyetujui pengisian berkas formulir.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {PHOTO_DOCUMENT_SLOTS.map(slot => {
                  const photo = documentPhotos[slot.id];
                  const hasPhoto = Boolean(photo?.data);

                  return (
                    <div
                      key={slot.id}
                      className={`rounded-2xl border p-4 flex flex-col justify-between transition-all ${
                        hasPhoto ? 'border-line bg-surface' : 'border-dashed border-line-2 bg-surface-2'
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

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-ink">{slot.title}</span>
                          {hasPhoto && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Tersedia
                            </span>
                          )}
                        </div>

                        {hasPhoto ? (
                          <div className="relative aspect-[16/10] rounded-xl overflow-hidden border border-line bg-surface-2 group">
                            <img src={photo.data} alt={slot.title} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => setPreviewPhoto({ title: slot.title, data: photo.data, name: photo.name })}
                                className="h-8 px-3 rounded-lg bg-surface text-xs font-semibold text-ink hover:bg-surface-2 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Lihat</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => fileInputRefs.current[slot.id]?.click()}
                                className="h-8 px-3 rounded-lg bg-surface text-xs font-semibold text-ink hover:bg-surface-2 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                              >
                                <UploadCloud className="w-3.5 h-3.5" />
                                <span>Ganti</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => fileInputRefs.current[slot.id]?.click()}
                            className="w-full aspect-[16/10] rounded-xl border border-dashed border-line-2 bg-surface hover:border-blue-500/40 hover:bg-surface-2 transition-all flex flex-col items-center justify-center gap-1.5 p-4 text-center cursor-pointer"
                          >
                            <Camera className="w-6 h-6 text-ink-3" strokeWidth={1.5} />
                            <span className="text-xs font-semibold text-accent-text">Unggah Foto Berkas</span>
                            <span className="text-[11px] text-ink-3">JPG/PNG maks. 5MB</span>
                          </button>
                        )}
                      </div>

                      <div className="pt-3 mt-3 border-t border-line flex items-center justify-between text-[11px]">
                        <span className="text-ink-3 truncate max-w-[150px]">
                          {hasPhoto ? photo.name : slot.desc}
                        </span>
                        {hasPhoto && (
                          <button
                            type="button"
                            onClick={() => handleRemoveStandardPhoto(slot.id)}
                            className="text-danger hover:underline font-medium inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Hapus</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Custom Fields Section */}
        <div className="pt-6 border-t border-line space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink-3">
                Kolom Kustom Tambahan ({fieldsInCat.length})
              </h3>
              <p className="text-xs text-ink-3 mt-0.5">
                Data spesifik yang dapat Anda tambahkan sendiri untuk kebutuhan formulir lain.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openAddFieldModal(catId)}
              className="h-9 px-3.5 rounded-xl border border-line bg-surface hover:bg-surface-2 text-xs font-semibold text-ink transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Kolom</span>
            </button>
          </div>

          {fieldsInCat.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {fieldsInCat.map(field => {
                const isEditing = editingFieldId === field.id;
                const isImage = field.type === 'image';

                if (isImage) {
                  return (
                    <div
                      key={field.id}
                      className="p-3.5 rounded-xl border border-line bg-surface-2 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {field.photoData ? (
                          <button
                            type="button"
                            onClick={() => setPreviewPhoto({ title: field.label, data: field.photoData!, name: field.photoName || field.value })}
                            className="w-12 h-12 rounded-lg border border-line overflow-hidden shrink-0 cursor-pointer"
                          >
                            <img src={field.photoData} alt={field.label} className="w-full h-full object-cover" />
                          </button>
                        ) : (
                          <div className="w-12 h-12 rounded-lg border border-line bg-surface flex items-center justify-center shrink-0 text-ink-3">
                            <Camera className="w-5 h-5" strokeWidth={1.5} />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-ink truncate">{field.label}</p>
                          <p className="text-[11px] font-mono text-ink-3 truncate mt-0.5">{field.key}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteField(field.id, field.key)}
                        className="p-2 rounded-lg text-ink-3 hover:text-danger hover:bg-danger-soft transition-colors cursor-pointer"
                        title="Hapus kolom ini"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                }

                return (
                  <div key={field.id} className="p-3.5 rounded-xl border border-line bg-surface-2 space-y-2">
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editLabel}
                          onChange={e => setEditLabel(e.target.value)}
                          placeholder="Label data"
                          className="w-full h-9 px-3 rounded-lg border border-line bg-surface text-xs text-ink"
                        />
                        <input
                          type="text"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          placeholder="Nilai data"
                          className="w-full h-9 px-3 rounded-lg border border-line bg-surface text-xs text-ink font-mono"
                        />
                        <input
                          type="text"
                          value={editAliases}
                          onChange={e => setEditAliases(e.target.value)}
                          placeholder="Alias deteksi (dipisah koma)"
                          className="w-full h-9 px-3 rounded-lg border border-line bg-surface text-xs text-ink font-mono text-[11px]"
                        />
                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setEditingFieldId(null)}
                            className="h-8 px-3 rounded-lg border border-line bg-surface text-xs text-ink-2"
                          >
                            Batal
                          </button>
                          <button
                            type="button"
                            onClick={() => saveEditField(field.id)}
                            className="h-8 px-3 rounded-lg bg-accent text-accent-fg text-xs font-semibold"
                          >
                            Simpan
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline gap-1.5 min-w-0">
                            <span className="text-xs font-semibold text-ink truncate">{field.label}</span>
                            <span className="text-[10px] font-mono text-ink-3 shrink-0">({field.key})</span>
                          </div>
                          <p className="text-xs text-ink-2 font-mono truncate mt-0.5">{field.value || '-'}</p>
                          {field.aliases && field.aliases.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {field.aliases.map(al => (
                                <span key={al} className="px-1.5 py-0.5 rounded text-[9.5px] font-mono bg-surface border border-line text-ink-3">
                                  {al}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleCopy(field.value, field.key)}
                            className="p-1.5 rounded-lg text-ink-3 hover:text-ink hover:bg-surface transition-colors cursor-pointer"
                            title="Salin nilai"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => startEditField(field)}
                            className="p-1.5 rounded-lg text-ink-3 hover:text-ink hover:bg-surface transition-colors cursor-pointer"
                            title="Ubah data"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteField(field.id, field.key)}
                            className="p-1.5 rounded-lg text-ink-3 hover:text-danger hover:bg-danger-soft transition-colors cursor-pointer"
                            title="Hapus data"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center rounded-xl border border-dashed border-line-2 bg-surface text-ink-3 text-xs">
              Belum ada kolom kustom tambahan pada kategori ini. Klik &quot;Tambah Kolom&quot; untuk menambahkan.
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="page page-enter max-w-7xl mx-auto space-y-8 pb-28">
      {/* ── Page Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2 border-b border-line">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-400 text-xs font-semibold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Vault Data Kependudukan</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink">
            Profil Saya &amp; Dokumen
          </h1>
          <p className="text-base text-ink-2 max-w-3xl leading-relaxed">
            Kelola data identitas kependudukan, alamat resmi, kontak, pendidikan, pekerjaan, dan berkas foto resmi.
            GovConnect mengenkripsi seluruh data di sisi peramban dan hanya mengisi formulir atas izin Anda.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setShowAddCategoryModal(true)}
            className="h-12 px-5 rounded-xl border border-line bg-surface hover:bg-surface-2 text-ink font-semibold text-sm inline-flex items-center gap-2 transition-all shadow-xs cursor-pointer"
          >
            <FolderPlus className="w-4 h-4 text-accent-text" />
            <span>Kategori Baru</span>
          </button>
        </div>
      </div>

      {/* ── Profile Completeness Card ── */}
      <div className="p-5 sm:p-6 rounded-[20px] border border-line bg-surface flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-ink">
              Kelengkapan Profil &amp; Berkas Resmi
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-accent-text border border-blue-500/20">
              {completeness.percentage}% Lengkap
            </span>
          </div>
          <p className="text-xs text-ink-3">
            {completeness.filled} dari total {completeness.total} kolom data terisi. Semakin lengkap profil, semakin cepat pengisian formulir instansi tanpa ketik ulang.
          </p>
          <div className="h-2 w-full bg-surface-3 rounded-full overflow-hidden mt-2">
            <div
              className="h-full rounded-full bg-accent transition-all duration-300"
              style={{ width: `${completeness.percentage}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="p-3 rounded-xl border border-line bg-surface-2 text-center min-w-[90px]">
            <span className="block text-lg font-bold text-ink tabular-nums">
              {completeness.filled}
            </span>
            <span className="text-[10.5px] text-ink-3">Kolom Terisi</span>
          </div>
          <div className="p-3 rounded-xl border border-line bg-surface-2 text-center min-w-[90px]">
            <span className="block text-lg font-bold text-accent-text tabular-nums">
              {completeness.total - completeness.filled}
            </span>
            <span className="text-[10.5px] text-ink-3">Belum Terisi</span>
          </div>
        </div>
      </div>

      {/* ── Main Workspace: Sidebar Navigator + Active Category Content ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Category Navigator (Left Column) */}
        <aside className="lg:col-span-4 xl:col-span-3 space-y-3 lg:sticky lg:top-6">
          <div className="rounded-[20px] border border-line bg-surface p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-line">
              <span className="text-xs font-bold text-ink uppercase tracking-wider">
                Kategori Data
              </span>
              <span className="text-[11px] text-ink-3 font-semibold">
                {allCategories.length} grup
              </span>
            </div>

            {/* Category Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-ink-3 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={categorySearchQuery}
                onChange={e => setCategorySearchQuery(e.target.value)}
                placeholder="Cari kategori..."
                className="w-full h-10 pl-9 pr-3 rounded-xl border border-line bg-surface-2 text-xs text-ink placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>

            {/* Category List */}
            <nav className="space-y-1 max-h-[calc(100vh-320px)] overflow-y-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setActiveCategoryId('all')}
                className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between gap-2.5 transition-all cursor-pointer ${
                  activeCategoryId === 'all'
                    ? 'border-blue-500/40 bg-blue-500/10 text-accent-text font-semibold'
                    : 'border-transparent hover:bg-surface-2 text-ink-2'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Layers className={`w-4 h-4 shrink-0 ${activeCategoryId === 'all' ? 'text-accent-text' : 'text-ink-3'}`} />
                  <span className="text-xs truncate">Semua Kategori</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface-3 text-ink-3 font-medium">
                  Full
                </span>
              </button>

              {filteredCategories.map(cat => {
                const isActive = activeCategoryId === cat.id;
                const stats = getCategoryStats(cat.id);
                const IconComponent = cat.IconComp;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategoryId(cat.id)}
                    className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between gap-2.5 transition-all cursor-pointer ${
                      isActive
                        ? 'border-blue-500/40 bg-blue-500/10 text-accent-text font-semibold'
                        : 'border-transparent hover:bg-surface-2 text-ink-2'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <IconComponent className={`w-4 h-4 shrink-0 ${isActive ? 'text-accent-text' : 'text-ink-3'}`} />
                      <div className="min-w-0">
                        <span className="block text-xs truncate">{cat.title}</span>
                      </div>
                    </div>
                    <span className={`text-[10.5px] px-1.5 py-0.5 rounded-full font-mono tabular-nums shrink-0 ${
                      isActive ? 'bg-blue-500/20 text-accent-text font-bold' : 'bg-surface-3 text-ink-3 font-medium'
                    }`}>
                      {stats.filled}/{stats.total}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Active Category Content (Right Column) */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-6">
          {activeCategoryId === 'all' ? (
            allCategories.map(cat => (
              <div key={cat.id} id={sectionIdFor(cat.id)} className="rounded-[20px] border border-line bg-surface p-6 space-y-6">
                <div className="flex items-start justify-between gap-4 pb-4 border-b border-line">
                  <div>
                    <h2 className="text-base font-bold text-ink">{cat.title}</h2>
                    <p className="text-xs text-ink-3 mt-0.5">{cat.desc}</p>
                  </div>
                  {cat.isCustom && (
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="text-xs text-danger hover:underline font-semibold"
                    >
                      Hapus Kategori
                    </button>
                  )}
                </div>
                {renderCategoryContent(cat.id)}
              </div>
            ))
          ) : (
            (() => {
              const currentCat = allCategories.find(c => c.id === activeCategoryId) || allCategories[0];
              return (
                <div id={sectionIdFor(currentCat.id)} className="rounded-[20px] border border-line bg-surface p-6 space-y-6">
                  <div className="flex items-start justify-between gap-4 pb-4 border-b border-line">
                    <div>
                      <h2 className="text-lg font-bold text-ink">{currentCat.title}</h2>
                      <p className="text-xs text-ink-3 mt-0.5">{currentCat.desc}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {currentCat.isCustom && (
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(currentCat.id)}
                          className="h-10 px-3.5 rounded-xl border border-line bg-surface hover:bg-danger-soft text-danger text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Hapus Kategori
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => openAddFieldModal(currentCat.id)}
                        className="h-10 px-4 rounded-xl bg-accent text-accent-fg hover:bg-accent-hover text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambah Kolom</span>
                      </button>
                    </div>
                  </div>
                  {renderCategoryContent(currentCat.id)}
                </div>
              );
            })()
          )}
        </div>
      </div>

      {/* ── Sticky Unsaved Changes Bar ── */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-2xl animate-in slide-in-from-bottom-4 duration-300">
          <div className="rounded-2xl border border-line bg-surface shadow-2xl p-4 flex items-center justify-between gap-4 backdrop-blur-md">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
              <p className="text-xs font-semibold text-ink truncate">
                Terdapat perubahan data profil yang belum disimpan
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleResetChanges}
                className="h-10 px-4 rounded-xl border border-line bg-surface hover:bg-surface-2 text-xs font-semibold text-ink transition-colors cursor-pointer"
              >
                Batalkan
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="h-10 px-5 rounded-xl bg-accent text-accent-fg hover:bg-accent-hover text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Menyimpan...' : 'Simpan (Ctrl+S)'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast Feedback ── */}
      {message && (
        <div className="fixed top-6 right-6 z-50 max-w-sm animate-in slide-in-from-top-3 duration-200">
          <div className={`p-4 rounded-2xl border shadow-xl flex items-start gap-3 bg-surface ${
            message.type === 'success' ? 'border-emerald-500/40 text-ok' : 'border-red-500/40 text-danger'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
            )}
            <div className="text-xs flex-1">
              <p className="font-bold text-ink">
                {message.type === 'success' ? 'Berhasil Disimpan' : 'Perhatian'}
              </p>
              <p className="text-ink-2 mt-0.5 leading-relaxed">{message.text}</p>
            </div>
            <button type="button" onClick={() => setMessage(null)} className="text-ink-3 hover:text-ink">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Modal Tambah Kolom Kustom ── */}
      {showAddFieldModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowAddFieldModal(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="w-full max-w-md max-h-[90vh] rounded-[24px] border border-line bg-surface shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
          >
            <div className="p-6 border-b border-line flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-ink">
                  Tambah Kolom Kustom
                </h3>
                <p className="text-xs text-ink-3 mt-1">
                  Tambahkan data spesifik untuk kebutuhan pengisian formulir.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddFieldModal(false)}
                className="p-1.5 rounded-lg text-ink-3 hover:text-ink"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewField} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Presets Quick Selector */}
              {RICH_CATEGORY_PRESETS[targetCategory]?.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5">
                    Rekomendasi Kolom Cepat
                  </label>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 rounded-xl border border-line bg-surface-2">
                    {RICH_CATEGORY_PRESETS[targetCategory].slice(0, 8).map(preset => (
                      <button
                        key={preset.key}
                        type="button"
                        onClick={() => applyPresetToModal(preset)}
                        className="px-2.5 py-1 rounded-lg border border-line bg-surface text-[11px] font-medium text-ink-2 hover:border-blue-500/40 hover:text-ink transition-colors cursor-pointer"
                      >
                        + {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tipe Data */}
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">Tipe Data</label>
                <div className="grid grid-cols-4 gap-1 p-1 rounded-xl border border-line bg-surface-2 text-xs font-medium">
                  {(['text', 'date', 'textarea', 'image'] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setNewFieldType(t)}
                      className={`h-8 rounded-lg capitalize transition-colors ${
                        newFieldType === t ? 'bg-surface text-ink font-bold shadow-xs' : 'text-ink-3 hover:text-ink'
                      }`}
                    >
                      {t === 'image' ? 'Berkas' : t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  Label Data <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newLabel}
                  onChange={e => handleLabelChange(e.target.value)}
                  placeholder="Contoh: Nomor Paspor, Foto Ijazah"
                  className="w-full h-12 px-3.5 rounded-xl border border-line bg-surface-2 text-xs text-ink placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  Kunci Atribut Autofill <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newKey}
                  onChange={e => setNewKey(slugify(e.target.value))}
                  placeholder="contoh: nomor_paspor"
                  className="w-full h-12 px-3.5 rounded-xl border border-line bg-surface-2 text-xs text-ink font-mono placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-ink">Alias Deteksi Formulir</span>
                  <span className="text-[11px] text-ink-3">Pisahkan koma</span>
                </div>
                <input
                  type="text"
                  value={newAliases}
                  onChange={e => setNewAliases(e.target.value)}
                  placeholder="contoh: paspor, passport, no_paspor"
                  className="w-full h-12 px-3.5 rounded-xl border border-line bg-surface-2 text-xs text-ink font-mono placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
                {suggestedAliases.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {suggestedAliases.slice(0, 6).map(alias => (
                      <button
                        key={alias}
                        type="button"
                        onClick={() => {
                          const next = newAliases.trim() ? `${newAliases.trim()}, ${alias}` : alias;
                          setNewAliases(next);
                        }}
                        className="px-2 py-0.5 rounded text-[10px] font-mono bg-surface border border-line text-ink-2 hover:bg-surface-3 transition-colors"
                      >
                        +{alias}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Value or Photo Upload */}
              {newFieldType === 'image' ? (
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5">
                    Unggah Berkas Gambar <span className="text-danger">*</span>
                  </label>
                  <input
                    type="file"
                    ref={modalPhotoInputRef}
                    accept="image/*"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) handleModalPhotoSelected(file);
                    }}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => modalPhotoInputRef.current?.click()}
                    className="w-full h-24 rounded-xl border border-dashed border-line-2 bg-surface-2 hover:bg-surface-3 flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {newPhotoData ? (
                      <span className="text-xs font-semibold text-ok flex items-center gap-1.5">
                        <Check className="w-4 h-4" />
                        <span>{newPhotoData.name}</span>
                      </span>
                    ) : (
                      <>
                        <UploadCloud className="w-5 h-5 text-ink-3" />
                        <span className="text-xs font-semibold text-accent-text">Pilih berkas foto</span>
                      </>
                    )}
                  </button>
                </div>
              ) : newFieldType === 'textarea' ? (
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5">
                    Nilai Data <span className="text-danger">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={newValue}
                    onChange={e => setNewValue(e.target.value)}
                    placeholder="Isi catatan data..."
                    className="w-full p-3.5 rounded-xl border border-line bg-surface-2 text-xs text-ink placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5">
                    Nilai Data <span className="text-danger">*</span>
                  </label>
                  <input
                    type={newFieldType === 'date' ? 'date' : 'text'}
                    required
                    value={newValue}
                    onChange={e => setNewValue(e.target.value)}
                    placeholder="Isi nilai data..."
                    className="w-full h-12 px-3.5 rounded-xl border border-line bg-surface-2 text-xs text-ink placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
              )}

              {fieldError && <p className="text-xs text-danger font-medium">{fieldError}</p>}

              <div className="pt-4 border-t border-line flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddFieldModal(false)}
                  className="h-10 px-4 rounded-xl border border-line bg-surface text-xs font-semibold text-ink-2"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="h-10 px-5 rounded-xl bg-accent text-accent-fg text-xs font-semibold"
                >
                  Tambahkan Kolom
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Tambah Kategori Baru ── */}
      {showAddCategoryModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowAddCategoryModal(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="w-full max-w-md rounded-[24px] border border-line bg-surface shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
          >
            <div className="p-6 border-b border-line flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-ink">
                  Buat Kategori Kustom Baru
                </h3>
                <p className="text-xs text-ink-3 mt-1">
                  Kelompokkan data khusus sesuai kebutuhan instansi Anda.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCategoryModal(false)}
                className="p-1.5 rounded-lg text-ink-3 hover:text-ink"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCategoryStandalone} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  Nama Kategori <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newCategoryTitle}
                  onChange={e => setNewCategoryTitle(e.target.value)}
                  placeholder="Contoh: Dokumen Kendaraan, Rekening Bank"
                  className="w-full h-12 px-3.5 rounded-xl border border-line bg-surface-2 text-xs text-ink placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  Deskripsi Kategori (Opsional)
                </label>
                <input
                  type="text"
                  value={newCategoryDesc}
                  onChange={e => setNewCategoryDesc(e.target.value)}
                  placeholder="Contoh: STNK, BPKB, dan nomor plat kendaraan"
                  className="w-full h-12 px-3.5 rounded-xl border border-line bg-surface-2 text-xs text-ink placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>

              {categoryError && <p className="text-xs text-danger font-medium">{categoryError}</p>}

              <div className="pt-4 border-t border-line flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCategoryModal(false)}
                  className="h-10 px-4 rounded-xl border border-line bg-surface text-xs font-semibold text-ink-2"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="h-10 px-5 rounded-xl bg-accent text-accent-fg text-xs font-semibold"
                >
                  Buat Kategori
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Lightbox Image Preview ── */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewPhoto(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="w-full max-w-3xl max-h-[90vh] rounded-[24px] border border-line bg-surface shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
          >
            <div className="p-4 px-6 border-b border-line flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-ink truncate">{previewPhoto.title}</h4>
                <p className="text-xs text-ink-3 truncate">{previewPhoto.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="p-1.5 rounded-lg text-ink-3 hover:text-ink"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 bg-surface-2 p-4 flex items-center justify-center overflow-auto max-h-[75vh]">
              <img
                src={previewPhoto.data}
                alt={previewPhoto.title}
                className="max-h-[70vh] max-w-full rounded-xl object-contain shadow-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfilePage;
