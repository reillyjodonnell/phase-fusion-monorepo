import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { type Card } from '../components/card';

export type Color = 'red' | 'green' | 'blue' | 'yellow';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
