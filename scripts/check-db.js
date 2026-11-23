const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });
if (!process.env.DATABASE_URL) {
  require('dotenv').config({ path: '.env' });
}

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function check() {
  await client.connect();
  const tables = ['User', 'Tournament', 'TournamentParticipant', 'Match', 'Announcement'];
  for (const t of tables) {
    const r = await client.query(`SELECT count(*) FROM "${t}"`);
    console.log(`${t} count:`, r.rows[0].count);
  }
  const users = await client.query(`SELECT id, username, name, role FROM "User" LIMIT 10`);
  console.log('Sample users:', users.rows);
  await client.end();
}

check().catch(console.error);
