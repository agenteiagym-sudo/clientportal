export interface UserProfile {
  id: string;
  full_name: string;
  cedula: string;
  phone?: string;
  email: string;
  role: string;
  plan_name?: string;
  plan_details?: string;
  plan_price?: number;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
}

export interface ProgressData {
  id: string;
  user_id: string;
  date: string;
  weight: number;
  muscle_mass?: number;
  fat_percentage?: number;
  notes?: string;
  created_at: string;
}

export interface WeeklyMenu {
  id: string;
  user_id: string;
  content: string;
  is_approved: boolean;
  created_at: string;
}

export interface Appointment {
  id: string;
  user_id: string;
  title: string;
  date: string;
  time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

export interface Exam {
  id: string;
  user_id: string;
  file_url?: string;
  file_name: string;
  digitized_data?: string; // JSON string
  created_at: string;
}

export interface TrainingLog {
  id: string;
  user_id: string;
  date: string;
  exercise_name: string;
  sets: number;
  reps: number;
  weight_kg: number;
  notes?: string;
  created_at: string;
}

export interface StripeInvoice {
  id: string;
  customer: string;
  amount_due: number;
  amount_paid: number;
  status: string;
  created: string;
  invoice_pdf?: string;
  attrs: any;
}

export interface StripeSubscription {
  id: string;
  customer: string;
  status: string;
  current_period_end: string;
  attrs: any;
}

export interface PaymentProof {
  id: string;
  user_id: string;
  file_url: string;
  file_name: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  created_at: string;
}
