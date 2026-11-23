import { NextResponse } from 'next/server';
import { db } from '@/prisma/db';
import crypto from 'crypto';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { identifier, password } = body;

    if (!identifier?.trim()) {
      return NextResponse.json(
        { error: 'Gamer Tag / Username is required.' },
        { status: 400 }
      );
    }

    const cleanIdentifier = identifier.trim().toLowerCase();

    // Look up directly by username
    let user = await db.orm.public.User.where({ username: cleanIdentifier }).first();
    if (!user && cleanIdentifier.includes('@')) {
      user = await db.orm.public.User.where({ email: cleanIdentifier }).first();
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Account not found. Please check your gamer tag or create an account.' },
        { status: 404 }
      );
    }

    // Verify password if user has password set in bio metadata
    if (user.bio) {
      try {
        const meta = JSON.parse(user.bio);
        if (meta && meta.pwd) {
          if (!password) {
            return NextResponse.json(
              { error: 'Please enter your account password.' },
              { status: 400 }
            );
          }
          const hashed = hashPassword(password.trim());
          if (meta.pwd !== hashed) {
            return NextResponse.json(
              { error: 'Incorrect password. Please try again.' },
              { status: 401 }
            );
          }
        }
      } catch (e) {
        // Bio is plain text (legacy seed user), allow login
      }
    }

    // Admin accounts must not login via player login
    if (user.role === 'ADMIN') {
      return NextResponse.json(
        {
          error: 'Invalid gamer tag or password. Please check your credentials.',
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      message: `Welcome back, ${user.name}!`,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
        hostelBlock: user.hostelBlock,
        hostelName: user.hostelBlock,
        roomNumber: user.roomNumber,
        eloRating: user.eloRating,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: error.message || 'Failed to sign in' }, { status: 500 });
  }
}
