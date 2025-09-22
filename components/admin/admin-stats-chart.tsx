  'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const COLORS = ['#10B981', '#EF4444', '#F59E0B', '#3B82F6'];

export function AdminStatsChart() {
  interface ProvinceStats {
    name: string;
    online?: number;
    offline?: number;
    maintenance?: number;
    total?: number;
  }

  const [chartData, setChartData] = useState<ProvinceStats[]>([]);
  const [pieData, setPieData] = useState<Array<{name: string, value: number}>>([]);
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
        // Calculate total routers for each province
        const statsWithTotal = (data.provinceStats || []).map((province: ProvinceStats) => ({
          ...province,
          total: (province.online || 0) + (province.offline || 0) + (province.maintenance || 0)
        }));
        setChartData(statsWithTotal);
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
                    minWidth: '100%',
                    width: '100%',
                    maxWidth: '100%',
                  }}
                  className="h-80 px-2"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{
                        top: 12,
                        right: isMobile ? 8 : 16,
                        left: isMobile ? 4 : 8,
                        bottom: isMobile ? 56 : 24
                      }}
                      barGap={isMobile ? 2 : 4}
                      barCategoryGap={isMobile ? '15%' : '20%'}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: isMobile ? 10 : 11 }}
                        angle={isMobile ? -30 : -45}
                        textAnchor="end"
                        interval={0}
                        height={isMobile ? 72 : 80}
                        minTickGap={0}
                        tickMargin={8}
                      />
                      <YAxis
                        tick={{ fontSize: isMobile ? 10 : 11 }}
                        width={isMobile ? 24 : 30}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                          fontSize: isMobile ? '12px' : '13px',
                          padding: '8px 12px'
                        }}
                        itemStyle={{
                          padding: '2px 0',
                          textTransform: 'capitalize'
                        }}
                        formatter={(value, province, props) => {
                          const total = props.payload.total || 0;
                          if (province === 'Online') {
                            return [
                              `${value} ${province} (${total} total)`,
                              province,
                              props.fill
                            ];
                          }
                          return [value, province, props.fill];
                        }}
                        labelFormatter={(label) => `${label}`}
                      />
                      <Bar
                        dataKey="online"
                        fill="#10B981"
                        province="Online"
                        radius={[2, 2, 0, 0]}
                        maxBarSize={isMobile ? 24 : 32}
                        label={({ x, y, width, payload, value }: {
                          x: number;
                          y: number;
                          width: number;
                          payload: { payload: { total: number } };
                          value: number;
                        }): React.ReactElement => {
                          const total = payload?.payload?.total || 0;
                          // Return a transparent text element if value is falsy
                          if (!value) {
                            return <text style={{ display: 'none' }} />;
                          }
                          return (
                            <text
                              x={x + width / 2}
                              y={y - 5}
                              fill="#374151"
                              textAnchor="middle"
                              fontSize={isMobile ? 10 : 11}
                              fontWeight="500"
                            >
                              {total}
                            </text>
                          );
                        }}
                      />
                      <Bar
                        dataKey="offline"
                        fill="#EF4444"
                        province="Offline"
                        radius={[2, 2, 0, 0]}
                        maxBarSize={isMobile ? 24 : 32}
                      />
                      <Bar
                        dataKey="maintenance"
                        fill="#F59E0B"
                        province="Maintenance"
                        radius={[2, 2, 0, 0]}
                        maxBarSize={isMobile ? 24 : 32}
                      />
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
                    label={isMobile ? false : ({ province, percent }) => `${province} ${(percent * 100).toFixed(0)}%`}
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