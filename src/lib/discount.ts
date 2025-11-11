export interface Discount {
	type: 'percentage' | 'fixed';
	value: number;
	active: boolean;
}

export function calculateDiscountedPrice(originalPrice: number, discount?: Discount): number {
	if (!discount || !discount.active) return originalPrice;

	if (discount.type === 'percentage') {
		return originalPrice * (1 - discount.value / 100);
	} else {
		return Math.max(0, originalPrice - discount.value);
	}
}

export function calculateDiscountAmount(originalPrice: number, discount?: Discount): number {
	if (!discount || !discount.active) return 0;
	return originalPrice - calculateDiscountedPrice(originalPrice, discount);
}

export function hasActiveDiscount(discount?: Discount): boolean {
	return !!(discount && discount.active && discount.value > 0);
}

