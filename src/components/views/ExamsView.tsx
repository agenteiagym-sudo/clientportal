import React from 'react';
import { Upload, AlertCircle, Trash2 } from 'lucide-react';
import { Exam } from '../../types';
import { Card } from '../ui/Card';

interface ExamsViewProps {
  exams: Exam[];
  onUpload: () => void;
  onDelete?: (examId: string, fileUrl: string) => void;
}

export const ExamsView = ({ exams, onUpload, onDelete }: ExamsViewProps) => {
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
            <Card key={exam.id} className="hover:border-zinc-900 transition-all cursor-pointer group relative">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-zinc-50 rounded-xl text-zinc-400 group-hover:bg-zinc-900 group-hover:text-white transition-all">
                    <AlertCircle size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-900">{exam.file_name}</h4>
                    <p className="text-xs text-zinc-500">{exam.date || new Date(exam.created_at).toLocaleDateString('es-ES')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {exam.file_url && (
                    <a 
                      href={exam.file_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 bg-zinc-100 rounded-lg text-zinc-500 hover:bg-zinc-900 hover:text-white transition-all"
                      onClick={(e) => e.stopPropagation()}
                      title="Ver archivo"
                    >
                      <Upload size={16} />
                    </a>
                  )}
                  {onDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(exam.id, exam.file_url || '');
                       }}
                      className="p-2 bg-zinc-100 rounded-lg text-red-500 hover:bg-red-500 hover:text-white transition-all"
                      title="Eliminar examen"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
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

      {/* Security Note for Medical Data */}
      <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex items-start gap-4">
        <div className="mt-1 p-2 bg-white rounded-xl shadow-sm">
          <AlertCircle size={18} className="text-emerald-600" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-emerald-900 flex items-center gap-2">
            Confidencialidad Médica
            <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] rounded-full uppercase">Encriptado</span>
          </h4>
          <p className="text-xs text-emerald-800/70 mt-1 leading-relaxed">
            Tus exámenes y datos médicos se almacenan de forma segura cumpliendo con los estándares de privacidad más estrictos. Esta información es privada y solo accesible para ti y tu nutricionista autorizado.
          </p>
        </div>
      </div>
    </div>
  );
};
