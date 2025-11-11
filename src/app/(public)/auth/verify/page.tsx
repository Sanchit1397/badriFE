import { apiFetch } from '@/lib/api';

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
    const params = await searchParams;
    const token = params?.token;
    let message = 'Missing token';
    if (token) {
        try {
            await apiFetch(`/auth/verify?token=${encodeURIComponent(token)}`);
            message = 'Email verified. You can now log in.';
        } catch (err) {
            message = (err as Error).message || 'Verification failed';
        }
    }
    return (
        <div className="p-6">
            <h1 className="text-2xl font-semibold mb-2">Email Verification</h1>
            <p className="text-sm text-gray-700">{message}</p>
            {message.startsWith('Email verified') && (
                <p className="mt-3 text-sm"><a href="/auth/login" className="underline text-blue-600">Go to login</a></p>
            )}
        </div>
    );
}


