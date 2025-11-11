import { z } from 'zod';

export const registerSchema = z.object({
	name: z.string().min(2),
	email: z.string().email(),
	password: z.string().min(6),
	phone: z.string().optional(),
	address: z.string().optional(),
});

export const loginSchema = z.object({
	email: z.string().email(),
	password: z.string().min(6),
});

export const adminUpdateSchema = z
    .object({
        email: z.string().email().optional(),
        currentPassword: z.string().min(6).optional(),
        newPassword: z.string().min(6).optional(),
    })
    .refine(
        (data) => {
            if (data.newPassword) {
                return !!data.currentPassword;
            }
            return true;
        },
        { message: 'currentPassword is required to set a newPassword', path: ['currentPassword'] }
    )
    .refine(
        (data) => {
            if (data.email === undefined && data.newPassword === undefined) {
                return false;
            }
            return true;
        },
        { message: 'Provide at least one of email or newPassword', path: ['email'] }
    );

export const categorySchema = z.object({
	name: z.string().min(2),
	slug: z.string().min(2),
});

export const productSchema = z.object({
	name: z.string().min(2),
	description: z.string().optional(),
	price: z.number().nonnegative(),
	imageUrl: z.string().url().optional(),
	categoryId: z.string(),
});

export const cartItemSchema = z.object({
	productId: z.string(),
	quantity: z.number().int().min(1),
});

export const createOrderSchema = z.object({
	items: z.array(cartItemSchema).min(1),
	deliveryFee: z.number().nonnegative(),
	address: z.string().optional(),
});
