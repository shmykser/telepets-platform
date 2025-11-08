import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { settings } from '@/config/settings';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getStoredUserId(): string {
  if (typeof localStorage === 'undefined') {
    return settings.defaults.userId;
  }

  const storedUserId = localStorage.getItem('user_id');
  if (storedUserId) {
    return storedUserId;
  }

  const fallback = import.meta.env.VITE_TEST_USER_ID ?? settings.defaults.userId;
  setStoredUserId(fallback);
  return fallback;
}

export function setStoredUserId(userId: string): void {
  try {
    localStorage.setItem('user_id', userId);
  } catch {}
}

export function getStoredUsername(): string {
  if (typeof localStorage === 'undefined') {
    return settings.defaults.username;
  }

  const storedUsername = localStorage.getItem('username');
  if (storedUsername) {
    return storedUsername;
  }

  setStoredUsername(settings.defaults.username);
  return settings.defaults.username;
}

export function setStoredUsername(username: string): void {
  try {
    localStorage.setItem('username', username);
  } catch {}
}

