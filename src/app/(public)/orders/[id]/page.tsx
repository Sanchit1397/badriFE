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
	items: OrderItem[];
	deliveryFee: number;
	total: number;
	status: string;
	address: string;
	phone: string;
	createdAt: string;
}

export default function OrderConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
	const [orderId, setOrderId] = useState<string>('');
	const [order, setOrder] = useState<Order | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const { token } = useAuthStore();
	const router = useRouter();

	useEffect(() => {
		params.then((p) => setOrderId(p.id));
	}, [params]);

	useEffect(() => {
		if (!token) {
			router.replace('/auth/login');
			return;
		}

		if (!orderId) return;

		apiFetch<{ order: Order }>(`/orders/${orderId}`, {}, token)
			.then((data) => setOrder(data.order))
			.catch((err) => setError(err.message || 'Failed to load order'))
			.finally(() => setLoading(false));
	}, [orderId, token, router]);

	if (!token) return null;

	if (loading) return <div className="p-6 max-w-3xl mx-auto">Loading order...</div>;

	if (error) {
		return (
			<div className="p-6 max-w-3xl mx-auto">
				<div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
					{error}
				</div>
				<Link href="/products" className="text-orange-600 hover:underline">
					Continue Shopping
				</Link>
			</div>
		);
	}

	if (!order) {
		return (
			<div className="p-6 max-w-3xl mx-auto">
				<p>Order not found</p>
				<Link href="/products" className="text-orange-600 hover:underline">
					Continue Shopping
				</Link>
			</div>
		);
	}

	const subtotal = order.total - order.deliveryFee;

	// Status-based messages
	const statusMessages: Record<string, { title: string; message: string; bgColor: string; borderColor: string; textColor: string }> = {
		placed: {
			title: 'Order Placed Successfully! 🎉',
			message: 'Thank you for your order. We\'ll process it soon.',
			bgColor: 'bg-blue-100 dark:bg-blue-900',
			borderColor: 'border-blue-400 dark:border-blue-700',
			textColor: 'text-blue-800 dark:text-blue-100'
		},
		confirmed: {
			title: 'Order Confirmed! ✓',
			message: 'Your order has been confirmed and will be shipped soon.',
			bgColor: 'bg-purple-100 dark:bg-purple-900',
			borderColor: 'border-purple-400 dark:border-purple-700',
			textColor: 'text-purple-800 dark:text-purple-100'
		},
		shipped: {
			title: 'Order Shipped! 📦',
			message: 'Your order is on its way! It should arrive soon.',
			bgColor: 'bg-yellow-100 dark:bg-yellow-900',
			borderColor: 'border-yellow-400 dark:border-yellow-700',
			textColor: 'text-yellow-800 dark:text-yellow-100'
		},
		delivered: {
			title: 'Order Delivered! ✅',
			message: 'Your order has been delivered. Thank you for shopping with us!',
			bgColor: 'bg-green-100 dark:bg-green-900',
			borderColor: 'border-green-400 dark:border-green-700',
			textColor: 'text-green-800 dark:text-green-100'
		},
		cancelled: {
			title: 'Order Cancelled ❌',
			message: 'This order has been cancelled. If you have any questions, please contact support.',
			bgColor: 'bg-red-100 dark:bg-red-900',
			borderColor: 'border-red-400 dark:border-red-700',
			textColor: 'text-red-800 dark:text-red-100'
		}
	};

	const statusInfo = statusMessages[order.status] || statusMessages.placed;

	return (
		<div className="p-6 max-w-3xl mx-auto">
			{/* Status Message */}
			<div className={`mb-6 p-4 ${statusInfo.bgColor} border ${statusInfo.borderColor} ${statusInfo.textColor} rounded`}>
				<h1 className="text-2xl font-semibold mb-2">{statusInfo.title}</h1>
				<p>{statusInfo.message}</p>
			</div>

			{/* Order Details */}
			<div className="mb-6 p-4 border rounded">
				<h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">Order Details</h2>
				<div className="space-y-1 text-sm text-gray-900 dark:text-gray-100">
					<div>
						<strong>Order ID:</strong> {order._id}
					</div>
					<div>
						<strong>Status:</strong>{' '}
						<span className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 rounded text-xs uppercase">
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

			{/* Delivery Information */}
			<div className="mb-6 p-4 border rounded">
				<h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">Delivery Information</h2>
				<div className="space-y-1 text-sm text-gray-900 dark:text-gray-100">
					<div>
						<strong>Address:</strong>
						<p className="mt-1">{order.address}</p>
					</div>
					<div>
						<strong>Phone:</strong> {order.phone}
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
					href="/products"
					className="flex-1 text-center bg-orange-600 text-white py-2 px-4 rounded hover:bg-orange-700"
				>
					Continue Shopping
				</Link>
			</div>
		</div>
	);
}

