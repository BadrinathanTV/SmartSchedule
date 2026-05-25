export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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

export async function importProgramAnalytics(payload: { programs: Array<Record<string, unknown>> }) {
  return apiFetch<{
    updatedCount: number;
    updatedPrograms: Array<{ mediaId: string; title: string }>;
    unmatchedPrograms: string[];
  }>('/api/media/analytics/import', { method: 'POST', json: payload });
}

export async function updateMedia(mediaId: string, payload: {
  channelId?: string;
  title?: string;
  fileName?: string;
  fileSize?: number;
  duration?: number;
  status?: string;
  uploadProgress?: number;
  transcodingProgress?: number;
  metadata?: {
    description: string;
    genre: string[];
    rating: string;
    transcription?: string;
    targetAudience: string[];
    rightsStart?: string;
    rightsEnd?: string;
    regions: string[];
    tags: string[];
  };
  uploadedAt?: string;
  thumbnailUrl?: string;
  transcription?: string;
  transcriptionSource?: string;
}) {
  return apiFetch(`/api/media/${mediaId}`, { method: 'PATCH', json: payload });
}

export async function uploadMedia(file: File, payload: {
  title: string;
  channelId?: string;
  description?: string;
  genre?: string;
  rating?: string;
  targetAudience?: string;
  transcription?: string;
  regions?: string;
  tags?: string;
  rightsStart?: string;
  rightsEnd?: string;
  thumbnailUrl?: string;
}) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('title', payload.title);
  if (payload.channelId) formData.append('channelId', payload.channelId);
  if (payload.description) formData.append('description', payload.description);
  if (payload.genre) formData.append('genre', payload.genre);
  if (payload.rating) formData.append('rating', payload.rating);
  if (payload.targetAudience) formData.append('targetAudience', payload.targetAudience);
  if (payload.transcription) formData.append('transcription', payload.transcription);
  if (payload.regions) formData.append('regions', payload.regions);
  if (payload.tags) formData.append('tags', payload.tags);
  if (payload.rightsStart) formData.append('rightsStart', payload.rightsStart);
  if (payload.rightsEnd) formData.append('rightsEnd', payload.rightsEnd);
  if (payload.thumbnailUrl) formData.append('thumbnailUrl', payload.thumbnailUrl);

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

export async function deleteMedia(mediaId: string) {
  return apiFetch(`/api/media/${mediaId}`, { method: 'DELETE' });
}
