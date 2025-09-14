"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AdminStatsChart } from "@/components/admin/admin-stats-chart";
import { RecentActivity } from "@/components/admin/recent-activity";
import { Settings, MapPin, Router, Users, UserCheck } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();

  const adminRoutes = [
    {
      title: "System Settings",
      description: "Configure system preferences and parameters",
      icon: Settings,
      path: "/admin/settings",
      color: "bg-blue-500"
    },
    {
      title: "Location Management",
      description: "Manage provinces, districts, and towns",
      icon: MapPin,
      path: "/admin/locations",
      color: "bg-green-500"
    },
    {
      title: "Router Management",
      description: "Manage network routers and access points",
      icon: Router,
      path: "/admin/routers",
      color: "bg-purple-500"
    },
    {
      title: "Staff Management",
      description: "Manage staff accounts and assignments",
      icon: UserCheck,
      path: "/admin/staff",
      color: "bg-orange-500"
    },
    {
      title: "User Access Control",
      description: "Monitor and control user network access",
      icon: Users,
      path: "/admin/users",
      color: "bg-red-500"
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Welcome to the network management system</p>
      </div>

      {/* Admin Navigation Cards */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Administration</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {adminRoutes.map((route) => {
            const Icon = route.icon;
            return (
              <Card key={route.path} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push(route.path)}>
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${route.color} text-white`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{route.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{route.description}</p>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>
      
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Network Overview</h2>
          <AdminStatsChart />
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
            <RecentActivity />
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4">Quick Stats</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground">+0% from last month</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground">+0% from last month</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}