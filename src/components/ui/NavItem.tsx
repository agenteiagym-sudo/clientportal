import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface NavItemProps {
  active: boolean;
  onClick: () => void;
  icon: LucideIcon;
  label: string;
}

export const NavItem = ({ active, onClick, icon: Icon, label }: NavItemProps) => {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium",
        active 
          ? "bg-zinc-900 text-white shadow-lg shadow-zinc-200" 
          : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
      )}
    >
      <Icon size={20} />
      <span>{label}</span>
    </button>
  );
};
