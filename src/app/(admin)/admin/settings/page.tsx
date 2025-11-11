// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { apiFetch } from '@/lib/api';

interface Setting {
	_id: string;
	key: string;
	value: string | number | boolean;
	type: 'string' | 'number' | 'boolean' | 'json';
	category: string;
	label: string;
	description?: string;
	editable: boolean;
	updatedAt: string;
}

export default function AdminSettingsPage() {
	const { token, role } = useAuthStore();
	const router = useRouter();
	const [settings, setSettings] = useState<Setting[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [editingKey, setEditingKey] = useState<string | null>(null);
	const [editValues, setEditValues] = useState<Record<string, string | number | boolean>>({});
	const [saving, setSaving] = useState<Record<string, boolean>>({});

	useEffect(() => {
		if (!token || role !== 'admin') {
			router.replace('/');
			return;
		}

		const fetchSettings = async () => {
			setLoading(true);
			setError('');
			try {
				const data = await apiFetch<{ settings: Setting[] }>('/admin/settings', {}, token);
				setSettings(data.settings);
				// Initialize edit values
				const initialValues: Record<string, string | number | boolean> = {};
				data.settings.forEach((s) => {
					initialValues[s.key] = s.value;
				});
				setEditValues(initialValues);
			} catch (err: any) {
				setError(err.message || 'Failed to load settings');
			} finally {
				setLoading(false);
			}
		};

		fetchSettings();
	}, [token, role, router]);

	const handleSave = async (setting: Setting) => {
		setSaving((prev) => ({ ...prev, [setting.key]: true }));
		setError('');

		try {
			let valueToSend = editValues[setting.key];

			// Type conversion
			if (setting.type === 'number') {
				valueToSend = Number(valueToSend);
				if (isNaN(valueToSend as number)) {
					throw new Error('Invalid number');
				}
			} else if (setting.type === 'boolean') {
				valueToSend = Boolean(valueToSend);
			}

			await apiFetch(
				`/admin/settings/${setting.key}`,
				{
					method: 'PUT',
					body: JSON.stringify({ value: valueToSend }),
				},
				token
			);

			// Update local state
			setSettings((prev) =>
				prev.map((s) => (s.key === setting.key ? { ...s, value: valueToSend as any } : s))
			);

			setEditingKey(null);
		} catch (err: any) {
			setError(err.message || 'Failed to save setting');
		} finally {
			setSaving((prev) => ({ ...prev, [setting.key]: false }));
		}
	};

	const handleCancel = (setting: Setting) => {
		setEditValues((prev) => ({ ...prev, [setting.key]: setting.value }));
		setEditingKey(null);
	};

	const groupedSettings = settings.reduce((acc, setting) => {
		if (!acc[setting.category]) {
			acc[setting.category] = [];
		}
		acc[setting.category].push(setting);
		return acc;
	}, {} as Record<string, Setting[]>);

	const categoryLabels: Record<string, string> = {
		checkout: '📦 Checkout Settings',
		delivery: '🚚 Delivery Settings',
		fees: '⚡ Surge & Extra Fees',
		business: '🏪 Business Information',
		loyalty: '🎁 Loyalty Program',
		notifications: '🔔 Notifications',
	};

	const categoryDescriptions: Record<string, string> = {
		checkout: 'Settings related to cart and checkout process',
		delivery: 'Delivery fees, zones, and timing',
		fees: 'Additional charges and surge pricing',
		business: 'Store details and contact information',
		loyalty: 'Customer loyalty and rewards program',
		notifications: 'Email and SMS notification settings',
	};

	if (loading) {
		return (
			<div className="p-4 sm:p-6 max-w-5xl mx-auto">
				<h1 className="text-2xl sm:text-3xl font-semibold mb-6 text-gray-900 dark:text-gray-100">
					Settings
				</h1>
				<p className="text-gray-600 dark:text-gray-400">Loading settings...</p>
			</div>
		);
	}

	if (role !== 'admin') return null;

	return (
		<div className="p-4 sm:p-6 max-w-5xl mx-auto">
			<div className="mb-6">
				<h1 className="text-2xl sm:text-3xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
					Settings
				</h1>
				<p className="text-sm text-gray-600 dark:text-gray-400">
					Configure your store settings. Changes take effect immediately.
				</p>
			</div>

			{error && (
				<div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded">
					{error}
				</div>
			)}

			<div className="space-y-8">
				{Object.entries(groupedSettings).map(([category, categorySettings]) => (
					<div key={category} className="border rounded-lg p-4 sm:p-6 bg-white dark:bg-gray-800">
						<h2 className="text-xl font-semibold mb-1 text-gray-900 dark:text-gray-100">
							{categoryLabels[category] || category}
						</h2>
						<p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
							{categoryDescriptions[category] || ''}
						</p>

						<div className="space-y-4">
							{categorySettings.map((setting) => (
								<div key={setting.key} className="border-t pt-4 first:border-t-0 first:pt-0">
									<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
										<div className="flex-1">
											<label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
												{setting.label}
											</label>
											{setting.description && (
												<p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
													{setting.description}
												</p>
											)}

											{editingKey === setting.key ? (
												<div className="flex gap-2 items-center">
													{setting.type === 'boolean' ? (
														<label className="flex items-center gap-2 cursor-pointer">
															<input
																type="checkbox"
																checked={Boolean(editValues[setting.key])}
																onChange={(e) =>
																	setEditValues((prev) => ({
																		...prev,
																		[setting.key]: e.target.checked,
																	}))
																}
																className="w-4 h-4"
															/>
															<span className="text-sm text-gray-900 dark:text-gray-100">
																{editValues[setting.key] ? 'Enabled' : 'Disabled'}
															</span>
														</label>
													) : (
														<input
															type={setting.type === 'number' ? 'number' : 'text'}
															value={String(editValues[setting.key] || '')}
															onChange={(e) =>
																setEditValues((prev) => ({
																	...prev,
																	[setting.key]: e.target.value,
																}))
															}
															className="flex-1 max-w-xs border rounded p-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900"
															disabled={saving[setting.key]}
														/>
													)}
													<button
														onClick={() => handleSave(setting)}
														disabled={saving[setting.key]}
														className="px-3 py-2 bg-orange-600 text-white text-sm rounded hover:bg-orange-700 disabled:opacity-50"
													>
														{saving[setting.key] ? 'Saving...' : 'Save'}
													</button>
													<button
														onClick={() => handleCancel(setting)}
														disabled={saving[setting.key]}
														className="px-3 py-2 border text-sm rounded text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
													>
														Cancel
													</button>
												</div>
											) : (
												<div className="flex items-center gap-3">
													<div className="flex-1">
														{setting.type === 'boolean' ? (
															<span
																className={`inline-block px-2 py-1 text-xs rounded font-semibold ${
																	setting.value
																		? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
																		: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
																}`}
															>
																{setting.value ? 'Enabled' : 'Disabled'}
															</span>
														) : (
															<span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
																{String(setting.value)}
																{setting.type === 'number' &&
																	(setting.key.includes('fee') ||
																		setting.key.includes('value') ||
																		setting.key.includes('threshold')) &&
																	' ₹'}
																{setting.key.includes('percentage') && ' %'}
															</span>
														)}
													</div>
													{setting.editable && (
														<button
															onClick={() => setEditingKey(setting.key)}
															className="px-3 py-1 text-xs border rounded text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
														>
															Edit
														</button>
													)}
												</div>
											)}
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				))}
			</div>

			{settings.length === 0 && !loading && (
				<div className="text-center py-12 text-gray-600 dark:text-gray-400">
					<p className="mb-4">No settings found.</p>
					<p className="text-sm">Run `npm run seed:settings` in the API directory to create default settings.</p>
				</div>
			)}
		</div>
	);
}
