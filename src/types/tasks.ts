export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  assignedTo?: string;
  dueDate?: string;
}

export interface TaskComment {
  id: string;
  user: string;
  avatarUrl?: string;
  content: string;
  createdAt: string;
}

export interface TaskActivity {
  id: string;
  type: string;
  details: string;
  date: string;
  user: string;
}

export interface Task {
  id: string; // e.g. TSK-2025-00126
  title: string;
  type: 'Call' | 'Email' | 'Meeting' | 'Task';
  category: string;
  relatedTo: string;
  relatedToType: 'Company' | 'Lead' | 'Contact' | 'Deal' | 'Project';
  assignedTo: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Not Started' | 'In Progress' | 'Pending' | 'Completed' | 'Overdue';
  tags: string[];
  
  // Schedule
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  dueDate: string; // YYYY-MM-DD
  dueTime: string; // HH:MM
  repeat: string; // 'Does not repeat' | 'Daily' | 'Weekly' | 'Monthly' | 'Yearly'

  // Reminders
  reminderEnabled: boolean;
  reminderDate?: string;
  reminderTime?: string;
  reminderRepeat?: string;

  description: string;
  subtasks: Subtask[];
  comments: TaskComment[];
  activities: TaskActivity[];

  relatedItems?: {
    company?: string;
    deal?: string;
    contact?: string;
    project?: string;
  };
  
  estimatedHours?: string;
  overdueByDays?: number;
  project?: string;
  assignedPhoto?: string;
  
  createdAt: string;
  updatedAt: string;
}
