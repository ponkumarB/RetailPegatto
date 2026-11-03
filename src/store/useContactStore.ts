import { create } from 'zustand';

export interface Contact {
  id: string;
  firstName?: string;
  lastName?: string;
  name: string;
  avatarUrl?: string;
  avatarFallback: string;
  fallbackBg: string;
  accountName: string;
  email: string;
  phone: string;
  phoneCountry?: string;
  workPhone?: string;
  workPhoneCountry?: string;
  mobile?: string;
  mobileCountry?: string;
  dob?: string;
  jobTitle: string;
  ownerName: string;
  ownerInitials: string;
  ownerBg: string;
  leadSource: string;
  department?: string;
  reportsTo?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pinCode?: string;
  notes?: string;
  tags?: string[];
  commPrefs?: {
    email: boolean;
    phone: boolean;
    sms: boolean;
    whatsapp: boolean;
  };
  targetList?: string;
  status: 'Active' | 'In Active' | '';
  lastContacted: string;
  isFavorite: boolean;
}

interface ContactState {
  contacts: Contact[];
  addContact: (contact: Contact) => void;
  deleteContact: (id: string) => void;
  updateContact: (id: string, updatedContact: Partial<Contact>) => void;
  toggleFavorite: (id: string) => void;
}

export const useContactStore = create<ContactState>((set) => ({
  contacts: [],
  addContact: (contact) => set((state) => ({ contacts: [contact, ...state.contacts] })),
  deleteContact: (id) => set((state) => ({ contacts: state.contacts.filter((c) => c.id !== id) })),
  updateContact: (id, updatedContact) =>
    set((state) => ({
      contacts: state.contacts.map((c) => (c.id === id ? { ...c, ...updatedContact } : c)),
    })),
  toggleFavorite: (id) =>
    set((state) => ({
      contacts: state.contacts.map((c) =>
        c.id === id ? { ...c, isFavorite: !c.isFavorite } : c
      ),
    })),
}));
