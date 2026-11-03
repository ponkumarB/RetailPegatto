import { create } from 'zustand';

export interface MeetingAttendee {
  name: string;
  avatar: string;
  email: string;
  role?: string;
}

export interface ScrumMeeting {
  id: string;
  title: string;
  type: 'Daily Scrum' | 'Sprint Planning' | 'Sprint Review' | 'Retrospective';
  project: string;
  sprint: string;
  date: string; // YYYY-MM-DD
  startTime: string; // e.g. 10:00 AM
  endTime: string; // e.g. 10:30 AM
  duration: number; // minutes
  timeZone: string;
  repeat: string;
  attendees: MeetingAttendee[];
  additionalInvitees?: string;
  options: {
    addToCalendar: boolean;
    enableReminder: boolean;
    sendEmailNotifications: boolean;
    recordMeeting: boolean;
  };
  status: 'Upcoming' | 'In Progress' | 'Completed' | 'Cancelled';
  agenda: string[];
  facilitator: string;
}

interface ScrumMeetingsState {
  meetings: ScrumMeeting[];
  addMeeting: (meeting: ScrumMeeting) => void;
  deleteMeeting: (id: string) => void;
  updateMeetingStatus: (id: string, status: ScrumMeeting['status']) => void;
  updateMeeting: (id: string, updatedMeeting: Partial<ScrumMeeting>) => void;

}

export const defaultAgendas = {
  'Daily Scrum': [
    'What did you do yesterday?',
    'What will you do today?',
    'Are there any blockers?',
    'Any other updates?'
  ],
  'Sprint Planning': [
    'Discuss the Sprint Goal & capacity.',
    'Pull stories from Product Backlog to Sprint Backlog.',
    'Deconstruct stories into tasks and estimate.',
    'Define acceptance criteria and confirm commitment.'
  ],
  'Sprint Review': [
    'Review Sprint Goal achievements.',
    'Live demo of completed backlog features.',
    'Capture feedback from stakeholders and users.',
    'Discuss next steps and adjust backlog priorities.'
  ],
  'Retrospective': [
    'What went well in the sprint?',
    'What didn\'t go well / pain points?',
    'Key learnings and improvements.',
    'Define action items for the next sprint.'
  ]
};

export const defaultAttendees: MeetingAttendee[] = [
  { name: 'Aarav Rao', avatar: 'AR', email: 'aarav.rao@crmfarm.it', role: 'Facilitator' },
  { name: 'Sneha Sharma', avatar: 'SS', email: 'sneha.sharma@crmfarm.it' },
  { name: 'Rohit Kumar', avatar: 'RK', email: 'rohit.kumar@crmfarm.it' },
  { name: 'Deepa Patel', avatar: 'DP', email: 'deepa.patel@crmfarm.it' },
  { name: 'Manish Raj', avatar: 'MR', email: 'manish.raj@crmfarm.it' }
];

const initialMeetings: ScrumMeeting[] = [
  {
    id: 'MTG-001',
    title: 'Daily Scrum - 15 May 2024',
    type: 'Daily Scrum',
    project: 'Website Redesign Project',
    sprint: 'Sprint 3',
    date: '2024-05-15',
    startTime: '10:00 AM',
    endTime: '10:30 AM',
    duration: 30,
    timeZone: '(GMT+05:30) Asia/Kolkata',
    repeat: 'Weekdays (Mon - Fri)',
    attendees: [defaultAttendees[0], defaultAttendees[1], defaultAttendees[2], defaultAttendees[3]],
    options: { addToCalendar: true, enableReminder: true, sendEmailNotifications: true, recordMeeting: false },
    status: 'Completed',
    agenda: defaultAgendas['Daily Scrum'],
    facilitator: 'Aarav Rao'
  },
  {
    id: 'MTG-002',
    title: 'Daily Scrum - 14 May 2024',
    type: 'Daily Scrum',
    project: 'Website Redesign Project',
    sprint: 'Sprint 3',
    date: '2024-05-14',
    startTime: '10:00 AM',
    endTime: '10:30 AM',
    duration: 30,
    timeZone: '(GMT+05:30) Asia/Kolkata',
    repeat: 'Weekdays (Mon - Fri)',
    attendees: [defaultAttendees[0], defaultAttendees[1], defaultAttendees[2], defaultAttendees[3]],
    options: { addToCalendar: true, enableReminder: true, sendEmailNotifications: true, recordMeeting: false },
    status: 'Completed',
    agenda: defaultAgendas['Daily Scrum'],
    facilitator: 'Rohit Kumar'
  },
  {
    id: 'MTG-003',
    title: 'Sprint Planning - Sprint 3',
    type: 'Sprint Planning',
    project: 'Website Redesign Project',
    sprint: 'Sprint 3',
    date: '2024-05-06',
    startTime: '11:00 AM',
    endTime: '12:30 PM',
    duration: 90,
    timeZone: '(GMT+05:30) Asia/Kolkata',
    repeat: 'Custom',
    attendees: [defaultAttendees[0], defaultAttendees[1], defaultAttendees[2], defaultAttendees[3], defaultAttendees[4]],
    options: { addToCalendar: true, enableReminder: true, sendEmailNotifications: true, recordMeeting: true },
    status: 'Completed',
    agenda: defaultAgendas['Sprint Planning'],
    facilitator: 'Rohit Kumar'
  },
  {
    id: 'MTG-004',
    title: 'Daily Scrum - 22 May 2024',
    type: 'Daily Scrum',
    project: 'Mobile App Development',
    sprint: 'Sprint 5',
    date: '2024-05-22',
    startTime: '10:00 AM',
    endTime: '10:30 AM',
    duration: 30,
    timeZone: '(GMT+05:30) Asia/Kolkata',
    repeat: 'Weekdays (Mon - Fri)',
    attendees: [defaultAttendees[0], defaultAttendees[1], defaultAttendees[2], defaultAttendees[3]],
    options: { addToCalendar: true, enableReminder: true, sendEmailNotifications: true, recordMeeting: false },
    status: 'In Progress',
    agenda: defaultAgendas['Daily Scrum'],
    facilitator: 'Sneha Sharma'
  },
  {
    id: 'MTG-005',
    title: 'Daily Scrum - 23 May 2024',
    type: 'Daily Scrum',
    project: 'Mobile App Development',
    sprint: 'Sprint 5',
    date: '2024-05-23',
    startTime: '10:00 AM',
    endTime: '10:30 AM',
    duration: 30,
    timeZone: '(GMT+05:30) Asia/Kolkata',
    repeat: 'Weekdays (Mon - Fri)',
    attendees: [defaultAttendees[0], defaultAttendees[1], defaultAttendees[2], defaultAttendees[3]],
    options: { addToCalendar: true, enableReminder: true, sendEmailNotifications: true, recordMeeting: false },
    status: 'Upcoming',
    agenda: defaultAgendas['Daily Scrum'],
    facilitator: 'Deepa Patel'
  },
  {
    id: 'MTG-006',
    title: 'Sprint Review - Sprint 2',
    type: 'Sprint Review',
    project: 'CRM Enhancement',
    sprint: 'Sprint 2',
    date: '2024-05-24',
    startTime: '04:00 PM',
    endTime: '05:00 PM',
    duration: 60,
    timeZone: '(GMT+05:30) Asia/Kolkata',
    repeat: 'None',
    attendees: [defaultAttendees[0], defaultAttendees[1], defaultAttendees[2], defaultAttendees[4]],
    options: { addToCalendar: true, enableReminder: true, sendEmailNotifications: true, recordMeeting: true },
    status: 'Upcoming',
    agenda: defaultAgendas['Sprint Review'],
    facilitator: 'Aarav Rao'
  },
  {
    id: 'MTG-007',
    title: 'Retrospective - Sprint 2',
    type: 'Retrospective',
    project: 'CRM Enhancement',
    sprint: 'Sprint 2',
    date: '2024-05-24',
    startTime: '05:00 PM',
    endTime: '05:45 PM',
    duration: 45,
    timeZone: '(GMT+05:30) Asia/Kolkata',
    repeat: 'None',
    attendees: [defaultAttendees[0], defaultAttendees[1], defaultAttendees[2], defaultAttendees[4]],
    options: { addToCalendar: true, enableReminder: true, sendEmailNotifications: true, recordMeeting: false },
    status: 'Upcoming',
    agenda: defaultAgendas['Retrospective'],
    facilitator: 'Aarav Rao'
  },
  {
    id: 'MTG-008',
    title: 'Daily Scrum - 21 May 2024',
    type: 'Daily Scrum',
    project: 'API Integration Project',
    sprint: 'Sprint 1',
    date: '2024-05-21',
    startTime: '10:00 AM',
    endTime: '10:30 AM',
    duration: 30,
    timeZone: '(GMT+05:30) Asia/Kolkata',
    repeat: 'Weekdays (Mon - Fri)',
    attendees: [defaultAttendees[0], defaultAttendees[2], defaultAttendees[4]],
    options: { addToCalendar: true, enableReminder: true, sendEmailNotifications: true, recordMeeting: false },
    status: 'Completed',
    agenda: defaultAgendas['Daily Scrum'],
    facilitator: 'Manish Raj'
  },
  {
    id: 'MTG-009',
    title: 'Sprint Planning - Sprint 4',
    type: 'Sprint Planning',
    project: 'Mobile App Development',
    sprint: 'Sprint 4',
    date: '2024-05-20',
    startTime: '11:00 AM',
    endTime: '12:30 PM',
    duration: 90,
    timeZone: '(GMT+05:30) Asia/Kolkata',
    repeat: 'Custom',
    attendees: [defaultAttendees[0], defaultAttendees[1], defaultAttendees[3], defaultAttendees[4]],
    options: { addToCalendar: true, enableReminder: true, sendEmailNotifications: true, recordMeeting: true },
    status: 'Completed',
    agenda: defaultAgendas['Sprint Planning'],
    facilitator: 'Sneha Sharma'
  },
  {
    id: 'MTG-010',
    title: 'Daily Scrum - 20 May 2024',
    type: 'Daily Scrum',
    project: 'Website Redesign Project',
    sprint: 'Sprint 3',
    date: '2024-05-20',
    startTime: '10:00 AM',
    endTime: '10:30 AM',
    duration: 30,
    timeZone: '(GMT+05:30) Asia/Kolkata',
    repeat: 'Weekdays (Mon - Fri)',
    attendees: [defaultAttendees[0], defaultAttendees[1], defaultAttendees[2], defaultAttendees[3]],
    options: { addToCalendar: true, enableReminder: true, sendEmailNotifications: true, recordMeeting: false },
    status: 'Cancelled',
    agenda: defaultAgendas['Daily Scrum'],
    facilitator: 'Rohit Kumar'
  }
];

export const useScrumMeetingsStore = create<ScrumMeetingsState>((set) => ({
  meetings: initialMeetings,
  addMeeting: (meeting) => set((state) => ({ meetings: [meeting, ...state.meetings] })),
  deleteMeeting: (id) => set((state) => ({ meetings: state.meetings.filter(m => m.id !== id) })),
  updateMeetingStatus: (id, status) => set((state) => ({
    meetings: state.meetings.map(m => m.id === id ? { ...m, status } : m)
  })),
  updateMeeting: (id, updatedMeeting) => set((state) => ({
    meetings: state.meetings.map(m => m.id === id ? { ...m, ...updatedMeeting } : m)
  })),

}));
