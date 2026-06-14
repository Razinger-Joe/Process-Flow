import { createClient } from '@supabase/supabase-js';

const cleanEnvVar = (val: string | undefined) => {
  if (!val) return '';
  let clean = val.trim();
  if (clean.startsWith('"') && clean.endsWith('"')) {
    clean = clean.substring(1, clean.length - 1);
  }
  if (clean.startsWith("'") && clean.endsWith("'")) {
    clean = clean.substring(1, clean.length - 1);
  }
  return clean.trim();
};

const supabaseUrl = cleanEnvVar(process.env.NEXT_PUBLIC_SUPABASE_URL);
const supabaseAnonKey = cleanEnvVar(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Warning: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables are not set.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

export const isEnvValid = () => {
  const url = supabaseUrl;
  const key = supabaseAnonKey;
  return (
    url.startsWith('https://') &&
    (key.startsWith('sb_') || key.startsWith('eyJ'))
  );
};

export const getMaskedEnv = () => {
  const url = supabaseUrl;
  const key = supabaseAnonKey;
  
  const maskString = (str: string, visibleLen = 6) => {
    if (!str || str.length <= visibleLen * 2) return str;
    return str.substring(0, visibleLen) + '...' + str.substring(str.length - visibleLen);
  };
  
  return {
    url: url ? maskString(url, 12) : 'missing/empty',
    key: key ? maskString(key, 8) : 'missing/empty',
  };
};
