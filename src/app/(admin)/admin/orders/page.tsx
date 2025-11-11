// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { apiFetch } from '@/lib/api';

interface Order {
	_id: string;
	user: { name: string; email: string };
	items: { product: { slug: string; name: string; price: number }; quantity: number; price: number }[];
	total: number;
	status: string;
	address: string;
	phone: string;
	createdAt: string;
}

type StatusFilter = 'all' | 'placed' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export default function AdminOrdersPage() {
	const { token, role } = useAuthStore();
	const router = useRouter();
	const [orders, setOrders] = useState<Order[]>([]);
	const [loading, setLoading] = useState(true);
	const [filter, setFilter] = useState<StatusFilter>('all');
	const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
	const [updatingStatus, setUpdatingStatus] = useState(false);

	useEffect(() => {
		if (!token || role !== 'admin') {
			router.replace('/');
			return;
		}

		loadOrders();
	}, [token, role, router, filter]);

	const loadOrders = async () => {
		setLoading(true);
		try {
			const query = filter === 'all' ? '' : `?status=${filter}`;
			const data = await apiFetch<{ orders: Order[] }>(`/admin/orders${query}`, {}, token);
			setOrders(data.orders);
		} catch (err) {
			console.error('Failed to load orders:', err);
		} finally {
			setLoading(false);
		}
	};

	const updateStatus = async (orderId: string, newStatus: string) => {
		setUpdatingStatus(true);
		try {
			await apiFetch(
				`/admin/orders/${orderId}/status`,
				{
					method: 'PATCH',
					body: JSON.stringify({ status: newStatus }),
				},
				token
			);
			// Reload orders after update
			await loadOrders();
			setSelectedOrder(null);
		} catch (err) {
			alert('Failed to update order status');
		} finally {
			setUpdatingStatus(false);
		}
	};

	if (!token || role !== 'admin') return null;

	const statusColors: Record<string, string> = {
		placed: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100',
		confirmed: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-100',
		shipped: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100',
		delivered: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100',
		cancelled: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100',
	};

	return (
		<div className="p-4 sm:p-6 max-w-7xl mx-auto">
			<h1 className="text-2xl sm:text-3xl font-semibold mb-4 sm:mb-6 text-gray-900 dark:text-gray-100">
				Order Management
			</h1>

			{/* Status Filters - Mobile Optimized */}
			<div className="mb-4 sm:mb-6 overflow-x-auto">
				<div className="flex gap-2 min-w-max pb-2">
					{(['all', 'placed', 'confirmed', 'shipped', 'delivered', 'cancelled'] as StatusFilter[]).map((status) => (
						<button
							key={status}
							onClick={() => setFilter(status)}
							className={`px-3 sm:px-4 py-2 rounded capitalize text-sm sm:text-base whitespace-nowrap ${
								filter === status
									? 'bg-orange-600 text-white'
									: 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600'
							}`}
						>
							{status}
						</button>
					))}
				</div>
			</div>

			{/* Orders List - Mobile Optimized */}
			{loading ? (
				<div className="text-center py-12 text-gray-900 dark:text-gray-100">Loading orders...</div>
			) : orders.length === 0 ? (
				<div className="text-center py-12 border rounded">
					<p className="text-gray-900 dark:text-gray-100 mb-2">No orders found</p>
					<p className="text-sm text-gray-600 dark:text-gray-400">
						{filter === 'all' ? 'No orders yet' : `No ${filter} orders`}
					</p>
				</div>
			) : (
				<div className="space-y-4">
					{orders.map((order) => (
						<div key={order._id} className="border rounded p-3 sm:p-4 bg-white dark:bg-gray-800">
							{/* Mobile: Stack layout, Desktop: Grid layout */}
							<div className="space-y-3">
								{/* Header */}
								<div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
									<div className="space-y-1">
										<p className="font-medium text-gray-900 dark:text-gray-100">
											Order #{order._id.slice(-8)}
										</p>
										<p className="text-sm text-gray-600 dark:text-gray-400">
											{new Date(order.createdAt).toLocaleString()}
										</p>
										<p className="text-sm text-gray-600 dark:text-gray-400">
											Customer: {order.user.name} ({order.user.email})
										</p>
									</div>
									<span
										className={`px-3 py-1 rounded text-xs font-medium capitalize self-start ${
											statusColors[order.status] || 'bg-gray-100 text-gray-800'
										}`}
									>
										{order.status}
									</span>
								</div>

								{/* Items - Scrollable on mobile if many items */}
								<div className="space-y-1 max-h-32 overflow-y-auto">
									{order.items.map((item, idx) => (
										<div key={idx} className="flex justify-between text-sm text-gray-900 dark:text-gray-100">
											<span className="truncate mr-2">
												{item.product.name} × {item.quantity}
											</span>
											<span className="flex-shrink-0">₹{item.price.toFixed(2)}</span>
										</div>
									))}
								</div>

								{/* Total & Actions */}
								<div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pt-3 border-t">
									<div className="flex justify-between sm:block">
										<span className="text-sm text-gray-600 dark:text-gray-400">Total:</span>
										<span className="font-semibold text-green-700 dark:text-green-400 sm:ml-2">
											₹{order.total.toFixed(2)}
										</span>
									</div>
									<div className="flex gap-2">
										<button
											onClick={() => setSelectedOrder(order)}
											className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 text-sm"
										>
											Update Status
										</button>
										<Link
											href={`/admin/orders/${order._id}`}
											className="flex-1 sm:flex-none px-3 sm:px-4 py-2 border rounded text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 text-center text-sm"
										>
											View Details
										</Link>
									</div>
								</div>
							</div>
						</div>
					))}
				</div>
			)}

			{/* Status Update Modal - Mobile Optimized */}
			{selectedOrder && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
					<div className="bg-white dark:bg-gray-800 rounded-t-lg sm:rounded-lg w-full sm:max-w-md max-h-[80vh] overflow-y-auto">
						<div className="p-4 sm:p-6">
							<h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
								Update Order Status
							</h3>
							<p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
								Order #{selectedOrder._id.slice(-8)}
							</p>
							<div className="space-y-2">
								{['placed', 'confirmed', 'shipped', 'delivered', 'cancelled'].map((status) => (
									<button
										key={status}
										onClick={() => updateStatus(selectedOrder._id, status)}
										disabled={updatingStatus || status === selectedOrder.status}
										className={`w-full px-4 py-3 rounded capitalize text-left ${
											status === selectedOrder.status
												? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
												: 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
										} text-gray-900 dark:text-gray-100 disabled:opacity-50`}
									>
										{status === selectedOrder.status && '✓ '}
										{status}
									</button>
								))}
							</div>
							<button
								onClick={() => setSelectedOrder(null)}
								disabled={updatingStatus}
								className="w-full mt-4 px-4 py-2 border rounded text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
							>
								Cancel
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

