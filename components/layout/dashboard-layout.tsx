'use client';

import { useEffect, useState } from 'react';
import { Sidebar } from './sidebar';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'STAFF';
}

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      toast.error('Failed to load user data');
      window.location.href = '/login';
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar user={user} />
      <div className="lg:ml-64">
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}