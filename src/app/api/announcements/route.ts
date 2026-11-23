import { NextResponse } from 'next/server';
import { db } from '@/prisma/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('tournamentId');

    const announcements = await db.orm.public.Announcement.all();
    if (tournamentId) {
      const tId = parseInt(tournamentId, 10);
      return NextResponse.json({ announcements: announcements.filter((a) => a.tournamentId === tId) });
    }

    return NextResponse.json({ announcements });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const tournamentId = Number(body.tournamentId);
    const title = body.title?.trim();
    const content = body.content?.trim();

    if (!tournamentId || !title || !content) {
      return NextResponse.json({ error: 'tournamentId, title, and content are required' }, { status: 400 });
    }

    const announcement = await db.orm.public.Announcement.create({
      tournamentId,
      title,
      content,
    });

    return NextResponse.json({ announcement }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await db.orm.public.Announcement.where({ id: parseInt(id, 10) }).delete();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
