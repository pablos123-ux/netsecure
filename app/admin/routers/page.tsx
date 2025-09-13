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
    status: 'OFFLINE'
  });
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

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
          capacity: parseFloat(formData.capacity)
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
          status: 'OFFLINE'
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
      status: routerItem.status
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => router.push('/admin')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Router Management</h1>
                <p className="text-gray-600">Manage network routers and access points</p>
              </div>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
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
                    status: 'OFFLINE'
                  });
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Router
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingRouter ? 'Edit Router' : 'Add New Router'}</DialogTitle>
                  <DialogDescription>
                    {editingRouter ? 'Update router details' : 'Create a new router/access point'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Router Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="model">Model</Label>
                      <Input
                        id="model"
                        value={formData.model}
                        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="ipAddress">IP Address</Label>
                      <Input
                        id="ipAddress"
                        value={formData.ipAddress}
                        onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="macAddress">MAC Address</Label>
                      <Input
                        id="macAddress"
                        value={formData.macAddress}
                        onChange={(e) => setFormData({ ...formData, macAddress: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="capacity">Capacity (Mbps)</Label>
                      <Input
                        id="capacity"
                        type="number"
                        value={formData.capacity}
                        onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ONLINE">Online</SelectItem>
                          <SelectItem value="OFFLINE">Offline</SelectItem>
                          <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                          <SelectItem value="ERROR">Error</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="location">Physical Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g., Building A, Floor 2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="town">Town</Label>
                    <Select value={formData.townId} onValueChange={(value) => setFormData({ ...formData, townId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select town" />
                      </SelectTrigger>
                      <SelectContent>
                        {towns.map((town) => (
                          <SelectItem key={town.id} value={town.id}>
                            {town.name} ({town.district?.name}, {town.district?.province?.name})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingRouter ? 'Update' : 'Create'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                  <TableHead>Uptime</TableHead>
                  <TableHead>Bandwidth</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Town</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {routers.map((routerItem) => (
                  <TableRow key={routerItem.id}>
                    <TableCell className="font-medium">{routerItem.name}</TableCell>
                    <TableCell>{routerItem.model}</TableCell>
                    <TableCell className="font-mono text-sm">{routerItem.ipAddress}</TableCell>
                    <TableCell>{getStatusBadge(routerItem.status)}</TableCell>
                    <TableCell>{formatUptime(routerItem.uptime)}</TableCell>
                    <TableCell>
                      {routerItem.bandwidth.toFixed(1)} / {routerItem.capacity} Mbps
                    </TableCell>
                    <TableCell>{routerItem.location || '-'}</TableCell>
                    <TableCell>{routerItem.town?.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(routerItem)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Activity className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Users className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(routerItem.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}