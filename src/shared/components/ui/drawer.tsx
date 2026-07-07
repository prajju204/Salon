import * as React from 'react';
import { createPortal } from 'react-dom';
import { cn } from "@/shared/utils/cn";

interface DrawerProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

const DrawerContext = React.createContext<{
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
} | null>(null);

export const Drawer: React.FC<DrawerProps> = ({ open, onOpenChange, children }) => {
  return (
    <DrawerContext.Provider value={{ open, onOpenChange }}>
      {children}
    </DrawerContext.Provider>
  );
};

export const DrawerTrigger: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const context = React.useContext(DrawerContext);
  if (!context) throw new Error('DrawerTrigger must be used inside Drawer');

  return (
    <div onClick={() => context.onOpenChange?.(true)} className="inline-block cursor-pointer">
      {children}
    </div>
  );
};

export const DrawerPortal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mounted, setMounted] = React.useState(false);
  
  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {children}
    </div>,
    document.body
  );
};

export const DrawerOverlay = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const context = React.useContext(DrawerContext);
  return (
    <div
      ref={ref}
      onClick={() => context?.onOpenChange?.(false)}
      className={cn(
        'fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in',
        className
      )}
      {...props}
    />
  );
});
DrawerOverlay.displayName = 'DrawerOverlay';

export const DrawerContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const context = React.useContext(DrawerContext);
  
  React.useEffect(() => {
    if (context?.open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [context?.open]);

  if (!context?.open) return null;

  return (
    <DrawerPortal>
      <DrawerOverlay />
      <div
        ref={ref}
        className={cn(
          'fixed z-50 bottom-0 w-full max-w-lg bg-surface-container rounded-t-2xl border-t border-white/10 p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 text-on-surface font-body outline-none pb-8',
          className
        )}
        {...props}
      >
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-white/20" />
        {children}
        <button
          onClick={() => context?.onOpenChange?.(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none text-on-surface-variant cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
          <span className="sr-only">Close</span>
        </button>
      </div>
    </DrawerPortal>
  );
});
DrawerContent.displayName = 'DrawerContent';

export const DrawerHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col space-y-1.5 text-center sm:text-left mb-4',
      className
    )}
    {...props}
  />
);
DrawerHeader.displayName = 'DrawerHeader';

export const DrawerFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col gap-2 mt-6',
      className
    )}
    {...props}
  />
);
DrawerFooter.displayName = 'DrawerFooter';

export const DrawerTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn('font-headline text-lg font-semibold text-on-surface', className)}
    {...props}
  />
));
DrawerTitle.displayName = 'DrawerTitle';

export const DrawerDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-xs text-on-surface-variant', className)}
    {...props}
  />
));
DrawerDescription.displayName = 'DrawerDescription';
