import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';
import { hashPassword } from '@/lib/auth';

export async function POST(req: NextRequest) {
  await connectToDatabase();

  const token = req.headers.get('x-admin-bootstrap-token') || '';
  const expectedToken = process.env.ADMIN_BOOTSTRAP_TOKEN || '';
  if (!expectedToken) {
    return NextResponse.json({ error: 'Bootstrap disabled: missing ADMIN_BOOTSTRAP_TOKEN' }, { status: 503 });
  }
  if (token !== expectedToken) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const email = process.env.ADMIN_DEFAULT_EMAIL || '';
  const password = process.env.ADMIN_DEFAULT_PASSWORD || '';
  const name = process.env.ADMIN_DEFAULT_NAME || 'Administrator';
  if (!email || !password) {
    return NextResponse.json({ error: 'Missing ADMIN_DEFAULT_EMAIL or ADMIN_DEFAULT_PASSWORD' }, { status: 400 });
  }

  const existingAdmin = await User.findOne({ role: 'admin' });
  if (existingAdmin) {
    return NextResponse.json({ error: 'Admin already exists' }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const user = await User.create({ name, email, passwordHash, role: 'admin' });

  return NextResponse.json({ ok: true, admin: { id: user._id, email: user.email, name: user.name, role: user.role } }, { status: 201 });
}


