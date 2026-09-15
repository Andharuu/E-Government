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
  created_at: string;
  updated_at: string;
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
};

export const profileApi = {
  get: () => api.get<Profile>('/profile/me'),
  update: (data: Partial<Profile>) => api.put<Profile>('/profile/me', data),
};

export const activityApi = {
  get: (limit = 10) => api.get<Activity[]>(`/activities?limit=${limit}`),
  getStats: () => api.get<ActivityStats>('/activities/stats'),
  log: (data: Omit<Activity, 'id' | 'user_id' | 'created_at'>) =>
    api.post<Activity>('/activities', data),
};