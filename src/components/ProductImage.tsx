'use client';

import { useEffect, useState } from 'react';
import { getSignedMediaUrl } from '@/lib/api';

interface ProductImageProps {
  images?: { hash: string; alt?: string; primary?: boolean }[];
  className?: string;
}

export default function ProductImage({ images, className }: ProductImageProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [alt, setAlt] = useState<string>('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let mounted = true;
    const primary = images?.find((i) => i.primary) || images?.[0];
    if (!primary) return;
    (async () => {
      try {
        const u = await getSignedMediaUrl(primary.hash);
        if (mounted) { setUrl(u); setAlt(primary.alt || ''); }
      } catch {}
      finally { if (mounted) setLoading(false); }
    })();
    return () => { mounted = false; };
  }, [images]);
  if (loading) return <div className={`skeleton ${className || ''}`} />;
  if (!url) return (
    <div className={`bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs text-gray-700 dark:text-gray-200 ${className || ''}`}>
      No image available
    </div>
  );
  return <img src={url} alt={alt} className={className} />;
}


