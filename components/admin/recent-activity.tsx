'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Log } from '@/types';
import { formatDistanceToNow } from 'date-fns';

export function RecentActivity() {
  const [activities, setActivities] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const response = await fetch('/api/admin/activity?limit=20');
      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities || []);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action: string) => {
    if (action.includes('CREATE')) return <Badge variant="secondary" className="text-green-600">Create</Badge>;
    if (action.includes('UPDATE')) return <Badge variant="secondary" className="text-blue-600">Update</Badge>;
    if (action.includes('DELETE')) return <Badge variant="secondary" className="text-red-600">Delete</Badge>;
    if (action.includes('LOGIN')) return <Badge variant="secondary" className="text-purple-600">Login</Badge>;
    return <Badge variant="secondary">Action</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest system activities and changes</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-80">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (Array.isArray(activities) ? activities.length === 0 : true) ? (
            <div className="text-center text-gray-500 py-8">
              No recent activity
            </div>
          ) : (
            <div className="space-y-4">
              {Array.isArray(activities) && activities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      {getActionBadge(activity.action)}
                      <span className="text-sm font-medium text-gray-900">
                        {activity.user?.name || 'Unknown User'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{activity.action}</p>
                    {activity.details && (
                      <p className="text-xs text-gray-500 mt-1">{activity.details}</p>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">
                    {activity.timestamp ? formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true }) : 'Unknown time'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}