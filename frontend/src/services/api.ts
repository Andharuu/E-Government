import axios from 'axios';

const API_BASE = 'http://127.0.0.1:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('govconnect_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      localStorage.removeItem('govconnect_token');
      localStorage.removeItem('govconnect_email');
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export interface User {
  id: number;
  email: string;
  is_active: boolean;
  is_admin?: boolean;
  created_at: string;
}

export type ReportType = 'layanan' | 'keamanan';
export type SecurityKind = 'kebocoran_data' | 'bug' | 'privasi' | 'akses_tidak_sah' | 'lainnya';
export type SecuritySource = 'ekstensi' | 'web';
export type SecuritySeverity = 'rendah' | 'sedang' | 'tinggi' | 'kritis';

export interface Complaint {
  id: number;
  reference_number: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  report_type?: ReportType;
  security_kind?: SecurityKind | null;
  security_source?: SecuritySource | null;
  affected_url?: string | null;
  severity?: SecuritySeverity | null;
  status: string;
  resolution?: string;
  user_email?: string; // For admin view
  assigned_admin_email?: string | null;
  age_days?: number;
  created_at: string;
  updated_at: string;
}

export interface AdminStats {
  total_users: number;
  active_users: number;
  new_users_7d: number;
  total_complaints: number;
  open_complaints: number;
  in_progress_complaints: number;
  resolved_complaints: number;
  rejected_complaints: number;
  sla_breached: number;
  avg_response_hours: number;
  unread_notifications: number;
  pii_views_today: number;
  audit_logs_today: number;
  encryption_coverage: number;
  security_reports_total: number;
  security_reports_open: number;
  security_reports_open_high: number;
  complaints_by_type: Record<string, number>;
  complaints_by_status: Record<string, number>;
  complaints_by_category: Record<string, number>;
  complaints_by_priority: Record<string, number>;
  complaints_trend: { date: string; count: number }[];
  admin_workload: { admin_email: string; handled_count: number }[];
  recent_activities: any[];
}

export interface AdminComplaintListParams {
  page?: number;
  page_size?: number;
  status?: string;
  category?: string;
  priority?: string;
  report_type?: ReportType;
  search?: string;
  sort?: 'newest' | 'oldest' | 'priority' | 'age';
}

export interface AdminComplaintListResponse {
  total: number;
  items: Complaint[];
  page: number;
  page_size: number;
  counts_by_status: Record<string, number>;
  counts_by_type: Record<string, number>;
}

export interface AdminUserItem {
  id: number;
  email: string;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
  complaint_count: number;
  profile_completion: number;
}

export interface AuditLog {
  id: number;
  admin_id: number;
  admin_email: string;
  action: string;
  resource_type: string;
  resource_id?: number;
  detail?: string;
  ip_address?: string;
  was_pii_exposed: boolean;
  created_at: string;
}

// ... existing code ...

export const adminApi = {
  getStats: () => api.get<AdminStats>('/admin/stats'),
  getComplaints: (params?: AdminComplaintListParams) =>
    api.get<AdminComplaintListResponse>('/admin/complaints', { params }),
  getComplaint: (id: number) => api.get<Complaint>(`/admin/complaints/${id}`),
  updateComplaintStatus: (id: number, data: { status: string; resolution?: string }) =>
    api.put<Complaint>(`/admin/complaints/${id}/status`, data),
  getUsers: () => api.get<AdminUserItem[]>('/admin/users'),
  toggleUserActive: (id: number) => api.post<{ detail: string }>(`/admin/users/${id}/toggle-active`),
  getAuditLogs: (params?: { action?: string; limit?: number; offset?: number }) =>
    api.get<AuditLog[]>('/admin/audit-logs', { params }),
  broadcastAnnouncement: (data: { title: string; desc?: string; type?: string }) =>
    api.post<{ detail: string }>('/admin/announcements', data),
  exportComplaintsCsv: (params?: { status?: string; category?: string; report_type?: ReportType }) =>
    api.get('/admin/export/complaints.csv', { params, responseType: 'blob' }),
};

