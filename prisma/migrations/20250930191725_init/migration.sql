-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('ADMIN', 'STAFF');

-- CreateEnum
CREATE TYPE "public"."RouterStatus" AS ENUM ('ONLINE', 'OFFLINE', 'MAINTENANCE', 'ERROR');

-- CreateEnum
CREATE TYPE "public"."ConnectedUserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "public"."AlertStatus" AS ENUM ('ACTIVE', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "public"."AlertType" AS ENUM ('OFFLINE', 'HIGH_BANDWIDTH', 'LOW_BANDWIDTH', 'CONNECTION_ERROR', 'MAINTENANCE', 'SECURITY');

-- CreateEnum
CREATE TYPE "public"."AlertSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL DEFAULT 'STAFF',
    "image" TEXT,
    "assignedProvinceId" TEXT,
    "assignedDistrictId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."provinces" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL DEFAULT '',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provinces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."districts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL DEFAULT '',
    "provinceId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "districts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."towns" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL DEFAULT '',
    "districtId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "towns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."routers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "macAddress" TEXT,
    "status" "public"."RouterStatus" NOT NULL DEFAULT 'OFFLINE',
    "uptime" INTEGER NOT NULL DEFAULT 0,
    "bandwidth" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "capacity" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "bandwidthLimit" DOUBLE PRECISION,
    "location" TEXT,
    "townId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastSeen" TIMESTAMP(3),

    CONSTRAINT "routers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."connected_users" (
    "id" TEXT NOT NULL,
    "deviceName" TEXT,
    "ipAddress" TEXT NOT NULL,
    "macAddress" TEXT NOT NULL,
    "status" "public"."ConnectedUserStatus" NOT NULL DEFAULT 'ACTIVE',
    "bandwidth" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalUsage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "routerId" TEXT NOT NULL,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "blockedAt" TIMESTAMP(3),
    "blockedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "connected_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."alerts" (
    "id" TEXT NOT NULL,
    "routerId" TEXT NOT NULL,
    "type" "public"."AlertType" NOT NULL DEFAULT 'OFFLINE',
    "message" TEXT NOT NULL,
    "severity" "public"."AlertSeverity" NOT NULL DEFAULT 'MEDIUM',
    "status" "public"."AlertStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'general',
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "public"."users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "provinces_name_key" ON "public"."provinces"("name");

-- CreateIndex
CREATE UNIQUE INDEX "provinces_code_key" ON "public"."provinces"("code");

-- CreateIndex
CREATE INDEX "districts_provinceId_idx" ON "public"."districts"("provinceId");

-- CreateIndex
CREATE UNIQUE INDEX "districts_name_provinceId_key" ON "public"."districts"("name", "provinceId");

-- CreateIndex
CREATE UNIQUE INDEX "districts_code_provinceId_key" ON "public"."districts"("code", "provinceId");

-- CreateIndex
CREATE INDEX "towns_districtId_idx" ON "public"."towns"("districtId");

-- CreateIndex
CREATE UNIQUE INDEX "towns_name_districtId_key" ON "public"."towns"("name", "districtId");

-- CreateIndex
CREATE UNIQUE INDEX "towns_code_districtId_key" ON "public"."towns"("code", "districtId");

-- CreateIndex
CREATE UNIQUE INDEX "routers_ipAddress_key" ON "public"."routers"("ipAddress");

-- CreateIndex
CREATE INDEX "routers_status_idx" ON "public"."routers"("status");

-- CreateIndex
CREATE INDEX "routers_townId_idx" ON "public"."routers"("townId");

-- CreateIndex
CREATE INDEX "routers_createdById_idx" ON "public"."routers"("createdById");

-- CreateIndex
CREATE INDEX "connected_users_routerId_idx" ON "public"."connected_users"("routerId");

-- CreateIndex
CREATE UNIQUE INDEX "connected_users_macAddress_routerId_key" ON "public"."connected_users"("macAddress", "routerId");

-- CreateIndex
CREATE INDEX "logs_userId_idx" ON "public"."logs"("userId");

-- CreateIndex
CREATE INDEX "alerts_status_idx" ON "public"."alerts"("status");

-- CreateIndex
CREATE INDEX "alerts_routerId_idx" ON "public"."alerts"("routerId");

-- CreateIndex
CREATE UNIQUE INDEX "settings_key_key" ON "public"."settings"("key");

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_assignedProvinceId_fkey" FOREIGN KEY ("assignedProvinceId") REFERENCES "public"."provinces"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_assignedDistrictId_fkey" FOREIGN KEY ("assignedDistrictId") REFERENCES "public"."districts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."districts" ADD CONSTRAINT "districts_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "public"."provinces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."towns" ADD CONSTRAINT "towns_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "public"."districts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."routers" ADD CONSTRAINT "routers_townId_fkey" FOREIGN KEY ("townId") REFERENCES "public"."towns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."routers" ADD CONSTRAINT "routers_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."connected_users" ADD CONSTRAINT "connected_users_routerId_fkey" FOREIGN KEY ("routerId") REFERENCES "public"."routers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."logs" ADD CONSTRAINT "logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."alerts" ADD CONSTRAINT "alerts_routerId_fkey" FOREIGN KEY ("routerId") REFERENCES "public"."routers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."alerts" ADD CONSTRAINT "alerts_resolvedBy_fkey" FOREIGN KEY ("resolvedBy") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
