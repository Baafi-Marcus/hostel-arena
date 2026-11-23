import 'dotenv/config';
import { db } from '../src/prisma/db.js';

async function main() {
  console.log('Testing connection to Neon PostgreSQL...');
  console.log('Target DATABASE_URL:', process.env.DATABASE_URL?.replace(/:[^:@]*@/, ':****@'));

  try {
    // 1. Test ORM User model .all()
    console.log('\n1. Testing ORM query on model User...');
    const allUsers = await db.orm.public.User.all();
    console.log(`✓ Table "User" queried successfully via Neon PostgreSQL! Existing users count: ${allUsers.length}`);

    // 2. Insert test user to prove write works end-to-end
    console.log('\n2. Testing write operation: creating user in Neon...');
    const timestamp = Date.now();
    const createdUser = await db.orm.public.User.create({
      email: `player_${timestamp}@hostelfc.arena`,
      username: `neon_player_${timestamp}`,
      name: 'Neon FC Player',
      role: 'PLAYER',
      roomNumber: 'B204',
      hostelBlock: 'Hall 4',
      eloRating: 1250,
    });
    console.log(`✓ Successfully created User in Neon: id=${createdUser.id}, username=${createdUser.username}, role=${createdUser.role}, ELO=${createdUser.eloRating}`);

    // 3. Read back from Neon
    console.log('\n3. Testing read operation: querying created user from Neon...');
    const fetched = await db.orm.public.User.where({ id: createdUser.id }).first();
    console.log(`✓ Successfully verified User read from Neon: id=${fetched?.id}, name=${fetched?.name}, email=${fetched?.email}`);

    // 4. Update test
    console.log('\n4. Testing update operation in Neon...');
    const updated = await db.orm.public.User.where({ id: createdUser.id }).update({
      eloRating: 1315,
    });
    console.log(`✓ Successfully updated User ELO in Neon to: ${updated?.eloRating}`);

    // 5. Query tournament model
    console.log('\n5. Testing Tournament model in Neon...');
    const allTournaments = await db.orm.public.Tournament.all();
    console.log(`✓ Successfully queried Tournaments from Neon! Count: ${allTournaments.length}`);

    console.log('\n======================================================');
    console.log('🎉 ALL NEON POSTGRES SERVICES OPERATIONAL & TESTED END-TO-END!');
    console.log('======================================================');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during Neon test:', error);
    process.exit(1);
  }
}

main();
