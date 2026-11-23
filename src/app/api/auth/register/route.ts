import { NextResponse } from 'next/server';
import { db } from '@/prisma/db';
import crypto from 'crypto';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, username, password, hostelName, roomNumber, favoriteTeam, termsAccepted } = body;

    // 1. Mandatory Terms and Conditions validation
    if (!termsAccepted) {
      return NextResponse.json(
        { error: 'You must read and accept the Terms & Conditions and Code of Conduct to register.' },
        { status: 400 }
      );
    }

    // 2. Required fields validation
    if (!name?.trim() || !username?.trim()) {
      return NextResponse.json(
        { error: 'Full name and Gamer Tag / Username are required.' },
        { status: 400 }
      );
    }

    if (!password || password.trim().length < 4) {
      return NextResponse.json(
        { error: 'Please choose a password with at least 4 characters.' },
        { status: 400 }
      );
    }

    if (!hostelName?.trim() || !roomNumber?.trim()) {
      return NextResponse.json(
        { error: 'Hostel Name and Room Number are required so organizers can locate you for matches.' },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!cleanUsername) {
      return NextResponse.json(
        { error: 'Gamer Tag must contain letters, numbers, or underscores.' },
        { status: 400 }
      );
    }

    // Internal unique email derived from username to satisfy DB unique constraint
    const generatedEmail = `${cleanUsername}@hostelfc.arena`;

    // 3. Uniqueness check by username
    const existingUsername = await db.orm.public.User.where({ username: cleanUsername }).first();
    if (existingUsername) {
      return NextResponse.json(
        { error: 'This Gamer Tag is already taken. Please choose another.' },
        { status: 409 }
      );
    }

    const hashedPassword = hashPassword(password.trim());
    const userMeta = JSON.stringify({
      pwd: hashedPassword,
      team: favoriteTeam?.trim() || null,
    });

    // 4. Create user in database
    const newUser = await db.orm.public.User.create({
      name: name.trim(),
      username: cleanUsername,
      email: generatedEmail,
      role: 'PLAYER',
      hostelBlock: hostelName.trim(),
      roomNumber: roomNumber.trim(),
      bio: userMeta,
      eloRating: 1200,
    });

    return NextResponse.json(
      {
        message: 'Registration successful! Welcome to Hostel FC Arena.',
        user: {
          id: newUser.id,
          name: newUser.name,
          username: newUser.username,
          role: newUser.role,
          hostelBlock: newUser.hostelBlock,
          hostelName: newUser.hostelBlock,
          roomNumber: newUser.roomNumber,
          eloRating: newUser.eloRating,
          favoriteTeam: favoriteTeam?.trim() || null,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: error.message || 'Failed to complete registration' }, { status: 500 });
  }
}
