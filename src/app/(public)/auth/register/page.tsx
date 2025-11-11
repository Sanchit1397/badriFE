'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import Link from 'next/link';

export default function RegisterPage() {
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPwd, setShowPwd] = useState(false);
	const [error, setError] = useState<string | null>(null);
    const [sent, setSent] = useState(false);
    const [previewLink, setPreviewLink] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        try {
            setLoading(true);
            const data = await apiFetch<{ ok: true; message: string; verificationLink?: string }>(
                '/auth/register',
                { method: 'POST', body: JSON.stringify({ name, email, password }) }
            );
            setSent(true);
            setPreviewLink(data.verificationLink || null);
        } catch (err: unknown) {
            const e = err as Error & { code?: string; details?: any };
            if (e.code === 'UNPROCESSABLE_ENTITY' && e.details?.fieldErrors) {
                const fe = e.details.fieldErrors as Record<string, string[]>;
                setError(fe.name?.[0] || fe.email?.[0] || fe.password?.[0] || e.message || 'Registration failed');
            } else if (e.code === 'CONFLICT') {
                setError('An account with this email already exists. Try logging in.');
            } else {
                setError(e.message || 'Registration failed');
            }
        } finally {
            setLoading(false);
        }
    }

	return (
        <div className="max-w-sm mx-auto p-6">
            <h1 className="text-xl font-semibold mb-4">Create account</h1>
            {sent ? (
                <div className="space-y-3">
                    <p>We sent a verification link to <strong>{email}</strong>. Please check your inbox.</p>
                    {previewLink && (
                        <p className="text-sm">Dev preview: <a className="underline text-blue-600" href={previewLink} target="_blank" rel="noreferrer">Open email</a></p>
                    )}
                    <p className="text-sm">After verifying, you can <Link href="/auth/login" className="underline">log in</Link>.</p>
                </div>
            ) : (
                <form onSubmit={onSubmit} className="space-y-3">
                    <input className="w-full border p-2 rounded" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
                    <input className="w-full border p-2 rounded" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    <div className="relative">
                        <input className="w-full border p-2 rounded pr-20" placeholder="Password" type={showPwd ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} />
                        <button type="button" onClick={() => setShowPwd((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-sm underline">
                            {showPwd ? 'Hide' : 'Show'}
                        </button>
                    </div>
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    <p className="text-xs text-gray-600">By continuing, you will receive a verification link via email.</p>
                    <p className="text-xs">Already have an account? <Link href="/auth/login" className="underline">Login</Link></p>
                    <button className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50" type="submit" disabled={loading || !name || !email || !password}>
                        {loading ? 'Creating account…' : 'Register'}
                    </button>
                </form>
            )}
        </div>
	);
}
