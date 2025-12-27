/**
 * File Upload Service
 * 
 * Service for uploading files to the backend storage (S3).
 * Used for agent documents, profile images, etc.
 */

import axios from 'axios';
import { API_CONFIG } from '@/components/backend/config';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const frontendKey = API_CONFIG.HEADERS['x-auth-app'] as string | undefined;
    if (frontendKey) {
      if (!config.headers) config.headers = {} as any;
      (config.headers as any)['x-auth-app'] = frontendKey;
    }

    // Use adminAuthToken for admin dashboard authentication
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminAuthToken') : null;
    if (token) {
      if (!config.headers) config.headers = {} as any;
      (config.headers as any).Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export interface UploadResponse {
  url: string;
  filename: string;
}

/**
 * Upload a file to the server
 * For now, we'll use a direct upload approach
 * In production, you might want to use presigned URLs
 */
export class UploadService {
  /**
   * Upload a file and return the URL
   * This uploads to a generic upload endpoint
   */
  static async uploadFile(
    file: File,
    folder: string = 'documents'
  ): Promise<UploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      const response = await apiClient.post('/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data as UploadResponse;
    } catch (error: any) {
      const message = error.response?.data?.error || 
                      error.response?.data?.message || 
                      'Failed to upload file';
      throw new Error(message);
    }
  }

  /**
   * Convert a file to base64 data URL
   * Useful for preview before upload
   */
  static fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Validate file type
   */
  static isValidFileType(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.includes(file.type);
  }

  /**
   * Validate file size (in bytes)
   */
  static isValidFileSize(file: File, maxSizeBytes: number): boolean {
    return file.size <= maxSizeBytes;
  }

  /**
   * Get file extension from filename
   */
  static getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
