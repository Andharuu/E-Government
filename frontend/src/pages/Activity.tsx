import { useEffect, useState } from 'react';
import { activityApi, Activity } from '../services/api';
import { Loader2, Calendar, Globe, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

const statusConfig = {
  success: { label: 'Success', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  partial: { label: 'Partial', color: 'bg-amber-100 text-amber-700', icon: AlertTriangle },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-700', icon: XCircle },
};

export function ActivityPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    activityApi.get(50)
      .then(res => setActivities(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Activity</h1>
        <p className="text-slate-500 mt-1">Riwayat penggunaan autofill</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {activities.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Belum ada aktivitas autofill</p>
            <p className="text-slate-400 text-sm mt-1">Gunakan extension di website layanan publik untuk mencatat aktivitas</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Website</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Fields</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {activities.map(activity => {
                  const config = statusConfig[activity.status] || statusConfig.success;
                  const Icon = config.icon;
                  return (
                    <tr key={activity.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-slate-400" />
                          <span className="text-sm font-medium text-slate-900 truncate max-w-xs">
                            {activity.website_domain || new URL(activity.target_url).hostname}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {new Date(activity.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {activity.fields_filled}/{activity.fields_detected}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
                          <Icon className="w-3 h-3" />
                          {config.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}