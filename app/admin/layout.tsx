'use client';

import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from 'next-themes';
import '@/app/globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

// Import the sidebar context from the sidebar component
import { SidebarProvider, useSidebar } from '@/components/layout/sidebar';
import { cn } from '@/lib/utils';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'STAFF';
}

// Main layout wrapper with theme provider
function AdminLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="flex min-h-screen bg-background">
        {children}
      </div>
    </ThemeProvider>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<{ id: string; name: string; email: string; role: 'ADMIN' | 'STAFF' } | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const userData = await response.json();
        if (userData.role !== 'ADMIN') {
          router.push('/staff');
          return;
        }
        setUser(userData);
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      toast.error('Failed to load user data');
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <AdminLayoutWrapper>
      <SidebarProvider>
        {user && <Sidebar user={user} />}
        <div 
          className={cn(
            "flex-1 transition-all duration-300 ease-in-out",
            "ml-16 md:ml-64"
          )}
        >
          <main className="p-4 md:p-6 w-full max-w-[calc(100vw-4rem)] md:max-w-[calc(100vw-16rem)]">
            {children}
          </main>
        </div>
        <Toaster />
      </SidebarProvider>
    </AdminLayoutWrapper>
  );
}
