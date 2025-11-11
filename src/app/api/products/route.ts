import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Product } from '@/models/Product';
import type { IProduct } from '@/models/Product';
import type { FilterQuery } from 'mongoose';
import { Types } from 'mongoose';
import { productSchema } from '@/lib/validators';
import { requireAdmin } from '@/middleware/rbac';

export async function GET(req: NextRequest) {
	await connectToDatabase();
	const { searchParams } = new URL(req.url);
	const q = searchParams.get('q');
	const category = searchParams.get('category');
	const filter: FilterQuery<IProduct> = {};
	if (q) {
		Object.assign(filter, { name: new RegExp(q, 'i') });
	}
	if (category && Types.ObjectId.isValid(category)) {
		Object.assign(filter, { category: new Types.ObjectId(category) });
	}
	const products = await Product.find(filter).sort({ createdAt: -1 }).limit(200);
	return NextResponse.json({ products });
}

export async function POST(req: NextRequest) {
	const forbid = await requireAdmin(req);
	if (forbid) return forbid;
	await connectToDatabase();
	const body = await req.json().catch(() => ({}));
	const parsed = productSchema.safeParse(body);
	if (!parsed.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
	const created = await Product.create({
		name: parsed.data.name,
		description: parsed.data.description,
		price: parsed.data.price,
		imageUrl: parsed.data.imageUrl,
		category: parsed.data.categoryId,
	});
	return NextResponse.json({ product: created }, { status: 201 });
}
