'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const COLORS = ['#10B981', '#EF4444', '#F59E0B', '#3B82F6'];

export function AdminStatsChart() {
  const [chartData, setChartData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    fetchChartData();
    const onResize = () => setIsMobile(window.innerWidth < 640);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const fetchChartData = async () => {
    try {
      const response = await fetch('/api/admin/chart-data');
      if (response.ok) {
        const data = await response.json();
        setChartData(data.provinceStats || []);
        setPieData(data.statusDistribution || []);
      }
    } catch (error) {
      console.error('Error fetching chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Router Distribution by Province</CardTitle>
          <CardDescription>Network infrastructure across Rwanda</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : chartData.length > 0 ? (
              <div className="w-full overflow-x-auto">
                <div
                  style={{
                    minWidth: Math.max(chartData.length * 64, 560),
                  }}
                  className="h-80 pr-2"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ top: 12, right: 16, left: 8, bottom: isMobile ? 48 : 24 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11 }}
                        angle={-45}
                        textAnchor="end"
                        interval={isMobile ? Math.ceil(chartData.length / 6) : 0}
                        tickFormatter={(v: string) => (isMobile && v.length > 10 ? `${v.slice(0, 9)}…` : v)}
                        height={isMobile ? 64 : 80}
                      />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Bar dataKey="online" fill="#10B981" name="Online" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="offline" fill="#EF4444" name="Offline" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="maintenance" fill="#F59E0B" name="Maintenance" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <p>No data available</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Router Status Distribution</CardTitle>
          <CardDescription>Overall network health overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={isMobile ? 72 : 84}
                    fill="#8884d8"
                    dataKey="value"
                    label={isMobile ? false : ({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <p>No data available</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}