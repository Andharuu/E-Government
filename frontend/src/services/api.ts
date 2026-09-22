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
  created_at: string;
}

export interface Profile {
  id: number;
  user_id: number;
  nik: string | null;
  full_name: string | null;
  birth_place: string | null;
  birth_date: string | null;
  gender: string | null;
  address: string | null;
  province: string | null;
  city: string | null;
  district: string | null;
  village: string | null;
  postal_code: string | null;
  phone: string | null;
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
    api.post<User>('/auth/register', { email, password }),
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
    api.post<Activity>('/activities', data),
  delete: (id: number) => api.delete<void>(`/activities/${id}`),
  clearAll: () => api.delete<{ detail: string }>('/activities'),
};

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