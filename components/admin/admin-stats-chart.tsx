'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#10B981', '#EF4444', '#F59E0B'];

export function AdminStatsChart() {
  const [chartData, setChartData] = useState([]);
  const [pieData, setPieData] = useState([]);

  useEffect(() => {
    fetchChartData();
  }, []);

  const fetchChartData = async () => {
    try {
      const response = await fetch('/api/admin/chart-data');
      if (response.ok) {
        const data = await response.json();
        setChartData(data.provinceStats);
        setPieData(data.statusDistribution);
      }
    } catch (error) {
      console.error('Error fetching chart data:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Network Overview</CardTitle>
        <CardDescription>Router distribution across provinces</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="online" fill="#10B981" name="Online" />
              <Bar dataKey="offline" fill="#EF4444" name="Offline" />
              <Bar dataKey="maintenance" fill="#F59E0B" name="Maintenance" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}