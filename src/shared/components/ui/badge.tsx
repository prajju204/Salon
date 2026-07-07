import * as React from 'react';
import { cn } from "@/shared/utils/cn";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'gold' | 'success' | 'info' | 'warning';
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const baseStyles = 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2';
  
  const variants = {
    default: 'bg-primary/20 border-primary/30 text-primary',
    gold: 'bg-primary/15 border-primary/30 text-primary shadow-[0_0_10px_rgba(242,202,80,0.05)]',
    secondary: 'bg-surface-container-high border-white/5 text-on-surface-variant',
    destructive: 'bg-red-950/20 border border-red-500/30 text-red-400',
    success: 'bg-green-950/20 border border-green-500/30 text-green-400',
    info: 'bg-blue-950/20 border border-blue-500/30 text-blue-400',
    warning: 'bg-yellow-950/20 border border-yellow-500/30 text-yellow-400',
    outline: 'border border-white/20 text-on-surface'
  };

  return (
    <div className={cn(baseStyles, variants[variant], className)} {...props} />
  );
}

export { Badge };
