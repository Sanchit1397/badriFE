export default function CartItemSkeleton() {
	return (
		<div className="border rounded p-4 flex gap-4 animate-pulse">
			<div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded flex-shrink-0" />
			<div className="flex-1 space-y-2">
				<div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
				<div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
			</div>
			<div className="flex flex-col gap-2">
				<div className="h-10 w-28 bg-gray-200 dark:bg-gray-700 rounded" />
				<div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
			</div>
		</div>
	);
}

