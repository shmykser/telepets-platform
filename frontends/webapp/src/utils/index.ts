import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getStoredUserId(): string {
  if (typeof localStorage === 'undefined') return '273065571'
  
  const storedUserId = localStorage.getItem('user_id')
  if (storedUserId) {
    return storedUserId
  }
  
  const testUserId = import.meta.env.VITE_TEST_USER_ID
  if (testUserId) {
    return testUserId
  }
  
  return '273065571'
}

export function setStoredUserId(userId: string): void {
  try {
    localStorage.setItem('user_id', userId)
  } catch {}
}

export function getStoredUsername(): string {
  if (typeof localStorage === 'undefined') return 'Shmykser'
  
  const storedUsername = localStorage.getItem('username')
  if (storedUsername) {
    return storedUsername
  }
  
  return 'Shmykser'
}

export function setStoredUsername(username: string): void {
  try {
    localStorage.setItem('username', username)
  } catch {}
}

