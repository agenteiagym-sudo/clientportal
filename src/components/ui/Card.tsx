import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  key?: React.Key;
  onClick?: () => void;
}

export const Card = ({ children, className, title, onClick }: CardProps) => (
  <div 
    onClick={onClick}
    className={cn(
      "bg-white rounded-2xl p-6 shadow-sm border border-black/5", 
      onClick && "cursor-pointer active:scale-[0.98] transition-all",
      className
    )}
  >
    {title && <h3 className="text-sm font-medium text-zinc-500 mb-4 uppercase tracking-wider">{title}</h3>}
    {children}
  </div>
);
