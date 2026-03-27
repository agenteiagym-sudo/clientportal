import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { UserProfile, ProgressData, WeeklyMenu, Appointment, Exam, TrainingLog, StripeInvoice, StripeSubscription, PaymentProof } from './types';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line 
} from 'recharts';
import { 
  LayoutDashboard, Utensils, Calendar, CreditCard, LogOut, User, 
  ChevronRight, TrendingUp, CheckCircle2, AlertCircle, Clock, Upload,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

// --- Components ---

const Card = ({ children, className, title }: { children: React.ReactNode, className?: string, title?: string, key?: string | number }) => (
  <div className={cn("bg-white rounded-2xl p-6 shadow-sm border border-black/5", className)}>
    {title && <h3 className="text-sm font-medium text-zinc-500 mb-4 uppercase tracking-wider">{title}</h3>}
    {children}
  </div>
);

const Stat = ({ label, value, icon: Icon, trend }: { label: string, value: string, icon: any, trend?: string }) => (
  <Card className="flex items-start justify-between">
    <div>
      <p className="text-sm text-zinc-500 font-medium">{label}</p>
      <h4 className="text-2xl font-semibold mt-1 text-zinc-900">{value}</h4>
      {trend && <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
        <TrendingUp size={12} /> {trend}
      </p>}
    </div>
    <div className="p-2 bg-zinc-50 rounded-lg text-zinc-400">
      <Icon size={20} />
    </div>
  </Card>
);

// --- Main App ---

function AppointmentModal({ onClose, onSubmit }: { onClose: () => void, onSubmit: (t: string, d: string, tm: string) => void }) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl"
      >
        <h2 className="text-2xl font-bold mb-6">Agendar Cita</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Título / Motivo</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Control Nutricional"
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Fecha</label>
              <input 
                type="date" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Hora</label>
              <input 
                type="time" 
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
              />
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-8">
          <button 
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-medium text-zinc-500 hover:bg-zinc-100 transition-all"
          >
            Cancelar
          </button>
          <button 
            onClick={() => onSubmit(title, date, time)}
            disabled={!title || !date || !time}
            className="flex-1 py-3 rounded-xl font-medium bg-zinc-900 text-white hover:bg-zinc-800 transition-all disabled:opacity-50"
          >
            Confirmar
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function ExamModal({ onClose, onSubmit }: { onClose: () => void, onSubmit: (file: File) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      await onSubmit(file);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl"
      >
        <h2 className="text-2xl font-bold mb-2">Subir Examen</h2>
        <p className="text-zinc-500 text-sm mb-6">Sube una imagen o PDF. La IA extraerá automáticamente el nombre y la fecha.</p>
        
        <div className="space-y-4">
          <div className="border-2 border-dashed border-zinc-200 rounded-2xl p-8 text-center hover:border-zinc-900 transition-all cursor-pointer relative">
            <input 
              type="file" 
              accept="image/*,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="absolute inset-0 opacity-0 cursor-pointer"
              disabled={isProcessing}
            />
            <div className="flex flex-col items-center gap-2">
              <Upload size={32} className="text-zinc-400" />
              <p className="text-sm font-medium text-zinc-600">
                {file ? file.name : "Selecciona o arrastra un archivo"}
              </p>
              <p className="text-xs text-zinc-400">JPG, PNG o PDF (Máx 5MB)</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button 
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 py-3 rounded-xl font-medium text-zinc-500 hover:bg-zinc-100 transition-all disabled:opacity-50"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSubmit}
            disabled={!file || isProcessing}
            className="flex-1 py-3 rounded-xl font-medium bg-zinc-900 text-white hover:bg-zinc-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Procesando...
              </>
            ) : "Subir y Analizar"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function PaymentProofModal({ onClose, onSubmit }: { onClose: () => void, onSubmit: (file: File) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async () => {
    if (!file) return;
    setIsUploading(true);
    try {
      await onSubmit(file);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl"
      >
        <h2 className="text-2xl font-bold mb-2">Enviar Comprobante</h2>
        <p className="text-zinc-500 text-sm mb-6">Sube una captura de tu transferencia bancaria o Yappy.</p>
        
        <div className="space-y-4">
          <div className="border-2 border-dashed border-zinc-200 rounded-2xl p-8 text-center hover:border-zinc-900 transition-all cursor-pointer relative">
            <input 
              type="file" 
              accept="image/*,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="absolute inset-0 opacity-0 cursor-pointer"
              disabled={isUploading}
            />
            <div className="flex flex-col items-center gap-2">
              <Upload size={32} className="text-zinc-400" />
              <p className="text-sm font-medium text-zinc-600">
                {file ? file.name : "Selecciona el comprobante"}
              </p>
              <p className="text-xs text-zinc-400">JPG, PNG o PDF (Máx 5MB)</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button 
            onClick={onClose}
            disabled={isUploading}
            className="flex-1 py-3 rounded-xl font-medium text-zinc-500 hover:bg-zinc-100 transition-all disabled:opacity-50"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSubmit}
            disabled={!file || isUploading}
            className="flex-1 py-3 rounded-xl font-medium bg-zinc-900 text-white hover:bg-zinc-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Subiendo...
              </>
            ) : "Enviar Comprobante"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

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
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'menu' | 'appointments' | 'exams' | 'payments' | 'training' | 'clients'>('dashboard');
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [isPaymentProofModalOpen, setIsPaymentProofModalOpen] = useState(false);
  const [paymentProofs, setPaymentProofs] = useState<PaymentProof[]>([]);
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchData(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchData(session.user.id);
        setupRealtimeSubscription(session.user.id);
        
        // Check for payment success
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('payment') === 'success') {
          alert('¡Pago realizado con éxito! Tu cuenta se actualizará en unos momentos.');
          // Remove the query param from URL
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } else {
        setProfile(null);
        setProgress([]);
        setMenu([]);
        setAppointments([]);
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
        { event: '*', schema: 'public', table: 'payment_proofs', filter: `user_id=eq.${userId}` },
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
      setProfile(profileData);

      // Fetch Progress (Sequential)
      const { data: progressData, error: progressError } = await supabase
        .from('physical_progress')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: true });

      if (progressError) throw progressError;
      setProgress(progressData || []);

      // Fetch Menu
      const { data: menuData, error: menuError } = await supabase
        .from('weekly_menus')
        .select('*')
        .eq('user_id', userId);

      if (menuError) throw menuError;
      setMenu(menuData || []);

      // Fetch Appointments
      const { data: appData, error: appError } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: true });

      if (appError) throw appError;
      setAppointments(appData || []);

      // Fetch Exams
      const { data: examData, error: examError } = await supabase
        .from('medical_exams')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (examError) throw examError;
      setExams(examData || []);

      // Fetch Payment Proofs
      const { data: proofData, error: proofError } = await supabase
        .from('payment_proofs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (proofError) throw proofError;
      setPaymentProofs(proofData || []);

      // Fetch Training Logs
      const { data: trainingData, error: trainingError } = await supabase
        .from('training_logs')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (trainingError) throw trainingError;
      setTrainingLogs(trainingData || []);

      // Fetch Stripe Data (if FDW is configured)
      if (profileData?.id && profileData?.stripe_customer_id) {
        try {
          const { data: invoices } = await supabase
            .schema('stripe')
            .from('invoices')
            .select('*')
            .eq('customer', profileData.stripe_customer_id)
            .limit(10);
          setStripeInvoices(invoices || []);

          const { data: subs } = await supabase
            .schema('stripe')
            .from('subscriptions')
            .select('*')
            .eq('customer', profileData.stripe_customer_id)
            .limit(10);
          setStripeSubscriptions(subs || []);
        } catch (err) {
          console.warn('Stripe FDW not configured or accessible:', err);
        }
      }

    } catch (err) {
      console.error('Error fetching data:', err);
      setAuthError('No se pudo cargar tu perfil. Contacta a un administrador.');
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

  const handleAddAppointment = async (title: string, date: string, time: string) => {
    if (!user) return;
    const { error } = await supabase
      .from('appointments')
      .insert([{ user_id: user.id, title, date, time, status: 'scheduled' }]);
    
    if (error) {
      console.error('Error adding appointment:', error);
      alert('Error al agendar la cita');
    } else {
      // Refresh data
      const { data } = await supabase.from('appointments').select('*').eq('user_id', user.id);
      if (data) setAppointments(data);
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

      // 2. Process with AI (Gemini)
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      // Convert file to base64 for Gemini (if it's an image)
      // Note: For PDFs, we might need a different approach or just ask Gemini to analyze the text if we can extract it.
      // For now, let's assume image or simple analysis.
      let base64Data = "";
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        base64Data = await new Promise((resolve) => {
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
          reader.readAsDataURL(file);
        });
      }

      const prompt = "Analiza este examen médico. Extrae el nombre del examen y la fecha en que se realizó. Responde en formato JSON con los campos 'title' y 'date' (YYYY-MM-DD). Si no encuentras la fecha, usa la fecha actual.";
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: file.type.startsWith('image/') 
          ? [{ parts: [{ text: prompt }, { inlineData: { data: base64Data, mimeType: file.type } }] }]
          : [{ parts: [{ text: `${prompt}. El archivo es un PDF llamado ${file.name}.` }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              date: { type: Type.STRING }
            },
            required: ["title", "date"]
          }
        }
      });

      const aiResult = JSON.parse(response.text || "{}");

      // 3. Save to Database
      const { error: dbError } = await supabase
        .from('medical_exams')
        .insert([{ 
          user_id: user.id, 
          file_url: publicUrl,
          file_name: file.name,
          digitized_data: JSON.stringify(aiResult)
        }]);
      
      if (dbError) throw dbError;

      alert('Examen subido y analizado con éxito.');
      fetchData(user.id);
      setIsExamModalOpen(false);
    } catch (err) {
      console.error('Error processing exam:', err);
      alert('Error al procesar el examen. Asegúrate de que el bucket "exams" exista en Supabase.');
    }
  };

  const handleUploadPaymentProof = async (file: File) => {
    if (!user) return;
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('payment_proofs')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('payment_proofs')
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase
        .from('payment_proofs')
        .insert([{ 
          user_id: user.id, 
          file_url: publicUrl,
          file_name: file.name,
          status: 'pending'
        }]);
      
      if (dbError) throw dbError;

      alert('Comprobante enviado con éxito. Será revisado por el equipo.');
      fetchData(user.id);
      setIsPaymentProofModalOpen(false);
    } catch (err) {
      console.error('Error uploading payment proof:', err);
      alert('Error al subir el comprobante. Asegúrate de que el bucket "payment_proofs" exista en Supabase.');
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
      alert('Error al iniciar el proceso de pago. Por favor, intenta de nuevo.');
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
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col md:flex-row font-sans text-zinc-900">
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
          {(profile?.role === 'admin' || profile?.role === 'nutritionist') && (
            <NavItem 
              active={activeTab === 'clients'} 
              onClick={() => setActiveTab('clients')} 
              icon={Users} 
              label="Clientes" 
            />
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
            {activeTab === 'dashboard' && <DashboardView progress={progress} profile={profile} />}
            {activeTab === 'training' && <TrainingLogsView logs={trainingLogs} />}
            {activeTab === 'menu' && <MenuView menu={menu} />}
            {activeTab === 'appointments' && <AppointmentsView appointments={appointments} onAdd={() => setIsAppointmentModalOpen(true)} />}
            {activeTab === 'exams' && <ExamsView exams={exams} onUpload={() => setIsExamModalOpen(true)} />}
            {activeTab === 'clients' && <ClientsView />}
            {activeTab === 'payments' && (
              <PaymentsView 
                profile={profile} 
                invoices={stripeInvoices} 
                subscriptions={stripeSubscriptions}
                paymentProofs={paymentProofs}
                onCreateSub={handleCreateSubscription}
                onUploadProof={() => setIsPaymentProofModalOpen(true)}
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
        />
      )}
      {isExamModalOpen && (
        <ExamModal 
          onClose={() => setIsExamModalOpen(false)} 
          onSubmit={handleUploadExam} 
        />
      )}
      {isPaymentProofModalOpen && (
        <PaymentProofModal 
          onClose={() => setIsPaymentProofModalOpen(false)} 
          onSubmit={handleUploadPaymentProof} 
        />
      )}
    </div>
  );
}

// --- Sub-Views ---

function NavItem({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium",
        active 
          ? "bg-zinc-900 text-white shadow-lg shadow-zinc-200" 
          : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
      )}
    >
      <Icon size={20} />
      <span>{label}</span>
    </button>
  );
}

