import { createClient } from '@supabase/supabase-js';

// Helper to safely access environment variables in various environments
const getEnvVar = (key: string) => {
  // Check import.meta.env (Vite standard)
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    return (import.meta as any).env[key];
  }
  // Check process.env (Node/Webpack/Polyfill)
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  // Fallback for direct browser access if injected in window
  if (typeof window !== 'undefined' && (window as any).env) {
    return (window as any).env[key];
  }
  return undefined;
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
}

// Initialize with fallbacks to prevent application crash during rendering if keys are missing.
// Auth calls will fail, but the UI will load.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);