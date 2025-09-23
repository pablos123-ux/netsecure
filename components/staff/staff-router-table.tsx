'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Router } from '@/types';
import { Edit, Trash2, Activity } from 'lucide-react';
import { toast } from 'sonner';

export function StaffRouterTable() {
  const [routers, setRouters] = useState<Router[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRouters();
  }, []);

  const fetchRouters = async () => {
    try {
      const response = await fetch('/api/staff/routers');
      if (response.ok) {
        const data = await response.json();
        setRouters(data.routers);
      }
    } catch (error) {
      console.error('Error fetching routers:', error);
      toast.error('Failed to load routers');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ONLINE':
        return <Badge className="bg-green-100 text-green-800">Online</Badge>;
      case 'OFFLINE':
        return <Badge className="bg-red-100 text-red-800">Offline</Badge>;
      case 'MAINTENANCE':
        return <Badge className="bg-yellow-100 text-yellow-800">Maintenance</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const handleEdit = async (router: Router) => {
    // TODO: Implement edit functionality for staff
    toast.info('Edit functionality coming soon');
  };

  const handleViewActivity = async (router: Router) => {
    // TODO: Implement view activity functionality
    toast.info('View activity functionality coming soon');
  };

  const handleDelete = async (router: Router) => {
    // TODO: Implement delete functionality for staff (may need admin approval)
    toast.info('Delete functionality requires admin approval');
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Routers</CardTitle>
          <CardDescription>Routers in your assigned area</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-muted-foreground">Loading routers...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Routers</CardTitle>
        <CardDescription>Routers in your assigned area</CardDescription>
      </CardHeader>
      <CardContent>
        {routers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No routers found in your assigned area
          </div>
        ) : (
          <div className="space-y-4">
            {routers.map((router) => (
              <div key={router.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-base sm:text-lg truncate">{router.name}</h3>
                    <p className="text-sm text-muted-foreground">{router.model}</p>
                    <p className="text-xs font-mono text-muted-foreground mt-1">{router.ipAddress}</p>
                  </div>
                  <div className="flex flex-col sm:items-end gap-2">
                    {getStatusBadge(router.status)}
                    <div className="text-xs text-muted-foreground">
                      {router.town?.name}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t">
                  <div>
                    <p className="text-xs text-muted-foreground">Uptime</p>
                    <p className="text-sm font-medium">{formatUptime(router.uptime)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Bandwidth</p>
                    <p className="text-sm font-medium">
                      {router.bandwidth.toFixed(1)} / {router.capacity} Mbps
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <div className="mt-1">
                      {getStatusBadge(router.status)}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Actions</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(router)}>
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleViewActivity(router)}>
                        <Activity className="w-3 h-3" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleDelete(router)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}