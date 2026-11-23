import { NextResponse } from 'next/server';
import { db } from '@/prisma/db';
import { generateTournamentFixtures, TournamentRulesConfig } from '@/lib/tournament-engine';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tournamentId = parseInt(id, 10);
    if (isNaN(tournamentId)) {
      return NextResponse.json({ error: 'Invalid tournament ID' }, { status: 400 });
    }

    const tournament = await db.orm.public.Tournament.where({ id: tournamentId }).first();
    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    // Retrieve approved participants
    const allParticipants = await db.orm.public.TournamentParticipant.all();
    const approvedParticipants = allParticipants.filter(
      (p) => p.tournamentId === tournamentId && (p.status === 'APPROVED' || p.status === 'CONFIRMED')
    );

    if (approvedParticipants.length < (tournament.minParticipants || 2)) {
      return NextResponse.json(
        {
          error: `Not enough approved players. Tournament requires at least ${tournament.minParticipants || 4} approved players (currently ${approvedParticipants.length} approved). Review applicant queue first!`,
        },
        { status: 400 }
      );
    }

    // Parse admin rules
    let rulesConfig: TournamentRulesConfig = {
      legs: 1,
      extraTime: 'CLASSIC',
      penaltiesEnabled: true,
    };

    if (tournament.rules) {
      try {
        const parsed = JSON.parse(tournament.rules);
        rulesConfig = { ...rulesConfig, ...parsed };
      } catch (e) {
        // use defaults
      }
    }

    // Sort participants by seed if present
    const sortedParticipants = [...approvedParticipants].sort((a, b) => {
      if (a.seed && b.seed) return a.seed - b.seed;
      return a.id - b.id;
    });

    const participantIds = sortedParticipants.map((p) => p.id);

    // Delete any old scheduled matches if regenerating
    const existingMatches = await db.orm.public.Match.all();
    for (const m of existingMatches.filter((m) => m.tournamentId === tournamentId)) {
      await db.orm.public.Match.where({ id: m.id }).delete();
    }

    // Delete any existing standings if regenerating
    const existingStandings = await db.orm.public.Standing.all();
    for (const s of existingStandings.filter((s) => s.tournamentId === tournamentId)) {
      await db.orm.public.Standing.where({ id: s.id }).delete();
    }

    // Generate matches based on Admin configuration
    const fixturePlan = generateTournamentFixtures(
      tournament.format,
      rulesConfig,
      participantIds
    );

    const createdMatches = [];
    for (const fixture of fixturePlan) {
      const match = await db.orm.public.Match.create({
        tournamentId,
        stage: fixture.stage,
        round: fixture.round,
        matchNumber: fixture.matchNumber,
        groupName: fixture.groupName || null,
        homeParticipantId: fixture.homeParticipantId,
        awayParticipantId: fixture.awayParticipantId,
        status: 'SCHEDULED',
        notes: fixture.notes || null,
      });
      createdMatches.push(match);
    }

    // Initialize Standings if format has groups or is round-robin
    if (tournament.format === 'GROUP_TO_KNOCKOUT' || tournament.format === 'ROUND_ROBIN') {
      for (const fixture of fixturePlan) {
        if (fixture.groupName) {
          // Update participant groupName
          await db.orm.public.TournamentParticipant.where({ id: fixture.homeParticipantId }).update({
            groupName: fixture.groupName,
          });
          await db.orm.public.TournamentParticipant.where({ id: fixture.awayParticipantId }).update({
            groupName: fixture.groupName,
          });
        }
      }

      for (const p of approvedParticipants) {
        await db.orm.public.Standing.create({
          tournamentId,
          participantId: p.id,
          groupName: p.groupName || null,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          points: 0,
        });
      }
    }

    // Update tournament status to IN_PROGRESS
    const updatedTournament = await db.orm.public.Tournament.where({ id: tournamentId }).update({
      status: 'IN_PROGRESS',
    });

    // Create an announcement
    await db.orm.public.Announcement.create({
      tournamentId,
      title: 'Tournament Fixtures Generated! ⚽',
      content: `The administrator has approved the roster and generated all official ${tournament.title} fixtures (${createdMatches.length} matches scheduled)!`,
    });

    return NextResponse.json({
      tournament: updatedTournament,
      matchesGenerated: createdMatches.length,
      fixtures: createdMatches,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
