'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConnectedUser, User } from '@/types';
import { Users, Shield, ShieldOff, ArrowLeft, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function UserAccessManagement() {
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);
  const [systemUsers, setSystemUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const router = useRouter();

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [connectedRes, systemRes] = await Promise.all([
        fetch('/api/admin/connected-users'),
        fetch('/api/admin/staff')
      ]);

      if (connectedRes.ok && systemRes.ok) {
        const [connectedData, systemData] = await Promise.all([
          connectedRes.json(),
          systemRes.json()
        ]);
        setConnectedUsers(connectedData.users);
        setSystemUsers(systemData.staff);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const [blockingUsers, setBlockingUsers] = useState<Record<string, boolean>>({});

  const handleBlockUser = async (userId: string, isBlocked: boolean) => {
    try {
      setBlockingUsers(prev => ({ ...prev, [userId]: true }));
      
      const endpoint = isBlocked ? 'unblock' : 'block';
      const response = await fetch(`/api/admin/connected-users/${userId}/${endpoint}`, {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || `User ${isBlocked ? 'unblocked' : 'blocked'} successfully`);
        await fetchData();
      } else {
        throw new Error(data.error || `Failed to ${isBlocked ? 'unblock' : 'block'} user`);
      }
    } catch (error) {
      console.error(`Error ${isBlocked ? 'unblocking' : 'blocking'} user:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Operation failed. Please try again.';
      toast.error(errorMessage);
      // Re-fetch to ensure UI is in sync with server state
      await fetchData();
    } finally {
      setBlockingUsers(prev => ({ ...prev, [userId]: false }));
    }
  };

  const getStatusBadge = (status: string, isBlocked: boolean) => {
    if (isBlocked) {
      return <Badge className="bg-red-100 text-red-800">Blocked</Badge>;
    }
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'INACTIVE':
        return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredUsers = connectedUsers.filter(user => {
    const matchesSearch = user.deviceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.ipAddress?.includes(searchTerm) ||
                         user.macAddress?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'active' && user.status === 'ACTIVE' && !user.isBlocked) ||
                         (filterStatus === 'blocked' && user.isBlocked) ||
                         (filterStatus === 'inactive' && user.status === 'INACTIVE');
    
    return matchesSearch && matchesFilter;
  });

  const filteredSystemUsers = systemUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.role.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' ||
                         (filterStatus === 'active' && user.isActive) ||
                         (filterStatus === 'inactive' && !user.isActive) ||
                         (filterStatus === 'admin' && user.role === 'ADMIN') ||
                         (filterStatus === 'staff' && user.role === 'STAFF');
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="bg-background shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-2xl font-bold">User Access Management</h1>
                <p className="text-muted-foreground">Monitor and control internet access for connected users</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-border rounded-md text-sm bg-background text-foreground"
              >
                <option value="all">All Users</option>
                <option value="active">Active</option>
                <option value="blocked">Blocked</option>
                <option value="inactive">Inactive</option>
                <option value="admin">Admins</option>
                <option value="staff">Staff</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{connectedUsers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                  <p className="text-2xl font-bold">
                    {connectedUsers.filter(u => u.status === 'ACTIVE' && !u.isBlocked).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <ShieldOff className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Blocked Users</p>
                  <p className="text-2xl font-bold">
                    {connectedUsers.filter(u => u.isBlocked).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Filter className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Bandwidth</p>
                  <p className="text-2xl font-bold">
                    {connectedUsers.reduce((sum, u) => sum + u.bandwidth, 0).toFixed(1)} Mbps
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Connected Users
            </CardTitle>
            <CardDescription>
              Monitor and control internet access for all connected devices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>MAC Address</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Bandwidth</TableHead>
                  <TableHead>Total Usage</TableHead>
                  <TableHead>Router</TableHead>
                  <TableHead>Last Seen</TableHead>
                  <TableHead>Block/Unblock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.deviceName || 'Unknown Device'}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{user.ipAddress}</TableCell>
                    <TableCell className="font-mono text-sm">{user.macAddress}</TableCell>
                    <TableCell>{getStatusBadge(user.status, user.isBlocked)}</TableCell>
                    <TableCell>{user.bandwidth.toFixed(1)} Mbps</TableCell>
                    <TableCell>{formatBytes(user.totalUsage * 1024 * 1024)}</TableCell>
                    <TableCell>{user.router?.name}</TableCell>
                    <TableCell>
                      {user.lastSeen ? (
                        <div className="text-sm">
                          <div>{new Date(user.lastSeen).toLocaleDateString()}</div>
                          <div className="text-muted-foreground text-xs">
                            {new Date(user.lastSeen).toLocaleTimeString()}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Never seen</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className="relative">
                          <Switch
                            checked={!user.isBlocked}
                            disabled={blockingUsers[user.id]}
                            onCheckedChange={() => handleBlockUser(user.id, user.isBlocked)}
                            className={blockingUsers[user.id] ? 'opacity-50 cursor-not-allowed' : ''}
                          />
                          {blockingUsers[user.id] && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                            </div>
                          )}
                        </div>
                        <span className={`text-sm ${user.isBlocked ? 'text-red-600' : 'text-green-600'}`}>
                          {user.isBlocked ? 'Blocked' : 'Allowed'}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredUsers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No users found matching your criteria
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Users Table */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              System Users (Staff/Admin)
            </CardTitle>
            <CardDescription>
              System users with their last login information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Province</TableHead>
                  <TableHead>District</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSystemUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.assignedProvince?.name || '-'}</TableCell>
                    <TableCell>{user.assignedDistrict?.name || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? 'default' : 'secondary'}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.lastLogin ? (
                        <div className="text-sm">
                          <div>{new Date(user.lastLogin).toLocaleDateString()}</div>
                          <div className="text-muted-foreground text-xs">
                            {new Date(user.lastLogin).toLocaleTimeString()}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Never</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredSystemUsers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No system users found matching your criteria
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}