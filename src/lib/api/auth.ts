import { apiClient } from './client';

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  is_active: boolean;
}

export interface Token {
  access_token: string;
  token_type: string;
}

/**
 * Register a new user account
 */
export async function register(email: string, password: string, fullName?: string): Promise<User> {
  const response = await apiClient.post<User>('/auth/register', {
    email,
    password,
    full_name: fullName || null,
  });
  return response.data;
}

/**
 * Login and store JWT token in localStorage and cookies
 */
export async function login(email: string, password: string): Promise<Token> {
  // OAuth2PasswordRequestForm requires form-urlencoded format
  const params = new URLSearchParams();
  params.append('username', email);
  params.append('password', password);

  const response = await apiClient.post<Token>('/auth/login', params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  const { access_token } = response.data;

  if (typeof window !== 'undefined') {
    // Save to localStorage for client headers
    localStorage.setItem('auth_token', access_token);

    // Save to cookies for middleware route protection
    // Sets secure flag if running under HTTPS (or simply standard cookie for local/prod)
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `auth_token=${access_token}; path=/; max-age=604800${secure}`; // 7 days
  }

  return response.data;
}

/**
 * Log out and clear all credentials
 */
export function logout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    window.location.href = '/login';
  }
}

/**
 * Fetch the current logged-in user profile
 */
export async function getMe(): Promise<User> {
  const response = await apiClient.get<User>('/auth/me');
  return response.data;
}
