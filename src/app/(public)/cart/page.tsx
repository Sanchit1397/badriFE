'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';
import { apiFetch } from '@/lib/api';
import ProductImage from '@/components/ProductImage';
import CartItemSkeleton from '@/components/skeletons/CartItemSkeleton';
import { getPublicSetting } from '@/lib/settings';

interface Product {
	slug: string;
	name: string;
	price: number;
	images?: { hash: string; alt?: string; primary?: boolean }[];
	inventory?: { track: boolean; stock: number };
}

interface CartItemWithProduct {
	slug: string;
	quantity: number;
	product: Product | null;
}

export default function CartPage() {
	const { items, removeItem, updateQuantity, clear } = useCartStore();
	const { token } = useAuthStore();
	const router = useRouter();
	const [cartItems, setCartItems] = useState<CartItemWithProduct[]>([]);
	const [loading, setLoading] = useState(true);
	const [minimumOrderValue, setMinimumOrderValue] = useState<number>(0);

	// Fetch product details for all cart items and settings
	useEffect(() => {
		const fetchData = async () => {
			// Fetch minimum order value
			const minOrder = await getPublicSetting<number>('minimum_order_value', 0);
			setMinimumOrderValue(minOrder);

			// Fetch products
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

		if (items.length > 0) {
			fetchData();
		} else {
			setCartItems([]);
			setLoading(false);
		}
	}, [items]);

	const subtotal = cartItems.reduce((sum, item) => {
		if (!item.product) return sum;
		return sum + item.product.price * item.quantity;
	}, 0);

	const deliveryFee = 50; // Fixed delivery fee
	const total = subtotal + deliveryFee;

	const handleProceedToCheckout = () => {
		if (!token) {
			router.push('/auth/login');
			return;
		}
		router.push('/checkout');
	};

	if (loading) {
		return (
			<div className="p-6 max-w-4xl mx-auto">
				<h1 className="text-3xl font-semibold mb-6 text-gray-900 dark:text-gray-100">Shopping Cart</h1>
				<div className="space-y-4">
					{Array.from({ length: 3}).map((_, i) => (
						<CartItemSkeleton key={i} />
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="p-4 sm:p-6 max-w-4xl mx-auto min-w-0 overflow-x-hidden">
			<h1 className="text-2xl sm:text-3xl font-semibold mb-6 text-gray-900 dark:text-gray-100">Shopping Cart</h1>
			{cartItems.length === 0 ? (
				<div className="text-center py-12">
					<p className="text-lg mb-4">Your cart is empty.</p>
					<Link href="/products" className="text-orange-600 hover:underline">
						Continue Shopping
					</Link>
				</div>
			) : (
				<div className="space-y-6">
					{/* Cart Items */}
					<div className="space-y-4">
						{cartItems.map((item) => {
							const p = item.product;
							if (!p) {
								return (
									<div key={item.slug} className="border rounded p-4 bg-gray-100">
										<p className="text-red-600">Product not found</p>
										<button
											onClick={() => removeItem(item.slug)}
											className="text-sm text-red-600 hover:underline mt-2"
										>
											Remove
										</button>
									</div>
								);
							}

							const isOutOfStock = p.inventory?.track && (p.inventory?.stock || 0) === 0;
							const hasInsufficientStock = p.inventory?.track && (p.inventory?.stock || 0) > 0 && (p.inventory?.stock || 0) < item.quantity;

							return (
								<div key={item.slug} className={`border rounded p-4 flex flex-col sm:flex-row gap-4 min-w-0 ${isOutOfStock ? 'bg-red-50 dark:bg-red-900/20' : ''}`}>
									<div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0">
										<ProductImage images={p.images} className={`w-full h-full object-cover rounded ${isOutOfStock ? 'opacity-50' : ''}`} />
									</div>
									<div className="flex-1 min-w-0">
										<Link href={`/products/${p.slug}`} className="text-lg font-medium hover:text-orange-600 text-gray-900 dark:text-gray-100">
											{p.name}
										</Link>
										<p className="text-green-700 dark:text-green-400 font-medium mt-1">₹{p.price.toFixed(2)}</p>
										{isOutOfStock && (
											<p className="text-red-600 font-semibold text-sm mt-1">⚠️ Out of Stock - Please remove from cart</p>
										)}
										{hasInsufficientStock && (
											<p className="text-yellow-600 font-semibold text-sm mt-1">⚠️ Only {p.inventory?.stock} left in stock</p>
										)}
									</div>
									<div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 flex-shrink-0">
										<div className="flex items-center gap-2">
											<button
												onClick={() => updateQuantity(item.slug, item.quantity - 1)}
												className="w-9 h-9 flex items-center justify-center border border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600 active:bg-gray-300 dark:active:bg-gray-500 font-medium"
											>
												−
											</button>
											<span className="w-10 text-center font-medium text-gray-900 dark:text-gray-100">{item.quantity}</span>
											<button
												onClick={() => updateQuantity(item.slug, item.quantity + 1)}
												disabled={isOutOfStock || (hasInsufficientStock && item.quantity >= (p.inventory?.stock || 0))}
												className="w-9 h-9 flex items-center justify-center border border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600 active:bg-gray-300 dark:active:bg-gray-500 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
											>
												+
											</button>
										</div>
										<button onClick={() => removeItem(item.slug)} className="text-sm text-red-600 hover:underline">
											Remove
										</button>
									</div>
								</div>
							);
						})}
					</div>

					{/* Cart Summary */}
					<div className="border-t pt-4">
						<div className="space-y-2 mb-4 text-gray-900 dark:text-gray-100">
							<div className="flex justify-between">
								<span>Subtotal:</span>
								<span>₹{subtotal.toFixed(2)}</span>
							</div>
							<div className="flex justify-between">
								<span>Delivery Fee:</span>
								<span>₹{deliveryFee.toFixed(2)}</span>
							</div>
							<div className="flex justify-between text-xl font-semibold">
								<span>Total:</span>
								<span className="text-green-700 dark:text-green-400">₹{total.toFixed(2)}</span>
							</div>
						</div>

						{/* Minimum Order Warning */}
						{minimumOrderValue > 0 && subtotal < minimumOrderValue && (
							<div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-700 rounded">
								<p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
									Minimum order: ₹{minimumOrderValue}
								</p>
								<p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
									Add ₹{(minimumOrderValue - subtotal).toFixed(2)} more to checkout
								</p>
							</div>
						)}

						<div className="flex gap-3">
							<button onClick={() => clear()} className="px-4 py-2 border rounded hover:bg-gray-100 text-gray-900 dark:text-gray-100">
								Clear Cart
							</button>
							<button
								onClick={handleProceedToCheckout}
								disabled={minimumOrderValue > 0 && subtotal < minimumOrderValue}
								className="flex-1 bg-orange-600 text-white py-2 px-4 rounded hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
								title={minimumOrderValue > 0 && subtotal < minimumOrderValue ? `Add ₹${(minimumOrderValue - subtotal).toFixed(2)} more to checkout` : ''}
							>
								Proceed to Checkout
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
