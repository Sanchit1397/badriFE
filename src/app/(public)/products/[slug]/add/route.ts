// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { useCartStore } from '@/store/cart';

export async function POST(_req: NextRequest, props: { params: Promise<{ slug: string }> }) {
  // This is a tiny server action proxy; better approach is client-side add directly, but kept for progressive enhancement
  const params = await props.params;
  const { slug } = params;
  // Cart is client-side; we can redirect back and let client rehydrate
  return NextResponse.redirect(new URL(`/products/${encodeURIComponent(slug)}`, _req.nextUrl.origin));
}


