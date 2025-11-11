import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcrypt';
import { cookies } from 'next/headers';
import type { JWTPayload } from 'jose';

const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'bd_token';
const AUTH_COOKIE_SECURE = process.env.AUTH_COOKIE_SECURE === 'true';

export async function hashPassword(plain: string): Promise<string> {
	const saltRounds = 10;
	return bcrypt.hash(plain, saltRounds);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
	return bcrypt.compare(plain, hash);
}

export interface AppJwtPayload extends JWTPayload {
	uid: string;
	role: 'user' | 'admin';
	email: string;
	name?: string;
}

function getJwtSecret(): Uint8Array {
	const secret = process.env.JWT_SECRET;
	if (!secret) throw new Error('Missing JWT_SECRET');
	return new TextEncoder().encode(secret);
}

export async function signJwt(payload: AppJwtPayload): Promise<string> {
	return new SignJWT(payload)
		.setProtectedHeader({ alg: 'HS256' })
		.setIssuedAt()
		.setExpirationTime('7d')
		.sign(getJwtSecret());
}

export async function verifyJwt(token: string): Promise<AppJwtPayload | null> {
	try {
		const { payload } = await jwtVerify(token, getJwtSecret());
		return payload as AppJwtPayload;
	} catch {
		return null;
	}
}

export async function setAuthCookie(token: string): Promise<void> {
	const store = await cookies();
	store.set(AUTH_COOKIE_NAME, token, {
		httpOnly: true,
		secure: AUTH_COOKIE_SECURE,
		path: '/',
		maxAge: 60 * 60 * 24 * 7,
		sameSite: 'lax',
	});
}

export async function clearAuthCookie(): Promise<void> {
	const store = await cookies();
	store.delete(AUTH_COOKIE_NAME);
}

export async function getAuthTokenFromCookies(): Promise<string | null> {
	const store = await cookies();
	return store.get(AUTH_COOKIE_NAME)?.value || null;
}

export async function getAuthUser(): Promise<AppJwtPayload | null> {
	const token = await getAuthTokenFromCookies();
	if (!token) return null;
	return verifyJwt(token);
}

export async function ensureAdminBootstrap(create: (email: string, password: string, name?: string) => Promise<void>): Promise<void> {
	const email = process.env.ADMIN_DEFAULT_EMAIL;
	const password = process.env.ADMIN_DEFAULT_PASSWORD;
	if (!email || !password) return;
	await create(email, password, 'Owner');
}
