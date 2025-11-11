// @ts-nocheck
"use client";

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

function ResetPasswordForm() {
    const sp = useSearchParams();
    const token = sp.get('token') || '';
    const serverError = sp.get('error') || undefined;
    const [showPwd, setShowPwd] = useState(false);
    const action = useMemo(() => `/auth/reset/action?token=${encodeURIComponent(token)}`, [token]);
    return (
        <div className="max-w-sm mx-auto p-6">
            <h1 className="text-xl font-semibold mb-4">Reset Password</h1>
            {!token ? (
                <p className="text-sm text-red-600">Missing token.</p>
            ) : (
                <form action={action} method="post" className="space-y-3">
                    {serverError && <p className="text-sm text-red-600">{serverError}</p>}
                    <div className="relative">
                        <input name="password" className="w-full border p-2 rounded pr-20" placeholder="New Password" type={showPwd ? 'text' : 'password'} />
                        <button type="button" onClick={() => setShowPwd((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-sm underline">
                            {showPwd ? 'Hide' : 'Show'}
                        </button>
                    </div>
                    <button className="w-full bg-blue-600 text-white py-2 rounded" type="submit">Set new password</button>
                </form>
            )}
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className="max-w-sm mx-auto p-6">Loading...</div>}>
            <ResetPasswordForm />
        </Suspense>
    );
}


