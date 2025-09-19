import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(num);
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function validateLatitude(lat: number): boolean {
  return lat >= -90 && lat <= 90;
}

export function validateLongitude(lng: number): boolean {
  return lng >= -180 && lng <= 180;
}

export function validateConcentration(conc: number): boolean {
  return conc >= 0;
}

export function downloadCSV(data: string, filename: string): void {
  const blob = new Blob([data], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}