export const complaintsApi = {
  create: (data: {
    title: string; description: string; category: string; priority?: string;
    report_type?: ReportType;
    security_kind?: SecurityKind; security_source?: SecuritySource;
    affected_url?: string; severity?: SecuritySeverity;
  }) => api.post<Complaint>('/complaints', data),
  list: () => api.get<Complaint[]>('/complaints'),
  get: (id: number) => api.get<Complaint>(`/complaints/${id}`),
};

export interface Profile {
  id: number;
  user_id: number;
  nik: string | null;
  full_name: string | null;
  birth_place: string | null;
  birth_date: string | null;
  birth_day?: string | null;
  birth_month?: string | null;
  birth_year?: string | null;
  age?: string | null;
  gender: string | null;
  address: string | null;
  province: string | null;
  city: string | null;
  district: string | null;
  village: string | null;
  postal_code: string | null;
  phone: string | null;
  home_phone?: string | null;
  work_telephone?: string | null;
  fax?: string | null;
  email: string | null;
  nisn: string | null;
  institution: string | null;
  education_level: string | null;
  student_id: string | null;
  occupation: string | null;
  organization: string | null;
  work_address?: string | null;
  religion?: string | null;
  marital_status?: string | null;
  blood_type?: string | null;
  mother_name?: string | null;
  father_name?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  npwp?: string | null;
  bpjs_number?: string | null;
  custom_fields?: string | null;
  document_photos?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  country?: string | null;
  driver_license?: string | null;
  website?: string | null;
  income?: string | null;
  created_at: string;
  updated_at: string;
  [key: string]: any;
}

export interface Activity {
  id: number;
  user_id: number;
  target_url: string;
  website_domain: string | null;
  action: string;
  fields_detected: number;
  fields_filled: number;
  status: 'success' | 'partial' | 'failed';
  filled_fields_summary?: string | null;
  created_at: string;
}

export interface ActivityStats {
  total_autofill: number;
  success_count: number;
  partial_count: number;
  failed_count: number;
  success_rate: number;
  estimated_time_saved_seconds: number;
  profile_completion: number;
}

export interface DailyActivityItem {
  date: string;
  autofill: number;
}

export interface WebsiteCountItem {
  name: string;
  count: number;
}

export interface FieldCountItem {
  name: string;
  count: number;
}

export interface ActivityAnalytics extends ActivityStats {
  daily_trend: DailyActivityItem[];
  by_website: WebsiteCountItem[];
  most_used_fields: FieldCountItem[];
  recent_activities: Activity[];
}

export interface Mapping {
  id: number;
  user_id: number;
  website_domain: string;
  website_field: string;
  govconnect_field: string;
  selector_query: string;
  created_at: string;
  updated_at: string;
}

export interface ActivityFilterParams {
  limit?: number;
  offset?: number;
  status?: string;
  domain?: string;
}

export const authApi = {
  register: (email: string, password: string) =>
    api.post<{ detail: string }>('/auth/register', { email, password }),
  login: (email: string, password: string) => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);
    return api.post<{ access_token: string; token_type: string }>('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  },
  me: () => api.get<User>('/auth/me'),
  changePassword: (old_password: string, new_password: string) =>
    api.post<{ detail: string }>('/auth/change-password', { old_password, new_password }),
};

export const profileApi = {
  get: () => api.get<Profile>('/profile/me'),
  update: (data: Partial<Profile>) => api.put<Profile>('/profile/me', data),
  patch: (data: Partial<Profile>) => api.patch<Profile>('/profile/me', data),
};

export const activityApi = {
  get: (params: ActivityFilterParams | number = 10) => {
    if (typeof params === 'number') {
      return api.get<Activity[]>(`/activities?limit=${params}`);
    }
    const query = new URLSearchParams();
    if (params.limit !== undefined) query.set('limit', String(params.limit));
    if (params.offset !== undefined) query.set('offset', String(params.offset));
    if (params.status) query.set('status', params.status);
    if (params.domain) query.set('domain', params.domain);
    const qs = query.toString();
    return api.get<Activity[]>(`/activities${qs ? `?${qs}` : ''}`);
  },
  getStats: () => api.get<ActivityStats>('/activities/stats'),
  getAnalytics: (days = 7) => api.get<ActivityAnalytics>(`/activities/analytics?days=${days}`),
  log: (data: Omit<Activity, 'id' | 'user_id' | 'created_at'>) =>
    api.post<{ detail: string }>('/activities', data),
  delete: (id: number) => api.delete<void>(`/activities/${id}`),
  clearAll: () => api.delete<{ detail: string }>('/activities'),
};

