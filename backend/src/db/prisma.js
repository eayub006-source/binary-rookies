import 'dotenv/config';
import pg from 'pg';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// Use DIRECT_URL for long-lived Node server. Pool with SSL and keepAlive for Supabase stability.
const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
let adapter;
if (connectionString) {
  const pool = new pg.Pool({
    connectionString,
    ssl: connectionString.includes('supabase') ? { rejectUnauthorized: false } : false,
    keepAlive: true,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 0,
    max: 4,
  });
  adapter = new PrismaPg(pool);
}
const prisma = new PrismaClient(adapter ? { adapter } : {});

export default prisma;
