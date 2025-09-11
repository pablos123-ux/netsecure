export interface User {
  id: string;
  ipAddress: string;
  macAddress: string;
  hostname: string;
  isBlocked: boolean;
  isOnline: boolean;
  lastSeen: Date;
  totalBandwidth: number;
  currentBandwidth: number;
}

export interface BandwidthData {
  timestamp: Date;
  userId: string;
  downloadSpeed: number;
  uploadSpeed: number;
  totalBytes: number;
}

export interface ActivityLog {
  id: string;
  action: string;
  userId: string;
  userIp: string;
  timestamp: Date;
  details: string;
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  blockedUsers: number;
  totalBandwidth: number;
}

export interface ChartDataPoint {
  time: string;
  download: number;
  upload: number;
  total: number;
}