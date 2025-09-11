@@ .. @@
 import { NextResponse } from 'next/server';
 import pfSenseAPI from '@/lib/pfsense-api';
 import prisma from '@/lib/prisma';
+import { User } from '@/types';
 
 export async function GET() {
   try {
@@ .. @@
     
     // Store/update users in database
     const dbUsers = await Promise.all(
       connectedUsers.map(async (user) => {
-        return await prisma.user.upsert({
+        const dbUser = await prisma.user.upsert({
           where: { ipAddress: user.ipAddress },
           update: {
             macAddress: user.macAddress,
@@ .. @@
             lastSeen: user.lastSeen,
           }
         });
+        
+        return {
+          ...dbUser,
+          currentBandwidth: user.bandwidth || 0,
+          totalBandwidth: await getTotalBandwidth(dbUser.id)
+        };
       })
     );
 
-    return NextResponse.json(dbUsers);
+    return NextResponse.json(dbUsers);
   } catch (error) {
     console.error('Error fetching users:', error);
     return NextResponse.json(
       { error: 'Failed to fetch users' },
       { status: 500 }
     );
   }
+}
+
+async function getTotalBandwidth(userId: string): Promise<number> {
+  try {
+    const logs = await prisma.bandwidthLog.findMany({
+      where: { userId },
+      select: { totalBytes: true }
+    });
+    
+    return logs.reduce((total, log) => total + log.totalBytes, 0);
+  } catch (error) {
+    console.error('Error calculating total bandwidth:', error);
+    return 0;
+  }
 }