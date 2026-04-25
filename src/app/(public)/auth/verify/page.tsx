export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
    // Temporarily disabled verification page behavior:
    // const params = await searchParams;
    // const token = params?.token;
    // let message = 'Missing token';
    // if (token) {
    //   try {
    //     await apiFetch(`/auth/verify?token=${encodeURIComponent(token)}`);
    //     message = 'Email verified. You can now log in.';
    //   } catch (err) {
    //     message = (err as Error).message || 'Verification failed';
    //   }
    // }
    await searchParams;
    const message = 'Email verification is currently turned off. You can log in directly.';
    return (
        <div className="p-6">
            <h1 className="text-2xl font-semibold mb-2">Verification Disabled</h1>
            <p className="text-sm text-gray-700">{message}</p>
            <p className="mt-3 text-sm"><a href="/auth/login" className="underline text-blue-600">Go to login</a></p>
        </div>
    );
}


