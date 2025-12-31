import { BASE_URL } from '../app/api_client';

export function resolveMediaUrl(inputUrl: string | undefined | null): string | null {
  if (!inputUrl) return null;
  
  if (inputUrl.startsWith('http://') || inputUrl.startsWith('https://') || inputUrl.startsWith('data:')) {
    return inputUrl;
  }
  
  if (inputUrl.startsWith('/')) {
    return `${BASE_URL}${inputUrl}`;
  }
  
  return `${BASE_URL}/${inputUrl}`;
}

export function getInitials(name: string | undefined): string {
  if (!name) return '?';
  
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  
  return name.slice(0, 2).toUpperCase();
}
