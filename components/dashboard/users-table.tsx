@@ .. @@
 'use client';

 import { useState, useEffect } from 'react';
+import { User } from '@/types';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Badge } from '@/components/ui/badge';
 import { Button } from '@/components/ui/button';
 import { Switch } from '@/components/ui/switch';
+import { toast } from 'sonner';
 import {
   Table,
   TableBody,
@@ .. @@
   Wifi,
   WifiOff,
   Shield,
-  ShieldOff
+  ShieldOff,
+  RefreshCw
 } from 'lucide-react';

-interface User {
-  id: string;
-  ipAddress: string;
-  macAddress: string;
-  hostname: string;
-  isBlocked: boolean;
-  isOnline: boolean;
-  lastSeen: Date;
-}
-
 export function UsersTable() {
   const [users, setUsers] = useState<User[]>([]);
   const [loading, setLoading] = useState(true);
+  const [actionLoading, setActionLoading] = useState<string | null>(null);

   const fetchUsers = async () => {
+    setLoading(true);
     try {
       const response = await fetch('/api/users');
-      const data = await response.json();
-      setUsers(data);
+      if (response.ok) {
+        const data = await response.json();
+        setUsers(data);
+      } else {
+        throw new Error('Failed to fetch users');
+      }
     } catch (error) {
       console.error('Error fetching users:', error);
+      toast.error('Failed to fetch users');
     } finally {
       setLoading(false);
     }
@@ .. @@
   const toggleUserBlock = async (userId: string, currentlyBlocked: boolean) => {
+    setActionLoading(userId);
     try {
       const endpoint = currentlyBlocked ? 'unblock' : 'block';
       const response = await fetch(`/api/users/${userId}/${endpoint}`, {
@@ -44,12 +47,18 @@ export function UsersTable() {
       });

       if (response.ok) {
+        const result = await response.json();
+        toast.success(result.message || `User ${currentlyBlocked ? 'unblocked' : 'blocked'} successfully`);
         // Refresh users list
         fetchUsers();
+      } else {
+        const error = await response.json();
+        throw new Error(error.error || 'Operation failed');
       }
     } catch (error) {
       console.error('Error toggling user block:', error);
+      toast.error(`Failed to ${currentlyBlocked ? 'unblock' : 'block'} user`);
+    } finally {
+      setActionLoading(null);
     }
   };
@@ .. @@
   return (
     <Card>
       <CardHeader>
-        <CardTitle className="flex items-center gap-2">
+        <CardTitle className="flex items-center justify-between">
+          <div className="flex items-center gap-2">
           <Users className="h-5 w-5" />
           Connected Users
+          </div>
+          <Button
+            variant="outline"
+            size="sm"
+            onClick={fetchUsers}
+            disabled={loading}
+          >
+            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
+          </Button>
         </CardTitle>
       </CardHeader>
       <CardContent>
@@ .. @@
                 <TableCell>{user.ipAddress}</TableCell>
                 <TableCell className="font-mono text-sm">{user.macAddress}</TableCell>
                 <TableCell>
-                  <Badge variant={user.isOnline ? "default" : "secondary"}>
+                  <Badge variant={user.isOnline ? "default" : "secondary"} className="flex items-center gap-1">
                     {user.isOnline ? (
-                      <Wifi className="h-3 w-3 mr-1" />
+                      <>
+                        <Wifi className="h-3 w-3" />
+                        Online
+                      </>
                     ) : (
-                      <WifiOff className="h-3 w-3 mr-1" />
+                      <>
+                        <WifiOff className="h-3 w-3" />
+                        Offline
+                      </>
                     )}
-                    {user.isOnline ? 'Online' : 'Offline'}
                   </Badge>
                 </TableCell>
                 <TableCell>
-                  <Badge variant={user.isBlocked ? "destructive" : "outline"}>
+                  <Badge variant={user.isBlocked ? "destructive" : "outline"} className="flex items-center gap-1">
                     {user.isBlocked ? (
-                      <ShieldOff className="h-3 w-3 mr-1" />
+                      <>
+                        <ShieldOff className="h-3 w-3" />
+                        Blocked
+                      </>
                     ) : (
-                      <Shield className="h-3 w-3 mr-1" />
+                      <>
+                        <Shield className="h-3 w-3" />
+                        Allowed
+                      </>
                     )}
-                    {user.isBlocked ? 'Blocked' : 'Allowed'}
                   </Badge>
                 </TableCell>
                 <TableCell>
                   <Switch
                     checked={!user.isBlocked}
                     onCheckedChange={() => toggleUserBlock(user.id, user.isBlocked)}
+                    disabled={actionLoading === user.id}
                   />
                 </TableCell>
               </TableRow>
@@ .. @@
         </Table>
+        
+        {users.length === 0 && !loading && (
+          <div className="text-center py-8 text-muted-foreground">
+            No users connected
+          </div>
+        )}
       </CardContent>
     </Card>
   );
 }