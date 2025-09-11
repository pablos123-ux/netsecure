'use client';

import { useEffect } from 'react';
import { Toaster } from 'sonner';
import { StatsOverview } from '@/components/dashboard/stats-overview';
import { BandwidthChart } from '@/components/dashboard/bandwidth-chart';
import { UsersTable } from '@/components/dashboard/users-table';
import { ActivityLog } from '@/components/dashboard/activity-log';

export default function Dashboard() {
  useEffect(() => {
    // Set page title
    document.title = 'pfSense Dashboard - Internet Monitoring & Control';
  }, []);

  useEffect(() => {
    // Auto-refresh page every 5 minutes for real-time updates
    const interval = setInterval(() => {
      // Trigger a soft refresh of components instead of full page reload
      window.dispatchEvent(new Event('dashboard-refresh'));
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-3xl font-bold text-foreground">
            pfSense Dashboard
          </h1>
          <p className="text-muted-foreground">
            Internet Monitoring & Control System - Real-time Network Management
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats Overview */}
        <StatsOverview />
        
        {/* Charts Section */}
        <div className="grid gap-6 lg:grid-cols-2">
          <BandwidthChart />
          <ActivityLog />
        </div>
        
        {/* Users Management */}
        <UsersTable />
      </main>
      
      {/* Footer */}
      <footer className="border-t bg-card mt-12">
        <div className="container mx-auto px-4 py-4 text-center text-sm text-muted-foreground">
          <p>pfSense Dashboard v1.0 - Built with Next.js, Prisma & PostgreSQL</p>
          <p className="mt-1">
            Last updated: {new Date().toLocaleString()}
          </p>
        </div>
      </footer>
    </div>
  );
}