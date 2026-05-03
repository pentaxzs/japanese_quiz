import { useSettingsStore } from '@/store/settings-store';

export function getApiKey(): string {
  return useSettingsStore.getState().apiKey;
}

export function apiFetch(url: string, options: Omit<RequestInit, 'body'> & { body?: unknown } = {}) {
  const apiKey = getApiKey();
  const { body, ...rest } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(rest.headers as Record<string, string>),
  };
  if (apiKey) headers['x-api-key'] = apiKey;

  return fetch(url, {
    ...rest,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}
