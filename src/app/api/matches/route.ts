import { NextResponse } from 'next/server';
import { db } from '@/prisma/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tournamentIdParam = searchParams.get('tournamentId');

    const allMatches = await db.orm.public.Match.all();
    const allParticipants = await db.orm.public.TournamentParticipant.all();
    const allUsers = await db.orm.public.User.all();
    const allTournaments = await db.orm.public.Tournament.all();

    const userMap = new Map(allUsers.map((u) => [u.id, u]));
    const tourneyMap = new Map(allTournaments.map((t) => [t.id, t]));
    const partMap = new Map(
      allParticipants.map((p) => {
        const u = userMap.get(p.userId);
        return [
          p.id,
          {
            ...p,
            user: u || null,
            userName: u?.name || 'Competitor',
            hostelInfo: u ? `${u.hostelBlock || 'Hostel'} - Room ${u.roomNumber || 'TBD'}` : 'TBD',
          },
        ];
      })
    );

    let matches = allMatches;
    if (tournamentIdParam) {
      const tId = parseInt(tournamentIdParam, 10);
      if (!isNaN(tId)) {
        matches = matches.filter((m) => m.tournamentId === tId);
      }
    }

    const enriched = matches.map((m) => {
      const homeP = partMap.get(m.homeParticipantId);
      const awayP = partMap.get(m.awayParticipantId);
      const tourney = tourneyMap.get(m.tournamentId);

      return {
        ...m,
        tournamentTitle: tourney?.title || 'Tournament',
        homeParticipant: homeP || {
          id: m.homeParticipantId,
          userName: 'Player 1',
          teamName: 'Team A',
          hostelInfo: 'Hostel',
        },
        awayParticipant: awayP || {
          id: m.awayParticipantId,
          userName: 'Player 2',
          teamName: 'Team B',
          hostelInfo: 'Hostel',
        },
      };
    });

    return NextResponse.json({ matches: enriched });
  } catch (error: any) {
    console.error('Error fetching matches:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      tournamentId,
      stage,
      round,
      matchNumber,
      groupName,
      homeParticipantId,
      awayParticipantId,
      scheduledTime,
      notes,
    } = body;

    if (!tournamentId || !homeParticipantId || !awayParticipantId) {
      return NextResponse.json(
        { error: 'tournamentId, homeParticipantId, and awayParticipantId are required' },
        { status: 400 }
      );
    }

    const created = await db.orm.public.Match.create({
      tournamentId: Number(tournamentId),
      stage: stage || 'Knockout Stage',
      round: Number(round) || 1,
      matchNumber: matchNumber ? Number(matchNumber) : null,
      groupName: groupName || null,
      homeParticipantId: Number(homeParticipantId),
      awayParticipantId: Number(awayParticipantId),
      scheduledTime: scheduledTime ? new Date(scheduledTime) : null,
      notes: notes || null,
      status: 'SCHEDULED',
    });

    return NextResponse.json({ match: created }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating match:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
