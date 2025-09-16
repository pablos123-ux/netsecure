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
  image?: string;
}

// Main layout wrapper with theme provider
function AdminLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div
        className="flex min-h-screen bg-background pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
      >
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
  const [user, setUser] = useState<{ id: string; name: string; email: string; role: 'ADMIN' | 'STAFF'; image?: string } | null>(null);
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
            // Sidebar offsets: no left margin on mobile to avoid right gap
            "ml-0 md:ml-64"
          )}
        >
          <main
            className={cn(
              // Responsive padding and safe-area support
              "p-3 sm:p-4 md:p-6",
              // Ensure content doesn't overflow horizontally on small screens
              "w-full max-w-full",
              // Allow vertical scrolling of the content area
              "min-h-screen overflow-y-auto",
              // Respect iOS/Android bottom safe area for sticky elements if any
              "pb-[max(1rem,env(safe-area-inset-bottom))]"
            )}
          >
            {children}
          </main>
        </div>
        <Toaster />
      </SidebarProvider>
    </AdminLayoutWrapper>
  );
}
