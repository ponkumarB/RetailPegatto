import { create } from 'zustand';
import { Role } from '@/types/role';

interface RoleState {
  roles: Role[];
  addRole: (role: Role) => void;
  updateRole: (id: string, updatedRole: Partial<Role>) => void;
  deleteRole: (id: string) => void;
}

export const useRoleStore = create<RoleState>((set) => ({
  roles: [],
  addRole: (role) => set((state) => ({ roles: [role, ...state.roles] })),
  deleteRole: (id) => set((state) => ({ roles: state.roles.filter((r) => r.id !== id) })),
  updateRole: (id, updatedRole) =>
    set((state) => ({
      roles: state.roles.map((r) => (r.id === id ? { ...r, ...updatedRole } : r)),
    })),
}));
