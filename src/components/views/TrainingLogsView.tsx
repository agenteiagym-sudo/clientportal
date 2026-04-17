import React from 'react';
import { TrendingUp, Calendar } from 'lucide-react';
import { TrainingLog } from '../../types';
import { Card } from '../ui/Card';

interface TrainingLogsViewProps {
  logs: TrainingLog[];
}

export const TrainingLogsView = ({ logs }: TrainingLogsViewProps) => {
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
};
