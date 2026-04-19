import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// Ensure the connection URL is available
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined in the environment.");
}

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle({ client: sql });
