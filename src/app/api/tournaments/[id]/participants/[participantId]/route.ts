import { NextResponse } from 'next/server';
import { db } from '@/prisma/db';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; participantId: string }> }
) {
  try {
    const { id, participantId } = await params;
    const pId = parseInt(participantId, 10);
    if (isNaN(pId)) {
      return NextResponse.json({ error: 'Invalid participant ID' }, { status: 400 });
    }

    const participant = await db.orm.public.TournamentParticipant.where({ id: pId }).first();
    if (!participant) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
    }

    const body = await request.json();
    const updateData: any = {};

    if (body.status !== undefined) updateData.status = body.status;
    if (body.teamName !== undefined) updateData.teamName = body.teamName;
    if (body.teamBadgeUrl !== undefined) updateData.teamBadgeUrl = body.teamBadgeUrl;
    if (body.seed !== undefined) updateData.seed = body.seed !== null ? Number(body.seed) : null;
    if (body.groupName !== undefined) updateData.groupName = body.groupName;

    const updated = await db.orm.public.TournamentParticipant.where({ id: pId }).update(updateData);

    // Notify player of admin decision
    const tournament = await db.orm.public.Tournament.where({ id: participant.tournamentId }).first();
    if (body.status === 'APPROVED') {
      await db.orm.public.Notification.create({
        userId: participant.userId,
        title: 'Registration Approved! 🎉',
        message: `Admin approved your application for ${tournament?.title || 'the tournament'} with team ${updated?.teamName || 'assigned'}.`,
        linkUrl: `/tournaments/${participant.tournamentId}`,
        isRead: false,
      });
    } else if (body.status === 'REJECTED') {
      await db.orm.public.Notification.create({
        userId: participant.userId,
        title: 'Registration Update',
        message: `Your application for ${tournament?.title || 'the tournament'} was not accepted by the administrator.`,
        linkUrl: `/tournaments/${participant.tournamentId}`,
        isRead: false,
      });
    }

    return NextResponse.json({ participant: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; participantId: string }> }
) {
  try {
    const { participantId } = await params;
    const pId = parseInt(participantId, 10);
    if (isNaN(pId)) {
      return NextResponse.json({ error: 'Invalid participant ID' }, { status: 400 });
    }

    // Check if participant is in any scheduled matches
    const allMatches = await db.orm.public.Match.all();
    const involvedMatches = allMatches.filter(
      (m) => m.homeParticipantId === pId || m.awayParticipantId === pId
    );
    for (const m of involvedMatches) {
      await db.orm.public.Match.where({ id: m.id }).delete();
    }

    await db.orm.public.TournamentParticipant.where({ id: pId }).delete();

    return NextResponse.json({ success: true, message: 'Participant removed' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
