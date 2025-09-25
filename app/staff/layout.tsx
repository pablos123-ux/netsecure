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
import { User as UserIcon, LogOut, Menu, Search, Bell, Check } from 'lucide-react';
import { authClient } from '@/lib/auth-client';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'STAFF';
  image?: string;
  lastLogin?: Date | null;
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
      const response = await authClient.fetchWithAuth('/api/auth/me', {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      if (response.ok) {
        const userData = await response.json();
        if (userData.role !== 'STAFF') {
          router.push('/admin');
          return;
        }
        setUser(userData);
      } else if (response.status === 401) {
        // Unauthorized - redirect to login
        router.push('/login');
      } else {
        // Other error - show error but don't redirect immediately
        console.error('Error fetching user data:', response.status);
        toast.error('Failed to load user data');
        // Wait a bit before redirecting to prevent flashing
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      toast.error('Failed to load user data');
      // Wait a bit before redirecting to prevent flashing
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  // Notifications are loaded inside Topbar via activity API

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading staff dashboard...</p>
        </div>
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
      <Topbar user={user} key={user.id} />
      <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-background text-foreground min-h-screen">
        {children}
      </main>
    </div>
  );
}

function Topbar({ user: initialUser }: { user: { id: string; name: string; email: string; role: 'ADMIN' | 'STAFF'; image?: string; lastLogin?: Date | null } }) {
  const { toggleMobileSidebar } = useSidebar();
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<string>('');

  // Load notifications with real-time updates
  useEffect(() => {
    let isMounted = true;
    let intervalId: NodeJS.Timeout;

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
      } catch (error) {
        console.error('Error loading notifications:', error);
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
                  <AvatarImage src={initialUser.image || ''} />
                  <AvatarFallback>{initialUser.name?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
                <span className="ml-2 inline max-w-[8rem] sm:max-w-none truncate text-sm">{initialUser.name}</span>
                {initialUser.lastLogin && (
                  <span className="text-xs text-muted-foreground ml-1">
                    (Last: {new Date(initialUser.lastLogin).toLocaleDateString()})
                  </span>
                )}
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
