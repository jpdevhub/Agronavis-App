/**
 * Money a farmer reads at a glance.
 *
 * Indian grouping, and a lakh past a hundred thousand — ₹1.2 L is read
 * instantly where ₹1,20,000 has to be counted.
 */
export function rupees(value: number): string {
  const n = Math.round(value);
  if (Math.abs(n) >= 100000) return `₹${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)} L`;
  if (Math.abs(n) >= 1000) return `₹${Math.round(n / 1000)}k`;
  return `₹${n.toLocaleString('en-IN')}`;
}

/** The exact figure, for the line that has to be precise. */
export const rupeesExact = (value: number): string => `₹${Math.round(value).toLocaleString('en-IN')}`;

export type SortKey = 'profit' | 'water' | 'cost' | 'season';

export const SORTS: { key: SortKey; label: string }[] = [
  { key: 'profit', label: 'Most profit' },
  { key: 'water', label: 'Least water' },
  { key: 'cost', label: 'Lowest cost' },
  { key: 'season', label: 'Sow now' },
];
