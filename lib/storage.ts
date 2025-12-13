import { UnpackEntry } from './types';

const STORAGE_KEY = 'unpack_entries';

export function getEntries(): UnpackEntry[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function saveEntry(entry: Omit<UnpackEntry, 'ts'>): void {
  if (typeof window === 'undefined') return;
  
  const entries = getEntries();
  const newEntry: UnpackEntry = {
    ...entry,
    ts: new Date().toISOString(),
  };
  
  entries.push(newEntry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function getRecentEntries(count: number = 7): UnpackEntry[] {
  const entries = getEntries();
  return entries.slice(-count).reverse();
}

export function getAllWords(): string[] {
  const entries = getEntries();
  const wordCounts: Record<string, number> = {};
  
  entries.forEach(entry => {
    entry.words.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });
  });
  
  return Object.entries(wordCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([word]) => word);
}

export function getAssociations(): {
  timeOfDay?: string;
  weekdayPattern?: string;
} {
  const entries = getEntries();
  if (entries.length === 0) return {};
  
  const hourCounts: Record<string, number> = {};
  const weekdayCounts: Record<string, number> = {};
  
  entries.forEach(entry => {
    const date = new Date(entry.ts);
    const hour = date.getHours();
    const hourGroup = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
    const day = date.getDay();
    const isWeekday = day >= 1 && day <= 5;
    
    hourCounts[hourGroup] = (hourCounts[hourGroup] || 0) + 1;
    weekdayCounts[isWeekday ? 'weekday' : 'weekend'] = 
      (weekdayCounts[isWeekday ? 'weekday' : 'weekend'] || 0) + 1;
  });
  
  const mostCommonTime = Object.entries(hourCounts)
    .sort(([, a], [, b]) => b - a)[0]?.[0];
  
  const weekdayPattern = weekdayCounts.weekday > weekdayCounts.weekend
    ? 'weekdays'
    : weekdayCounts.weekend > weekdayCounts.weekday
    ? 'weekends'
    : undefined;
  
  return {
    timeOfDay: mostCommonTime,
    weekdayPattern,
  };
}

