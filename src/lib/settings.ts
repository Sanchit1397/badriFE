// @ts-nocheck
import { apiFetch } from './api';

interface Setting {
	key: string;
	value: string | number | boolean;
	type: 'string' | 'number' | 'boolean' | 'json';
}

// Cache for public settings
let settingsCache: Record<string, Setting> | null = null;
let cacheTime: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get a setting value from the public settings endpoint
 * Uses caching to avoid excessive API calls
 */
export async function getPublicSetting<T = any>(key: string, defaultValue?: T): Promise<T> {
	const now = Date.now();
	
	// Refresh cache if expired or empty
	if (!settingsCache || now - cacheTime > CACHE_TTL) {
		try {
			const data = await apiFetch<{ settings: Setting[] }>('/admin/settings');
			settingsCache = {};
			data.settings.forEach((s) => {
				settingsCache![s.key] = s;
			});
			cacheTime = now;
		} catch (err) {
			console.error('Failed to fetch settings:', err);
			return defaultValue as T;
		}
	}

	const setting = settingsCache[key];
	return setting ? (setting.value as T) : (defaultValue as T);
}

/**
 * Clear the settings cache (useful after admin updates)
 */
export function clearSettingsCache() {
	settingsCache = null;
	cacheTime = 0;
}

