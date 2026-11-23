import 'dotenv/config';
import { db } from '../src/prisma/db.js';

async function seed() {
  console.log('Seeding initial tournament and players into Neon PostgreSQL...');

  // Ensure Admin user
  let admin = await db.orm.public.User.where({ email: 'admin@hostelfc.arena' }).first();
  if (!admin) {
    admin = await db.orm.public.User.create({
      email: 'admin@hostelfc.arena',
      username: 'arena_admin',
      name: 'Hostel Arena Admin',
      role: 'ADMIN',
      roomNumber: 'A101',
      hostelBlock: 'Hall 7',
      eloRating: 1600,
    });
  }

  // Create 8 players if not present
  const playersData = [
    { username: 'kwame_ronaldo', name: 'Kwame Mensah', room: 'B12', block: 'Hall 7', elo: 1540, team: 'Real Madrid' },
    { username: 'tunde_messi', name: 'Tunde Bakare', room: 'C04', block: 'Hall 4', elo: 1490, team: 'Inter Miami' },
    { username: 'chidi_mbappe', name: 'Chidi Okonkwo', room: 'A22', block: 'Hall 2', elo: 1420, team: 'Paris Saint-Germain' },
    { username: 'emeka_haaland', name: 'Emeka Eze', room: 'D15', block: 'Hall 1', elo: 1395, team: 'Manchester City' },
    { username: 'kofi_saka', name: 'Kofi Asare', room: 'B08', block: 'Hall 7', elo: 1360, team: 'Arsenal' },
    { username: 'femi_bellingham', name: 'Femi Adeyemi', room: 'C19', block: 'Hall 4', elo: 1320, team: 'Bayern Munich' },
    { username: 'abdul_vinicius', name: 'Abdulrahman Yusuf', room: 'A03', block: 'Hall 3', elo: 1290, team: 'Barcelona' },
    { username: 'segun_rodri', name: 'Segun Alabi', room: 'D02', block: 'Hall 1', elo: 1250, team: 'Liverpool' },
  ];

  const userIds: { [username: string]: number } = {};
  for (const p of playersData) {
    let u = await db.orm.public.User.where({ username: p.username }).first();
    if (!u) {
      u = await db.orm.public.User.create({
        email: `${p.username}@hostelfc.arena`,
        username: p.username,
        name: p.name,
        role: 'PLAYER',
        roomNumber: p.room,
        hostelBlock: p.block,
        eloRating: p.elo,
      });
    }
    userIds[p.username] = u.id;
  }

  // Check if tournament exists
  let tournament = await db.orm.public.Tournament.where({ slug: 'hall-championship-2026' }).first();
  if (!tournament) {
    const rules = JSON.stringify({
      legs: 1,
      halfDurationMinutes: 6,
      extraTime: 'CLASSIC',
      penaltiesEnabled: true,
      gameSpeed: 'NORMAL',
      difficulty: 'LEGENDARY',
      customNotes: 'No tactical pause during active open play. 3 pauses max per match.',
    });

    tournament = await db.orm.public.Tournament.create({
      title: 'Hall 7 Inter-Hostel Champions Cup',
      slug: 'hall-championship-2026',
      description: 'The premier FC 26 hostel tournament. Single-elimination championship knockout.',
      format: 'SINGLE_ELIMINATION',
      status: 'IN_PROGRESS',
      teamSelectionRule: 'EXCLUSIVE',
      maxParticipants: 8,
      minParticipants: 4,
      entryFee: '₦2,500',
      prizePool: '₦150,000',
      rules,
      bannerUrl: '/UEFA-Champions-League-Trophy-Cup-44187.png',
      adminId: admin.id,
    });
    console.log('Created tournament:', tournament.title);
  }

  // Register and approve 8 participants
  const partMap: { [username: string]: number } = {};
  for (let i = 0; i < playersData.length; i++) {
    const p = playersData[i];
    const uId = userIds[p.username];
    let part = await db.orm.public.TournamentParticipant.where({
      tournamentId: tournament.id,
      userId: uId,
    }).first();

    if (!part) {
      part = await db.orm.public.TournamentParticipant.create({
        tournamentId: tournament.id,
        userId: uId,
        teamName: p.team,
        seed: i + 1,
        status: 'APPROVED',
      });
    }
    partMap[p.username] = part.id;
  }

  // Create quarter-final matches if not already generated
  const existingMatches = await db.orm.public.Match.all();
  const tourneyMatches = existingMatches.filter((m) => m.tournamentId === tournament.id);

  if (tourneyMatches.length === 0) {
    const matchups = [
      { home: 'kwame_ronaldo', away: 'segun_rodri', num: 1, hScore: 3, aScore: 1, status: 'COMPLETED' },
      { home: 'tunde_messi', away: 'abdul_vinicius', num: 2, hScore: 2, aScore: 0, status: 'COMPLETED' },
      { home: 'chidi_mbappe', away: 'femi_bellingham', num: 3, hScore: 4, aScore: 2, status: 'COMPLETED' },
      { home: 'emeka_haaland', away: 'kofi_saka', num: 4, hScore: null, aScore: null, status: 'SCHEDULED' },
    ];

    for (const m of matchups) {
      await db.orm.public.Match.create({
        tournamentId: tournament.id,
        stage: 'Quarter-Finals',
        round: 1,
        matchNumber: m.num,
        homeParticipantId: partMap[m.home],
        awayParticipantId: partMap[m.away],
        homeScore: m.hScore,
        awayScore: m.aScore,
        status: m.status,
      });
    }
    console.log('Generated initial matches in Neon.');
  }

  console.log('✅ Neon database successfully seeded!');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
