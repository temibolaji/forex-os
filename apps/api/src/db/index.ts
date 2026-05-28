import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || 'postgres://user:password@localhost:5432/forexos';

const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');

const client = postgres(connectionString, { 
  prepare: false, 
  ssl: isLocal ? false : 'require',
  max: 10,
  connect_timeout: 10
});
export const db = drizzle(client, { schema });
