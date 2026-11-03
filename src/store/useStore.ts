'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type ThemeMode = 'light' | 'dark' | 'system';
type LayoutDensity = 'compact' | 'comfortable';
type SidebarStyle = 'full' | 'collapsed';

export interface UserProfile {
  id?: string | number;
  name: string;
  email: string;
  avatarUrl: string;
  jobTitle: string;
  role: string;
  phone: string;
  location: string;
  workspace: string;
  workspaceRole: string;
  bio: string;
  organizationId?: number;
  [key: string]: any;
}

interface ThemeState {
  mode: ThemeMode;
  primaryColor: string;
  density: LayoutDensity;
  sidebarStyle: SidebarStyle;
  isSidebarOpen: boolean;
  isRightPanelOpen: boolean;
  user: UserProfile;
  setMode: (mode: ThemeMode) => void;
  setPrimaryColor: (color: string) => void;
  setDensity: (density: LayoutDensity) => void;
  setSidebarStyle: (style: SidebarStyle) => void;
  toggleSidebar: () => void;
  toggleRightPanel: () => void;
  hydrateUserProfile: () => void;
  setUserRole: (role: string) => void;
  updateUserProfile: (user: Partial<UserProfile>) => void;
}

export const useStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'light',
      primaryColor: '#0565FD', // Blue
      density: 'comfortable',
      sidebarStyle: 'full',
      isSidebarOpen: true,
      isRightPanelOpen: false,
      user: {
          name: '',
          email: '',
          avatarUrl: '',
          jobTitle: '',
          role: '',
          phone: '',
          location: '',
          workspace: '',
          workspaceRole: '',
          bio: '',
      },
      setMode: (mode) => set({ mode }),
      setPrimaryColor: (primaryColor) => set({ primaryColor }),
      setDensity: (density) => set({ density }),
      setSidebarStyle: (sidebarStyle) => set({ sidebarStyle }),
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      toggleRightPanel: () => set((state) => ({ isRightPanelOpen: !state.isRightPanelOpen })),
      hydrateUserProfile: () => {
        if (typeof window === 'undefined') return;

        const storedUser = localStorage.getItem('userData');
        if (!storedUser) return;

        try {
          set({ user: JSON.parse(storedUser) });
        } catch {
          localStorage.removeItem('userData');
        }
      },
      setUserRole: (role) => set((state) => {
        const newUser = { ...state.user, role };
        if (typeof window !== 'undefined') {
          localStorage.setItem('userData', JSON.stringify(newUser));
        }
        return { user: newUser };
      }),
      updateUserProfile: (updatedUser) => set((state) => {
        const newUser = { ...state.user, ...updatedUser };
        if (typeof window !== 'undefined') {
          localStorage.setItem('userData', JSON.stringify(newUser));
        }
        return { user: newUser };
      }),
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        mode: state.mode,
        primaryColor: state.primaryColor,
        density: state.density,
        sidebarStyle: state.sidebarStyle,
        isSidebarOpen: state.isSidebarOpen,
        isRightPanelOpen: state.isRightPanelOpen,
      }),
    }
  )
);
