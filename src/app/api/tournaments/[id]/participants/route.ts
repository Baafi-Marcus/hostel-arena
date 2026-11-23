import { NextResponse } from 'next/server';
import { db } from '@/prisma/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tournamentId = parseInt(id, 10);
    if (isNaN(tournamentId)) {
      return NextResponse.json({ error: 'Invalid tournament ID' }, { status: 400 });
    }

    const allParticipants = await db.orm.public.TournamentParticipant.all();
    const participants = allParticipants.filter((p) => p.tournamentId === tournamentId);

    const allUsers = await db.orm.public.User.all();
    const userMap = new Map(allUsers.map((u) => [u.id, u]));

    const enriched = participants.map((p) => ({
      ...p,
      user: userMap.get(p.userId) || null,
    }));

    return NextResponse.json({ participants: enriched });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

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

    const body = await request.json();
    const userId = Number(body.userId);
    const teamName = body.teamName?.trim();
    const teamBadgeUrl = body.teamBadgeUrl || null;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Check if already registered
    const allParticipants = await db.orm.public.TournamentParticipant.all();
    const existing = allParticipants.find(
      (p) => p.tournamentId === tournamentId && p.userId === userId
    );
    if (existing) {
      return NextResponse.json(
        { error: 'User has already applied or registered for this tournament' },
        { status: 400 }
      );
    }

    // Check Exclusive team selection rule
    if (tournament.teamSelectionRule === 'EXCLUSIVE' && teamName) {
      const teamTaken = allParticipants.some(
        (p) =>
          p.tournamentId === tournamentId &&
          (p.status === 'APPROVED' || p.status === 'CONFIRMED') &&
          p.teamName?.toLowerCase() === teamName.toLowerCase()
      );
      if (teamTaken) {
        return NextResponse.json(
          { error: `Team "${teamName}" is already reserved by an approved player in this tournament.` },
          { status: 400 }
        );
      }
    }

    // Create participant with PENDING_APPROVAL so admin reviews it
    const participant = await db.orm.public.TournamentParticipant.create({
      tournamentId,
      userId,
      teamName: teamName || 'Unassigned',
      teamBadgeUrl,
      status: 'PENDING_APPROVAL',
      seed: null,
      groupName: null,
    });

    // Create notification for admin
    await db.orm.public.Notification.create({
      userId: tournament.adminId,
      title: 'New Player Application',
      message: `A player applied for ${tournament.title} with ${teamName || 'Unassigned'}. Review application in Admin Center.`,
      linkUrl: `/tournaments/${tournament.id}`,
      isRead: false,
    });

    return NextResponse.json(
      {
        participant,
        message: 'Application submitted! An admin will review and approve your registration.',
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
