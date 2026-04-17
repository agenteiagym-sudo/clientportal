import React from 'react';
import { TrendingUp, LucideIcon } from 'lucide-react';
import { Card } from './Card';

interface StatProps {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
}

export const Stat = ({ label, value, icon: Icon, trend }: StatProps) => (
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
