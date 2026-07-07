import { Toaster as SonnerToaster } from 'sonner';
import * as React from 'react';

export const Toaster = () => {
  return (
    <SonnerToaster
      theme="dark"
      className="toaster group font-body"
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:bg-surface-container group-[.toaster]:text-on-surface group-[.toaster]:border-white/10 group-[.toaster]:shadow-2xl group-[.toaster]:rounded-xl group-[.toaster]:border-l-4 group-[.toaster]:border-l-primary",
          description: "group-[.toast]:text-on-surface-variant group-[.toast]:text-[11px]",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-on-primary",
          cancelButton: "group-[.toast]:bg-white/5 group-[.toast]:text-on-surface-variant",
        },
      }}
    />
  );
};
