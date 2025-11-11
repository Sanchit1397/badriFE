"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useCartStore } from '@/store/cart';
import ProductImage from '@/components/ProductImage';
import ProductCardSkeleton from '@/components/skeletons/ProductCardSkeleton';
import { calculateDiscountedPrice, hasActiveDiscount } from '@/lib/discount';

interface Category { slug: string; name: string }
interface Product { 
    slug: string; 
    name: string; 
    price: number; 
    images?: { hash: string; alt?: string; primary?: boolean }[];
    inventory?: { track: boolean; stock: number };
    discount?: { type: 'percentage' | 'fixed'; value: number; active: boolean };
}

export default function ProductsPage() {
    const sp = useSearchParams();
    const router = useRouter();
    const [categories, setCategories] = useState<Category[]>([]);
    const [items, setItems] = useState<Product[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const page = Number(sp.get('page') || '1');
    const q = sp.get('q') || '';
    const category = sp.get('category') || '';
    const sort = sp.get('sort') || 'new';
    const limit = 12;
    const { items: cartItems, addItem, updateQuantity, removeItem } = useCartStore();

    function setParam(key: string, value: string) {
        const next = new URLSearchParams(sp.toString());
        if (value) next.set(key, value); else next.delete(key);
        if (key !== 'page') next.delete('page');
        router.push(`/products?${next.toString()}`);
    }

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const c = await apiFetch<{ items: { slug: string; name: string }[] }>(`/catalog/categories`);
                if (mounted) setCategories(c.items);
            } catch {
                if (mounted) setCategories([]);
            }
        })();
        return () => { mounted = false; };
    }, []);

    useEffect(() => {
        let mounted = true;
        (async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams({ page: String(page), limit: String(limit), published: 'true' });
                if (q) params.set('q', q);
                if (category) params.set('category', category);
                if (sort) params.set('sort', sort);
                const data = await apiFetch<{ items: Product[]; total: number; page: number; limit: number }>(`/catalog/products?${params.toString()}`);
                if (mounted) {
                    setItems(data.items);
                    setTotal(data.total);
                }
            } catch {
                if (mounted) { setItems([]); setTotal(0); }
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, [q, category, sort, page]);

    const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total]);

    return (
        <div className="p-6 space-y-4">
            <h1 className="text-2xl font-semibold">Products</h1>
            <div className="flex flex-wrap gap-3 items-center">
                <input className="border p-2 rounded" placeholder="Search…" value={q} onChange={(e) => setParam('q', e.target.value)} />
                <select className="border p-2 rounded" value={category} onChange={(e) => setParam('category', e.target.value)}>
                    <option value="">All categories</option>
                    {categories.map((c) => (
                        <option key={c.slug} value={c.slug}>{c.name}</option>
                    ))}
                </select>
                <select className="border p-2 rounded" value={sort} onChange={(e) => setParam('sort', e.target.value)}>
                    <option value="new">Newest</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                </select>
            </div>
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <ProductCardSkeleton key={i} />
                    ))}
                </div>
            ) : items.length === 0 ? (
                <p>No products found.</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {items.map((p) => {
                        const cartItem = cartItems.find((item) => item.slug === p.slug);
                        const quantityInCart = cartItem?.quantity || 0;
                        const isOutOfStock = p.inventory?.track && (p.inventory?.stock || 0) <= 0;
                        const lowStock = p.inventory?.track && (p.inventory?.stock || 0) > 0 && (p.inventory?.stock || 0) <= 5;

                        return (
                            <div key={p.slug} className="border rounded p-3 flex flex-col relative">
                                {isOutOfStock && (
                                    <div className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded font-semibold">
                                        Out of Stock
                                    </div>
                                )}
                                {!isOutOfStock && lowStock && (
                                    <div className="absolute top-2 right-2 bg-yellow-600 text-white text-xs px-2 py-1 rounded font-semibold">
                                        Only {p.inventory?.stock} left
                                    </div>
                                )}
                                <Link href={`/products/${p.slug}`}>
                                    <ProductImage images={p.images} className={`h-40 w-full object-cover rounded mb-2 ${isOutOfStock ? 'opacity-50' : ''}`} />
                                </Link>
                                <Link href={`/products/${p.slug}`} className="font-medium hover:underline text-gray-900 dark:text-gray-100">{p.name}</Link>
                                
                                {/* Price with discount */}
                                <div className="flex items-center gap-2">
                                    {hasActiveDiscount(p.discount) ? (
                                        <>
                                            <span className="text-sm text-green-700 dark:text-green-400 font-semibold">
                                                ₹{calculateDiscountedPrice(p.price, p.discount).toFixed(2)}
                                            </span>
                                            <span className="text-xs line-through text-gray-500">
                                                ₹{p.price.toFixed(2)}
                                            </span>
                                            <span className="text-xs bg-orange-600 text-white px-1.5 py-0.5 rounded font-semibold">
                                                {p.discount?.type === 'percentage' ? `${p.discount.value}% OFF` : `₹${p.discount?.value} OFF`}
                                            </span>
                                        </>
                                    ) : (
                                        <span className="text-sm text-green-700 dark:text-green-400 font-medium">₹{p.price.toFixed(2)}</span>
                                    )}
                                </div>
                                
                                {isOutOfStock ? (
                                    <button className="mt-auto bg-gray-400 text-white py-2 rounded cursor-not-allowed" disabled>
                                        Out of Stock
                                    </button>
                                ) : quantityInCart === 0 ? (
                                    <button 
                                        className="mt-auto bg-orange-600 text-white py-2 rounded hover:bg-orange-700" 
                                        onClick={() => addItem(p.slug, 1)}
                                    >
                                        Add to Cart
                                    </button>
                                ) : (
                                    <div className="mt-auto flex items-center justify-between border rounded">
                                        <button
                                            onClick={() => updateQuantity(p.slug, quantityInCart - 1)}
                                            className="w-10 h-10 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                                        >
                                            −
                                        </button>
                                        <span className="text-gray-900 dark:text-gray-100 font-medium">{quantityInCart}</span>
                                        <button
                                            onClick={() => updateQuantity(p.slug, quantityInCart + 1)}
                                            className="w-10 h-10 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                                            disabled={p.inventory?.track && quantityInCart >= (p.inventory?.stock || 0)}
                                        >
                                            +
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
            {totalPages > 1 && (
                <div className="flex gap-2 items-center">
                    <button className="border px-3 py-1 rounded" disabled={page <= 1} onClick={() => setParam('page', String(page - 1))}>Prev</button>
                    <span className="text-sm">Page {page} of {totalPages}</span>
                    <button className="border px-3 py-1 rounded" disabled={page >= totalPages} onClick={() => setParam('page', String(page + 1))}>Next</button>
                </div>
            )}
        </div>
    );
}
