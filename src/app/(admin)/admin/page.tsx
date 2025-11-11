"use client";

import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function AdminDashboard() {
    const role = useAuthStore((s) => s.role);
    const router = useRouter();
    useEffect(() => {
        if (role !== 'admin') {
            router.replace('/');
        }
    }, [role, router]);
    if (role !== 'admin') return null;
    return <AdminDashboardInner />;
}

function AdminDashboardInner() {
    const token = useAuthStore((s) => s.token);
    const [filter, setFilter] = useState<'all' | 'published' | 'drafts'>('all');
    const [items, setItems] = useState<{ slug: string; name: string; price: number; published: boolean }[]>([]);
    const [loading, setLoading] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleteSlug, setDeleteSlug] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        (async () => {
            setLoading(true);
            try {
                const qs = new URLSearchParams({ limit: '50' });
                if (filter === 'published') qs.set('published', 'true');
                if (filter === 'drafts') qs.set('published', 'false');
                const data = await apiFetch<{ items: { slug: string; name: string; price: number; published: boolean }[] }>(`/catalog/products?${qs.toString()}`);
                if (mounted) setItems(data.items);
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, [filter]);

    function onDelete(slug: string) {
        setDeleteSlug(slug);
        setConfirmOpen(true);
    }

    async function confirmDelete() {
        if (!token || !deleteSlug) return;
        try {
            await apiFetch(`/catalog/products/${encodeURIComponent(deleteSlug)}`, { method: 'DELETE' }, token);
            setItems((arr) => arr.filter((p) => p.slug !== deleteSlug));
        } finally {
            setConfirmOpen(false);
            setDeleteSlug(null);
        }
    }
    return (
        <div className="p-6">
            <h1 className="text-2xl font-semibold mb-4">Admin Dashboard</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link href="/admin/products/new" className="border rounded p-4 hover:bg-orange-600 hover:text-white transition-colors">
                    <h2 className="font-medium mb-1">Products</h2>
                    <p className="text-sm text-white-600">Create, edit, publish products and manage images.</p>
                </Link>
                <Link href="/admin/categories" className="border rounded p-4 hover:bg-orange-600 hover:text-white transition-colors">
                    <h2 className="font-medium mb-1">Categories</h2>
                    <p className="text-sm text-white-600">Organize products into categories.</p>
                </Link>
                <Link href="/admin/orders" className="border rounded p-4 hover:bg-orange-600 hover:text-white transition-colors">
                    <h2 className="font-medium mb-1">Orders</h2>
                    <p className="text-sm text-white-600">View and manage all customer orders.</p>
                </Link>
                <Link href="/admin/settings" className="border rounded p-4 hover:bg-orange-600 hover:text-white transition-colors">
                    <h2 className="font-medium mb-1">⚙️ Settings</h2>
                    <p className="text-sm text-white-600">Configure store settings, fees, and delivery options.</p>
                </Link>
            </div>

            <div className="mt-8">
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm text-gray-600">Products</span>
                    <div className="ml-auto flex gap-2">
                        <button onClick={() => setFilter('all')} className={`border px-3 py-1 rounded text-sm ${filter==='all'?'bg-orange-600 text-white border-orange-600':'bg-gray-100 text-gray-800'}`}>All</button>
                        <button onClick={() => setFilter('published')} className={`border px-3 py-1 rounded text-sm ${filter==='published'?'bg-orange-600 text-white border-orange-600':'bg-gray-100 text-gray-800'}`}>Published</button>
                        <button onClick={() => setFilter('drafts')} className={`border px-3 py-1 rounded text-sm ${filter==='drafts'?'bg-orange-600 text-white border-orange-600':'bg-gray-100 text-gray-800'}`}>Drafts</button>
                    </div>
                </div>
                {loading ? (
                    <p>Loading…</p>
                ) : items.length === 0 ? (
                    <p className="text-sm text-gray-600">No products found.</p>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left border-b">
                                <th className="py-2">Name</th>
                                <th>Price</th>
                                <th>Status</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((p) => (
                                <tr key={p.slug} className="border-b">
                                    <td className="py-2">{p.name}</td>
                                    <td>₹{p.price.toFixed(2)}</td>
                                    <td>
                                        {p.published ? (
                                            <span className="inline-block text-xs px-2 py-0.5 rounded bg-green-100 text-green-800">Published</span>
                                        ) : (
                                            <span className="inline-block text-xs px-2 py-0.5 rounded bg-yellow-100 text-yellow-800">Draft</span>
                                        )}
                                    </td>
                                    <td className="text-right space-x-3">
                                        <Link className="underline" href={`/admin/products/${p.slug}`}>Edit</Link>
                                        <button onClick={() => onDelete(p.slug)} className="underline text-red-600">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
            {confirmOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
                    <div className="absolute inset-0 bg-black/50" onClick={() => { setConfirmOpen(false); setDeleteSlug(null); }} />
                    <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl border">
                        <div className="px-5 py-3 border-b flex items-center gap-2">
                            <span className="inline-block h-2 w-2 rounded-full bg-orange-600" />
                            <h3 className="text-lg font-semibold text-black">Delete product</h3>
                        </div>
                        <div className="px-5 py-4">
                            <p className="text-sm text-gray-800">Are you sure you want to delete this product? This action cannot be undone.</p>
                        </div>
                        <div className="px-5 py-3 border-t flex justify-end gap-2">
                            <button
                                className="px-3 py-1.5 rounded border border-green-600 text-green-700 bg-white hover:bg-green-50"
                                onClick={() => { setConfirmOpen(false); setDeleteSlug(null); }}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-3 py-1.5 rounded bg-red-600 text-white border border-red-600 hover:bg-red-500"
                                onClick={confirmDelete}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
