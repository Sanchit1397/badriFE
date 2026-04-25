'use client';

import { useMemo, useRef, useState } from 'react';

interface CategoryItem {
  slug: string;
  name: string;
  icon?: string;
  isActive?: boolean;
}

interface CategoryRailProps {
  categories: CategoryItem[];
  selectedSlug?: string;
  onSelect: (slug: string) => void;
  className?: string;
}

export default function CategoryRail({ categories, selectedSlug = '', onSelect, className = '' }: CategoryRailProps) {
  const railRef = useRef<HTMLDivElement | null>(null);
  const [tick, setTick] = useState(0);

  const activeCategories = useMemo(() => categories.filter((c) => c.isActive !== false), [categories]);

  const canScrollLeft = !!railRef.current && railRef.current.scrollLeft > 4;
  const canScrollRight = !!railRef.current && railRef.current.scrollLeft + railRef.current.clientWidth < railRef.current.scrollWidth - 4;

  function scrollByDirection(direction: 'left' | 'right') {
    const rail = railRef.current;
    if (!rail) return;
    const amount = Math.max(220, Math.floor(rail.clientWidth * 0.7));
    rail.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
    setTimeout(() => setTick((v) => v + 1), 220);
  }

  return (
    <div className={`relative flex items-center gap-2 ${className}`} data-tick={tick}>
      <button
        type="button"
        aria-label="Scroll categories left"
        onClick={() => scrollByDirection('left')}
        disabled={!canScrollLeft}
        className="h-9 w-9 shrink-0 rounded-full border bg-white text-gray-700 disabled:opacity-40"
      >
        {'<'}
      </button>
      <div
        ref={railRef}
        onScroll={() => setTick((v) => v + 1)}
        className="flex-1 overflow-x-auto whitespace-nowrap scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <button
          type="button"
          onClick={() => onSelect('')}
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 mr-2 text-sm ${
            !selectedSlug ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-gray-800'
          }`}
        >
          <span>All</span>
        </button>
        {activeCategories.map((c) => (
          <button
            key={c.slug}
            type="button"
            onClick={() => onSelect(c.slug)}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 mr-2 text-sm ${
              selectedSlug === c.slug ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-gray-800'
            }`}
          >
            <span className="text-base leading-none">{c.icon || '•'}</span>
            <span>{c.name}</span>
          </button>
        ))}
      </div>
      <button
        type="button"
        aria-label="Scroll categories right"
        onClick={() => scrollByDirection('right')}
        disabled={!canScrollRight}
        className="h-9 w-9 shrink-0 rounded-full border bg-white text-gray-700 disabled:opacity-40"
      >
        {'>'}
      </button>
    </div>
  );
}
