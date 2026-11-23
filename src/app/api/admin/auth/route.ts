import { NextResponse } from 'next/server';
import { db } from '@/prisma/db';
import crypto from 'crypto';

function hashCode(code: string): string {
  return crypto.createHash('sha256').update(code.trim()).digest('hex');
}

export async function GET() {
  try {
    const adminUser = await db.orm.public.User.where({ role: 'ADMIN' }).first();
    if (!adminUser) {
      return NextResponse.json({ isSetup: false, message: 'No admin record found.' });
    }

    let isSetup = false;
    if (adminUser.bio) {
      try {
        const parsed = JSON.parse(adminUser.bio);
        if (parsed && (parsed.adminCode || parsed.pwd)) {
          isSetup = true;
        }
      } catch (e) {
        // Plain text bio
      }
    }

    return NextResponse.json({
      isSetup,
      adminName: adminUser.name,
    });
  } catch (error: any) {
    console.error('Admin status check error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, adminCode, adminName } = body;

    if (!adminCode?.trim()) {
      return NextResponse.json({ error: 'Admin security code is required.' }, { status: 400 });
    }

    const hashed = hashCode(adminCode);

    if (action === 'setup') {
      // Find or create primary admin
      let admin = await db.orm.public.User.where({ role: 'ADMIN' }).first();
      if (!admin) {
        admin = await db.orm.public.User.create({
          name: adminName?.trim() || 'Tournament Director',
          username: 'arena_admin',
          email: 'admin@hostelfc.arena',
          role: 'ADMIN',
          hostelBlock: 'Arena HQ',
          roomNumber: 'Admin Room',
          eloRating: 1600,
        });
      }

      // Store hashed security code in bio JSON metadata
      let meta: Record<string, any> = {};
      if (admin.bio) {
        try {
          meta = JSON.parse(admin.bio);
        } catch (e) {}
      }
      meta.adminCode = hashed;
      meta.pwd = hashed;
      if (adminName?.trim()) {
        meta.displayName = adminName.trim();
      }

      await db.orm.public.User.where({ id: admin.id }).update({
        bio: JSON.stringify(meta),
        ...(adminName?.trim() ? { name: adminName.trim() } : {}),
      });

      return NextResponse.json({
        success: true,
        message: 'Admin security code successfully initialized.',
        admin: {
          id: admin.id,
          name: adminName?.trim() || admin.name,
          role: 'ADMIN',
          username: admin.username,
        },
      });
    }

    if (action === 'login') {
      const admins = await db.orm.public.User.where({ role: 'ADMIN' }).all();
      let matchedAdmin: any = null;

      for (const a of admins) {
        if (a.bio) {
          try {
            const parsed = JSON.parse(a.bio);
            if (parsed && (parsed.adminCode === hashed || parsed.pwd === hashed)) {
              matchedAdmin = a;
              break;
            }
          } catch (e) {}
        }
      }

      if (!matchedAdmin) {
        return NextResponse.json(
          { error: 'Invalid admin security code. Access denied.' },
          { status: 401 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Access granted.',
        admin: {
          id: matchedAdmin.id,
          name: matchedAdmin.name,
          role: 'ADMIN',
          username: matchedAdmin.username,
        },
      });
    }

    return NextResponse.json({ error: 'Invalid action specified.' }, { status: 400 });
  } catch (error: any) {
    console.error('Admin auth error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
