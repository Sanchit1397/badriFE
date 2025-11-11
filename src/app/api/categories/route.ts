import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Category } from '@/models/Category';
import { categorySchema } from '@/lib/validators';
import { requireAdmin } from '@/middleware/rbac';

export async function GET() {
	await connectToDatabase();
	const categories = await Category.find({}).sort({ name: 1 });
	return NextResponse.json({ categories });
}

export async function POST(req: NextRequest) {
	const forbid = await requireAdmin(req);
	if (forbid) return forbid;
	await connectToDatabase();
	const body = await req.json().catch(() => ({}));
	const parsed = categorySchema.safeParse(body);
	if (!parsed.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
	const exists = await Category.findOne({ slug: parsed.data.slug });
	if (exists) return NextResponse.json({ error: 'Slug already exists' }, { status: 409 });
	const created = await Category.create(parsed.data);
	return NextResponse.json({ category: created }, { status: 201 });
}
