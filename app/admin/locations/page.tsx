'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Province, District, Town } from '@/types';
import { Plus, Edit, Trash2, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function LocationManagement() {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [towns, setTowns] = useState<Town[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('provinces');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    provinceId: '',
    districtId: ''
  });
  const [mapQuery, setMapQuery] = useState('Kigali, Rwanda');
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [provincesRes, districtsRes, townsRes] = await Promise.all([
        fetch('/api/admin/provinces'),
        fetch('/api/admin/districts'),
        fetch('/api/admin/towns')
      ]);

      if (provincesRes.ok && districtsRes.ok && townsRes.ok) {
        const [provincesData, districtsData, townsData] = await Promise.all([
          provincesRes.json(),
          districtsRes.json(),
          townsRes.json()
        ]);
        setProvinces(provincesData.provinces);
        setDistricts(districtsData.districts);
        setTowns(townsData.towns);
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
      let url = '';
      const method = editingItem ? 'PUT' : 'POST';
      
      if (activeTab === 'provinces') {
        url = editingItem ? `/api/admin/provinces/${editingItem.id}` : '/api/admin/provinces';
      } else if (activeTab === 'districts') {
        url = editingItem ? `/api/admin/districts/${editingItem.id}` : '/api/admin/districts';
      } else if (activeTab === 'towns') {
        url = editingItem ? `/api/admin/towns/${editingItem.id}` : '/api/admin/towns';
      }
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(`${activeTab.slice(0, -1)} ${editingItem ? 'updated' : 'created'} successfully`);
        setIsDialogOpen(false);
        setEditingItem(null);
        setFormData({ name: '', code: '', provinceId: '', districtId: '' });
        fetchData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Operation failed');
      }
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      code: item.code || '',
      provinceId: item.provinceId || '',
      districtId: item.districtId || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string, type: string) => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;

    try {
      const response = await fetch(`/api/admin/${type}s/${id}`, { method: 'DELETE' });
      if (response.ok) {
        toast.success(`${type} deleted successfully`);
        fetchData();
      } else {
        toast.error(`Failed to delete ${type}`);
      }
    } catch (error) {
      toast.error(`Failed to delete ${type}`);
    }
  };

  const openDialog = (type: string) => {
    setEditingItem(null);
    setFormData({ name: '', code: '', provinceId: '', districtId: '' });
    setActiveTab(type);
    setIsDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="bg-background border-b">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 space-y-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Location Management</h1>
            <p className="text-muted-foreground">Manage provinces, districts, and towns</p>
          </div>
          {/* Map search and embed */}
          <div className="grid gap-3">
            <div className="flex items-center gap-2">
              <input
                value={mapQuery}
                onChange={(e) => setMapQuery(e.target.value)}
                placeholder="Search on map (e.g., Kigali, Rwanda)"
                className="w-full rounded-md border border-border px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="aspect-[16/9] w-full overflow-hidden rounded-md border bg-muted">
              <iframe
                title="Google Map"
                className="h-full w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="provinces">Provinces</TabsTrigger>
            <TabsTrigger value="districts">Districts</TabsTrigger>
            <TabsTrigger value="towns">Towns</TabsTrigger>
          </TabsList>

          <TabsContent value="provinces">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center">
                      <MapPin className="w-5 h-5 mr-2" />
                      Provinces
                    </CardTitle>
                    <CardDescription>Manage Rwanda's provinces</CardDescription>
                  </div>
                  <Button onClick={() => openDialog('provinces')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Province
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Districts</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {provinces.map((province) => (
                      <TableRow key={province.id}>
                        <TableCell className="font-medium">{province.name}</TableCell>
                        <TableCell>{province.code}</TableCell>
                        <TableCell>{province._count?.districts || 0}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(province)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDelete(province.id, 'province')}>
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
          </TabsContent>

          <TabsContent value="districts">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center">
                      <MapPin className="w-5 h-5 mr-2" />
                      Districts
                    </CardTitle>
                    <CardDescription>Manage districts within provinces</CardDescription>
                  </div>
                  <Button onClick={() => openDialog('districts')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add District
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Province</TableHead>
                      <TableHead>Towns</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {districts.map((district) => (
                      <TableRow key={district.id}>
                        <TableCell className="font-medium">{district.name}</TableCell>
                        <TableCell>{district.code}</TableCell>
                        <TableCell>{district.province?.name}</TableCell>
                        <TableCell>{district._count?.towns || 0}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(district)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDelete(district.id, 'district')}>
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
          </TabsContent>

          <TabsContent value="towns">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center">
                      <MapPin className="w-5 h-5 mr-2" />
                      Towns
                    </CardTitle>
                    <CardDescription>Manage towns within districts</CardDescription>
                  </div>
                  <Button onClick={() => openDialog('towns')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Town
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>District</TableHead>
                      <TableHead>Province</TableHead>
                      <TableHead>Routers</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {towns.map((town) => (
                      <TableRow key={town.id}>
                        <TableCell className="font-medium">{town.name}</TableCell>
                        <TableCell>{town.code}</TableCell>
                        <TableCell>{town.district?.name}</TableCell>
                        <TableCell>{town.district?.province?.name}</TableCell>
                        <TableCell>{town._count?.routers || 0}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(town)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDelete(town.id, 'town')}>
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
          </TabsContent>
        </Tabs>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Edit' : 'Add'} {activeTab.slice(0, -1)}
              </DialogTitle>
              <DialogDescription>
                {editingItem ? 'Update' : 'Create a new'} {activeTab.slice(0, -1)}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="code">Code</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                />
              </div>
              {activeTab === 'districts' && (
                <div>
                  <Label htmlFor="province">Province</Label>
                  <Select value={formData.provinceId} onValueChange={(value) => setFormData({ ...formData, provinceId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select province" />
                    </SelectTrigger>
                    <SelectContent>
                      {provinces.map((province) => (
                        <SelectItem key={province.id} value={province.id}>
                          {province.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {activeTab === 'towns' && (
                <div>
                  <Label htmlFor="district">District</Label>
                  <Select value={formData.districtId} onValueChange={(value) => setFormData({ ...formData, districtId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select district" />
                    </SelectTrigger>
                    <SelectContent>
                      {districts.map((district) => (
                        <SelectItem key={district.id} value={district.id}>
                          {district.name} ({district.province?.name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingItem ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}