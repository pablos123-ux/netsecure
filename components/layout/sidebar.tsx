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
  const toggleSidebar = () => setIsCollapsed(!isCollapsed);
  
  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleSidebar }}>
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
  };
}

export function Sidebar({ user }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);
  const toggleMobileSidebar = () => setIsMobileOpen(!isMobileOpen);
  
  // Close mobile menu when pathname changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

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
    <SidebarContext.Provider value={{ isCollapsed, toggleSidebar }}>
      {/* Mobile menu button */}
        <div className="lg:hidden fixed top-4 left-4 z-50">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleMobileSidebar}
            className="bg-background shadow-md"
            aria-label={isMobileOpen ? 'Close menu' : 'Open menu'}
          >
            {isMobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>

        {/* Overlay for mobile */}
        {isMobileOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsMobileOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={cn(
            'fixed left-0 top-0 z-40 h-full bg-background border-r transition-all duration-200 ease-in-out',
            'lg:translate-x-0',
            isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0',
            isCollapsed ? 'lg:w-20' : 'lg:w-64',
            'shadow-lg lg:shadow-none' // Add shadow for mobile, remove on desktop
          )}
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className={cn("p-4 border-b border-gray-200 flex items-center justify-between", isCollapsed ? 'flex-col space-y-2 py-4' : 'px-6')}>
              <div className={cn("flex items-center", isCollapsed ? 'flex-col space-y-2' : 'space-x-3')}>
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Router className="w-5 h-5 text-white" />
                </div>
                {!isCollapsed && (
                  <div>
                    <h1 className="text-lg font-semibold text-foreground">
                      Network Manager
                    </h1>
                    <p className="text-xs text-muted-foreground">Rwanda Infrastructure</p>
                  </div>
                )}
              </div>
              <div className={cn("flex items-center space-x-2", isCollapsed ? 'flex-col space-y-2' : 'space-x-2')}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="h-8 w-8"
                >
                  <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="sr-only">Toggle theme</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleSidebar}
                  className={cn("hidden lg:flex h-8 w-8", isCollapsed ? 'mt-2' : '')}
                >
                  {isCollapsed ? <ChevronDown className="h-4 w-4 transform rotate-90" /> : <ChevronDown className="h-4 w-4 -rotate-90" />}
                </Button>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-2 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors',
                      pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/') // Handle sub-routes
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                      isCollapsed ? 'justify-center' : 'px-4',
                      'w-full' // Ensure full width for better touch targets on mobile
                    )}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {!isCollapsed && <span>{item.title}</span>}
                  </Link>
                );
              })}
            </nav>

            {/* User Profile */}
            <div className={cn("p-4 border-t border-gray-200", isCollapsed ? 'flex flex-col items-center' : '')}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn("w-full p-2 h-auto justify-start hover:bg-accent", isCollapsed ? 'justify-center' : '')}
                  >
                    <div className={cn("flex items-center", isCollapsed ? 'flex-col' : 'space-x-3')}>
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarImage src="/placeholder-avatar.jpg" />
                        <AvatarFallback className="bg-blue-100 text-blue-700">
                          {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {!isCollapsed && (
                        <div className="text-left">
                          <p className="text-sm font-medium text-foreground truncate">
                            {user.name}
                          </p>
                          <p className="text-xs text-muted-foreground">{user.role}</p>
                        </div>
                      )}
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => router.push('/profile')}>
                    <User className="w-4 h-4 mr-2" />
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
        </div>
    </SidebarContext.Provider>
  );
}