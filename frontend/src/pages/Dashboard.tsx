import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { activityApi, ActivityStats } from '../services/api';
import {
  LayoutDashboard,
  CheckCircle,
  Clock,
  UserCheck,
  AlertTriangle,
  XCircle,
  TrendingUp,
  TrendingDown,
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
} from 'recharts';

export function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    activityApi.getStats()
      .then(res => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const kpiCards = [
    {
      title: 'Total Autofill',
      value: stats?.total_autofill ?? 0,
      icon: LayoutDashboard,
      color: 'bg-blue-500',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
    },
    {
      title: 'Success Rate',
      value: `${stats?.success_rate ?? 0}%`,
      icon: CheckCircle,
      color: 'bg-green-500',
      bg: 'bg-green-50',
      border: 'border-green-200',
    },
    {
      title: 'Estimated Time Saved',
      value: stats
        ? `${Math.floor(stats.estimated_time_saved_seconds / 60)}m ${stats.estimated_time_saved_seconds % 60}s`
        : '0m 0s',
      icon: Clock,
      color: 'bg-amber-500',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      subLabel: '(Estimated)',
    },
    {
      title: 'Profile Completion',
      value: `${stats?.profile_completion ?? 0}%`,
      icon: UserCheck,
      color: 'bg-purple-500',
      bg: 'bg-purple-50',
      border: 'border-purple-200',
    },
  ];

  // Mock chart data - replace with real API data
  const activityData = [
    { date: 'Sep 9', autofill: 5 },
    { date: 'Sep 10', autofill: 8 },
    { date: 'Sep 11', autofill: 3 },
    { date: 'Sep 12', autofill: 12 },
    { date: 'Sep 13', autofill: 7 },
    { date: 'Sep 14', autofill: 9 },
    { date: 'Sep 15', autofill: 4 },
  ];

  const resultsData = [
    { name: 'Success', value: stats?.success_count ?? 0, color: '#16A34A' },
    { name: 'Partial', value: stats?.partial_count ?? 0, color: '#F59E0B' },
    { name: 'Failed', value: stats?.failed_count ?? 0, color: '#DC2626' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Selamat datang kembali, {user?.email}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card, i) => (
          <div key={i} className={`rounded-xl border p-5 ${card.bg} ${card.border}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">{card.title}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{card.value}</p>
                {card.subLabel && <p className="text-xs text-slate-500 mt-0.5">{card.subLabel}</p>}
              </div>
              <div className={`p-3 rounded-lg ${card.color}`}>
                <card.icon className="w-6 h-6 text-white" aria-hidden="true" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            Autofill Activity (7 hari)
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activityData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#64748B', fontSize: 12 }}
                  axisLine={{ stroke: '#E2E8F0' }}
                />
                <YAxis
                  tick={{ fill: '#64748B', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                  formatter={(value: number) => [value, 'autofill']}
                />
                <Line
                  type="monotone"
                  dataKey="autofill"
                  stroke="#2563EB"
                  strokeWidth={2}
                  dot={{ fill: '#2563EB', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Results Donut Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Autofill Results
          </h2>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={resultsData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {resultsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [value, 'activity']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4 text-sm">
            {resultsData.map((item, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-slate-600">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}