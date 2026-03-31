import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Define the global Prisma object to prevent multiple instances
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// 1. Initialize the new Prisma 7 Postgres Adapter
const adapter = new PrismaPg({ 
    connectionString: process.env.DATABASE_URL! 
});

// 2. Pass the adapter into the client
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter, // <-- The new v7 requirement
    log: ["query"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;