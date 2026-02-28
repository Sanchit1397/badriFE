// @ts-nocheck
"use client";

import { useEffect, useState } from 'react';
import { apiFetch, uploadFile, getSignedMediaUrl } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';

interface Category { slug: string; name: string }

export default function NewProductPage() {
    const token = useAuthStore((s) => s.token);
    const role = useAuthStore((s) => s.role);
    const router = useRouter();
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [price, setPrice] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [published, setPublished] = useState(false);
    const [trackInventory, setTrackInventory] = useState(false);
    const [stock, setStock] = useState('0');
    const [hasDiscount, setHasDiscount] = useState(false);
    const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
    const [discountValue, setDiscountValue] = useState('0');
    const [discountActive, setDiscountActive] = useState(true);
    const [categories, setCategories] = useState<Category[]>([]);
    const [images, setImages] = useState<{ hash: string; alt?: string; primary?: boolean }[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (!token || role !== 'admin') { router.push('/'); return; }
        (async () => {
            const c = await apiFetch<{ items: Category[] }>(`/catalog/categories`);
            setCategories(c.items);
        })();
    }, [token, role]);

    function toSlug(v: string) {
        return v.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
    }

    async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
        if (!e.target.files || !token) return;
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        setError(null);
        setUploading(true);
        try {
            for (const file of files) {
                const { hash } = await uploadFile(file, token);
                setImages((arr) => arr.concat({ hash, primary: arr.length === 0 }));
            }
        } catch (err) {
            setError((err as Error).message || 'Upload failed');
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    }

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const body = {
                name,
                slug: slug || toSlug(name),
                price: Number(price),
                categorySlug: category,
                description: description || undefined,
                inventory: {
                    track: trackInventory,
                    stock: Number(stock)
                },
                discount: hasDiscount ? {
                    type: discountType,
                    value: Number(discountValue),
                    active: discountActive
                } : undefined
            } as any;
            const created = await apiFetch<{ product: { slug: string } }>(
                '/catalog/products',
                { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(body) },
                token
            );
            // update images/published via PUT
            await apiFetch(
                `/catalog/products/${encodeURIComponent(created.product.slug)}`,
                { method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ images, published }) },
                token
            );
            router.push('/admin');
        } catch (err) {
            const e = err as Error & { code?: string; details?: any };
            if (e.code === 'UNPROCESSABLE_ENTITY' && e.details?.fieldErrors) {
                const fe = e.details.fieldErrors as Record<string, string[]>;
                setError(fe.name?.[0] || fe.slug?.[0] || fe.price?.[0] || fe.categorySlug?.[0] || 'Invalid data');
            } else {
                setError(e.message || 'Failed to create product');
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="p-6 max-w-2xl">
            <h1 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100">New Product</h1>
            <form onSubmit={onSubmit} className="space-y-3">
                <input className="w-full border p-2 rounded text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800" placeholder="Name" value={name} onChange={(e) => { setName(e.target.value); if (!slug) setSlug(toSlug(e.target.value)); }} />
                <input className="w-full border p-2 rounded text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800" placeholder="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
                <input className="w-full border p-2 rounded text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800" placeholder="Price" type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} />
                <select className="w-full border p-2 rounded text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800" value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="">Select category</option>
                    {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                </select>
                <textarea className="w-full border p-2 rounded text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800" placeholder="Description (optional)" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
                <div>
                    <label className="block text-sm mb-1 text-gray-900 dark:text-gray-100">Images</label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Max 5 MB per image. Formats: JPEG, PNG, WebP.</p>
                    <label className={`btn-file inline-flex items-center gap-2 ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
                        Choose files
                        <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={onUpload} disabled={uploading} />
                    </label>
                    {uploading && (
                        <div className="mt-2 flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
                            Uploading… Please wait.
                        </div>
                    )}
                    {images.length > 0 && (
                        <div className="mt-2 space-y-2">
                            {images.map((img, idx) => (
                                <ImageRow key={img.hash} img={img} idx={idx} onChange={setImages} />
                            ))}
                        </div>
                    )}
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-900 dark:text-gray-100"><input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} /> Publish</label>
                
                {/* Inventory Management */}
                <div className="border-t pt-4">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                        <input type="checkbox" checked={trackInventory} onChange={(e) => setTrackInventory(e.target.checked)} />
                        Track Inventory
                    </label>
                    {trackInventory && (
                        <div className="ml-6">
                            <label className="block text-sm mb-1 text-gray-900 dark:text-gray-100">Stock Quantity</label>
                            <input
                                type="number"
                                min="0"
                                step="1"
                                value={stock}
                                onChange={(e) => setStock(e.target.value)}
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
                        <input type="checkbox" checked={hasDiscount} onChange={(e) => setHasDiscount(e.target.checked)} />
                        Add Discount
                    </label>
                    {hasDiscount && (
                        <div className="ml-6 space-y-3">
                            <div>
                                <label className="block text-sm mb-1 text-gray-900 dark:text-gray-100">Discount Type</label>
                                <select
                                    value={discountType}
                                    onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'fixed')}
                                    className="w-full border p-2 rounded text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
                                >
                                    <option value="percentage">Percentage (%)</option>
                                    <option value="fixed">Fixed Amount (₹)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm mb-1 text-gray-900 dark:text-gray-100">
                                    Discount Value {discountType === 'percentage' ? '(%)' : '(₹)'}
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max={discountType === 'percentage' ? '100' : undefined}
                                    step={discountType === 'percentage' ? '1' : '0.01'}
                                    value={discountValue}
                                    onChange={(e) => setDiscountValue(e.target.value)}
                                    className="w-full border p-2 rounded text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
                                    placeholder={discountType === 'percentage' ? 'e.g., 20' : 'e.g., 50'}
                                />
                            </div>
                            <label className="flex items-center gap-2 text-sm text-gray-900 dark:text-gray-100">
                                <input type="checkbox" checked={discountActive} onChange={(e) => setDiscountActive(e.target.checked)} />
                                Discount Active
                            </label>
                            {price && discountValue && discountActive && (
                                <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded text-sm">
                                    <p className="text-gray-900 dark:text-gray-100">
                                        <strong>Final Price:</strong>{' '}
                                        <span className="text-green-700 dark:text-green-400 font-semibold">
                                            ₹{(discountType === 'percentage' 
                                                ? Number(price) * (1 - Number(discountValue) / 100)
                                                : Number(price) - Number(discountValue)
                                            ).toFixed(2)}
                                        </span>
                                        {' '}
                                        <span className="line-through text-gray-500">₹{Number(price).toFixed(2)}</span>
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                
                {error && <p className="text-sm text-red-600">{error}</p>}
                <div className="flex gap-2">
                    <button className="bg-orange-600 text-white py-2 px-4 rounded disabled:opacity-50 hover:bg-orange-700" type="submit" disabled={loading || !name || !price || !category}>Save</button>
                    <button className="border py-2 px-4 rounded text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700" type="button" onClick={() => router.push('/admin')}>Cancel</button>
                </div>
            </form>
        </div>
    );
}

function ImageRow({ img, idx, onChange }: { img: { hash: string; alt?: string; primary?: boolean }, idx: number, onChange: React.Dispatch<React.SetStateAction<{ hash: string; alt?: string; primary?: boolean }[]>> }) {
    const [url, setUrl] = useState<string | null>(null);
    useEffect(() => {
        let mounted = true;
        (async () => {
            try { const u = await getSignedMediaUrl(img.hash); if (mounted) setUrl(u); } catch { /* ignore */ }
        })();
        return () => { mounted = false; };
    }, [img.hash]);
    return (
        <div className="flex items-center gap-2">
            {url ? <img src={url} alt={img.alt || ''} className="h-12 w-12 object-cover rounded" /> : <span className="h-12 w-12 bg-gray-200 inline-block rounded" />}
            <span className="text-xs break-all">{img.hash.slice(0, 12)}…</span>
            <input type="text" className="border p-1 rounded text-xs" placeholder="Alt text" value={img.alt || ''} onChange={(e) => onChange((arr) => arr.map((v, i) => i === idx ? { ...v, alt: e.target.value } : v))} />
            <label className="text-xs flex items-center gap-1">
                <input type="radio" name="primary" checked={!!img.primary} onChange={() => onChange((arr) => arr.map((v, i) => ({ ...v, primary: i === idx })))} /> Primary
            </label>
            <button type="button" className="text-xs underline" onClick={() => onChange((arr) => arr.filter((_, i) => i !== idx))}>Remove</button>
        </div>
    );
}


