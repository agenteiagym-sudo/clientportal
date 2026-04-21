import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { UserProfile, ProgressData, WeeklyMenu, Appointment, Exam, TrainingLog, StripeInvoice, StripeSubscription, Payment, DailyMenu, SystemSettings, HydrationData } from './types';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  LayoutDashboard, Utensils, Calendar, CreditCard, LogOut, User, 
  ChevronRight, TrendingUp, AlertCircle, Users, Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { Toaster } from 'sonner';
import { decryptData, encryptData } from './lib/encryption';
import { robustJSONRepair } from './lib/jsonUtils';

// --- Components ---
import { NavItem } from './components/ui/NavItem';
import { AppointmentModal } from './components/modals/AppointmentModal';
import { ExamModal } from './components/modals/ExamModal';
import { PaymentProofModal } from './components/modals/PaymentProofModal';

// --- Views ---
import { DashboardView } from './components/views/DashboardView';
import { TrainingLogsView } from './components/views/TrainingLogsView';
import { MenuView } from './components/views/MenuView';
import { AppointmentsView } from './components/views/AppointmentsView';
import { ExamsView } from './components/views/ExamsView';
import { ClientsView } from './components/views/ClientsView';
import { PaymentsView } from './components/views/PaymentsView';
import { SettingsView } from './components/views/SettingsView';

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [progress, setProgress] = useState<ProgressData[]>([]);
  const [menu, setMenu] = useState<WeeklyMenu[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [trainingLogs, setTrainingLogs] = useState<TrainingLog[]>([]);
  const [stripeInvoices, setStripeInvoices] = useState<StripeInvoice[]>([]);
  const [stripeSubscriptions, setStripeSubscriptions] = useState<StripeSubscription[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'menu' | 'appointments' | 'exams' | 'payments' | 'training' | 'clients' | 'settings'>('dashboard');
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [hydration, setHydration] = useState<HydrationData | null>(null);
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    // Rely exclusively on onAuthStateChange for initial session and changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (_event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setProgress([]);
        setMenu([]);
        setAppointments([]);
        setLoading(false);
        supabase.removeAllChannels();
      } else if (session?.user) {
        setUser(session.user);
        fetchData(session.user.id);
        setupRealtimeSubscription(session.user.id);
        
        // Check for payment success
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('payment') === 'success') {
          alert('¡Pago realizado con éxito! Tu cuenta se actualizará en unos momentos.');
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } else {
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
      supabase.removeAllChannels();
    };
  }, []);

  const setupRealtimeSubscription = (userId: string) => {
    // Escuchar cambios en todas las tablas relevantes para este usuario
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
        (payload) => {
          setProfile(payload.new as UserProfile);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'physical_progress', filter: `user_id=eq.${userId}` },
        () => fetchData(userId)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'weekly_menus', filter: `user_id=eq.${userId}` },
        () => fetchData(userId)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments', filter: `user_id=eq.${userId}` },
        () => fetchData(userId)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'medical_exams', filter: `user_id=eq.${userId}` },
        () => fetchData(userId)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'training_logs', filter: `user_id=eq.${userId}` },
        () => fetchData(userId)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payments', filter: `user_id=eq.${userId}` },
        () => fetchData(userId)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchData = async (userId: string) => {
    setLoading(true);
    try {
      // Fetch Profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) throw profileError;
      
      // Decrypt Profile Fields
      if (profileData) {
        const decrypt = async (val: any) => {
          return await decryptData(val);
        };

        profileData.full_name = await decrypt(profileData.full_name);
        profileData.cedula = await decrypt(profileData.cedula);
        profileData.phone = await decrypt(profileData.phone);
        profileData.plan_details = await decrypt(profileData.plan_details);
        profileData.plan_price = await decrypt(profileData.plan_price);
      }

      setProfile(profileData);

      // Fetch all data in parallel to avoid sequential timeouts
      const [
        { data: progressData, error: progressError },
        { data: menuData, error: menuError },
        { data: appData, error: appError },
        { data: examData, error: examError },
        { data: proofData, error: proofError },
        { data: trainingData, error: trainingError },
        { data: settingsData, error: settingsError },
        hydrationRes
      ] = await Promise.all([
        supabase.from('physical_progress').select('*').eq('user_id', userId).order('date', { ascending: true }),
        // Only fetch the most recent menu to save bandwidth and prevent timeouts
        supabase.from('weekly_menus').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1),
        supabase.from('appointments').select('*').eq('user_id', userId).order('date', { ascending: true }),
        supabase.from('medical_exams').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
        supabase.from('payments').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
        supabase.from('training_logs').select('*').eq('user_id', userId).order('date', { ascending: false }).limit(50),
        supabase.from('system_settings').select('*').eq('id', 'default').maybeSingle(),
        supabase.from('hydration_data').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle()
      ] as any);

      if (progressError) throw progressError;
      if (menuError) throw menuError;
      if (appError) throw appError;
      if (examError) throw examError;
      if (proofError) throw proofError;
      if (trainingError) throw trainingError;
      if (settingsError) throw settingsError;
      
      const { data: hydrationData, error: hydrationError } = hydrationRes || { data: null, error: null };
      if (hydrationError) console.error('Error fetching hydration:', hydrationError);

      // Decrypt additional data
      const [decryptedTraining, decryptedProgress, decryptedAppointments, decryptedHydration] = await Promise.all([
        Promise.all((trainingData || []).map(async (log: any) => ({
          ...log,
          exercise_name: await decryptData(log.exercise_name),
          notes: await decryptData(log.notes)
        }))),
        Promise.all((progressData || []).map(async (p: any) => ({
          ...p,
          notes: await decryptData(p.notes)
        }))),
        Promise.all((appData || []).map(async (app: any) => ({
          ...app,
          type: await decryptData(app.type),
          notes: await decryptData(app.notes)
        }))),
        hydrationData ? (async () => ({
          ...hydrationData,
          notes: await decryptData(hydrationData.notes)
        }))() : Promise.resolve(null)
      ]);

      setProgress(decryptedProgress);
      setTrainingLogs(decryptedTraining);
      setAppointments(decryptedAppointments);
      setHydration(decryptedHydration as any);

      // Decrypt Exams
      const decryptedExams = await Promise.all((examData || []).map(async (exam: any) => ({
        ...exam,
        digitized_data: await decryptData(exam.digitized_data)
      })));
      setExams(decryptedExams);
      
      // Intentar descifrar el contenido del menú si es necesario
      let processedMenu = menuData || [];
      if (processedMenu.length > 0) {
        const menuToProcess = processedMenu[0];
        let content = menuToProcess.content;

        // 1. Decrypt if encrypted using local utility
        if (typeof content === 'string' && content.startsWith('U2FsdGVkX1')) {
          try {
            const decrypted = await decryptData(content);
            if (decrypted) {
              content = decrypted;
              menuToProcess.content = content;
            }
          } catch (err) {
            console.error('Error decrypting menu:', err);
          }
        }

        // 2. Parse JSON if content is a JSON string or already an object
        let dailyData = null;
        if (typeof content === 'object' && content !== null) {
          dailyData = (content as any).days || (Array.isArray(content) ? content : null);
        } else if (typeof content === 'string' && (content.trim().startsWith('{') || content.trim().startsWith('['))) {
          try {
            const parsed = robustJSONRepair(content);
            dailyData = parsed.days || (Array.isArray(parsed) ? parsed : null);
          } catch (e) {
            console.error('Error parsing menu JSON even after robust repair attempt:', e);
          }
        }
        
        if (dailyData && (!menuToProcess.daily_menus || menuToProcess.daily_menus.length === 0)) {
          menuToProcess.daily_menus = dailyData;
        }

        // 3. Decrypt individual daily menu fields if they are encrypted
        if (menuToProcess.daily_menus && Array.isArray(menuToProcess.daily_menus)) {
          menuToProcess.daily_menus = await Promise.all(menuToProcess.daily_menus.map(async (day: any) => ({
            ...day,
            breakfast: await decryptData(day.breakfast),
            lunch: await decryptData(day.lunch),
            dinner: await decryptData(day.dinner),
            snacks: await decryptData(day.snacks),
            preparation: await decryptData(day.preparation)
          })));
        }
      }
      
      // Decrypt payment notes
      const decryptedPayments = await Promise.all((proofData || []).map(async (p: any) => ({
        ...p,
        notes: await decryptData(p.notes)
      })));
      
      setMenu(processedMenu);
      setPayments(decryptedPayments);
      
      let finalSettings = settingsData;
      if (!finalSettings) {
        // Initialize default settings if they don't exist
        const defaultReasons = ["Evaluación Nutricional", "Ajuste de Rutina", "Consulta General", "Fisioterapia", "Pesaje"];
        const { data: newSettings, error: initError } = await supabase
          .from('system_settings')
          .insert({ id: 'default', appointment_reasons: defaultReasons })
          .select()
          .maybeSingle();
        
        if (!initError && newSettings) {
          finalSettings = newSettings;
        }
      }
      setSystemSettings(finalSettings || null);

      // Fetch Stripe Data (if FDW is configured)
      if (profileData?.id && profileData?.stripe_customer_id) {
        try {
          const [invoicesRes, subsRes] = await Promise.all([
            supabase.schema('stripe').from('invoices').select('*').eq('customer', profileData.stripe_customer_id).limit(5),
            supabase.schema('stripe').from('subscriptions').select('*').eq('customer', profileData.stripe_customer_id).limit(5)
          ]);
          setStripeInvoices(invoicesRes.data || []);
          setStripeSubscriptions(subsRes.data || []);
        } catch (err) {
          console.warn('Stripe FDW not configured or accessible:', err);
        }
      }

    } catch (err) {
      console.error('Error fetching data:', err);
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        setAuthError('Error de conexión: No se pudo contactar con el servidor de base de datos. Verifica tu conexión o las credenciales de Supabase.');
      } else {
        setAuthError('No se pudo cargar tu perfil. Contacta a un administrador.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setAuthError(error.message);
  };

  const handleLogout = () => supabase.auth.signOut();

  const handleAddAppointment = async (type: string, date: string, time: string) => {
    if (!user) return;
    const { error } = await supabase
      .from('appointments')
      .insert([{ user_id: user.id, type, date, time, status: 'pending' }]);
    
    if (error) {
      console.error('Error adding appointment:', error);
    } else {
      fetchData(user.id);
      setIsAppointmentModalOpen(false);
    }
  };

  const handleUploadExam = async (file: File) => {
    if (!user) return;
    
    try {
      // 1. Upload to Storage (Personal folder: userId/filename)
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('exams')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('exams')
        .getPublicUrl(fileName);

      // 2. Save to Database (No AI analysis)
      const { error: dbError } = await supabase
        .from('medical_exams')
        .insert([{ 
          user_id: user.id, 
          file_url: publicUrl,
          file_name: file.name,
          date: new Date().toISOString().split('T')[0]
        }]);
      
      if (dbError) throw dbError;

      fetchData(user.id);
      setIsExamModalOpen(false);
    } catch (err) {
      console.error('Error uploading exam:', err);
    }
  };

  const handleDeleteExam = async (examId: string, fileUrl: string) => {
    if (!user) return;

    try {
      // 1. Delete from Storage if fileUrl exists
      if (fileUrl) {
        // Extract path from URL (assuming it's a public URL from Supabase)
        // Format: .../storage/v1/object/public/exams/userId/filename
        const pathParts = fileUrl.split('/exams/');
        if (pathParts.length > 1) {
          const filePath = pathParts[1];
          await supabase.storage.from('exams').remove([filePath]);
        }
      }

      // 2. Delete from Database
      const { error } = await supabase
        .from('medical_exams')
        .delete()
        .eq('id', examId);

      if (error) throw error;

      fetchData(user.id);
    } catch (err) {
      console.error('Error deleting exam:', err);
    }
  };

  const handleUploadPayment = async (file: File) => {
    if (!user) return;
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('payments')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('payments')
        .getPublicUrl(fileName);

      // Encrypt the URL before saving to notes
      const encryptedNotes = await encryptData(publicUrl);

      const { error: dbError } = await supabase
        .from('payments')
        .insert([{ 
          user_id: user.id, 
          amount: parseFloat(profile?.plan_price || '45'),
          method: 'Transferencia/Yappy',
          status: 'pending',
          notes: encryptedNotes,
          date: new Date().toISOString()
        }]);
      
      if (dbError) throw dbError;

      fetchData(user.id);
      setIsPaymentModalOpen(false);
    } catch (err) {
      console.error('Error uploading payment:', err);
    }
  };

  const handleCreateSubscription = async (priceId: string) => {
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          email: user?.email,
          planId: priceId
        })
      });
      
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'No se pudo crear la sesión de pago');
      }
    } catch (err) {
      console.error('Error creating subscription:', err);
      if (err instanceof Error && err.message.includes('STRIPE_SECRET_KEY')) {
        alert('Configuración de Stripe pendiente. Por favor, asegúrate de haber configurado la clave secreta de Stripe en Settings > Secrets.');
      } else {
        alert('Error al iniciar el proceso de pago. Verifica que tu administrador haya configurado las claves de Stripe correctamente.');
      }
    }
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    if (!window.confirm('¿Estás seguro de que deseas cancelar tu suscripción? Tu acceso premium se desactivará al final del periodo actual.')) {
      return;
    }

    try {
      const response = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId })
      });
      
      const data = await response.json();
      if (response.ok) {
        alert('Suscripción cancelada con éxito.');
        if (user) fetchData(user.id);
      } else {
        throw new Error(data.error || 'Error al cancelar la suscripción');
      }
    } catch (err) {
      console.error('Error cancelling subscription:', err);
      alert('Error al cancelar la suscripción. Por favor, contacta a soporte.');
    }
  };

  const handleUpdateMenu = async (menuId: string, dailyMenus: DailyMenu[]) => {
    const { error } = await supabase
      .from('weekly_menus')
      .update({ daily_menus: dailyMenus })
      .eq('id', menuId);
    
    if (error) {
      console.error('Error updating menu:', error);
      alert('Error al actualizar el menú');
    } else {
      setMenu(prev => prev.map(m => m.id === menuId ? { ...m, daily_menus: dailyMenus } : m));
    }
  };

  const handleCancelAppointment = async (id: string, reason: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ 
          status: 'cancelled'
        })
        .eq('id', id);

      if (error) throw error;
      
      if (user) fetchData(user.id);
    } catch (err) {
      console.error('Error cancelling appointment:', err);
      alert('Error al cancelar la cita. Por favor, intenta de nuevo.');
    }
  };

  const handleUpdateSettings = async (reasons: string[]) => {
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({ id: 'default', appointment_reasons: reasons });

      if (error) throw error;
      
      setSystemSettings(prev => prev ? { ...prev, appointment_reasons: reasons } : { id: 'default', appointment_reasons: reasons, created_at: new Date().toISOString() });
    } catch (err) {
      console.error('Error updating settings:', err);
      alert('Error al actualizar la configuración');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white rounded-3xl p-8 shadow-xl border border-black/5"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="text-white" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-zinc-900">Portal Cliente</h1>
            <p className="text-zinc-500 mt-2">Ingresa tus credenciales para continuar</p>
            <p className="text-[10px] text-zinc-400 mt-4 uppercase tracking-widest font-bold">Tu cuenta debe ser creada por un administrador</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none transition-all"
                placeholder="tu@email.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Contraseña</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
                required
              />
            </div>
            {authError && <p className="text-red-500 text-sm">{authError}</p>}
            <button 
              type="submit"
              className="w-full bg-zinc-900 text-white font-semibold py-3 rounded-xl hover:bg-zinc-800 transition-colors shadow-lg shadow-zinc-200"
            >
              Iniciar Sesión
            </button>
          </form>
          {(!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'undefined') && (
            <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-sm">
              <p className="font-bold flex items-center gap-2 mb-1">
                <AlertCircle size={16} />
                Configuración Pendiente
              </p>
              <p>Las variables de entorno de Supabase no están configuradas. Por favor, revisa el menú de Configuración en AI Studio.</p>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col md:flex-row font-sans text-zinc-900">
      <Toaster position="top-center" richColors />
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-zinc-200 p-6 flex flex-col gap-8">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center shrink-0">
            <TrendingUp className="text-white" size={20} />
          </div>
          <span className="font-bold text-xl tracking-tight">GymFlow</span>
        </div>

        <nav className="flex flex-col gap-1">
          <NavItem 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
            icon={LayoutDashboard} 
            label="Progreso" 
          />
          <NavItem 
            active={activeTab === 'training'} 
            onClick={() => setActiveTab('training')} 
            icon={TrendingUp} 
            label="Entrenamiento" 
          />
          <NavItem 
            active={activeTab === 'menu'} 
            onClick={() => setActiveTab('menu')} 
            icon={Utensils} 
            label="Menú Semanal" 
          />
          <NavItem 
            active={activeTab === 'appointments'} 
            onClick={() => setActiveTab('appointments')} 
            icon={Calendar} 
            label="Citas" 
          />
          <NavItem 
            active={activeTab === 'exams'} 
            onClick={() => setActiveTab('exams')} 
            icon={AlertCircle} 
            label="Exámenes" 
          />
          <NavItem 
            active={activeTab === 'payments'} 
            onClick={() => setActiveTab('payments')} 
            icon={CreditCard} 
            label="Pagos" 
          />
          {(profile?.role === 'admin' || profile?.role === 'nutritionist' || profile?.role === 'manager') && (
            <>
              <NavItem 
                active={activeTab === 'clients'} 
                onClick={() => setActiveTab('clients')} 
                icon={Users} 
                label="Clientes" 
              />
              <NavItem 
                active={activeTab === 'settings'} 
                onClick={() => setActiveTab('settings')} 
                icon={Settings} 
                label="Configuración" 
              />
            </>
          )}
        </nav>

        <div className="mt-auto pt-6 border-t border-zinc-100">
          <div className="flex items-center gap-3 px-2 mb-6">
            <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center">
              <User size={20} className="text-zinc-500" />
            </div>
            <div className="overflow-hidden">
              <p className="font-medium text-sm truncate">{profile?.full_name}</p>
              <p className="text-xs text-zinc-500 truncate">{user.email}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-zinc-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all group"
          >
            <LogOut size={20} />
            <span className="font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-10 overflow-y-auto max-w-7xl mx-auto w-full">
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-zinc-900">
              {activeTab === 'dashboard' && 'Tu Progreso'}
              {activeTab === 'training' && 'Entrenamiento'}
              {activeTab === 'menu' && 'Menú Semanal'}
              {activeTab === 'appointments' && 'Tus Citas'}
              {activeTab === 'payments' && 'Estado de Pago'}
              {activeTab === 'clients' && 'Gestión de Clientes'}
            </h2>
            <p className="text-zinc-500 mt-1">
              {activeTab === 'dashboard' && 'Visualiza tu evolución física'}
              {activeTab === 'training' && 'Tus registros de ejercicios'}
              {activeTab === 'menu' && 'Tu plan nutricional personalizado'}
              {activeTab === 'appointments' && 'Gestiona tus sesiones con especialistas'}
              {activeTab === 'payments' && 'Control de tus suscripciones'}
              {activeTab === 'clients' && 'Administra la base de datos de usuarios'}
              {activeTab === 'settings' && 'Ajustes maestros del sistema'}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-zinc-200 shadow-sm self-start">
            <div className={cn(
              "w-2 h-2 rounded-full",
              profile?.is_active ? "bg-emerald-500" : "bg-amber-500"
            )} />
            <span className="text-sm font-medium">
              {profile?.is_active ? 'Cuenta Activa' : 'Cuenta Inactiva'}
            </span>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'dashboard' && <DashboardView progress={progress} profile={profile} hydration={hydration} />}
            {activeTab === 'training' && <TrainingLogsView logs={trainingLogs} />}
            {activeTab === 'menu' && <MenuView menu={menu} onUpdateMenu={handleUpdateMenu} profile={profile} />}
            {activeTab === 'appointments' && (
              <AppointmentsView 
                appointments={appointments} 
                onAdd={() => setIsAppointmentModalOpen(true)} 
                onCancel={handleCancelAppointment}
              />
            )}
            {activeTab === 'exams' && <ExamsView exams={exams} onUpload={() => setIsExamModalOpen(true)} onDelete={handleDeleteExam} />}
            {activeTab === 'clients' && <ClientsView />}
            {activeTab === 'settings' && <SettingsView settings={systemSettings} onUpdate={handleUpdateSettings} />}
            {activeTab === 'payments' && (
              <PaymentsView 
                profile={profile} 
                invoices={stripeInvoices} 
                subscriptions={stripeSubscriptions}
                payments={payments}
                onCreateSub={handleCreateSubscription}
                onCancelSub={handleCancelSubscription}
                onUploadProof={() => setIsPaymentModalOpen(true)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Modals */}
      {isAppointmentModalOpen && (
        <AppointmentModal 
          onClose={() => setIsAppointmentModalOpen(false)} 
          onSubmit={handleAddAppointment} 
          reasons={systemSettings?.appointment_reasons || []}
        />
      )}
      {isExamModalOpen && (
        <ExamModal 
          onClose={() => setIsExamModalOpen(false)} 
          onSubmit={handleUploadExam} 
        />
      )}
      {isPaymentModalOpen && (
        <PaymentProofModal 
          onClose={() => setIsPaymentModalOpen(false)} 
          onSubmit={handleUploadPayment} 
        />
      )}
    </div>
  );
}
