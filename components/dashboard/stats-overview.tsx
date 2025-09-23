'use client';
import { useEffect, useState } from 'react';
import { DashboardStats } from '@/types';

export function StatsOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error('Failed to load stats', e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="p-6">Loading....</div>;
  }

  if (!stats) {
    return <div className="p-6 text-red-600">Failed to load stats.</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="p-4 rounded border bg-white">
        <div className="text-sm text-gray-500">Routers</div>
        <div className="text-2xl font-semibold">{stats.totalRouters}</div>
      </div>
      <div className="p-4 rounded border bg-white">
        <div className="text-sm text-gray-500">Online / Offline</div>
        <div className="text-2xl font-semibold">
          {stats.onlineRouters} / {stats.offlineRouters}
        </div>
      </div>
      <div className="p-4 rounded border bg-white">
        <div className="text-sm text-gray-500">Active Alerts</div>
        <div className="text-2xl font-semibold">{stats.activeAlerts}</div>
      </div>
      <div className="p-4 rounded border bg-white">
        <div className="text-sm text-gray-500">Bandwidth (Mbps)</div>
        <div className="text-2xl font-semibold">{stats.totalBandwidth}</div>
      </div>
    </div>
  );
}