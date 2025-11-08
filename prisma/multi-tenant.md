# RWSDK Multi-Tenant Schema Foundation

This document provides the **bare minimum foundation** for creating a multi-tenant SaaS application using the linear architecture (shared database, shared schema with tenant isolation).

## Overview

**Architecture**: Linear Multi-Tenant
- Single database
- Single schema
- Tenant isolation via `tenantId` column
- All queries filtered by tenant context

## Minimal Core Schema

This schema includes ONLY the essential multi-tenant infrastructure. Add your own business models as needed.

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================================================
// CORE MULTI-TENANT MODELS - These are required
// ============================================================================

// Tenant model - represents each organization/customer
model Tenant {
  id        String       @id @default(cuid())
  name      String
  slug      String       @unique
  domain    String?      @unique
  status    TenantStatus @default(ACTIVE)
  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt

  // Relationships - add your models here
  users     User[]
  auditLogs AuditLog[]

  @@index([slug])
  @@index([status])
}

enum TenantStatus {
  ACTIVE
  SUSPENDED
  TRIAL
  CANCELLED
}

// User model with tenant isolation
model User {
  id        String   @id @default(cuid())
  tenantId  String
  email     String
  name      String?
  role      UserRole @default(MEMBER)
  avatar    String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relationships
  tenant    Tenant     @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  auditLogs AuditLog[]

  // Add relationships to your business models here
  // Example: posts Post[]
  // Example: comments Comment[]

  // Composite unique constraint allows same email across different tenants
  @@unique([tenantId, email])
  @@index([tenantId])
  @@index([email])
}

enum UserRole {
  OWNER
  ADMIN
  MEMBER
  GUEST
}

// Audit log for tracking tenant activity (optional but recommended)
model AuditLog {
  id        String   @id @default(cuid())
  tenantId  String
  userId    String?
  action    String
  entity    String
  entityId  String
  metadata  Json?
  ipAddress String?
  createdAt DateTime @default(now())

  // Relationships
  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  user   User?  @relation(fields: [userId], references: [id])

  @@index([tenantId])
  @@index([userId])
  @@index([createdAt])
  @@index([entity, entityId])
}

// ============================================================================
// YOUR BUSINESS MODELS GO HERE
// ============================================================================

// Example template for adding a new model:
// 
// model YourModel {
//   id        String   @id @default(cuid())
//   tenantId  String                              // REQUIRED
//   
//   // Your fields here
//   name      String
//   createdAt DateTime @default(now())
//   updatedAt DateTime @updatedAt
//
//   // Relationships
//   tenant    Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
//   
//   @@index([tenantId])                           // REQUIRED
// }
//
// Don't forget to add the relationship to the Tenant model:
// yourModels YourModel[]
```

## Prisma Middleware for Automatic Tenant Filtering

```typescript
// lib/prisma-middleware.ts
import { Prisma } from '@prisma/client'

export function createTenantMiddleware(tenantId: string) {
  return async (params: Prisma.MiddlewareParams, next: any) => {
    // Models that should be filtered by tenantId
    // UPDATE THIS ARRAY when you add new business models
    const tenantModels = ['User', 'AuditLog']
    
    if (tenantModels.includes(params.model || '')) {
      // Add tenantId to where clause for read operations
      if (params.action === 'findUnique' || params.action === 'findFirst') {
        params.args.where = { ...params.args.where, tenantId }
      }
      
      if (params.action === 'findMany') {
        if (params.args.where) {
          if (params.args.where.tenantId === undefined) {
            params.args.where.tenantId = tenantId
          }
        } else {
          params.args.where = { tenantId }
        }
      }
      
      // Add tenantId to data for create operations
      if (params.action === 'create') {
        params.args.data = { ...params.args.data, tenantId }
      }
      
      if (params.action === 'createMany') {
        if (Array.isArray(params.args.data)) {
          params.args.data = params.args.data.map((item: any) => ({
            ...item,
            tenantId
          }))
        }
      }
      
      // Add tenantId to where clause for update/delete operations
      if (params.action === 'update' || params.action === 'updateMany' || 
          params.action === 'delete' || params.action === 'deleteMany') {
        params.args.where = { ...params.args.where, tenantId }
      }
    }
    
    return next(params)
  }
}
```

## Database Client with Tenant Context

```typescript
// lib/db.ts
import { PrismaClient } from '@prisma/client'
import { createTenantMiddleware } from './prisma-middleware'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Create a tenant-scoped client
export function getTenantDb(tenantId: string) {
  const client = new PrismaClient()
  client.$use(createTenantMiddleware(tenantId))
  return client
}
```

## Tenant Context Provider (React)

```typescript
// lib/tenant-context.tsx
'use client'

import { createContext, useContext } from 'react'

interface TenantContext {
  tenantId: string
  tenant: {
    id: string
    name: string
    slug: string
    status: string
  } | null
}

const TenantContext = createContext<TenantContext | null>(null)

export function useTenant() {
  const context = useContext(TenantContext)
  if (!context) {
    throw new Error('useTenant must be used within TenantProvider')
  }
  return context
}

export const TenantProvider = TenantContext.Provider
```

## Usage Examples

### Server Action Example

```typescript
// app/actions/users.ts
'use server'

import { getTenantDb } from '@/lib/db'
import { auth } from '@/lib/auth' // Your auth solution

export async function getUsers() {
  const session = await auth()
  if (!session?.user?.tenantId) {
    throw new Error('Unauthorized')
  }

  const db = getTenantDb(session.user.tenantId)
  
  // tenantId filter is automatically applied by middleware
  return await db.user.findMany({
    orderBy: { createdAt: 'desc' }
  })
}
```

### API Route Example

```typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getTenantDb } from '@/lib/db'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = getTenantDb(session.user.tenantId)
  
  const users = await db.user.findMany()
  
  return NextResponse.json(users)
}
```

## Environment Variables

```bash
# .env
DATABASE_URL="postgresql://user:password@localhost:5432/myapp?schema=public"
```

## Setup Instructions

1. **Install Dependencies**
```bash
npm install @prisma/client
npm install -D prisma
```

2. **Initialize Prisma**
```bash
npx prisma init
```

3. **Create Schema**
- Copy the schema above into `prisma/schema.prisma`

4. **Create Migration**
```bash
npx prisma migrate dev --name init
```

5. **Generate Client**
i```bash
npx prisma generate
```

### Checklist for Each New Model

- [ ] Add `tenantId String` field
- [ ] Add tenant relationship: `tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)`
- [ ] Add index: `@@index([tenantId])`
- [ ] Add relationship to `Tenant` model (e.g., `posts Post[]`)
- [ ] Update `tenantModels` array in `prisma-middleware.ts`
- [ ] Run `npx prisma migrate dev --name add_your_model`


## Critical Security Rules

1. **ALWAYS add tenantId** - Every business model must have a `tenantId` field
2. **ALWAYS cascade delete** - Use `onDelete: Cascade` on tenant relationships
3. **ALWAYS add index** - Include `@@index([tenantId])` on every tenant model
4. **ALWAYS update middleware** - Add new models to `tenantModels` array
5. **NEVER query without context** - Always use `getTenantDb(tenantId)`
