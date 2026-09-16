import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { activityApi, type ActivityAnalytics } from '../services/api';
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
  Inbox
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

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

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
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          activity.status === 'success'
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