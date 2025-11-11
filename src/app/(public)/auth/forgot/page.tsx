'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setMessage(null);
        setError(null);
        setLoading(true);
        try {
            await apiFetch('/auth/forgot', { method: 'POST', body: JSON.stringify({ email }) });
            setMessage('If this email exists and is verified, a reset link has been sent.');
        } catch (err) {
            const e = err as Error & { code?: string };
            setError(e.message || 'Failed to start password reset');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-sm mx-auto p-6">
            <h1 className="text-xl font-semibold mb-4">Forgot Password</h1>
            <form onSubmit={onSubmit} className="space-y-3">
                <input className="w-full border p-2 rounded" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                {error && <p className="text-sm text-red-600">{error}</p>}
                {message && <p className="text-sm text-green-700">{message}</p>}
                <button className="w-full bg-blue-600 text-white py-2 rounded" type="submit" disabled={loading || !email}>
                    {loading ? 'Sending…' : 'Send reset link'}
                </button>
            </form>
        </div>
    );
}


