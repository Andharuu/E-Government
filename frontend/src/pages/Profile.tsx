import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { profileApi, type Profile } from '../services/api';
import { FontAwesome } from '../components/ui';

const ALL_CATEGORY_FIELD_KEYS: Record<string, string[]> = {
  identity: [
    'full_name', 'nik', 'birth_place', 'birth_date', 'gender', 'religion',
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
import {
  Save, AlertCircle, User, MapPin, Phone,
  GraduationCap, Briefcase, HeartHandshake, FileText, Sparkles,
  Plus, Trash2, Edit3, Copy, Check,
  Upload, Camera, FolderPlus, X, Eye,
  EyeOff, Search, Layers, RefreshCw
} from 'lucide-react';

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

export type {
  CustomFieldType,
  CustomFieldItem,
  UserCategory,
  DocumentPhoto,
  DocumentPhotosMap,
  RichPreset,
};

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

  // Active Category Workspace State ('all' or category id like 'identity', 'address', etc.)
  const [activeCategoryId, setActiveCategoryId] = useState<string>('identity');
  const [categorySearchQuery, setCategorySearchQuery] = useState('');

  // Modal / Form Tambah Custom Field
  const [showAddFieldModal, setShowAddFieldModal] = useState(false);
  const [targetCategory, setTargetCategory] = useState('identity');
  const [newFieldType, setNewFieldType] = useState<CustomFieldType>('text');
  const [newLabel, setNewLabel] = useState('');
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newPhotoData, setNewPhotoData] = useState<DocumentPhoto | null>(null);
  const [fieldError, setFieldError] = useState('');

  // Modal Standalone Buat Kategori Baru
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
    if (!newKey || newKey === slugify(newLabel)) {
      setNewKey(slugify(val));
    }
  };

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
    setProfile(prev => {
      if (!prev) return null;
      const updated = { ...prev, [key]: value };
      if (key === 'full_name' && value.trim()) {
        const parts = value.trim().split(/\s+/);
        if (!updated.first_name) updated.first_name = parts[0] || '';
        if (!updated.last_name) updated.last_name = parts.slice(1).join(' ') || parts[0] || '';
      }
      return updated;
    });
    setHasUnsavedChanges(true);
  };

  const getExtendedField = (key: string, defaultVal: string = '') => {
    if (profile && (profile as any)[key] !== undefined && (profile as any)[key] !== null && String((profile as any)[key]).trim() !== '') {
      return String((profile as any)[key]);
    }
    const cf = customFields.find(f => f.key === key);
    return cf?.value !== undefined && cf?.value !== null ? cf.value : defaultVal;
  };

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

  // Upload Foto Dokumen Resmi Standar
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

  const openAddFieldModal = (categoryId: string) => {
    setTargetCategory(categoryId);
    setNewFieldType('text');
    setNewLabel('');
    setNewKey('');
    setNewValue('');
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
        window.postMessage({ type: 'GOVCONNECT_PROFILE_UPDATED', profile: res.data }, '*');
      } catch (storageErr) {
        console.warn('Gagal sinkronisasi event ekstensi:', storageErr);
      }

      setMessage({ type: 'success', text: 'Semua perubahan profil berhasil disimpan.' });
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setMessage({ type: 'error', text: err?.response?.data?.detail || 'Gagal menyimpan profil. Silakan coba kembali.' });
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
    const rawVal = profile ? (profile as any)[key] : null;
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
        icon: c.iconName,
        isCustom: false,
      })),
      ...userCategories.map(c => ({
        id: c.id,
        title: c.title,
        desc: c.description,
        icon: 'folder',
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

  // Render input field reusable dengan copy button dan PII masking
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

    return (
      <div className="space-y-2" key={key}>
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-[#6EA2B3] flex items-center gap-2">
            <span>{label}</span>
          </label>
          {value && (
            <button
              type="button"
              onClick={() => handleCopy(value, key)}
              title="Salin nilai"
              className="inline-flex items-center gap-1 text-xs text-[#6EA2B3] hover:text-[#7BBDE8] transition-colors cursor-pointer"
            >
              {copiedKey === key ? (
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <Check className="w-3 h-3" /> Tersalin
                </span>
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
          <div className="relative">
            <select
              value={value}
              onChange={e => onValueChange(e.target.value)}
              className="w-full h-11 pl-4 pr-10 text-[13.5px] rounded-xl border border-[#243048] hover:border-[#7BBDE8]/60 focus:border-[#7BBDE8] focus:ring-2 focus:ring-[#7BBDE8]/20 outline-none bg-[#101828] text-white transition-all appearance-none cursor-pointer"
            >
              <option value="" className="bg-[#101828] text-[#6EA2B3]">Pilih opsi...</option>
              {options?.selectOptions?.map(opt => (
                <option key={opt} value={opt} className="bg-[#101828] text-white py-1">{opt}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6EA2B3]">
              <FontAwesome name="chevron-down" className="text-xs" />
            </div>
          </div>
        ) : type === 'date' ? (
          <input
            type="date"
            value={value}
            onChange={e => onValueChange(e.target.value)}
            className="w-full h-11 px-4 text-[13.5px] rounded-xl border border-[#243048] hover:border-[#7BBDE8]/60 focus:border-[#7BBDE8] focus:ring-2 focus:ring-[#7BBDE8]/20 outline-none bg-[#101828] text-white transition-all cursor-pointer [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-75 [&::-webkit-calendar-picker-indicator]:hover:opacity-100"
          />
        ) : type === 'textarea' ? (
          <textarea
            value={value}
            onChange={e => onValueChange(e.target.value)}
            placeholder={options?.placeholder || `Masukkan ${label.toLowerCase()}...`}
            rows={3}
            className="w-full p-4 text-[13.5px] rounded-xl border border-[#243048] hover:border-[#7BBDE8]/60 focus:border-[#7BBDE8] focus:ring-2 focus:ring-[#7BBDE8]/20 outline-none bg-[#101828] text-white transition-all resize-none placeholder:text-[#6EA2B3]"
          />
        ) : (
          <input
            type={type}
            value={value}
            onChange={e => onValueChange(e.target.value)}
            placeholder={options?.placeholder || `Masukkan ${label.toLowerCase()}...`}
            className="w-full h-11 px-4 text-[13.5px] rounded-xl border border-[#243048] hover:border-[#7BBDE8]/60 focus:border-[#7BBDE8] focus:ring-2 focus:ring-[#7BBDE8]/20 outline-none bg-[#101828] text-white transition-all placeholder:text-[#6EA2B3]"
          />
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-10 h-10 border-4 border-[#7BBDE8] border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-semibold text-[#6EA2B3]">Memuat profil kependudukan...</span>
      </div>
    );
  }

  // Render konten per kategori
  const renderCategoryContent = (catId: string) => {
    const fieldsInCat = customFields.filter(f => f.category === catId);

    return (
      <div className="space-y-6" key={catId}>
        {/* Konten Standar berdasarkan ID */}
        {catId === 'identity' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {renderField('Nama Lengkap (Sesuai KTP)', 'full_name', profile?.full_name || '', v => handleChange('full_name', v), { badge: 'Wajib KTP' })}
            {renderField('NIK (Nomor Induk Kependudukan)', 'nik', profile?.nik || '', v => handleChange('nik', v), { isPii: true, badge: '16 Digit' })}
            {renderField('Tempat Lahir', 'birth_place', profile?.birth_place || '', v => handleChange('birth_place', v))}
            {renderField('Tanggal Lahir', 'birth_date', profile?.birth_date || '', v => handleChange('birth_date', v), { type: 'date' })}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="md:col-span-2 lg:col-span-3">
              {renderField('Alamat Domisili Utama', 'address', profile?.address || '', v => handleChange('address', v), { isPii: true, type: 'textarea' })}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {renderField('Nomor HP / WhatsApp Utama', 'phone', profile?.phone || '', v => handleChange('phone', v), { isPii: true, badge: 'Kontak Utama' })}
            {renderField('Alamat Surel / Email', 'email', profile?.email || '', v => handleChange('email', v))}
            {renderField('Telepon Rumah', 'home_phone', getExtendedField('home_phone'), v => handleExtendedChange('home_phone', v, 'contact', 'Telepon Rumah'), { isPii: true })}
            {renderField('Telepon Kantor', 'work_telephone', getExtendedField('work_telephone'), v => handleExtendedChange('work_telephone', v, 'contact', 'Telepon Kantor'))}
            {renderField('Nomor Fax', 'fax', getExtendedField('fax'), v => handleExtendedChange('fax', v, 'contact', 'Nomor Fax'))}
            {renderField('Situs Web / Portofolio', 'website', getExtendedField('website'), v => handleExtendedChange('website', v, 'contact', 'Website'))}
          </div>
        )}

        {catId === 'education' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {renderField('Jenjang Pendidikan Terakhir', 'education_level', profile?.education_level || '', v => handleChange('education_level', v), {
              type: 'select',
              selectOptions: ['SD/Sederajat', 'SMP/Sederajat', 'SMA/SMK/Sederajat', 'D1/D2/D3', 'D4/S1', 'S2', 'S3', 'Lainnya']
            })}
            {renderField('Nama Universitas / Sekolah', 'institution', profile?.institution || '', v => handleChange('institution', v))}
            {renderField('Program Studi / Jurusan', 'major_field', getExtendedField('major_field'), v => handleExtendedChange('major_field', v, 'education', 'Jurusan'))}
            {renderField('Nomor Induk Mahasiswa (NIM/NPM)', 'student_id', profile?.student_id || '', v => handleChange('student_id', v))}
            {renderField('NISN (Nomor Induk Siswa Nasional)', 'nisn', profile?.nisn || '', v => handleChange('nisn', v), { isPii: true })}
            {renderField('Nilai IPK / Nilai Akhir', 'gpa_score', getExtendedField('gpa_score'), v => handleExtendedChange('gpa_score', v, 'education', 'IPK'))}
          </div>
        )}

        {catId === 'career' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {renderField('Profesi / Pekerjaan Saat Ini', 'occupation', profile?.occupation || '', v => handleChange('occupation', v))}
            {renderField('Nama Lembaga / Perusahaan', 'organization', profile?.organization || '', v => handleChange('organization', v))}
            {renderField('Alamat Kantor / Tempat Kerja', 'work_address', profile?.work_address || '', v => handleChange('work_address', v))}
            {renderField('Penghasilan Bulanan (Est.)', 'income', getExtendedField('income'), v => handleExtendedChange('income', v, 'career', 'Penghasilan'), { isPii: true })}
          </div>
        )}

        {catId === 'family' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {renderField('Nama Ibu Kandung', 'mother_name', profile?.mother_name || '', v => handleChange('mother_name', v), { isPii: true, badge: 'Validasi Bank/Dukcapil' })}
            {renderField('Nama Ayah Kandung', 'father_name', profile?.father_name || '', v => handleChange('father_name', v))}
            {renderField('Nama Kontak Darurat', 'emergency_contact_name', profile?.emergency_contact_name || '', v => handleChange('emergency_contact_name', v))}
            {renderField('Nomor Kontak Darurat', 'emergency_contact_phone', profile?.emergency_contact_phone || '', v => handleChange('emergency_contact_phone', v), { isPii: true })}
            {renderField('Hubungan Kontak Darurat', 'emergency_contact_relation', getExtendedField('emergency_contact_relation'), v => handleExtendedChange('emergency_contact_relation', v, 'family', 'Hubungan Kontak Darurat'))}
          </div>
        )}

        {catId === 'documents' && (
          <div className="space-y-6">
            {/* Nomor Dokumen Resmi */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {renderField('Nomor Pokok Wajib Pajak (NPWP)', 'npwp', profile?.npwp || '', v => handleChange('npwp', v), { isPii: true, badge: '16/15 Digit' })}
              {renderField('Nomor BPJS Kesehatan', 'bpjs_number', profile?.bpjs_number || '', v => handleChange('bpjs_number', v), { isPii: true, badge: '13 Digit' })}
              {renderField('Nomor SIM (Surat Izin Mengemudi)', 'driver_license', getExtendedField('driver_license'), v => handleExtendedChange('driver_license', v, 'documents', 'Nomor SIM'), { isPii: true })}
            </div>

            {/* Berkas Foto Dokumen Resmi */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white">Berkas Foto Resmi &amp; Lampiran Autofill</h3>
                <p className="text-xs text-[#6EA2B3] mt-0.5">
                  Foto dienkripsi secara lokal dan otomatis diunggah oleh ekstensi GovConnect pada formulir pendaftaran.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {PHOTO_DOCUMENT_SLOTS.map(slot => {
                  const photo = documentPhotos[slot.id];
                  const hasPhoto = !!photo?.data;

                  return (
                    <div
                      key={slot.id}
                      className={`rounded-2xl border transition-colors p-4 flex flex-col justify-between ${
                        hasPhoto
                          ? 'bg-[#101828] border-[#243048]'
                          : 'bg-[#101828] border-dashed border-[#243048] hover:border-[#7BBDE8]'
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
                          <div className="flex items-center gap-2.5">
                            <Camera className="w-4 h-4 text-[#7BBDE8] shrink-0" />
                            <div>
                              <div className="text-xs font-bold text-white leading-tight">{slot.title}</div>
                            </div>
                          </div>
                        </div>

                        {hasPhoto ? (
                          <div className="relative group rounded-xl overflow-hidden border border-[#243048] bg-[#101828] aspect-[16/10] mb-3 flex items-center justify-center">
                            <img src={photo.data} alt={slot.title} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-[#101828]/75 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => setPreviewPhoto({ title: slot.title, data: photo.data, name: photo.name })}
                                className="px-3 py-1.5 rounded-lg bg-[#171F2F] text-white hover:bg-[#243048] text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-[#243048]"
                              >
                                <Eye className="w-3.5 h-3.5 text-[#7BBDE8]" />
                                <span>Lihat</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => fileInputRefs.current[slot.id]?.click()}
                                className="px-3 py-1.5 rounded-lg bg-[#171F2F] text-white hover:bg-[#243048] text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-[#243048]"
                              >
                                <Upload className="w-3.5 h-3.5 text-[#7BBDE8]" />
                                <span>Ganti</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div
                            onClick={() => fileInputRefs.current[slot.id]?.click()}
                            className="rounded-xl border border-dashed border-[#243048] aspect-[16/10] mb-3 flex flex-col items-center justify-center p-3 text-center cursor-pointer hover:bg-[#171F2F] transition-colors"
                          >
                            <Upload className="w-6 h-6 text-[#6EA2B3] mb-1.5" />
                            <span className="text-xs font-semibold text-[#7BBDE8]">Unggah Foto Berkas</span>
                            <span className="text-[10px] text-[#6EA2B3] mt-0.5">JPG / PNG maksimal 5MB</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs pt-2">
                        <span className="text-[#6EA2B3] truncate text-[11px]">
                          {hasPhoto ? photo.name : slot.desc}
                        </span>
                        {hasPhoto && (
                          <button
                            type="button"
                            onClick={() => handleRemoveStandardPhoto(slot.id)}
                            className="inline-flex items-center gap-1 text-rose-400 hover:text-rose-300 font-semibold cursor-pointer shrink-0 ml-2 text-xs"
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

        {/* Custom Fields pada Kategori ini */}
        <div className="pt-2 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Kolom Kustom Tambahan ({fieldsInCat.length})
            </span>
            <button
              type="button"
              onClick={() => openAddFieldModal(catId)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#101828] bg-[#7BBDE8] hover:bg-[#92cbef] rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Kolom</span>
            </button>
          </div>

          {fieldsInCat.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fieldsInCat.map(field => {
                const isEditing = editingFieldId === field.id;
                const isImage = field.type === 'image';

                if (isImage) {
                  return (
                    <div
                      key={field.id}
                      className="p-4 bg-[#101828] rounded-xl border border-[#243048] flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {field.photoData ? (
                          <div
                            onClick={() => setPreviewPhoto({ title: field.label, data: field.photoData!, name: field.photoName || field.value })}
                            className="w-12 h-12 rounded-lg bg-[#171F2F] border border-[#243048] overflow-hidden cursor-pointer shrink-0"
                          >
                            <img src={field.photoData} alt={field.label} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-[#171F2F] border border-[#243048] flex items-center justify-center shrink-0 text-[#6EA2B3]">
                            <Camera className="w-5 h-5" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-white truncate">{field.label}</p>
                          <p className="text-[11px] text-[#6EA2B3] font-mono truncate">{field.key}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteField(field.id, field.key)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-400 hover:text-white hover:bg-rose-600 rounded-lg border border-rose-800/40 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  );
                }

                return (
                  <div
                    key={field.id}
                    className="p-4 bg-[#101828] rounded-xl border border-[#243048] space-y-3"
                  >
                    {isEditing ? (
                      <div className="space-y-3">
                        <input
                          className="w-full h-10 px-3 text-xs rounded-lg border border-[#7BBDE8] bg-[#171F2F] text-white outline-none"
                          value={editLabel}
                          onChange={e => setEditLabel(e.target.value)}
                          placeholder="Label data"
                        />
                        <input
                          className="w-full h-10 px-3 text-xs rounded-lg border border-[#243048] bg-[#171F2F] text-white outline-none"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          placeholder="Nilai data"
                        />
                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setEditingFieldId(null)}
                            className="px-3 py-1.5 text-xs text-[#6EA2B3] hover:text-white hover:bg-[#171F2F] rounded-lg"
                          >
                            Batal
                          </button>
                          <button
                            type="button"
                            onClick={() => saveEditField(field.id)}
                            className="px-3.5 py-1.5 text-xs font-bold text-[#101828] bg-[#7BBDE8] hover:bg-[#92cbef] rounded-lg"
                          >
                            Simpan
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white truncate">{field.label}</span>
                            <span className="text-[11px] text-[#6EA2B3] font-mono">({field.key})</span>
                          </div>
                          <p className="text-xs text-[#6EA2B3] truncate mt-1 font-medium">{field.value || '-'}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleCopy(field.value, field.key)}
                            className="p-1.5 text-[#6EA2B3] hover:text-[#7BBDE8] rounded-lg transition-colors cursor-pointer"
                            title="Salin nilai"
                          >
                            {copiedKey === field.key ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => startEditField(field)}
                            className="p-1.5 text-[#6EA2B3] hover:text-[#7BBDE8] rounded-lg transition-colors cursor-pointer"
                            title="Edit data"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteField(field.id, field.key)}
                            className="p-1.5 text-rose-400 hover:text-rose-300 rounded-lg transition-colors cursor-pointer"
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
            <p className="text-xs text-[#6EA2B3] italic">
              Belum ada kolom kustom tambahan pada kategori ini.
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full space-y-6 pb-24">
      {/* ── Page Header (F-Shape: Title Top-Left, CTAs Top-Right) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Profil Saya
          </h1>
          <p className="text-sm text-[#6EA2B3] mt-1">
            Kelola data identitas kependudukan, kontak, berkas foto resmi, dan kolom kustom untuk autofill resmi.
          </p>
        </div>

        {/* Action Toolbar with clear text labels */}
        <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
          {/* Add Category Trigger */}
          <button
            type="button"
            onClick={() => setShowAddCategoryModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-[#101828] bg-[#7BBDE8] hover:bg-[#92cbef] rounded-xl transition-colors cursor-pointer shadow-xs"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Kategori Baru</span>
          </button>
        </div>
      </div>

      {/* ── Profile Completeness Bar (Strict 8px Grid) ── */}
      <div className="bg-[#171F2F] rounded-2xl border border-[#243048] p-4 space-y-2 shadow-sm">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-white flex items-center gap-2">
            <span>Kelengkapan Profil &amp; Berkas</span>
            <span className="text-[#6EA2B3] font-normal">
              ({completeness.filled} dari {completeness.total} data terisi)
            </span>
          </span>
          <span className="text-[#7BBDE8] font-bold tabular-nums">
            {completeness.percentage}% Lengkap
          </span>
        </div>
        <div className="w-full h-2 bg-[#101828] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#7BBDE8] rounded-full transition-all duration-500"
            style={{ width: `${completeness.percentage}%` }}
          />
        </div>
      </div>

      {/* ── Main Profile Workspace (Focused Category Navigation) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Sidebar / Category Navigator (3 cols on lg) - STICKY FOLLOWING USER SCROLL */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-4 sticky top-6 self-start z-10">
          <div className="bg-[#171F2F] rounded-2xl border border-[#243048] shadow-sm overflow-hidden">
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#6EA2B3] flex items-center gap-2">
                  <FontAwesome name="layer-group" className="text-sm text-[#7BBDE8]" />
                  <span>Kategori Data</span>
                </span>
              </div>

              {/* Category Search */}
              <div className="relative">
                <input
                  type="text"
                  value={categorySearchQuery}
                  onChange={e => setCategorySearchQuery(e.target.value)}
                  placeholder="Cari kategori..."
                  className="w-full h-9 pl-8 pr-3 text-xs rounded-lg border border-[#243048] bg-[#101828] text-white focus:border-[#7BBDE8] outline-none transition-colors placeholder:text-[#6EA2B3]"
                />
                <FontAwesome name="search" className="text-xs text-[#6EA2B3] absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Category Navigation List */}
            <div className="p-2 space-y-1 max-h-[calc(100vh-280px)] overflow-y-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setActiveCategoryId('all')}
                className={`w-full text-left p-3 rounded-xl transition-colors flex items-center justify-between cursor-pointer ${
                  activeCategoryId === 'all'
                    ? 'bg-[#7BBDE8] text-[#101828] font-bold shadow-xs'
                    : 'text-[#6EA2B3] hover:bg-[#101828] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FontAwesome
                    name="layer-group"
                    className={`text-base shrink-0 ${activeCategoryId === 'all' ? 'text-[#101828]' : 'text-[#7BBDE8]'}`}
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate">Semua Kategori</p>
                    <p className={`text-[11px] truncate ${activeCategoryId === 'all' ? 'text-[#101828]/80' : 'text-[#6EA2B3]'}`}>
                      Tampilan penuh
                    </p>
                  </div>
                </div>
              </button>

              {filteredCategories.map(cat => {
                const isActive = activeCategoryId === cat.id;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategoryId(cat.id)}
                    className={`w-full text-left p-3 rounded-xl transition-colors flex items-center justify-between cursor-pointer ${
                      isActive
                        ? 'bg-[#7BBDE8] text-[#101828] font-bold shadow-xs'
                        : 'text-[#6EA2B3] hover:bg-[#101828] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Icon without wrapper */}
                      {cat.id === 'identity' && <FontAwesome name="user" className={`text-base shrink-0 ${isActive ? 'text-[#101828]' : 'text-[#7BBDE8]'}`} />}
                      {cat.id === 'address' && <FontAwesome name="map-pin" className={`text-base shrink-0 ${isActive ? 'text-[#101828]' : 'text-[#7BBDE8]'}`} />}
                      {cat.id === 'contact' && <FontAwesome name="phone" className={`text-base shrink-0 ${isActive ? 'text-[#101828]' : 'text-[#7BBDE8]'}`} />}
                      {cat.id === 'education' && <FontAwesome name="graduation-cap" className={`text-base shrink-0 ${isActive ? 'text-[#101828]' : 'text-[#7BBDE8]'}`} />}
                      {cat.id === 'career' && <FontAwesome name="briefcase" className={`text-base shrink-0 ${isActive ? 'text-[#101828]' : 'text-[#7BBDE8]'}`} />}
                      {cat.id === 'family' && <FontAwesome name="users" className={`text-base shrink-0 ${isActive ? 'text-[#101828]' : 'text-[#7BBDE8]'}`} />}
                      {cat.id === 'documents' && <FontAwesome name="file-lines" className={`text-base shrink-0 ${isActive ? 'text-[#101828]' : 'text-[#7BBDE8]'}`} />}
                      {cat.isCustom && <FontAwesome name="folder" className={`text-base shrink-0 ${isActive ? 'text-[#101828]' : 'text-[#7BBDE8]'}`} />}

                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold truncate">{cat.title}</p>
                        <p className={`text-[11px] truncate ${isActive ? 'text-[#101828]/80' : 'text-[#6EA2B3]'}`}>
                          {cat.desc}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Content Area: Active Category Editor (9 cols on lg) */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-6">
          {activeCategoryId === 'all' ? (
            <div className="space-y-6">
              {allCategories.map(cat => (
                <div key={cat.id} className="bg-[#171F2F] rounded-2xl border border-[#243048] shadow-sm p-6 space-y-6">
                  <div className="flex items-start justify-between gap-4 pb-2">
                    <div>
                      <h2 className="text-base font-bold text-white">{cat.title}</h2>
                      <p className="text-xs text-[#6EA2B3] mt-0.5">{cat.desc}</p>
                    </div>
                    {cat.isCustom && (
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-400 hover:text-white hover:bg-rose-600 px-3 py-1.5 bg-rose-950/30 border border-rose-800/40 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Hapus Kategori</span>
                      </button>
                    )}
                  </div>
                  {renderCategoryContent(cat.id)}
                </div>
              ))}
            </div>
          ) : (
            (() => {
              const currentCat = allCategories.find(c => c.id === activeCategoryId) || allCategories[0];
              return (
                <div className="bg-[#171F2F] rounded-2xl border border-[#243048] shadow-sm p-6 sm:p-8 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
                    <div>
                      <h2 className="text-lg font-bold text-white">{currentCat.title}</h2>
                      <p className="text-xs text-[#6EA2B3] mt-0.5">{currentCat.desc}</p>
                    </div>
                    <div className="flex items-center gap-3 self-start sm:self-auto">
                      {currentCat.isCustom && (
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(currentCat.id)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-400 hover:text-white hover:bg-rose-600 px-3 py-1.5 bg-rose-950/30 border border-rose-800/40 rounded-xl transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus Kategori</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => openAddFieldModal(currentCat.id)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#101828] bg-[#7BBDE8] hover:bg-[#92cbef] rounded-xl transition-colors cursor-pointer shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambah Data</span>
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

      {/* ── Toast Notification Popup ── */}
      {message && (
        <div className="fixed top-6 right-6 z-50 pointer-events-auto">
          <div className="bg-[#171F2F] rounded-2xl border border-[#243048] shadow-md p-4 flex items-center gap-3 max-w-sm sm:max-w-md">
            {message.type === 'success' ? (
              <div className="w-8 h-8 rounded-full bg-emerald-950/40 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-800/40">
                <Check className="w-4 h-4" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-rose-950/40 text-rose-400 flex items-center justify-center shrink-0 border border-rose-800/40">
                <AlertCircle className="w-4 h-4" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-white leading-tight">
                {message.type === 'success' ? 'Berhasil Disimpan' : 'Gagal Menyimpan'}
              </h4>
              <p className="text-xs text-[#6EA2B3] mt-0.5 line-clamp-2">{message.text}</p>
            </div>
            <button
              type="button"
              onClick={() => setMessage(null)}
              className="p-1 rounded-lg text-[#6EA2B3] hover:text-white cursor-pointer"
              title="Tutup notifikasi"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Floating Unsaved Changes Dock Bar ── */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-2xl bg-[#171F2F] text-white rounded-2xl border border-[#243048] shadow-lg px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-[#7BBDE8] animate-pulse shrink-0" />
            <p className="text-xs font-semibold truncate text-[#6EA2B3]">
              Ada perubahan data profil yang belum disimpan
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleResetChanges}
              className="px-4 py-2 text-xs font-medium text-[#6EA2B3] hover:text-white rounded-xl transition-colors cursor-pointer"
            >
              Batalkan
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-[#101828] bg-[#7BBDE8] hover:bg-[#92cbef] rounded-xl transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{saving ? 'Menyimpan...' : 'Simpan (Ctrl+S)'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Modal Tambah Custom Field ── */}
      {showAddFieldModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#171F2F] rounded-2xl border border-[#243048] shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-[#243048] flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Tambah Kolom Kustom</h3>
                <p className="text-xs text-[#6EA2B3] mt-0.5">Tambahkan data spesifik untuk kebutuhan pengisian form</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddFieldModal(false)}
                className="p-1 rounded-lg text-[#6EA2B3] hover:text-white cursor-pointer"
                title="Tutup dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewField} className="p-6 space-y-4">
              {/* Presets Quick Selector */}
              {RICH_CATEGORY_PRESETS[targetCategory]?.length > 0 && (
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#6EA2B3] block mb-2">
                    Rekomendasi Kolom Cepat
                  </label>
                  <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-2 bg-[#101828] rounded-xl border border-[#243048]">
                    {RICH_CATEGORY_PRESETS[targetCategory].slice(0, 8).map(preset => (
                      <button
                        key={preset.key}
                        type="button"
                        onClick={() => applyPresetToModal(preset)}
                        className="text-xs font-medium px-2.5 py-1 rounded-lg bg-[#171F2F] border border-[#243048] hover:border-[#7BBDE8] text-[#6EA2B3] hover:text-white transition-colors cursor-pointer"
                      >
                        + {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tipe Data */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[#6EA2B3] block mb-2">
                  Tipe Data
                </label>
                <div className="grid grid-cols-4 gap-2 p-1 bg-[#101828] rounded-xl border border-[#243048] text-center text-xs font-semibold">
                  {(['text', 'date', 'textarea', 'image'] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setNewFieldType(t)}
                      className={`py-1.5 rounded-lg capitalize transition-colors cursor-pointer ${
                        newFieldType === t
                          ? 'bg-[#7BBDE8] text-[#101828] font-bold shadow-xs'
                          : 'text-[#6EA2B3] hover:text-white'
                      }`}
                    >
                      {t === 'image' ? 'Berkas' : t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Label */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[#6EA2B3] block mb-2">
                  Label Data <span className="text-rose-400">*</span>
                </label>
                <input
                  value={newLabel}
                  onChange={e => handleLabelChange(e.target.value)}
                  placeholder="Contoh: Nomor Paspor, Foto Ijazah"
                  className="w-full h-11 px-4 text-sm rounded-xl border border-[#243048] bg-[#101828] text-white focus:border-[#7BBDE8] outline-none placeholder:text-[#6EA2B3]"
                  required
                />
              </div>

              {/* Key */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[#6EA2B3] block mb-2">
                  Kunci Atribut Autofill <span className="text-rose-400">*</span>
                </label>
                <input
                  value={newKey}
                  onChange={e => setNewKey(slugify(e.target.value))}
                  placeholder="contoh: nomor_paspor"
                  className="w-full h-11 px-4 text-xs font-mono rounded-xl border border-[#243048] bg-[#101828] text-white focus:border-[#7BBDE8] outline-none placeholder:text-[#6EA2B3]"
                  required
                />
              </div>

              {/* Value or Photo Upload */}
              {newFieldType === 'image' ? (
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#6EA2B3] block mb-2">
                    Unggah Berkas Gambar <span className="text-rose-400">*</span>
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
                  <div
                    onClick={() => modalPhotoInputRef.current?.click()}
                    className="p-5 rounded-xl border border-dashed border-[#243048] hover:border-[#7BBDE8] bg-[#101828] hover:bg-[#171F2F] text-center cursor-pointer transition-colors"
                  >
                    {newPhotoData ? (
                      <div className="flex items-center justify-center gap-2 text-emerald-400 font-semibold text-xs">
                        <Check className="w-4 h-4" />
                        <span className="truncate max-w-[200px]">{newPhotoData.name}</span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <Upload className="w-5 h-5 text-[#6EA2B3] mx-auto" />
                        <p className="text-xs font-semibold text-[#7BBDE8]">Pilih berkas foto</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : newFieldType === 'textarea' ? (
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#6EA2B3] block mb-2">
                    Nilai Data <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    value={newValue}
                    onChange={e => setNewValue(e.target.value)}
                    rows={3}
                    placeholder="Isi catatan data..."
                    className="w-full p-4 text-sm rounded-xl border border-[#243048] bg-[#101828] text-white focus:border-[#7BBDE8] outline-none resize-none placeholder:text-[#6EA2B3]"
                    required
                  />
                </div>
              ) : (
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#6EA2B3] block mb-2">
                    Nilai Data <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type={newFieldType === 'date' ? 'date' : 'text'}
                    value={newValue}
                    onChange={e => setNewValue(e.target.value)}
                    placeholder="Isi nilai data..."
                    className="w-full h-11 px-4 text-sm rounded-xl border border-[#243048] bg-[#101828] text-white focus:border-[#7BBDE8] outline-none placeholder:text-[#6EA2B3]"
                    required
                  />
                </div>
              )}

              {fieldError && (
                <p className="text-xs text-rose-400 font-semibold">{fieldError}</p>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-[#243048]">
                <button
                  type="button"
                  onClick={() => setShowAddFieldModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#6EA2B3] hover:text-white hover:bg-[#101828] rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-[#101828] bg-[#7BBDE8] hover:bg-[#92cbef] rounded-xl shadow-xs"
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
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#171F2F] rounded-2xl border border-[#243048] shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-[#243048] flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Buat Kategori Kustom Baru</h3>
                <p className="text-xs text-[#6EA2B3] mt-0.5">Kelompokkan data khusus sesuai kebutuhan pengisian form</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCategoryModal(false)}
                className="p-1 rounded-lg text-[#6EA2B3] hover:text-white cursor-pointer"
                title="Tutup dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCategoryStandalone} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[#6EA2B3] block mb-2">
                  Nama Kategori <span className="text-rose-400">*</span>
                </label>
                <input
                  value={newCategoryTitle}
                  onChange={e => setNewCategoryTitle(e.target.value)}
                  placeholder="Contoh: Dokumen Kendaraan, Rekening Bank"
                  className="w-full h-11 px-4 text-sm rounded-xl border border-[#243048] bg-[#101828] text-white focus:border-[#7BBDE8] outline-none placeholder:text-[#6EA2B3]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[#6EA2B3] block mb-2">
                  Deskripsi Kategori (Opsional)
                </label>
                <input
                  value={newCategoryDesc}
                  onChange={e => setNewCategoryDesc(e.target.value)}
                  placeholder="Contoh: STNK, BPKB, dan nomor plat kendaraan"
                  className="w-full h-11 px-4 text-sm rounded-xl border border-[#243048] bg-[#101828] text-white focus:border-[#7BBDE8] outline-none placeholder:text-[#6EA2B3]"
                />
              </div>

              {categoryError && (
                <p className="text-xs text-rose-400 font-semibold">{categoryError}</p>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-[#243048]">
                <button
                  type="button"
                  onClick={() => setShowAddCategoryModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#6EA2B3] hover:text-white hover:bg-[#101828] rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-[#101828] bg-[#7BBDE8] hover:bg-[#92cbef] rounded-xl shadow-xs"
                >
                  Buat Kategori
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Lightbox Image Preview Modal ── */}
      {previewPhoto && (
        <div
          onClick={() => setPreviewPhoto(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-[#171F2F] rounded-2xl border border-[#243048] max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-xl flex flex-col cursor-default"
          >
            <div className="p-4 border-b border-[#243048] flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white">{previewPhoto.title}</h4>
                <p className="text-xs text-[#6EA2B3]">{previewPhoto.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="p-1 rounded-lg text-[#6EA2B3] hover:text-white cursor-pointer"
                title="Tutup pratinjau"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-[#101828] flex items-center justify-center overflow-auto max-h-[75vh]">
              <img src={previewPhoto.data} alt={previewPhoto.title} className="max-w-full max-h-[70vh] object-contain rounded-lg" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfilePage;