import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';

export async function requireAdmin(_req: NextRequest): Promise<NextResponse | null> {
	const user = await getAuthUser();
	if (!user || user.role !== 'admin') {
		return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
	}
	return null;
}
