@@ .. @@
 import { NextResponse } from 'next/server';
 import pfSenseAPI from '@/lib/pfsense-api';
 import prisma from '@/lib/prisma';
+import { formatBytes } from '@/lib/utils/bandwidth';
 
 export async function GET() {
   try {
-    // Get bandwidth data for all users
-    const users = await prisma.user.findMany();
+    // Get all active users
+    const users = await prisma.user.findMany({
+      where: {
+        isOnline: true
+      }
+    });
     
     const bandwidthData = await Promise.all(
       users.map(async (user) => {
@@ -28,6 +34,7 @@ export async function GET() {
           userId: user.id,
           ipAddress: user.ipAddress,
           hostname: user.hostname,
+          macAddress: user.macAddress,
           data: data
         };
       })
@@ .. @@
     // Store bandwidth logs in database
     await Promise.all(
       bandwidthData.map(async (userBandwidth) => {
-        const latestData = userBandwidth.data[userBandwidth.data.length - 1];
-        if (latestData) {
+        if (userBandwidth.data && userBandwidth.data.length > 0) {
+          const latestData = userBandwidth.data[userBandwidth.data.length - 1];
           await prisma.bandwidthLog.create({
             data: {
               userId: userBandwidth.userId,
@@ .. @@
               totalBytes: latestData.download + latestData.upload
             }
           });
         }
       })
     );

-    return NextResponse.json(bandwidthData);
+    // Return formatted data for charts
+    const formattedData = bandwidthData.map(user => ({
+      ...user,
+      data: user.data.map(point => ({
+        ...point,
+        downloadFormatted: formatBytes(point.download),
+        uploadFormatted: formatBytes(point.upload),
+        totalFormatted: formatBytes(point.download + point.upload)
+      }))
+    }));
+
+    return NextResponse.json(formattedData);
   } catch (error) {
     console.error('Error fetching bandwidth data:', error);
     return NextResponse.json(
-      { error: 'Failed to fetch bandwidth data' },
+      { error: 'Failed to fetch bandwidth data', details: error.message },
       { status: 500 }
     );
   }
 }