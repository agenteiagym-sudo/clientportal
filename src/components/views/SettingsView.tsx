import React, { useState } from 'react';
import { Settings, Plus, X, Save, AlertCircle } from 'lucide-react';
import { SystemSettings } from '../../types';
import { motion, AnimatePresence } from 'motion/react';

interface SettingsViewProps {
  settings: SystemSettings | null;
  onUpdate: (reasons: string[]) => void;
}

export const SettingsView = ({ settings, onUpdate }: SettingsViewProps) => {
  const [reasons, setReasons] = useState<string[]>(settings?.appointment_reasons || []);
  const [newReason, setNewReason] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  const handleAddReason = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReason.trim()) return;
    if (reasons.includes(newReason.trim())) return;
    
    setReasons([...reasons, newReason.trim()]);
    setNewReason('');
    setHasChanges(true);
  };

  const handleRemoveReason = (index: number) => {
    const updated = reasons.filter((_, i) => i !== index);
    setReasons(updated);
    setHasChanges(true);
  };

  const handleSave = () => {
    onUpdate(reasons);
    setHasChanges(false);
  };

  return (
    <div className="max-w-4xl space-y-8">
      <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center text-white">
            <Settings size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold">Configuración del Sistema</h3>
            <p className="text-zinc-500 text-sm">Gestiona los parámetros globales de la aplicación</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
            <h4 className="font-bold text-zinc-900 mb-4 flex items-center gap-2">
              Motivos de Citas
            </h4>
            <p className="text-sm text-zinc-500 mb-6">
              Define los motivos que los clientes podrán seleccionar al agendar una nueva cita.
            </p>

            <form onSubmit={handleAddReason} className="flex gap-2 mb-6">
              <input 
                type="text"
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
                placeholder="Nuevo motivo (ej: Evaluación Nutricional)"
                className="flex-1 px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none transition-all"
              />
              <button 
                type="submit"
                className="bg-zinc-900 text-white p-3 rounded-xl hover:bg-zinc-800 transition-all flex items-center gap-2"
              >
                <Plus size={20} />
                <span className="hidden sm:inline font-medium">Agregar</span>
              </button>
            </form>

            <div className="flex flex-wrap gap-2">
              <AnimatePresence>
                {reasons.map((reason, index) => (
                  <motion.div 
                    key={reason}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex items-center gap-2 bg-white border border-zinc-200 px-3 py-2 rounded-lg shadow-sm group hover:border-zinc-900 transition-all"
                  >
                    <span className="text-sm font-medium">{reason}</span>
                    <button 
                      onClick={() => handleRemoveReason(index)}
                      className="text-zinc-400 hover:text-red-500 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
              {reasons.length === 0 && (
                <p className="text-zinc-400 text-sm italic">No hay motivos configurados.</p>
              )}
            </div>
          </div>

          <AnimatePresence>
            {hasChanges && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-xl"
              >
                <div className="flex items-center gap-2 text-amber-800 text-sm">
                  <AlertCircle size={18} />
                  <span>Tienes cambios sin guardar</span>
                </div>
                <button 
                  onClick={handleSave}
                  className="bg-amber-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-amber-700 transition-all flex items-center gap-2"
                >
                  <Save size={16} />
                  Guardar Cambios
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
