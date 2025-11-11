// Deprecated local API: guide callers to external API service
import { NextResponse } from 'next/server';

export async function POST() {
    return NextResponse.json({ error: 'Use external API service' }, { status: 410 });
}

export async function GET() {
    return NextResponse.json({ error: 'Use external API service' }, { status: 410 });
}