export interface NotificationItem {
  id: number;
  user_id: number;
  title: string;
  desc: string | null;
  type: 'success' | 'info' | 'warning' | 'system';
  read: boolean;
  source: string | null;
  ref_id: number | null;
  created_at: string;
}

export interface NotificationUnreadCount {
  count: number;
}

export const mappingApi = {
  get: (domain?: string) =>
    api.get<Mapping[]>(domain ? `/mappings?domain=${encodeURIComponent(domain)}` : '/mappings'),
  createOrUpsert: (data: {
    website_domain: string;
    website_field: string;
    govconnect_field: string;
    selector_query: string;
  }) => api.post<Mapping>('/mappings', data),
  bulkCreate: (mappings: Array<{
    website_domain: string;
    website_field: string;
    govconnect_field: string;
    selector_query: string;
  }>) => api.post<Mapping[]>('/mappings/bulk', { mappings }),
  delete: (id: number) => api.delete<void>(`/mappings/${id}`),
};

export const notificationApi = {
  get: (params?: { limit?: number; unread_only?: boolean; since_id?: number }) =>
    api.get<NotificationItem[]>(`/notifications${params ? `?${new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])
    ).toString()}` : ''}`),
  getUnreadCount: () => api.get<NotificationUnreadCount>('/notifications/unread-count'),
  create: (data: { title: string; desc?: string; type?: string; source?: string; ref_id?: number }) =>
    api.post<NotificationItem>('/notifications', data),
  markRead: (id: number) => api.post<NotificationItem>(`/notifications/${id}/read`),
  markAllRead: () => api.post<{ detail: string }>('/notifications/read-all'),
  delete: (id: number) => api.delete<void>(`/notifications/${id}`),
  clearAll: () => api.delete<{ detail: string }>('/notifications'),
  /**
   * Membuka SSE stream untuk notifikasi realtime.
   *
   * Access token penuh TIDAK ditempel di URL (bocor ke log/riwayat/Referer).
   * Hook ini mula-mula menukar access token menjadi stream-token berumur pendek
   * (2 menit, scope 'sse') via POST, lalu membuka EventSource memakai token itu.
   *
   * @returns cleanup function untuk menutup EventSource/abort
   */
  stream: (
    onMessage: (notif: NotificationItem) => void,
    onReady?: (data: { last_id: number }) => void,
    onError?: (err: Event) => void
  ) => {
    const controller = new AbortController();
    let es: EventSource | null = null;

    (async () => {
      try {
        const res = await api.post<{ stream_token: string; expires_in: number }>(
          '/notifications/stream-token'
        );
        const stream_token = res.data.stream_token;
        if (controller.signal.aborted) return;
        es = new EventSource(
          `${API_BASE.replace('/api/v1', '')}/api/v1/notifications/stream?token=${encodeURIComponent(stream_token)}`
        );
        es.addEventListener('ready', (e) => {
          try { onReady?.(JSON.parse((e as MessageEvent).data)); } catch { /* noop */ }
        });
        es.addEventListener('notification', (e) => {
          try { onMessage(JSON.parse((e as MessageEvent).data)); } catch { /* noop */ }
        });
        es.addEventListener('error', (e) => {
          onError?.(e);
        });
      } catch (e) {
        onError?.(e as Event);
      }
    })();

    return () => {
      controller.abort();
      es?.close();
    };
  },
};

export interface PublicServiceCategory {
  id: string;
  label: string;
  icon: string;
  color: string;
  count: number;
}

export interface PublicServiceAgenda {
  id: number;
  title: string;
  agency: string;
  agency_url: string;
  logo_url: string;
  category: string;
  deadline: string;
  description: string;
  importance: 'tinggi' | 'sedang' | 'biasa';
  url: string;
}

export interface PublicServicesResponse {
  categories: PublicServiceCategory[];
  agendas: PublicServiceAgenda[];
}

export const publicServicesApi = {
  get: () => api.get<PublicServicesResponse>('/public-services'),
  getByCategory: (category: string) =>
    api.get<PublicServiceAgenda[]>(`/public-services/category/${category}`),
};