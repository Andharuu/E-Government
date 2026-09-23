import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { profileApi, type Profile } from '../services/api';
import {
  Loader2, Save, AlertCircle, CheckCircle2, User, MapPin, Phone,
  GraduationCap, Briefcase, HeartHandshake, FileText, Sparkles,
  Plus, Trash2, Edit3, Copy, Check, Info, ShieldCheck,
  Upload, Camera, FolderPlus, X, Eye, Calendar, AlignLeft,
  FileCheck2, ChevronDown, Folder, Image, Users
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
    setProfile(prev => {
      if (!prev) return null;
      const updated = { ...prev, [key]: value };
      // Auto-sync First Name & Last Name jika Full Name berubah dan belum diset
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
      // Sinkronkan nama lengkap jika first_name atau last_name diedit
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
    // 1. Guard konkurensi: cegah eksekusi berulang jika proses simpan sedang berjalan
    if (isSavingRef.current || !profile) return;

    // 2. Cooldown guard: minimal jeda 800ms antar panggilan simpan
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
      isSavingRef.current = false;
      setSaving(false);
    }
  }, [profile, customFields, userCategories, documentPhotos]);

  // Keyboard shortcut: Ctrl+S (dengan proteksi key-hold e.repeat & status saving)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();

        // Cegah eksekusi jika tombol ditahan (auto-repeat OS) atau sedang menyimpan
        if (e.repeat || isSavingRef.current) {
          return;
        }

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
      <div className="mt-6 pt-5 border-t border-border-default space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-content-secondary uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            Data Kustom pada {catTitle} ({fieldsInCat.length})
          </span>
          <button
            type="button"
            onClick={() => openAddFieldModal(catId)}
            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-brand-600 bg-accent-50 hover:bg-accent-100 border border-border-default rounded-lg transition-colors"
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
                    className="p-3.5 bg-accent-50/40 hover:bg-accent-50/70 rounded-lg border border-border-default shadow-sm flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {field.photoData ? (
                        <div
                          onClick={() => setPreviewPhoto({ title: field.label, data: field.photoData!, name: field.photoName || field.value })}
                          className="w-12 h-12 rounded-lg bg-surface-sunken border border-border-default overflow-hidden cursor-pointer flex-shrink-0 relative group"
                        >
                          <img src={field.photoData} alt={field.label} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                            <Eye className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-accent-100 text-brand-600 flex items-center justify-center flex-shrink-0">
                          <Camera className="w-6 h-6" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-content-primary truncate">{field.label}</span>
                          <span className="text-[9px] font-mono text-brand-600 bg-accent-100/70 px-1.5 py-0.5 rounded">
                            {field.key}
                          </span>
                        </div>
                        <div className="text-[11px] text-success-700 font-medium flex items-center gap-1">
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
                          className="p-1.5 text-content-tertiary hover:text-content-secondary hover:bg-surface-sunken/60 rounded-lg"
                          title="Lihat foto"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteField(field.id, field.key)}
                        className="p-1.5 text-content-tertiary hover:text-error-600 hover:bg-error-50 rounded-lg"
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
                  <div key={field.id} className="p-3.5 bg-accent-50/50 rounded-lg border border-border-strong space-y-2.5">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-semibold text-content-secondary">Label</label>
                        <input
                          type="text"
                          value={editLabel}
                          onChange={e => setEditLabel(e.target.value)}
                          className="w-full px-2.5 py-1 text-xs bg-surface-elevated border border-border-default rounded-md"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-content-secondary">Kunci</label>
                        <input
                          type="text"
                          value={editKey}
                          onChange={e => setEditKey(slugify(e.target.value))}
                          className="w-full px-2.5 py-1 text-xs font-mono bg-surface-elevated border border-border-default rounded-md"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-content-secondary">Nilai</label>
                      <input
                        type="text"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        className="w-full px-2.5 py-1 text-xs bg-surface-elevated border border-border-default rounded-md"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setEditingFieldId(null)}
                        className="px-2.5 py-1 text-xs text-content-secondary hover:bg-surface-sunken/60 rounded"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={() => saveEditField(field.id)}
                        className="px-3 py-1 text-xs font-medium bg-accent-600 text-white rounded hover:bg-accent-700"
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
                  className="p-3 bg-surface-sunken/70 hover:bg-surface-elevated rounded-lg border border-border-default hover:border-border-strong flex items-center justify-between gap-2.5 transition-colors shadow-sm"
                >
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-content-primary truncate">{field.label}</span>
                      <span className="text-[9px] font-mono text-brand-600 bg-accent-50 px-1.5 py-0.5 rounded border border-blue-100">
                        {field.key}
                      </span>
                      {field.type === 'date' && (
                        <span className="text-[9px] text-amber-700 bg-amber-50 px-1 rounded">Tanggal</span>
                      )}
                    </div>
                    <div className="text-xs font-medium text-content-secondary truncate">{field.value}</div>
                  </div>

                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopy(field.value, field.id)}
                      className="p-1.5 text-content-tertiary hover:text-content-secondary hover:bg-surface-sunken/50 rounded-lg"
                      title="Salin nilai"
                    >
                      {copiedKey === field.id ? <Check className="w-3.5 h-3.5 text-success-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => startEditField(field)}
                      className="p-1.5 text-content-tertiary hover:text-brand-600 hover:bg-accent-50 rounded-lg"
                      title="Edit"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteField(field.id)}
                      className="p-1.5 text-content-tertiary hover:text-error-600 hover:bg-error-50 rounded-lg"
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
        <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium text-content-secondary">Memuat profil GovConnect...</span>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 pb-24">
      {/* Top Banner & Action Header */}
      <div className="bg-surface-elevated rounded-lg border border-border-default p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl lg:text-3xl font-bold text-content-primary tracking-tight">
                My Profile
              </h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-accent-light text-brand-600 border border-brand-500/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                Terverifikasi
              </span>
            </div>
            <p className="text-sm text-content-tertiary">
              Kelola data identitas dan dokumen untuk autofill ekstensi
            </p>
          </div>

          {/* Profile Completion Progress & Quick Actions */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-content-tertiary">Kelengkapan Profil</p>
                <p className="text-2xl font-bold text-content-primary tabular-nums">{completeness.percentage}%</p>
              </div>
              <div className="w-16 h-16 relative">
                <svg className="w-16 h-16 transform -rotate-90">
                  <circle cx="32" cy="32" r="28" stroke="#e8ecf2" strokeWidth="6" fill="none" />
                  <circle
                    cx="32" cy="32" r="28"
                    stroke="#1e40af"
                    strokeWidth="6"
                    fill="none"
                    strokeDasharray={`${(completeness.percentage / 100) * 176} 176`}
                    className="transition-all duration-slow ease-layout"
                  />
                </svg>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-3 border-l border-border-default pl-6">
              <button
                type="button"
                onClick={() => setShowAddCategoryModal(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-surface-sunken hover:bg-surface-base text-content-secondary font-medium text-xs rounded-md border border-border-default transition-colors-fast cursor-pointer"
              >
                <FolderPlus className="w-4 h-4 text-brand-600" />
                + Kategori Baru
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 active:scale-[0.98] text-white font-medium text-xs rounded-md shadow-xs transition-colors-fast disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {saving ? 'Menyimpan...' : 'Simpan (Ctrl+S)'}
              </button>
            </div>
          </div>
        </div>

        {/* Unsaved Changes Warning */}
        {hasUnsavedChanges && (
          <div className="mt-4 p-3 bg-warning-light border border-warning/30 rounded-md flex items-center gap-2 text-xs font-medium text-warning-dark">
            <AlertCircle className="w-4 h-4 text-warning flex-shrink-0" />
            Ada perubahan yang belum disimpan. Tekan Ctrl+S untuk menyimpan.
          </div>
        )}
      </div>

      {/* Alert Messages */}
      {message && (
        <div
          className={`p-4 rounded-lg flex items-center gap-3 border shadow-sm transition-colors ${
            message.type === 'success'
              ? 'bg-success-50 text-success border-success/30'
              : 'bg-error-50 text-error border-error/30'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-success-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-error-600 flex-shrink-0" />
          )}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      {/* Navigation Quick Links */}
      <div className="sticky top-20 z-20 bg-surface-elevated/90 backdrop-blur-md p-2 rounded-lg border border-border-default flex items-center gap-1.5 overflow-x-auto text-xs font-medium">
        <a href="#section-identity" className="px-3 py-1.5 rounded-md hover:bg-surface-sunken text-content-secondary whitespace-nowrap transition-colors-fast">
          <User className="w-4 h-4" aria-hidden="true" />
          Identitas
        </a>
        <a href="#section-address" className="px-3 py-1.5 rounded-md hover:bg-surface-sunken text-content-secondary whitespace-nowrap transition-colors-fast">
          <MapPin className="w-4 h-4" aria-hidden="true" />
          Alamat
        </a>
        <a href="#section-contact" className="px-3 py-1.5 rounded-md hover:bg-surface-sunken text-content-secondary whitespace-nowrap transition-colors-fast">
          <Phone className="w-4 h-4" aria-hidden="true" />
          Kontak
        </a>
        <a href="#section-education" className="px-3 py-1.5 rounded-md hover:bg-surface-sunken text-content-secondary whitespace-nowrap transition-colors-fast">
          <GraduationCap className="w-4 h-4" aria-hidden="true" />
          Pendidikan
        </a>
        <a href="#section-career" className="px-3 py-1.5 rounded-md hover:bg-surface-sunken text-content-secondary whitespace-nowrap transition-colors-fast">
          <Briefcase className="w-4 h-4" aria-hidden="true" />
          Pekerjaan
        </a>
        <a href="#section-family" className="px-3 py-1.5 rounded-md hover:bg-surface-sunken text-content-secondary whitespace-nowrap transition-colors-fast">
          <Users className="w-4 h-4" aria-hidden="true" />
          Keluarga
        </a>
        <a href="#section-documents" className="px-3 py-1.5 rounded-md bg-accent-light text-brand-600 font-semibold border border-brand-500/30 whitespace-nowrap transition-colors-fast">
          <FileText className="w-4 h-4" aria-hidden="true" />
          Dokumen & Foto Berkas
        </a>
        {userCategories.map(cat => (
          <a
            key={cat.id}
            href={`#section-${cat.id}`}
            className="px-3 py-1.5 rounded-md bg-accent-light hover:bg-accent-light/80 text-brand-600 font-medium border border-brand-500/30 whitespace-nowrap transition-colors-fast"
          >
            <Folder className="w-4 h-4" aria-hidden="true" />
            {cat.title}
          </a>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: IDENTITAS KEPENDUDUKAN (KTP) */}
      {/* ========================================================================= */}
      <section id="section-identity" className="bg-surface-elevated rounded-lg border border-border-default p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-border-default pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-accent-light text-brand-600 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-content-primary">Identitas Diri</h2>
              <p className="text-xs text-content-tertiary">Data kependudukan sesuai KTP</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => openAddFieldModal('identity')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-600 bg-accent-light hover:bg-accent-light/80 border border-brand-500/30 rounded-md transition-colors-fast cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            + Tambah Data Identitas
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Nama Lengkap */}
          <div className="space-y-1 lg:col-span-2">
            <label htmlFor="pf-full_name" className="block text-xs font-semibold text-content-secondary">
              Nama Lengkap <span className="text-error">*</span>
            </label>
            <input
              id="pf-full_name"
              type="text"
              value={profile?.full_name || ''}
              onChange={e => handleChange('full_name', e.target.value)}
              placeholder="Contoh: Andharu Raffi Pratama"
              className="w-full px-3 py-2 text-sm bg-surface-sunken/60 border border-border-default rounded-md text-content-primary placeholder:text-content-disabled focus:bg-surface-elevated focus:ring-2 focus:ring-border-focus focus:outline-none transition-colors-fast"
            />
          </div>

          {/* Title / Sapaan */}
          <div className="space-y-1">
            <label htmlFor="pf-title" className="block text-xs font-semibold text-content-secondary">
              Title / Sapaan (RoboForm)
            </label>
            <input
              id="pf-title"
              type="text"
              value={getExtendedField('title')}
              onChange={e => handleExtendedChange('title', e.target.value, 'identity', 'Title / Sapaan')}
              placeholder="Mr / Mrs / Ms / Dr"
              className="w-full px-3 py-2 text-sm bg-surface-sunken/60 border border-border-default rounded-md text-content-primary placeholder:text-content-disabled focus:bg-surface-elevated focus:ring-2 focus:ring-border-focus focus:outline-none transition-colors-fast"
            />
          </div>

          {/* Nama Depan (First Name) */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-content-secondary">
              Nama Depan (First Name)
            </label>
            <input
              type="text"
              value={profile?.first_name || getExtendedField('first_name')}
              onChange={e => handleExtendedChange('first_name', e.target.value, 'identity', 'Nama Depan')}
              placeholder="Contoh: Andharu"
              className="w-full px-3 py-2 text-sm bg-surface-sunken/60 border border-border-default rounded-md text-content-primary placeholder:text-content-disabled focus:bg-surface-elevated focus:ring-2 focus:ring-border-focus focus:outline-none transition-colors-fast"
            />
          </div>

          {/* Inisial Tengah (Middle Initial) */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-content-secondary">
              Inisial Tengah (Middle Initial)
            </label>
            <input
              type="text"
              maxLength={2}
              value={getExtendedField('middle_initial')}
              onChange={e => handleExtendedChange('middle_initial', e.target.value, 'identity', 'Inisial Tengah')}
              placeholder="R"
              className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-surface-sunken/60 border border-border-default rounded-md text-content-primary placeholder:text-content-disabled focus:bg-surface-elevated focus:ring-2 focus:ring-border-focus focus:outline-none transition-colors-fast"
            />
          </div>

          {/* Nama Belakang (Last Name) */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-content-secondary">
              Nama Belakang (Last Name)
            </label>
            <input
              type="text"
              value={profile?.last_name || getExtendedField('last_name')}
              onChange={e => handleExtendedChange('last_name', e.target.value, 'identity', 'Nama Belakang')}
              placeholder="Contoh: Pratama"
              className="w-full px-3 py-2 text-sm bg-surface-sunken/60 border border-border-default rounded-md text-content-primary placeholder:text-content-disabled focus:bg-surface-elevated focus:ring-2 focus:ring-border-focus focus:outline-none transition-colors-fast"
            />
          </div>

          {/* NIK */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="pf-nik" className="block text-xs font-semibold text-content-secondary">
                NIK (Nomor Induk Kependudukan) <span className="text-error">*</span>
              </label>
              <span className="text-[10px] text-content-tertiary font-mono">16 Digit</span>
            </div>
            <input
              id="pf-nik"
              type="text"
              maxLength={16}
              value={profile?.nik || ''}
              onChange={e => handleChange('nik', e.target.value)}
              placeholder="351508xxxxxxxxxx"
              className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-surface-sunken/60 border border-border-default rounded-md text-content-primary placeholder:text-content-disabled focus:bg-surface-elevated focus:ring-2 focus:ring-border-focus focus:outline-none transition-colors-fast"
            />
          </div>

          {/* Tempat Lahir */}
          <div className="space-y-1">
            <label htmlFor="pf-tempat_lahir" className="block text-xs font-semibold text-content-secondary">Tempat Lahir</label>
            <input
              id="pf-tempat_lahir"
              type="text"
              value={profile?.birth_place || ''}
              onChange={e => handleChange('birth_place', e.target.value)}
              placeholder="Contoh: Sidoarjo"
              className="w-full px-3 py-2 text-sm bg-surface-sunken/60 border border-border-default rounded-md text-content-primary placeholder:text-content-disabled focus:bg-surface-elevated focus:ring-2 focus:ring-border-focus focus:outline-none transition-colors-fast"
            />
          </div>

          {/* Tanggal Lahir */}
          <div className="space-y-1">
            <label htmlFor="pf-tanggal_lahir" className="block text-xs font-semibold text-content-secondary">
              Tanggal Lahir <span className="text-error">*</span>
            </label>
            <input
              id="pf-tanggal_lahir"
              type="date"
              value={profile?.birth_date || ''}
              onChange={e => handleChange('birth_date', e.target.value)}
              className="w-full px-3 py-2 text-sm tabular-nums bg-surface-sunken/60 border border-border-default rounded-md text-content-primary focus:bg-surface-elevated focus:ring-2 focus:ring-border-focus focus:outline-none transition-colors-fast"
            />
          </div>

          {/* Jenis Kelamin */}
          <div className="space-y-1">
            <label htmlFor="pf-jenis_kelamin" className="block text-xs font-semibold text-content-secondary">
              Jenis Kelamin <span className="text-error">*</span>
            </label>
            <select
              id="pf-jenis_kelamin"
              value={profile?.gender || ''}
              onChange={e => handleChange('gender', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-surface-sunken/60 border border-border-default rounded-md text-content-primary focus:bg-surface-elevated focus:ring-2 focus:ring-border-focus focus:outline-none transition-colors-fast"
            >
              <option value="">-- Pilih Jenis Kelamin --</option>
              <option value="Laki-laki">Laki-laki</option>
              <option value="Perempuan">Perempuan</option>
            </select>
          </div>

          {/* Agama */}
          <div className="space-y-1">
            <label htmlFor="pf-agama" className="block text-xs font-semibold text-content-secondary">Agama</label>
            <select
              id="pf-agama"
              value={profile?.religion || ''}
              onChange={e => handleChange('religion', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-surface-sunken/60 border border-border-default rounded-md text-content-primary focus:bg-surface-elevated focus:ring-2 focus:ring-border-focus focus:outline-none transition-colors-fast"
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
          <div className="space-y-1">
            <label htmlFor="pf-status_perkawinan" className="block text-xs font-semibold text-content-secondary">Status Perkawinan</label>
            <select
              id="pf-status_perkawinan"
              value={profile?.marital_status || ''}
              onChange={e => handleChange('marital_status', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-surface-sunken/60 border border-border-default rounded-md text-content-primary focus:bg-surface-elevated focus:ring-2 focus:ring-border-focus focus:outline-none transition-colors-fast"
            >
              <option value="">-- Pilih Status Perkawinan --</option>
              <option value="Belum Kawin">Belum Kawin</option>
              <option value="Kawin">Kawin</option>
              <option value="Cerai Hidup">Cerai Hidup</option>
              <option value="Cerai Mati">Cerai Mati</option>
            </select>
          </div>

          {/* Golongan Darah */}
          <div className="space-y-1">
            <label htmlFor="pf-golongan_darah" className="block text-xs font-semibold text-content-secondary">Golongan Darah</label>
            <select
              id="pf-golongan_darah"
              value={profile?.blood_type || ''}
              onChange={e => handleChange('blood_type', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-surface-sunken/60 border border-border-default rounded-md text-content-primary focus:bg-surface-elevated focus:ring-2 focus:ring-border-focus focus:outline-none transition-colors-fast"
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
      <section id="section-address" className="bg-surface-elevated rounded-lg border border-border-default p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-border-default pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-accent-light text-brand-600 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-content-primary">Alamat & Domisili</h2>
              <p className="text-xs text-content-tertiary">Alamat tempat tinggal resmi sesuai dokumen kependudukan.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => openAddFieldModal('address')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-600 bg-accent-light hover:bg-accent-light/80 border border-brand-500/30 rounded-md transition-colors-fast cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            + Tambah Data Alamat
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1 lg:col-span-3">
            <label htmlFor="pf-street" className="block text-xs font-semibold text-content-secondary">
              Alamat Jalan / RT / RW / No. Rumah (Address Line 1) <span className="text-error">*</span>
            </label>
            <textarea
              id="pf-street"
              rows={2}
              value={profile?.address || ''}
              onChange={e => handleChange('address', e.target.value)}
              placeholder="Contoh: Jl. Pahlawan No. 45 RT 02 / RW 03"
              className="w-full px-3 py-2 text-sm bg-surface-sunken/60 border border-border-default rounded-md text-content-primary placeholder:text-content-disabled focus:bg-surface-elevated focus:ring-2 focus:ring-border-focus focus:outline-none transition-colors-fast"
            />
          </div>

          <div className="space-y-1 lg:col-span-2">
            <label className="block text-xs font-semibold text-content-secondary">
              Alamat Baris 2 / Gedung / Kavling (Address Line 2)
            </label>
            <input
              type="text"
              value={getExtendedField('address_line_2')}
              onChange={e => handleExtendedChange('address_line_2', e.target.value, 'address', 'Address Line 2')}
              placeholder="Contoh: Gedung Graha Lantai 4, Kavling 12"
              className="w-full px-3 py-2 text-sm bg-surface-sunken/60 border border-border-default rounded-md text-content-primary placeholder:text-content-disabled focus:bg-surface-elevated focus:ring-2 focus:ring-border-focus focus:outline-none transition-colors-fast"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-content-secondary">
              Negara (Country)
            </label>
            <input
              type="text"
              value={profile?.country || getExtendedField('country', 'Indonesia')}
              onChange={e => handleExtendedChange('country', e.target.value, 'address', 'Negara')}
              placeholder="Indonesia"
              className="w-full px-3 py-2 text-sm bg-surface-sunken/60 border border-border-default rounded-md text-content-primary placeholder:text-content-disabled focus:bg-surface-elevated focus:ring-2 focus:ring-border-focus focus:outline-none transition-colors-fast"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="pf-provinsi" className="block text-xs font-semibold text-content-secondary">
              Provinsi <span className="text-error">*</span>
            </label>
            <input
              id="pf-provinsi"
              type="text"
              value={profile?.province || ''}
              onChange={e => handleChange('province', e.target.value)}
              placeholder="Contoh: Jawa Timur"
              className="w-full px-3 py-2 text-sm bg-surface-sunken/60 border border-border-default rounded-md text-content-primary placeholder:text-content-disabled focus:bg-surface-elevated focus:ring-2 focus:ring-border-focus focus:outline-none transition-colors-fast"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="pf-kota" className="block text-xs font-semibold text-content-secondary">
              Kabupaten / Kota <span className="text-error">*</span>
            </label>
            <input
              id="pf-kota"
              type="text"
              value={profile?.city || ''}
              onChange={e => handleChange('city', e.target.value)}
              placeholder="Contoh: Kabupaten Sidoarjo"
              className="w-full px-3 py-2 text-sm bg-surface-sunken/60 border border-border-default rounded-md text-content-primary placeholder:text-content-disabled focus:bg-surface-elevated focus:ring-2 focus:ring-border-focus focus:outline-none transition-colors-fast"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="pf-kecamatan" className="block text-xs font-semibold text-content-secondary">
              Kecamatan <span className="text-error">*</span>
            </label>
            <input
              id="pf-kecamatan"
              type="text"
              value={profile?.district || ''}
              onChange={e => handleChange('district', e.target.value)}
              placeholder="Contoh: Waru"
              className="w-full px-3 py-2 text-sm bg-surface-sunken/60 border border-border-default rounded-md text-content-primary placeholder:text-content-disabled focus:bg-surface-elevated focus:ring-2 focus:ring-border-focus focus:outline-none transition-colors-fast"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="pf-kelurahan" className="block text-xs font-semibold text-content-secondary">
              Kelurahan / Desa <span className="text-error">*</span>
            </label>
            <input
              id="pf-kelurahan"
              type="text"
              value={profile?.village || ''}
              onChange={e => handleChange('village', e.target.value)}
              placeholder="Contoh: Pepelegi"
              className="w-full px-3 py-2 text-sm bg-surface-sunken/60 border border-border-default rounded-md text-content-primary placeholder:text-content-disabled focus:bg-surface-elevated focus:ring-2 focus:ring-border-focus focus:outline-none transition-colors-fast"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="pf-kode_pos" className="block text-xs font-semibold text-content-secondary">Kode Pos</label>
            <input
              id="pf-kode_pos"
              type="text"
              maxLength={5}
              value={profile?.postal_code || ''}
              onChange={e => handleChange('postal_code', e.target.value)}
              placeholder="61256"
              className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-surface-sunken/60 border border-border-default rounded-md text-content-primary placeholder:text-content-disabled focus:bg-surface-elevated focus:ring-2 focus:ring-border-focus focus:outline-none transition-colors-fast"
            />
          </div>
        </div>

        {/* Custom Fields in Address */}
        {renderCategoryCustomFields('address', 'Alamat')}
      </section>

      {/* ========================================================================= */}
      {/* SECTION 3: KONTAK PRIBADI */}
      {/* ========================================================================= */}
      <section id="section-contact" className="bg-surface-elevated rounded-lg border border-border-default p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-border-default pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-accent-light text-brand-600 flex items-center justify-center">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-content-primary">Kontak Pribadi</h2>
              <p className="text-xs text-content-tertiary">Nomor kontak dan alamat email untuk komunikasi layanan.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => openAddFieldModal('contact')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-600 bg-accent-light hover:bg-accent-light/80 border border-brand-500/30 rounded-md transition-colors-fast cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            + Tambah Data Kontak
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label htmlFor="pf-no_telepon" className="block text-xs font-semibold text-content-secondary">Nomor Telepon / WhatsApp <span className="text-error">*</span></label>
            <input
              id="pf-no_telepon"
              type="tel"
              value={profile?.phone || ''}
              onChange={e => handleChange('phone', e.target.value)}
              placeholder="Contoh: 081234567890"
              className="w-full px-3 py-2 text-sm tabular-nums bg-surface-sunken/60 border border-border-default rounded-md text-content-primary placeholder:text-content-disabled focus:bg-surface-elevated focus:ring-2 focus:ring-border-focus focus:outline-none transition-colors-fast"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="pf-email" className="block text-xs font-semibold text-content-secondary">Alamat Email Aktif <span className="text-error">*</span></label>
            <input
              id="pf-email"
              type="email"
              value={profile?.email || ''}
              onChange={e => handleChange('email', e.target.value)}
              placeholder="Contoh: user@email.com"
              className="w-full px-3 py-2 text-sm bg-surface-sunken/60 border border-border-default rounded-md text-content-primary placeholder:text-content-disabled focus:bg-surface-elevated focus:ring-2 focus:ring-border-focus focus:outline-none transition-colors-fast"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="pf-website" className="block text-xs font-semibold text-content-secondary">Situs Web (Website / URL)</label>
            <input
              id="pf-website"
              type="url"
              value={profile?.website || getExtendedField('website')}
              onChange={e => handleExtendedChange('website', e.target.value, 'contact', 'Website')}
              placeholder="https://govconnect.id"
              className="w-full px-3 py-2 text-sm bg-surface-sunken/60 border border-border-default rounded-md text-content-primary placeholder:text-content-disabled focus:bg-surface-elevated focus:ring-2 focus:ring-border-focus focus:outline-none transition-colors-fast"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="pf-home_phone" className="block text-xs font-semibold text-content-secondary">Telepon Rumah (Home Phone)</label>
            <input
              id="pf-home_phone"
              type="tel"
              value={getExtendedField('home_phone')}
              onChange={e => handleExtendedChange('home_phone', e.target.value, 'contact', 'Telepon Rumah')}
              placeholder="Contoh: 021-5551234"
              className="w-full px-3 py-2 text-sm tabular-nums bg-surface-sunken/60 border border-border-default rounded-md text-content-primary placeholder:text-content-disabled focus:bg-surface-elevated focus:ring-2 focus:ring-border-focus focus:outline-none transition-colors-fast"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="pf-work_phone" className="block text-xs font-semibold text-content-secondary">Telepon Kantor (Work Phone)</label>
            <input
              id="pf-work_phone"
              type="tel"
              value={getExtendedField('work_telephone')}
              onChange={e => handleExtendedChange('work_telephone', e.target.value, 'contact', 'Telepon Kantor')}
              placeholder="Contoh: 021-5559876"
              className="w-full px-3 py-2 text-sm tabular-nums bg-surface-sunken/60 border border-border-default rounded-md text-content-primary placeholder:text-content-disabled focus:bg-surface-elevated focus:ring-2 focus:ring-border-focus focus:outline-none transition-colors-fast"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="pf-fax" className="block text-xs font-semibold text-content-secondary">Nomor Fax</label>
            <input
              id="pf-fax"
              type="tel"
              value={getExtendedField('fax')}
              onChange={e => handleExtendedChange('fax', e.target.value, 'contact', 'Nomor Fax')}
              placeholder="Contoh: 021-5559877"
              className="w-full px-3 py-2 text-sm tabular-nums bg-surface-sunken/60 border border-border-default rounded-md text-content-primary placeholder:text-content-disabled focus:bg-surface-elevated focus:ring-2 focus:ring-border-focus focus:outline-none transition-colors-fast"
            />
          </div>
        </div>

        {/* Custom Fields in Contact */}
        {renderCategoryCustomFields('contact', 'Kontak')}
      </section>

      {/* ========================================================================= */}
      {/* SECTION 4: PENDIDIKAN & AKADEMIK */}
      {/* ========================================================================= */}
      <section id="section-education" className="bg-surface-elevated rounded-lg border border-border-default p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-border-default pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-accent-light text-brand-600 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-content-primary">Pendidikan & Akademik</h2>
              <p className="text-xs text-content-tertiary">Informasi riwayat akademik untuk formulir beasiswa atau pendaftaran universitas.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => openAddFieldModal('education')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-600 bg-accent-light hover:bg-accent-light/80 border border-brand-500/30 rounded-md transition-colors-fast cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            + Tambah Data Pendidikan
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label htmlFor="pf-pendidikan" className="block text-xs font-semibold text-content-secondary">Jenjang Pendidikan</label>
            <select
              id="pf-pendidikan"
              value={profile?.education_level || ''}
              onChange={e => handleChange('education_level', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-surface-sunken/60 border border-border-default rounded-md text-content-primary focus:bg-surface-elevated focus:ring-2 focus:ring-border-focus focus:outline-none transition-colors-fast"
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

          <div className="space-y-1 lg:col-span-3">
            <label htmlFor="pf-sekolah" className="block text-xs font-semibold text-content-secondary">Nama Sekolah / Universitas</label>
            <input
              id="pf-sekolah"
              type="text"
              value={profile?.institution || ''}
              onChange={e => handleChange('institution', e.target.value)}
              placeholder="Contoh: Universitas Gadjah Mada"
              className="w-full px-3 py-2 text-sm bg-surface-sunken/60 border border-border-default rounded-md text-content-primary placeholder:text-content-disabled focus:bg-surface-elevated focus:ring-2 focus:ring-border-focus focus:outline-none transition-colors-fast"
            />
          </div>

          <div className="space-y-1 lg:col-span-2">
            <label htmlFor="pf-nim" className="block text-xs font-semibold text-content-secondary">Nomor Induk Mahasiswa (NIM)</label>
            <input
              id="pf-nim"
              type="text"
              value={profile?.student_id || ''}
              onChange={e => handleChange('student_id', e.target.value)}
              placeholder="Contoh: 21/478921/TK/52910"
              className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-surface-sunken/60 border border-border-default rounded-md text-content-primary placeholder:text-content-disabled focus:bg-surface-elevated focus:ring-2 focus:ring-border-focus focus:outline-none transition-colors-fast"
            />
          </div>

          <div className="space-y-1 lg:col-span-2">
            <label htmlFor="pf-nisn" className="block text-xs font-semibold text-content-secondary">NISN (Nomor Induk Siswa Nasional)</label>
            <input
              id="pf-nisn"
              type="text"
              value={profile?.nisn || ''}
              onChange={e => handleChange('nisn', e.target.value)}
              placeholder="Contoh: 0041234567"
              className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-surface-sunken/60 border border-border-default rounded-md text-content-primary placeholder:text-content-disabled focus:bg-surface-elevated focus:ring-2 focus:ring-border-focus focus:outline-none transition-colors-fast"
            />
          </div>
        </div>

        {/* Custom Fields in Education */}
        {renderCategoryCustomFields('education', 'Pendidikan')}
      </section>

      {/* ========================================================================= */}
      {/* SECTION 5: PEKERJAAN & KARIR */}
      {/* ========================================================================= */}
      <section id="section-career" className="bg-surface-elevated rounded-lg border border-border-default p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-border-default pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-accent-light text-brand-600 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-content-primary">Pekerjaan & Karir</h2>
              <p className="text-xs text-content-tertiary">Informasi profesi dan tempat bekerja saat ini.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => openAddFieldModal('career')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-600 bg-accent-light hover:bg-accent-light/80 border border-brand-500/30 rounded-md transition-colors-fast cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            + Tambah Data Pekerjaan
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label htmlFor="pf-pekerjaan" className="block text-xs font-semibold text-content-secondary">Pekerjaan / Profesi</label>
            <input
              id="pf-pekerjaan"
              type="text"
              value={profile?.occupation || ''}
              onChange={e => handleChange('occupation', e.target.value)}
              placeholder="Contoh: Software Engineer / ASN"
              className="w-full px-3 py-2 text-sm bg-surface-sunken/60 border border-border-default rounded-md text-content-primary placeholder:text-content-disabled focus:bg-surface-elevated focus:ring-2 focus:ring-border-focus focus:outline-none transition-colors-fast"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="pf-instansi" className="block text-xs font-semibold text-content-secondary">Nama Instansi / Perusahaan</label>
            <input
              id="pf-instansi"
              type="text"
              value={profile?.organization || ''}
              onChange={e => handleChange('organization', e.target.value)}
              placeholder="Contoh: PT Teknologi Indonesia"
              className="w-full px-3 py-2 text-sm bg-surface-sunken/60 border border-border-default rounded-md text-content-primary placeholder:text-content-disabled focus:bg-surface-elevated focus:ring-2 focus:ring-border-focus focus:outline-none transition-colors-fast"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="pf-alamat_kantor" className="block text-xs font-semibold text-content-secondary">Alamat Kantor / Tempat Kerja</label>
            <input
              id="pf-alamat_kantor"
              type="text"
              value={profile?.work_address || ''}
              onChange={e => handleChange('work_address', e.target.value)}
              placeholder="Contoh: Jl. Sudirman Kav. 21, Jakarta"
              className="w-full px-3 py-2 text-sm bg-surface-sunken/60 border border-border-default rounded-md text-content-primary placeholder:text-content-disabled focus:bg-surface-elevated focus:ring-2 focus:ring-border-focus focus:outline-none transition-colors-fast"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="pf-penghasilan" className="block text-xs font-semibold text-content-secondary">Penghasilan / Gaji per Bulan (Income)</label>
            <input
              id="pf-penghasilan"
              type="text"
              value={profile?.income || getExtendedField('income')}
              onChange={e => handleExtendedChange('income', e.target.value, 'career', 'Penghasilan')}
              placeholder="Contoh: 15000000"
              className="w-full px-3 py-2 text-sm tabular-nums bg-surface-sunken/60 border border-border-default rounded-md text-content-primary placeholder:text-content-disabled focus:bg-surface-elevated focus:ring-2 focus:ring-border-focus focus:outline-none transition-colors-fast"
            />
          </div>
        </div>

        {/* Custom Fields in Career */}
        {renderCategoryCustomFields('career', 'Pekerjaan')}
      </section>

      {/* ========================================================================= */}
      {/* SECTION 6: KELUARGA & KONTAK DARURAT */}
      {/* ========================================================================= */}
      <section id="section-family" className="bg-surface-elevated rounded-lg border border-border-default p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-border-default pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-accent-light text-brand-600 flex items-center justify-center">
              <HeartHandshake className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-content-primary">Data Keluarga & Kontak Darurat</h2>
              <p className="text-xs text-content-tertiary">Data orang tua dan kontak darurat untuk kebutuhan verifikasi resmi.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => openAddFieldModal('family')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-600 bg-accent-light hover:bg-accent-light/80 border border-brand-500/30 rounded-md transition-colors-fast cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            + Tambah Data Keluarga
          </button>
        </div>

        <div className="bg-accent-light/70 border border-brand-500/30 rounded-md p-3.5 flex items-start gap-2.5 text-xs text-content-secondary">
          <Info className="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5" />
          <span>
            <b>Penting:</b> Nama ibu kandung sangat sering dibutuhkan sebagai verifikasi keamanan standar pada perbankan, beasiswa, dan instansi kependudukan.
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="pf-nama_ibu_kandung" className="block text-xs font-semibold text-content-secondary">Nama Lengkap Ibu Kandung</label>
            <input
              id="pf-nama_ibu_kandung"
              type="text"
              value={profile?.mother_name || ''}
              onChange={e => handleChange('mother_name', e.target.value)}
              placeholder="Contoh: Siti Aminah"
              className="w-full px-3 py-2 text-sm bg-surface-sunken/60 border border-border-default rounded-md text-content-primary placeholder:text-content-disabled focus:bg-surface-elevated focus:ring-2 focus:ring-border-focus focus:outline-none transition-colors-fast"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="pf-nama_ayah" className="block text-xs font-semibold text-content-secondary">Nama Lengkap Ayah</label>
            <input
              id="pf-nama_ayah"
              type="text"
              value={profile?.father_name || ''}
              onChange={e => handleChange('father_name', e.target.value)}
              placeholder="Contoh: Bambang Supriyanto"
              className="w-full px-3 py-2 text-sm bg-surface-sunken/60 border border-border-default rounded-md text-content-primary placeholder:text-content-disabled focus:bg-surface-elevated focus:ring-2 focus:ring-border-focus focus:outline-none transition-colors-fast"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="pf-kontak_darurat_nama" className="block text-xs font-semibold text-content-secondary">Nama Kontak Darurat</label>
            <input
              id="pf-kontak_darurat_nama"
              type="text"
              value={profile?.emergency_contact_name || ''}
              onChange={e => handleChange('emergency_contact_name', e.target.value)}
              placeholder="Contoh: Rina (Saudara Kandung)"
              className="w-full px-3 py-2 text-sm bg-surface-sunken/60 border border-border-default rounded-md text-content-primary placeholder:text-content-disabled focus:bg-surface-elevated focus:ring-2 focus:ring-border-focus focus:outline-none transition-colors-fast"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="pf-kontak_darurat_telp" className="block text-xs font-semibold text-content-secondary">Nomor Telepon Kontak Darurat</label>
            <input
              id="pf-kontak_darurat_telp"
              type="tel"
              value={profile?.emergency_contact_phone || ''}
              onChange={e => handleChange('emergency_contact_phone', e.target.value)}
              placeholder="Contoh: 081987654321"
              className="w-full px-3 py-2 text-sm tabular-nums bg-surface-sunken/60 border border-border-default rounded-md text-content-primary placeholder:text-content-disabled focus:bg-surface-elevated focus:ring-2 focus:ring-border-focus focus:outline-none transition-colors-fast"
            />
          </div>
        </div>

        {/* Custom Fields in Family */}
        {renderCategoryCustomFields('family', 'Keluarga')}
      </section>

      {/* ========================================================================= */}
      {/* SECTION 7: DOKUMEN RESMI & BERKAS FOTO DOKUMEN */}
      {/* ========================================================================= */}
      <section id="section-documents" className="bg-surface-elevated rounded-lg border border-border-default p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-border-default pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-accent-light text-brand-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-content-primary">Dokumen & Foto Berkas</h2>
              <p className="text-xs text-content-tertiary">Foto KTP, KK, dan berkas asli untuk autofill berkas instan.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => openAddFieldModal('documents')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-600 bg-accent-light hover:bg-accent-light/80 border border-brand-500/30 rounded-md transition-colors-fast cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            + Tambah Data Dokumen
          </button>
        </div>

        {/* Text Numbers: NPWP, BPJS, Driver License */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label htmlFor="pf-npwp" className="block text-xs font-semibold text-content-secondary">NPWP (Nomor Pokok Wajib Pajak)</label>
            <input
              id="pf-npwp"
              type="text"
              value={profile?.npwp || ''}
              onChange={e => handleChange('npwp', e.target.value)}
              placeholder="Contoh: 12.345.678.9-012.000 atau 16 digit NIK"
              className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-surface-sunken/60 border border-border-default rounded-md text-content-primary placeholder:text-content-disabled focus:bg-surface-elevated focus:ring-2 focus:ring-border-focus focus:outline-none transition-colors-fast"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="pf-bpjs" className="block text-xs font-semibold text-content-secondary">Nomor Kartu BPJS (Kesehatan / Ketenagakerjaan)</label>
            <input
              id="pf-bpjs"
              type="text"
              value={profile?.bpjs_number || ''}
              onChange={e => handleChange('bpjs_number', e.target.value)}
              placeholder="Contoh: 0001234567890"
              className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-surface-sunken/60 border border-border-default rounded-md text-content-primary placeholder:text-content-disabled focus:bg-surface-elevated focus:ring-2 focus:ring-border-focus focus:outline-none transition-colors-fast"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="pf-sim" className="block text-xs font-semibold text-content-secondary">Nomor SIM / Driver License (RoboForm)</label>
            <input
              id="pf-sim"
              type="text"
              value={profile?.driver_license || getExtendedField('driver_license')}
              onChange={e => handleExtendedChange('driver_license', e.target.value, 'documents', 'Nomor SIM')}
              placeholder="Contoh: 1234-5678-9012"
              className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-surface-sunken/60 border border-border-default rounded-md text-content-primary placeholder:text-content-disabled focus:bg-surface-elevated focus:ring-2 focus:ring-border-focus focus:outline-none transition-colors-fast"
            />
          </div>
        </div>

        {/* Berkas & Foto Dokumen Asli */}
        <div className="space-y-3 pt-2">
          <div>
            <h3 className="text-xs font-bold text-content-primary uppercase tracking-wider flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-brand-600" />
              Unggah Berkas & Foto Dokumen (Autofill Berkas)
            </h3>
            <p className="text-xs text-content-tertiary mt-0.5">
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
                  className={`rounded-lg border transition-colors-fast p-4 flex flex-col justify-between ${
                    hasPhoto
                      ? 'bg-surface-elevated border-border-default hover:border-border-strong shadow-xs'
                      : 'bg-surface-sunken/60 border-dashed border-border-default hover:border-border-focus hover:bg-accent-light/10'
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
                        <div className={`w-8 h-8 rounded-md flex items-center justify-center ${hasPhoto ? 'bg-brand-600 text-white' : 'bg-surface-sunken text-content-secondary'}`}>
                          <slot.icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-content-primary leading-tight">{slot.title}</div>
                          <span className="text-[10px] text-brand-600 bg-accent-light px-1.5 py-0.5 rounded font-medium border border-brand-500/20">
                            {slot.badge}
                          </span>
                        </div>
                      </div>
                    </div>

                    {hasPhoto ? (
                      <div className="relative group rounded-md overflow-hidden border border-border-default bg-surface-elevated aspect-[16/10] mb-3 flex items-center justify-center">
                        <img src={photo.data} alt={slot.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-content-primary/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => setPreviewPhoto({ title: slot.title, data: photo.data, name: photo.name })}
                            className="p-2 bg-surface-elevated text-content-primary rounded-md hover:bg-surface-sunken shadow-xs cursor-pointer"
                            title="Lihat ukuran penuh"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => fileInputRefs.current[slot.id]?.click()}
                            className="p-2 bg-surface-elevated text-brand-600 rounded-md hover:bg-surface-sunken shadow-xs cursor-pointer"
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
                        className="w-full aspect-[16/10] mb-3 rounded-md border-2 border-dashed border-border-default hover:border-border-focus bg-surface-elevated flex flex-col items-center justify-center gap-1.5 text-content-tertiary hover:text-brand-600 transition-colors-fast p-3 cursor-pointer"
                      >
                        <Camera className="w-5 h-5 text-content-disabled" />
                        <span className="text-xs font-medium text-content-secondary">Pilih / Unggah Berkas</span>
                        <span className="text-[10px] text-content-tertiary">JPG, PNG, WebP</span>
                      </button>
                    )}

                    <p className="text-[11px] text-content-secondary leading-relaxed mb-3">{slot.desc}</p>
                  </div>

                  <div className="pt-2 border-t border-border-default flex items-center justify-between text-xs">
                    {hasPhoto ? (
                      <>
                        <span className="text-[10px] text-success font-semibold flex items-center gap-1 tabular-nums">
                          <Check className="w-3 h-3 text-success" />
                          {Math.round(photo.size / 1024)} KB · Siap
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => fileInputRefs.current[slot.id]?.click()}
                            className="text-[11px] text-brand-600 hover:text-brand-700 font-medium px-2 py-1 rounded hover:bg-accent-light transition-colors-fast cursor-pointer"
                          >
                            Ganti
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveStandardPhoto(slot.id)}
                            className="text-[11px] text-error hover:text-error-dark font-medium px-2 py-1 rounded hover:bg-error-light transition-colors-fast cursor-pointer"
                          >
                            Hapus
                          </button>
                        </div>
                      </>
                    ) : (
                      <span className="text-[10px] text-content-disabled">Belum ada foto</span>
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
            className="bg-surface-elevated rounded-lg border border-border-default p-6 lg:p-8 space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-default pb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-accent-light text-brand-600 flex items-center justify-center">
                  <FolderPlus className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-content-primary">{cat.title}</h2>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-accent-light text-brand-600 border border-brand-500/30">
                      Kategori Kustom
                    </span>
                  </div>
                  <p className="text-xs text-content-tertiary">{cat.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openAddFieldModal(cat.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-md shadow-sm transition-colors duration-fast active:scale-[0.98]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  + Tambah Data di Kategori Ini
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteCategory(cat.id)}
                  className="p-1.5 text-content-tertiary hover:text-error hover:bg-error-light/50 rounded-md transition-colors duration-fast"
                  title="Hapus kategori ini"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {fieldsInCat.length === 0 ? (
              <div className="p-8 text-center bg-surface-sunken/60 rounded-md border border-dashed border-border-default space-y-2">
                <p className="text-sm font-medium text-content-secondary">Kategori ini belum memiliki kolom data</p>
                <button
                  type="button"
                  onClick={() => openAddFieldModal(cat.id)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-brand-600 bg-surface-elevated border border-brand-500/30 rounded-md hover:bg-accent-light transition-colors duration-fast"
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
                        className="p-3.5 bg-surface-sunken/40 hover:bg-surface-sunken/70 rounded-md border border-border-default flex items-center justify-between gap-3 transition-colors duration-fast"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {field.photoData ? (
                            <div
                              onClick={() => setPreviewPhoto({ title: field.label, data: field.photoData!, name: field.photoName || field.value })}
                              className="w-12 h-12 rounded-md bg-surface-sunken border border-border-default overflow-hidden cursor-pointer flex-shrink-0 relative group"
                            >
                              <img src={field.photoData} alt={field.label} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                                <Eye className="w-3.5 h-3.5" />
                              </div>
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-md bg-accent-light text-brand-600 flex items-center justify-center flex-shrink-0">
                              <Camera className="w-5 h-5" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-content-primary truncate">{field.label}</span>
                              <span className="text-[10px] font-mono text-content-tertiary bg-surface-sunken px-1.5 py-0.5 rounded border border-border-default">
                                {field.key}
                              </span>
                            </div>
                            <div className="text-[11px] text-success font-medium flex items-center gap-1">
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
                              className="p-1.5 text-content-tertiary hover:text-content-secondary hover:bg-surface-sunken rounded-md transition-colors duration-fast"
                              title="Lihat foto"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteField(field.id, field.key)}
                            className="p-1.5 text-content-tertiary hover:text-error hover:bg-error-light/50 rounded-md transition-colors duration-fast"
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
                      <div key={field.id} className="p-3.5 bg-surface-sunken/50 rounded-md border border-brand-500/30 space-y-2.5">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-semibold text-content-secondary">Label</label>
                            <input
                              type="text"
                              value={editLabel}
                              onChange={e => setEditLabel(e.target.value)}
                              className="w-full px-2.5 py-1 text-xs bg-surface-elevated border border-border-default rounded-md text-content-primary focus:ring-2 focus:ring-border-focus focus:outline-none transition-colors-fast"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold text-content-secondary">Kunci</label>
                            <input
                              type="text"
                              value={editKey}
                              onChange={e => setEditKey(slugify(e.target.value))}
                              className="w-full px-2.5 py-1 text-xs font-mono bg-surface-elevated border border-border-default rounded-md text-content-primary focus:ring-2 focus:ring-border-focus focus:outline-none transition-colors-fast"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-content-secondary">Nilai</label>
                          <input
                            type="text"
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            className="w-full px-2.5 py-1 text-xs bg-surface-elevated border border-border-default rounded-md text-content-primary focus:ring-2 focus:ring-border-focus focus:outline-none transition-colors-fast"
                          />
                        </div>
                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setEditingFieldId(null)}
                            className="px-2.5 py-1 text-xs text-content-secondary hover:bg-surface-sunken rounded-md transition-colors-fast"
                          >
                            Batal
                          </button>
                          <button
                            type="button"
                            onClick={() => saveEditField(field.id)}
                            className="px-3 py-1 text-xs font-semibold bg-brand-600 text-white rounded-md hover:bg-brand-700 transition-colors-fast active:scale-[0.98]"
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
                      className="p-3.5 bg-surface-elevated rounded-md border border-border-default hover:border-border-strong flex items-center justify-between gap-3 transition-colors duration-fast"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-content-primary truncate">{field.label}</span>
                          <span className="text-[10px] font-mono text-brand-600 bg-accent-light px-1.5 py-0.5 rounded border border-brand-500/30">
                            {field.key}
                          </span>
                        </div>
                        <div className="text-sm font-medium text-content-secondary truncate">{field.value}</div>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCopy(field.value, field.id)}
                          className="p-1.5 text-content-tertiary hover:text-content-secondary hover:bg-surface-sunken rounded-md transition-colors duration-fast"
                          title="Salin nilai"
                        >
                          {copiedKey === field.id ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => startEditField(field)}
                          className="p-1.5 text-content-tertiary hover:text-brand-600 hover:bg-accent-light rounded-md transition-colors duration-fast"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteField(field.id)}
                          className="p-1.5 text-content-tertiary hover:text-error hover:bg-error-light/50 rounded-md transition-colors duration-fast"
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

      {/* Floating Save Button */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
        {hasUnsavedChanges && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-warning-light border border-warning/30 rounded-md text-xs font-medium text-warning-dark shadow-md animate-in fade-in slide-in-from-bottom-2">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Perubahan belum disimpan</span>
          </div>
        )}
        <button
          onClick={handleSave}
          disabled={saving || !hasUnsavedChanges}
          className="flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 active:scale-[0.98] disabled:bg-content-disabled text-white font-semibold rounded-lg shadow-lg transition-all duration-fast disabled:cursor-not-allowed cursor-pointer"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Menyimpan...</span>
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              <span>Simpan (Ctrl+S)</span>
            </>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: TAMBAH DATA KUSTOM KE DALAM KATEGORI */}
      {/* Dilengkapi Banyak Opsi (Kolom / Gambar / Tanggal / Catatan) */}
      {/* Serta Tombol Buat Kategori Baru Langsung di Dalam Form Ini */}
      {/* ========================================================================= */}
      {showAddFieldModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface-elevated rounded-lg border border-border-default shadow-2xl max-w-xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200 my-8">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-border-default pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-md bg-accent-light text-brand-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-content-primary">Tambah Data Kustom</h3>
                  <p className="text-xs text-content-secondary">Pilih opsi format isian: teks, gambar/foto dokumen, tanggal, atau catatan.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddFieldModal(false)}
                className="p-1.5 rounded-md text-content-disabled hover:text-content-secondary hover:bg-surface-sunken"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* SELEKTOR KATEGORI + TOMBOL BUAT KATEGORI BARU LANGSUNG DI FORM INI */}
            <div className="space-y-2 bg-surface-sunken/80 p-3.5 rounded-lg border border-border-default">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-content-secondary">Kategori Penempatan Data</label>
                <button
                  type="button"
                  onClick={() => setShowInlineCategoryCreator(!showInlineCategoryCreator)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 bg-surface-elevated hover:bg-accent-light px-2.5 py-1 rounded-md border border-brand-500/30 transition-colors-fast cursor-pointer"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  {showInlineCategoryCreator ? 'Tutup Kategori Baru' : '+ Buat Kategori Baru'}
                </button>
              </div>

              {/* Inline Form Pembuatan Kategori Baru */}
              {showInlineCategoryCreator ? (
                <div className="p-3 bg-surface-elevated rounded-md border border-brand-500/30 shadow-sm space-y-2.5 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-content-primary flex items-center gap-1">
                      <FolderPlus className="w-3.5 h-3.5 text-brand-600" />
                      Nama Kategori Baru Anda:
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowInlineCategoryCreator(false)}
                      className="text-[11px] text-content-tertiary hover:text-content-secondary"
                    >
                      Batal
                    </button>
                  </div>
                  <input
                    type="text"
                    value={inlineCategoryTitle}
                    onChange={e => setInlineCategoryTitle(e.target.value)}
                    placeholder="Misal: Kendaraan Pribadi / Finansial / Asuransi"
                    className="w-full px-3 py-1.5 text-xs bg-surface-sunken/60 border border-border-default rounded-md text-content-primary placeholder:text-content-disabled focus:bg-surface-elevated focus:outline-none focus:ring-2 focus:ring-border-focus transition-colors-fast"
                  />
                  <input
                    type="text"
                    value={inlineCategoryDesc}
                    onChange={e => setInlineCategoryDesc(e.target.value)}
                    placeholder="Keterangan singkat kategori (opsional)"
                    className="w-full px-3 py-1.5 text-xs bg-surface-sunken/60 border border-border-default rounded-md text-content-primary placeholder:text-content-disabled focus:bg-surface-elevated focus:outline-none focus:ring-2 focus:ring-border-focus transition-colors-fast"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleCreateCategoryInline}
                      disabled={!inlineCategoryTitle.trim()}
                      className="px-3.5 py-1.5 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-md disabled:opacity-50 shadow-sm transition-colors-fast active:scale-[0.98]"
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
                    className="w-full px-3 py-2 text-xs font-medium bg-surface-elevated border border-border-default rounded-md text-content-primary focus:outline-none focus:ring-2 focus:ring-border-focus appearance-none pr-8 cursor-pointer transition-colors-fast"
                  >
                    {allCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.isCustom ? `[Kategori Kustom] ${cat.title}` : cat.title}
                      </option>
                    ))}
                    <option value="__create_new__">+ Buat Kategori Baru Sendiri...</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-content-tertiary absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              )}
            </div>

            {/* OPSI TIPE DATA */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-content-secondary">Pilih Tipe / Format Isian Data:</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setNewFieldType('text')}
                  className={`p-2.5 rounded-md border text-left transition-colors-fast flex flex-col items-center sm:items-start gap-1.5 cursor-pointer ${
                    newFieldType === 'text'
                      ? 'bg-accent-light/60 border-brand-600 text-brand-600 ring-1 ring-brand-500/30'
                      : 'bg-surface-elevated border-border-default text-content-secondary hover:border-border-strong hover:bg-surface-sunken/40'
                  }`}
                >
                  <span className="p-1 rounded-md bg-accent-light text-brand-600"><FileText className="w-4 h-4" /></span>
                  <span className="text-xs font-bold">Kolom Teks</span>
                  <span className="text-[10px] text-content-tertiary hidden sm:inline">Angka / huruf biasa</span>
                </button>

                <button
                  type="button"
                  onClick={() => setNewFieldType('image')}
                  className={`p-2.5 rounded-md border text-left transition-colors-fast flex flex-col items-center sm:items-start gap-1.5 cursor-pointer ${
                    newFieldType === 'image'
                      ? 'bg-accent-light/60 border-brand-600 text-brand-600 ring-1 ring-brand-500/30'
                      : 'bg-surface-elevated border-border-default text-content-secondary hover:border-border-strong hover:bg-surface-sunken/40'
                  }`}
                >
                  <span className="p-1 rounded-md bg-accent-light text-brand-600"><Camera className="w-4 h-4" /></span>
                  <span className="text-xs font-bold">Berkas / Foto</span>
                  <span className="text-[10px] text-content-tertiary hidden sm:inline">Autofill unggah file</span>
                </button>

                <button
                  type="button"
                  onClick={() => setNewFieldType('date')}
                  className={`p-2.5 rounded-md border text-left transition-colors-fast flex flex-col items-center sm:items-start gap-1.5 cursor-pointer ${
                    newFieldType === 'date'
                      ? 'bg-accent-light/60 border-brand-600 text-brand-600 ring-1 ring-brand-500/30'
                      : 'bg-surface-elevated border-border-default text-content-secondary hover:border-border-strong hover:bg-surface-sunken/40'
                  }`}
                >
                  <span className="p-1 rounded-md bg-accent-light text-brand-600"><Calendar className="w-4 h-4" /></span>
                  <span className="text-xs font-bold">Tanggal</span>
                  <span className="text-[10px] text-content-tertiary hidden sm:inline">Masa berlaku / tgl</span>
                </button>

                <button
                  type="button"
                  onClick={() => setNewFieldType('textarea')}
                  className={`p-2.5 rounded-md border text-left transition-colors-fast flex flex-col items-center sm:items-start gap-1.5 cursor-pointer ${
                    newFieldType === 'textarea'
                      ? 'bg-accent-light/60 border-brand-600 text-brand-600 ring-1 ring-brand-500/30'
                      : 'bg-surface-elevated border-border-default text-content-secondary hover:border-border-strong hover:bg-surface-sunken/40'
                  }`}
                >
                  <span className="p-1 rounded-md bg-accent-light text-brand-600"><AlignLeft className="w-4 h-4" /></span>
                  <span className="text-xs font-bold">Teks Panjang</span>
                  <span className="text-[10px] text-content-tertiary hidden sm:inline">Catatan / alamat</span>
                </button>
              </div>
            </div>

            {/* PILIHAN SARAN CEPAT / PRESET SESUAI KATEGORI & TIPE */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-content-secondary block">Saran Rekomendasi Populer (Klik untuk mengisi):</span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                {(RICH_CATEGORY_PRESETS[targetCategory] || RICH_CATEGORY_PRESETS.other).map(preset => (
                  <button
                    key={preset.key}
                    type="button"
                    onClick={() => applyPresetToModal(preset)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md border border-border-default bg-surface-sunken text-content-secondary hover:bg-accent-light hover:text-brand-600 hover:border-brand-500/30 transition-colors-fast cursor-pointer"
                  >
                    <span aria-hidden="true">
                      {preset.type === 'image' ? <Image className="w-3.5 h-3.5 text-brand-600" /> : preset.type === 'date' ? <Calendar className="w-3.5 h-3.5 text-brand-600" /> : <AlignLeft className="w-3.5 h-3.5 text-brand-600" />}
                    </span>
                    <span>{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSaveNewField} className="space-y-4 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-content-secondary">Nama Data / Label</label>
                  <input
                    type="text"
                    value={newLabel}
                    onChange={e => handleLabelChange(e.target.value)}
                    placeholder={newFieldType === 'image' ? 'Contoh: Foto SIM C / STNK' : 'Contoh: Nomor Rekening BCA'}
                    className="w-full px-3 py-2 text-sm bg-surface-sunken/60 border border-border-default rounded-md text-content-primary placeholder:text-content-disabled focus:bg-surface-elevated focus:outline-none focus:ring-2 focus:ring-border-focus transition-colors-fast"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-content-secondary">Kunci Atribut</label>
                    <span className="text-[10px] text-content-tertiary font-mono">Untuk autofill</span>
                  </div>
                  <input
                    type="text"
                    value={newKey}
                    onChange={e => setNewKey(slugify(e.target.value))}
                    placeholder="nomor_rekening"
                    className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-surface-sunken/60 border border-border-default rounded-md text-content-primary placeholder:text-content-disabled focus:bg-surface-elevated focus:outline-none focus:ring-2 focus:ring-border-focus transition-colors-fast"
                  />
                </div>
              </div>

              {/* INPUT NILAI SESUAI TIPE DATA YANG DIPILIH */}
              {newFieldType === 'image' ? (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-content-secondary flex items-center justify-between">
                    <span>Pilih Berkas / Foto Gambar</span>
                    <span className="text-[10px] text-content-tertiary">JPG, PNG, WebP</span>
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
                    <div className="p-3 bg-accent-light/50 rounded-md border border-brand-500/30 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <img
                          src={newPhotoData.data}
                          alt="Preview"
                          className="w-14 h-14 object-cover rounded-md border border-border-default flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-content-primary truncate">{newPhotoData.name}</div>
                          <div className="text-[11px] text-success font-medium">
                            {Math.round(newPhotoData.size / 1024)} KB · Siap diisi ke form web
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => modalPhotoInputRef.current?.click()}
                        className="px-3 py-1.5 text-xs font-semibold bg-surface-elevated hover:bg-surface-sunken border border-border-default rounded-md text-content-secondary transition-colors-fast cursor-pointer"
                      >
                        Ganti Berkas
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => modalPhotoInputRef.current?.click()}
                      className="w-full py-6 rounded-md border-2 border-dashed border-border-default hover:border-border-focus bg-surface-sunken/40 hover:bg-accent-light/20 flex flex-col items-center justify-center gap-2 transition-colors-fast cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-md bg-accent-light text-brand-600 flex items-center justify-center">
                        <Upload className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-content-secondary">Pilih Berkas Foto dari Komputer</span>
                      <span className="text-[10px] text-content-tertiary">Foto akan otomatis dikompresi dan siap untuk autofill berkas</span>
                    </button>
                  )}
                </div>
              ) : newFieldType === 'date' ? (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-content-secondary">Pilih Tanggal</label>
                  <input
                    type="date"
                    value={newValue}
                    onChange={e => setNewValue(e.target.value)}
                    className="w-full px-3 py-2 text-sm tabular-nums bg-surface-sunken/60 border border-border-default rounded-md text-content-primary focus:bg-surface-elevated focus:outline-none focus:ring-2 focus:ring-border-focus transition-colors-fast"
                  />
                </div>
              ) : newFieldType === 'textarea' ? (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-content-secondary">Nilai Isian Teks Panjang</label>
                  <textarea
                    rows={3}
                    value={newValue}
                    onChange={e => setNewValue(e.target.value)}
                    placeholder="Masukkan rincian alamat, catatan, atau informasi panjang..."
                    className="w-full px-3 py-2 text-sm bg-surface-sunken/60 border border-border-default rounded-md text-content-primary placeholder:text-content-disabled focus:bg-surface-elevated focus:outline-none focus:ring-2 focus:ring-border-focus transition-colors-fast"
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-content-secondary">Nilai Isian Kolom</label>
                  <input
                    type="text"
                    value={newValue}
                    onChange={e => setNewValue(e.target.value)}
                    placeholder="Contoh: 123-456-7890 / B 1234 XYZ"
                    className="w-full px-3 py-2 text-sm bg-surface-sunken/60 border border-border-default rounded-md text-content-primary placeholder:text-content-disabled focus:bg-surface-elevated focus:outline-none focus:ring-2 focus:ring-border-focus transition-colors-fast"
                  />
                </div>
              )}

              {fieldError && (
                <div className="p-2.5 bg-error-light border border-error/30 text-error text-xs rounded-md flex items-center gap-1.5 font-medium">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {fieldError}
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-2 border-t border-border-default">
                <button
                  type="button"
                  onClick={() => setShowAddFieldModal(false)}
                  className="px-4 py-2 text-sm text-content-secondary hover:bg-surface-sunken rounded-md transition-colors-fast cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold bg-brand-600 hover:bg-brand-700 active:scale-[0.98] text-white rounded-md shadow-sm transition-all duration-fast cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-elevated rounded-lg border border-border-default shadow-2xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border-default pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md bg-accent-light text-brand-600 flex items-center justify-center">
                  <FolderPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-content-primary">Buat Kategori Baru</h3>
                  <p className="text-xs text-content-tertiary">Kelompokkan data khusus sesuai kebutuhan Anda</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCategoryModal(false)}
                className="p-1.5 rounded-md text-content-disabled hover:text-content-secondary hover:bg-surface-sunken transition-colors-fast cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCategoryStandalone} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-content-secondary">Nama Kategori</label>
                <input
                  type="text"
                  value={newCategoryTitle}
                  onChange={e => setNewCategoryTitle(e.target.value)}
                  placeholder="Contoh: Kendaraan Pribadi / Finansial / Asuransi"
                  className="w-full px-3 py-2 text-sm bg-surface-sunken/60 border border-border-default rounded-md text-content-primary placeholder:text-content-disabled focus:bg-surface-elevated focus:outline-none focus:ring-2 focus:ring-border-focus transition-colors-fast"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-content-secondary">Keterangan Singkat (Opsional)</label>
                <input
                  type="text"
                  value={newCategoryDesc}
                  onChange={e => setNewCategoryDesc(e.target.value)}
                  placeholder="Contoh: Data plat nomor, nomor mesin, dan STNK"
                  className="w-full px-3 py-2 text-sm bg-surface-sunken/60 border border-border-default rounded-md text-content-primary placeholder:text-content-disabled focus:bg-surface-elevated focus:outline-none focus:ring-2 focus:ring-border-focus transition-colors-fast"
                />
              </div>

              {categoryError && (
                <div className="p-2.5 bg-error-light border border-error/30 text-error text-xs rounded-md flex items-center gap-1.5 font-medium">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {categoryError}
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-2 border-t border-border-default">
                <button
                  type="button"
                  onClick={() => setShowAddCategoryModal(false)}
                  className="px-4 py-2 text-sm text-content-secondary hover:bg-surface-sunken rounded-md transition-colors-fast cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold bg-brand-600 hover:bg-brand-700 active:scale-[0.98] text-white rounded-md shadow-sm transition-all duration-fast cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-elevated rounded-lg border border-border-default max-w-2xl w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border-default pb-2.5">
              <div>
                <h4 className="text-sm font-bold text-content-primary">{previewPhoto.title}</h4>
                <p className="text-xs text-content-tertiary">{previewPhoto.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="p-1.5 rounded-md text-content-disabled hover:text-content-secondary hover:bg-surface-sunken transition-colors-fast cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="rounded-md overflow-hidden bg-surface-sunken flex items-center justify-center max-h-[70vh] border border-border-default">
              <img
                src={previewPhoto.data}
                alt={previewPhoto.title}
                className="max-h-[70vh] w-auto object-contain rounded-md"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}