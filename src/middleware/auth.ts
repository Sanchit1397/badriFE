import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';

export async function requireAuth(_req: NextRequest): Promise<NextResponse | null> {
	const user = await getAuthUser();
	if (!user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}
	return null;
}
