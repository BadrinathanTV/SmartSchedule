const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

type ApiOptions = RequestInit & { json?: object };

async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { json, headers, ...rest } = options;
  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(headers || {}),
    },
    body: json ? JSON.stringify(json) : rest.body,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function login(email: string, password: string) {
  return apiFetch<{ user: unknown }>(`/api/auth/login`, {
    method: 'POST',
    json: { email, password },
  });
}

export async function signup(email: string, password: string, full_name: string, role: string) {
  return apiFetch<{ user: unknown }>(`/api/auth/signup`, {
    method: 'POST',
    json: { email, password, full_name, role },
  });
}

export async function getDailyAnalytics() {
  return apiFetch('/api/admin/daily-analytics');
}

export async function getMonthlySummary() {
  return apiFetch('/api/admin/monthly-summary');
}

export async function getUsers() {
  return apiFetch('/api/admin/users');
}

export async function createUser(payload: {
  email: string;
  full_name: string;
  role: string;
  assigned_channels?: string[];
}) {
  return apiFetch('/api/admin/users', { method: 'POST', json: payload });
}

export async function updateUser(userId: string, payload: {
  full_name?: string;
  role?: string;
  assigned_channels?: string[];
  is_active?: boolean;
}) {
  return apiFetch(`/api/admin/users/${userId}`, { method: 'PATCH', json: payload });
}

export async function getMediaUploads() {
  return apiFetch('/api/media');
}

export async function uploadMedia(file: File, payload: {
  title: string;
  description?: string;
  genre?: string;
  rating?: string;
  targetAudience?: string;
  transcription?: string;
}) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('title', payload.title);
  if (payload.description) formData.append('description', payload.description);
  if (payload.genre) formData.append('genre', payload.genre);
  if (payload.rating) formData.append('rating', payload.rating);
  if (payload.targetAudience) formData.append('targetAudience', payload.targetAudience);
  if (payload.transcription) formData.append('transcription', payload.transcription);

  const response = await fetch(`${API_URL}/api/media/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Upload failed: ${response.status}`);
  }

  return response.json();
}
