import { create } from 'zustand';
import { TodaysCallRecord } from '@/types/todaysCall';

interface TodaysCallsStore {
  calls: TodaysCallRecord[];
  selectedDate: string; // "24/05/2024"
  searchQuery: string;
  selectedAssignee: string;
  selectedStatus: string;

  setFilters: (filters: {
    searchQuery?: string;
    selectedAssignee?: string;
    selectedStatus?: string;
  }) => void;
  resetFilters: () => void;
  setSelectedDate: (date: string) => void;
  shiftDate: (days: number) => void;
  addCall: (call: Omit<TodaysCallRecord, 'id' | 'avatarUrl'>) => void;
  updateCallStatus: (id: string, status: 'Completed' | 'Pending' | 'Overdue') => void;
  updateCall: (id: string, call: Partial<Omit<TodaysCallRecord, 'id' | 'avatarUrl'>>) => void;
}

const initialCalls: TodaysCallRecord[] = [
  {
    id: 'tc-1',
    leadName: 'John Smith',
    company: 'Green Valley Farms',
    phone: '+1 555-123-4567',
    nextCallDateTime: '24/05/2024 09:30 AM',
    dateStr: '24/05/2024',
    assignedTo: 'Sarah Miller',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80',
    status: 'Completed'
  },
  {
    id: 'tc-2',
    leadName: 'Sarah Johnson',
    company: 'Agri Solutions Ltd.',
    phone: '+1 555-987-6543',
    nextCallDateTime: '24/05/2024 10:30 AM',
    dateStr: '24/05/2024',
    assignedTo: 'Mike Johnson',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&q=80',
    status: 'Pending'
  },
  {
    id: 'tc-3',
    leadName: 'Robert Brown',
    company: 'Brown Agro Corp.',
    phone: '+1 555-456-7890',
    nextCallDateTime: '24/05/2024 11:30 AM',
    dateStr: '24/05/2024',
    assignedTo: 'Emily Davis',
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=80&q=80',
    status: 'Pending'
  },
  {
    id: 'tc-4',
    leadName: 'Linda Wilson',
    company: 'Wilson Farms',
    phone: '+1 555-321-9876',
    nextCallDateTime: '24/05/2024 01:00 PM',
    dateStr: '24/05/2024',
    assignedTo: 'Sarah Miller',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80',
    status: 'Pending'
  },
  {
    id: 'tc-5',
    leadName: 'David Martinez',
    company: 'Martinez Agriculture',
    phone: '+1 555-654-3210',
    nextCallDateTime: '24/05/2024 02:30 PM',
    dateStr: '24/05/2024',
    assignedTo: 'Mike Johnson',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&q=80',
    status: 'Pending'
  },
  {
    id: 'tc-6',
    leadName: 'Emily Clark',
    company: 'Clark Organics',
    phone: '+1 555-159-7530',
    nextCallDateTime: '24/05/2024 03:30 PM',
    dateStr: '24/05/2024',
    assignedTo: 'Emily Davis',
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=80&q=80',
    status: 'Pending'
  },
  {
    id: 'tc-7',
    leadName: 'Thomas Lee',
    company: 'Lee Farming Inc.',
    phone: '+1 555-753-1598',
    nextCallDateTime: '24/05/2024 04:30 PM',
    dateStr: '24/05/2024',
    assignedTo: 'Sarah Miller',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80',
    status: 'Pending'
  },
  {
    id: 'tc-8',
    leadName: 'Jessica White',
    company: 'White Harvesters',
    phone: '+1 555-852-9631',
    nextCallDateTime: '24/05/2024 05:00 PM',
    dateStr: '24/05/2024',
    assignedTo: 'Mike Johnson',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&q=80',
    status: 'Overdue'
  },
  {
    id: 'tc-9',
    leadName: 'Daniel Harris',
    company: 'Harris Farms',
    phone: '+1 555-258-7410',
    nextCallDateTime: '24/05/2024 05:30 PM',
    dateStr: '24/05/2024',
    assignedTo: 'Emily Davis',
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=80&q=80',
    status: 'Pending'
  },
  {
    id: 'tc-10',
    leadName: 'Steven Green',
    company: 'Green Field Agro',
    phone: '+1 555-369-8520',
    nextCallDateTime: '24/05/2024 06:00 PM',
    dateStr: '24/05/2024',
    assignedTo: 'Sarah Miller',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80',
    status: 'Completed'
  },
  {
    id: 'tc-11',
    leadName: 'Kevin Scott',
    company: 'Scott Agriculture',
    phone: '+1 555-753-9512',
    nextCallDateTime: '24/05/2024 06:30 PM',
    dateStr: '24/05/2024',
    assignedTo: 'Mike Johnson',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&q=80',
    status: 'Pending'
  },
  {
    id: 'tc-12',
    leadName: 'Olivia Martin',
    company: 'Martin Organic Farms',
    phone: '+1 555-852-1470',
    nextCallDateTime: '24/05/2024 07:00 PM',
    dateStr: '24/05/2024',
    assignedTo: 'Emily Davis',
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=80&q=80',
    status: 'Completed'
  }
];

export const useTodaysCallsStore = create<TodaysCallsStore>((set) => ({
  calls: [],
  selectedDate: '24/05/2024',
  searchQuery: '',
  selectedAssignee: 'All',
  selectedStatus: 'All',

  setFilters: (filters) => set((state) => ({ ...state, ...filters })),
  
  resetFilters: () => set({
    searchQuery: '',
    selectedAssignee: 'All',
    selectedStatus: 'All'
  }),

  setSelectedDate: (selectedDate) => set({ selectedDate }),

  shiftDate: (days) => set((state) => {
    // Parse current date "DD/MM/YYYY"
    const parts = state.selectedDate.split('/');
    if (parts.length !== 3) return {};
    const dateObj = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
    dateObj.setDate(dateObj.getDate() + days);
    
    const d = String(dateObj.getDate()).padStart(2, '0');
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const y = dateObj.getFullYear();
    const newDateStr = `${d}/${m}/${y}`;
    
    return { selectedDate: newDateStr };
  }),

  addCall: (call) => set((state) => {
    const nextId = `tc-${state.calls.length + 1}`;
    
    // Auto resolve avatar for assignee
    let avatarUrl = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=80&q=80';
    if (call.assignedTo === 'Sarah Miller') {
      avatarUrl = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80';
    } else if (call.assignedTo === 'Mike Johnson') {
      avatarUrl = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&q=80';
    } else if (call.assignedTo === 'Emily Davis') {
      avatarUrl = 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=80&q=80';
    }

    const newRecord: TodaysCallRecord = {
      ...call,
      id: nextId,
      avatarUrl
    };

    return {
      calls: [newRecord, ...state.calls]
    };
  }),

  updateCallStatus: (id, status) => set((state) => ({
    calls: state.calls.map((call) => call.id === id ? { ...call, status } : call)
  })),

  updateCall: (id, updatedFields) => set((state) => {
    let extraFields = {};
    if (updatedFields.assignedTo) {
      let avatarUrl = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=80&q=80';
      if (updatedFields.assignedTo === 'Sarah Miller') {
        avatarUrl = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80';
      } else if (updatedFields.assignedTo === 'Mike Johnson') {
        avatarUrl = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&q=80';
      } else if (updatedFields.assignedTo === 'Emily Davis') {
        avatarUrl = 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=80&q=80';
      }
      extraFields = { avatarUrl };
    }

    return {
      calls: state.calls.map((c) =>
        c.id === id ? { ...c, ...updatedFields, ...extraFields } : c
      )
    };
  })
}));
