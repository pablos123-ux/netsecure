'use client';

import { ReactNode } from 'react';
import { Toaster } from '@/components/ui/toaster';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <main className="p-3 sm:p-4 lg:p-8 w-full max-w-full overflow-x-hidden">
        {children}
      </main>
      <Toaster />
    </div>
  );
}