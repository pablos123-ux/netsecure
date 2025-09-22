'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Router, Town, District, Province } from '@/types';
import { Plus, Edit, Trash2, Router as RouterIcon, ArrowLeft, Activity, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function RouterManagement() {
  const [routers, setRouters] = useState<Router[]>([]);
  const [towns, setTowns] = useState<Town[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRouter, setEditingRouter] = useState<Router | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    model: '',
    ipAddress: '',
    macAddress: '',
    capacity: '',
    location: '',
    townId: '',
    status: 'OFFLINE',
    bandwidthLimit: '',
    bandwidthLimitEnabled: false
  });
  
  const [connectedUsers, setConnectedUsers] = useState<{routerId: string, count: number}[]>([]);
  const [bandwidthUsage, setBandwidthUsage] = useState<{routerId: string, usage: number}[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchConnectedUsers, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);
  
  const fetchConnectedUsers = async () => {
    try {
      const [usersRes, usageRes] = await Promise.all([
        fetch('/api/admin/connected-users/count-by-router'),
        fetch('/api/admin/bandwidth-usage')
      ]);
      
      if (usersRes.ok) {
        const data = await usersRes.json();
        setConnectedUsers(data);
      }
      
      if (usageRes.ok) {
        const data = await usageRes.json();
        setBandwidthUsage(data);
      }
    } catch (error) {
      console.error('Error fetching connected users or bandwidth data:', error);
    }
  };
  
  const getConnectedUsersCount = (routerId: string) => {
    const router = connectedUsers.find(r => r.routerId === routerId);
    return router ? router.count : 0;
  };
  
  const getBandwidthUsage = (routerId: string) => {
    const usage = bandwidthUsage.find(r => r.routerId === routerId);
    return usage ? usage.usage : 0;
  };
  
  const getBandwidthPercentage = (router: Router) => {
    const usage = getBandwidthUsage(router.id);
    return Math.min(100, Math.round((usage / (router.capacity || 1)) * 100));
  };

  const fetchData = async () => {
    try {
      const [routersRes, townsRes, districtsRes, provincesRes] = await Promise.all([
        fetch('/api/admin/routers'),
        fetch('/api/admin/towns'),
        fetch('/api/admin/districts'),
        fetch('/api/admin/provinces')
      ]);

      if (routersRes.ok && townsRes.ok && districtsRes.ok && provincesRes.ok) {
        const [routersData, townsData, districtsData, provincesData] = await Promise.all([
          routersRes.json(),
          townsRes.json(),
          districtsRes.json(),
          provincesRes.json()
        ]);
        setRouters(routersData.routers);
        setTowns(townsData.towns);
        setDistricts(districtsData.districts);
        setProvinces(provincesData.provinces);
      }
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingRouter ? `/api/admin/routers/${editingRouter.id}` : '/api/admin/routers';
      const method = editingRouter ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          capacity: parseFloat(formData.capacity),
          bandwidthLimit: formData.bandwidthLimitEnabled ? parseFloat(formData.bandwidthLimit) : undefined
        }),
      });

      if (response.ok) {
        toast.success(editingRouter ? 'Router updated successfully' : 'Router created successfully');
        setIsDialogOpen(false);
        setEditingRouter(null);
        setFormData({
          name: '',
          model: '',
          ipAddress: '',
          macAddress: '',
          capacity: '',
          location: '',
          townId: '',
          status: 'OFFLINE',
          bandwidthLimit: '',
          bandwidthLimitEnabled: false
        });
        fetchData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Operation failed');
      }
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const handleEdit = (routerItem: Router) => {
    setEditingRouter(routerItem);
    setFormData({
      name: routerItem.name,
      model: routerItem.model,
      ipAddress: routerItem.ipAddress,
      macAddress: routerItem.macAddress || '',
      capacity: routerItem.capacity.toString(),
      location: routerItem.location || '',
      townId: routerItem.townId,
      status: routerItem.status,
      bandwidthLimit: routerItem.bandwidthLimit?.toString() || '',
      bandwidthLimitEnabled: !!routerItem.bandwidthLimit
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this router?')) return;

    try {
      const response = await fetch(`/api/admin/routers/${id}`, { method: 'DELETE' });
      if (response.ok) {
        toast.success('Router deleted successfully');
        fetchData();
      } else {
        toast.error('Failed to delete router');
      }
    } catch (error) {
      toast.error('Failed to delete router');
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
      case 'ERROR':
        return <Badge className="bg-red-100 text-red-800">Error</Badge>;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Router Management</h1>
          <p className="text-muted-foreground">Manage and monitor your network routers</p>
        </div>
        <Button onClick={() => {
          setEditingRouter(null);
          setFormData({
            name: '',
            model: '',
            ipAddress: '',
            macAddress: '',
            capacity: '',
            location: '',
            townId: '',
            status: 'OFFLINE',
            bandwidthLimit: '',
            bandwidthLimitEnabled: false
          });
          setIsDialogOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" /> Add Router
        </Button>
      </div>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px] w-[95vw] max-w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRouter ? 'Edit Router' : 'Add New Router'}</DialogTitle>
            <DialogDescription>
              {editingRouter ? 'Update router details' : 'Create a new router/access point'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 w-full">
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="model" className="text-right">
                  Model
                </Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => setFormData({...formData, model: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="ipAddress" className="text-right">
                  IP Address
                </Label>
                <Input
                  id="ipAddress"
                  value={formData.ipAddress}
                  onChange={(e) => setFormData({...formData, ipAddress: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="macAddress" className="text-right">
                  MAC Address
                </Label>
                <Input
                  id="macAddress"
                  value={formData.macAddress}
                  onChange={(e) => setFormData({...formData, macAddress: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="capacity" className="text-right">
                  Total Capacity (Mbps)
                </Label>
                <Input
                  id="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="bandwidthLimitEnabled" className="text-right">
                  Enable User Limit
                </Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="bandwidthLimitEnabled"
                    checked={formData.bandwidthLimitEnabled}
                    onCheckedChange={(checked) => setFormData({...formData, bandwidthLimitEnabled: checked})}
                  />
                  <span className="text-sm text-muted-foreground">
                    {formData.bandwidthLimitEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
              {formData.bandwidthLimitEnabled && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="bandwidthLimit" className="text-right">
                    Per-User Limit (Mbps)
                  </Label>
                  <Input
                    id="bandwidthLimit"
                    type="number"
                    value={formData.bandwidthLimit}
                    onChange={(e) => setFormData({...formData, bandwidthLimit: e.target.value})}
                    className="col-span-3"
                    placeholder="Enter bandwidth limit per user"
                  />
                </div>
              )}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="location" className="text-right">
                  Location
                </Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="townId" className="text-right">
                  Town
                </Label>
                <Select
                  value={formData.townId}
                  onValueChange={(value) => setFormData({...formData, townId: value})}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a town" />
                  </SelectTrigger>
                  <SelectContent>
                    {towns.map((town) => (
                      <SelectItem key={town.id} value={town.id}>
                        {town.name}, {town.district?.name}, {town.district?.province?.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Status
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({...formData, status: value as any})}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ONLINE">Online</SelectItem>
                    <SelectItem value="OFFLINE">Offline</SelectItem>
                    <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="w-full sm:w-auto"
              >
                {editingRouter ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <RouterIcon className="w-5 h-5 mr-2" />
            Network Routers
          </CardTitle>
          <CardDescription>
            Manage all network routers and access points across Rwanda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Connected Users</TableHead>
                <TableHead>Bandwidth Usage</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {routers.map((router) => {
                const usagePercentage = getBandwidthPercentage(router);
                const usageColor = 
                  usagePercentage > 90 ? 'bg-red-500' : 
                  usagePercentage > 70 ? 'bg-yellow-500' : 'bg-green-500';
                  
                return (
                  <TableRow key={router.id}>
                    <TableCell className="font-medium">{router.name}</TableCell>
                    <TableCell>{router.model}</TableCell>
                    <TableCell>{router.ipAddress}</TableCell>
                    <TableCell>
                      <Badge variant={router.status === 'ONLINE' ? 'default' : 'secondary'}>
                        {router.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                        {getConnectedUsersCount(router.id)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className={`h-2.5 rounded-full ${usageColor}`} 
                          style={{ width: `${usagePercentage}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {getBandwidthUsage(router.id).toFixed(2)} / {router.capacity} Mbps
                      </div>
                    </TableCell>
                    <TableCell>
                      {router.town?.district?.province?.name}, {router.town?.name}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingRouter(router);
                            setFormData({
                              name: router.name,
                              model: router.model,
                              ipAddress: router.ipAddress,
                              macAddress: router.macAddress || '',
                              capacity: router.capacity.toString(),
                              location: router.location || '',
                              townId: router.townId,
                              status: router.status,
                              bandwidthLimit: router.bandwidthLimit?.toString() || '',
                              bandwidthLimitEnabled: !!router.bandwidthLimit
                            });
                            setIsDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(router.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}