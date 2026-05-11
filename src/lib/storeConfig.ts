import { apiFetch } from './api';

export interface IStoreConfig {
	minimum_order_value: number;
	delivery_base_fee: number;
	free_delivery_threshold: number;
	max_items_per_order: number;
	store_name: string;
	store_phone: string;
	store_email: string;
	store_address: string;
}

let cache: { data: IStoreConfig; at: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000;

export function clearStoreConfigCache(): void {
	cache = null;
}

export async function getStoreConfig(): Promise<IStoreConfig> {
	const now = Date.now();
	if (cache && now - cache.at < CACHE_TTL_MS) {
		return cache.data;
	}
	const res = await apiFetch<{ config: IStoreConfig }>('/catalog/store-config');
	cache = { data: res.config, at: now };
	return res.config;
}

/** Subtotal = sum of line totals before delivery. */
export function computeDeliveryFee(subtotal: number, c: IStoreConfig): number {
	const threshold = Number(c.free_delivery_threshold) || 0;
	if (threshold > 0 && subtotal >= threshold) {
		return 0;
	}
	return Math.max(0, Number(c.delivery_base_fee) || 0);
}
