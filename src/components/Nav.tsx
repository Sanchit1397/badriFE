'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { useCartStore } from '@/store/cart';

export default function Nav() {
    const token = useAuthStore((s) => s.token);
    const role = useAuthStore((s) => s.role);
    const clearAuth = useAuthStore((s) => s.clearAuth);
    const cartItems = useCartStore((s) => s.items);
    const isAuthenticated = !!token;
    const isAdmin = role === 'admin';
    const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    
    function onLogout() {
        clearAuth();
        window.location.href = '/auth/login';
    }
    
    return (
        <nav className="mx-auto max-w-5xl flex flex-wrap gap-3 sm:gap-4 p-4 items-center">
            {isAuthenticated ? (
                <>
                    <Link href="/" className="text-sm hover:text-orange-600">Home</Link>
                    <Link href="/products" className="text-sm hover:text-orange-600">Products</Link>
                    <Link href="/cart" className="text-sm hover:text-orange-600 relative pr-5">
                        Cart
                        {cartCount > 0 && (
                            <span className="absolute -top-1.5 -right-0.5 bg-orange-600 text-white text-[10px] rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-medium px-1">
                                {cartCount > 99 ? '99+' : cartCount}
                            </span>
                        )}
                    </Link>
                    <Link href="/profile" className="text-sm hover:text-orange-600">Profile</Link>
                    {isAdmin && (
                        <>
                            <Link href="/admin" className="text-sm hover:text-orange-600">Admin</Link>
                            <Link href="/admin/settings" className="text-sm hover:text-orange-600 hidden sm:inline">Settings</Link>
                        </>
                    )}
                    <button onClick={onLogout} className="text-sm ml-auto hover:text-orange-600">Logout</button>
                </>
            ) : (
                <>
                    <Link href="/auth/login" className="text-sm hover:text-orange-600">Login</Link>
                    <Link href="/auth/register" className="text-sm hover:text-orange-600">Register</Link>
                </>
            )}
        </nav>
    );
}


