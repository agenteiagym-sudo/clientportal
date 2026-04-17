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
};
