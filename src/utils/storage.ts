import { CalendarItem, AppSettings } from '../types';

const STORAGE_KEY = 'kyah_data';
const SETTINGS_KEY = 'kyah_settings';

export const saveItems = (items: CalendarItem[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};

export const loadItems = (): CalendarItem[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveSettings = (settings: AppSettings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export const loadSettings = (): AppSettings => {
  const data = localStorage.getItem(SETTINGS_KEY);
  return data ? JSON.parse(data) : {
    notificationsEnabled: true,
    soundEnabled: true,
    vibrationEnabled: true,
    theme: 'system'
  };
};
