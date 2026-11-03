import { create } from 'zustand';

interface PermissionState {
  permissions: string[];
  isLoaded: boolean;
  setPermissions: (permissions: string[]) => void;
  hasPermission: (permissionCode: string) => boolean;
  hasAnyPermission: (permissionCodes: string[]) => boolean;
  clearPermissions: () => void;
}

export const usePermissionStore = create<PermissionState>((set, get) => ({
  permissions: [],
  isLoaded: false,

  setPermissions: (perms) => {
    const cleaned = (perms || []).map((p) => p.toLowerCase());
    set({ permissions: cleaned, isLoaded: true });
  },

  hasPermission: (code) => {
    if (!code) return true;
    const { permissions } = get();
    const lowerCode = code.toLowerCase();
    return (
      permissions.includes(lowerCode) ||
      permissions.includes('*') ||
      permissions.includes('admin')
    );
  },

  hasAnyPermission: (codes) => {
    const { permissions } = get();
    return codes.some((code) => permissions.includes(code.toLowerCase()));
  },

  clearPermissions: () => {
    set({ permissions: [], isLoaded: false });
  },
}));
