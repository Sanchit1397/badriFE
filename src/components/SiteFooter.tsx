'use client';

import { useEffect, useState } from 'react';
import { getStoreConfig, type IStoreConfig } from '@/lib/storeConfig';

export default function SiteFooter() {
	const [cfg, setCfg] = useState<IStoreConfig | null>(null);

	useEffect(() => {
		let cancelled = false;
		getStoreConfig()
			.then((c) => {
				if (!cancelled) setCfg(c);
			})
			.catch(() => {
				if (!cancelled) setCfg(null);
			});
		return () => {
			cancelled = true;
		};
	}, []);

	const hasContact =
		cfg && (cfg.store_phone?.trim() || cfg.store_email?.trim() || cfg.store_address?.trim());

	if (!cfg) {
		return (
			<footer className="border-t mt-auto">
				<div className="mx-auto max-w-5xl px-4 py-6 text-sm text-gray-500"> </div>
			</footer>
		);
	}

	return (
		<footer className="border-t mt-auto bg-gray-50 text-gray-800">
			<div className="mx-auto max-w-5xl px-4 py-6 text-sm space-y-3">
				<div className="font-medium text-gray-900">{cfg.store_name || 'BadrikiDukaan'}</div>
				{hasContact ? (
					<div className="space-y-1 text-gray-700">
						{cfg.store_phone?.trim() && (
							<p>
								<span className="text-gray-500">Phone: </span>
								<a href={`tel:${cfg.store_phone.replace(/\s/g, '')}`} className="text-orange-600 hover:underline">
									{cfg.store_phone.trim()}
								</a>
							</p>
						)}
						{cfg.store_email?.trim() && (
							<p>
								<span className="text-gray-500">Email: </span>
								<a href={`mailto:${cfg.store_email.trim()}`} className="text-orange-600 hover:underline break-all">
									{cfg.store_email.trim()}
								</a>
							</p>
						)}
						{cfg.store_address?.trim() && (
							<p className="whitespace-pre-line">
								<span className="text-gray-500">Address: </span>
								{cfg.store_address.trim()}
							</p>
						)}
					</div>
				) : (
					<p className="text-gray-500 text-xs">Add store contact details in Admin → Settings → Business Information.</p>
				)}
			</div>
		</footer>
	);
}
