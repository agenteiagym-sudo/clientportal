export interface UserProfile {
  id: string;
  full_name: string; // Cifrado en el app
  email: string;
  cedula: string; // Cifrado en el app
  phone?: string; // Cifrado en el app
  role: 'admin' | 'client' | 'nutritionist' | 'manager';
  plan_name?: string;
  plan_details?: string; // Cifrado en el app
  plan_price?: string; // Cifrado en el app (antes era number)
  membership_expires_at?: string;
  is_active: boolean;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
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

export interface DailyMenu {
  day: string;
  breakfast: string;
  lunch: string;
  dinner: string;
  snacks?: string;
  preparation?: string;
  image_url?: string;
}

export interface WeeklyMenu {
  id: string;
  user_id: string;
  content: string;
  daily_menus?: DailyMenu[];
  is_approved: boolean;
  banner_url?: string;
  created_at: string;
}

export interface Appointment {
  id: string;
  user_id: string;
  type: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'postponed';
  notes?: string; // Cifrado
  created_at: string;
}

export interface SystemSettings {
  id: string;
  appointment_reasons: string[];
  created_at: string;
}

export interface Exam {
  id: string;
  user_id: string;
  file_url: string;
  file_name: string;
  date: string;
  digitized_data?: string; // JSON cifrado
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

export interface HydrationData {
  id: string;
  user_id: string;
  daily_liters: number;
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

export interface Payment {
  id: string;
  user_id: string;
  amount: number;
  method: string;
  status: 'pending' | 'completed' | 'rejected';
  notes?: string; // Cifrado
  date: string;
  created_at: string;
}
