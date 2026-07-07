import { type ClassValue, clsx } from 'clsx';
import { PureComponent } from 'react';
import { clsx as clsxFn } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
