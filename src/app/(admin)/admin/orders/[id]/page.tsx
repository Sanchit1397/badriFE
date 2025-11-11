'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { apiFetch } from '@/lib/api';

interface OrderItem {
	product: {
		slug: string;
		name: string;
		price: number;
	};
	quantity: number;
	price: number;
}

interface Order {
	_id: string;
	user: { name: string; email: string };
	items: OrderItem[];
	deliveryFee: number;
	total: number;
	status: string;
	address: string;
	phone: string;
	createdAt: string;
}

export default function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
	const [orderId, setOrderId] = useState<string>('');
	const [order, setOrder] = useState<Order | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const { token, role } = useAuthStore();
	const router = useRouter();

	useEffect(() => {
		params.then((p) => setOrderId(p.id));
	}, [params]);

	useEffect(() => {
		if (!token || role !== 'admin') {
			router.replace('/');
			return;
		}

		if (!orderId) return;

		apiFetch<{ order: Order }>(`/admin/orders/${orderId}`, {}, token)
			.then((data) => setOrder(data.order))
			.catch((err) => setError(err.message || 'Failed to load order'))
			.finally(() => setLoading(false));
	}, [orderId, token, role, router]);

	if (!token || role !== 'admin') return null;

	if (loading) return <div className="p-6 max-w-3xl mx-auto text-gray-900 dark:text-gray-100">Loading order...</div>;

	if (error) {
		return (
			<div className="p-6 max-w-3xl mx-auto">
				<div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
					{error}
				</div>
				<Link href="/admin/orders" className="text-orange-600 hover:underline">
					← Back to Orders
				</Link>
			</div>
		);
	}

	if (!order) {
		return (
			<div className="p-6 max-w-3xl mx-auto">
				<p className="text-gray-900 dark:text-gray-100">Order not found</p>
				<Link href="/admin/orders" className="text-orange-600 hover:underline">
					← Back to Orders
				</Link>
			</div>
		);
	}

	const subtotal = order.total - order.deliveryFee;

	const statusColors: Record<string, string> = {
		placed: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100',
		confirmed: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-100',
		shipped: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100',
		delivered: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100',
		cancelled: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100',
	};

	return (
		<div className="p-4 sm:p-6 max-w-3xl mx-auto">
			<div className="mb-4">
				<Link href="/admin/orders" className="text-orange-600 hover:underline text-sm">
					← Back to Orders
				</Link>
			</div>

			<h1 className="text-2xl sm:text-3xl font-semibold mb-6 text-gray-900 dark:text-gray-100">
				Order Details (Admin)
			</h1>

			{/* Order Details */}
			<div className="mb-6 p-4 border rounded">
				<h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">Order Information</h2>
				<div className="space-y-2 text-sm text-gray-900 dark:text-gray-100">
					<div>
						<strong>Order ID:</strong> {order._id}
					</div>
					<div>
						<strong>Status:</strong>{' '}
						<span className={`inline-block px-2 py-1 rounded text-xs uppercase ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
							{order.status}
						</span>
					</div>
					<div>
						<strong>Order Date:</strong> {new Date(order.createdAt).toLocaleString()}
					</div>
					<div>
						<strong>Payment Method:</strong> Cash on Delivery (COD)
					</div>
				</div>
			</div>

			{/* Customer Information */}
			<div className="mb-6 p-4 border rounded">
				<h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">Customer Information</h2>
				<div className="space-y-2 text-sm text-gray-900 dark:text-gray-100">
					<div>
						<strong>Name:</strong> {order.user.name}
					</div>
					<div>
						<strong>Email:</strong> {order.user.email}
					</div>
					<div>
						<strong>Phone:</strong> {order.phone}
					</div>
					<div>
						<strong>Delivery Address:</strong>
						<p className="mt-1 whitespace-pre-line">{order.address}</p>
					</div>
				</div>
			</div>

			{/* Order Items */}
			<div className="mb-6 p-4 border rounded">
				<h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">Items</h2>
				<div className="space-y-2">
					{order.items.map((item, idx) => (
						<div key={idx} className="flex justify-between items-start border-b pb-2 last:border-b-0">
							<div className="flex-1">
								<Link
									href={`/products/${item.product.slug}`}
									className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-orange-600"
								>
									{item.product.name}
								</Link>
								<p className="text-xs text-gray-600 dark:text-gray-400">
									₹{item.product.price.toFixed(2)} × {item.quantity}
								</p>
							</div>
							<div className="text-sm font-medium text-gray-900 dark:text-gray-100">₹{item.price.toFixed(2)}</div>
						</div>
					))}
				</div>
			</div>

			{/* Order Summary */}
			<div className="mb-6 p-4 border rounded">
				<h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">Order Summary</h2>
				<div className="space-y-1 text-gray-900 dark:text-gray-100">
					<div className="flex justify-between">
						<span>Subtotal:</span>
						<span>₹{subtotal.toFixed(2)}</span>
					</div>
					<div className="flex justify-between">
						<span>Delivery Fee:</span>
						<span>₹{order.deliveryFee.toFixed(2)}</span>
					</div>
					<div className="flex justify-between text-lg font-semibold border-t pt-2 mt-2">
						<span>Total:</span>
						<span className="text-green-700 dark:text-green-400">₹{order.total.toFixed(2)}</span>
					</div>
				</div>
			</div>

			{/* Action Buttons */}
			<div className="flex gap-3">
				<Link
					href="/admin/orders"
					className="flex-1 text-center bg-orange-600 text-white py-2 px-4 rounded hover:bg-orange-700"
				>
					← Back to Orders
				</Link>
			</div>
		</div>
	);
}

