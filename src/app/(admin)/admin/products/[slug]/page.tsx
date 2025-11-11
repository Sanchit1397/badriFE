"use client";

import { useEffect, useState } from 'react';
import { apiFetch, uploadFile, getSignedMediaUrl } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useParams, useRouter } from 'next/navigation';

interface Category { slug: string; name: string }

export default function EditProductPage() {
    const token = useAuthStore((s) => s.token);
    const role = useAuthStore((s) => s.role);
    const router = useRouter();
    const params = useParams<{ slug: string }>();
    const slugParam = params.slug;
    const [categories, setCategories] = useState<Category[]>([]);
    const [form, setForm] = useState<any | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!token || role !== 'admin') { router.push('/'); return; }
        (async () => {
            const c = await apiFetch<{ items: Category[] }>(`/catalog/categories`);
            setCategories(c.items);
            const prod = await apiFetch<{ product: any }>(`/catalog/products/${encodeURIComponent(slugParam)}`);
            setForm({
                name: prod.product.name,
                slug: prod.product.slug,
                price: String(prod.product.price),
                categorySlug: '',
                description: prod.product.description || '',
                published: !!prod.product.published,
                images: prod.product.images || [],
                trackInventory: prod.product.inventory?.track || false,
                stock: String(prod.product.inventory?.stock || 0),
                hasDiscount: !!prod.product.discount,
                discountType: prod.product.discount?.type || 'percentage',
                discountValue: String(prod.product.discount?.value || 0),
                discountActive: prod.product.discount?.active ?? true
            });
        })();
    }, [token, role, slugParam]);

    async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
        if (!e.target.files || !token) return;
        for (const file of Array.from(e.target.files)) {
            const { hash } = await uploadFile(file, token);
            setForm((f: any) => ({ ...f, images: f.images.concat({ hash, primary: f.images.length === 0 }) }));
        }
    }

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await apiFetch(
                `/catalog/products/${encodeURIComponent(slugParam)}`,
                { method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({
                    name: form.name,
                    slug: form.slug,
                    price: Number(form.price),
                    description: form.description || undefined,
                    images: form.images,
                    published: !!form.published,
                    inventory: {
                        track: form.trackInventory,
                        stock: Number(form.stock)
                    },
                    discount: form.hasDiscount ? {
                        type: form.discountType,
                        value: Number(form.discountValue),
                        active: form.discountActive
                    } : undefined,
                    ...(form.categorySlug ? { categorySlug: form.categorySlug } : {})
                }) },
                token
            );
            router.push('/admin');
        } catch (err) {
            const e = err as Error & { code?: string; details?: any };
            if (e.code === 'UNPROCESSABLE_ENTITY' && e.details?.fieldErrors) {
                const fe = e.details.fieldErrors as Record<string, string[]>;
                setError(fe.name?.[0] || fe.slug?.[0] || fe.price?.[0] || fe.categorySlug?.[0] || 'Invalid data');
            } else {
                setError(e.message || 'Failed to save');
            }
        } finally {
            setLoading(false);
        }
    }

    if (!form) return <div className="p-6">Loading…</div>;

    return (
        <div className="p-6 max-w-2xl">
            <h1 className="text-2xl font-semibold mb-4">Edit Product</h1>
            <form onSubmit={onSubmit} className="space-y-3">
                <input className="w-full border p-2 rounded text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800" placeholder="Name" value={form.name} onChange={(e) => setForm((f: any) => ({ ...f, name: e.target.value }))} />
                <input className="w-full border p-2 rounded text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800" placeholder="Slug" value={form.slug} onChange={(e) => setForm((f: any) => ({ ...f, slug: e.target.value }))} />
                <input className="w-full border p-2 rounded text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800" placeholder="Price" type="number" min="0" value={form.price} onChange={(e) => setForm((f: any) => ({ ...f, price: e.target.value }))} />
                <select className="w-full border p-2 rounded text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800" value={form.categorySlug} onChange={(e) => setForm((f: any) => ({ ...f, categorySlug: e.target.value }))}>
                    <option value="">Keep existing category</option>
                    {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                </select>
                <textarea className="w-full border p-2 rounded text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800" placeholder="Description (optional)" rows={4} value={form.description} onChange={(e) => setForm((f: any) => ({ ...f, description: e.target.value }))} />
                <div>
                    <label className="block text-sm mb-1 text-gray-900 dark:text-gray-100">Images</label>
                    <label className="btn-file">Choose files<input type="file" accept="image/*" multiple onChange={onUpload} /></label>
                    {form.images.length > 0 && (
                        <div className="mt-2 space-y-2">
                            {form.images.map((img: any, idx: number) => (
                                <ImageRow key={img.hash} img={img} idx={idx} onChange={(upd) => setForm((f: any) => ({ ...f, images: upd(f.images) }))} />
                            ))}
                        </div>
                    )}
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-900 dark:text-gray-100"><input type="checkbox" checked={!!form.published} onChange={(e) => setForm((f: any) => ({ ...f, published: e.target.checked }))} /> Publish</label>
                
                {/* Inventory Management */}
                <div className="border-t pt-4">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                        <input type="checkbox" checked={!!form.trackInventory} onChange={(e) => setForm((f: any) => ({ ...f, trackInventory: e.target.checked }))} />
                        Track Inventory
                    </label>
                    {form.trackInventory && (
                        <div className="ml-6">
                            <label className="block text-sm mb-1 text-gray-900 dark:text-gray-100">Stock Quantity</label>
                            <input
                                type="number"
                                min="0"
                                step="1"
                                value={form.stock}
                                onChange={(e) => setForm((f: any) => ({ ...f, stock: e.target.value }))}
                                className="w-full border p-2 rounded text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
                                placeholder="Available stock"
                            />
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                Stock will automatically decrease when orders are placed
                            </p>
                        </div>
                    )}
                </div>

                {/* Discount Management */}
                <div className="border-t pt-4">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                        <input type="checkbox" checked={!!form.hasDiscount} onChange={(e) => setForm((f: any) => ({ ...f, hasDiscount: e.target.checked }))} />
                        Add Discount
                    </label>
                    {form.hasDiscount && (
                        <div className="ml-6 space-y-3">
                            <div>
                                <label className="block text-sm mb-1 text-gray-900 dark:text-gray-100">Discount Type</label>
                                <select
                                    value={form.discountType}
                                    onChange={(e) => setForm((f: any) => ({ ...f, discountType: e.target.value }))}
                                    className="w-full border p-2 rounded text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
                                >
                                    <option value="percentage">Percentage (%)</option>
                                    <option value="fixed">Fixed Amount (₹)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm mb-1 text-gray-900 dark:text-gray-100">
                                    Discount Value {form.discountType === 'percentage' ? '(%)' : '(₹)'}
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max={form.discountType === 'percentage' ? '100' : undefined}
                                    step={form.discountType === 'percentage' ? '1' : '0.01'}
                                    value={form.discountValue}
                                    onChange={(e) => setForm((f: any) => ({ ...f, discountValue: e.target.value }))}
                                    className="w-full border p-2 rounded text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
                                    placeholder={form.discountType === 'percentage' ? 'e.g., 20' : 'e.g., 50'}
                                />
                            </div>
                            <label className="flex items-center gap-2 text-sm text-gray-900 dark:text-gray-100">
                                <input type="checkbox" checked={!!form.discountActive} onChange={(e) => setForm((f: any) => ({ ...f, discountActive: e.target.checked }))} />
                                Discount Active
                            </label>
                            {form.price && form.discountValue && form.discountActive && (
                                <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded text-sm">
                                    <p className="text-gray-900 dark:text-gray-100">
                                        <strong>Final Price:</strong>{' '}
                                        <span className="text-green-700 dark:text-green-400 font-semibold">
                                            ₹{(form.discountType === 'percentage' 
                                                ? Number(form.price) * (1 - Number(form.discountValue) / 100)
                                                : Number(form.price) - Number(form.discountValue)
                                            ).toFixed(2)}
                                        </span>
                                        {' '}
                                        <span className="line-through text-gray-500">₹{Number(form.price).toFixed(2)}</span>
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                
                {error && <p className="text-sm text-red-600">{error}</p>}
                <div className="flex gap-2">
                    <button className="bg-orange-600 text-white py-2 px-4 rounded disabled:opacity-50 hover:bg-orange-700" type="submit" disabled={loading}>Save</button>
                    <button className="border py-2 px-4 rounded text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700" type="button" onClick={() => router.push('/admin')}>Cancel</button>
                </div>
            </form>
        </div>
    );
}

function ImageRow({ img, idx, onChange }: { img: any, idx: number, onChange: (updater: (arr: any[]) => any[]) => void }) {
    const [url, setUrl] = useState<string | null>(null);
    useEffect(() => {
        let mounted = true;
        (async () => {
            try { const u = await getSignedMediaUrl(img.hash); if (mounted) setUrl(u); } catch {}
        })();
        return () => { mounted = false; };
    }, [img.hash]);
    return (
        <div className="flex items-center gap-2">
            {url ? <img src={url} alt={img.alt || ''} className="h-12 w-12 object-cover rounded" /> : <span className="h-12 w-12 bg-gray-200 inline-block rounded" />}
            <span className="text-xs break-all text-gray-900 dark:text-gray-100">{img.hash.slice(0, 12)}…</span>
            <input type="text" className="border p-1 rounded text-xs text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800" placeholder="Alt text" value={img.alt || ''} onChange={(e) => onChange((arr) => arr.map((v, i) => i === idx ? { ...v, alt: e.target.value } : v))} />
            <label className="text-xs flex items-center gap-1 text-gray-900 dark:text-gray-100">
                <input type="radio" name="primary" checked={!!img.primary} onChange={() => onChange((arr) => arr.map((v, i) => ({ ...v, primary: i === idx })))} /> Primary
            </label>
            <button type="button" className="text-xs underline text-red-600" onClick={() => onChange((arr) => arr.filter((_, i) => i !== idx))}>Remove</button>
        </div>
    );
}


