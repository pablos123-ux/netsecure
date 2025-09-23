'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Router, Town } from '@/types';
import { MapPin, Activity, AlertCircle, CheckCircle2, ArrowRight, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface RouterWithTown {
  id: string;
  name: string;
  model: string;
  ipAddress: string;
  status: string;
  uptime: number;
  townId: string | null;
  town?: Town;
}

interface ExtendedRouter extends RouterWithTown {
  town?: Town;
}

interface ExtendedTown {
  id: string;
  name: string;
  district?: {
    id: string;
    name: string;
  };
  _count?: {
    routers: number;
  };
}

interface TownWithRouters extends Town {
  _count?: {
    routers: number;
  };
}

export default function StaffRoutersPage() {
  const [allRouters, setAllRouters] = useState<ExtendedRouter[]>([]);
  const [assignedRouters, setAssignedRouters] = useState<ExtendedRouter[]>([]);
  const [towns, setTowns] = useState<ExtendedTown[]>([]);
  const [townsLoading, setTownsLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [selectedRouter, setSelectedRouter] = useState<string>('');
  const [selectedTown, setSelectedTown] = useState<string>('');
  const [relocatingRouter, setRelocatingRouter] = useState<ExtendedRouter | null>(null);
  const [relocationTown, setRelocationTown] = useState<string>('');

  const handleUnassignRouter = async (routerId: string) => {
    try {
      const response = await fetch(`/api/staff/routers/${routerId}/unassign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        toast.success('Router unassigned successfully');
        await fetchData(); // Refresh all data
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to unassign router');
      }
    } catch (error) {
      console.error('Error unassigning router:', error);
      toast.error('Failed to unassign router');
    }
  };

  const handleRelocateRouter = async () => {
    if (!relocatingRouter || !relocationTown) {
      toast.error('Please select a destination town');
      return;
    }

    if (relocatingRouter.townId === relocationTown) {
      toast.error('Router is already assigned to this town');
      return;
    }

    try {
      const response = await fetch(`/api/staff/routers/${relocatingRouter.id}/relocate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ townId: relocationTown })
      });

      if (response.ok) {
        toast.success('Router relocated successfully');
        setRelocatingRouter(null);
        setRelocationTown('');
        await fetchData(); // Refresh all data
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to relocate router');
      }
    } catch (error) {
      console.error('Error relocating router:', error);
      toast.error('Failed to relocate router');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      console.log('Starting data fetch...');

      await Promise.all([
        fetchAssignedRouters(),
        fetchAllRouters(),
        fetchTowns()
      ]);

      console.log('Data fetch completed');
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load router data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllRouters = async () => {
    try {
      const response = await fetch('/api/staff/available-routers');
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched all routers:', data.routers?.length || 0);
        setAllRouters(data.routers || []);
      } else {
        console.error('Failed to fetch all routers:', response.statusText);
        setAllRouters([]);
      }
    } catch (error) {
      console.error('Error fetching all routers:', error);
      setAllRouters([]);
    }
  };

  const fetchAssignedRouters = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/staff/routers');
      if (response.ok) {
        const data = await response.json();
        setAssignedRouters(data.routers || []);
      } else {
        const errorData = await response.json();
        setAssignedRouters([]);
        toast.error(errorData.error || 'Failed to load assigned routers');
      }
    } catch (error: any) {
      setAssignedRouters([]);
      toast.error('Network error - please check your connection');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTowns = async () => {
    try {
      setTownsLoading(true);
      const response = await fetch('/api/staff/assigned-towns');
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched towns:', data.towns?.length || 0, 'towns');
        setTowns(data.towns || []);
      } else {
        console.error('Failed to fetch towns:', response.statusText);
        setTowns([]);
        toast.error('Failed to load towns data');
      }
    } catch (error) {
      console.error('Error fetching towns:', error);
      setTowns([]);
      toast.error('Error loading towns data');
    } finally {
      setTownsLoading(false);
    }
  };

  const handleAssignRouter = async () => {
    if (!selectedRouter || !selectedTown) {
      toast.error('Please select both a router and a town');
      return;
    }

    try {
      setAssigning(true);
      const response = await fetch(`/api/staff/routers/${selectedRouter}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ townId: selectedTown })
      });

      if (response.ok) {
        toast.success('Router assigned successfully');
        setSelectedRouter('');
        setSelectedTown('');
        await fetchData(); // Refresh all data
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to assign router');
      }
    } catch (error) {
      console.error('Error assigning router:', error);
      toast.error('Failed to assign router');
    } finally {
      setAssigning(false);
    }
  };


  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ONLINE':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="w-3 h-3 mr-1" />Online</Badge>;
      case 'OFFLINE':
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="w-3 h-3 mr-1" />Offline</Badge>;
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

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Router Management</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Loading router data...</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-32 sm:h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Router Management</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Distribute and manage routers in your assigned area</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <div className="overflow-x-auto">
          <TabsList className="inline-flex h-auto p-1 min-w-full sm:min-w-0 grid grid-cols-2 sm:grid-cols-4 gap-1">
            <TabsTrigger value="overview" className="text-xs sm:text-sm py-2 sm:py-3 px-2 sm:px-4 whitespace-nowrap">
              Overview
            </TabsTrigger>
            <TabsTrigger value="assigned" className="text-xs sm:text-sm py-2 sm:py-3 px-2 sm:px-4 whitespace-nowrap">
              Assigned
            </TabsTrigger>
            <TabsTrigger value="available" className="text-xs sm:text-sm py-2 sm:py-3 px-2 sm:px-4 whitespace-nowrap">
              Available
            </TabsTrigger>
            <TabsTrigger value="distribution" className="text-xs sm:text-sm py-2 sm:py-3 px-2 sm:px-4 whitespace-nowrap">
              Distribution
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Routers</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{allRouters.length}</div>
                <p className="text-xs text-muted-foreground">In your area</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unassigned Routers</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {allRouters.filter(router => !router.town).length}
                </div>
                <p className="text-xs text-muted-foreground">Ready for assignment</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Assigned Routers</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {allRouters.filter(router => router.town).length}
                </div>
                <p className="text-xs text-muted-foreground">Currently deployed</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Towns</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{towns?.length || 0}</div>
                <p className="text-xs text-muted-foreground">In your jurisdiction</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="assigned" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Assigned Routers</CardTitle>
              <CardDescription>Routers currently deployed in your assigned area. Use the buttons below to manage them.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : assignedRouters.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <p className="text-gray-500">No routers assigned to towns in your area</p>
                  <p className="text-sm text-muted-foreground">
                    This means no routers have been assigned to towns within your jurisdiction.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {assignedRouters.map((router) => (
                    <div key={router.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <h3 className="font-medium text-base sm:text-lg truncate">{router.name}</h3>
                              <p className="text-sm text-muted-foreground">{router.model}</p>
                              <p className="text-xs text-muted-foreground font-mono sm:hidden">{router.ipAddress}</p>
                            </div>
                            <div className="flex-shrink-0">
                              {getStatusBadge(router.status)}
                            </div>
                          </div>
                          <div className="hidden sm:block text-sm font-mono text-muted-foreground mt-1">
                            {router.ipAddress}
                          </div>
                          <div className="mt-2">
                            <div className="text-sm">
                              <span className="font-medium">Location:</span> {router.town?.name}, {router.town?.district?.name}
                            </div>
                            <div className="hidden md:block text-sm text-muted-foreground mt-1">
                              <span className="font-medium">Uptime:</span> {formatUptime(router.uptime)}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pt-2 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnassignRouter(router.id)}
                          className="text-orange-600 hover:text-orange-700 w-full sm:w-auto"
                        >
                          Unassign
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setRelocatingRouter(router)}
                              className="text-blue-600 hover:text-blue-700 w-full sm:w-auto"
                            >
                              <ArrowRight className="w-4 h-4 mr-1" />
                              Relocate
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="w-[95vw] max-w-[500px] mx-4">
                            <DialogHeader>
                              <DialogTitle>Relocate Router</DialogTitle>
                              <DialogDescription>
                                Move {router.name} to a different town in your area
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>Current Location</Label>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {router.town?.name}, {router.town?.district?.name}
                                </p>
                              </div>
                              <div>
                                <Label htmlFor="relocation-town">New Location</Label>
                                <Select value={relocationTown} onValueChange={setRelocationTown}>
                                  <SelectTrigger className="mt-2">
                                    <SelectValue placeholder="Choose a new town" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {towns
                                      .filter(town => town.id !== router.townId)
                                      .map((town) => (
                                      <SelectItem key={town.id} value={town.id}>
                                        {town.name}, {town.district?.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setRelocatingRouter(null);
                                    setRelocationTown('');
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  onClick={handleRelocateRouter}
                                  disabled={!relocationTown}
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  Relocate Router
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="available" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Routers in Area</CardTitle>
              <CardDescription>View all routers in your assigned area with their current assignment status</CardDescription>
            </CardHeader>
            <CardContent>
              {allRouters.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No routers found in your assigned area
                </div>
              ) : (
                <div className="space-y-4">
                  {allRouters.map((router) => (
                    <div key={router.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <h3 className="font-medium text-base sm:text-lg truncate">{router.name}</h3>
                              <p className="text-sm text-muted-foreground">{router.model}</p>
                              <p className="text-xs text-muted-foreground font-mono sm:hidden">{router.ipAddress}</p>
                            </div>
                            <div className="flex-shrink-0">
                              {getStatusBadge(router.status)}
                            </div>
                          </div>
                          <div className="hidden sm:block text-sm font-mono text-muted-foreground mt-1">
                            {router.ipAddress}
                          </div>

                          <div className="mt-2 space-y-1">
                            {router.town ? (
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Badge className="bg-green-100 text-green-800 text-xs">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    Assigned
                                  </Badge>
                                </div>
                                <div className="text-sm">
                                  <span className="font-medium">Location:</span> {router.town.name}, {router.town.district?.name}
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  Unassigned
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Router Distribution</CardTitle>
              <CardDescription>Overview of router assignments across your area</CardDescription>
            </CardHeader>
            <CardContent>
              {(!towns || towns.length === 0) ? (
                <div className="text-center py-8 text-gray-500">
                  No towns found in your assigned area
                </div>
              ) : (
                <div className="space-y-4">
                  {towns.map((town) => (
                    <div key={town.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-base sm:text-lg truncate">{town.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {town.district?.name} District
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
                        <div className="text-center sm:text-right">
                          <div className="text-2xl sm:text-3xl font-bold text-primary">
                            {town._count?.routers || 0}
                          </div>
                          <p className="text-sm text-muted-foreground">routers</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full sm:w-auto"
                          onClick={() => {
                            // Could add functionality to view routers in this town
                            console.log('View routers in', town.name);
                          }}
                        >
                          <MapPin className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
