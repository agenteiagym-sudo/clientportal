import { createClient } from '@supabase/supabase-js';
import { Exam as MedicalExam, WeeklyMenu, ProgressData as PhysicalProgress } from '../types';

export type { MedicalExam, WeeklyMenu, PhysicalProgress };

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || supabaseUrl === 'undefined') {
  console.error('CRITICAL: VITE_SUPABASE_URL is missing or invalid. Check your environment variables.');
}
if (!supabaseAnonKey || supabaseAnonKey === 'undefined') {
  console.error('CRITICAL: VITE_SUPABASE_ANON_KEY is missing or invalid. Check your environment variables.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder'
);
