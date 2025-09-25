'use client';

import { useEffect, useRef, useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from 'next-themes';
import '@/app/globals.css';
import { Inter } from 'next/font/google';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User as UserIcon, LogOut, Menu, Search, Bell, Check } from 'lucide-react';
import { authClient } from '@/lib/auth-client';

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

function AdminShell({ children, user }: { children: React.ReactNode; user: { id: string; name: string; email: string; role: 'ADMIN' | 'STAFF'; image?: string } }) {
  const { isCollapsed } = useSidebar();
  return (
    <div
      className={cn(
        "flex-1 transition-all duration-300 ease-in-out",
        // Sidebar offsets: 0 on mobile (overlay), collapsed vs expanded on lg+
        "ml-0",
        isCollapsed ? "lg:ml-20" : "lg:ml-64"
      )}
    >
      {/* Top Navigation Bar */}
      <Topbar user={user} />
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
  );
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
  const isMounted = useRef(true);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    fetchUser();
    return () => {
      isMounted.current = false;
      if (controllerRef.current) controllerRef.current.abort();
    };
  }, []);

  const fetchUser = async () => {
    try {
      if (controllerRef.current) controllerRef.current.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      
      const response = await authClient.fetchWithAuth('/api/auth/me', { 
        signal: controller.signal 
      });
      
      if (response.ok) {
        const userData = await response.json();
        if (userData.role !== 'ADMIN') {
          router.push('/staff');
          return;
        }
        if (isMounted.current) setUser(userData);
      } else {
        router.push('/login');
      }
    } catch (error) {
      if ((error as any)?.name === 'AbortError') return;
      console.error('Error fetching user:', error);
      toast.error('Failed to load user data');
      router.push('/login');
    } finally {
      if (isMounted.current) setLoading(false);
      controllerRef.current = null;
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
        {user && (
          <>
            <Sidebar user={user} />
            <AdminShell user={user}>
              {children}
            </AdminShell>
          </>
        )}
      </SidebarProvider>
    </AdminLayoutWrapper>
  );
}

function Topbar({ user }: { user: { id: string; name: string; email: string; role: 'ADMIN' | 'STAFF'; image?: string } }) {
  const { toggleMobileSidebar } = useSidebar();
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<string>('');

  // Load notifications with real-time updates
  useEffect(() => {
    let isMounted = true;
    let intervalId: any;

    const loadNotifications = async () => {
      try {
        setLoading(true);
        const url = lastCheckTime 
          ? `/api/notifications?since=${lastCheckTime}&limit=10`
          : `/api/notifications?limit=10`;
        
        const res = await authClient.fetchWithAuth(url);
        if (!isMounted) return;
        
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
          setLastCheckTime(data.lastUpdated);
        } else {
          setNotifications([]);
          setUnreadCount(0);
        }
      } catch (e) {
        if (isMounted) {
          setNotifications([]);
          setUnreadCount(0);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    // Load immediately
    loadNotifications();
    
    // Set up polling every 10 seconds for real-time updates
    intervalId = setInterval(loadNotifications, 10000);

    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [lastCheckTime]);

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await authClient.fetchWithAuth('/api/notifications', {
        method: 'POST',
        body: JSON.stringify({ action: 'markAllAsRead' })
      });
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await authClient.fetchWithAuth('/api/auth/logout', { method: 'POST' });
      authClient.clearSession();
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
          <div className="relative max-w-[9rem] sm:max-w-xs md:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-9 h-8 md:h-9 text-sm"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 px-2 relative" aria-label="Notifications">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 min-w-[1rem] px-1 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 sm:w-80 max-h-60 sm:max-h-80">
              <div className="p-2 border-b">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Notifications</span>
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="h-6 px-2 text-xs"
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Mark all read
                    </Button>
                  )}
                </div>
              </div>
              {loading ? (
                <div className="p-3 text-sm text-muted-foreground">Loading...</div>
              ) : notifications.length === 0 ? (
                <div className="p-3 text-sm text-muted-foreground">No notifications</div>
              ) : (
                <div className="max-h-60 sm:max-h-80 overflow-auto">
                  {notifications.map((n: any) => (
                    <div key={n.id} className={`px-3 py-2 text-sm border-b last:border-b-0 ${!n.read ? 'bg-blue-50 dark:bg-blue-950' : ''}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{n.title}</div>
                          <div className="text-muted-foreground line-clamp-2">{n.message}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {new Date(n.timestamp).toLocaleString()}
                          </div>
                        </div>
                        {!n.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-1 flex-shrink-0"></div>
                        )}
                      </div>
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
              <DropdownMenuItem onClick={() => router.push(user.role === 'ADMIN' ? '/admin/profile' : '/staff/profile')}>
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
