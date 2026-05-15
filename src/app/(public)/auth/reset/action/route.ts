import { NextRequest, NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/api';

/** After a form POST, redirect with 303 so the browser follows with GET (307 keeps POST). */
function redirectAfterPost(url: URL | string) {
  return NextResponse.redirect(url, 303);
}

export async function POST(req: NextRequest) {
  const base = getApiBaseUrl();
  const url = new URL(req.url);
  const token = (url.searchParams.get('token') || '').trim();
  const form = await req.formData();
  const password = String(form.get('password') || '');
  const res = await fetch(`${base}/auth/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password })
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const msg = data?.error || 'Failed to reset password';
    const redirectUrl = new URL('/auth/reset', req.nextUrl.origin);
    redirectUrl.searchParams.set('token', token);
    redirectUrl.searchParams.set('error', msg);
    return redirectAfterPost(redirectUrl);
  }
  return redirectAfterPost(new URL('/auth/login', req.nextUrl.origin));
}


