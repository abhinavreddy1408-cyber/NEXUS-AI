// FILE: src/server/db.ts
// Prisma DB connection disabled - using mock data for demo
// import { PrismaClient } from "@prisma/client";
//
// const globalForPrisma = globalThis as unknown as {
//   prisma: PrismaClient | undefined;
// };
//
// export const db =
//   globalForPrisma.prisma ??
//   new PrismaClient({
//     log: ["error"],
//   });
//
// if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

export const db = null; // Mock placeholder
