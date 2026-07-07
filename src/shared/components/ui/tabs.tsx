import * as React from 'react';
import { cn } from "@/shared/utils/cn";

interface TabsContextProps {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextProps | null>(null);

export const Tabs = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value: string;
    onValueChange: (value: string) => void;
  }
>(({ value, onValueChange, className, ...props }, ref) => {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div ref={ref} className={cn('w-full', className)} {...props} />
    </TabsContext.Provider>
  );
});
Tabs.displayName = 'Tabs';

export const TabsList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'inline-flex h-10 items-center justify-center rounded-xl bg-surface-container p-1 text-on-surface-variant border border-white/5',
        className
      )}
      {...props}
    />
  );
});
TabsList.displayName = 'TabsList';

export const TabsTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }
>(({ value, className, onClick, ...props }, ref) => {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error('TabsTrigger must be used inside Tabs');
  
  const isActive = context.value === value;

  return (
    <button
      ref={ref}
      onClick={(e) => {
        context.onValueChange(value);
        if (onClick) onClick(e);
      }}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all duration-200 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
        isActive
          ? 'bg-primary/10 text-primary shadow-[0_0_15px_rgba(242,202,80,0.1)] border border-primary/20'
          : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5 border border-transparent',
        className
      )}
      {...props}
    />
  );
});
TabsTrigger.displayName = 'TabsTrigger';

export const TabsContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ value, className, ...props }, ref) => {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error('TabsContent must be used inside Tabs');
  
  const isActive = context.value === value;

  if (!isActive) return null;

  return (
    <div
      ref={ref}
      className={cn(
        'mt-4 focus-visible:outline-none',
        className
      )}
      {...props}
    />
  );
});
TabsContent.displayName = 'TabsContent';
