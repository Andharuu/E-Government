import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { profileApi, type Profile } from '../services/api';
import { FontAwesome, Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, EmptyState, Input, Textarea, Select, FormField, Modal } from '../components/ui';

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
const CATEGORY_ICON: Record<string, string> = {
  identity: 'user',
  address: 'map-pin',
  contact: 'phone',
  education: 'graduation-cap',
  career: 'building',
  family: 'heart',
  documents: 'file-lines',
};

// Anchor global yang dipakai indeks pencarian (Layout) — jangan diubah
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

  // Peringatan sebelum meninggalkan halaman jika ada perubahan belum disimpan (F-M3)
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

  // Sinkronisasi anchor global (#section-identity, #section-address, ...) ke kategori aktif
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
    const fieldId = `field-${key}`;
    const placeholder = options?.placeholder || `Masukkan ${label.toLowerCase()}...`;

    return (
      <div className="min-w-0" key={key}>
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <label htmlFor={fieldId} className="label mb-0 leading-snug">
              {label}
            </label>
            {options?.badge && (
              <Badge variant="neutral" size="sm" className="shrink-0">
                {options.badge}
              </Badge>
            )}
          </div>
          {value && (
            <button
              type="button"
              onClick={() => handleCopy(value, key)}
              title="Salin nilai"
              className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-sm px-1 py-0.5 text-[11px] font-medium text-ink-3 transition-colors hover:text-accent-text"
            >
              {copiedKey === key ? (
                <>
                  <FontAwesome name="check" className="text-[10px] text-ok" />
                  <span className="text-ok">Tersalin</span>
                </>
              ) : (
                <>
                  <FontAwesome name="copy" className="text-[10px]" />
                  <span>Salin</span>
                </>
              )}
            </button>
          )}
        </div>

        {type === 'select' ? (
          <Select id={fieldId} value={value} onChange={e => onValueChange(e.target.value)}>
            <option value="">Pilih opsi...</option>
            {options?.selectOptions?.map(opt => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </Select>
        ) : type === 'date' ? (
          <Input
            id={fieldId}
            type="date"
            value={value}
            onChange={e => onValueChange(e.target.value)}
          />
        ) : type === 'textarea' ? (
          <Textarea
            id={fieldId}
            value={value}
            onChange={e => onValueChange(e.target.value)}
            placeholder={placeholder}
            rows={3}
          />
        ) : (
          <Input
            id={fieldId}
            type={type}
            value={value}
            onChange={e => onValueChange(e.target.value)}
            placeholder={placeholder}
          />
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="page">
        <div className="space-y-2">
          <div className="skeleton h-6 w-44" />
          <div className="skeleton h-3.5 w-[320px] max-w-full" />
        </div>
        <div className="skeleton h-[74px] w-full" />
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
          <div className="skeleton h-[280px] lg:col-span-4 xl:col-span-3" />
          <div className="skeleton h-[420px] lg:col-span-8 xl:col-span-9" />
        </div>
        <p className="text-[12px] font-medium text-ink-3">Memuat profil kependudukan...</p>
      </div>
    );
  }

  // Render konten per kategori
  const renderCategoryContent = (catId: string) => {
    const fieldsInCat = customFields.filter(f => f.category === catId);

    return (
      <div className="space-y-5" key={catId}>
        {/* Konten Standar berdasarkan ID */}
        {catId === 'identity' && (
          <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2 xl:grid-cols-3">
            {renderField('Nama Lengkap (Sesuai KTP)', 'full_name', profile?.full_name || '', v => handleChange('full_name', v), { badge: 'Wajib KTP' })}
            {renderField('NIK (Nomor Induk Kependudukan)', 'nik', profile?.nik || '', v => handleChange('nik', v), { isPii: true, badge: '16 Digit' })}
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
          <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2 xl:grid-cols-3">
            <div className="min-w-0 sm:col-span-2 xl:col-span-3">
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
          <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2 xl:grid-cols-3">
            {renderField('Nomor HP / WhatsApp Utama', 'phone', profile?.phone || '', v => handleChange('phone', v), { isPii: true, badge: 'Kontak Utama' })}
            {renderField('Alamat Surel / Email', 'email', profile?.email || '', v => handleChange('email', v))}
            {renderField('Telepon Rumah', 'home_phone', profile?.home_phone ?? getExtendedField('home_phone'), v => { handleChange('home_phone', v); handleExtendedChange('home_phone', v, 'contact', 'Telepon Rumah'); }, { isPii: true })}
            {renderField('Telepon Kantor', 'work_telephone', profile?.work_telephone ?? getExtendedField('work_telephone'), v => { handleChange('work_telephone', v); handleExtendedChange('work_telephone', v, 'contact', 'Telepon Kantor'); })}
            {renderField('Nomor Fax', 'fax', profile?.fax ?? getExtendedField('fax'), v => { handleChange('fax', v); handleExtendedChange('fax', v, 'contact', 'Nomor Fax'); })}
            {renderField('Situs Web / Portofolio', 'website', profile?.website ?? getExtendedField('website'), v => { handleChange('website', v); handleExtendedChange('website', v, 'contact', 'Website'); })}
          </div>
        )}

        {catId === 'education' && (
          <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2 xl:grid-cols-3">
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
          <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2 xl:grid-cols-3">
            {renderField('Profesi / Pekerjaan Saat Ini', 'occupation', profile?.occupation || '', v => handleChange('occupation', v))}
            {renderField('Nama Lembaga / Perusahaan', 'organization', profile?.organization || '', v => handleChange('organization', v))}
            {renderField('Alamat Kantor / Tempat Kerja', 'work_address', profile?.work_address || '', v => handleChange('work_address', v))}
            {renderField('Penghasilan Bulanan (Est.)', 'income', getExtendedField('income'), v => handleExtendedChange('income', v, 'career', 'Penghasilan'), { isPii: true })}
          </div>
        )}

        {catId === 'family' && (
          <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2 xl:grid-cols-3">
            {renderField('Nama Ibu Kandung', 'mother_name', profile?.mother_name || '', v => handleChange('mother_name', v), { isPii: true, badge: 'Validasi Bank/Dukcapil' })}
            {renderField('Nama Ayah Kandung', 'father_name', profile?.father_name || '', v => handleChange('father_name', v))}
            {renderField('Nama Kontak Darurat', 'emergency_contact_name', profile?.emergency_contact_name || '', v => handleChange('emergency_contact_name', v))}
            {renderField('Nomor Kontak Darurat', 'emergency_contact_phone', profile?.emergency_contact_phone || '', v => handleChange('emergency_contact_phone', v), { isPii: true })}
            {renderField('Hubungan Kontak Darurat', 'emergency_contact_relation', getExtendedField('emergency_contact_relation'), v => handleExtendedChange('emergency_contact_relation', v, 'family', 'Hubungan Kontak Darurat'))}
          </div>
        )}

        {catId === 'documents' && (
          <div className="space-y-5">
            {/* Nomor Dokumen Resmi */}
            <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2 xl:grid-cols-3">
              {renderField('Nomor Pokok Wajib Pajak (NPWP)', 'npwp', profile?.npwp || '', v => handleChange('npwp', v), { isPii: true, badge: '16/15 Digit' })}
              {renderField('Nomor BPJS Kesehatan', 'bpjs_number', profile?.bpjs_number || '', v => handleChange('bpjs_number', v), { isPii: true, badge: '13 Digit' })}
              {renderField('Nomor SIM (Surat Izin Mengemudi)', 'driver_license', getExtendedField('driver_license'), v => handleExtendedChange('driver_license', v, 'documents', 'Nomor SIM'), { isPii: true })}
            </div>

            <div className="divider" />

            {/* Berkas Foto Dokumen Resmi */}
            <div className="space-y-3">
              <div>
                <h3 className="text-[13px] font-semibold text-ink">Berkas Foto Resmi &amp; Lampiran Autofill</h3>
                <p className="mt-0.5 text-[11.5px] leading-relaxed text-ink-3">
                  Foto dienkripsi secara lokal dan otomatis diunggah oleh ekstensi GovConnect pada formulir pendaftaran.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                {PHOTO_DOCUMENT_SLOTS.map(slot => {
                  const photo = documentPhotos[slot.id];
                  const hasPhoto = !!photo?.data;

                  return (
                    <div
                      key={slot.id}
                      className={`flex flex-col justify-between rounded-lg border p-3 transition-colors ${
                        hasPhoto
                          ? 'border-line bg-surface'
                          : 'border-dashed border-line-2 bg-surface-2'
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
                        <div className="mb-2 flex items-center gap-2">
                          <FontAwesome name="camera" className="shrink-0 text-[11px] text-ink-3" />
                          <span className="text-[12px] font-semibold leading-tight text-ink">{slot.title}</span>
                        </div>

                        {hasPhoto ? (
                          <div className="group relative mb-2 aspect-[16/10] overflow-hidden rounded-md border border-line bg-surface-2">
                            <img src={photo.data} alt={slot.title} className="h-full w-full object-cover" />
                            <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-canvas/85 opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-within:opacity-100">
                              <Button
                                size="sm"
                                variant="secondary"
                                icon={<FontAwesome name="eye" className="text-[10px]" />}
                                onClick={() => setPreviewPhoto({ title: slot.title, data: photo.data, name: photo.name })}
                              >
                                Lihat
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                icon={<FontAwesome name="arrow-up-from-bracket" className="text-[10px]" />}
                                onClick={() => fileInputRefs.current[slot.id]?.click()}
                              >
                                Ganti
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => fileInputRefs.current[slot.id]?.click()}
                            className="mb-2 flex aspect-[16/10] w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-line-2 bg-surface p-3 text-center transition-colors hover:border-accent-line hover:bg-surface-3"
                          >
                            <FontAwesome name="arrow-up-from-bracket" className="text-[14px] text-ink-3" />
                            <span className="text-[11.5px] font-semibold text-accent-text">Unggah Foto Berkas</span>
                            <span className="text-[10.5px] text-ink-3">JPG / PNG maksimal 5MB</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2 border-t border-line pt-2">
                        <span className="truncate text-[11px] text-ink-3">
                          {hasPhoto ? photo.name : slot.desc}
                        </span>
                        {hasPhoto && (
                          <button
                            type="button"
                            onClick={() => handleRemoveStandardPhoto(slot.id)}
                            className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-sm px-1 py-0.5 text-[11px] font-medium text-danger transition-colors hover:bg-danger-soft"
                          >
                            <FontAwesome name="trash" className="text-[10px]" />
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
        <div className="space-y-2.5 border-t border-line pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">
              Kolom Kustom Tambahan ({fieldsInCat.length})
            </span>
            <Button
              size="sm"
              variant="secondary"
              icon={<FontAwesome name="plus" className="text-[10px]" />}
              onClick={() => openAddFieldModal(catId)}
            >
              Tambah Kolom
            </Button>
          </div>

          {fieldsInCat.length > 0 ? (
            <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
              {fieldsInCat.map(field => {
                const isEditing = editingFieldId === field.id;
                const isImage = field.type === 'image';

                if (isImage) {
                  return (
                    <div
                      key={field.id}
                      className="flex items-center justify-between gap-3 rounded-md border border-line bg-surface-2 p-2.5"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-2.5">
                        {field.photoData ? (
                          <button
                            type="button"
                            onClick={() => setPreviewPhoto({ title: field.label, data: field.photoData!, name: field.photoName || field.value })}
                            className="h-10 w-10 shrink-0 cursor-pointer overflow-hidden rounded-md border border-line bg-surface"
                          >
                            <img src={field.photoData} alt={field.label} className="h-full w-full object-cover" />
                          </button>
                        ) : (
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-line bg-surface text-ink-3">
                            <FontAwesome name="camera" className="text-[12px]" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12px] font-semibold text-ink">{field.label}</p>
                          <p className="mono truncate text-ink-3">{field.key}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="shrink-0 text-danger hover:text-danger"
                        icon={<FontAwesome name="trash" className="text-[10px]" />}
                        onClick={() => handleDeleteField(field.id, field.key)}
                      >
                        Hapus
                      </Button>
                    </div>
                  );
                }

                return (
                  <div
                    key={field.id}
                    className="rounded-md border border-line bg-surface-2 p-2.5"
                  >
                    {isEditing ? (
                      <div className="space-y-2">
                        <Input
                          className="h-8 text-[12.5px]"
                          value={editLabel}
                          onChange={e => setEditLabel(e.target.value)}
                          placeholder="Label data"
                        />
                        <Input
                          className="h-8 text-[12.5px]"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          placeholder="Nilai data"
                        />
                        <div className="flex justify-end gap-1.5">
                          <Button size="sm" variant="ghost" onClick={() => setEditingFieldId(null)}>
                            Batal
                          </Button>
                          <Button size="sm" variant="primary" onClick={() => saveEditField(field.id)}>
                            Simpan
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex min-w-0 items-baseline gap-1.5">
                            <span className="truncate text-[12px] font-semibold text-ink">{field.label}</span>
                            <span className="mono shrink-0 text-ink-3">({field.key})</span>
                          </div>
                          <p className="mt-0.5 truncate text-[11.5px] text-ink-2">{field.value || '-'}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-0.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            iconOnly
                            title="Salin nilai"
                            icon={<FontAwesome name={copiedKey === field.key ? 'check' : 'copy'} className={`text-[11px] ${copiedKey === field.key ? 'text-ok' : ''}`} />}
                            onClick={() => handleCopy(field.value, field.key)}
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            iconOnly
                            title="Edit data"
                            icon={<FontAwesome name="pen" className="text-[11px]" />}
                            onClick={() => startEditField(field)}
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            iconOnly
                            title="Hapus data"
                            className="text-danger hover:text-danger"
                            icon={<FontAwesome name="trash" className="text-[11px]" />}
                            onClick={() => handleDeleteField(field.id, field.key)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={<FontAwesome name="folder-open" className="text-[15px]" />}
              title="Belum ada kolom kustom tambahan pada kategori ini."
              className="py-8"
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="page page-enter pb-24">
      {/* ── Page Header ── */}
      <div className="page-head">
        <div className="min-w-0">
          <h1 className="page-title">Profil Saya</h1>
          <p className="page-sub max-w-[70ch]">
            Kelola data identitas kependudukan, kontak, berkas foto resmi, dan kolom kustom untuk autofill resmi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="primary"
            icon={<FontAwesome name="folder-plus" className="text-[12px]" />}
            onClick={() => setShowAddCategoryModal(true)}
          >
            Kategori Baru
          </Button>
        </div>
      </div>

      {/* ── Profile Completeness ── */}
      <Card>
        <div className="card-body space-y-2.5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="text-[12.5px] font-semibold text-ink">Kelengkapan Profil &amp; Berkas</span>
              <span className="tabular-nums text-[11.5px] text-ink-3">
                ({completeness.filled} dari {completeness.total} data terisi)
              </span>
            </div>
            <span className="tabular-nums text-[12.5px] font-semibold text-accent-text">
              {completeness.percentage}% Lengkap
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-300"
              style={{ width: `${completeness.percentage}%` }}
            />
          </div>
        </div>
      </Card>

      {/* ── Main Workspace ── */}
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
        {/* Category Navigator */}
        <aside className="space-y-3 lg:sticky lg:top-6 lg:col-span-4 xl:col-span-3">
          <Card className="overflow-hidden">
            <div className="card-head">
              <div className="flex items-center gap-2">
                <FontAwesome name="layer-group" className="text-[11px] text-ink-3" />
                <h2 className="card-title">Kategori Data</h2>
              </div>
            </div>

            <div className="px-3 pt-3">
              <div className="relative">
                <FontAwesome
                  name="search"
                  className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-ink-3"
                />
                <Input
                  type="text"
                  value={categorySearchQuery}
                  onChange={e => setCategorySearchQuery(e.target.value)}
                  placeholder="Cari kategori..."
                  className="h-8 pl-8 text-[12.5px]"
                />
              </div>
            </div>

            <nav className="max-h-[calc(100vh-280px)] space-y-0.5 overflow-y-auto p-2">
              <button
                type="button"
                onClick={() => setActiveCategoryId('all')}
                data-active={activeCategoryId === 'all'}
                className={`flex w-full cursor-pointer items-center gap-2.5 rounded-md border px-2.5 py-2 text-left transition-colors ${
                  activeCategoryId === 'all'
                    ? 'border-accent-line bg-accent-soft'
                    : 'border-transparent hover:bg-surface-3'
                }`}
              >
                <FontAwesome
                  name="layer-group"
                  className={`w-4 shrink-0 text-center text-[12px] ${
                    activeCategoryId === 'all' ? 'text-accent-text' : 'text-ink-3'
                  }`}
                />
                <span className="min-w-0 flex-1">
                  <span className={`block truncate text-[12.5px] ${activeCategoryId === 'all' ? 'font-semibold text-ink' : 'font-medium text-ink-2'}`}>
                    Semua Kategori
                  </span>
                  <span className="block truncate text-[11px] text-ink-3">Tampilan penuh</span>
                </span>
              </button>

              {filteredCategories.map(cat => {
                const isActive = activeCategoryId === cat.id;
                const catStats = getCategoryStats(cat.id);

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategoryId(cat.id)}
                    data-active={isActive}
                    className={`flex w-full cursor-pointer items-center gap-2.5 rounded-md border px-2.5 py-2 text-left transition-colors ${
                      isActive
                        ? 'border-accent-line bg-accent-soft'
                        : 'border-transparent hover:bg-surface-3'
                    }`}
                  >
                    <FontAwesome
                      name={cat.isCustom ? 'folder' : (CATEGORY_ICON[cat.id] ?? 'folder')}
                      className={`w-4 shrink-0 text-center text-[12px] ${isActive ? 'text-accent-text' : 'text-ink-3'}`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate text-[12.5px] ${isActive ? 'font-semibold text-ink' : 'font-medium text-ink-2'}`}>
                        {cat.title}
                      </span>
                      <span className="block truncate text-[11px] text-ink-3">{cat.desc}</span>
                    </span>
                    <span
                      className={`shrink-0 rounded-full border px-1.5 py-0.5 tabular-nums text-[10.5px] font-semibold ${
                        isActive
                          ? 'border-accent-line bg-surface text-accent-text'
                          : 'border-line bg-surface-3 text-ink-3'
                      }`}
                    >
                      {catStats.filled}/{catStats.total}
                    </span>
                  </button>
                );
              })}
            </nav>
          </Card>
        </aside>

        {/* Active Category Editor */}
        <div className="space-y-4 lg:col-span-8 xl:col-span-9">
          {activeCategoryId === 'all' ? (
            allCategories.map(cat => (
              <Card key={cat.id} id={sectionIdFor(cat.id)}>
                <CardHeader>
                  <div className="min-w-0">
                    <CardTitle>{cat.title}</CardTitle>
                    <CardDescription>{cat.desc}</CardDescription>
                  </div>
                  {cat.isCustom && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="shrink-0 text-danger hover:text-danger"
                      icon={<FontAwesome name="trash" className="text-[10px]" />}
                      onClick={() => handleDeleteCategory(cat.id)}
                    >
                      Hapus Kategori
                    </Button>
                  )}
                </CardHeader>
                <CardContent>{renderCategoryContent(cat.id)}</CardContent>
              </Card>
            ))
          ) : (
            (() => {
              const currentCat = allCategories.find(c => c.id === activeCategoryId) || allCategories[0];
              return (
                <Card id={sectionIdFor(currentCat.id)}>
                  <CardHeader>
                    <div className="min-w-0">
                      <CardTitle>{currentCat.title}</CardTitle>
                      <CardDescription>{currentCat.desc}</CardDescription>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {currentCat.isCustom && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-danger hover:text-danger"
                          icon={<FontAwesome name="trash" className="text-[10px]" />}
                          onClick={() => handleDeleteCategory(currentCat.id)}
                        >
                          Hapus Kategori
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="primary"
                        icon={<FontAwesome name="plus" className="text-[10px]" />}
                        onClick={() => openAddFieldModal(currentCat.id)}
                      >
                        Tambah Data
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>{renderCategoryContent(currentCat.id)}</CardContent>
                </Card>
              );
            })()
          )}
        </div>
      </div>

      {/* ── Toast Notification ── */}
      {message && (
        <div className="pointer-events-auto fixed right-4 top-4 z-50 w-full max-w-sm">
          <div className="card flex items-start gap-2.5 p-3">
            <span
              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${
                message.type === 'success'
                  ? 'border-ok-line bg-ok-soft text-ok'
                  : 'border-danger-line bg-danger-soft text-danger'
              }`}
            >
              <FontAwesome name={message.type === 'success' ? 'check' : 'circle-exclamation'} className="text-[10px]" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold leading-tight text-ink">
                {message.type === 'success' ? 'Berhasil Disimpan' : 'Gagal Menyimpan'}
              </p>
              <p className="mt-0.5 line-clamp-2 text-[11.5px] leading-relaxed text-ink-2">{message.text}</p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              iconOnly
              title="Tutup notifikasi"
              className="h-6 w-6"
              icon={<FontAwesome name="xmark" className="text-[11px]" />}
              onClick={() => setMessage(null)}
            />
          </div>
        </div>
      )}

      {/* ── Sticky Action Bar: Unsaved Changes ── */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-4 left-1/2 z-40 w-[94%] max-w-2xl -translate-x-1/2">
          <div className="card flex items-center justify-between gap-3 px-3 py-2.5 shadow-lg">
            <div className="flex min-w-0 items-center gap-2">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-warn" />
              <p className="truncate text-[12px] font-medium text-ink-2">
                Ada perubahan data profil yang belum disimpan
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Button size="sm" variant="ghost" onClick={handleResetChanges}>
                Batalkan
              </Button>
              <Button
                size="sm"
                variant="primary"
                loading={saving}
                icon={<FontAwesome name="floppy-disk" className="text-[11px]" />}
                onClick={handleSave}
              >
                {saving ? 'Menyimpan...' : 'Simpan (Ctrl+S)'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Tambah Custom Field ── */}
      {showAddFieldModal && (
        <Modal isOpen onClose={() => setShowAddFieldModal(false)}>
          <div className="card w-full max-w-md overflow-hidden">
            <div className="card-head">
              <div className="min-w-0">
                <h3 className="card-title">Tambah Kolom Kustom</h3>
                <p className="card-desc">Tambahkan data spesifik untuk kebutuhan pengisian form</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                iconOnly
                title="Tutup dialog"
                className="h-7 w-7"
                icon={<FontAwesome name="xmark" className="text-[12px]" />}
                onClick={() => setShowAddFieldModal(false)}
              />
            </div>

            <form onSubmit={handleSaveNewField}>
              <div className="card-body max-h-[68vh] space-y-4 overflow-y-auto">
                {/* Presets Quick Selector */}
                {RICH_CATEGORY_PRESETS[targetCategory]?.length > 0 && (
                  <div>
                    <label className="label">Rekomendasi Kolom Cepat</label>
                    <div className="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto rounded-md border border-line bg-surface-2 p-2">
                      {RICH_CATEGORY_PRESETS[targetCategory].slice(0, 8).map(preset => (
                        <button
                          key={preset.key}
                          type="button"
                          onClick={() => applyPresetToModal(preset)}
                          className="cursor-pointer rounded-sm border border-line bg-surface px-2 py-1 text-[11.5px] font-medium text-ink-2 transition-colors hover:border-accent-line hover:text-ink"
                        >
                          + {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tipe Data */}
                <div>
                  <span className="label">Tipe Data</span>
                  <div className="segmented w-full">
                    {(['text', 'date', 'textarea', 'image'] as const).map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setNewFieldType(t)}
                        data-active={newFieldType === t}
                        className="segmented-item flex-1 justify-center capitalize"
                      >
                        {t === 'image' ? 'Berkas' : t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Label */}
                <FormField label="Label Data" required htmlFor="new-field-label">
                  <Input
                    id="new-field-label"
                    value={newLabel}
                    onChange={e => handleLabelChange(e.target.value)}
                    placeholder="Contoh: Nomor Paspor, Foto Ijazah"
                    required
                  />
                </FormField>

                {/* Key */}
                <FormField
                  label="Kunci Atribut Autofill"
                  required
                  htmlFor="new-field-key"
                >
                  <Input
                    id="new-field-key"
                    value={newKey}
                    onChange={e => setNewKey(slugify(e.target.value))}
                    placeholder="contoh: nomor_paspor"
                    className="mono"
                    required
                  />
                </FormField>

                {/* Value or Photo Upload */}
                {newFieldType === 'image' ? (
                  <div>
                    <span className="label">
                      Unggah Berkas Gambar <span className="text-danger">*</span>
                    </span>
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
                      className="flex w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-line-2 bg-surface-2 px-4 py-5 text-center transition-colors hover:border-accent-line hover:bg-surface-3"
                    >
                      {newPhotoData ? (
                        <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-ok">
                          <FontAwesome name="check" className="text-[10px]" />
                          <span className="max-w-[220px] truncate">{newPhotoData.name}</span>
                        </span>
                      ) : (
                        <>
                          <FontAwesome name="arrow-up-from-bracket" className="text-[14px] text-ink-3" />
                          <span className="text-[12px] font-semibold text-accent-text">Pilih berkas foto</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : newFieldType === 'textarea' ? (
                  <FormField label="Nilai Data" required htmlFor="new-field-value">
                    <Textarea
                      id="new-field-value"
                      value={newValue}
                      onChange={e => setNewValue(e.target.value)}
                      rows={3}
                      placeholder="Isi catatan data..."
                      required
                    />
                  </FormField>
                ) : (
                  <FormField label="Nilai Data" required htmlFor="new-field-value">
                    <Input
                      id="new-field-value"
                      type={newFieldType === 'date' ? 'date' : 'text'}
                      value={newValue}
                      onChange={e => setNewValue(e.target.value)}
                      placeholder="Isi nilai data..."
                      required
                    />
                  </FormField>
                )}

                {fieldError && <p className="err">{fieldError}</p>}
              </div>

              <div className="card-foot justify-end">
                <Button variant="ghost" onClick={() => setShowAddFieldModal(false)}>
                  Batal
                </Button>
                <Button type="submit" variant="primary">
                  Tambahkan Kolom
                </Button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {/* ── Modal Tambah Kategori Baru ── */}
      {showAddCategoryModal && (
        <Modal isOpen onClose={() => setShowAddCategoryModal(false)}>
          <div className="card w-full max-w-md overflow-hidden">
            <div className="card-head">
              <div className="min-w-0">
                <h3 className="card-title">Buat Kategori Kustom Baru</h3>
                <p className="card-desc">Kelompokkan data khusus sesuai kebutuhan pengisian form</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                iconOnly
                title="Tutup dialog"
                className="h-7 w-7"
                icon={<FontAwesome name="xmark" className="text-[12px]" />}
                onClick={() => setShowAddCategoryModal(false)}
              />
            </div>

            <form onSubmit={handleCreateCategoryStandalone}>
              <div className="card-body space-y-4">
                <FormField label="Nama Kategori" required htmlFor="new-category-title">
                  <Input
                    id="new-category-title"
                    value={newCategoryTitle}
                    onChange={e => setNewCategoryTitle(e.target.value)}
                    placeholder="Contoh: Dokumen Kendaraan, Rekening Bank"
                    required
                  />
                </FormField>

                <FormField label="Deskripsi Kategori (Opsional)" htmlFor="new-category-desc">
                  <Input
                    id="new-category-desc"
                    value={newCategoryDesc}
                    onChange={e => setNewCategoryDesc(e.target.value)}
                    placeholder="Contoh: STNK, BPKB, dan nomor plat kendaraan"
                  />
                </FormField>

                {categoryError && <p className="err">{categoryError}</p>}
              </div>

              <div className="card-foot justify-end">
                <Button variant="ghost" onClick={() => setShowAddCategoryModal(false)}>
                  Batal
                </Button>
                <Button type="submit" variant="primary">
                  Buat Kategori
                </Button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {/* ── Lightbox Image Preview ── */}
      {previewPhoto && (
        <Modal
          isOpen
          onClose={() => setPreviewPhoto(null)}
          overlayClassName="bg-black/60 cursor-pointer"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="card flex max-h-[90vh] w-full max-w-3xl cursor-default flex-col overflow-hidden"
          >
            <div className="card-head">
              <div className="min-w-0">
                <h4 className="card-title truncate">{previewPhoto.title}</h4>
                <p className="card-desc truncate">{previewPhoto.name}</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                iconOnly
                title="Tutup pratinjau"
                className="h-7 w-7 shrink-0"
                icon={<FontAwesome name="xmark" className="text-[12px]" />}
                onClick={() => setPreviewPhoto(null)}
              />
            </div>
            <div className="flex max-h-[75vh] items-center justify-center overflow-auto bg-surface-2 p-3">
              <img
                src={previewPhoto.data}
                alt={previewPhoto.title}
                className="max-h-[70vh] max-w-full rounded-md object-contain"
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default ProfilePage;
