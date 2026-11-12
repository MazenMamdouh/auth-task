import axios, { AxiosError } from 'axios';
import type { SignInValues, SignUpValues } from './validation';

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

interface ApiErrorBody {
  statusCode: number;
  message: string | string[];
}

/**
 * Same-origin API (/api, proxied by Vite in development and nginx in production), so the
 * httpOnly session cookie is sent automatically and no token is ever handled in JavaScript.
 */
export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  withCredentials: true,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

export const authApi = {
  signUp: (values: SignUpValues) => http.post<User>('/auth/signup', values).then((r) => r.data),
  signIn: (values: SignInValues) => http.post<User>('/auth/signin', values).then((r) => r.data),
  logout: () => http.post<void>('/auth/logout').then(() => undefined),
  me: () => http.get<User>('/users/me').then((r) => r.data),
};

/** A message a person can act on, whatever went wrong. */
export function errorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    if (!error.response) return 'Cannot reach the server. Check your connection and try again.';
    if (error.response.status === 429) return 'Too many attempts. Please wait a minute and try again.';
    const body = error.response.data as Partial<ApiErrorBody> | undefined;
    if (body?.message) return Array.isArray(body.message) ? body.message.join('. ') : body.message;
  }
  return 'Something went wrong. Please try again.';
}

export const isUnauthorized = (error: unknown) => error instanceof AxiosError && error.response?.status === 401;
