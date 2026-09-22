import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { activityApi, profileApi, type ActivityAnalytics, type Profile } from '../services/api';
import {
  LayoutDashboard,
  CheckCircle,
  Clock,
  UserCheck,
  AlertTriangle,
  BarChart2,
  Globe,
  History,
  RotateCw,
  ExternalLink,
  Sparkles,
  Inbox,
  Bot,
  Save,
  CheckCircle2,
  User,
  MapPin,
  Phone,
  Briefcase,
  Check,
  ArrowRight,
  Loader2
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';

export function Dashboard() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<ActivityAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Profile & RoboForm Suite State
  const [profile, setProfile] = useState<Profile | null>(null);
  const [customFields, setCustomFields] = useState<any[]>([]);
  const [roboTab, setRoboTab] = useState<'personal' | 'address' | 'contact' | 'career'>('personal');
  const [savingProfile, setSavingProfile] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [hasUnsavedRobo, setHasUnsavedRobo] = useState(false);

  const fetchAnalytics = async () => {
    try {
      const res = await activityApi.getAnalytics();
      setAnalytics(res.data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await profileApi.get();
      setProfile(res.data);
      if (res.data.custom_fields) {
        try {
          const parsed = typeof res.data.custom_fields === 'string'
            ? JSON.parse(res.data.custom_fields)
            : res.data.custom_fields;
          if (Array.isArray(parsed?.fields)) {
            setCustomFields(parsed.fields);
          } else if (Array.isArray(parsed)) {
            setCustomFields(parsed);
          }
        } catch (e) {
          console.error('Error parsing custom_fields:', e);
        }
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    fetchProfile();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
    fetchProfile();
  };

  const getFieldVal = (key: string, defaultVal: string = '') => {
    if (profile && (profile as any)[key] !== undefined && (profile as any)[key] !== null && String((profile as any)[key]).trim() !== '') {
      return String((profile as any)[key]);
    }
    const cf = customFields.find((f: any) => f.key === key);
    return cf?.value !== undefined && cf?.value !== null ? String(cf.value) : defaultVal;
  };

  const handleRoboFieldChange = (key: string, value: string, category: string = 'identity') => {
    setProfile(prev => {
      if (!prev) return null;
      const updated = { ...prev, [key]: value };
      if (key === 'first_name' || key === 'last_name') {
        const fn = key === 'first_name' ? value : (updated.first_name || '');
        const ln = key === 'last_name' ? value : (updated.last_name || '');
        const mi = getFieldVal('middle_initial');
        if (fn || ln) {
          updated.full_name = [fn, mi ? `${mi}.` : '', ln].filter(Boolean).join(' ');
        }
      } else if (key === 'full_name' && value.trim()) {
        const parts = value.trim().split(/\s+/);
        if (!updated.first_name) updated.first_name = parts[0] || '';
        if (!updated.last_name) updated.last_name = parts.slice(1).join(' ') || parts[0] || '';
      }
      return updated;
    });

    const extendedKeys = ['title', 'middle_initial', 'address_line_2', 'home_phone', 'work_telephone', 'fax', 'comments'];
    if (extendedKeys.includes(key)) {
      setCustomFields(prev => {
        const exists = prev.some((f: any) => f.key === key);
        if (exists) {
          return prev.map((f: any) => f.key === key ? { ...f, value } : f);
        } else {
          return [
            ...prev,
            {
              id: `cf_${key}_${Date.now()}`,
              category,
              key,
              label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
              value,
              type: key === 'comments' ? 'textarea' : 'text'
            }
          ];
        }
      });
    }

    setHasUnsavedRobo(true);
  };

  const calculateAge = (dob: string) => {
    if (!dob) return '';
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) return '';
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age > 0 ? String(age) : '';
  };

  const fillSampleRoboformData = () => {
    const sample = {
      title: 'Mr',
      first_name: 'Ahmad',
      middle_initial: 'N',
      last_name: 'Hidayat',
      full_name: 'Ahmad N. Hidayat',
      gender: 'Laki-laki',
      birth_date: '1995-04-23',
      birth_place: 'Yogyakarta',
      address: 'Jl. Malioboro No. 45',
      address_line_2: 'Kavling 12',
      city: 'Kota Yogyakarta',
      province: 'DI Yogyakarta',
      country: 'Indonesia',
      postal_code: '55271',
      phone: '081298765432',
      home_phone: '0215551234',
      work_telephone: '0215559876',
      fax: '0215559877',
      email: profile?.email || user?.email || 'ahmad.hidayat@example.com',
      website: 'https://govconnect.id',
      organization: 'PT GovConnect Solusi Bangsa',
      occupation: 'Full Stack Engineer',
      income: '15000000',
      driver_license: '3515-8899-0123',
      comments: 'Pengisian benchmark formulir standar internasional RoboForm berhasil diuji oleh GovConnect.'
    };

    setProfile(prev => prev ? { ...prev, ...sample } : ({ ...sample } as any));

    const extraKeys: Record<string, { cat: string; label: string; type: string }> = {
      title: { cat: 'identity', label: 'Title / Gelar', type: 'text' },
      middle_initial: { cat: 'identity', label: 'Middle Initial', type: 'text' },
      address_line_2: { cat: 'address', label: 'Address Line 2', type: 'text' },
      home_phone: { cat: 'contact', label: 'Telepon Rumah', type: 'text' },
      work_telephone: { cat: 'contact', label: 'Telepon Kantor', type: 'text' },
      fax: { cat: 'contact', label: 'Nomor Fax', type: 'text' },
      comments: { cat: 'documents', label: 'Comments', type: 'textarea' },
    };

    setCustomFields(prev => {
      let updated = [...prev];
      Object.entries(extraKeys).forEach(([k, meta]) => {
        const val = (sample as any)[k];
        const idx = updated.findIndex((f: any) => f.key === k);
        if (idx >= 0) {
          updated[idx] = { ...updated[idx], value: val };
        } else {
          updated.push({
            id: `cf_${k}_${Date.now()}`,
            category: meta.cat,
            key: k,
            label: meta.label,
            value: val,
            type: meta.type
          });
        }
      });
      return updated;
    });

    setHasUnsavedRobo(true);
    setSaveMessage({ type: 'success', text: 'Template contoh RoboForm berhasil diterapkan! Klik "Simpan Perubahan" untuk menyinkronkan.' });
    setTimeout(() => setSaveMessage(null), 4000);
  };

  const handleSaveRoboProfile = async () => {
    if (savingProfile || !profile) return;
    setSavingProfile(true);
    setSaveMessage(null);

    try {
      const payload: Partial<Profile> = {
        ...profile,
        custom_fields: JSON.stringify({
          fields: customFields,
        }),
      };

      const res = await profileApi.update(payload);
      setProfile(res.data);
      setHasUnsavedRobo(false);

      // Notifikasi ke ekstensi browser
      try {
        localStorage.setItem('govconnect_profile_updated_at', Date.now().toString());
        window.postMessage({ type: 'GOVCONNECT_PROFILE_UPDATED', profile: res.data }, '*');
      } catch (e) {
        console.warn('Sync notification error:', e);
      }

      setSaveMessage({ type: 'success', text: 'Data profil standar RoboForm berhasil disimpan! Ekstensi siap mengisi formulir benchmark.' });
      setTimeout(() => setSaveMessage(null), 4000);
    } catch (err: any) {
      console.error('Save error:', err);
      setSaveMessage({ type: 'error', text: err?.response?.data?.detail || 'Gagal menyimpan profil.' });
    } finally {
      setSavingProfile(false);
    }
  };

  const roboTrackedKeys = useMemo(() => [
    { key: 'first_name', label: 'First Name', cat: 'personal' },
    { key: 'last_name', label: 'Last Name', cat: 'personal' },
    { key: 'title', label: 'Title', cat: 'personal' },
    { key: 'middle_initial', label: 'Middle Initial', cat: 'personal' },
    { key: 'gender', label: 'Sex', cat: 'personal' },
    { key: 'birth_date', label: 'Date of Birth', cat: 'personal' },
    { key: 'birth_place', label: 'Birth Place', cat: 'personal' },
    { key: 'address', label: 'Address Line 1', cat: 'address' },
    { key: 'address_line_2', label: 'Address Line 2', cat: 'address' },
    { key: 'city', label: 'City', cat: 'address' },
    { key: 'province', label: 'State / Province', cat: 'address' },
    { key: 'country', label: 'Country', cat: 'address' },
    { key: 'postal_code', label: 'Zip Code', cat: 'address' },
    { key: 'phone', label: 'Cell Phone', cat: 'contact' },
    { key: 'home_phone', label: 'Home Phone', cat: 'contact' },
    { key: 'work_telephone', label: 'Work Telephone', cat: 'contact' },
    { key: 'fax', label: 'Fax', cat: 'contact' },
    { key: 'email', label: 'Email', cat: 'contact' },
    { key: 'website', label: 'Web Site', cat: 'contact' },
    { key: 'organization', label: 'Company', cat: 'career' },
    { key: 'occupation', label: 'Job Title', cat: 'career' },
    { key: 'income', label: 'Income', cat: 'career' },
    { key: 'driver_license', label: 'Driver License', cat: 'career' },
    { key: 'comments', label: 'Comments', cat: 'career' },
  ], []);

  const roboStats = useMemo(() => {
    let filled = 0;
    const catFilled: Record<string, { filled: number; total: number }> = {
      personal: { filled: 0, total: 0 },
      address: { filled: 0, total: 0 },
      contact: { filled: 0, total: 0 },
      career: { filled: 0, total: 0 },
    };

    roboTrackedKeys.forEach(item => {
      catFilled[item.cat].total++;
      const val = getFieldVal(item.key);
      if (val && val.trim() !== '') {
        filled++;
        catFilled[item.cat].filled++;
      }
    });

    const total = roboTrackedKeys.length;
    const pct = Math.round((filled / total) * 100);
    return { filled, total, pct, catFilled };
  }, [profile, customFields, roboTrackedKeys]);

  const kpiCards = [
    {
      title: 'Total Autofill',
      value: analytics?.total_autofill ?? 0,
      icon: LayoutDashboard,
      color: 'bg-blue-600',
      bg: 'bg-blue-50/50',
      border: 'border-blue-200/80',
      subLabel: 'Total formulir diproses',
    },
    {
      title: 'Success Rate',
      value: `${analytics?.success_rate ?? 0}%`,
      icon: CheckCircle,
      color: 'bg-green-600',
      bg: 'bg-green-50/50',
      border: 'border-green-200/80',
      subLabel: `${analytics?.success_count ?? 0} berhasil penuh`,
    },
    {
      title: 'Estimated Time Saved',
      value: analytics
        ? `${Math.floor(analytics.estimated_time_saved_seconds / 60)}m ${analytics.estimated_time_saved_seconds % 60}s`
        : '0m 0s',
      icon: Clock,
      color: 'bg-amber-600',
      bg: 'bg-amber-50/50',
      border: 'border-amber-200/80',
      subLabel: '(Estimated · 30s/field)',
    },
    {
      title: 'Profile Completion',
      value: `${analytics?.profile_completion ?? 0}%`,
      icon: UserCheck,
      color: 'bg-purple-600',
      bg: 'bg-purple-50/50',
      border: 'border-purple-200/80',
      subLabel: 'Kelengkapan data KTP',
    },
  ];

  // Pie chart data for Autofill Results
  const resultsData = [
    { name: 'Success', value: analytics?.success_count ?? 0, color: '#16A34A' },
    { name: 'Partial', value: analytics?.partial_count ?? 0, color: '#F59E0B' },
    { name: 'Failed', value: analytics?.failed_count ?? 0, color: '#DC2626' },
  ];

  const hasResultData = (analytics?.total_autofill ?? 0) > 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-80 gap-3">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-slate-500 font-medium">Memuat data analitik GovConnect...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header Greeting & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Overview Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Ringkasan analitik dan efisiensi pengisian formulir otomatis untuk akun <span className="font-semibold text-slate-700">{user?.email}</span>
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all shadow-xs self-start sm:self-auto disabled:opacity-60"
        >
          <RotateCw className={`w-3.5 h-3.5 text-slate-500 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Memperbarui...' : 'Perbarui Data'}</span>
        </button>
      </div>

      {/* Onboarding Banner when no autofill yet */}
      {analytics?.total_autofill === 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Mulai Menggunakan Ekstensi GovConnect
              </h2>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                Anda belum memiliki riwayat pengisian formulir. Buka formulir layanan publik atau gunakan halaman simulasi formulir pengujian, lalu klik ekstensi GovConnect di pojok kanan atas browser Anda. Data pengisian akan langsung tersinkron di dashboard ini.
              </p>
            </div>
          </div>
          <a
            href="http://localhost:5173/test-page/dummy_form.html"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold whitespace-nowrap transition-colors shadow-xs"
          >
            <span>Buka Form Simulasi</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card, i) => (
          <div
            key={i}
            className={`rounded-xl border p-5 bg-white transition-all hover:shadow-xs ${card.border}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{card.title}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1.5">{card.value}</p>
                {card.subLabel && <p className="text-xs text-slate-500 mt-1">{card.subLabel}</p>}
              </div>
              <div className={`p-2.5 rounded-lg ${card.color} text-white shadow-xs`}>
                <card.icon className="w-5 h-5" aria-hidden="true" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* ROBOFORM BENCHMARK & PROFILE DATA SUITE WIDGET */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        {/* Widget Top Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md flex-shrink-0">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold text-white tracking-tight">RoboForm Benchmark & Data Suite</h2>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded-full">
                    International Benchmark
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                  Lengkapi data tolok ukur RoboForm (24 Kolom) agar ekstensi GovConnect dapat mengisi 100% formulir standar global secara instan.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={fillSampleRoboformData}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-indigo-100 bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl transition-all shadow-xs cursor-pointer"
                title="Isi cepat dengan data contoh standar RoboForm"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Isi Data Contoh</span>
              </button>

              <a
                href="/test-page/roboform_standard.html"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-blue-200 bg-blue-600/30 hover:bg-blue-600/40 border border-blue-400/40 rounded-xl transition-all shadow-xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Uji di Benchmark</span>
              </a>

              <button
                type="button"
                onClick={handleSaveRoboProfile}
                disabled={savingProfile}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {savingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>{savingProfile ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
              </button>
            </div>
          </div>

          {/* Readiness Progress Bar */}
          <div className="mt-5 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1.5 flex-1 max-w-xl">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Kesiapan Autofill RoboForm:
                  <span className="font-bold text-white ml-1">{roboStats.filled} dari {roboStats.total} kolom terisi</span>
                </span>
                <span className="font-bold text-emerald-400">{roboStats.pct}% Siap</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-white/10">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 via-indigo-400 to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${roboStats.pct}%` }}
                />
              </div>
            </div>

            {hasUnsavedRobo && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-300 bg-amber-500/20 px-3 py-1.5 rounded-lg border border-amber-400/30 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Ada perubahan belum disimpan
              </span>
            )}
          </div>
        </div>

        {/* Save Message Notification */}
        {saveMessage && (
          <div
            className={`p-3.5 px-6 border-b flex items-center gap-2.5 text-xs font-semibold ${
              saveMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {saveMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span>{saveMessage.text}</span>
          </div>
        )}

        {/* Tab Selector */}
        <div className="border-b border-slate-200 bg-slate-50/75 p-2 flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'personal', label: 'Identitas & Personal', icon: User, catKey: 'personal' },
            { id: 'address', label: 'Alamat & Domisili', icon: MapPin, catKey: 'address' },
            { id: 'contact', label: 'Kontak & Web', icon: Phone, catKey: 'contact' },
            { id: 'career', label: 'Karir & Dokumen', icon: Briefcase, catKey: 'career' },
          ].map(tab => {
            const countInfo = (roboStats.catFilled as any)[tab.catKey];
            const isActive = roboTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setRoboTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <tab.icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                    isActive ? 'bg-blue-50 text-blue-700 font-bold' : 'bg-slate-200/70 text-slate-600'
                  }`}
                >
                  {countInfo ? `${countInfo.filled}/${countInfo.total}` : ''}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        <div className="p-5 sm:p-6 bg-white">
          {/* TAB 1: IDENTITAS & PERSONAL */}
          {roboTab === 'personal' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Title */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">Title / Sapaan</label>
                  {getFieldVal('title') && <Check className="w-3 h-3 text-emerald-600" />}
                </div>
                <input
                  type="text"
                  value={getFieldVal('title')}
                  onChange={e => handleRoboFieldChange('title', e.target.value, 'identity')}
                  placeholder="Mr / Mrs / Ms / Dr"
                  className="w-full px-3 py-2 text-xs bg-slate-50/60 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* First Name */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">First Name (Nama Depan)</label>
                  {getFieldVal('first_name') && <Check className="w-3 h-3 text-emerald-600" />}
                </div>
                <input
                  type="text"
                  value={getFieldVal('first_name')}
                  onChange={e => handleRoboFieldChange('first_name', e.target.value, 'identity')}
                  placeholder="Ahmad"
                  className="w-full px-3 py-2 text-xs bg-slate-50/60 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Middle Initial */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">Middle Initial (Inisial)</label>
                  {getFieldVal('middle_initial') && <Check className="w-3 h-3 text-emerald-600" />}
                </div>
                <input
                  type="text"
                  maxLength={2}
                  value={getFieldVal('middle_initial')}
                  onChange={e => handleRoboFieldChange('middle_initial', e.target.value, 'identity')}
                  placeholder="N"
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50/60 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Last Name */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">Last Name (Nama Belakang)</label>
                  {getFieldVal('last_name') && <Check className="w-3 h-3 text-emerald-600" />}
                </div>
                <input
                  type="text"
                  value={getFieldVal('last_name')}
                  onChange={e => handleRoboFieldChange('last_name', e.target.value, 'identity')}
                  placeholder="Hidayat"
                  className="w-full px-3 py-2 text-xs bg-slate-50/60 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Full Name */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">Full Name (Nama Lengkap)</label>
                  {getFieldVal('full_name') && <Check className="w-3 h-3 text-emerald-600" />}
                </div>
                <input
                  type="text"
                  value={getFieldVal('full_name')}
                  onChange={e => handleRoboFieldChange('full_name', e.target.value, 'identity')}
                  placeholder="Ahmad N. Hidayat"
                  className="w-full px-3 py-2 text-xs bg-slate-50/60 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Sex / Gender */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">Sex / Gender</label>
                  {getFieldVal('gender') && <Check className="w-3 h-3 text-emerald-600" />}
                </div>
                <select
                  value={getFieldVal('gender')}
                  onChange={e => handleRoboFieldChange('gender', e.target.value, 'identity')}
                  className="w-full px-3 py-2 text-xs bg-slate-50/60 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">-- Pilih Sex --</option>
                  <option value="Male">Male / Laki-laki</option>
                  <option value="Female">Female / Perempuan</option>
                </select>
              </div>

              {/* Date of Birth & Age */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">Date of Birth (Tgl Lahir)</label>
                  {getFieldVal('birth_date') && (
                    <span className="text-[10px] text-blue-700 bg-blue-50 font-semibold px-1.5 py-0.5 rounded">
                      Usia: {calculateAge(getFieldVal('birth_date'))} thn
                    </span>
                  )}
                </div>
                <input
                  type="date"
                  value={getFieldVal('birth_date')}
                  onChange={e => handleRoboFieldChange('birth_date', e.target.value, 'identity')}
                  className="w-full px-3 py-2 text-xs bg-slate-50/60 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Birth Place */}
              <div className="space-y-1 md:col-span-2 lg:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">Birth Place (Tempat Lahir)</label>
                  {getFieldVal('birth_place') && <Check className="w-3 h-3 text-emerald-600" />}
                </div>
                <input
                  type="text"
                  value={getFieldVal('birth_place')}
                  onChange={e => handleRoboFieldChange('birth_place', e.target.value, 'identity')}
                  placeholder="Yogyakarta"
                  className="w-full px-3 py-2 text-xs bg-slate-50/60 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* TAB 2: ALAMAT & DOMISILI */}
          {roboTab === 'address' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Address Line 1 */}
              <div className="space-y-1 lg:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">Address Line 1 (Jalan & Nomor)</label>
                  {getFieldVal('address') && <Check className="w-3 h-3 text-emerald-600" />}
                </div>
                <input
                  type="text"
                  value={getFieldVal('address')}
                  onChange={e => handleRoboFieldChange('address', e.target.value, 'address')}
                  placeholder="Jl. Malioboro No. 45"
                  className="w-full px-3 py-2 text-xs bg-slate-50/60 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Address Line 2 */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">Address Line 2 (Gedung/Kavling)</label>
                  {getFieldVal('address_line_2') && <Check className="w-3 h-3 text-emerald-600" />}
                </div>
                <input
                  type="text"
                  value={getFieldVal('address_line_2')}
                  onChange={e => handleRoboFieldChange('address_line_2', e.target.value, 'address')}
                  placeholder="Kavling 12 / Suite 3A"
                  className="w-full px-3 py-2 text-xs bg-slate-50/60 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* City */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">City (Kota / Kabupaten)</label>
                  {getFieldVal('city') && <Check className="w-3 h-3 text-emerald-600" />}
                </div>
                <input
                  type="text"
                  value={getFieldVal('city')}
                  onChange={e => handleRoboFieldChange('city', e.target.value, 'address')}
                  placeholder="Kota Yogyakarta"
                  className="w-full px-3 py-2 text-xs bg-slate-50/60 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* State / Province */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">State / Province</label>
                  {getFieldVal('province') && <Check className="w-3 h-3 text-emerald-600" />}
                </div>
                <input
                  type="text"
                  value={getFieldVal('province')}
                  onChange={e => handleRoboFieldChange('province', e.target.value, 'address')}
                  placeholder="DI Yogyakarta"
                  className="w-full px-3 py-2 text-xs bg-slate-50/60 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Country */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">Country (Negara)</label>
                  {getFieldVal('country') && <Check className="w-3 h-3 text-emerald-600" />}
                </div>
                <input
                  type="text"
                  value={getFieldVal('country', 'Indonesia')}
                  onChange={e => handleRoboFieldChange('country', e.target.value, 'address')}
                  placeholder="Indonesia"
                  className="w-full px-3 py-2 text-xs bg-slate-50/60 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Zip / Postal Code */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">Zip / Postal Code</label>
                  {getFieldVal('postal_code') && <Check className="w-3 h-3 text-emerald-600" />}
                </div>
                <input
                  type="text"
                  maxLength={10}
                  value={getFieldVal('postal_code')}
                  onChange={e => handleRoboFieldChange('postal_code', e.target.value, 'address')}
                  placeholder="55271"
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50/60 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* TAB 3: KONTAK & WEB */}
          {roboTab === 'contact' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Cell Phone */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">Cell Phone (HP / WhatsApp)</label>
                  {getFieldVal('phone') && <Check className="w-3 h-3 text-emerald-600" />}
                </div>
                <input
                  type="tel"
                  value={getFieldVal('phone')}
                  onChange={e => handleRoboFieldChange('phone', e.target.value, 'contact')}
                  placeholder="081298765432"
                  className="w-full px-3 py-2 text-xs bg-slate-50/60 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Home Phone */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">Home Phone (Telepon Rumah)</label>
                  {getFieldVal('home_phone') && <Check className="w-3 h-3 text-emerald-600" />}
                </div>
                <input
                  type="tel"
                  value={getFieldVal('home_phone')}
                  onChange={e => handleRoboFieldChange('home_phone', e.target.value, 'contact')}
                  placeholder="0215551234"
                  className="w-full px-3 py-2 text-xs bg-slate-50/60 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Work Telephone */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">Work Telephone (Kantor)</label>
                  {getFieldVal('work_telephone') && <Check className="w-3 h-3 text-emerald-600" />}
                </div>
                <input
                  type="tel"
                  value={getFieldVal('work_telephone')}
                  onChange={e => handleRoboFieldChange('work_telephone', e.target.value, 'contact')}
                  placeholder="0215559876"
                  className="w-full px-3 py-2 text-xs bg-slate-50/60 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Fax */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">Fax</label>
                  {getFieldVal('fax') && <Check className="w-3 h-3 text-emerald-600" />}
                </div>
                <input
                  type="tel"
                  value={getFieldVal('fax')}
                  onChange={e => handleRoboFieldChange('fax', e.target.value, 'contact')}
                  placeholder="0215559877"
                  className="w-full px-3 py-2 text-xs bg-slate-50/60 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Email */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">Email Address</label>
                  {getFieldVal('email') && <Check className="w-3 h-3 text-emerald-600" />}
                </div>
                <input
                  type="email"
                  value={getFieldVal('email')}
                  onChange={e => handleRoboFieldChange('email', e.target.value, 'contact')}
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 text-xs bg-slate-50/60 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Web Site */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">Web Site (URL)</label>
                  {getFieldVal('website') && <Check className="w-3 h-3 text-emerald-600" />}
                </div>
                <input
                  type="url"
                  value={getFieldVal('website')}
                  onChange={e => handleRoboFieldChange('website', e.target.value, 'contact')}
                  placeholder="https://govconnect.id"
                  className="w-full px-3 py-2 text-xs bg-slate-50/60 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* TAB 4: KARIR & DOKUMEN */}
          {roboTab === 'career' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Company */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">Company (Instansi / Perusahaan)</label>
                  {getFieldVal('organization') && <Check className="w-3 h-3 text-emerald-600" />}
                </div>
                <input
                  type="text"
                  value={getFieldVal('organization')}
                  onChange={e => handleRoboFieldChange('organization', e.target.value, 'career')}
                  placeholder="PT GovConnect Solusi Bangsa"
                  className="w-full px-3 py-2 text-xs bg-slate-50/60 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Job Title */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">Job Title (Profesi / Posisi)</label>
                  {getFieldVal('occupation') && <Check className="w-3 h-3 text-emerald-600" />}
                </div>
                <input
                  type="text"
                  value={getFieldVal('occupation')}
                  onChange={e => handleRoboFieldChange('occupation', e.target.value, 'career')}
                  placeholder="Full Stack Engineer"
                  className="w-full px-3 py-2 text-xs bg-slate-50/60 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Income */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">Income (Penghasilan / Bulan)</label>
                  {getFieldVal('income') && <Check className="w-3 h-3 text-emerald-600" />}
                </div>
                <input
                  type="text"
                  value={getFieldVal('income')}
                  onChange={e => handleRoboFieldChange('income', e.target.value, 'career')}
                  placeholder="15000000"
                  className="w-full px-3 py-2 text-xs bg-slate-50/60 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Driver License */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">Driver License (Nomor SIM)</label>
                  {getFieldVal('driver_license') && <Check className="w-3 h-3 text-emerald-600" />}
                </div>
                <input
                  type="text"
                  value={getFieldVal('driver_license')}
                  onChange={e => handleRoboFieldChange('driver_license', e.target.value, 'documents')}
                  placeholder="3515-8899-0123"
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50/60 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Comments */}
              <div className="space-y-1 md:col-span-2 lg:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">Comments (Catatan RoboForm)</label>
                  {getFieldVal('comments') && <Check className="w-3 h-3 text-emerald-600" />}
                </div>
                <textarea
                  rows={2}
                  value={getFieldVal('comments')}
                  onChange={e => handleRoboFieldChange('comments', e.target.value, 'documents')}
                  placeholder="Pengisian benchmark formulir standar internasional RoboForm berhasil diuji oleh GovConnect."
                  className="w-full px-3 py-2 text-xs bg-slate-50/60 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Quick Info & Profile Link */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0" />
              Semua field disinkronisasikan otomatis dengan ekstensi GovConnect untuk pengisian benchmark global.
            </span>
            <a
              href="/profile"
              className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700 hover:underline"
            >
              <span>Buka Profil Lengkap & Foto Dokumen</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Main Activity Line Chart (Full Width) */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              Autofill Activity (7 Hari Terakhir)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Frekuensi penggunaan autofill per hari</p>
          </div>
          <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
            Real-time
          </span>
        </div>

        <div className="h-64 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={analytics?.daily_trend || []}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: '#64748B', fontSize: 12 }}
                axisLine={{ stroke: '#E2E8F0' }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: '#64748B', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                  fontSize: '12px'
                }}
                formatter={(value: any) => [`${value} kali`, 'Autofill']}
              />
              <Line
                type="monotone"
                dataKey="autofill"
                stroke="#2563EB"
                strokeWidth={2.5}
                dot={{ fill: '#2563EB', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, strokeWidth: 2, fill: '#1D4ED8' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Three Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Results Donut Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Autofill Results
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Rasio keberhasilan autofill</p>
          </div>

          <div className="h-48 my-2 flex items-center justify-center">
            {hasResultData ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={resultsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                  >
                    {resultsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-6">
                <Inbox className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500">Belum ada data eksekusi</p>
              </div>
            )}
          </div>

          <div className="flex justify-center gap-4 pt-2 border-t border-slate-100 text-xs font-medium">
            {resultsData.map((item, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-slate-600">{item.name}:</span>
                <span className="font-semibold text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Most Used Fields Horizontal Bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-purple-600" />
              Most Used Fields
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Field identitas yang paling sering diisi</p>
          </div>

          <div className="h-48 my-2 flex items-center justify-center">
            {analytics?.most_used_fields && analytics.most_used_fields.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={analytics.most_used_fields}
                  margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#475569', fontSize: 11 }}
                    width={85}
                  />
                  <Tooltip
                    cursor={{ fill: '#F8FAFC' }}
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    formatter={(val: any) => [`${val} kali`, 'Digunakan']}
                  />
                  <Bar dataKey="count" fill="#8B5CF6" radius={[0, 4, 4, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-6">
                <Inbox className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500">Belum ada field terisi</p>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 text-center">
            <span className="text-[11px] text-slate-500">Otomatis dihitung dari log autofill ekstensi</span>
          </div>
        </div>

        {/* Autofill by Website Horizontal Bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Globe className="w-4 h-4 text-teal-600" />
              Autofill by Website
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Domain layanan yang paling sering diakses</p>
          </div>

          <div className="h-48 my-2 flex items-center justify-center">
            {analytics?.by_website && analytics.by_website.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={analytics.by_website}
                  margin={{ top: 5, right: 20, left: 30, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#475569', fontSize: 11 }}
                    width={100}
                  />
                  <Tooltip
                    cursor={{ fill: '#F8FAFC' }}
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    formatter={(val: any) => [`${val} kali`, 'Autofill']}
                  />
                  <Bar dataKey="count" fill="#14B8A6" radius={[0, 4, 4, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-6">
                <Inbox className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500">Belum ada data domain website</p>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 text-center">
            <span className="text-[11px] text-slate-500">Domain publik yang dikenali ekstensi</span>
          </div>
        </div>
      </div>

      {/* Recent Activity Real Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-slate-500" />
            <h2 className="text-base font-bold text-slate-900">Recent Activity</h2>
          </div>
          <span className="text-xs text-slate-500">5 aktivitas terbaru</span>
        </div>

        <div className="overflow-x-auto">
          {analytics?.recent_activities && analytics.recent_activities.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200">
                  <th className="py-3 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">Tanggal</th>
                  <th className="py-3 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">Website Target</th>
                  <th className="py-3 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">Field Terisi</th>
                  <th className="py-3 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {analytics.recent_activities.map((activity) => (
                  <tr key={activity.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-6 text-slate-600 text-xs">
                      {new Date(activity.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="py-3.5 px-6 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5 text-slate-400" />
                        <span>{activity.website_domain || new URL(activity.target_url).hostname}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-6 text-slate-600 text-xs">
                      <span className="font-semibold text-slate-900">{activity.fields_filled}</span> dari {activity.fields_detected} field
                    </td>
                    <td className="py-3.5 px-6">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${activity.status === 'success'
                            ? 'bg-green-100 text-green-800'
                            : activity.status === 'partial'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                      >
                        {activity.status === 'success' ? '✓ Success' : activity.status === 'partial' ? '⚠ Partial' : '✕ Failed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center">
              <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700">Belum ada riwayat aktivitas autofill</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Gunakan Chrome Extension di formulir pendaftaran untuk melihat riwayat aktivitas di sini.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}