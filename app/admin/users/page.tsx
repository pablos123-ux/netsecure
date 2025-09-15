'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ConnectedUser } from '@/types';
import { Users, Shield, ShieldOff, ArrowLeft, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function UserAccessManagement() {
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const router = useRouter();

  useEffect(() => {
    fetchConnectedUsers();
    const interval = setInterval(fetchConnectedUsers, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchConnectedUsers = async () => {
    try {
      const response = await fetch('/api/admin/connected-users');
      if (response.ok) {
        const data = await response.json();
        setConnectedUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching connected users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async (userId: string, isBlocked: boolean) => {
    try {
      const endpoint = isBlocked ? 'unblock' : 'block';
      const response = await fetch(`/api/admin/connected-users/${userId}/${endpoint}`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success(`User ${isBlocked ? 'unblocked' : 'blocked'} successfully`);
        fetchConnectedUsers();
      } else {
        toast.error(`Failed to ${isBlocked ? 'unblock' : 'block'} user`);
      }
    } catch (error) {
      toast.error('Operation failed');
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
                         user.ipAddress.includes(searchTerm) ||
                         user.macAddress.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'active' && user.status === 'ACTIVE' && !user.isBlocked) ||
                         (filterStatus === 'blocked' && user.isBlocked) ||
                         (filterStatus === 'inactive' && user.status === 'INACTIVE');
    
    return matchesSearch && matchesFilter;
  });

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
              <div>
                <h1 className="text-2xl font-bold text-gray-900">User Access Management</h1>
                <p className="text-gray-600">Monitor and control internet access for connected users</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
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
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Users</option>
                <option value="active">Active</option>
                <option value="blocked">Blocked</option>
                <option value="inactive">Inactive</option>
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
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{connectedUsers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Users</p>
                  <p className="text-2xl font-bold text-gray-900">
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
                  <p className="text-sm font-medium text-gray-600">Blocked Users</p>
                  <p className="text-2xl font-bold text-gray-900">
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
                  <p className="text-sm font-medium text-gray-600">Total Bandwidth</p>
                  <p className="text-2xl font-bold text-gray-900">
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
                      {new Date(user.lastSeen).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={!user.isBlocked}
                          onCheckedChange={() => handleBlockUser(user.id, user.isBlocked)}
                        />
                        <span className="text-sm text-gray-600">
                          {user.isBlocked ? 'Blocked' : 'Allowed'}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredUsers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No users found matching your criteria
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}