'use client';

interface PaginationProps {
	page: number;
	totalPages: number;
	onPageChange: (page: number) => void;
	className?: string;
}

export default function Pagination({ page, totalPages, onPageChange, className = '' }: PaginationProps) {
	if (totalPages <= 1) return null;

	return (
		<div className={`flex flex-wrap gap-2 items-center ${className}`}>
			<button
				type="button"
				className="border px-3 py-1 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
				disabled={page <= 1}
				onClick={() => onPageChange(page - 1)}
			>
				Prev
			</button>
			<span className="text-sm text-gray-700 dark:text-gray-300">
				Page {page} of {totalPages}
			</span>
			<button
				type="button"
				className="border px-3 py-1 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
				disabled={page >= totalPages}
				onClick={() => onPageChange(page + 1)}
			>
				Next
			</button>
		</div>
	);
}
