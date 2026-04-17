import React, { useState } from 'react';
import { motion } from 'motion/react';

interface AppointmentModalProps {
  onClose: () => void;
  onSubmit: (type: string, date: string, time: string) => void;
  reasons: string[];
}

export const AppointmentModal = ({ onClose, onSubmit, reasons }: AppointmentModalProps) => {
  const [type, setType] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  // Sincronizar el motivo inicial cuando carguen las opciones
  React.useEffect(() => {
    if (reasons.length > 0 && !type) {
      setType(reasons[0]);
    }
  }, [reasons, type]);

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
            <label className="block text-sm font-medium text-zinc-700 mb-1">Motivo de la Cita</label>
            {reasons.length > 0 ? (
              <select 
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all bg-white"
              >
                {reasons.map((reason) => (
                  <option key={reason} value={reason}>{reason}</option>
                ))}
              </select>
            ) : (
              <input 
                type="text" 
                value={type}
                onChange={(e) => setType(e.target.value)}
                placeholder="Ej: Control Nutricional"
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
              />
            )}
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
                min="06:00"
                max="23:00"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
              />
              <p className="text-[10px] text-zinc-400 mt-1">Horario: 6:00 AM - 11:00 PM</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3 mt-8">
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-medium text-zinc-500 hover:bg-zinc-100 transition-all"
            >
              Cancelar
            </button>
            <button 
              onClick={() => onSubmit(type, date, time)}
              disabled={!type || !date || !time || time < '06:00' || time > '23:00'}
              className="flex-1 py-3 rounded-xl font-medium bg-zinc-900 text-white hover:bg-zinc-800 transition-all disabled:opacity-50"
            >
              Confirmar
            </button>
          </div>
          <p className="text-[10px] text-zinc-400 text-center italic">
            * Sujeto a revisión y confirmación del personal.
          </p>
        </div>
      </motion.div>
    </div>
  );
};
