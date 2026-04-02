import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export const UK_REGIONS = [
  'East of England',
  'London',
  'Midlands',
  'North East and Yorkshire',
  'North West',
  'South East',
  'South West',
  'Wales',
  'Scotland',
  'Northern Ireland',
] as const;

export const SPECIALTIES = [
  { id: 'foundation', name: 'Foundation', years: ['FY1', 'FY2'] },
  { id: 'imt', name: 'IMT', years: ['IMT1', 'IMT2', 'IMT3'] },
  { id: 'ophthalmology', name: 'Ophthalmology', years: ['ST1', 'ST2', 'ST3', 'ST4', 'ST5', 'ST6', 'ST7'] },
] as const;

export type SpecialtyId = typeof SPECIALTIES[number]['id'];

export function getSpecialtyById(id: string) {
  return SPECIALTIES.find((s) => s.id === id);
}

export function getSpecialtyDbName(id: string): string {
  const map: Record<string, string> = {
    foundation: 'Foundation',
    imt: 'IMT',
    ophthalmology: 'Ophthalmology',
  };
  return map[id] || id;
}

// --- Application specialties (Future Applications) ---

export const APPLICATION_SPECIALTIES = [
  { id: 'imt', name: 'IMT', displayName: 'Internal Medicine Training' },
] as const;

export type ApplicationSpecialtyId = typeof APPLICATION_SPECIALTIES[number]['id'];

export function getApplicationSpecialtyById(id: string) {
  return APPLICATION_SPECIALTIES.find((s) => s.id === id);
}

export function getApplicationSpecialtyDbName(id: string): string {
  const map: Record<string, string> = {
    imt: 'IMT',
  };
  return map[id] || id;
}
