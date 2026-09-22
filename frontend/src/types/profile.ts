export type CustomFieldType = 'text' | 'image' | 'date' | 'textarea';

export interface CustomFieldItem {
  id: string;
  category: string;
  key: string;
  label: string;
  value: string;
  type?: CustomFieldType;
  photoData?: string;
  photoName?: string;
  photoSize?: number;
}

export interface UserCategory {
  id: string;
  title: string;
  description: string;
  icon?: string;
}

export interface DocumentPhoto {
  name: string;
  type: string;
  data: string; // Base64 data URL
  size: number;
  uploadedAt?: string;
}

export type DocumentPhotosMap = Record<string, DocumentPhoto>;
