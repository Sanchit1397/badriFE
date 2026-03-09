import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Role = 'user' | 'admin' | null;

interface AuthState {
	token: string | null;
	role: Role;
	email: string | null;
	name: string | null;
	lastLoginAt: number | null;
	setAuth: (payload: { token: string; role: 'user' | 'admin'; email: string; name?: string }) => void;
	clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
	persist(
		(set) => ({
			token: null,
			role: null,
			email: null,
			name: null,
			lastLoginAt: null,
			setAuth: ({ token, role, email, name }) => set({ token, role, email, name: name || null, lastLoginAt: Date.now() }),
			clearAuth: () => set({ token: null, role: null, email: null, name: null, lastLoginAt: null }),
		}),
		{ name: 'bd_auth' }
	)
);

/**
 * Waits for Zustand persist to rehydrate before returning auth state.
 * Use this on pages that redirect based on auth (e.g. checkout, login)
 * to avoid redirecting before persisted token is loaded.
 * Safe for SSR: persist is undefined on server, so we treat as not hydrated.
 */
export function useAuthReady(): { hasHydrated: boolean; token: string | null } {
	const token = useAuthStore((s) => s.token);
	const [hasHydrated, setHasHydrated] = useState(() => {
		if (typeof window === 'undefined') return false;
		return useAuthStore.persist?.hasHydrated?.() ?? false;
	});

	useEffect(() => {
		const persist = useAuthStore.persist;
		if (!persist?.hasHydrated) {
			setHasHydrated(true);
			return;
		}
		if (persist.hasHydrated()) {
			setHasHydrated(true);
			return;
		}
		const unsub = persist.onFinishHydration(() => setHasHydrated(true));
		return unsub;
	}, []);

	return { hasHydrated, token };
}
