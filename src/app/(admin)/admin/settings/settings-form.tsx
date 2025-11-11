'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

export default function SettingsForm({ initialEmail }: { initialEmail: string }) {
    const [email, setEmail] = useState(initialEmail);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [status, setStatus] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const token = useAuthStore((s) => s.token);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setStatus(null);
        setError(null);
        try {
            await apiFetch(
                '/admin/settings',
                {
                    method: 'POST',
                    body: JSON.stringify({
                        email: email !== initialEmail ? email : undefined,
                        currentPassword: newPassword ? currentPassword : undefined,
                        newPassword: newPassword || undefined,
                    }),
                },
                token
            );
            setStatus('Updated successfully');
            setCurrentPassword('');
            setNewPassword('');
        } catch (err) {
            setError((err as Error).message || 'Update failed');
        }
    }

    return (
        <form onSubmit={onSubmit} className="space-y-3">
            <div>
                <label className="block text-sm mb-1">Email</label>
                <input
                    className="w-full border p-2 rounded"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
            </div>
            <div>
                <label className="block text-sm mb-1">Current Password</label>
                <input
                    className="w-full border p-2 rounded"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Required only if changing password"
                />
            </div>
            <div>
                <label className="block text-sm mb-1">New Password</label>
                <input
                    className="w-full border p-2 rounded"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Leave blank to keep existing password"
                />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {status && <p className="text-sm text-green-700">{status}</p>}
            <button className="bg-blue-600 text-white px-4 py-2 rounded" type="submit">Save Changes</button>
        </form>
    );
}


