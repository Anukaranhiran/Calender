export type ItemType = 'todo' | 'event' | 'note';
export type EventCategory = 'work' | 'personal' | 'health' | 'social' | 'urgent' | 'other';

export interface CalendarItem {
  id: string;
  type: ItemType;
  eventCategory?: EventCategory;
  title: string;
  description?: string;
  links: string[];
  date: string; // ISO string YYYY-MM-DD
  completed: boolean;
  time?: string;
  notifyOnAdd?: boolean;
}

export interface AppSettings {
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  theme: 'light' | 'dark' | 'system';
}

export interface DailyData {
  [date: string]: CalendarItem[];
}
