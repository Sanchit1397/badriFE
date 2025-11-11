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
