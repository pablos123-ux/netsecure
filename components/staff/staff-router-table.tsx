'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Uptime</TableHead>
                <TableHead>Bandwidth</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {routers.map((router) => (
                <TableRow key={router.id}>
                  <TableCell className="font-medium">{router.name}</TableCell>
                  <TableCell>{router.model}</TableCell>
                  <TableCell className="font-mono text-sm">{router.ipAddress}</TableCell>
                  <TableCell>{getStatusBadge(router.status)}</TableCell>
                  <TableCell>{formatUptime(router.uptime)}</TableCell>
                  <TableCell>
                    {router.bandwidth.toFixed(1)} / {router.capacity} Mbps
                  </TableCell>
                  <TableCell>
                    {router.town?.name}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(router)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleViewActivity(router)}>
                        <Activity className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleDelete(router)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}