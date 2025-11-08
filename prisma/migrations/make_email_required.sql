-- Migration: Make email required, username optional
-- Since SQLite doesn't support ALTER COLUMN, we need to recreate the User table

-- This migration assumes you're OK with wiping existing user data
-- Run this migration on your D1 database in production

-- 1. Drop existing User table and related tables (cascade delete)
DROP TABLE IF EXISTS AuditLog;
DROP TABLE IF EXISTS RouteShare;
DROP TABLE IF EXISTS Route;
DROP TABLE IF EXISTS TenantMembership;
DROP TABLE IF EXISTS Tenant;
DROP TABLE IF EXISTS Credential;
DROP TABLE IF EXISTS User;

-- 2. Recreate User table with email as required
CREATE TABLE User (
    id TEXT PRIMARY KEY NOT NULL,
    email TEXT NOT NULL UNIQUE,
    username TEXT UNIQUE,
    name TEXT,
    avatar TEXT,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL
);

CREATE INDEX User_email_idx ON User(email);
CREATE INDEX User_username_idx ON User(username);

-- 3. Recreate Credential table
CREATE TABLE Credential (
    id TEXT PRIMARY KEY NOT NULL,
    userId TEXT NOT NULL UNIQUE,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    credentialId TEXT NOT NULL UNIQUE,
    publicKey BLOB NOT NULL,
    counter INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (userId) REFERENCES User(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX Credential_credentialId_idx ON Credential(credentialId);
CREATE INDEX Credential_userId_idx ON Credential(userId);

-- 4. Recreate Tenant table
CREATE TABLE Tenant (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    domain TEXT UNIQUE,
    status TEXT NOT NULL DEFAULT 'TRIAL',
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL
);

CREATE INDEX Tenant_slug_idx ON Tenant(slug);
CREATE INDEX Tenant_status_idx ON Tenant(status);

-- 5. Recreate TenantMembership table
CREATE TABLE TenantMembership (
    id TEXT PRIMARY KEY NOT NULL,
    tenantId TEXT NOT NULL,
    userId TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'GUEST',
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL,
    FOREIGN KEY (tenantId) REFERENCES Tenant(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE(tenantId, userId)
);

CREATE INDEX TenantMembership_tenantId_idx ON TenantMembership(tenantId);
CREATE INDEX TenantMembership_userId_idx ON TenantMembership(userId);

-- 6. Recreate Route table
CREATE TABLE Route (
    id TEXT PRIMARY KEY NOT NULL,
    tenantId TEXT NOT NULL,
    createdById TEXT NOT NULL,
    name TEXT NOT NULL,
    date DATETIME NOT NULL,
    startTime TEXT,
    properties TEXT NOT NULL,
    optimized INTEGER NOT NULL DEFAULT 0,
    frozen TEXT,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL,
    FOREIGN KEY (tenantId) REFERENCES Tenant(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (createdById) REFERENCES User(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX Route_tenantId_idx ON Route(tenantId);
CREATE INDEX Route_createdById_idx ON Route(createdById);
CREATE INDEX Route_date_idx ON Route(date);

-- 7. Recreate RouteShare table
CREATE TABLE RouteShare (
    id TEXT PRIMARY KEY NOT NULL,
    routeId TEXT NOT NULL,
    sharedById TEXT NOT NULL,
    sharedWithUserId TEXT,
    sharedWithTenantId TEXT,
    permission TEXT NOT NULL DEFAULT 'VIEW',
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (routeId) REFERENCES Route(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (sharedById) REFERENCES User(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    UNIQUE(routeId, sharedWithUserId, sharedWithTenantId)
);

CREATE INDEX RouteShare_routeId_idx ON RouteShare(routeId);
CREATE INDEX RouteShare_sharedWithUserId_idx ON RouteShare(sharedWithUserId);
CREATE INDEX RouteShare_sharedWithTenantId_idx ON RouteShare(sharedWithTenantId);

-- 8. Recreate AuditLog table
CREATE TABLE AuditLog (
    id TEXT PRIMARY KEY NOT NULL,
    tenantId TEXT NOT NULL,
    userId TEXT,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entityId TEXT NOT NULL,
    metadata TEXT,
    ipAddress TEXT,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenantId) REFERENCES Tenant(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (userId) REFERENCES User(id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX AuditLog_tenantId_idx ON AuditLog(tenantId);
CREATE INDEX AuditLog_userId_idx ON AuditLog(userId);
CREATE INDEX AuditLog_createdAt_idx ON AuditLog(createdAt);
CREATE INDEX AuditLog_entity_entityId_idx ON AuditLog(entity, entityId);
