'use client';

import { ReactNode } from 'react';
import { Toaster } from '@/components/ui/toaster';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <main className="p-4 lg:p-8">
        {children}
      </main>
      <Toaster />
    </div>
  );
}