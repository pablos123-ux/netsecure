'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  LayoutDashboard, 
  Users, 
  MapPin, 
  Router, 
  UserCheck, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  ChevronDown,
  User,
  Shield,
  Sun,
  Moon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';

// Create context for sidebar state
type SidebarContextType = {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  isMobileOpen: boolean;
  toggleMobileSidebar: () => void;
  closeMobileSidebar: () => void;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);
  const toggleMobileSidebar = () => setIsMobileOpen((v) => !v);
  const closeMobileSidebar = () => setIsMobileOpen(false);

  useEffect(() => {
    // Close mobile drawer on route change
    setIsMobileOpen(false);
  }, [pathname]);

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleSidebar, isMobileOpen, toggleMobileSidebar, closeMobileSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
}

interface SidebarProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: 'ADMIN' | 'STAFF';
    image?: string;
  };
}

export function Sidebar({ user }: SidebarProps) {
  const { isCollapsed, toggleSidebar, isMobileOpen } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();
  const { toggleMobileSidebar } = useSidebar();

  // On mobile, when the drawer is open, treat the sidebar as expanded so titles/text show
  const isCollapsedEffective = isCollapsed && !isMobileOpen;

  const adminNavItems = [
    {
      title: 'Dashboard',
      href: '/admin',
      icon: LayoutDashboard,
    },
    {
      title: 'Staff Management',
      href: '/admin/staff',
      icon: UserCheck,
    },
    {
      title: 'Locations',
      href: '/admin/locations',
      icon: MapPin,
    },
    {
      title: 'Routers',
      href: '/admin/routers',
      icon: Router,
    },
    {
      title: 'User Access',
      href: '/admin/users',
      icon: Users,
    },
    {
      title: 'System Settings',
      href: '/admin/settings',
      icon: Settings,
    },
  ];

  const staffNavItems = [
    {
      title: 'Dashboard',
      href: '/staff',
      icon: LayoutDashboard,
    },
    {
      title: 'Router Management',
      href: '/staff/routers',
      icon: Router,
    },
    {
      title: 'User Access',
      href: '/staff/users',
      icon: Users,
    },
    {
      title: 'Alerts',
      href: '/staff/alerts',
      icon: Shield,
    },
  ];

  const navItems = user.role === 'ADMIN' ? adminNavItems : staffNavItems;

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  const { theme, setTheme } = useTheme();

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleSidebar, isMobileOpen, toggleMobileSidebar, closeMobileSidebar: () => {} }}>
        {/* Overlay for mobile */}
        {isMobileOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={toggleMobileSidebar}
          />
        )}

        {/* Sidebar */}
        <div
          className={cn(
            // Position and size: push below topbar on mobile, full height on desktop
            'fixed left-0 top-14 lg:top-0 z-40 h-[calc(100vh-3.5rem)] lg:h-full bg-background border-r transition-all duration-200 ease-in-out',
            'lg:translate-x-0',
            isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0',
            isCollapsedEffective ? 'lg:w-20' : 'lg:w-64',
            'shadow-lg lg:shadow-none', // Add shadow for mobile, remove on desktop
            'pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]'
          )}
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className={cn("p-3 sm:p-4 border-b border-gray-200 flex items-center justify-between", isCollapsedEffective ? 'flex-col space-y-2 py-4' : 'px-6')}>
              <div className={cn("flex items-center", isCollapsedEffective ? 'flex-col space-y-2' : 'space-x-3')}>
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Router className="w-5 h-5 text-white" />
                </div>
                {(!isCollapsedEffective) && (
                  <div>
                    <h1 className="text-base sm:text-lg font-semibold text-foreground">
                      Network Manager
                    </h1>
                    <p className="text-[11px] sm:text-xs text-muted-foreground">Rwanda Infrastructure</p>
                  </div>
                )}
              </div>
              <div className={cn("flex items-center space-x-2", isCollapsed ? 'flex-col space-y-2' : 'space-x-2')}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="h-9 w-9"
                >
                  <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="sr-only">Toggle theme</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleSidebar}
                  className={cn("hidden lg:flex h-9 w-9", isCollapsedEffective ? 'mt-2' : '')}
                >
                  {isCollapsedEffective ? <ChevronDown className="h-4 w-4 transform rotate-90" /> : <ChevronDown className="h-4 w-4 -rotate-90" />}
                </Button>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center px-4 py-3 text-[15px] sm:text-sm font-medium rounded-md transition-colors',
                      pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/') // Handle sub-routes
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                      isCollapsedEffective ? 'justify-center' : 'px-4',
                      'w-full'
                    )}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0 mr-3" />
                    {!isCollapsedEffective && <span>{item.title}</span>}
                  </Link>
                );
              })}
            </nav>

            {/* Footer: profile controls moved to Topbar */}
            <div className={cn("p-3 sm:p-4 border-t border-gray-200", isCollapsed ? 'text-center' : '')}>
              {!isCollapsed && (
                <p className="text-xs text-muted-foreground">Signed in as {user.role}</p>
              )}
            </div>
          </div>
        </div>
    </SidebarContext.Provider>
  );
}