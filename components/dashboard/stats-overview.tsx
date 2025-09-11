@@ .. @@
 'use client';

 import { useState, useEffect } from 'react';
+import { DashboardStats } from '@/types';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Users, Activity, Shield, HardDrive } from 'lucide-react';

-interface Stats {
-  totalUsers: number;
-  activeUsers: number;
-  blockedUsers: number;
-  totalBandwidth: number;
-}
-
 export function StatsOverview() {
-  const [stats, setStats] = useState<Stats>({
+  const [stats, setStats] = useState<DashboardStats>({
     totalUsers: 0,
     activeUsers: 0,
     blockedUsers: 0,
@@ .. @@
   const fetchStats = async () => {
     try {
-      // Mock data for now
-      // Replace with actual API call
-      setStats({
-        totalUsers: 12,
-        activeUsers: 8,
-        blockedUsers: 2,
-        totalBandwidth: 1024 * 1024 * 500 // 500 MB
-      });
+      const response = await fetch('/api/stats');
+      if (response.ok) {
+        const data = await response.json();
+        setStats(data);
+      }
     } catch (error) {
       console.error('Error fetching stats:', error);
     }
@@ .. @@
   useEffect(() => {
     fetchStats();
+    
+    // Refresh stats every 30 seconds
+    const interval = setInterval(fetchStats, 30000);
+    return () => clearInterval(interval);
   }, []);

-  const formatBytes = (bytes: number) => {
-    if (bytes === 0) return '0 Bytes';
-    const k = 1024;
-    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
-    const i = Math.floor(Math.log(bytes) / Math.log(k));
-    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
-  };
-
   return (
     <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
@@ .. @@
         <CardContent>
           <div className="text-2xl font-bold">{stats.totalBandwidth}</div>
-          <p className="text-xs text-muted-foreground">
-            {formatBytes(stats.totalBandwidth)} total
-          </p>
+          <p className="text-xs text-muted-foreground">Last 24 hours</p>
         </CardContent>
       </Card>
     </div>
@@ .. @@
 }