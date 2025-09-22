'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from '@/types';
import { Users, Activity, MapPin, Shield, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

interface ExtendedUser extends User {
  image?: string | null;
  _count?: {
    logs: number;
    connectedUsers: number;
  };
}

export default function StaffUsersPage() {
  const [users, setUsers] = useState<ExtendedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/staff/users');
      if (response.ok) {
        const data = await response.json();
        console.log('Successfully fetched users:', data.users?.length || 0);
        setUsers(data.users || []);
      } else {
        const errorData = await response.json();
        console.error('Failed to fetch users:', errorData.error);
        setUsers([]);
        toast.error(errorData.error || 'Failed to load users');
      }
    } catch (error: any) {
      console.error('Error fetching users:', error);
      setUsers([]);
      toast.error('Network error - please check your connection');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Badge className="bg-red-100 text-red-800"><Shield className="w-3 h-3 mr-1" />Admin</Badge>;
      case 'STAFF':
        return <Badge className="bg-blue-100 text-blue-800">Staff</Badge>;
      default:
        return <Badge variant="secondary">{role}</Badge>;
    }
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatLastLogin = (date: Date | null | undefined) => {
    if (!date) return 'Never';
    try {
      const loginDate = new Date(date);
      if (isNaN(loginDate.getTime())) return 'Invalid date';

      const now = new Date();
      const diff = now.getTime() - loginDate.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));

      if (days === 0) return 'Today';
      if (days === 1) return 'Yesterday';
      if (days < 7) return `${days} days ago`;
      if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
      return `${Math.floor(days / 30)} months ago`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">User Access</h1>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Access</h1>
          <p className="text-muted-foreground">View and manage user access permissions relevant to your role</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">All Users</TabsTrigger>
          <TabsTrigger value="connected">Connected Users</TabsTrigger>
          <TabsTrigger value="activity">User Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{users?.length || 0}</div>
                <p className="text-xs text-muted-foreground">In your area</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Staff Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {users?.filter(u => u.role === 'STAFF').length || 0}
                </div>
                <p className="text-xs text-muted-foreground">Staff members</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {users?.filter(u => u.isActive).length || 0}
                </div>
                <p className="text-xs text-muted-foreground">Currently active</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Connections</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {users?.reduce((sum, u) => sum + (u._count?.connectedUsers || 0), 0) || 0}
                </div>
                <p className="text-xs text-muted-foreground">Active connections</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Users in Your Area</CardTitle>
              <CardDescription>View all users and their access permissions in your assigned area</CardDescription>
            </CardHeader>
            <CardContent>
              {(!users || users.length === 0) ? (
                <div className="text-center py-8 text-gray-500">
                  No users found in your area
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Area</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Connections</TableHead>
                      <TableHead>Last Login</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.image || undefined} />
                              <AvatarFallback>{getUserInitials(user.name || 'Unknown')}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{user.name || 'Unknown User'}</div>
                              <div className="text-sm text-muted-foreground">{user.email || 'No email'}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {user.assignedDistrict?.name && user.assignedProvince?.name ? (
                              <div>
                                <div>{user.assignedDistrict.name}</div>
                                <div className="text-muted-foreground">{user.assignedProvince.name}</div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">No assignment</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.isActive ? 'default' : 'secondary'}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{user._count?.connectedUsers || 0}</div>
                            <div className="text-muted-foreground">connections</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {formatLastLogin(user.lastLogin)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="connected" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Connected Users</CardTitle>
              <CardDescription>Users currently connected to routers in your area</CardDescription>
            </CardHeader>
            <CardContent>
              {(!users || users.filter(u => (u._count?.connectedUsers || 0) > 0).length === 0) ? (
                <div className="text-center py-8 text-gray-500">
                  No users currently connected
                </div>
              ) : (
                <div className="space-y-4">
                  {users
                    .filter(u => (u._count?.connectedUsers || 0) > 0)
                    .map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.image || undefined} />
                          <AvatarFallback>{getUserInitials(user.name || 'Unknown')}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium">{user.name || 'Unknown User'}</h3>
                          <p className="text-sm text-muted-foreground">{user.email || 'No email'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">
                          {user._count?.connectedUsers || 0}
                        </div>
                        <p className="text-sm text-muted-foreground">active connections</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Activity</CardTitle>
              <CardDescription>Recent activity and login history for users in your area</CardDescription>
            </CardHeader>
            <CardContent>
              {(!users || users.filter(u => (u._count?.logs || 0) > 0).length === 0) ? (
                <div className="text-center py-8 text-gray-500">
                  No recent user activity
                </div>
              ) : (
                <div className="space-y-4">
                  {users
                    .filter(u => (u._count?.logs || 0) > 0)
                    .sort((a, b) => (b._count?.logs || 0) - (a._count?.logs || 0))
                    .map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.image || undefined} />
                          <AvatarFallback>{getUserInitials(user.name || 'Unknown')}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium">{user.name || 'Unknown User'}</h3>
                          <p className="text-sm text-muted-foreground">{user.email || 'No email'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          {user._count?.logs || 0}
                        </div>
                        <p className="text-sm text-muted-foreground">activities</p>
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
