import mongoose from 'mongoose';

interface MongooseCache {
	conn: typeof mongoose | null;
	promise: Promise<typeof mongoose> | null;
}

declare global {
	var _mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global._mongoose || { conn: null, promise: null };

export async function connectToDatabase(): Promise<typeof mongoose> {
	if (cached.conn) return cached.conn;
	const uri = process.env.MONGODB_URI;
	if (!uri) throw new Error('Missing MONGODB_URI');
	if (!cached.promise) {
		cached.promise = mongoose.connect(uri, { bufferCommands: false }).then((m) => m);
	}
	cached.conn = await cached.promise;
	global._mongoose = cached;
	return cached.conn;
}
