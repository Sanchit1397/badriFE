// @ts-nocheck
"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { useCartStore } from '@/store/cart';
import { apiFetch } from '@/lib/api';
import ProductImage from '@/components/ProductImage';
import { calculateDiscountedPrice, hasActiveDiscount } from '@/lib/discount';

interface Product {
	slug: string;
	name: string;
	price: number;
	images?: { hash: string; alt?: string; primary?: boolean }[];
	discount?: { type: 'percentage' | 'fixed'; value: number; active: boolean };
	inventory?: { track: boolean; stock: number };
}

export default function HomePage() {
	const token = useAuthStore((s) => s.token);
	const { items: cartItems, addItem } = useCartStore();
	const [deals, setDeals] = useState<Product[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!token) return;

		const fetchDeals = async () => {
			try {
				// Fetch published products and filter for active discounts
				const data = await apiFetch<{ items: Product[] }>('/catalog/products?published=true&limit=6');
				const discountedProducts = data.items.filter((p) => hasActiveDiscount(p.discount));
				setDeals(discountedProducts.slice(0, 6)); // Show max 6 deals
			} catch (err) {
				console.error('Failed to fetch deals:', err);
			} finally {
				setLoading(false);
			}
		};

		fetchDeals();
	}, [token]);

	if (!token) {
		return (
			<div className="p-6 max-w-4xl mx-auto text-center">
				<h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-gray-100">Welcome to BadrikiDukan</h1>
				<p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
					Your one-stop shop for stationery and more!
				</p>
				<div className="mt-6 flex gap-3 justify-center">
					<Link
						href="/auth/login"
						className="inline-block bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 font-medium"
					>
						Login
					</Link>
					<Link
						href="/auth/register"
						className="inline-block border border-orange-600 text-orange-600 dark:text-orange-400 px-6 py-3 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20 font-medium"
					>
						Register
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="p-4 sm:p-6 max-w-6xl mx-auto">
			{/* Welcome Section */}
			<div className="mb-8">
				<h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">
					Welcome to BadrikiDukan 🛒
				</h1>
				<p className="text-gray-600 dark:text-gray-400">Discover great deals and shop for your favorites!</p>
			</div>

			{/* Deals Section */}
			{deals.length > 0 && (
				<div className="mb-10">
					<div className="flex items-center justify-between mb-4">
						<h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
							🔥 Hot Deals
						</h2>
						<Link href="/products" className="text-orange-600 hover:underline text-sm font-medium">
							View All Products →
						</Link>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
						{deals.map((p) => {
							const cartItem = cartItems.find((item) => item.slug === p.slug);
							const quantityInCart = cartItem?.quantity || 0;
							const isOutOfStock = p.inventory?.track && (p.inventory?.stock || 0) <= 0;
							const discountedPrice = calculateDiscountedPrice(p.price, p.discount);

							return (
								<div key={p.slug} className="border rounded-lg p-3 flex flex-col relative shadow-sm hover:shadow-md transition-shadow">
									{/* Discount Badge */}
									<div className="absolute top-2 left-2 bg-orange-600 text-white text-xs px-2 py-1 rounded font-bold z-10">
										{p.discount?.type === 'percentage' ? `${p.discount.value}% OFF` : `₹${p.discount?.value} OFF`}
									</div>

									<Link href={`/products/${p.slug}`}>
										<ProductImage images={p.images} className={`h-40 w-full object-cover rounded mb-3 ${isOutOfStock ? 'opacity-50' : ''}`} />
									</Link>

									<Link href={`/products/${p.slug}`} className="font-medium hover:underline text-gray-900 dark:text-gray-100 mb-2">
										{p.name}
									</Link>

									{/* Price */}
									<div className="flex items-center gap-2 mb-3">
										<span className="text-lg text-green-700 dark:text-green-400 font-bold">
											₹{discountedPrice.toFixed(2)}
										</span>
										<span className="text-sm line-through text-gray-500">
											₹{p.price.toFixed(2)}
										</span>
									</div>

									{/* Add to Cart */}
									{isOutOfStock ? (
										<button className="mt-auto bg-gray-400 text-white py-2 rounded cursor-not-allowed text-sm" disabled>
											Out of Stock
										</button>
									) : quantityInCart === 0 ? (
										<button
											className="mt-auto bg-orange-600 text-white py-2 rounded hover:bg-orange-700 text-sm font-medium"
											onClick={() => addItem(p.slug, 1)}
										>
											Add to Cart
										</button>
									) : (
										<div className="mt-auto flex items-center justify-between border rounded">
											<button
												onClick={() => addItem(p.slug, -1)}
												className="w-10 h-10 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
											>
												−
											</button>
											<span className="text-gray-900 dark:text-gray-100 font-medium">{quantityInCart}</span>
											<button
												onClick={() => addItem(p.slug, 1)}
												className="w-10 h-10 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
											>
												+
											</button>
										</div>
									)}
								</div>
							);
						})}
					</div>
				</div>
			)}

			{/* Browse All Products CTA */}
			<div className="text-center mt-10 p-8 bg-gradient-to-r from-orange-50 to-green-50 dark:from-orange-900/20 dark:to-green-900/20 rounded-lg">
				<h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
					Explore Our Full Catalog
				</h3>
				<p className="text-gray-600 dark:text-gray-400 mb-4">
					Browse hundreds of products across multiple categories
				</p>
				<Link
					href="/products"
					className="inline-block bg-orange-600 text-white px-8 py-3 rounded-lg hover:bg-orange-700 font-medium"
				>
					Browse All Products
				</Link>
			</div>
		</div>
	);
}
