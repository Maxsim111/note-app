const BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

export const api = {
  get<T>(url: string): Promise<T> {
    return request<T>(url);
  },
  post<T>(url: string, body?: unknown): Promise<T> {
    return request<T>(url, { method: 'POST', body: body ? JSON.stringify(body) : undefined });
  },
  put<T>(url: string, body?: unknown): Promise<T> {
    return request<T>(url, { method: 'PUT', body: body ? JSON.stringify(body) : undefined });
  },
  del<T>(url: string): Promise<T> {
    return request<T>(url, { method: 'DELETE' });
  },
  async upload<T>(url: string, formData: FormData): Promise<T> {
    const res = await fetch(`${BASE}${url}`, { method: 'POST', body: formData });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || res.statusText);
    }
    return res.json();
  },
};
