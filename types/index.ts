export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'STAFF';
  assignedProvinceId?: string;
  assignedDistrictId?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  assignedProvince?: Province;
  assignedDistrict?: District;
}

export interface Province {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  districts?: District[];
  _count?: {
    districts: number;
    users: number;
  };
}

export interface District {
  id: string;
  name: string;
  code: string;
  provinceId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  province?: Province;
  towns?: Town[];
  _count?: {
    towns: number;
    users: number;
  };
}

export interface Town {
  id: string;
  name: string;
  code: string;
  districtId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  district?: District;
  routers?: Router[];
  _count?: {
    routers: number;
  };
}

export interface Router {
  id: string;
  name: string;
  model: string;
  ipAddress: string;
  macAddress?: string;
  status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE' | 'ERROR';
  uptime: number;
  bandwidth: number;
  capacity: number;
  townId: string;
  location?: string;
  createdAt: Date;
  updatedAt: Date;
  lastSeen?: Date;
  town?: Town;
}

export interface Log {
  id: string;
  userId: string;
  action: string;
  details?: string;
  timestamp: Date;
  user?: User;
}

export interface Alert {
  id: string;
  routerId: string;
  message: string;
  status: 'ACTIVE' | 'RESOLVED' | 'DISMISSED';
  createdAt: Date;
  updatedAt: Date;
  userId?: string;
  router?: Router;
  user?: User;
}

export interface DashboardStats {
  totalRouters: number;
  onlineRouters: number;
  offlineRouters: number;
  totalStaff: number;
  activeAlerts: number;
  totalProvinces: number;
  totalDistricts: number;
  totalTowns: number;
  averageUptime: number;
  totalBandwidth: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  online?: number;
  offline?: number;
  maintenance?: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'STAFF';
  assignedProvinceId?: string;
  assignedDistrictId?: string;
}

export interface CreateRouterData {
  name: string;
  model: string;
  ipAddress: string;
  capacity: number;
  townId: string;
}

export interface ConnectedUser {
  id: string;
  deviceName?: string;
  ipAddress: string;
  macAddress: string;
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  bandwidth: number;
  totalUsage: number;
  routerId: string;
  isBlocked: boolean;
  blockedAt?: Date;
  blockedBy?: string;
  createdAt: Date;
  updatedAt: Date;
  lastSeen: Date;
  router?: Router;
}