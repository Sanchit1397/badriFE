// @ts-nocheck
'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

export default function LoginPage() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [showPwd, setShowPwd] = useState(false);
    const [resendMsg, setResendMsg] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const setAuth = useAuthStore((s) => s.setAuth);

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
        try {
            setLoading(true);
            const data = await apiFetch<{ token: string; user: { role: 'user' | 'admin'; email: string; name?: string } }>(
                '/auth/login',
                { method: 'POST', body: JSON.stringify({ email, password }) }
            );
            setAuth({ token: data.token, role: data.user.role, email: data.user.email, name: data.user.name });
            window.location.href = '/';
        } catch (err: unknown) {
            const e = err as Error & { code?: string; details?: any; status?: number };
            if (e.code === 'UNPROCESSABLE_ENTITY' && e.details?.fieldErrors) {
                const fe = e.details.fieldErrors as Record<string, string[]>;
                const msg = fe.email?.[0] || fe.password?.[0] || e.message;
                setError(msg || 'Login failed');
            } else if (e.code === 'FORBIDDEN') {
                setError('Please verify your email before logging in.');
            } else if (e.code === 'UNAUTHORIZED') {
                setError('Invalid email or password.');
            } else {
                setError(e.message || 'Login failed');
            }
        } finally {
            setLoading(false);
        }
	}

    async function onResend() {
        setResendMsg(null);
        setError(null);
        try {
            setResending(true);
            await apiFetch('/auth/resend', { method: 'POST', body: JSON.stringify({ email }) });
            setResendMsg('Verification email sent. Please check your inbox.');
        } catch (err) {
            const e = err as Error & { code?: string };
            if (e.code === 'NOT_FOUND') setResendMsg('No account found for this email.');
            else if (e.code === 'CONFLICT') setResendMsg('Email is already verified. Try logging in.');
            else setResendMsg(e.message || 'Failed to send verification email');
        } finally {
            setResending(false);
        }
    }

	return (
		<div className="max-w-sm mx-auto p-6">
			<h1 className="text-xl font-semibold mb-4">Login</h1>
            <form onSubmit={onSubmit} className="space-y-3">
				<input className="w-full border p-2 rounded" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <div className="relative">
                    <input className="w-full border p-2 rounded pr-20" placeholder="Password" type={showPwd ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} />
                    <button type="button" onClick={() => setShowPwd((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-sm underline">
                        {showPwd ? 'Hide' : 'Show'}
                    </button>
                </div>
				{error && <p className="text-sm text-red-600">{error}</p>}
                <div className="flex items-center justify-between">
                    <button className="bg-blue-600 text-white py-2 px-4 rounded disabled:opacity-50" type="submit" disabled={loading || !email || !password}>
                        {loading ? 'Logging in…' : 'Login'}
                    </button>
                    <button type="button" onClick={onResend} className="text-sm underline disabled:opacity-50" disabled={resending || !email}>
                        {resending ? 'Sending…' : 'Resend verification'}
                    </button>
                </div>
                <div className="text-right">
                    <a href="/auth/forgot" className="text-sm underline">Forgot password?</a>
                </div>
                {resendMsg && <p className="text-sm text-gray-700">{resendMsg}</p>}
			</form>
		</div>
	);
}
