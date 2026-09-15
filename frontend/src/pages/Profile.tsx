import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { profileApi, Profile } from '../services/api';
import { Loader2, Save, AlertCircle, CheckCircle } from 'lucide-react';

const fieldGroups = [
  {
    title: 'Identity',
    fields: [
      { key: 'full_name', label: 'Nama Lengkap', type: 'text', required: true },
      { key: 'nik', label: 'NIK', type: 'text', required: true, maxLength: 16 },
      { key: 'birth_place', label: 'Tempat Lahir', type: 'text', required: false },
      { key: 'birth_date', label: 'Tanggal Lahir', type: 'date', required: true },
      { key: 'gender', label: 'Jenis Kelamin', type: 'select', required: true, options: ['Laki-laki', 'Perempuan'] },
    ],
  },
  {
    title: 'Address',
    fields: [
      { key: 'address', label: 'Alamat Lengkap', type: 'textarea', required: true },
      { key: 'province', label: 'Provinsi', type: 'text', required: true },
      { key: 'city', label: 'Kabupaten/Kota', type: 'text', required: true },
      { key: 'district', label: 'Kecamatan', type: 'text', required: true },
      { key: 'village', label: 'Kelurahan/Desa', type: 'text', required: true },
      { key: 'postal_code', label: 'Kode Pos', type: 'text', required: false, maxLength: 5 },
    ],
  },
  {
    title: 'Contact, Education & Additional',
    fields: [
      { key: 'phone', label: 'Nomor Telepon (Optional)', type: 'text', required: false },
      { key: 'email', label: 'Email (Optional)', type: 'email', required: false },
      { key: 'nisn', label: 'NISN (Optional)', type: 'text', required: false },
      { key: 'institution', label: 'Nama Institusi (Optional)', type: 'text', required: false },
      { key: 'education_level', label: 'Jenjang Pendidikan (Optional)', type: 'text', required: false },
      { key: 'student_id', label: 'Nomor Induk Mahasiswa (Optional)', type: 'text', required: false },
      { key: 'occupation', label: 'Pekerjaan (Optional)', type: 'text', required: false },
      { key: 'organization', label: 'Nama Instansi (Optional)', type: 'text', required: false },
    ],
  },
];

export function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    profileApi.get()
      .then(res => setProfile(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (key: string, value: string) => {
    setProfile(prev => prev ? { ...prev, [key]: value } : null);
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    setMessage(null);
    try {
      await profileApi.update(profile);
      setMessage({ type: 'success', text: 'Profil berhasil disimpan' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Gagal menyimpan profil' });
    } finally {
      setSaving(false);
    }
  };

  const currentGroup = fieldGroups[step];
  const isFirstStep = step === 0;
  const isLastStep = step === fieldGroups.length - 1;

  const requiredFields = currentGroup.fields.filter(f => f.required).map(f => f.key);
  const canProceed = requiredFields.every(key => profile?.[key]?.trim());

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
        <p className="text-slate-500 mt-1">Kelola data profil yang digunakan untuk autofill</p>
      </div>

      {/* Progress Steps */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between">
          {fieldGroups.map((group, i) => (
            <div key={i} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  i < step
                    ? 'bg-green-500 text-white'
                    : i === step
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {i < step ? <CheckCircle className="w-5 h-5" /> : i + 1}
              </div>
              {i < fieldGroups.length - 1 && (
                <div
                  className={`w-16 h-0.5 mx-2 ${i < step ? 'bg-green-500' : 'bg-slate-200'}`}
                />
              )}
              {!isFirstStep && i === step && (
                <span className="text-xs text-slate-500 ml-1">{group.title}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        {message && (
          <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
            message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {message.text}
          </div>
        )}

        <form onSubmit={e => { e.preventDefault(); handleSave(); }} className="space-y-5">
          {currentGroup.fields.map(field => (
            <div key={field.key} className="space-y-1">
              <label
                htmlFor={field.key}
                className="block text-sm font-medium text-slate-700"
              >
                {field.label}
              </label>
              {field.type === 'select' ? (
                <select
                  id={field.key}
                  value={profile?.[field.key] || ''}
                  onChange={e => handleChange(field.key, e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required={field.required}
                >
                  <option value="">Pilih {field.label}</option>
                  {field.options?.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : field.type === 'textarea' ? (
                <textarea
                  id={field.key}
                  value={profile?.[field.key] || ''}
                  onChange={e => handleChange(field.key, e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  required={field.required}
                  maxLength={field.maxLength}
                />
              ) : (
                <input
                  id={field.key}
                  type={field.type}
                  value={profile?.[field.key] || ''}
                  onChange={e => handleChange(field.key, e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required={field.required}
                  maxLength={field.maxLength}
                />
              )}
            </div>
          ))}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4 border-t border-slate-200">
            {!isFirstStep && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-4 py-2.5 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 font-medium"
              >
                Back
              </button>
            )}
            <div className="flex gap-3 ml-auto">
              {!isLastStep ? (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  disabled={!canProceed}
                  className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Profile'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}