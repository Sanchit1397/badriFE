import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type OrderStatus = 'pending' | 'confirmed' | 'delivered' | 'cancelled';

export interface IOrderItem {
	product: Types.ObjectId;
	quantity: number;
	priceAtPurchase: number;
}

export interface IOrder extends Document {
	user: Types.ObjectId;
	items: IOrderItem[];
	deliveryFee: number;
	subtotal: number;
	total: number;
	status: OrderStatus;
	addressSnapshot?: string;
	paymentMethod: 'COD';
	createdAt: Date;
	updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
	{
		product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
		quantity: { type: Number, required: true, min: 1 },
		priceAtPurchase: { type: Number, required: true, min: 0 },
	},
	{ _id: false }
);

const OrderSchema = new Schema<IOrder>(
	{
		user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
		items: { type: [OrderItemSchema], required: true },
		deliveryFee: { type: Number, required: true, min: 0 },
		subtotal: { type: Number, required: true, min: 0 },
		total: { type: Number, required: true, min: 0 },
		status: { type: String, enum: ['pending', 'confirmed', 'delivered', 'cancelled'], default: 'pending', index: true },
		addressSnapshot: { type: String },
		paymentMethod: { type: String, enum: ['COD'], default: 'COD' },
	},
	{ timestamps: true }
);

export const Order: Model<IOrder> = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
