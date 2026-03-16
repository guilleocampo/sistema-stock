export const API_URL = 'http://localhost:3001';

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<{ data: T; error: string | null; message: string }> {
  const token = localStorage.getItem('auth_token');

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers as Record<string, string> ?? {}),
    },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? json.message ?? 'Error desconocido');
  return json;
}
