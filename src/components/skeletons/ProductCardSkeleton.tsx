export default function ProductCardSkeleton() {
	return (
		<div className="border rounded p-3 flex flex-col animate-pulse">
			<div className="h-40 w-full bg-gray-200 dark:bg-gray-700 rounded mb-2" />
			<div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
			<div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4" />
			<div className="h-10 bg-gray-200 dark:bg-gray-700 rounded mt-auto" />
		</div>
	);
}

