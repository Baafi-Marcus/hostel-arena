import { NextResponse } from 'next/server';
import { db } from '@/prisma/db';

export async function GET() {
  try {
    const users = await db.orm.public.User.all();
    const tournaments = await db.orm.public.Tournament.all();

    return NextResponse.json({
      status: 'connected',
      service: 'Neon PostgreSQL',
      branch: process.env.NEON_BRANCH || 'production',
      branchId: process.env.NEON_BRANCH_ID || null,
      stats: {
        totalUsers: users.length,
        totalTournaments: tournaments.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'error',
        message: error.message || 'Failed to query Neon PostgreSQL',
      },
      { status: 500 }
    );
  }
}
