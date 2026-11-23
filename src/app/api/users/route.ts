import { NextResponse } from 'next/server';
import { db } from '@/prisma/db';

export async function GET() {
  try {
    const users = await db.orm.public.User.all();
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
