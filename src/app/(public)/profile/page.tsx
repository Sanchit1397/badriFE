'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { apiFetch } from '@/lib/api';

interface Profile {
	_id: string;
	email: string;
	name: string;
	phone: string;
	address: string;
	role: string;
	isVerified: boolean;
	createdAt: string;
}

interface Order {
	_id: string;
	items: {
		product: { slug: string; name: string; price: number };
		quantity: number;
		price: number;
	}[];
	total: number;
	status: string;
	address: string;
	phone: string;
	createdAt: string;
}

export default function ProfilePage() {
	const { token, email: storeEmail } = useAuthStore();
	const router = useRouter();

	const [profile, setProfile] = useState<Profile | null>(null);
	const [orders, setOrders] = useState<Order[]>([]);
	const [loading, setLoading] = useState(true);
	const [activeTab, setActiveTab] = useState<'info' | 'orders' | 'password'>('info');

	// Form states
	const [editMode, setEditMode] = useState(false);
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [phone, setPhone] = useState('');
	const [address, setAddress] = useState('');
	const [currentPassword, setCurrentPassword] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');

	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		if (!token) {
			router.replace('/auth/login');
			return;
		}

		const fetchData = async () => {
			try {
				const [profileData, ordersData] = await Promise.all([
					apiFetch<{ profile: Profile }>('/profile', {}, token),
					apiFetch<{ orders: Order[] }>('/profile/orders', {}, token),
				]);
				setProfile(profileData.profile);
				setOrders(ordersData.orders);
				setName(profileData.profile.name);
				setEmail(profileData.profile.email);
				setPhone(profileData.profile.phone || '');
				setAddress(profileData.profile.address || '');
			} catch (err: unknown) {
				const errorMessage = err instanceof Error ? err.message : 'Failed to load profile';
				setError(errorMessage);
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [token, router]);

	const handleUpdateProfile = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		setSuccess('');
		setSubmitting(true);

		try {
			const updates: { name?: string; email?: string; phone?: string; address?: string } = {};
			if (name !== profile?.name) updates.name = name;
			if (email !== profile?.email) updates.email = email;
			if (phone !== profile?.phone) updates.phone = phone;
			if (address !== profile?.address) updates.address = address;

			if (Object.keys(updates).length === 0) {
				setError('No changes to save');
				setSubmitting(false);
				return;
			}

			const data = await apiFetch<{ profile: Profile }>('/profile', { method: 'PUT', body: JSON.stringify(updates) }, token);
			setProfile(data.profile);
			setPhone(data.profile.phone || '');
			setAddress(data.profile.address || '');
			setEditMode(false);
			setSuccess('Profile updated successfully! Your saved address and phone will be auto-filled at checkout.');
		} catch (err: unknown) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
			setError(errorMessage);
		} finally {
			setSubmitting(false);
		}
	};

	const handleChangePassword = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		setSuccess('');

		if (newPassword !== confirmPassword) {
			setError('New passwords do not match');
			return;
		}

		if (newPassword.length < 6) {
			setError('New password must be at least 6 characters');
			return;
		}

		setSubmitting(true);

		try {
			await apiFetch(
				'/profile/change-password',
				{
					method: 'POST',
					body: JSON.stringify({ currentPassword, newPassword }),
				},
				token
			);
			setSuccess('Password changed successfully!');
			setCurrentPassword('');
			setNewPassword('');
			setConfirmPassword('');
		} catch (err: unknown) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to change password';
			setError(errorMessage);
		} finally {
			setSubmitting(false);
		}
	};

	if (!token) return null;

	if (loading) return <div className="p-6 max-w-4xl mx-auto text-gray-900 dark:text-gray-100">Loading profile...</div>;

	if (!profile) {
		return (
			<div className="p-6 max-w-4xl mx-auto">
				<div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">{error || 'Failed to load profile'}</div>
			</div>
		);
	}

	return (
		<div className="p-6 max-w-4xl mx-auto">
			<h1 className="text-3xl font-semibold mb-6 text-gray-900 dark:text-gray-100">My Profile</h1>

			{/* Tabs */}
			<div className="flex gap-2 mb-6 border-b">
				<button
					onClick={() => setActiveTab('info')}
					className={`px-4 py-2 ${
						activeTab === 'info'
							? 'border-b-2 border-orange-600 text-orange-600 font-medium'
							: 'text-gray-600 dark:text-gray-400'
					}`}
				>
					Profile Info
				</button>
				<button
					onClick={() => setActiveTab('orders')}
					className={`px-4 py-2 ${
						activeTab === 'orders'
							? 'border-b-2 border-orange-600 text-orange-600 font-medium'
							: 'text-gray-600 dark:text-gray-400'
					}`}
				>
					Order History ({orders.length})
				</button>
				<button
					onClick={() => setActiveTab('password')}
					className={`px-4 py-2 ${
						activeTab === 'password'
							? 'border-b-2 border-orange-600 text-orange-600 font-medium'
							: 'text-gray-600 dark:text-gray-400'
					}`}
				>
					Change Password
				</button>
			</div>

			{/* Messages */}
			{error && (
				<div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
					{error}
				</div>
			)}
			{success && (
				<div className="mb-4 p-3 bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-800 dark:text-green-100 rounded">
					{success}
				</div>
			)}

			{/* Profile Info Tab */}
			{activeTab === 'info' && (
				<div className="p-6 border rounded bg-white dark:bg-gray-800">
					{!editMode ? (
						<div className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Name</label>
								<p className="text-lg text-gray-900 dark:text-gray-100">{profile.name}</p>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Email</label>
								<p className="text-lg text-gray-900 dark:text-gray-100">{profile.email}</p>
								{!profile.isVerified && (
									<span className="text-xs text-red-600 dark:text-red-400">(Not verified)</span>
								)}
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Phone</label>
								<p className="text-lg text-gray-900 dark:text-gray-100">{profile.phone || 'Not set'}</p>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Saved Address</label>
								<p className="text-lg text-gray-900 dark:text-gray-100">{profile.address || 'Not set'}</p>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Role</label>
								<p className="text-lg text-gray-900 dark:text-gray-100 capitalize">{profile.role}</p>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Member Since</label>
								<p className="text-lg text-gray-900 dark:text-gray-100">{new Date(profile.createdAt).toLocaleDateString()}</p>
							</div>
							<button
								onClick={() => setEditMode(true)}
								className="mt-4 bg-orange-600 text-white py-2 px-4 rounded hover:bg-orange-700"
							>
								Edit Profile
							</button>
						</div>
					) : (
						<form onSubmit={handleUpdateProfile} className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Name</label>
								<input
									type="text"
									value={name}
									onChange={(e) => setName(e.target.value)}
									className="w-full border rounded p-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
									required
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Email</label>
								<input
									type="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									className="w-full border rounded p-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
									required
								/>
								<p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
									Note: Changing your email will require re-verification
								</p>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Phone (Optional)</label>
								<input
									type="tel"
									value={phone}
									onChange={(e) => setPhone(e.target.value)}
									className="w-full border rounded p-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
									placeholder="Enter phone number"
								/>
								<p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
									Will be auto-filled at checkout
								</p>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Address (Optional)</label>
								<textarea
									value={address}
									onChange={(e) => setAddress(e.target.value)}
									className="w-full border rounded p-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
									rows={3}
									placeholder="Enter your delivery address"
								/>
								<p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
									Will be auto-filled at checkout
								</p>
							</div>
							<div className="flex gap-3">
								<button
									type="submit"
									disabled={submitting}
									className="bg-orange-600 text-white py-2 px-4 rounded hover:bg-orange-700 disabled:opacity-50"
								>
									{submitting ? 'Saving...' : 'Save Changes'}
								</button>
								<button
									type="button"
									onClick={() => {
										setEditMode(false);
										setName(profile.name);
										setEmail(profile.email);
										setPhone(profile.phone || '');
										setAddress(profile.address || '');
										setError('');
									}}
									className="border py-2 px-4 rounded text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
								>
									Cancel
								</button>
							</div>
						</form>
					)}
				</div>
			)}

			{/* Order History Tab */}
			{activeTab === 'orders' && (
				<div className="space-y-4">
					{orders.length === 0 ? (
						<div className="p-6 border rounded text-center text-gray-900 dark:text-gray-100">
							<p className="mb-4">You haven't placed any orders yet.</p>
							<Link href="/products" className="text-orange-600 hover:underline">
								Start Shopping
							</Link>
						</div>
					) : (
						orders.map((order) => (
							<div key={order._id} className="p-4 border rounded bg-white dark:bg-gray-800">
								<div className="flex justify-between items-start mb-3">
									<div>
										<p className="font-medium text-gray-900 dark:text-gray-100">
											Order #{order._id.slice(-8)}
										</p>
										<p className="text-sm text-gray-600 dark:text-gray-400">
											{new Date(order.createdAt).toLocaleString()}
										</p>
									</div>
									<span
										className={`px-3 py-1 rounded text-xs font-medium ${
											order.status === 'delivered'
												? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100'
												: order.status === 'cancelled'
												? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100'
												: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100'
										}`}
									>
										{order.status.toUpperCase()}
									</span>
								</div>
								<div className="space-y-1 mb-3">
									{order.items.map((item, idx) => (
										<div key={idx} className="flex justify-between text-sm text-gray-900 dark:text-gray-100">
											<span>
												{item.product.name} × {item.quantity}
											</span>
											<span>₹{item.price.toFixed(2)}</span>
										</div>
									))}
								</div>
								<div className="border-t pt-2 flex justify-between font-medium text-gray-900 dark:text-gray-100">
									<span>Total:</span>
									<span className="text-green-700 dark:text-green-400">₹{order.total.toFixed(2)}</span>
								</div>
								<Link
									href={`/orders/${order._id}`}
									className="mt-3 inline-block text-sm text-orange-600 hover:underline"
								>
									View Details →
								</Link>
							</div>
						))
					)}
				</div>
			)}

			{/* Change Password Tab */}
			{activeTab === 'password' && (
				<div className="p-6 border rounded bg-white dark:bg-gray-800">
					<form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
						<div>
							<label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
								Current Password
							</label>
							<input
								type="password"
								value={currentPassword}
								onChange={(e) => setCurrentPassword(e.target.value)}
								className="w-full border rounded p-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
								required
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
								New Password
							</label>
							<input
								type="password"
								value={newPassword}
								onChange={(e) => setNewPassword(e.target.value)}
								className="w-full border rounded p-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
								required
								minLength={6}
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
								Confirm New Password
							</label>
							<input
								type="password"
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								className="w-full border rounded p-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
								required
								minLength={6}
							/>
						</div>
						<button
							type="submit"
							disabled={submitting}
							className="bg-orange-600 text-white py-2 px-4 rounded hover:bg-orange-700 disabled:opacity-50"
						>
							{submitting ? 'Changing...' : 'Change Password'}
						</button>
					</form>
				</div>
			)}
		</div>
	);
}
