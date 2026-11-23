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

    const tournament = await db.orm.public.Tournament.where({ id: tournamentId }).first();
    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    const allParticipants = await db.orm.public.TournamentParticipant.all();
    const participants = allParticipants.filter((p) => p.tournamentId === tournamentId);

    const allUsers = await db.orm.public.User.all();
    const userMap = new Map(allUsers.map((u) => [u.id, u]));

    const enrichedParticipants = participants.map((p) => ({
      ...p,
      user: userMap.get(p.userId) || null,
    }));

    const allMatches = await db.orm.public.Match.all();
    const matches = allMatches.filter((m) => m.tournamentId === tournamentId);

    const allStandings = await db.orm.public.Standing.all();
    const standings = allStandings.filter((s) => s.tournamentId === tournamentId);

    const allAnnouncements = await db.orm.public.Announcement.all();
    const announcements = allAnnouncements.filter((a) => a.tournamentId === tournamentId);

    return NextResponse.json({
      tournament,
      participants: enrichedParticipants,
      matches,
      standings,
      announcements,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tournamentId = parseInt(id, 10);
    if (isNaN(tournamentId)) {
      return NextResponse.json({ error: 'Invalid tournament ID' }, { status: 400 });
    }

    const body = await request.json();
    const updateData: any = {};

    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.format !== undefined) updateData.format = body.format;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.teamSelectionRule !== undefined) updateData.teamSelectionRule = body.teamSelectionRule;
    if (body.maxParticipants !== undefined) updateData.maxParticipants = Number(body.maxParticipants);
    if (body.minParticipants !== undefined) updateData.minParticipants = Number(body.minParticipants);
    if (body.entryFee !== undefined) updateData.entryFee = body.entryFee;
    if (body.prizePool !== undefined) updateData.prizePool = body.prizePool;
    if (body.bannerUrl !== undefined) updateData.bannerUrl = body.bannerUrl;
    if (body.rules !== undefined) {
      updateData.rules = typeof body.rules === 'object' ? JSON.stringify(body.rules) : body.rules;
    }

    const updated = await db.orm.public.Tournament.where({ id: tournamentId }).update(updateData);

    return NextResponse.json({ tournament: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tournamentId = parseInt(id, 10);
    if (isNaN(tournamentId)) {
      return NextResponse.json({ error: 'Invalid tournament ID' }, { status: 400 });
    }

    // Cascade delete associated matches, standings, announcements, participants
    const allMatches = await db.orm.public.Match.all();
    for (const m of allMatches.filter((m) => m.tournamentId === tournamentId)) {
      await db.orm.public.Match.where({ id: m.id }).delete();
    }

    const allStandings = await db.orm.public.Standing.all();
    for (const s of allStandings.filter((s) => s.tournamentId === tournamentId)) {
      await db.orm.public.Standing.where({ id: s.id }).delete();
    }

    const allAnnouncements = await db.orm.public.Announcement.all();
    for (const a of allAnnouncements.filter((a) => a.tournamentId === tournamentId)) {
      await db.orm.public.Announcement.where({ id: a.id }).delete();
    }

    const allParticipants = await db.orm.public.TournamentParticipant.all();
    for (const p of allParticipants.filter((p) => p.tournamentId === tournamentId)) {
      await db.orm.public.TournamentParticipant.where({ id: p.id }).delete();
    }

    await db.orm.public.Tournament.where({ id: tournamentId }).delete();

    return NextResponse.json({ success: true, message: `Tournament #${tournamentId} deleted` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
