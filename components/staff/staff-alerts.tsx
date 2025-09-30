'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert } from '@/types';
import { AlertTriangle, CheckCircle, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

export function StaffAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/staff/alerts');
      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/alerts/${alertId}/resolve`, {
        method: 'PUT',
      });

      if (response.ok) {
        setAlerts(alerts.filter(alert => alert.id !== alertId));
        toast.success('Alert resolved successfully');
      }
    } catch (error) {
      toast.error('Failed to resolve alert');
    }
  };

  const handleDismissAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/alerts/${alertId}/dismiss`, {
        method: 'PUT',
      });

      if (response.ok) {
        setAlerts(alerts.filter(alert => alert.id !== alertId));
        toast.success('Alert dismissed');
      }
    } catch (error) {
      toast.error('Failed to dismiss alert');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
            Active Alerts
          </CardTitle>
          <CardDescription>
            Alerts requiring your immediate attention
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-muted-foreground">Loading alerts...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
          Active Alerts
        </CardTitle>
        <CardDescription>
          Alerts requiring your immediate attention
        </CardDescription>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
            <p>No active alerts in your area</p>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div key={alert.id} className="border rounded-lg p-4 space-y-3 bg-red-50 border-red-200">
                <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                        <Badge variant="destructive">Alert</Badge>
                        <span className="text-sm text-gray-600">
                          {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 mb-1 truncate">
                        {alert.router?.name} - {alert.router?.ipAddress}
                      </p>
                      <p className="text-sm text-gray-700 mb-2">{alert.message}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        {alert.creator && (
                          <span>
                            Created by: <span className="font-medium text-gray-700">{alert.creator.name}</span> ({alert.creator.role})
                          </span>
                        )}
                        {alert.resolver && (
                          <span>
                            Resolved by: <span className="font-medium text-gray-700">{alert.resolver.name}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleResolveAlert(alert.id)}
                      className="flex-1 sm:flex-initial"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      <span className="hidden sm:inline">Resolve</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDismissAlert(alert.id)}
                      className="flex-1 sm:flex-initial"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}