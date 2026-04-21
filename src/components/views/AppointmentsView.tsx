import React, { useState } from 'react';
import { Calendar, Clock, ChevronRight, CheckCircle2, XCircle, AlertCircle, X } from 'lucide-react';
import { Appointment } from '../../types';
import { motion, AnimatePresence } from 'motion/react';

interface AppointmentsViewProps {
  appointments: Appointment[];
  onAdd: () => void;
  onCancel: (id: string, reason: string) => void;
}

export const AppointmentsView = ({ appointments, onAdd, onCancel }: AppointmentsViewProps) => {
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const scheduled = appointments.filter(a => 
    (a.status === 'pending' || a.status === 'confirmed' || a.status === 'postponed') && 
    new Date(a.date) >= today
  );
  
  const history = appointments.filter(a => 
    (a.status === 'confirmed' || a.status === 'postponed') && 
    new Date(a.date) < today
  );

  const handleCancelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || !cancellingId) return;
    onCancel(cancellingId, reason);
    setCancellingId(null);
    setReason('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-4">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Calendar size={20} className="text-zinc-400" />
          Próximas Citas
        </h3>

        <div className="bg-zinc-50 border border-zinc-100 p-4 rounded-2xl flex items-start gap-4 mb-6">
          <div className="p-2 bg-white rounded-xl shadow-sm">
            <AlertCircle size={18} className="text-zinc-400" />
          </div>
          <div>
            <p className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-1">Confirmación Requerida</p>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Toda solicitud de cita queda en estado <span className="text-amber-600 font-bold">Pendiente</span> hasta que sea confirmada por el coach o nutricionista. Recibirás una notificación una vez sea aprobada.
            </p>
          </div>
        </div>
        {scheduled.length > 0 ? scheduled.map(app => (
          <div key={app.id} className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm flex items-center justify-between group hover:border-zinc-900 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-zinc-50 rounded-xl flex flex-col items-center justify-center text-zinc-500 group-hover:bg-zinc-900 group-hover:text-white transition-all">
                <span className="text-[10px] font-bold uppercase">{new Date(app.date).toLocaleDateString('es-ES', { month: 'short' })}</span>
                <span className="text-lg font-bold leading-none">{new Date(app.date).getDate()}</span>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-zinc-900">{app.type || "Cita de Seguimiento"}</h4>
                  {app.status === 'pending' && (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-bold uppercase rounded-full">
                      Pendiente
                    </span>
                  )}
                  {app.status === 'confirmed' && (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-bold uppercase rounded-full">
                      Confirmada
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-zinc-500 text-sm mt-1">
                  <Clock size={14} />
                  <span>{app.time}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCancellingId(app.id)}
                className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                title="Cancelar Cita"
              >
                <XCircle size={20} />
              </button>
              <ChevronRight className="text-zinc-300 group-hover:text-zinc-900 transition-all" />
            </div>
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

      <div className="space-y-8">
        <div className="space-y-4">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <CheckCircle2 size={20} className="text-emerald-500" />
            Historial
          </h3>
          {history.length > 0 ? history.map(app => (
            <div key={app.id} className="bg-white p-4 rounded-xl border border-zinc-100 flex items-center justify-between shadow-sm">
              <div>
                <h4 className="font-medium text-zinc-900">{app.type || "Cita Finalizada"}</h4>
                <p className="text-xs text-zinc-500">{new Date(app.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>
          )) : (
            <div className="p-4 text-center text-zinc-400 text-sm italic border border-zinc-100 rounded-xl">
              Sin historial de citas.
            </div>
          )}
        </div>
      </div>

      {/* Cancellation Modal */}
      <AnimatePresence>
        {cancellingId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-zinc-200"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600">
                    <AlertCircle size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900">Cancelar Cita</h3>
                </div>
                <button onClick={() => setCancellingId(null)} className="text-zinc-400 hover:text-zinc-900">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleCancelSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700">Motivo de la cancelación</label>
                  <textarea 
                    required
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Ej: Emergencia médica, cambio de horario, etc."
                    className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all min-h-[120px] resize-none"
                  />
                  <p className="text-xs text-zinc-500">Por favor, indica brevemente por qué necesitas cancelar esta cita.</p>
                </div>

                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setCancellingId(null)}
                    className="flex-1 py-4 font-bold text-zinc-500 hover:bg-zinc-100 rounded-2xl transition-all"
                  >
                    Volver
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-4 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 shadow-lg shadow-red-200 transition-all"
                  >
                    Confirmar Cancelación
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
