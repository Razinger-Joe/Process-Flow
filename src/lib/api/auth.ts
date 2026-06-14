import { supabase } from '../supabase';

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
 * Register a new user account using Supabase Auth
 */
export async function register(email: string, password: string, fullName?: string): Promise<User> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName || null,
      },
    },
  });

  if (error) {
    throw error;
  }

  if (!data.user) {
    throw new Error('Registration failed: no user returned.');
  }

  return {
    id: data.user.id,
    email: data.user.email || '',
    full_name: data.user.user_metadata?.full_name || null,
    created_at: data.user.created_at,
    is_active: true,
  };
}

/**
 * Login using Supabase Auth and write the session token to the auth_token cookie
 */
export async function login(email: string, password: string): Promise<Token> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  const session = data.session;
  if (!session) {
    throw new Error('Login failed: no session returned.');
  }

  const access_token = session.access_token;

  if (typeof window !== 'undefined') {
    // Save to localStorage for client headers (fallback)
    localStorage.setItem('auth_token', access_token);

    // Save to cookies for middleware route protection
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `auth_token=${access_token}; path=/; max-age=604800; SameSite=Lax${secure}`; // 7 days
  }

  return {
    access_token,
    token_type: 'bearer',
  };
}

/**
 * Log out and clear all credentials
 */
export async function logout(): Promise<void> {
  await supabase.auth.signOut();
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    window.location.href = '/login';
  }
}

/**
 * Fetch the current logged-in user profile from Supabase session
 */
export async function getMe(): Promise<User> {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw error || new Error('Not authenticated');
  }

  return {
    id: user.id,
    email: user.email || '',
    full_name: user.user_metadata?.full_name || null,
    created_at: user.created_at,
    is_active: true,
  };
}
