import { KpiCard } from '../components/KpiCard';
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
      color: 'bg-brand-600',
      bg: 'bg-accent-light/50',
      border: 'border-brand-500/30',
      subLabel: 'Total formulir diproses',
    },
    {
      title: 'Success Rate',
      value: `${analytics?.success_rate ?? 0}%`,
      icon: CheckCircle,
      color: 'bg-success',
      bg: 'bg-success-light/50',
      border: 'border-success/30',
      subLabel: `${analytics?.success_count ?? 0} berhasil penuh`,
    },
    {
      title: 'Estimated Time Saved',
      value: analytics
        ? `${Math.floor(analytics.estimated_time_saved_seconds / 60)}m ${analytics.estimated_time_saved_seconds % 60}s`
        : '0m 0s',
      icon: Clock,
      color: 'bg-warning',
      bg: 'bg-warning-light/50',
      border: 'border-warning/30',
      subLabel: '(Estimated · 30s/field)',
    },
    {
      title: 'Profile Completion',
      value: `${analytics?.profile_completion ?? 0}%`,
      icon: UserCheck,
      color: 'bg-brand-700',
      bg: 'bg-accent-light/50',
      border: 'border-brand-500/30',
      subLabel: 'Kelengkapan data KTP',
    },
  ];

  // Pie chart data for Autofill Results
  const resultsData = [
    { name: 'Success', value: analytics?.success_count ?? 0, color: '#15803d' },
    { name: 'Partial', value: analytics?.partial_count ?? 0, color: '#a16207' },
    { name: 'Failed', value: analytics?.failed_count ?? 0, color: '#b91c1c' },
  ];

  const hasResultData = (analytics?.total_autofill ?? 0) > 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-80 gap-3">
        <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-content-tertiary font-medium">Memuat data analitik GovConnect...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header Greeting & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-content-primary tracking-tight">Overview Dashboard</h1>
          <p className="text-sm text-content-tertiary mt-0.5">
            Ringkasan analitik dan efisiensi pengisian formulir otomatis untuk akun <span className="font-semibold text-content-secondary">{user?.email}</span>
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-content-secondary bg-surface-elevated border border-border-default rounded-md hover:bg-surface-sunken hover:border-border-strong transition-colors-fast self-start sm:self-auto disabled:opacity-60"
        >
          <RotateCw className={`w-3.5 h-3.5 text-content-tertiary ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Memperbarui...' : 'Perbarui Data'}</span>
        </button>
      </div>

      {/* Onboarding Banner when no autofill yet */}
      {analytics?.total_autofill === 0 && (
        <div className="bg-gradient-to-r from-brand-600 to-brand-700 rounded-lg p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur text-white flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Mulai Menggunakan Ekstensi GovConnect
              </h2>
              <p className="text-sm text-white/90 mt-1 max-w-2xl leading-relaxed">
                Anda belum memiliki riwayat pengisian formulir. Buka formulir layanan publik atau gunakan halaman simulasi formulir pengujian, lalu klik ekstensi GovConnect di pojok kanan atas browser Anda.
              </p>
            </div>
          </div>
          <a
            href="http://localhost:5173/test-page/dummy_form.html"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-brand-600 hover:bg-white/90 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors-fast shadow-sm"
          >
            <span>Buka Form Simulasi</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card, i) => (
          <KpiCard
            key={i}
            title={card.title}
            value={card.value}
            icon={card.icon}
            iconBg={card.color}
            border={card.border}
            subLabel={card.subLabel}
          />
        ))}
      </div>

      {/* ========================================================================= */}
      {/* ROBOFORM BENCHMARK & PROFILE DATA SUITE WIDGET */}
      {/* ========================================================================= */}
      <div className="bg-surface-elevated rounded-lg border border-border-default overflow-hidden">
        {/* Widget Top Header */}
        <div className="p-5 sm:p-6 bg-content-primary text-white">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-12 h-12 rounded-md bg-brand-600 flex items-center justify-center text-white flex-shrink-0">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold text-white tracking-tight">RoboForm Benchmark & Data Suite</h2>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-brand-500/30 text-blue-200 border border-brand-400/40 px-2 py-1 rounded-md">
                    International Benchmark
                  </span>
                </div>
                <p className="text-xs text-blue-200 mt-0.5 leading-relaxed prose-measure">
                  Lengkapi data tolok ukur RoboForm (24 Kolom) agar ekstensi GovConnect dapat mengisi 100% formulir standar global secara instan.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={fillSampleRoboformData}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-blue-100 bg-white/10 hover:bg-white/15 border border-white/15 rounded-md transition-colors-fast cursor-pointer"
                title="Isi cepat dengan data contoh standar RoboForm"
              >
                <Sparkles className="w-3.5 h-3.5 text-warning-light" />
                <span>Isi Data Contoh</span>
              </button>

              <a
                href="/test-page/roboform_standard.html"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-blue-200 bg-brand-600/40 hover:bg-brand-600/50 border border-brand-500/40 rounded-md transition-colors-fast"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Uji di Benchmark</span>
              </a>

              <button
                type="button"
                onClick={handleSaveRoboProfile}
                disabled={savingProfile}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 active:bg-brand-700 rounded-md transition-colors-fast disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
                <span className="text-blue-200 font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-success-light" />
                  Kesiapan Autofill RoboForm:
                  <span className="font-bold text-white ml-1 tabular-nums">{roboStats.filled} dari {roboStats.total} kolom terisi</span>
                </span>
                <span className="font-bold text-success-light tabular-nums">{roboStats.pct}% Siap</span>
              </div>
              <div className="w-full h-2 bg-content-primary rounded-full overflow-hidden border border-white/10">
                <div
                  className="h-full bg-brand-500 rounded-full transition-[width] duration-slow ease-layout"
                  style={{ width: `${roboStats.pct}%` }}
                />
              </div>
            </div>

            {hasUnsavedRobo && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-warning-light bg-warning/20 px-3 py-1.5 rounded-md border border-warning/30 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-warning" />
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
                ? 'bg-green-50 text-success border border-success/20 border-success/30'
                : 'bg-red-50 text-error border border-error/20 border-error/30'
            }`}
          >
            {saveMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-error flex-shrink-0" />
            )}
            <span>{saveMessage.text}</span>
          </div>
        )}

        {/* Tab Selector */}
        <div className="border-b border-border-default bg-surface-sunken/75 p-2 flex items-center gap-2 overflow-x-auto">
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
                className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-semibold whitespace-nowrap transition-colors-fast cursor-pointer ${
                  isActive
                    ? 'bg-surface-elevated text-brand-600 border border-border-default'
                    : 'text-content-secondary hover:text-content-primary hover:bg-surface-base'
                }`}
              >
                <tab.icon className={`w-3.5 h-3.5 ${isActive ? 'text-brand-600' : 'text-content-tertiary'}`} />
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded tabular-nums ${
                    isActive ? 'bg-accent-light text-brand-600 font-bold' : 'bg-surface-base text-content-tertiary'
                  }`}
                >
                  {countInfo ? `${countInfo.filled}/${countInfo.total}` : ''}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        <div className="p-5 sm:p-6 bg-surface-elevated">
          {/* TAB 1: IDENTITAS & PERSONAL */}
          {roboTab === 'personal' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Title */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="robo-title" className="text-xs font-semibold text-content-secondary">Title / Sapaan</label>
                  {getFieldVal('title') && <Check className="w-3 h-3 text-success" />}
                </div>
                <input
                  id="robo-title"
                  type="text"
                  value={getFieldVal('title')}
                  onChange={e => handleRoboFieldChange('title', e.target.value, 'identity')}
                  placeholder="Mr / Mrs / Ms / Dr"
                  className="w-full px-3 py-2 text-xs bg-surface-sunken/60 border border-border-default rounded-md text-content-primary placeholder:text-content-disabled focus:bg-surface-elevated focus:ring-2 focus:ring-border-focus focus:outline-none transition-colors-fast"
                />
              </div>

              {/* First Name */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="robo-firstName" className="text-xs font-semibold text-content-secondary">First Name (Nama Depan)</label>
                  {getFieldVal('first_name') && <Check className="w-3 h-3 text-success" />}
                </div>
                <input
                  id="robo-firstName"
                  type="text"
                  value={getFieldVal('first_name')}
                  onChange={e => handleRoboFieldChange('first_name', e.target.value, 'identity')}
                  placeholder="Ahmad"
                  className="w-full px-3 py-2 text-xs bg-surface-sunken/60 border border-border-default rounded-md text-content-primary placeholder:text-content-disabled focus:bg-surface-elevated focus:ring-2 focus:ring-border-focus focus:outline-none transition-colors-fast"
                />
              </div>

              {/* Middle Initial */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="robo-middleInitial" className="text-xs font-semibold text-content-secondary">Middle Initial (Inisial)</label>
                  {getFieldVal('middle_initial') && <Check className="w-3 h-3 text-success" />}
                </div>
                <input
                  id="robo-middleInitial"
                  type="text"
                  maxLength={2}
                  value={getFieldVal('middle_initial')}
                  onChange={e => handleRoboFieldChange('middle_initial', e.target.value, 'identity')}
                  placeholder="N"
                  className="w-full px-3 py-2 text-xs font-mono bg-surface-sunken/60 border border-border-default rounded-md text-content-primary placeholder:text-content-disabled focus:bg-surface-elevated focus:ring-2 focus:ring-border-focus focus:outline-none transition-colors-fast"
                />
              </div>

              {/* Last Name */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="robo-lastName" className="text-xs font-semibold text-content-secondary">Last Name (Nama Belakang)</label>
                  {getFieldVal('last_name') && <Check className="w-3 h-3 text-success" />}
                </div>
                <input
                  id="robo-lastName"
                  type="text"
                  value={getFieldVal('last_name')}
                  onChange={e => handleRoboFieldChange('last_name', e.target.value, 'identity')}
                  placeholder="Hidayat"
                  className="w-full px-3 py-2 text-xs bg-surface-sunken/60 border border-border-default rounded-md text-content-primary placeholder:text-content-disabled focus:bg-surface-elevated focus:ring-2 focus:ring-border-focus focus:outline-none transition-colors-fast"
                />
              </div>

              {/* Full Name */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="robo-fullName" className="text-xs font-semibold text-content-secondary">Full Name (Nama Lengkap)</label>
                  {getFieldVal('full_name') && <Check className="w-3 h-3 text-success" />}
                </div>
                <input
                  id="robo-fullName"
                  type="text"
                  value={getFieldVal('full_name')}
                  onChange={e => handleRoboFieldChange('full_name', e.target.value, 'identity')}
                  placeholder="Ahmad N. Hidayat"
                  className="w-full px-3 py-2 text-xs bg-surface-sunken/60 border border-border-default rounded-md text-content-primary placeholder:text-content-disabled focus:bg-surface-elevated focus:ring-2 focus:ring-border-focus focus:outline-none transition-colors-fast"
                />
              </div>

              {/* Sex / Gender */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="robo-sex" className="text-xs font-semibold text-content-secondary">Sex / Gender</label>
                  {getFieldVal('gender') && <Check className="w-3 h-3 text-success" />}
                </div>
                <select
                  id="robo-sex"
                  value={getFieldVal('gender')}
                  onChange={e => handleRoboFieldChange('gender', e.target.value, 'identity')}
                  className="w-full px-3 py-2 text-xs bg-surface-sunken/60 border border-border-default rounded-md text-content-primary focus:bg-surface-elevated focus:ring-2 focus:ring-border-focus focus:outline-none transition-colors-fast"
                >
                  <option value="">-- Pilih Sex --</option>
                  <option value="Male">Male / Laki-laki</option>
                  <option value="Female">Female / Perempuan</option>
                </select>
              </div>

              {/* Date of Birth & Age */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="robo-dateOfBirth" className="text-xs font-semibold text-content-secondary">Date of Birth (Tgl Lahir)</label>
                  {getFieldVal('birth_date') && (
                    <span className="text-[10px] text-brand-600 bg-accent-light font-semibold px-1.5 py-0.5 rounded tabular-nums">
                      Usia: {calculateAge(getFieldVal('birth_date'))} thn
                    </span>
                  )}
                </div>
                <input
                  id="robo-dateOfBirth"
                  type="date"
                  value={getFieldVal('birth_date')}
                  onChange={e => handleRoboFieldChange('birth_date', e.target.value, 'identity')}
                  className="w-full px-3 py-2 text-xs bg-surface-sunken/60 border border-border-default rounded-md text-content-primary focus:bg-surface-elevated focus:ring-2 focus:ring-border-focus focus:outline-none transition-colors-fast"
                />
              </div>

              {/* Birth Place */}
              <div className="space-y-1 md:col-span-2 lg:col-span-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="robo-birthPlace" className="text-xs font-semibold text-content-secondary">Birth Place (Tempat Lahir)</label>
                  {getFieldVal('birth_place') && <Check className="w-3 h-3 text-success" />}
                </div>
                <input
                  id="robo-birthPlace"
                  type="text"
                  value={getFieldVal('birth_place')}
                  onChange={e => handleRoboFieldChange('birth_place', e.target.value, 'identity')}
                  placeholder="Yogyakarta"
                  className="w-full px-3 py-2 text-xs bg-surface-sunken/60 border border-border-default rounded-md text-content-primary placeholder:text-content-disabled focus:bg-surface-elevated focus:ring-2 focus:ring-border-focus focus:outline-none transition-colors-fast"
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
                  <label htmlFor="robo-addressLine1" className="text-xs font-semibold text-content-secondary">Address Line 1 (Jalan & Nomor)</label>
                  {getFieldVal('address') && <Check className="w-3 h-3 text-success" />}
                </div>
                <input
                  id="robo-addressLine1"
                  type="text"
                  value={getFieldVal('address')}
                  onChange={e => handleRoboFieldChange('address', e.target.value, 'address')}
                  placeholder="Jl. Malioboro No. 45"
                  className="w-full px-3 py-2 text-xs bg-surface-sunken/60 border border-border-default rounded-md text-content-primary placeholder:text-content-disabled focus:bg-surface-elevated focus:ring-2 focus:ring-border-focus focus:outline-none transition-colors-fast"
                />
              </div>

              {/* Address Line 2 */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="robo-addressLine2" className="text-xs font-semibold text-content-secondary">Address Line 2 (Gedung/Kavling)</label>
                  {getFieldVal('address_line_2') && <Check className="w-3 h-3 text-success" />}
                </div>
                <input
                  id="robo-addressLine2"
                  type="text"
                  value={getFieldVal('address_line_2')}
                  onChange={e => handleRoboFieldChange('address_line_2', e.target.value, 'address')}
                  placeholder="Kavling 12 / Suite 3A"
                  className="w-full px-3 py-2 text-xs bg-surface-sunken/60 border border-border-default rounded-md text-content-primary placeholder:text-content-disabled focus:bg-surface-elevated focus:ring-2 focus:ring-border-focus focus:outline-none transition-colors-fast"
                />
              </div>

              {/* City */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="robo-city" className="text-xs font-semibold text-content-secondary">City (Kota / Kabupaten)</label>
                  {getFieldVal('city') && <Check className="w-3 h-3 text-success" />}
                </div>
                <input
                  id="robo-city"
                  type="text"
                  value={getFieldVal('city')}
                  onChange={e => handleRoboFieldChange('city', e.target.value, 'address')}
                  placeholder="Kota Yogyakarta"
                  className="w-full px-3 py-2 text-xs bg-surface-sunken/60 border border-border-default rounded-md text-content-primary placeholder:text-content-disabled focus:bg-surface-elevated focus:ring-2 focus:ring-border-focus focus:outline-none transition-colors-fast"
                />
              </div>

              {/* State / Province */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="robo-state" className="text-xs font-semibold text-content-secondary">State / Province</label>
                  {getFieldVal('province') && <Check className="w-3 h-3 text-success" />}
                </div>
                <input
                  id="robo-state"
                  type="text"
                  value={getFieldVal('province')}
                  onChange={e => handleRoboFieldChange('province', e.target.value, 'address')}
                  placeholder="DI Yogyakarta"
                  className="w-full px-3 py-2 text-xs bg-surface-sunken/60 border border-border-default rounded-md text-content-primary placeholder:text-content-disabled focus:bg-surface-elevated focus:ring-2 focus:ring-border-focus focus:outline-none transition-colors-fast"
                />
              </div>

              {/* Country */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="robo-country" className="text-xs font-semibold text-content-secondary">Country (Negara)</label>
                  {getFieldVal('country') && <Check className="w-3 h-3 text-success" />}
                </div>
                <input
                  id="robo-country"
                  type="text"
                  value={getFieldVal('country', 'Indonesia')}
                  onChange={e => handleRoboFieldChange('country', e.target.value, 'address')}
                  placeholder="Indonesia"
                  className="w-full px-3 py-2 text-xs bg-surface-sunken/60 border border-border-default rounded-md text-content-primary placeholder:text-content-disabled focus:bg-surface-elevated focus:ring-2 focus:ring-border-focus focus:outline-none transition-colors-fast"
                />
              </div>

              {/* Zip / Postal Code */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="robo-zipCode" className="text-xs font-semibold text-content-secondary">Zip / Postal Code</label>
                  {getFieldVal('postal_code') && <Check className="w-3 h-3 text-success" />}
                </div>
                <input
                  id="robo-zipCode"
                  type="text"
                  maxLength={10}
                  value={getFieldVal('postal_code')}
                  onChange={e => handleRoboFieldChange('postal_code', e.target.value, 'address')}
                  placeholder="55271"
                  className="w-full px-3 py-2 text-xs font-mono bg-surface-sunken/60 border border-border-default rounded-md text-content-primary placeholder:text-content-disabled focus:bg-surface-elevated focus:ring-2 focus:ring-border-focus focus:outline-none transition-colors-fast tabular-nums"
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
                  <label htmlFor="robo-cellPhone" className="text-xs font-semibold text-content-secondary">Cell Phone (HP / WhatsApp)</label>
                  {getFieldVal('phone') && <Check className="w-3 h-3 text-success" />}
                </div>
                <input
                  id="robo-cellPhone"
                  type="tel"
                  value={getFieldVal('phone')}
                  onChange={e => handleRoboFieldChange('phone', e.target.value, 'contact')}
                  placeholder="081298765432"
                  className="w-full px-3 py-2 text-xs bg-surface-sunken/60 border border-border-default rounded-md text-content-primary placeholder:text-content-disabled focus:bg-surface-elevated focus:ring-2 focus:ring-border-focus focus:outline-none transition-colors-fast tabular-nums"
                />
              </div>

              {/* Home Phone */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="robo-homePhone" className="text-xs font-semibold text-content-secondary">Home Phone (Telepon Rumah)</label>
                  {getFieldVal('home_phone') && <Check className="w-3 h-3 text-success" />}
                </div>
                <input
                  id="robo-homePhone"
                  type="tel"
                  value={getFieldVal('home_phone')}
                  onChange={e => handleRoboFieldChange('home_phone', e.target.value, 'contact')}
                  placeholder="0215551234"
                  className="w-full px-3 py-2 text-xs bg-surface-sunken/60 border border-border-default rounded-md text-content-primary placeholder:text-content-disabled focus:bg-surface-elevated focus:ring-2 focus:ring-border-focus focus:outline-none transition-colors-fast tabular-nums"
                />
              </div>

              {/* Work Telephone */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="robo-workPhone" className="text-xs font-semibold text-content-secondary">Work Telephone (Kantor)</label>
                  {getFieldVal('work_telephone') && <Check className="w-3 h-3 text-success" />}
                </div>
                <input
                  id="robo-workPhone"
                  type="tel"
                  value={getFieldVal('work_telephone')}
                  onChange={e => handleRoboFieldChange('work_telephone', e.target.value, 'contact')}
                  placeholder="0215559876"
                  className="w-full px-3 py-2 text-xs bg-surface-sunken/60 border border-border-default rounded-md text-content-primary placeholder:text-content-disabled focus:bg-surface-elevated focus:ring-2 focus:ring-border-focus focus:outline-none transition-colors-fast tabular-nums"
                />
              </div>

              {/* Fax */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="robo-fax" className="text-xs font-semibold text-content-secondary">Fax</label>
                  {getFieldVal('fax') && <Check className="w-3 h-3 text-success" />}
                </div>
                <input
                  id="robo-fax"
                  type="tel"
                  value={getFieldVal('fax')}
                  onChange={e => handleRoboFieldChange('fax', e.target.value, 'contact')}
                  placeholder="0215559877"
                  className="w-full px-3 py-2 text-xs bg-surface-sunken/60 border border-border-default rounded-md text-content-primary placeholder:text-content-disabled focus:bg-surface-elevated focus:ring-2 focus:ring-border-focus focus:outline-none transition-colors-fast tabular-nums"
                />
              </div>

              {/* Email */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="robo-emailAddress" className="text-xs font-semibold text-content-secondary">Email Address</label>
                  {getFieldVal('email') && <Check className="w-3 h-3 text-success" />}
                </div>
                <input
                  id="robo-emailAddress"
                  type="email"
                  value={getFieldVal('email')}
                  onChange={e => handleRoboFieldChange('email', e.target.value, 'contact')}
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 text-xs bg-surface-sunken/60 border border-border-default rounded-md text-content-primary placeholder:text-content-disabled focus:bg-surface-elevated focus:ring-2 focus:ring-border-focus focus:outline-none transition-colors-fast"
                />
              </div>

              {/* Web Site */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="robo-webSite" className="text-xs font-semibold text-content-secondary">Web Site (URL)</label>
                  {getFieldVal('website') && <Check className="w-3 h-3 text-success" />}
                </div>
                <input
                  id="robo-webSite"
                  type="url"
                  value={getFieldVal('website')}
                  onChange={e => handleRoboFieldChange('website', e.target.value, 'contact')}
                  placeholder="https://govconnect.id"
                  className="w-full px-3 py-2 text-xs bg-surface-sunken/60 border border-border-default rounded-md text-content-primary placeholder:text-content-disabled focus:bg-surface-elevated focus:ring-2 focus:ring-border-focus focus:outline-none transition-colors-fast"
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
                  <label htmlFor="robo-company" className="text-xs font-semibold text-content-secondary">Company (Instansi / Perusahaan)</label>
                  {getFieldVal('organization') && <Check className="w-3 h-3 text-success" />}
                </div>
                <input
                  id="robo-company"
                  type="text"
                  value={getFieldVal('organization')}
                  onChange={e => handleRoboFieldChange('organization', e.target.value, 'career')}
                  placeholder="PT GovConnect Solusi Bangsa"
                  className="w-full px-3 py-2 text-xs bg-surface-sunken/60 border border-border-default rounded-md text-content-primary placeholder:text-content-disabled focus:bg-surface-elevated focus:ring-2 focus:ring-border-focus focus:outline-none transition-colors-fast"
                />
              </div>

              {/* Job Title */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="robo-jobTitle" className="text-xs font-semibold text-content-secondary">Job Title (Profesi / Posisi)</label>
                  {getFieldVal('occupation') && <Check className="w-3 h-3 text-success" />}
                </div>
                <input
                  id="robo-jobTitle"
                  type="text"
                  value={getFieldVal('occupation')}
                  onChange={e => handleRoboFieldChange('occupation', e.target.value, 'career')}
                  placeholder="Full Stack Engineer"
                  className="w-full px-3 py-2 text-xs bg-surface-sunken/60 border border-border-default rounded-md text-content-primary placeholder:text-content-disabled focus:bg-surface-elevated focus:ring-2 focus:ring-border-focus focus:outline-none transition-colors-fast"
                />
              </div>

              {/* Income */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="robo-income" className="text-xs font-semibold text-content-secondary">Income (Penghasilan / Bulan)</label>
                  {getFieldVal('income') && <Check className="w-3 h-3 text-success" />}
                </div>
                <input
                  id="robo-income"
                  type="text"
                  value={getFieldVal('income')}
                  onChange={e => handleRoboFieldChange('income', e.target.value, 'career')}
                  placeholder="15000000"
                  className="w-full px-3 py-2 text-xs bg-surface-sunken/60 border border-border-default rounded-md text-content-primary placeholder:text-content-disabled focus:bg-surface-elevated focus:ring-2 focus:ring-border-focus focus:outline-none transition-colors-fast tabular-nums"
                />
              </div>

              {/* Driver License */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="robo-driverLicense" className="text-xs font-semibold text-content-secondary">Driver License (Nomor SIM)</label>
                  {getFieldVal('driver_license') && <Check className="w-3 h-3 text-success" />}
                </div>
                <input
                  id="robo-driverLicense"
                  type="text"
                  value={getFieldVal('driver_license')}
                  onChange={e => handleRoboFieldChange('driver_license', e.target.value, 'documents')}
                  placeholder="3515-8899-0123"
                  className="w-full px-3 py-2 text-xs font-mono bg-surface-sunken/60 border border-border-default rounded-md text-content-primary placeholder:text-content-disabled focus:bg-surface-elevated focus:ring-2 focus:ring-border-focus focus:outline-none transition-colors-fast tabular-nums"
                />
              </div>

              {/* Comments */}
              <div className="space-y-1 md:col-span-2 lg:col-span-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="robo-notes" className="text-xs font-semibold text-content-secondary">Comments (Catatan RoboForm)</label>
                  {getFieldVal('comments') && <Check className="w-3 h-3 text-success" />}
                </div>
                <textarea
                  id="robo-notes"
                  rows={2}
                  value={getFieldVal('comments')}
                  onChange={e => handleRoboFieldChange('comments', e.target.value, 'documents')}
                  placeholder="Pengisian benchmark formulir standar internasional RoboForm berhasil diuji oleh GovConnect."
                  className="w-full px-3 py-2 text-xs bg-surface-sunken/60 border border-border-default rounded-md text-content-primary placeholder:text-content-disabled focus:bg-surface-elevated focus:ring-2 focus:ring-border-focus focus:outline-none transition-colors-fast"
                />
              </div>
            </div>
          )}

          {/* Quick Info & Profile Link */}
          <div className="mt-6 pt-4 border-t border-border-default flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-content-tertiary">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-brand-600 flex-shrink-0" />
              Semua field disinkronisasikan otomatis dengan ekstensi GovConnect untuk pengisian benchmark global.
            </span>
            <a
              href="/profile"
              className="inline-flex items-center gap-1 font-semibold text-brand-600 hover:text-brand-700 transition-colors-fast"
            >
              <span>Buka Profil Lengkap & Foto Dokumen</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Main Activity Line Chart (Full Width) */}
      <div className="bg-surface-elevated rounded-lg border border-border-default p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-content-primary flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-600" />
              Autofill Activity (7 Hari Terakhir)
            </h2>
            <p className="text-xs text-content-tertiary mt-0.5">Frekuensi penggunaan autofill per hari</p>
          </div>
          <span className="text-xs font-semibold text-brand-600 bg-accent-light px-2.5 py-1 rounded-md border border-brand-500/30">
            Real-time
          </span>
        </div>

        <div className="h-64 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={analytics?.daily_trend || []}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e8ecf2" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: '#6b7a90', fontSize: 12 }}
                axisLine={{ stroke: '#d1d9e6' }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: '#6b7a90', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #d1d9e6',
                  borderRadius: '6px',
                  boxShadow: '0 1px 3px 0 rgb(12 18 34 / 0.06)',
                  fontSize: '12px'
                }}
                formatter={(value: any) => [`${value} kali`, 'Autofill']}
              />
              <Line
                type="monotone"
                dataKey="autofill"
                stroke="#1e40af"
                strokeWidth={2.5}
                dot={{ fill: '#1e40af', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, strokeWidth: 2, fill: '#1e3a8a' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Three Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Results Donut Chart */}
        <div className="bg-surface-elevated rounded-lg border border-border-default p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-content-primary flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              Autofill Results
            </h2>
            <p className="text-xs text-content-tertiary mt-0.5">Rasio keberhasilan autofill</p>
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
                      backgroundColor: '#ffffff',
                      border: '1px solid #d1d9e6',
                      borderRadius: '6px',
                      fontSize: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-6">
                <Inbox className="w-8 h-8 text-content-disabled mx-auto mb-2" />
                <p className="text-xs text-content-tertiary">Belum ada data eksekusi</p>
              </div>
            )}
          </div>

          <div className="flex justify-center gap-4 pt-2 border-t border-border-default text-xs font-medium">
            {resultsData.map((item, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-content-secondary">{item.name}:</span>
                <span className="font-semibold text-content-primary tabular-nums">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Most Used Fields Horizontal Bar */}
        <div className="bg-surface-elevated rounded-lg border border-border-default p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-content-primary flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-content-secondary" />
              Most Used Fields
            </h2>
            <p className="text-xs text-content-tertiary mt-0.5">Field identitas yang paling sering diisi</p>
          </div>

          <div className="h-48 my-2 flex items-center justify-center">
            {analytics?.most_used_fields && analytics.most_used_fields.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={analytics.most_used_fields}
                  margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e8ecf2" />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#4a5568', fontSize: 11 }}
                    width={85}
                  />
                  <Tooltip
                    cursor={{ fill: '#f4f6f9' }}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #d1d9e6',
                      borderRadius: '6px',
                      fontSize: '12px'
                    }}
                    formatter={(val: any) => [`${val} kali`, 'Digunakan']}
                  />
                  <Bar dataKey="count" fill="#1e3a8a" radius={[0, 4, 4, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-6">
                <Inbox className="w-8 h-8 text-content-disabled mx-auto mb-2" />
                <p className="text-xs text-content-tertiary">Belum ada field terisi</p>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-border-default text-center">
            <span className="text-[11px] text-content-tertiary">Otomatis dihitung dari log autofill ekstensi</span>
          </div>
        </div>

        {/* Autofill by Website Horizontal Bar */}
        <div className="bg-surface-elevated rounded-lg border border-border-default p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-content-primary flex items-center gap-2">
              <Globe className="w-4 h-4 text-content-secondary" />
              Autofill by Website
            </h2>
            <p className="text-xs text-content-tertiary mt-0.5">Domain layanan yang paling sering diakses</p>
          </div>

          <div className="h-48 my-2 flex items-center justify-center">
            {analytics?.by_website && analytics.by_website.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={analytics.by_website}
                  margin={{ top: 5, right: 20, left: 30, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e8ecf2" />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#4a5568', fontSize: 11 }}
                    width={100}
                  />
                  <Tooltip
                    cursor={{ fill: '#f4f6f9' }}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #d1d9e6',
                      borderRadius: '6px',
                      fontSize: '12px'
                    }}
                    formatter={(val: any) => [`${val} kali`, 'Autofill']}
                  />
                  <Bar dataKey="count" fill="#1e40af" radius={[0, 4, 4, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-6">
                <Inbox className="w-8 h-8 text-content-disabled mx-auto mb-2" />
                <p className="text-xs text-content-tertiary">Belum ada data domain website</p>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-border-default text-center">
            <span className="text-[11px] text-content-tertiary">Domain publik yang dikenali ekstensi</span>
          </div>
        </div>
      </div>

      {/* Recent Activity Real Table */}
      <div className="bg-surface-elevated rounded-lg border border-border-default overflow-hidden">
        <div className="p-5 border-b border-border-default flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-content-tertiary" />
            <h2 className="text-base font-bold text-content-primary">Recent Activity</h2>
          </div>
          <span className="text-xs text-content-tertiary">5 aktivitas terbaru</span>
        </div>

        <div className="overflow-x-auto">
          {analytics?.recent_activities && analytics.recent_activities.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-sunken/75 border-b border-border-default">
                  <th className="py-3 px-6 text-xs font-semibold text-content-tertiary uppercase tracking-wider">Tanggal</th>
                  <th className="py-3 px-6 text-xs font-semibold text-content-tertiary uppercase tracking-wider">Website Target</th>
                  <th className="py-3 px-6 text-xs font-semibold text-content-tertiary uppercase tracking-wider">Field Terisi</th>
                  <th className="py-3 px-6 text-xs font-semibold text-content-tertiary uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default text-sm">
                {analytics.recent_activities.map((activity) => (
                  <tr key={activity.id} className="hover:bg-surface-sunken/50 transition-colors-fast">
                    <td className="py-3.5 px-6 text-content-secondary text-xs tabular-nums">
                      {new Date(activity.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="py-3.5 px-6 font-semibold text-content-primary">
                      <div className="flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5 text-content-disabled" />
                        <span>{activity.website_domain || new URL(activity.target_url).hostname}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-6 text-content-secondary text-xs tabular-nums">
                      <span className="font-semibold text-content-primary">{activity.fields_filled}</span> dari {activity.fields_detected} field
                    </td>
                    <td className="py-3.5 px-6">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${activity.status === 'success'
                            ? 'bg-green-50 text-success border border-success/20'
                            : activity.status === 'partial'
                              ? 'bg-yellow-50 text-warning border border-warning/20'
                              : 'bg-red-50 text-error border border-error/20'
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
              <Inbox className="w-10 h-10 text-content-disabled mx-auto mb-3" />
              <p className="text-sm font-semibold text-content-primary">Belum ada riwayat aktivitas autofill</p>
              <p className="text-xs text-content-tertiary mt-1 max-w-sm mx-auto">
                Gunakan Chrome Extension di formulir pendaftaran untuk melihat riwayat aktivitas di sini.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}