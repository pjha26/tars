import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRelativeTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  // Time format: "2:34 PM"
  const timeStr = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  if (isToday) {
    return timeStr;
  }

  const isThisYear = date.getFullYear() === now.getFullYear();

  // Date format without year: "Feb 15"
  const dateStrNoYear = date.toLocaleDateString([], { month: 'short', day: 'numeric' });

  if (isThisYear) {
    return `${dateStrNoYear}, ${timeStr}`;
  }

  // Date format with year: "Feb 15, 2023"
  const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  return `${dateStr}, ${timeStr}`;
}
