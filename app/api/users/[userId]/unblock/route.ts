@@ .. @@
 import { NextRequest, NextResponse } from 'next/server';
 import pfSenseAPI from '@/lib/pfsense-api';
 import prisma from '@/lib/prisma';
 
-export async function POST(request: NextRequest, { params }: { params: { userId: string } }) {
+export async function POST(
+  request: NextRequest, 
+  { params }: { params: { userId: string } }
+) {
   try {
     const { userId } = params;
+    
+    if (!userId) {
+      return NextResponse.json(
+        { error: 'User ID is required' },
+        { status: 400 }
+      );
+    }
 
     // Get user from database
     const user = await prisma.user.findUnique({
@@ .. @@
     }
 
     // Unblock user via pfSense
-    const success = await pfSenseAPI.unblockUser(userId, user.ipAddress);
+    const unblockSuccess = await pfSenseAPI.unblockUser(userId, user.ipAddress);
 
-    if (success) {
+    if (unblockSuccess) {
       // Update user status in database
       await prisma.user.update({
@@ .. @@
       // Log the action
       await prisma.activityLog.create({
         data: {
-          action: 'UNBLOCK_USER',
+          action: 'USER_UNBLOCKED',
           userId: userId,
           userIp: user.ipAddress,
-          details: `User ${user.hostname} (${user.ipAddress}) unblocked via dashboard`
+          details: `User ${user.hostname || 'Unknown'} (${user.ipAddress}) unblocked via dashboard`
         }
       });
 
-      return NextResponse.json({ success: true });
+      return NextResponse.json({ 
+        success: true, 
+        message: 'User unblocked successfully' 
+      });
     } else {
       return NextResponse.json(
-        { error: 'Failed to unblock user' },
+        { error: 'Failed to unblock user via pfSense' },
         { status: 500 }
       );
     }
@@ .. @@
   } catch (error) {
     console.error('Error unblocking user:', error);
     return NextResponse.json(
-      { error: 'Internal server error' },
+      { error: 'Internal server error', details: error.message },
       { status: 500 }
     );
   }
 }