// @ts-nocheck
export function getApiBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!url) throw new Error('Missing NEXT_PUBLIC_API_URL');
  return url.replace(/\/$/, '');
}

export async function apiFetch<T>(path: string, opts: RequestInit = {}, token?: string | null): Promise<T> {
  const base = getApiBaseUrl();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(opts.headers || {})
  };
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  let res: Response;
  try {
    res = await fetch(`${base}${path}`, { ...opts, headers });
  } catch (e) {
    const err = new Error(`Cannot reach API at ${base}. Ensure NEXT_PUBLIC_API_URL is set and the API is running.`) as Error & { cause?: unknown };
    err.cause = e;
    throw err;
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const message = (data && (data.error || data.message)) || `Request failed with ${res.status}`;
    const code = data?.code as string | undefined;
    const details = data?.details as unknown;
    const err = new Error(message) as Error & { code?: string; details?: unknown; status?: number };
    err.code = code;
    err.details = details;
    err.status = res.status;
    throw err;
  }
  return (await res.json()) as T;
}

export async function uploadFile(file: File, token: string): Promise<{ hash: string }> {
  const base = getApiBaseUrl();
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${base}/upload/image`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form as any
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error || 'Upload failed');
  }
  return (await res.json()) as { hash: string };
}

export async function getSignedMediaUrl(hash: string): Promise<string> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/media/sign/${encodeURIComponent(hash)}`);
  if (!res.ok) throw new Error('Failed to sign media URL');
  const data = (await res.json()) as { url: string };
  return data.url;
}


