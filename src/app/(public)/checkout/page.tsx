// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';
import { apiFetch } from '@/lib/api';

interface Product {
	slug: string;
	name: string;
	price: number;
}

interface CartItemWithProduct {
	slug: string;
	quantity: number;
	product: Product | null;
}

export default function CheckoutPage() {
	const { items, clear } = useCartStore();
	const { token } = useAuthStore();
	const router = useRouter();

	const [cartItems, setCartItems] = useState<CartItemWithProduct[]>([]);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState('');
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

	// Form state
	const [address, setAddress] = useState('');
	const [phone, setPhone] = useState('');

	// Redirect if not authenticated and load saved address/phone
	useEffect(() => {
		if (!token) {
			router.replace('/auth/login');
			return;
		}

		// Fetch user profile to auto-fill saved address and phone
		const loadProfile = async () => {
			try {
				const data = await apiFetch<{ profile: { phone?: string; address?: string } }>('/profile', {}, token);
				console.log('Profile loaded:', data.profile); // Debug log
				
				// Only set if fields are currently empty (don't override user's edits)
				if (data.profile.address && !address) {
					setAddress(data.profile.address);
				}
				if (data.profile.phone && !phone) {
					setPhone(data.profile.phone);
				}
			} catch (err) {
				console.error('Failed to load profile for auto-fill:', err); // Debug log
			}
		};

		loadProfile();
	}, [token, router]); // Removed address/phone from deps to avoid loops

	// Fetch product details for all cart items
	useEffect(() => {
		const fetchProducts = async () => {
			if (items.length === 0) {
				setCartItems([]);
				setLoading(false);
				return;
			}

			const itemsWithProducts = await Promise.all(
				items.map(async (item) => {
					try {
						const data = await apiFetch<{ product: Product }>(`/catalog/products/${encodeURIComponent(item.slug)}`);
						return { ...item, product: data.product };
					} catch {
						return { ...item, product: null };
					}
				})
			);
			setCartItems(itemsWithProducts);
			setLoading(false);
		};

		fetchProducts();
	}, [items]);

	const subtotal = cartItems.reduce((sum, item) => {
		if (!item.product) return sum;
		return sum + item.product.price * item.quantity;
	}, 0);

	const deliveryFee = 50;
	const total = subtotal + deliveryFee;

	// Check for out-of-stock or insufficient stock items
	const hasStockIssues = cartItems.some((item) => {
		if (!item.product) return false;
		if (item.product.inventory?.track) {
			return (item.product.inventory?.stock || 0) < item.quantity;
		}
		return false;
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		setFieldErrors({});

		// Prevent checkout if stock issues
		if (hasStockIssues) {
			setError('Some items in your cart are out of stock or have insufficient stock. Please update your cart.');
			return;
		}

		if (!address.trim()) {
			setFieldErrors({ address: 'Please enter your delivery address' });
			return;
		}

		if (!phone.trim()) {
			setFieldErrors({ phone: 'Please enter your phone number' });
			return;
		}

		setSubmitting(true);

		try {
			// Prepare order items
			const orderItems = cartItems
				.filter((item) => item.product)
				.map((item) => ({
					slug: item.slug,
					quantity: item.quantity,
				}));

			if (orderItems.length === 0) {
				setError('No valid items in cart');
				setSubmitting(false);
				return;
			}

			// Submit order to backend
			const response = await apiFetch<{ order: { _id: string; total: number; status: string } }>(
				'/orders',
				{
					method: 'POST',
					body: JSON.stringify({
						items: orderItems,
						deliveryFee,
						address,
						phone,
					}),
				},
				token
			);

			// Clear cart and redirect to success page
			clear();
			router.push(`/orders/${response.order._id}`);
		} catch (err: unknown) {
			// Handle validation errors from backend
			const e = err as Error & { code?: string; details?: { fieldErrors?: Record<string, string[]> } };
			
			if (e.code === 'UNPROCESSABLE_ENTITY' && e.details?.fieldErrors) {
				const errors: Record<string, string> = {};
				Object.entries(e.details.fieldErrors).forEach(([field, messages]) => {
					if (messages && messages.length > 0) {
						errors[field] = messages[0]; // Show first error for each field
					}
				});
				setFieldErrors(errors);
				setError('Please fix the errors below');
			} else {
				setError(e.message || 'Failed to place order');
			}
			setSubmitting(false);
		}
	};

	if (!token) {
		return null; // Will redirect in useEffect
	}

	if (loading) {
		return <div className="p-6 max-w-2xl mx-auto">Loading checkout...</div>;
	}

	if (cartItems.length === 0) {
		return (
			<div className="p-6 max-w-2xl mx-auto text-center">
				<h1 className="text-2xl font-semibold mb-4">Your cart is empty</h1>
				<button onClick={() => router.push('/products')} className="text-orange-600 hover:underline">
					Continue Shopping
				</button>
			</div>
		);
	}

	return (
		<div className="p-6 max-w-2xl mx-auto">
			<h1 className="text-3xl font-semibold mb-6">Checkout</h1>

			{error && (
				<div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
					{error}
				</div>
			)}

			{/* Order Summary */}
			<div className="mb-6 p-4 border rounded">
				<h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">Order Summary</h2>
				<div className="space-y-2 mb-4 text-gray-900 dark:text-gray-100">
					{cartItems.map((item) => {
						const p = item.product;
						if (!p) return null;
						return (
							<div key={item.slug} className="flex justify-between text-sm">
								<span>
									{p.name} × {item.quantity}
								</span>
								<span>₹{(p.price * item.quantity).toFixed(2)}</span>
							</div>
						);
					})}
				</div>
				<div className="border-t pt-2 space-y-1 text-gray-900 dark:text-gray-100">
					<div className="flex justify-between">
						<span>Subtotal:</span>
						<span>₹{subtotal.toFixed(2)}</span>
					</div>
					<div className="flex justify-between">
						<span>Delivery Fee:</span>
						<span>₹{deliveryFee.toFixed(2)}</span>
					</div>
					<div className="flex justify-between text-lg font-semibold">
						<span>Total:</span>
						<span className="text-green-700 dark:text-green-400">₹{total.toFixed(2)}</span>
					</div>
				</div>
			</div>

			{/* Checkout Form */}
			<form onSubmit={handleSubmit} className="space-y-4">
				<div>
					<label className="block mb-1 font-medium text-gray-900 dark:text-gray-100">Delivery Address *</label>
					<textarea
						value={address}
						onChange={(e) => {
							setAddress(e.target.value);
							if (fieldErrors.address) setFieldErrors((prev) => ({ ...prev, address: '' }));
						}}
						className={`w-full border rounded p-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 ${
							fieldErrors.address ? 'border-red-500' : ''
						}`}
						rows={3}
						placeholder="Enter your full delivery address"
						disabled={submitting}
						required
					/>
					{fieldErrors.address && <p className="text-sm text-red-600 mt-1">{fieldErrors.address}</p>}
				</div>

				<div>
					<label className="block mb-1 font-medium text-gray-900 dark:text-gray-100">Phone Number *</label>
					<input
						type="tel"
						value={phone}
						onChange={(e) => {
							setPhone(e.target.value);
							if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: '' }));
						}}
						className={`w-full border rounded p-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 ${
							fieldErrors.phone ? 'border-red-500' : ''
						}`}
						placeholder="Enter your phone number"
						disabled={submitting}
						required
					/>
					{fieldErrors.phone && <p className="text-sm text-red-600 mt-1">{fieldErrors.phone}</p>}
				</div>

				<div className="p-3 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded">
					<p className="text-sm text-gray-900 dark:text-gray-100">
						<strong>Payment Method:</strong> Cash on Delivery (COD)
					</p>
				</div>

				<div className="flex gap-3 pt-4">
					<button
						type="button"
						onClick={() => router.push('/cart')}
						className="px-6 py-2 border rounded hover:bg-gray-100"
						disabled={submitting}
					>
						Back to Cart
					</button>
				<button
					type="submit"
					className="flex-1 bg-orange-600 text-white py-2 px-6 rounded hover:bg-orange-700 disabled:bg-gray-400"
					disabled={submitting || hasStockIssues}
					title={hasStockIssues ? 'Please update cart - some items are out of stock' : ''}
				>
					{submitting ? 'Placing Order...' : 'Place Order (COD)'}
				</button>
				</div>
			</form>
		</div>
	);
}

