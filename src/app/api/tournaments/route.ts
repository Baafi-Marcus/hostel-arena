import { NextResponse } from 'next/server';
import { db } from '@/prisma/db';

export async function GET() {
  try {
    const tournaments = await db.orm.public.Tournament.all();
    const participants = await db.orm.public.TournamentParticipant.all();
    const matches = await db.orm.public.Match.all();

    const enriched = tournaments.map((t) => {
      const tourneyParticipants = participants.filter((p) => p.tournamentId === t.id);
      const tourneyMatches = matches.filter((m) => m.tournamentId === t.id);
      const approvedCount = tourneyParticipants.filter((p) => p.status === 'APPROVED' || p.status === 'CONFIRMED').length;
      const pendingCount = tourneyParticipants.filter((p) => p.status === 'PENDING_APPROVAL').length;

      return {
        ...t,
        participantsCount: tourneyParticipants.length,
        approvedParticipantsCount: approvedCount,
        pendingParticipantsCount: pendingCount,
        matchesCount: tourneyMatches.length,
        completedMatchesCount: tourneyMatches.filter((m) => m.status === 'COMPLETED').length,
      };
    });

    return NextResponse.json({ tournaments: enriched });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const title = body.title?.trim();
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const slug = body.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();
    const format = body.format || 'GROUP_TO_KNOCKOUT';
    const maxParticipants = Number(body.maxParticipants) || 16;
    const minParticipants = Number(body.minParticipants) || 4;
    const entryFee = body.entryFee || 'Free';
    const prizePool = body.prizePool || '₦0';
    const teamSelectionRule = body.teamSelectionRule || 'EXCLUSIVE';
    const description = body.description || '';
    const bannerUrl = body.bannerUrl || null;
    const adminId = Number(body.adminId) || 1; // Default to admin user id

    // Store custom rules JSON string
    const rulesConfig = typeof body.rules === 'object' ? JSON.stringify(body.rules) : (body.rules || '{}');

    const tournament = await db.orm.public.Tournament.create({
      title,
      slug,
      description,
      format,
      status: 'DRAFT', // Starts in DRAFT mode for Admin to review & open registration
      teamSelectionRule,
      maxParticipants,
      minParticipants,
      entryFee,
      prizePool,
      rules: rulesConfig,
      bannerUrl,
      adminId,
    });

    return NextResponse.json({ tournament }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
