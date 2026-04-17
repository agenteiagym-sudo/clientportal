import React, { useState, useEffect } from 'react';
import { User, CheckCircle, XCircle, Clock, ExternalLink, FileText, Upload, Trash2, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { UserProfile, Payment, Exam } from '../../types';
import { Card } from '../ui/Card';
import { cn } from '../../lib/utils';
import { GoogleGenAI, Type } from "@google/genai";
import { motion, AnimatePresence } from 'motion/react';

export const ClientsView = () => {
  const [clients, setClients] = useState<UserProfile[]>([]);
  const [pendingPayments, setPendingPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<UserProfile | null>(null);
  const [clientExams, setClientExams] = useState<Exam[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name');
    
    const { data: paymentsRes } = await supabase
      .from('payments')
      .select('*, profiles(full_name)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    setClients(profiles || []);
    setPendingPayments(paymentsRes || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprovePayment = async (payment: Payment) => {
    try {
      // 1. Approve the payment
      const { error: paymentError } = await supabase
        .from('payments')
        .update({ status: 'completed' })
        .eq('id', payment.id);

      if (paymentError) throw paymentError;

      // 2. Activate the user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ is_active: true })
        .eq('id', payment.user_id);

      if (profileError) throw profileError;

      fetchData();
    } catch (err) {
      console.error('Error approving payment:', err);
    }
  };

  const handleRejectPayment = async (paymentId: string) => {
    const { error } = await supabase
      .from('payments')
      .update({ status: 'rejected' })
      .eq('id', paymentId);

    if (error) {
      console.error('Error al rechazar el pago:', error);
    } else {
      fetchData();
    }
  };

  const fetchClientExams = async (userId: string) => {
    const { data } = await supabase
      .from('medical_exams')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    setClientExams(data || []);
  };

  const handleUploadExam = async (file: File) => {
    if (!selectedClient) return;
    setIsUploading(true);
    
    try {
      // 1. Upload to Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${selectedClient.id}/${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      
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
          user_id: selectedClient.id, 
          file_url: publicUrl,
          file_name: file.name,
          date: new Date().toISOString().split('T')[0]
        }]);
      
      if (dbError) throw dbError;

      fetchClientExams(selectedClient.id);
    } catch (err) {
      console.error('Error uploading exam:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteExam = async (examId: string, fileUrl: string) => {
    if (!selectedClient) return;
    try {
      if (fileUrl) {
        const pathParts = fileUrl.split('/exams/');
        if (pathParts.length > 1) {
          await supabase.storage.from('exams').remove([pathParts[1]]);
        }
      }
      await supabase.from('medical_exams').delete().eq('id', examId);
      fetchClientExams(selectedClient.id);
    } catch (err) {
      console.error('Error deleting exam:', err);
    }
  };

  if (loading) return <div className="text-center py-10">Cargando datos...</div>;

  return (
    <div className="space-y-10">
      {/* Pending Payments Section */}
      {pendingPayments.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
            <Clock className="text-amber-500" />
            Pagos Pendientes de Verificación
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingPayments.map(payment => (
              <Card key={payment.id} className="border-amber-100 bg-amber-50/30">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-zinc-900">{(payment as any).profiles?.full_name}</h4>
                    <p className="text-xs text-zinc-500">
                      {payment.method} - ${payment.amount.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-zinc-400">{new Date(payment.created_at).toLocaleString()}</p>
                  </div>
                  {payment.notes && payment.notes.startsWith('http') && (
                    <a 
                      href={payment.notes} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 bg-white rounded-lg border border-zinc-200 text-zinc-600 hover:text-zinc-900 transition-all flex items-center gap-1 text-xs font-bold"
                    >
                      Ver Link <ExternalLink size={12} />
                    </a>
                  )}
                </div>
                <div className="mt-6 flex gap-2">
                  <button 
                    onClick={() => handleApprovePayment(payment)}
                    className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-1"
                  >
                    <CheckCircle size={14} /> Aprobar y Activar
                  </button>
                  <button 
                    onClick={() => handleRejectPayment(payment.id)}
                    className="flex-1 py-2 bg-white border border-red-200 text-red-600 rounded-xl text-xs font-bold hover:bg-red-50 transition-all flex items-center justify-center gap-1"
                  >
                    <XCircle size={14} /> Rechazar
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Clients List Section */}
      <section className="space-y-4">
        <h3 className="text-xl font-bold text-zinc-900">Todos los Clientes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map(client => (
            <Card 
              key={client.id} 
              className="hover:border-zinc-900 transition-all cursor-pointer group"
              onClick={() => {
                setSelectedClient(client);
                fetchClientExams(client.id);
              }}
            >
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
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full",
                    client.is_active ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                  )}>
                    {client.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                  <FileText size={14} className="text-zinc-400 group-hover:text-zinc-900 transition-all" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Client Detail Modal */}
      <AnimatePresence>
        {selectedClient && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-2xl font-bold">{selectedClient.full_name}</h2>
                  <p className="text-zinc-500">{selectedClient.email}</p>
                </div>
                <button 
                  onClick={() => setSelectedClient(null)}
                  className="p-2 hover:bg-zinc-100 rounded-full transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold">Exámenes Médicos</h3>
                  <div className="relative">
                    <input 
                      type="file" 
                      accept="image/*,application/pdf"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadExam(file);
                      }}
                      disabled={isUploading}
                    />
                    <button className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition-all text-sm font-medium disabled:opacity-50">
                      {isUploading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Upload size={16} />
                      )}
                      Subir Examen
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {clientExams.length > 0 ? clientExams.map(exam => (
                    <div key={exam.id} className="p-4 bg-zinc-50 rounded-2xl flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-white rounded-lg text-zinc-400">
                          <FileText size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-zinc-900">{exam.file_name}</p>
                          <p className="text-xs text-zinc-500">{exam.date || new Date(exam.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <a 
                          href={exam.file_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-2 hover:bg-zinc-200 rounded-lg text-zinc-500 transition-all"
                        >
                          <ExternalLink size={16} />
                        </a>
                        <button 
                          onClick={() => handleDeleteExam(exam.id, exam.file_url || '')}
                          className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  )) : (
                    <p className="text-center py-8 text-zinc-400 text-sm italic">No hay exámenes registrados para este cliente.</p>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
