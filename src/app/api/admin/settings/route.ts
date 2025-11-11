// Deprecated in favor of external API service
import { NextResponse } from 'next/server';

export async function POST() {
    return NextResponse.json({ error: 'Use external API service' }, { status: 410 });
}


