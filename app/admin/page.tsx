'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { AdminStatsChart } from '@/components/admin/admin-stats-chart';
import { RecentActivity } from '@/components/admin/recent-activity';
import { 
  Users, 
  Router, 
  MapPin, 
  AlertTriangle, 
  TrendingUp, 
  Activity,
  Shield,
  Wifi,
  RefreshCw,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardStats } from '@/types';

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [isCached, setIsCached] = useState(false);
  const isMounted = useRef(true);
  const currentController = useRef<AbortController | null>(null);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 15000); // Refresh every 15 seconds for faster updates
    return () => {
      isMounted.current = false;
      clearInterval(interval);
      if (currentController.current) {
        currentController.current.abort();
      }
    };
  }, []);

  const fetchStats = async () => {
    try {
      // Abort any in-flight request before starting a new one
      if (currentController.current) {
        currentController.current.abort();
      }
      const controller = new AbortController();
      currentController.current = controller;
      const startTime = performance.now();
      const response = await fetch('/api/admin/stats', {
        cache: 'no-store', // Ensure fresh data
        headers: {
          'Cache-Control': 'no-cache',
        },
        signal: controller.signal,
      });
      
      const endTime = performance.now();
      console.log(`Stats fetch took ${Math.round(endTime - startTime)}ms`);
      
      if (response.ok) {
        const data = await response.json();
        if (isMounted.current) {
          setStats(data);
          setIsCached(data.cached || false);
          setLastRefresh(new Date());
        }
        
        // Show warning if using cached data
        if (data.warning) {
          console.warn('Stats API Warning:', data.warning);
        }
      } else if (response.status === 503) {
        // Handle service unavailable gracefully
        const errorData = await response.json();
        if (errorData.warning) {
          console.warn('Database unavailable, using fallback data');
        }
      }
    } catch (error) {
      // Ignore abort errors which are expected during navigation/cleanup
      if ((error as any)?.name === 'AbortError') return;
      console.error('Error fetching stats:', error);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
      // Clear controller reference if this request finished
      currentController.current = null;
    }
  };

  const refreshStats = async () => {
    setLoading(true);
    try {
      // Clear cache first
      await fetch('/api/admin/stats/refresh', { method: 'POST' });
      // Then fetch fresh data
      await fetchStats();
    } catch (error) {
      console.error('Error refreshing stats:', error);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-3 sm:gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl xs:text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
            <p className="text-sm xs:text-base text-muted-foreground">Network Management System Overview</p>
          </div>
          
          <div className="flex flex-col xs:flex-row items-start xs:items-center gap-2 sm:gap-3">
            {lastRefresh && (
              <div className="flex items-center gap-2 text-xs xs:text-sm text-muted-foreground">
                <Clock className="w-3.5 h-3.5 xs:w-4 xs:h-4 flex-shrink-0" />
                <span className="whitespace-nowrap">Updated {lastRefresh.toLocaleTimeString()}</span>
                {isCached && (
                  <span className="px-1.5 py-0.5 xs:px-2 xs:py-1 bg-yellow-100 text-yellow-800 rounded-full text-[10px] xs:text-xs">
                    Cached
                  </span>
                )}
              </div>
            )}
            
            <Button 
              onClick={refreshStats} 
              disabled={loading}
              variant="outline" 
              size="sm"
              className="w-full xs:w-auto flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 xs:w-4 xs:h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
              <CardTitle className="text-xs xs:text-sm font-medium">Total Routers</CardTitle>
              <Router className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-xl xs:text-2xl font-bold">{stats?.totalRouters || 0}</div>
              <p className="text-xs text-muted-foreground mt-0.5">Across all locations</p>
            </CardContent>
          </Card>
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
              <CardTitle className="text-xs xs:text-sm font-medium">Active Users</CardTitle>
              <Users className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-xl xs:text-2xl font-bold">{stats?.activeUsers || 0}</div>
              <p className="text-xs text-muted-foreground mt-0.5">Currently online</p>
            </CardContent>
          </Card>
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
              <CardTitle className="text-xs xs:text-sm font-medium">Locations</CardTitle>
              <MapPin className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-xl xs:text-2xl font-bold">{stats?.locations || 0}</div>
              <p className="text-xs text-muted-foreground mt-0.5">Active locations</p>
            </CardContent>
          </Card>
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
              <CardTitle className="text-xs xs:text-sm font-medium">Alerts</CardTitle>
              <AlertTriangle className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-xl xs:text-2xl font-bold">{stats?.activeAlerts || 0}</div>
              <p className="text-xs text-muted-foreground mt-0.5">Active issues</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-3 sm:gap-4">
          <div className="lg:col-span-4">
            <Card className="h-full">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-lg sm:text-xl">Network Status</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Current status of all network components</CardDescription>
              </CardHeader>
              <CardContent className="p-2 sm:p-4 pt-0">
                <div className="h-[300px] sm:h-[350px] md:h-[400px]">
                  <AdminStatsChart />
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-3">
            <Card className="h-full">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-lg sm:text-xl">Recent Activity</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Latest system events and changes</CardDescription>
              </CardHeader>
              <CardContent className="p-2 sm:p-4 pt-0">
                <div className="h-[300px] sm:h-[350px] md:h-[400px] overflow-y-auto">
                  <RecentActivity />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                Network Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Average Uptime</span>
                  <span className="text-sm font-medium">{stats?.averageUptime || 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Bandwidth</span>
                  <span className="text-sm font-medium">{stats?.totalBandwidth || 0} Mbps</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Activity className="w-5 h-5 mr-2 text-blue-600" />
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Online Rate</span>
                  <span className="text-sm font-medium text-green-600">
                    {stats?.totalRouters ? Math.round((stats.onlineRouters / stats.totalRouters) * 100) : 0}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">System Status</span>
                  <span className="text-sm font-medium text-green-600">Operational</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Shield className="w-5 h-5 mr-2 text-purple-600" />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Active Sessions</span>
                  <span className="text-sm font-medium">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Blocked Users</span>
                  <span className="text-sm font-medium">0</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}