// @ts-nocheck
'use client';

import { useEffect, useMemo, useState } from 'react';
import { getSignedMediaUrl } from '@/lib/api';

interface ImageMeta {
  hash: string;
  alt?: string;
  primary?: boolean;
}

export default function ProductGallery({ images }: { images?: ImageMeta[] }) {
  const ordered = useMemo(() => {
    if (!images || images.length === 0) return [] as ImageMeta[];
    const primary = images.find((i) => i.primary);
    if (!primary) return images;
    return [primary, ...images.filter((i) => i.hash !== primary.hash)];
  }, [images]);

  const [urls, setUrls] = useState<string[]>([]);
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!ordered || ordered.length === 0) { setUrls([]); return; }
      const results: string[] = [];
      for (const img of ordered) {
        try { results.push(await getSignedMediaUrl(img.hash)); } catch { results.push(''); }
      }
      if (active) setUrls(results);
    })();
    return () => { active = false; };
  }, [ordered]);

  if (!ordered || ordered.length === 0) return <div className="w-full h-64 bg-gray-200 rounded" />;

  const mainUrl = urls[selected] || '';
  const mainAlt = ordered[selected]?.alt || '';

  return (
    <div>
      <div className="mb-3">
        {mainUrl ? (
          <img src={mainUrl} alt={mainAlt} className="w-full max-h-96 object-cover rounded" />
        ) : (
          <div className="w-full h-64 bg-gray-200 rounded" />
        )}
      </div>
      <div className="flex gap-2 overflow-x-auto">
        {ordered.map((img, idx) => (
          <button
            key={img.hash}
            type="button"
            className={`border rounded ${idx===selected? 'border-orange-600' : 'border-transparent'}`}
            onClick={() => setSelected(idx)}
            aria-label={`Show image ${idx+1}`}
          >
            {urls[idx] ? (
              <img src={urls[idx]} alt={img.alt || ''} className="h-16 w-16 object-cover rounded" />
            ) : (
              <div className="h-16 w-16 bg-gray-200 rounded" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}


