'use client';

interface SearchInputProps {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	className?: string;
}

export default function SearchInput({
	value,
	onChange,
	placeholder = 'Search…',
	className = '',
}: SearchInputProps) {
	return (
		<input
			type="search"
			value={value}
			onChange={(e) => onChange(e.target.value)}
			placeholder={placeholder}
			className={`border rounded px-3 py-2 text-sm w-full sm:w-64 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 ${className}`}
		/>
	);
}
