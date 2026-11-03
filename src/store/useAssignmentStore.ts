import { create } from 'zustand';
import { AssignmentCall, AssigneeUser } from '@/types/assignment';

interface AssignmentStore {
  calls: AssignmentCall[];
  assignees: AssigneeUser[];
  selectedCallList: string;
  selectedStatus: string;
  searchQuery: string;

  setFilters: (filters: {
    selectedCallList?: string;
    selectedStatus?: string;
    searchQuery?: string;
  }) => void;
  resetFilters: () => void;
  assignCallToUser: (callId: string, userName: string) => void;
  unassignCall: (callId: string) => void;
  autoAssignCalls: () => void;
  setCalls: (calls: AssignmentCall[]) => void;
}

const initialAssignees: AssigneeUser[] = [
  {
    id: 'user-1',
    name: 'Sarah Miller',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80'
  },
  {
    id: 'user-2',
    name: 'Mike Johnson',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&q=80'
  },
  {
    id: 'user-3',
    name: 'Emily Davis',
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=80&q=80'
  },
  {
    id: 'user-4',
    name: 'David Wilson',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=80&q=80'
  }
];

const initialCalls: AssignmentCall[] = [
  {
    id: '1',
    leadName: 'John Smith',
    company: 'Green Valley Farms',
    phone: '+1 555-123-4567',
    nextCallDateTime: '25/05/2024 10:30 AM',
    status: 'Unassigned',
    isDueToday: true
  },
  {
    id: '2',
    leadName: 'Robert Brown',
    company: 'Brown Agro Corp.',
    phone: '+1 555-456-7890',
    nextCallDateTime: '25/05/2024 11:30 AM',
    status: 'Unassigned',
    isDueToday: true
  },
  {
    id: '3',
    leadName: 'Linda Wilson',
    company: 'Wilson Farms',
    phone: '+1 555-321-9876',
    nextCallDateTime: '25/05/2024 01:00 PM',
    status: 'Unassigned',
    isOverdue: true
  },
  {
    id: '4',
    leadName: 'David Martinez',
    company: 'Martinez Agriculture',
    phone: '+1 555-654-3210',
    nextCallDateTime: '25/05/2024 02:30 PM',
    status: 'Unassigned'
  },
  {
    id: '5',
    leadName: 'Emily Clark',
    company: 'Clark Organics',
    phone: '+1 555-159-7530',
    nextCallDateTime: '25/05/2024 03:30 PM',
    status: 'Unassigned'
  },
  {
    id: '6',
    leadName: 'Sarah Johnson',
    company: 'Agri Solutions Ltd.',
    phone: '+1 555-987-6543',
    nextCallDateTime: '25/05/2024 10:30 AM',
    status: 'Assigned',
    assignedTo: 'Mike Johnson',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&q=80',
    isDueToday: true
  },
  {
    id: '7',
    leadName: 'Thomas Lee',
    company: 'Lee Farming Inc.',
    phone: '+1 555-753-1598',
    nextCallDateTime: '26/05/2024 09:30 AM',
    status: 'Assigned',
    assignedTo: 'Sarah Miller',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80',
    isDueToday: true
  },
  {
    id: '8',
    leadName: 'Jessica White',
    company: 'White Harvesters',
    phone: '+1 555-852-9631',
    nextCallDateTime: '26/05/2024 11:00 AM',
    status: 'Assigned',
    assignedTo: 'Emily Davis',
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=80&q=80',
    isOverdue: true
  },
  {
    id: '9',
    leadName: 'Daniel Harris',
    company: 'Harris Farms',
    phone: '+1 555-258-7410',
    nextCallDateTime: '26/05/2024 02:00 PM',
    status: 'Assigned',
    assignedTo: 'Mike Johnson',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&q=80'
  },
  {
    id: '10',
    leadName: 'Steven Green',
    company: 'Green Field Agro',
    phone: '+1 555-369-8520',
    nextCallDateTime: '26/05/2024 03:30 PM',
    status: 'Assigned',
    assignedTo: 'Sarah Miller',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80'
  },
  {
    id: '11',
    leadName: 'James Wilson',
    company: 'Wilson Holdings',
    phone: '+1 555-789-0123',
    nextCallDateTime: '27/05/2024 10:00 AM',
    status: 'Unassigned',
    isDueToday: true
  },
  {
    id: '12',
    leadName: 'Patricia Taylor',
    company: 'Taylor Textiles',
    phone: '+1 555-890-1234',
    nextCallDateTime: '27/05/2024 11:30 AM',
    status: 'Unassigned'
  },
  {
    id: '13',
    leadName: 'Michael Davies',
    company: 'Davies & Co',
    phone: '+1 555-901-2345',
    nextCallDateTime: '27/05/2024 01:30 PM',
    status: 'Assigned',
    assignedTo: 'Sarah Miller',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80'
  },
  {
    id: '14',
    leadName: 'Elizabeth Evans',
    company: 'Evans Logistics',
    phone: '+1 555-012-3456',
    nextCallDateTime: '27/05/2024 03:00 PM',
    status: 'Unassigned'
  },
  {
    id: '15',
    leadName: 'William Thomas',
    company: 'Thomas Group',
    phone: '+1 555-123-4568',
    nextCallDateTime: '28/05/2024 10:30 AM',
    status: 'Unassigned'
  }
];

export const useAssignmentStore = create<AssignmentStore>((set) => ({
  calls: [],
  assignees: initialAssignees,
  selectedCallList: 'May 2024 - New Leads',
  selectedStatus: 'All',
  searchQuery: '',

  setFilters: (filters) => set((state) => ({ ...state, ...filters })),
  
  resetFilters: () => set({
    selectedCallList: 'May 25, 2024 - New Leads', // or keep as May 2024 - New Leads
    selectedStatus: 'All',
    searchQuery: ''
  }),

  assignCallToUser: (callId, userName) => set((state) => {
    const user = state.assignees.find(u => u.name === userName);
    if (!user) return {};
    return {
      calls: state.calls.map((call) => 
        call.id === callId 
          ? { ...call, status: 'Assigned', assignedTo: user.name, avatarUrl: user.avatarUrl } 
          : call
      )
    };
  }),

  unassignCall: (callId) => set((state) => ({
    calls: state.calls.map((call) => 
      call.id === callId 
        ? { ...call, status: 'Unassigned', assignedTo: undefined, avatarUrl: undefined } 
        : call
    )
  })),

  autoAssignCalls: () => set((state) => {
    let userIndex = 0;
    return {
      calls: state.calls.map((call) => {
        if (call.status === 'Unassigned') {
          const user = state.assignees[userIndex];
          userIndex = (userIndex + 1) % state.assignees.length;
          return {
            ...call,
            status: 'Assigned',
            assignedTo: user.name,
            avatarUrl: user.avatarUrl
          };
        }
        return call;
      })
    };
  }),

  setCalls: (calls) => set({ calls })
}));