function DashboardView({ progress, profile }: { progress: ProgressData[], profile: UserProfile | null }) {
  if (progress.length === 0 && !profile) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
        <TrendingUp size={48} className="mb-4 opacity-20" />
        <p className="font-medium">Aún no hay datos registrados.</p>
      </div>
    );
  }
  const latest = progress[progress.length - 1];
  const previous = progress[progress.length - 2];
  
  const weightTrend = latest && previous ? (latest.weight - previous.weight).toFixed(1) : null;
  const fatTrend = latest && previous && latest.fat_percentage && previous.fat_percentage ? (latest.fat_percentage - previous.fat_percentage).toFixed(1) : null;

  return (
    <div className="space-y-8">
      {/* Datos del Administrador */}
      {profile && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Mis Datos Personales">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Cédula</p>
                <p className="text-sm font-medium">{profile.cedula || 'No registrada'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Teléfono</p>
                <p className="text-sm font-medium">{profile.phone || 'No registrado'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Email</p>
                <p className="text-sm font-medium">{profile.email}</p>
              </div>
            </div>
          </Card>
          <Card title="Información del Plan">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-zinc-900">{profile.plan_name || 'Sin Plan Asignado'}</span>
                <span className="text-lg font-bold text-zinc-900">${profile.plan_price?.toFixed(2) || '0.00'}</span>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed">{profile.plan_details || 'Contacta a administración para más detalles sobre tu plan.'}</p>
              <div className="pt-2">
                <span className={cn(
                  "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                  profile.is_active ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                )}>
                  {profile.is_active ? 'Suscripción Activa' : 'Suscripción Inactiva'}
                </span>
              </div>
            </div>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Stat 
        label="Peso Actual" 
        value={latest ? `${latest.weight} kg` : '--'} 
        icon={TrendingUp} 
        trend={weightTrend ? `${weightTrend} kg vs anterior` : undefined} 
      />
      <Stat 
        label="Grasa Corporal" 
        value={latest?.fat_percentage ? `${latest.fat_percentage}%` : '--'} 
        icon={TrendingUp} 
        trend={fatTrend ? `${fatTrend}% vs anterior` : undefined} 
      />
      <Stat label="Masa Muscular" value={latest?.muscle_mass ? `${latest.muscle_mass} kg` : '--'} icon={TrendingUp} />

      <Card title="Evolución de Peso" className="md:col-span-2 h-[400px]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Evolución de Peso</h3>
          {latest && (
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
              Última actualización: {new Date(latest.date).toLocaleDateString('es-ES')}
            </span>
          )}
        </div>
        <ResponsiveContainer width="100%" height="90%">
          <LineChart data={progress}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#71717a' }}
              tickFormatter={(val) => new Date(val).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#71717a' }}
              domain={['dataMin - 2', 'dataMax + 2']}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
            />
            <Line 
              type="monotone" 
              dataKey="weight" 
              stroke="#18181b" 
              strokeWidth={3} 
              dot={{ r: 4, fill: '#18181b', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card title="Composición Corporal" className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={progress.slice(-3)}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#71717a' }}
              tickFormatter={(val) => new Date(val).toLocaleDateString('es-ES', { month: 'short' })}
            />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717a' }} />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
            />
            <Bar dataKey="fat_percentage" name="Grasa %" fill="#e4e4e7" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {latest?.notes && (
        <Card className="md:col-span-3 bg-zinc-900 text-white border-none">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-xl">
              <TrendingUp size={24} />
            </div>
            <div>
              <h4 className="font-semibold">Nota de tu Coach</h4>
              <p className="text-zinc-400 text-sm">{latest.notes}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  </div>
  );
}

function MenuView({ menu }: { menu: WeeklyMenu[] }) {
  const hasMenu = menu.length > 0;

  if (!hasMenu) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
        <Utensils size={48} className="mb-4 opacity-20" />
        <p className="font-medium">Aún no tienes un menú asignado.</p>
        <p className="text-sm">Tu nutricionista lo publicará pronto.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-2">
        <p className="text-sm text-zinc-500">Plan nutricional actualizado semanalmente por tu nutricionista.</p>
        <span className="bg-zinc-100 text-zinc-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
          Semana Actual
        </span>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {menu.map((item) => (
          <Card key={item.id} title={item.is_approved ? "Menú Aprobado" : "Pendiente de Aprobación"}>
            <div className="prose prose-zinc max-w-none">
              <div className="whitespace-pre-wrap text-zinc-700 leading-relaxed">
                {item.content}
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-zinc-100 flex justify-between items-center">
              <span className="text-xs text-zinc-400 font-medium">
                Publicado el: {new Date(item.created_at).toLocaleDateString('es-ES')}
              </span>
              {item.is_approved && (
                <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold uppercase tracking-widest">
                  <CheckCircle2 size={14} /> Aprobado
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
      <Card className="bg-zinc-900 text-white border-none">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/10 rounded-xl">
            <AlertCircle size={24} />
          </div>
          <div>
            <h4 className="font-semibold">Recomendación del Nutricionista</h4>
            <p className="text-zinc-400 text-sm">Recuerda mantenerte hidratado. Bebe al menos 2.5 litros de agua al día y evita las bebidas azucaradas.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

function AppointmentsView({ appointments, onAdd }: { appointments: Appointment[], onAdd: () => void }) {
  const scheduled = appointments.filter(a => a.status === 'scheduled');
  const completed = appointments.filter(a => a.status === 'completed');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="space-y-4">
        <h3 className="text-lg font-bold mb-4">Próximas Citas</h3>
        {scheduled.length > 0 ? scheduled.map(app => (
          <div key={app.id} className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm flex items-center justify-between group hover:border-zinc-900 transition-all cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-zinc-50 rounded-xl flex flex-col items-center justify-center text-zinc-500 group-hover:bg-zinc-900 group-hover:text-white transition-all">
                <span className="text-[10px] font-bold uppercase">{new Date(app.date).toLocaleDateString('es-ES', { month: 'short' })}</span>
                <span className="text-lg font-bold leading-none">{new Date(app.date).getDate()}</span>
              </div>
              <div>
                <h4 className="font-bold text-zinc-900">{app.title}</h4>
                <div className="flex items-center gap-2 text-zinc-500 text-sm mt-1">
                  <Clock size={14} />
                  <span>{app.time}</span>
                </div>
              </div>
            </div>
            <ChevronRight className="text-zinc-300 group-hover:text-zinc-900 transition-all" />
          </div>
        )) : (
          <div className="p-8 border border-dashed border-zinc-200 rounded-2xl text-center text-zinc-400">
            <p className="text-sm">No tienes citas programadas.</p>
          </div>
        )}
        <button 
          onClick={onAdd}
          className="w-full py-4 border-2 border-dashed border-zinc-200 rounded-2xl text-zinc-500 font-medium hover:border-zinc-900 hover:text-zinc-900 transition-all"
        >
          + Agendar Nueva Cita
        </button>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold mb-4">Historial</h3>
        {completed.length > 0 ? completed.map(app => (
          <div key={app.id} className="bg-zinc-50 p-4 rounded-xl flex items-center justify-between opacity-60">
            <div className="flex items-center gap-4">
              <CheckCircle2 className="text-emerald-500" size={20} />
              <div>
                <h4 className="font-medium text-zinc-900">{app.title}</h4>
                <p className="text-xs text-zinc-500">{new Date(app.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>
          </div>
        )) : (
          <div className="p-4 text-center text-zinc-400 text-sm italic">
            Sin historial de citas.
          </div>
        )}
      </div>
    </div>
  );
}

function ExamsView({ exams, onUpload }: { exams: Exam[], onUpload: () => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">Resultados de Exámenes</h3>
        <button 
          onClick={onUpload}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition-all text-sm font-medium"
        >
          <Upload size={16} />
          Subir Resultados
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {exams.length > 0 ? exams.map(exam => {
          let data: any = {};
          try {
            data = JSON.parse(exam.digitized_data || "{}");
          } catch (e) {}

          return (
            <Card key={exam.id} className="hover:border-zinc-900 transition-all cursor-pointer group">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-zinc-50 rounded-xl text-zinc-400 group-hover:bg-zinc-900 group-hover:text-white transition-all">
                    <AlertCircle size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-900">{data.title || exam.file_name}</h4>
                    <p className="text-xs text-zinc-500">{data.date || new Date(exam.created_at).toLocaleDateString('es-ES')}</p>
                  </div>
                </div>
                {exam.file_url && (
                  <a 
                    href={exam.file_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 bg-zinc-100 rounded-lg text-zinc-500 hover:bg-zinc-900 hover:text-white transition-all"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Upload size={16} />
                  </a>
                )}
              </div>
              <div className="mt-4 p-3 bg-zinc-50 rounded-lg text-sm text-zinc-600">
                {data.summary || "Examen procesado por IA."}
              </div>
            </Card>
          );
        }) : (
          <div className="md:col-span-2 py-12 border-2 border-dashed border-zinc-200 rounded-3xl text-center text-zinc-400">
            <AlertCircle size={32} className="mx-auto mb-2 opacity-20" />
            <p>No has subido resultados de exámenes aún.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function TrainingLogsView({ logs }: { logs: TrainingLog[] }) {
  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
        <TrendingUp size={48} className="mb-4 opacity-20" />
        <p className="font-medium">Aún no hay registros de entrenamiento.</p>
        <p className="text-sm">Tus rutinas aparecerán aquí una vez que comiences.</p>
      </div>
    );
  }

  const groupedLogs = logs.reduce((acc: any, log) => {
    if (!acc[log.date]) acc[log.date] = [];
    acc[log.date].push(log);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      {Object.entries(groupedLogs).map(([date, dayLogs]: [string, any]) => (
        <div key={date} className="space-y-4">
          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
            <Calendar size={14} /> {new Date(date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dayLogs.map((log: TrainingLog) => (
              <Card key={log.id} className="flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-zinc-900">{log.exercise_name}</h4>
                  <span className="text-xs font-bold bg-zinc-100 px-2 py-1 rounded text-zinc-600">
                    {log.sets} x {log.reps}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-500">
                  <TrendingUp size={14} />
                  <span>{log.weight_kg} kg</span>
                </div>
                {log.notes && (
                  <p className="text-xs text-zinc-400 italic mt-1">"{log.notes}"</p>
                )}
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ClientsView() {
  const [clients, setClients] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClients = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');
      setClients(data || []);
      setLoading(false);
    };
    fetchClients();
  }, []);

  if (loading) return <div className="text-center py-10">Cargando clientes...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.map(client => (
          <Card key={client.id} className="hover:border-zinc-900 transition-all cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center group-hover:bg-zinc-900 group-hover:text-white transition-all">
                <User size={24} />
              </div>
              <div className="overflow-hidden">
                <h4 className="font-bold text-zinc-900 truncate">{client.full_name}</h4>
                <p className="text-xs text-zinc-500 truncate">{client.email}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-zinc-100 flex justify-between items-center">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Rol</span>
                <span className="text-xs font-medium capitalize">{client.role}</span>
              </div>
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full",
                client.is_active ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
              )}>
                {client.is_active ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function PaymentsView({ 
  profile, 
  invoices, 
  subscriptions,
  paymentProofs,
  onCreateSub,
  onUploadProof
}: { 
  profile: UserProfile | null, 
  invoices: StripeInvoice[],
  subscriptions: StripeSubscription[],
  paymentProofs: PaymentProof[],
  onCreateSub: (priceId: string) => void,
  onUploadProof: () => void
}) {
  const activeSub = subscriptions.find(s => s.status === 'active');
  const amountToPay = profile?.plan_price ?? (activeSub ? 45 : 0);

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <Card className="text-center py-10">
        <div className={cn(
          "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6",
          activeSub || profile?.is_active ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
        )}>
          {activeSub || profile?.is_active ? <CheckCircle2 size={40} /> : <AlertCircle size={40} />}
        </div>
        <h3 className="text-2xl font-bold text-zinc-900">
          {profile?.is_active ? 'Tu cuenta está activa' : 'Cuenta inactiva'}
        </h3>
        
        <div className="mt-4 space-y-1">
          {profile?.plan_name && (
            <p className="text-lg font-semibold text-zinc-900">{profile.plan_name}</p>
          )}
          {profile?.plan_price != null && (
            <p className="text-3xl font-bold text-zinc-900">${profile.plan_price.toFixed(2)}<span className="text-sm text-zinc-500 font-normal">/mes</span></p>
          )}
          {profile?.plan_details && (
            <p className="text-sm text-zinc-500 max-w-xs mx-auto">{profile.plan_details}</p>
          )}
        </div>

        {!activeSub && !profile?.plan_price && (
          <div className="mt-6 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
            <p className="text-sm text-zinc-500">No tienes un monto mensual asignado. Por favor, contacta a tu coach para definir tu plan de pagos.</p>
          </div>
        )}

        <div className="mt-8 pt-8 border-t border-zinc-100 grid grid-cols-2 gap-4">
          <div className="text-left">
            <p className="text-xs text-zinc-400 uppercase font-bold tracking-widest">Estado de Cuenta</p>
            <p className="font-bold text-lg capitalize">{profile?.is_active ? 'Activa' : 'Inactiva'}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-zinc-400 uppercase font-bold tracking-widest">Monto Mensual</p>
            <p className="font-bold text-lg">${amountToPay.toFixed(2)}</p>
          </div>
        </div>

        <button 
          onClick={onUploadProof}
          className="w-full mt-8 py-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
        >
          <Upload size={20} />
          Enviar Comprobante (Transferencia/Yappy)
        </button>
      </Card>

      {paymentProofs.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold">Comprobantes Enviados</h3>
          <div className="space-y-3">
            {paymentProofs.map(proof => (
              <div key={proof.id} className="bg-white p-4 rounded-2xl border border-zinc-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "p-2 rounded-lg",
                    proof.status === 'approved' ? "bg-emerald-50 text-emerald-600" :
                    proof.status === 'rejected' ? "bg-red-50 text-red-600" :
                    "bg-amber-50 text-amber-600"
                  )}>
                    {proof.status === 'approved' ? <CheckCircle2 size={18} /> :
                     proof.status === 'rejected' ? <AlertCircle size={18} /> :
                     <Clock size={18} />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-900">{proof.file_name}</p>
                    <p className="text-xs text-zinc-500">{new Date(proof.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full",
                    proof.status === 'approved' ? "bg-emerald-100 text-emerald-700" :
                    proof.status === 'rejected' ? "bg-red-100 text-red-700" :
                    "bg-amber-100 text-amber-700"
                  )}>
                    {proof.status === 'approved' ? 'Aprobado' :
                     proof.status === 'rejected' ? 'Rechazado' :
                     'Pendiente'}
                  </span>
                  <a 
                    href={proof.file_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 bg-zinc-50 rounded-lg text-zinc-400 hover:text-zinc-900 transition-all"
                  >
                    <Upload size={14} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-bold">Facturas Recientes</h3>
        <div className="space-y-2">
          {invoices.length > 0 ? invoices.map(invoice => (
            <div key={invoice.id} className="flex items-center justify-between p-3 hover:bg-zinc-100 rounded-xl transition-all cursor-pointer group">
              <div className="flex items-center gap-3">
                <CreditCard size={18} className="text-zinc-400" />
                <span className="text-sm font-medium">Factura #{invoice.id?.slice(-6) || '...'} - {new Date(invoice.created).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold">${(invoice.amount_due / 100).toFixed(2)}</span>
                <a 
                  href={invoice.invoice_pdf} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-900"
                >
                  PDF <ChevronRight size={14} />
                </a>
              </div>
            </div>
          )) : (
            <p className="text-sm text-zinc-400 italic p-4 text-center">No hay facturas registradas.</p>
          )}
        </div>
      </div>
    </div>
  );
}
