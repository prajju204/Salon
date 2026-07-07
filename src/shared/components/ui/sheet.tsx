import * as React from 'react';
import { createPortal } from 'react-dom';
import { cn } from "@/shared/utils/cn";

interface SheetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

const SheetContext = React.createContext<{
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
} | null>(null);

export const Sheet: React.FC<SheetProps> = ({ open, onOpenChange, children }) => {
  return (
    <SheetContext.Provider value={{ open, onOpenChange }}>
      {children}
    </SheetContext.Provider>
  );
};

export const SheetTrigger: React.FC<{ children: React.ReactNode; asChild?: boolean }> = ({ children }) => {
  const context = React.useContext(SheetContext);
  if (!context) throw new Error('SheetTrigger must be used inside Sheet');

  return (
    <div onClick={() => context.onOpenChange?.(true)} className="inline-block cursor-pointer">
      {children}
    </div>
  );
};

export const SheetPortal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mounted, setMounted] = React.useState(false);
  
  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      {children}
    </div>,
    document.body
  );
};

export const SheetOverlay = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const context = React.useContext(SheetContext);
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
SheetOverlay.displayName = 'SheetOverlay';

export const SheetContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { side?: 'right' | 'bottom' }
>(({ className, children, side = 'right', ...props }, ref) => {
  const context = React.useContext(SheetContext);
  
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

  const sideStyles = {
    right: 'h-full w-full max-w-md border-l border-white/10 animate-in slide-in-from-right duration-300',
    bottom: 'h-[80vh] w-full border-t border-white/10 animate-in slide-in-from-bottom duration-300'
  };

  const responsiveStyles = side === 'right' 
    ? 'right-0 top-0 h-full w-full sm:max-w-md border-l border-white/10 slide-in-from-right'
    : 'bottom-0 left-0 w-full h-[80vh] border-t border-white/10 slide-in-from-bottom';

  return (
    <SheetPortal>
      <SheetOverlay />
      <div
        ref={ref}
        className={cn(
          'fixed z-50 bg-surface-container p-6 shadow-2xl transition ease-in-out text-on-surface font-body outline-none',
          responsiveStyles,
          className
        )}
        {...props}
      >
        {children}
        <button
          onClick={() => context?.onOpenChange?.(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none text-on-surface-variant cursor-pointer"
        >
          <span className="material-symbols-outlined text-[22px]">close</span>
          <span className="sr-only">Close</span>
        </button>
      </div>
    </SheetPortal>
  );
});
SheetContent.displayName = 'SheetContent';

export const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col space-y-2 text-left pb-4 border-b border-white/5 mb-4',
      className
    )}
    {...props}
  />
);
SheetHeader.displayName = 'SheetHeader';

export const SheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4 border-t border-white/5 mt-4',
      className
    )}
    {...props}
  />
);
SheetFooter.displayName = 'SheetFooter';

export const SheetTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn('font-headline text-lg font-semibold text-on-surface', className)}
    {...props}
  />
));
SheetTitle.displayName = 'SheetTitle';

export const SheetDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-xs text-on-surface-variant', className)}
    {...props}
  />
));
SheetDescription.displayName = 'SheetDescription';
