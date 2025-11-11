import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItemState {
	slug: string; // Changed from productId to slug for easier lookup
	quantity: number;
}

interface CartState {
	items: CartItemState[];
	addItem: (slug: string, quantity?: number) => void;
	removeItem: (slug: string) => void;
	updateQuantity: (slug: string, quantity: number) => void;
	clear: () => void;
}

export const useCartStore = create<CartState>()(
	persist(
		(set, get) => ({
			items: [],
			addItem: (slug, quantity = 1) => {
				const items = get().items.slice();
				const idx = items.findIndex((i) => i.slug === slug);
				if (idx >= 0) items[idx].quantity += quantity;
				else items.push({ slug, quantity });
				set({ items });
			},
			removeItem: (slug) => set({ items: get().items.filter((i) => i.slug !== slug) }),
			updateQuantity: (slug, quantity) => {
				const items = get().items.slice();
				const idx = items.findIndex((i) => i.slug === slug);
				if (idx >= 0) {
					if (quantity <= 0) items.splice(idx, 1);
					else items[idx].quantity = quantity;
					set({ items });
				}
			},
			clear: () => set({ items: [] }),
		}),
		{ name: 'bd_cart' }
	)
);

