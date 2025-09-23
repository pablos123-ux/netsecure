'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
      <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">User Access</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Loading user data...</p>
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
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">User Access</h1>
          <p className="text-muted-foreground text-sm sm:text-base">View and manage user access permissions relevant to your role</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <div className="overflow-x-auto">
          <TabsList className="inline-flex h-auto p-1 min-w-full sm:min-w-0 grid grid-cols-2 sm:grid-cols-4 gap-1">
            <TabsTrigger value="overview" className="text-xs sm:text-sm py-2 sm:py-3 px-2 sm:px-4 whitespace-nowrap">
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="text-xs sm:text-sm py-2 sm:py-3 px-2 sm:px-4 whitespace-nowrap">
              All Users
            </TabsTrigger>
            <TabsTrigger value="connected" className="text-xs sm:text-sm py-2 sm:py-3 px-2 sm:px-4 whitespace-nowrap">
              Connected
            </TabsTrigger>
            <TabsTrigger value="activity" className="text-xs sm:text-sm py-2 sm:py-3 px-2 sm:px-4 whitespace-nowrap">
              Activity
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
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
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <Avatar className="h-12 w-12 flex-shrink-0">
                            <AvatarImage src={user.image || undefined} />
                            <AvatarFallback>{getUserInitials(user.name || 'Unknown')}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-medium text-base sm:text-lg truncate">{user.name || 'Unknown User'}</h3>
                            <p className="text-sm text-muted-foreground truncate">{user.email || 'No email'}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {getRoleBadge(user.role)}
                              <Badge variant={user.isActive ? 'default' : 'secondary'} className="text-xs">
                                {user.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t">
                        <div>
                          <p className="text-xs text-muted-foreground">Area Assignment</p>
                          <p className="text-sm font-medium">
                            {user.assignedDistrict?.name && user.assignedProvince?.name ? (
                              <div>
                                <div>{user.assignedDistrict.name}</div>
                                <div className="text-muted-foreground text-xs">{user.assignedProvince.name}</div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">No assignment</span>
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Connections</p>
                          <div className="text-sm">
                            <div className="font-medium">{user._count?.connectedUsers || 0}</div>
                            <div className="text-muted-foreground text-xs">active connections</div>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Last Login</p>
                          <p className="text-sm text-muted-foreground">
                            {formatLastLogin(user.lastLogin)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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
                    <div key={user.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg gap-4">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.image || undefined} />
                          <AvatarFallback>{getUserInitials(user.name || 'Unknown')}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium truncate">{user.name || 'Unknown User'}</h3>
                          <p className="text-sm text-muted-foreground truncate">{user.email || 'No email'}</p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
                        <div className="text-center sm:text-right">
                          <div className="text-2xl sm:text-3xl font-bold text-blue-600">
                            {user._count?.connectedUsers || 0}
                          </div>
                          <p className="text-sm text-muted-foreground">active connections</p>
                        </div>
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          {user.role === 'ADMIN' ? 'Admin' : 'Staff'}
                        </Badge>
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
                    <div key={user.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg gap-4">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.image || undefined} />
                          <AvatarFallback>{getUserInitials(user.name || 'Unknown')}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium truncate">{user.name || 'Unknown User'}</h3>
                          <p className="text-sm text-muted-foreground truncate">{user.email || 'No email'}</p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
                        <div className="text-center sm:text-right">
                          <div className="text-2xl sm:text-3xl font-bold text-green-600">
                            {user._count?.logs || 0}
                          </div>
                          <p className="text-sm text-muted-foreground">activities</p>
                        </div>
                        <Badge className="bg-blue-100 text-blue-800 text-xs">
                          {user.role === 'ADMIN' ? 'Admin' : 'Staff'}
                        </Badge>
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
