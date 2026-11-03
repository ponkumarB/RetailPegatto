export interface ProjectMilestone {
  id: string;
  name: string;
  dueDate: string;
  status: 'Completed' | 'In Progress' | 'Pending';
}

export interface ProjectActivity {
  id: string;
  type: string;
  details: string;
  date: string;
  user: string;
}

export interface ProjectTeamMember {
  id: string;
  name: string;
  role: string;
  initials: string;
  color: string;
}

export interface ClientInfo {
  name: string;
  email: string;
  phone: string;
}

export interface PredictionFactors {
  taskProgress: number;
  scheduleVariance: number;
  resourceUtilization: number;
  overdueTasks: number;
  scopeChanges: number;
  teamVelocity: number;
}

export interface ProjectAllocationTask {
  id: string;
  name: string;
  milestone: string;
  priority: 'High' | 'Medium' | 'Low';
  estimatedHours: string;
  assignee: string;
  startDate: string;
  dueDate: string;
  status: 'Completed' | 'In Progress' | 'Pending' | 'Overdue';
}

export interface Project {
  id: string; // e.g. PRJ-001
  name: string;
  code: string;
  clientName: string;
  projectManager: string;
  projectManagerInitials: string;
  projectManagerColor: string;
  status: 'In Progress' | 'Completed' | 'On Hold' | 'Cancelled' | 'Overdue';
  progress: number;
  deadline: string;
  startDate: string;
  priority: 'High' | 'Medium' | 'Low';
  health: 'On Track' | 'At Risk' | 'Behind';
  duration: string;
  description: string;
  
  // Overview metrics
  tasksCompleted: number;
  tasksTotal: number;
  milestonesCompleted: number;
  milestonesTotal: number;
  timeLogged: string;
  budget: string;
  spent: string;
  
  // Lists
  milestones: ProjectMilestone[];
  activities: ProjectActivity[];
  team: ProjectTeamMember[];
  client: ClientInfo;
  
  // AI Predictions
  predictedCompletionDate?: string;
  predictedDelay?: string;
  predictedOnTimeProbability?: number;
  predictionTrend?: 'On Track' | 'At Risk' | 'Behind';
  predictionFactors?: PredictionFactors;
  aiInsights?: string[];
  
  // Allocations
  tasks: ProjectAllocationTask[];
  rawStartDate?: string;
  rawDeadline?: string;
}
