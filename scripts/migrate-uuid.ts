// One-time migration: drop ride_requests and ride_pools, then re-push with UUID
import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);

async function migrate() {
  console.log('Dropping ride_requests table...');
  await sql`DROP TABLE IF EXISTS ride_requests CASCADE`;
  
  console.log('Dropping ride_pools table...');
  await sql`DROP TABLE IF EXISTS ride_pools CASCADE`;
  
  console.log('Done! Now run: npx drizzle-kit push');
}

migrate().catch(console.error);
