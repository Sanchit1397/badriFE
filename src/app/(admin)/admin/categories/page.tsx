// @ts-nocheck
"use client";

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';

interface Category { slug: string; name: string }

export default function AdminCategoriesPage() {
    const token = useAuthStore((s) => s.token);
    const role = useAuthStore((s) => s.role);
    const router = useRouter();
    const [items, setItems] = useState<Category[]>([]);
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!token || role !== 'admin') { router.push('/'); return; }
        (async () => {
            const data = await apiFetch<{ items: Category[] }>(`/catalog/categories`);
            setItems(data.items);
        })();
    }, [token, role]);

    function toSlug(v: string) {
        return v.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
    }

    async function addCategory(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        try {
            await apiFetch(
                '/catalog/categories',
                { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ name, slug: slug || toSlug(name) }) },
                token
            );
            const data = await apiFetch<{ items: Category[] }>(`/catalog/categories`);
            setItems(data.items);
            setName('');
            setSlug('');
        } catch (err) {
            const e = err as Error;
            setError(e.message || 'Failed to add category');
        }
    }

    async function del(slugDel: string) {
        setError(null);
        try {
            await apiFetch(`/catalog/categories/${encodeURIComponent(slugDel)}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }, token);
            setItems((arr) => arr.filter((c) => c.slug !== slugDel));
        } catch (err) {
            const e = err as Error;
            setError(e.message || 'Failed to delete');
        }
    }

    return (
        <div className="p-6 max-w-2xl">
            <h1 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Categories</h1>
            <form onSubmit={addCategory} className="flex gap-2 mb-4">
                <input className="border p-2 rounded flex-1 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800" placeholder="Name" value={name} onChange={(e) => { setName(e.target.value); if (!slug) setSlug(toSlug(e.target.value)); }} />
                <input className="border p-2 rounded flex-1 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800" placeholder="Slug (optional)" value={slug} onChange={(e) => setSlug(e.target.value)} />
                <button className="bg-orange-600 text-white px-4 rounded hover:bg-orange-700" type="submit" disabled={!name}>Add</button>
            </form>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <ul className="divide-y border rounded">
                {items.map((c) => (
                    <li key={c.slug} className="flex items-center justify-between p-2">
                        <span className="text-gray-900 dark:text-gray-100">{c.name} <span className="text-xs text-gray-500 dark:text-gray-400">({c.slug})</span></span>
                        <button className="text-sm underline text-red-600" onClick={() => del(c.slug)}>Delete</button>
                    </li>
                ))}
            </ul>
        </div>
    );
}


