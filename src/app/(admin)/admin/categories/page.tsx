// @ts-nocheck
"use client";

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';

interface Category { slug: string; name: string; icon?: string; displayOrder?: number; isActive?: boolean }

export default function AdminCategoriesPage() {
    const token = useAuthStore((s) => s.token);
    const role = useAuthStore((s) => s.role);
    const router = useRouter();
    const [items, setItems] = useState<Category[]>([]);
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [icon, setIcon] = useState('');
    const [displayOrder, setDisplayOrder] = useState('0');
    const [isActive, setIsActive] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingSlug, setEditingSlug] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<{ name: string; slug: string; icon: string; displayOrder: string; isActive: boolean } | null>(null);
    const [savingEdit, setSavingEdit] = useState(false);

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
                {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` },
                    body: JSON.stringify({
                        name,
                        slug: slug || toSlug(name),
                        icon: icon || undefined,
                        displayOrder: Number(displayOrder || '0'),
                        isActive
                    })
                },
                token
            );
            const data = await apiFetch<{ items: Category[] }>(`/catalog/categories`);
            setItems(data.items);
            setName('');
            setSlug('');
            setIcon('');
            setDisplayOrder('0');
            setIsActive(true);
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

    function startEdit(c: Category) {
        setEditingSlug(c.slug);
        setEditForm({
            name: c.name,
            slug: c.slug,
            icon: c.icon || '',
            displayOrder: String(c.displayOrder ?? 0),
            isActive: c.isActive ?? true
        });
    }

    function cancelEdit() {
        setEditingSlug(null);
        setEditForm(null);
    }

    async function saveEdit(originalSlug: string) {
        if (!editForm || !token) return;
        setError(null);
        setSavingEdit(true);
        try {
            await apiFetch(
                `/catalog/categories/${encodeURIComponent(originalSlug)}`,
                {
                    method: 'PUT',
                    headers: { Authorization: `Bearer ${token}` },
                    body: JSON.stringify({
                        name: editForm.name,
                        slug: editForm.slug,
                        icon: editForm.icon || undefined,
                        displayOrder: Number(editForm.displayOrder || '0'),
                        isActive: editForm.isActive
                    })
                },
                token
            );
            const data = await apiFetch<{ items: Category[] }>(`/catalog/categories`);
            setItems(data.items);
            cancelEdit();
        } catch (err) {
            const e = err as Error;
            setError(e.message || 'Failed to update category');
        } finally {
            setSavingEdit(false);
        }
    }

    return (
        <div className="p-6 max-w-2xl">
            <h1 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Categories</h1>
            <form onSubmit={addCategory} className="space-y-2 mb-4">
                <div className="flex gap-2">
                <input className="border p-2 rounded flex-1 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800" placeholder="Name" value={name} onChange={(e) => { setName(e.target.value); if (!slug) setSlug(toSlug(e.target.value)); }} />
                <div className="flex-1">
                    <input className="w-full border p-2 rounded text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800" placeholder="Slug (optional)" value={slug} onChange={(e) => setSlug(e.target.value)} />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Use lowercase letters and hyphens only (e.g. category-name). No spaces.</p>
                </div>
                </div>
                <div className="flex gap-2 items-center">
                    <input className="border p-2 rounded w-28 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800" placeholder="Icon (e.g. 🥬)" value={icon} onChange={(e) => setIcon(e.target.value)} />
                    <input className="border p-2 rounded w-32 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800" type="number" min="0" placeholder="Order" value={displayOrder} onChange={(e) => setDisplayOrder(e.target.value)} />
                    <label className="text-sm flex items-center gap-1 text-gray-900 dark:text-gray-100">
                        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                        Active
                    </label>
                    <button className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700" type="submit" disabled={!name}>Add</button>
                </div>
            </form>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <ul className="divide-y border rounded">
                {items.map((c) => (
                    <li key={c.slug} className="flex items-center justify-between p-2">
                        {editingSlug === c.slug && editForm ? (
                            <div className="w-full space-y-2">
                                <div className="flex gap-2">
                                    <input
                                        className="border p-2 rounded flex-1 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
                                        value={editForm.name}
                                        onChange={(e) => setEditForm((f) => f ? { ...f, name: e.target.value } : f)}
                                    />
                                    <input
                                        className="border p-2 rounded flex-1 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
                                        value={editForm.slug}
                                        onChange={(e) => setEditForm((f) => f ? { ...f, slug: e.target.value } : f)}
                                    />
                                </div>
                                <div className="flex gap-2 items-center">
                                    <input
                                        className="border p-2 rounded w-28 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
                                        placeholder="Icon"
                                        value={editForm.icon}
                                        onChange={(e) => setEditForm((f) => f ? { ...f, icon: e.target.value } : f)}
                                    />
                                    <input
                                        className="border p-2 rounded w-32 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
                                        type="number"
                                        min="0"
                                        value={editForm.displayOrder}
                                        onChange={(e) => setEditForm((f) => f ? { ...f, displayOrder: e.target.value } : f)}
                                    />
                                    <label className="text-sm flex items-center gap-1 text-gray-900 dark:text-gray-100">
                                        <input
                                            type="checkbox"
                                            checked={editForm.isActive}
                                            onChange={(e) => setEditForm((f) => f ? { ...f, isActive: e.target.checked } : f)}
                                        />
                                        Active
                                    </label>
                                    <div className="ml-auto flex gap-2">
                                        <button
                                            className="text-sm px-2 py-1 rounded bg-green-600 text-white disabled:opacity-50"
                                            onClick={() => saveEdit(c.slug)}
                                            disabled={savingEdit}
                                            type="button"
                                        >
                                            Save
                                        </button>
                                        <button className="text-sm underline" onClick={cancelEdit} type="button">Cancel</button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                <span className="text-gray-900 dark:text-gray-100">
                                    <span className="mr-1">{c.icon || '•'}</span>
                                    {c.name} <span className="text-xs text-gray-500 dark:text-gray-400">({c.slug})</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">order:{c.displayOrder ?? 0}</span>
                                    {!c.isActive && <span className="text-xs text-red-500 ml-2">inactive</span>}
                                </span>
                                <div className="flex gap-3">
                                    <button className="text-sm underline" onClick={() => startEdit(c)} type="button">Edit</button>
                                    <button className="text-sm underline text-red-600" onClick={() => del(c.slug)} type="button">Delete</button>
                                </div>
                            </>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}


