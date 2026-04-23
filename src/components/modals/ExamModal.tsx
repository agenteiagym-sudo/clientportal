import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Upload } from 'lucide-react';

interface ExamModalProps {
  onClose: () => void;
  onSubmit: (file: File) => void;
}

export const ExamModal = ({ onClose, onSubmit }: ExamModalProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleSubmit = async () => {
    if (!file || !termsAccepted) return;
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

        <div className="mt-6 flex items-start gap-3 bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
          <input 
            type="checkbox" 
            id="privacy-policy"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900/10 cursor-pointer"
          />
          <label htmlFor="privacy-policy" className="text-[10px] leading-relaxed text-zinc-600 select-none cursor-pointer">
            <span className="font-bold text-zinc-900 block mb-1">Acepto la Política de Privacidad y Tratamiento de Datos.</span>
            Autorizo expresamente a <span className="font-bold">Essential GYM</span> para la recolección y tratamiento de mis datos personales (incluyendo <span className="font-bold">datos sensibles de salud conforme a los Artículos 2 y 8</span>), con el fin de gestionar mi plan de salud. Mis datos serán protegidos bajo los principios de <span className="font-bold">confidencialidad y seguridad (Artículos 4, 5 y 25)</span> de la <span className="font-bold">Ley 81 de 2019 de Panamá</span>, garantizando mis derechos ARCO.
          </label>
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
            disabled={!file || !termsAccepted || isProcessing}
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
};
