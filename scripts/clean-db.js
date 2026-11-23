const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });
if (!process.env.DATABASE_URL) {
  require('dotenv').config({ path: '.env' });
}

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function clean() {
  console.log('Connecting to Neon PostgreSQL...');
  await client.connect();

  console.log('Cleaning test/seed records from database tables...');
  
  // Truncate tables with CASCADE to safely remove foreign-key dependent rows
  await client.query(`
    TRUNCATE TABLE 
      "MatchDispute",
      "Match",
      "Standing",
      "TournamentParticipant",
      "Announcement",
      "Notification",
      "Tournament",
      "User"
    CASCADE;
  `);

  console.log('All test data cleanly wiped from database tables!');
  
  // Verify counts
  const tables = ['User', 'Tournament', 'TournamentParticipant', 'Match', 'Announcement'];
  for (const t of tables) {
    const r = await client.query(`SELECT count(*) FROM "${t}"`);
    console.log(`${t} count:`, r.rows[0].count);
  }

  await client.end();
  console.log('Database clean-up complete. Ready for real production!');
}

clean().catch((err) => {
  console.error('Database clean-up failed:', err);
  process.exit(1);
});
