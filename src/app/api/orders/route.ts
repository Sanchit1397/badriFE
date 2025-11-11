import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Order } from '@/models/Order';
import { Product } from '@/models/Product';
import { requireAuth } from '@/middleware/auth';
import { createOrderSchema } from '@/lib/validators';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
	await connectToDatabase();
	const orders = await Order.find({}).sort({ createdAt: -1 }).limit(200).populate('items.product');
	return NextResponse.json({ orders });
}

export async function POST(req: NextRequest) {
	const unauth = await requireAuth(req);
	if (unauth) return unauth;
	await connectToDatabase();
	const user = await getAuthUser();
	if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	const body = await req.json().catch(() => ({}));
	const parsed = createOrderSchema.safeParse(body);
	if (!parsed.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
	const itemsPopulated = await Promise.all(
		parsed.data.items.map(async (i) => {
			const p = await Product.findById(i.productId);
			if (!p) throw new Error('Product not found');
			return { product: p._id, quantity: i.quantity, priceAtPurchase: p.price };
		})
	);
	const subtotal = itemsPopulated.reduce((sum, i) => sum + i.priceAtPurchase * i.quantity, 0);
	const deliveryFee = parsed.data.deliveryFee;
	const total = subtotal + deliveryFee;
	const order = await Order.create({
		user: user.uid,
		items: itemsPopulated,
		deliveryFee,
		subtotal,
		total,
		status: 'pending',
		addressSnapshot: parsed.data.address,
		paymentMethod: 'COD',
	});
	return NextResponse.json({ order }, { status: 201 });
}
