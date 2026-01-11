import axios, { type AxiosInstance, type AxiosError } from 'axios';

/**
 * API error type
 */
export interface ApiError {
  type: 'api_error' | 'network_error' | 'unknown_error';
  message: string;
  status?: number;
  details?: unknown;
}

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

/**
 * Centralized API client with interceptors
 */
class ApiClient {
  private client: AxiosInstance;

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor: add auth token
    this.client.interceptors.request.use(async (config) => {
      // TODO: Add auth token from storage
      // const token = await storage.getAuthToken();
      // if (token) {
      //   config.headers.Authorization = `Bearer ${token}`;
      // }
      return config;
    });

    // Response interceptor: normalize errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        return Promise.reject(this.normalizeError(error));
      }
    );
  }

  private normalizeError(error: AxiosError): ApiError {
    if (error.response) {
      // Server responded with error
      const data = error.response.data as Record<string, unknown>;
      return {
        type: 'api_error',
        status: error.response.status,
        message: (typeof data?.message === 'string' ? data.message : undefined) ?? 'Request failed',
        details: error.response.data,
      };
    } else if (error.request) {
      // Network error
      return {
        type: 'network_error',
        message: 'No response from server. Check your connection.',
      };
    } else {
      // Request setup error
      return {
        type: 'unknown_error',
        message: error.message,
      };
    }
  }

  async get<T>(url: string): Promise<T> {
    const response = await this.client.get<ApiResponse<T>>(url);
    return response.data.data;
  }

  async post<T>(url: string, data?: unknown): Promise<T> {
    const response = await this.client.post<ApiResponse<T>>(url, data);
    return response.data.data;
  }

  async put<T>(url: string, data?: unknown): Promise<T> {
    const response = await this.client.post<ApiResponse<T>>(url, data);
    return response.data.data;
  }

  async delete<T>(url: string): Promise<T> {
    const response = await this.client.delete<ApiResponse<T>>(url);
    return response.data.data;
  }
}

// Export singleton instance
// TODO: Get base URL from environment config
export const apiClient = new ApiClient(
  process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api'
);
