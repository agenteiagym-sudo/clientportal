import React from 'react';
import { TrendingUp, AlertCircle } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts';
import { UserProfile, ProgressData } from '../../types';
import { Card } from '../ui/Card';
import { Stat } from '../ui/Stat';
import { cn } from '../../lib/utils';

interface DashboardViewProps {
  progress: ProgressData[];
  profile: UserProfile | null;
}

export const DashboardView = ({ progress, profile }: DashboardViewProps) => {
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
      {/* Saludo Personalizado */}
      <div className="mb-2">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
          ¡Hola, {profile?.full_name?.split(' ')[0] || 'Atleta'}! 👋
        </h1>
        <p className="text-zinc-500 mt-1">
          Qué bueno verte de nuevo. Aquí tienes un resumen de tu progreso.
        </p>
      </div>

      {/* Datos del Administrador */}
      {profile && (
        <div className="space-y-6">
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
                  <span className="text-lg font-bold text-zinc-900">
                    {profile.plan_price ? `$${parseFloat(profile.plan_price).toFixed(2)}` : '$0.00'}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">{profile.plan_details || 'Contacta a administración para más detalles sobre tu plan.'}</p>
                <div className="pt-2 flex justify-between items-end">
                  <span className={cn(
                    "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                    profile.is_active ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                  )}>
                    {profile.is_active ? 'Suscripción Activa' : 'Suscripción Inactiva'}
                  </span>
                  {profile.membership_expires_at && (
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Vence el</p>
                      <p className="text-sm font-bold text-zinc-900">
                        {new Date(profile.membership_expires_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Security Note */}
          <div className="flex items-center gap-3 p-4 bg-zinc-50 border border-zinc-100 rounded-2xl">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <AlertCircle size={18} className="text-zinc-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                Seguridad de Datos
                <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[8px] rounded-full">Protegido</span>
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">
                Tus datos médicos y personales están protegidos por protocolos de alta seguridad. Solo tú y tu nutricionista autorizado tienen acceso a esta información confidencial.
              </p>
            </div>
          </div>
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
};
