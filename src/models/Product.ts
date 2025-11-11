import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IProduct extends Document {
	name: string;
	description?: string;
	price: number;
	imageUrl?: string;
	category: Types.ObjectId;
	createdAt: Date;
	updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
	{
		name: { type: String, required: true },
		description: { type: String },
		price: { type: Number, required: true, min: 0 },
		imageUrl: { type: String },
		category: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
	},
	{ timestamps: true }
);

export const Product: Model<IProduct> =
	mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
