'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Alert as AlertType } from '@/types';
import { AlertTriangle, CheckCircle2, XCircle, Clock, Router, MapPin, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

interface ExtendedAlert extends AlertType {
  router?: {
    id: string;
    name: string;
    model: string;
    ipAddress: string;
    status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE' | 'ERROR';
    uptime: number;
    bandwidth: number;
    capacity: number;
    townId: string;
    macAddress?: string;
    location?: string;
    createdAt: Date;
    updatedAt: Date;
    lastSeen?: Date;
    town?: {
      id: string;
      name: string;
      district?: {
        id: string;
        name: string;
      };
    };
  };
  resolver?: {
    id: string;
    name: string;
    email: string;
  };
}

export default function AdminAlertsPage() {
  const [alerts, setAlerts] = useState<ExtendedAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAlerts();
  }, [statusFilter]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') {
        params.append('status', statusFilter);
      }

      const response = await fetch(`/api/admin/alerts?${params}`);
      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts || []);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to load alerts');
      }
    } catch (error: any) {
      console.error('Error fetching alerts:', error);
      toast.error('Network error - please check your connection');
    } finally {
      setLoading(false);
    }
  };

  const handleAlertAction = async (alertId: string, action: 'RESOLVE' | 'DISMISS') => {
    try {
      setActionLoading(alertId);
      const response = await fetch('/api/admin/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId, action })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        await fetchAlerts(); // Refresh alerts
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to update alert');
      }
    } catch (error: any) {
      console.error('Error updating alert:', error);
      toast.error('Network error - please try again');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="w-3 h-3 mr-1" />Active</Badge>;
      case 'RESOLVED':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="w-3 h-3 mr-1" />Resolved</Badge>;
      case 'DISMISSED':
        return <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" />Dismissed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSeverityBadge = (alert: ExtendedAlert) => {
    // Simple severity detection based on message content
    const message = alert.message.toLowerCase();
    if (message.includes('offline') || message.includes('error') || message.includes('critical')) {
      return <Badge className="bg-red-100 text-red-800">High</Badge>;
    } else if (message.includes('maintenance') || message.includes('warning')) {
      return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
    } else {
      return <Badge className="bg-blue-100 text-blue-800">Low</Badge>;
    }
  };

  const formatAlertTime = (date: Date) => {
    const alertDate = new Date(date);
    const now = new Date();
    const diff = now.getTime() - alertDate.getTime();
    const minutes = Math.floor(diff / (1000 * 60));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return `${Math.floor(minutes / 1440)}d ago`;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Alerts Management</h1>
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
          <h1 className="text-3xl font-bold tracking-tight">Alerts Management</h1>
          <p className="text-muted-foreground">Monitor and manage network alerts across all areas</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="active">Active Alerts</TabsTrigger>
          <TabsTrigger value="history">Alert History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {alerts?.filter(a => a.status === 'ACTIVE').length || 0}
                </div>
                <p className="text-xs text-muted-foreground">Require attention</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Resolved Today</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {alerts?.filter(a => a.status === 'RESOLVED' && new Date(a.updatedAt).toDateString() === new Date().toDateString()).length || 0}
                </div>
                <p className="text-xs text-muted-foreground">Resolved alerts</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {alerts?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground">System-wide</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Affected Routers</CardTitle>
                <Router className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Set(alerts?.map(a => a.routerId).filter(Boolean)).size || 0}
                </div>
                <p className="text-xs text-muted-foreground">Routers with alerts</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Active Alerts */}
          {alerts?.filter(a => a.status === 'ACTIVE').length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Active Alerts</CardTitle>
                <CardDescription>Latest alerts requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {alerts
                    .filter(a => a.status === 'ACTIVE')
                    .slice(0, 5)
                    .map((alert) => (
                    <Alert key={alert.id} className="border-red-200 bg-red-50">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle className="flex items-center justify-between">
                        <span>{alert.message}</span>
                        <div className="flex items-center space-x-2">
                          {getSeverityBadge(alert)}
                          <span className="text-sm text-muted-foreground">
                            {formatAlertTime(alert.createdAt)}
                          </span>
                        </div>
                      </AlertTitle>
                      <AlertDescription className="mt-2">
                        <div className="flex items-center justify-between">
                          <div className="text-sm">
                            <span className="font-medium">Router:</span> {alert.router?.name || 'Unknown'} ({alert.router?.ipAddress || 'N/A'})
                            {alert.router?.town && (
                              <span className="ml-2 text-muted-foreground">
                                • {alert.router.town.name}
                                {alert.router.town.district && `, ${alert.router.town.district.name}`}
                              </span>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAlertAction(alert.id, 'RESOLVE')}
                              disabled={actionLoading === alert.id}
                              className="text-green-600 hover:text-green-700"
                            >
                              {actionLoading === alert.id ? 'Resolving...' : 'Resolve'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAlertAction(alert.id, 'DISMISS')}
                              disabled={actionLoading === alert.id}
                              className="text-gray-600 hover:text-gray-700"
                            >
                              {actionLoading === alert.id ? 'Dismissing...' : 'Dismiss'}
                            </Button>
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Active Alerts</CardTitle>
                  <CardDescription>Manage and respond to active alerts across all areas</CardDescription>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="ACTIVE">Active Only</SelectItem>
                    <SelectItem value="RESOLVED">Resolved Only</SelectItem>
                    <SelectItem value="DISMISSED">Dismissed Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {(!alerts || alerts.length === 0) ? (
                <div className="text-center py-8 text-gray-500">
                  {statusFilter === 'ALL' ? 'No alerts found' : `No ${statusFilter.toLowerCase()} alerts found`}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Alert</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Router</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alerts.map((alert) => (
                      <TableRow key={alert.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{alert.message}</div>
                            {alert.resolver && (
                              <div className="text-sm text-muted-foreground">
                                Resolved by: {alert.resolver.name}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getSeverityBadge(alert)}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{alert.router?.name || 'Unknown'}</div>
                            <div className="text-muted-foreground">{alert.router?.ipAddress || 'N/A'}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {alert.router?.town ? (
                              <div>
                                <div>{alert.router.town.name}</div>
                                <div className="text-muted-foreground">{alert.router.town.district?.name}</div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Unknown</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(alert.status)}</TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {formatAlertTime(alert.createdAt)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {alert.status === 'ACTIVE' ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleAlertAction(alert.id, 'RESOLVE')}
                                  disabled={actionLoading === alert.id}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  {actionLoading === alert.id ? 'Resolving...' : 'Resolve'}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleAlertAction(alert.id, 'DISMISS')}
                                  disabled={actionLoading === alert.id}
                                  className="text-gray-600 hover:text-gray-700"
                                >
                                  {actionLoading === alert.id ? 'Dismissing...' : 'Dismiss'}
                                </Button>
                              </>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                {alert.status === 'RESOLVED' ? 'Resolved' : 'Dismissed'}
                              </span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alert History</CardTitle>
              <CardDescription>Historical view of all alerts and their resolution status</CardDescription>
            </CardHeader>
            <CardContent>
              {(!alerts || alerts.length === 0) ? (
                <div className="text-center py-8 text-gray-500">
                  No alert history found
                </div>
              ) : (
                <div className="space-y-4">
                  {alerts
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((alert) => (
                    <div key={alert.id} className="flex items-start justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          {getStatusBadge(alert.status)}
                          {getSeverityBadge(alert)}
                        </div>
                        <h3 className="font-medium mb-1">{alert.message}</h3>
                        <div className="text-sm text-muted-foreground">
                          <div><strong>Router:</strong> {alert.router?.name || 'Unknown'} ({alert.router?.ipAddress || 'N/A'})</div>
                          {alert.router?.town && (
                            <div><strong>Location:</strong> {alert.router.town.name}
                              {alert.router.town.district && `, ${alert.router.town.district.name}`}
                            </div>
                          )}
                          {alert.resolver && (
                            <div><strong>Resolved by:</strong> {alert.resolver.name}</div>
                          )}
                        </div>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <div>{formatAlertTime(alert.createdAt)}</div>
                        <div>Created: {new Date(alert.createdAt).toLocaleDateString()}</div>
                        {alert.updatedAt !== alert.createdAt && (
                          <div>Updated: {new Date(alert.updatedAt).toLocaleDateString()}</div>
                        )}
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
