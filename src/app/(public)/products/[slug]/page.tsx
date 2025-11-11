'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useCartStore } from '@/store/cart';
import ProductGallery from '@/components/ProductGallery';

interface Product {
    slug: string;
    name: string;
    price: number;
    description?: string;
    images?: { hash: string; alt?: string; primary?: boolean }[];
}

export default function ProductDetail({ params }: { params: Promise<{ slug: string }> }) {
    const [slug, setSlug] = useState<string>('');
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { addItem } = useCartStore();
    const router = useRouter();

    useEffect(() => {
        params.then(p => setSlug(p.slug));
    }, [params]);

    useEffect(() => {
        if (!slug) return;
        apiFetch<{ product: Product }>(`/catalog/products/${encodeURIComponent(slug)}`)
            .then(data => setProduct(data.product))
            .catch(err => setError(err.message || 'Failed to load product'))
            .finally(() => setLoading(false));
    }, [slug]);

    const handleAddToCart = () => {
        if (!product) return;
        addItem(product.slug, 1);
        router.push('/cart');
    };

    if (loading) return <div className="p-6">Loading...</div>;
    if (error) return <div className="p-6 text-red-600">Error: {error}</div>;
    if (!product) return <div className="p-6">Product not found</div>;

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <ProductGallery images={product.images} />
                </div>
                <div>
                    <h1 className="text-2xl font-semibold mb-2">{product.name}</h1>
                    <p className="text-lg text-green-700 dark:text-green-400 font-medium mb-4">₹{product.price.toFixed(2)}</p>
                    {product.description && (
                        <p className="mb-6 whitespace-pre-line text-sm text-gray-900 dark:text-gray-100">{product.description}</p>
                    )}
                    <button
                        onClick={handleAddToCart}
                        className="bg-orange-600 text-white py-2 px-4 rounded hover:bg-orange-700"
                    >
                        Add to cart
                    </button>
                </div>
            </div>
        </div>
    );
}


