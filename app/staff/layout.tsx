'use client';

import { useEffect, useState } from 'react';
import { Sidebar, SidebarProvider, useSidebar } from '@/components/layout/sidebar';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useTheme } from '@/components/theme-provider';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User as UserIcon, LogOut, Menu, Search, Bell } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'STAFF';
}

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const userData = await response.json();
        if (userData.role !== 'STAFF') {
          router.push('/admin');
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

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/staff/alerts');
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setAlerts(data.alerts || []);
        } else {
          if (isMounted) setAlerts([]);
        }
      } catch {
        if (isMounted) setAlerts([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, []);

  // (Removed misplaced alerts loading effect; it's now inside Topbar)

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className={`flex min-h-screen overflow-hidden ${theme === 'dark' ? 'dark' : ''}`}>
        <Sidebar user={user} />
        <StaffShell user={user}>
          {children}
        </StaffShell>
      </div>
    </SidebarProvider>
  );
}

function StaffShell({ children, user }: { children: React.ReactNode; user: { id: string; name: string; email: string; role: 'ADMIN' | 'STAFF'; image?: string } }) {
  const { isCollapsed } = useSidebar();
  return (
    <div
      className={cn(
        'flex-1 transition-all duration-300 ease-in-out',
        'ml-0',
        isCollapsed ? 'lg:ml-20' : 'lg:ml-64'
      )}
    >
      <Topbar user={user} />
      <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-background text-foreground min-h-screen">
        {children}
      </main>
    </div>
  );
}

function Topbar({ user }: { user: { id: string; name: string; email: string; role: 'ADMIN' | 'STAFF'; image?: string } }) {
  const { toggleMobileSidebar } = useSidebar();
  const router = useRouter();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-2 px-3 sm:px-4 md:px-6 py-3">
        <div className="md:hidden">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            aria-label="Open menu"
            onClick={toggleMobileSidebar}
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1">
          <div className="relative max-w-xs sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-9"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 px-2 relative" aria-label="Notifications">
                <Bell className="h-5 w-5" />
                {alerts.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 min-w-[1rem] px-1 rounded-full bg-primary text-[10px] text-primary-foreground flex items-center justify-center">
                    {alerts.length}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 sm:w-80 max-h-60 sm:max-h-80">
              {loading ? (
                <div className="p-3 text-sm text-muted-foreground">Loading...</div>
              ) : alerts.length === 0 ? (
                <div className="p-3 text-sm text-muted-foreground">No notifications</div>
              ) : (
                <div className="max-h-60 sm:max-h-80 overflow-auto">
                  {alerts.slice(0,5).map((a) => (
                    <div key={a.id} className="px-3 py-2 text-sm border-b last:border-b-0">
                      <div className="font-medium">{a.type?.replaceAll('_',' ') || 'Alert'}</div>
                      <div className="text-muted-foreground line-clamp-2">{a.message || a.description || 'No details'}</div>
                      <div className="text-xs text-muted-foreground mt-1">{new Date(a.createdAt).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 px-2">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={user.image || ''} />
                  <AvatarFallback>{user.name?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
                <span className="ml-2 inline max-w-[8rem] sm:max-w-none truncate text-sm">{user.name}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => router.push('/staff/profile')}>
                <UserIcon className="w-4 h-4 mr-2" />
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
