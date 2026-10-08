import axios, { AxiosError, type AxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';
import type { ApiResponse } from '@agronavis/shared-types';
import { Env } from '@/constants/env';
import { supabase } from '@/utils/supabase';

/**
 * The only way this app reaches data. Supabase is used for authentication
 * alone; every read and write goes through the Agronavis API, which holds the
 * service-role key and the third-party API keys.
 */
const client = axios.create({
  baseURL: Env.apiUrl,
  timeout: Env.apiTimeout,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

client.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly code?: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function toApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ error?: string; code?: string; details?: unknown }>;
    if (axiosError.response) {
      const body = axiosError.response.data;
      return new ApiError(
        body?.error ?? 'Something went wrong',
        axiosError.response.status,
        body?.code,
        body?.details,
      );
    }
    if (axiosError.code === 'ECONNABORTED') {
      return new ApiError('The request timed out. Check your connection and try again.');
    }
    return new ApiError('No connection. Your changes will sync when you are back online.');
  }
  return new ApiError(error instanceof Error ? error.message : 'Something went wrong');
}

async function request<T>(config: AxiosRequestConfig): Promise<T> {
  try {
    const response = await client.request<ApiResponse<T>>(config);
    const body = response.data;
    if (body && typeof body === 'object' && 'success' in body && !body.success) {
      throw new ApiError(body.error, response.status, body.code, body.details);
    }
    return (body as { data: T }).data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw toApiError(error);
  }
}

/** Same as `request`, but also returns the envelope's `meta` block. */
async function requestWithMeta<T>(
  config: AxiosRequestConfig,
): Promise<{ data: T; meta?: { count?: number; cached?: boolean } }> {
  try {
    const response = await client.request<ApiResponse<T>>(config);
    const body = response.data;
    if (body && typeof body === 'object' && 'success' in body && !body.success) {
      throw new ApiError(body.error, response.status, body.code, body.details);
    }
    const success = body as { data: T; meta?: { count?: number; cached?: boolean } };
    return { data: success.data, meta: success.meta };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw toApiError(error);
  }
}

export const api = {
  get: <T>(url: string, params?: Record<string, unknown>) => request<T>({ method: 'GET', url, params }),
  getWithMeta: <T>(url: string, params?: Record<string, unknown>) =>
    requestWithMeta<T>({ method: 'GET', url, params }),
  post: <T>(url: string, data?: unknown) => request<T>({ method: 'POST', url, data }),
  patch: <T>(url: string, data?: unknown) => request<T>({ method: 'PATCH', url, data }),
  put: <T>(url: string, data?: unknown) => request<T>({ method: 'PUT', url, data }),
  delete: <T = void>(url: string, data?: unknown) => request<T>({ method: 'DELETE', url, data }),

  /**
   * Multipart upload. `uri` is a local file path from the picker or camera.
   * `field` names the form part — storage expects "file", the scanner "image".
   *
   * The two platforms need different parts. React Native accepts a `{ uri }`
   * descriptor and streams the file itself; a browser would stringify that to
   * "[object Object]" and send a text field, so there the uri — `blob:` or
   * `data:` — is read into a real Blob first.
   */
  upload: async <T>(url: string, uri: string, name: string, type: string, field = 'file') => {
    const form = new FormData();
    if (Platform.OS === 'web') {
      const blob = await (await fetch(uri)).blob();
      form.append(field, blob, name);
    } else {
      form.append(field, { uri, name, type } as unknown as Blob);
    }
    return request<T>({
      method: 'POST',
      url,
      data: form,
      // On the web the header is cleared so the browser writes the boundary
      // itself. It has to be cleared explicitly: left alone, this client's
      // default `application/json` survives and axios quietly serialises the
      // form to JSON, which drops the file.
      headers: Platform.OS === 'web' ? { 'Content-Type': null } : { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export default client;
