import * as React from 'react';
import { cn } from "@/shared/utils/cn";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'gold';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-xs font-bold uppercase tracking-widest transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] cursor-pointer';
    
    const variants = {
      default: 'bg-primary text-on-primary shadow-lg shadow-primary/20 hover:opacity-90',
      gold: 'bg-primary text-on-primary shadow-lg shadow-primary/20 hover:opacity-90',
      destructive: 'bg-red-500 text-white shadow-sm hover:bg-red-600',
      outline: 'border border-primary/30 bg-transparent text-primary hover:bg-primary/10 hover:border-primary/50',
      secondary: 'bg-surface-container border border-white/5 text-on-surface hover:bg-surface-container-high',
      ghost: 'text-on-surface hover:bg-white/5 hover:text-white',
      link: 'text-primary underline-offset-4 hover:underline'
    };

    const sizes = {
      default: 'h-11 px-6 py-2.5',
      sm: 'h-9 rounded-md px-4 py-2',
      lg: 'h-14 rounded-xl px-10 py-4 text-sm',
      icon: 'h-10 w-10 p-0 rounded-full'
    };

    return (
      <button
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };
