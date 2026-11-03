import { create } from 'zustand';
import { CallList, CallInsight, ScheduledCall } from '@/types/call';

interface CallStore {
  callLists: CallList[];
  selectedDateRange: string;
  selectedCallListId: string;
  insights: CallInsight[];
  
  setSelectedDateRange: (range: string) => void;
  setSelectedCallListId: (id: string) => void;
  addCallList: (list: CallList) => void;
  updateCallList: (id: string, updatedList: Partial<CallList>) => void;
  deleteCallList: (id: string) => void;
}

const mockScheduledCallsList1: ScheduledCall[] = [
  {
    id: 'sc-1',
    leadName: 'John Smith',
    company: 'Green Valley Farms',
    phone: '+1 555-123-4567',
    email: 'john.smith@gvf.com',
    nextCallDateTime: '25/05/2024 10:30 AM',
    assignedTo: 'Sarah Miller',
    status: 'Scheduled'
  },
  {
    id: 'sc-2',
    leadName: 'Sarah Johnson',
    company: 'Agri Solutions Ltd.',
    phone: '+1 555-987-6543',
    email: 'sarah.j@agrisol.com',
    nextCallDateTime: '25/05/2024 11:30 AM',
    assignedTo: 'Mike Johnson',
    status: 'Scheduled'
  },
  {
    id: 'sc-3',
    leadName: 'Robert Brown',
    company: 'Brown Agro Corp.',
    phone: '+1 555-456-7890',
    email: 'robert@brownagro.com',
    nextCallDateTime: '26/05/2024 02:00 PM',
    assignedTo: 'Emily Davis',
    status: 'Scheduled'
  },
  {
    id: 'sc-4',
    leadName: 'Linda Wilson',
    company: 'Wilson Farms',
    phone: '+1 555-321-9876',
    email: 'linda.wilson@farms.com',
    nextCallDateTime: '27/05/2024 10:00 AM',
    assignedTo: 'Sarah Miller',
    status: 'Pending'
  },
  {
    id: 'sc-5',
    leadName: 'David Martinez',
    company: 'Martinez Agriculture',
    phone: '+1 555-654-3210',
    email: 'david@martinezag.com',
    nextCallDateTime: '28/05/2024 03:30 PM',
    assignedTo: 'Mike Johnson',
    status: 'Pending'
  },
  {
    id: 'sc-6',
    leadName: 'Emily Clark',
    company: 'Clark Organics',
    phone: '+1 555-159-7530',
    email: 'emily.clark@organic.com',
    nextCallDateTime: '30/05/2024 09:30 AM',
    assignedTo: 'Emily Davis',
    status: 'Pending'
  }
];

const mockScheduledCallsList2: ScheduledCall[] = [
  {
    id: 'sc-11',
    leadName: 'Rahul Kumar',
    company: 'Kumar Enterprises',
    phone: '+91 99887 76655',
    email: 'rahul@kumarent.com',
    nextCallDateTime: '24/05/2024 10:30 AM',
    assignedTo: 'Sarah Miller',
    status: 'Completed'
  },
  {
    id: 'sc-12',
    leadName: 'Neha Iyer',
    company: 'Exacta Technologies',
    phone: '+91 88990 12345',
    email: 'neha.iyer@exacta.com',
    nextCallDateTime: '24/05/2024 02:30 PM',
    assignedTo: 'Mike Johnson',
    status: 'Scheduled'
  }
];

const initialCallLists: CallList[] = [
  {
    id: 'CL-001',
    callListId: 'CL-2024-0007',
    name: 'May 2024 - New Leads',
    date: '24/05/2024',
    totalCalls: 12,
    completed: 3,
    pending: 8,
    overdue: 1,
    followUps: 2,
    completionRate: 25,
    createdBy: 'Admin User',
    createdOn: '23/05/2024 10:15 AM',
    startDate: '23/05/2024',
    endDate: '30/05/2024',
    description: 'This call list contains new leads for May 2024. The purpose of this call list is to connect with new leads and introduce CRMFarm IT solutions.',
    assignedToBreakdown: [
      { name: 'Sarah Miller', count: 5, percentage: 41.67 },
      { name: 'Mike Johnson', count: 3, percentage: 25.00 },
      { name: 'Emily Davis', count: 3, percentage: 25.00 },
      { name: 'David Wilson', count: 1, percentage: 8.33 }
    ],
    scheduledCalls: mockScheduledCallsList1
  },
  {
    id: 'CL-002',
    callListId: 'CL-2024-0006',
    name: 'April 2024 - New Leads',
    date: '23/05/2024',
    totalCalls: 15,
    completed: 6,
    pending: 7,
    overdue: 1,
    followUps: 3,
    completionRate: 40,
    createdBy: 'Admin User',
    createdOn: '22/05/2024 09:15 AM',
    startDate: '22/05/2024',
    endDate: '28/05/2024',
    description: 'This call list contains new leads for April 2024. The purpose of this call list is to follow up with our new campaign prospects.',
    assignedToBreakdown: [
      { name: 'Sarah Miller', count: 4, percentage: 26.67 },
      { name: 'Mike Johnson', count: 5, percentage: 33.33 },
      { name: 'Emily Davis', count: 4, percentage: 26.67 },
      { name: 'David Wilson', count: 2, percentage: 13.33 }
    ],
    scheduledCalls: mockScheduledCallsList2
  },
  {
    id: 'CL-003',
    callListId: 'CL-2024-0005',
    name: 'March 2024 - Follow Up',
    date: '22/05/2024',
    totalCalls: 10,
    completed: 4,
    pending: 5,
    overdue: 1,
    followUps: 2,
    completionRate: 40,
    createdBy: 'Sales Lead',
    createdOn: '21/05/2024 11:30 AM',
    startDate: '21/05/2024',
    endDate: '25/05/2024',
    description: 'This call list contains follow-up tasks for March 2024. Main focus is to secure proposal meetings.',
    assignedToBreakdown: [
      { name: 'Sarah Miller', count: 3, percentage: 30.00 },
      { name: 'Mike Johnson', count: 3, percentage: 30.00 },
      { name: 'Emily Davis', count: 2, percentage: 20.00 },
      { name: 'David Wilson', count: 2, percentage: 20.00 }
    ],
    scheduledCalls: []
  },
  {
    id: 'CL-004',
    callListId: 'CL-2024-0004',
    name: 'February 2024 - Leads',
    date: '21/05/2024',
    totalCalls: 18,
    completed: 8,
    pending: 8,
    overdue: 2,
    followUps: 4,
    completionRate: 44.44,
    createdBy: 'Marketing Team',
    createdOn: '20/05/2024 02:45 PM',
    startDate: '20/05/2024',
    endDate: '29/05/2024',
    description: 'This call list contains leads collected from the February web seminar.',
    assignedToBreakdown: [
      { name: 'Sarah Miller', count: 6, percentage: 33.33 },
      { name: 'Mike Johnson', count: 5, percentage: 27.78 },
      { name: 'Emily Davis', count: 4, percentage: 22.22 },
      { name: 'David Wilson', count: 3, percentage: 16.67 }
    ],
    scheduledCalls: []
  },
  {
    id: 'CL-005',
    callListId: 'CL-2024-0003',
    name: 'January 2024 - Leads',
    date: '20/05/2024',
    totalCalls: 14,
    completed: 5,
    pending: 7,
    overdue: 2,
    followUps: 3,
    completionRate: 35.71,
    createdBy: 'Sales Team',
    createdOn: '19/05/2024 04:00 PM',
    startDate: '19/05/2024',
    endDate: '26/05/2024',
    description: 'First call list of the year, focusing on new enterprise registrations.',
    assignedToBreakdown: [
      { name: 'Sarah Miller', count: 4, percentage: 28.57 },
      { name: 'Mike Johnson', count: 4, percentage: 28.57 },
      { name: 'Emily Davis', count: 3, percentage: 21.43 },
      { name: 'David Wilson', count: 3, percentage: 21.43 }
    ],
    scheduledCalls: []
  },
  {
    id: 'CL-006',
    callListId: 'CL-2024-0002',
    name: 'December 2023 - Leads',
    date: '19/05/2024',
    totalCalls: 20,
    completed: 10,
    pending: 8,
    overdue: 2,
    followUps: 5,
    completionRate: 50.00,
    createdBy: 'Admin User',
    createdOn: '18/05/2024 10:00 AM',
    startDate: '18/05/2024',
    endDate: '25/05/2024',
    description: 'Year-end push to convert warm leads in our sales pipelines.',
    assignedToBreakdown: [
      { name: 'Sarah Miller', count: 7, percentage: 35.00 },
      { name: 'Mike Johnson', count: 5, percentage: 25.00 },
      { name: 'Emily Davis', count: 5, percentage: 25.00 },
      { name: 'David Wilson', count: 3, percentage: 15.00 }
    ],
    scheduledCalls: []
  },
  {
    id: 'CL-007',
    callListId: 'CL-2024-0002',
    name: 'November 2023 - Leads',
    date: '18/05/2024',
    totalCalls: 16,
    completed: 7,
    pending: 7,
    overdue: 2,
    followUps: 4,
    completionRate: 43.75,
    createdBy: 'Admin User',
    createdOn: '17/05/2024 10:00 AM',
    startDate: '17/05/2024',
    endDate: '24/05/2024',
    description: 'Call list for November 2023 inbound registrations.',
    assignedToBreakdown: [
      { name: 'Sarah Miller', count: 5, percentage: 31.25 },
      { name: 'Mike Johnson', count: 4, percentage: 25.05 },
      { name: 'Emily Davis', count: 4, percentage: 25.05 },
      { name: 'David Wilson', count: 3, percentage: 18.75 }
    ],
    scheduledCalls: []
  },
  {
    id: 'CL-008',
    callListId: 'CL-2024-0001',
    name: 'October 2023 - Leads',
    date: '17/05/2024',
    totalCalls: 22,
    completed: 9,
    pending: 10,
    overdue: 3,
    followUps: 5,
    completionRate: 40.91,
    createdBy: 'Admin User',
    createdOn: '16/05/2024 10:00 AM',
    startDate: '16/05/2024',
    endDate: '23/05/2024',
    description: 'Call list for October 2023 inbound registrations.',
    assignedToBreakdown: [
      { name: 'Sarah Miller', count: 8, percentage: 36.36 },
      { name: 'Mike Johnson', count: 6, percentage: 27.27 },
      { name: 'Emily Davis', count: 5, percentage: 22.73 },
      { name: 'David Wilson', count: 3, percentage: 13.64 }
    ],
    scheduledCalls: []
  }
];

const initialInsights: CallInsight[] = [
  {
    id: 'in-1',
    type: 'success',
    title: 'Your call completion rate is 25%',
    description: '↑ 5% higher than yesterday'
  },
  {
    id: 'in-2',
    type: 'warning',
    title: '8 calls are pending',
    description: 'Make sure to follow up on time'
  },
  {
    id: 'in-3',
    type: 'info',
    title: '1 call is overdue',
    description: 'Take immediate action'
  }
];

export const useCallStore = create<CallStore>((set) => ({
  callLists: initialCallLists,
  selectedDateRange: '24/05/2024 - 24/05/2024',
  selectedCallListId: '',
  insights: initialInsights,
  
  setSelectedDateRange: (selectedDateRange) => {
    set((state) => {
      const dateVal = selectedDateRange.split(' - ')[0];
      const matchingList = state.callLists.find(cl => cl.date === dateVal);
      return {
        selectedDateRange,
        selectedCallListId: matchingList ? matchingList.id : state.selectedCallListId
      };
    });
  },
  
  setSelectedCallListId: (selectedCallListId) => {
    set((state) => {
      const selectedList = state.callLists.find(cl => cl.id === selectedCallListId);
      if (selectedList) {
        return {
          selectedCallListId,
          selectedDateRange: `${selectedList.date} - ${selectedList.date}`
        };
      }
      return { selectedCallListId };
    });
  },
  
  addCallList: (list) => set((state) => ({ callLists: [list, ...state.callLists] })),
  
  updateCallList: (id, updatedList) => set((state) => ({
    callLists: state.callLists.map((cl) => cl.id === id ? { ...cl, ...updatedList } : cl)
  })),
  
  deleteCallList: (id) => set((state) => ({
    callLists: state.callLists.filter((cl) => cl.id !== id)
  }))
}));
