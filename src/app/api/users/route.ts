import { NextResponse } from 'next/server';
import { db } from '@/prisma/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeAdmin = searchParams.get('includeAdmin') === 'true';
    const allUsers = await db.orm.public.User.all();
    const users = includeAdmin ? allUsers : allUsers.filter((u) => u.role !== 'ADMIN');
    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newUser = await db.orm.public.User.create({
      email: body.email,
      username: body.username,
      name: body.name,
      role: body.role || 'PLAYER',
      roomNumber: body.roomNumber || null,
      hostelBlock: body.hostelBlock || null,
      eloRating: body.eloRating || 1200,
    });
    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
