import { create } from 'zustand';

export interface NotificationChannel {
  email: boolean;
  inApp: boolean;
  sms: boolean;
}

export interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  channels: NotificationChannel;
  iconName: string;
}

interface NotificationPreferencesStore {
  preferences: NotificationSetting[];
  isSaving: boolean;
  toggleChannelPreference: (settingId: string, channel: keyof NotificationChannel) => void;
  resetToDefault: () => void;
  savePreferences: () => Promise<void>;
}

const DEFAULT_PREFERENCES: NotificationSetting[] = [
  {
    id: 'new-leads',
    title: 'New Leads',
    description: 'When a new lead is added',
    channels: { email: true, inApp: true, sms: false },
    iconName: 'UserPlus',
  },
  {
    id: 'deal-updates',
    title: 'Deal Updates',
    description: 'When a deal is created, updated or won/lost',
    channels: { email: true, inApp: true, sms: true },
    iconName: 'DollarSign',
  },
  {
    id: 'task-reminders',
    title: 'Task Reminders',
    description: 'Reminders for assigned tasks and deadlines',
    channels: { email: true, inApp: true, sms: false },
    iconName: 'CheckSquare',
  },
  {
    id: 'comments-mentions',
    title: 'Comments & Mentions',
    description: 'When someone comments or mentions you',
    channels: { email: false, inApp: true, sms: false },
    iconName: 'MessageSquare',
  },
  {
    id: 'reports-insights',
    title: 'Reports & Insights',
    description: 'Scheduled reports and important insights',
    channels: { email: true, inApp: false, sms: false },
    iconName: 'TrendingUp',
  },
  {
    id: 'system-notifications',
    title: 'System Notifications',
    description: 'Important system updates and announcements',
    channels: { email: true, inApp: true, sms: false },
    iconName: 'Settings',
  },
];

export const useNotificationPreferencesStore = create<NotificationPreferencesStore>((set, get) => {
  // Load initial preferences from localStorage if available (client-side only)
  let initialPrefs = DEFAULT_PREFERENCES;
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('crm_notification_preferences');
      if (stored) {
        initialPrefs = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to parse cached notification preferences', e);
    }
  }

  return {
    preferences: initialPrefs,
    isSaving: false,

    toggleChannelPreference: (settingId, channel) => set((state) => {
      const updated = state.preferences.map((pref) => {
        if (pref.id === settingId) {
          return {
            ...pref,
            channels: {
              ...pref.channels,
              [channel]: !pref.channels[channel],
            },
          };
        }
        return pref;
      });
      return { preferences: updated };
    }),

    resetToDefault: () => set({ preferences: JSON.parse(JSON.stringify(DEFAULT_PREFERENCES)) }),

    savePreferences: async () => {
      set({ isSaving: true });
      // Simulate network request
      await new Promise((resolve) => setTimeout(resolve, 800));
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('crm_notification_preferences', JSON.stringify(get().preferences));
      }
      
      set({ isSaving: false });
    },
  };
});
