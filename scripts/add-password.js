const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const connStr = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  const client = new Client({ connectionString: connStr });
  await client.connect();
  await client.query('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "password" text;');
  console.log('SUCCESS: password column added to User table in Neon Postgres!');
  await client.end();
}
run().catch(console.error);
