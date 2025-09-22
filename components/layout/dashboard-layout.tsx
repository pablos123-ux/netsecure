'use client';

import { ReactNode } from 'react';
import { Toaster } from '@/components/ui/toaster';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex flex-col min-h-screen">
        <main className="flex-1 w-full overflow-x-hidden px-2 sm:px-3 md:px-4 lg:px-6 py-3 sm:py-4">
          <div className="max-w-[2000px] mx-auto">
            {children}
          </div>
        </main>
      </div>
      <Toaster />
    </div>
  );
}