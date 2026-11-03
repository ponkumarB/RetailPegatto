import { create } from 'zustand';

export interface Defect {
  id: number | string;
  dbId?: number | string;
  title: string;
  project: string;
  module: string;
  relatedTo: string;
  testCase: string;
  testExecution: string;
  testExecutionStatus: 'Passed' | 'Failed' | 'Blocked' | 'N/A' | string;
  bugType: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical' | string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical' | string;
  reportedBy: string;
  reportedOn: string;
  description: string;
  stepsToReproduce: string;
  actualResult: string;
  expectedResult: string;
  environment: 'QA' | 'Staging' | 'Production' | 'Development' | string;
  browser: string;
  os: string;
  appVersion: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed' | string;
  assignee: string;
  assignedTo?: number | null;
  assignedBy?: string;
  assignedById?: number | null;
  reviewedBy?: string;
  reviewedById?: number | null;
  dueDate: string;
  labels: string[];
  watchers: (string | number | any)[];
  executedBy?: string;
  executionDate?: string;
  isDraft?: boolean;
  deliverable?: string;
  remarks?: string;
  ticketType?: string;
  sprint?: string;
  branch?: string;
  completionDate?: string;
  closedDate?: string;
  closedHours?: number | string;
  startDate?: string;
  estimationHours?: number | string;
  completionHours?: number | string;
  defectCategory?: string;
  sprintBacklog?: string;
  attachments?: any[];
  childDefects?: any[];
  developerActionFlag?: boolean;
  assignedHistory?: any;
  createdBy?: string;
  createdById?: number | null;
  updatedBy?: string;
  updatedById?: number | null;
  updatedDate?: string;
  isDeleted?: boolean;
}

interface DefectState {
  defects: Defect[];
  addDefect: (defect: Defect) => void;
  deleteDefect: (id: string) => void;
  updateDefect: (id: string, updatedDefect: Partial<Defect>) => void;
}

const initialDefects: Defect[] = [
  {
    id: 'BUG-00042',
    title: 'Error displayed when saving irrigation schedule with valid inputs',
    project: 'Greenhouse Installation',
    module: 'Irrigation System',
    relatedTo: 'Test Case',
    testCase: 'TC-IRR-012 : Create Irrigation Schedule',
    testExecution: 'TE-IRR-012-05242024',
    testExecutionStatus: 'Failed',
    bugType: 'Functional',
    severity: 'High',
    priority: 'High',
    reportedBy: 'John Smith',
    reportedOn: '24/05/2024 02:35 PM',
    description: 'While creating a new irrigation schedule with valid data, system displays an error message "Unable to save schedule" and the schedule is not created. This issue occurs every time for valid input.',
    stepsToReproduce: '1. Login to CRMFarm IT.\n2. Go to Irrigation > Schedule.\n3. Click on "New Schedule".\n4. Enter valid Start Date, Time, Duration and select Zone.\n5. Click on Save.\n6. Observe the error message.',
    actualResult: 'System displays error message "Unable to save schedule". Schedule is not created.',
    expectedResult: 'System should save the schedule successfully and display success message.',
    environment: 'QA',
    browser: 'Google Chrome 124',
    os: 'Windows 11',
    appVersion: 'v2.3.1 (Build 20240520)',
    status: 'Open',
    assignee: 'John Smith',
    dueDate: '2024-05-31',
    labels: ['Irrigation', 'Schedule', 'Critical'],
    watchers: ['Sarah Johnson', 'Mike Johnson']
  },
  {
    id: 'BUG-00041',
    title: 'Unable to upload document in Project Files',
    project: 'Farm Expansion Project',
    module: 'Documents',
    relatedTo: 'None',
    testCase: '',
    testExecution: '',
    testExecutionStatus: 'N/A',
    bugType: 'Functional',
    severity: 'Medium',
    priority: 'Medium',
    reportedBy: 'Sarah Johnson',
    reportedOn: '23/05/2024 11:20 AM',
    description: 'Uploading PDF files larger than 5MB fails without showing a validation error. The upload spinner runs indefinitely.',
    stepsToReproduce: '1. Go to Project Files.\n2. Select a PDF file of size 6MB.\n3. Click upload.\n4. Observe the indefinite spinner.',
    actualResult: 'Upload spinner hangs, file is not uploaded, and no error message is displayed.',
    expectedResult: "System should show a validation error 'File size exceeds 5MB limit'.",
    environment: 'Staging',
    browser: 'Firefox 125',
    os: 'macOS Sonoma',
    appVersion: 'v2.3.0',
    status: 'In Progress',
    assignee: 'Sarah Johnson',
    dueDate: '2024-05-28',
    labels: ['Upload', 'Documents'],
    watchers: ['John Smith']
  },
  {
    id: 'BUG-00040',
    title: 'System throws error when adding new customer',
    project: 'CRM Core',
    module: 'Customers',
    relatedTo: 'Requirements',
    testCase: '',
    testExecution: '',
    testExecutionStatus: 'N/A',
    bugType: 'Functional',
    severity: 'High',
    priority: 'High',
    reportedBy: 'Mike Johnson',
    reportedOn: '22/05/2024 04:10 PM',
    description: "Adding a customer with a name containing special characters (like O'Connor) throws an unhandled database exception.",
    stepsToReproduce: "1. Navigate to Customer Directory.\n2. Click 'Add Customer'.\n3. Type name 'O\\'Connor' and save.\n4. Observe 500 error screen.",
    actualResult: 'Generic 500 Server Error displayed on UI.',
    expectedResult: 'Customer is saved successfully with escaped characters.',
    environment: 'Production',
    browser: 'Safari 17',
    os: 'iOS 17',
    appVersion: 'v2.3.1',
    status: 'Open',
    assignee: 'Mike Johnson',
    dueDate: '2024-05-25',
    labels: ['Database', 'SQL', 'Customers'],
    watchers: ['Sarah Johnson']
  },
  {
    id: 'BUG-00039',
    title: 'Incorrect calculation in fertilizer requirement report',
    project: 'Crop Management System',
    module: 'Reports',
    relatedTo: 'Test Case',
    testCase: 'TC-CMS-045 : Fertilizer Math Verification',
    testExecution: 'TE-CMS-045-05212024',
    testExecutionStatus: 'Failed',
    bugType: 'Functional',
    severity: 'Medium',
    priority: 'Medium',
    reportedBy: 'Emily Davis',
    reportedOn: '21/05/2024 09:45 AM',
    description: 'The math formula used to compute nitrogen requirement yields values that are exactly 10% lower than standard agricultural formula guidelines.',
    stepsToReproduce: '1. Go to Fertilizer Reports.\n2. Enter plot area: 100 acres, target yield: 150 bushels.\n3. Click Calculate.\n4. Verify results.',
    actualResult: 'Calculated nitrogen requirements show 120lbs/acre instead of correct 133lbs/acre.',
    expectedResult: 'Calculated nitrogen requirements should show 133lbs/acre.',
    environment: 'QA',
    browser: 'Google Chrome 124',
    os: 'Windows 11',
    appVersion: 'v2.3.1',
    status: 'In Progress',
    assignee: 'Emily Davis',
    dueDate: '2024-05-30',
    labels: ['Reports', 'Math'],
    watchers: ['David Wilson']
  },
  {
    id: 'BUG-00038',
    title: 'UI alignment issue on mobile screen',
    project: 'CRM Core',
    module: 'Dashboard',
    relatedTo: 'None',
    testCase: '',
    testExecution: '',
    testExecutionStatus: 'N/A',
    bugType: 'UI',
    severity: 'Low',
    priority: 'Low',
    reportedBy: 'David Wilson',
    reportedOn: '20/05/2024 03:30 PM',
    description: 'On small screen viewports (375px or less), the dashboard quick action icons overlap with the navigation side drawer button.',
    stepsToReproduce: '1. Open CRM Dashboard on iPhone 13.\n2. Open side navigation drawer.\n3. Look at quick actions overlap.',
    actualResult: 'Icons render on top of each other, making quick actions unclickable.',
    expectedResult: 'Icons should wrap or hide nicely under mobile viewport size.',
    environment: 'Development',
    browser: 'Safari Mobile',
    os: 'iOS 16',
    appVersion: 'v2.3.2-alpha',
    status: 'Open',
    assignee: 'David Wilson',
    dueDate: '2024-06-05',
    labels: ['CSS', 'Responsive', 'UI'],
    watchers: ['John Smith']
  },
  {
    id: 'BUG-00037',
    title: 'Email notifications not sending to users',
    project: 'Notification System',
    module: 'Email Service',
    relatedTo: 'Test Case',
    testCase: 'TC-NOT-002: Notification Triggers',
    testExecution: 'TE-NOT-002-05192024',
    testExecutionStatus: 'Failed',
    bugType: 'Functional',
    severity: 'High',
    priority: 'High',
    reportedBy: 'Linda Brown',
    reportedOn: '19/05/2024 10:05 AM',
    description: 'Users are not receiving SMTP confirmation emails after new signups. Logs indicate timeout connecting to mail server.',
    stepsToReproduce: '1. Register a new user profile.\n2. Check SMTP relay service status.\n3. Check recipient inbox.',
    actualResult: 'Registration succeeds but SMTP connection timeout error thrown in back-end logs. Recipient gets no email.',
    expectedResult: 'SMTP relay completes within 2 seconds, sending registration email successfully.',
    environment: 'QA',
    browser: 'Google Chrome 124',
    os: 'Linux Ubuntu',
    appVersion: 'v2.3.1',
    status: 'Resolved',
    assignee: 'Linda Brown',
    dueDate: '2024-05-22',
    labels: ['SMTP', 'Notifications'],
    watchers: ['Emily Davis']
  },
  {
    id: 'BUG-00036',
    title: 'Duplicate data allowed in soil test entries',
    project: 'Soil Management',
    module: 'Soil Tests',
    relatedTo: 'None',
    testCase: '',
    testExecution: '',
    testExecutionStatus: 'N/A',
    bugType: 'Functional',
    severity: 'Medium',
    priority: 'Medium',
    reportedBy: 'John Smith',
    reportedOn: '18/05/2024 01:15 PM',
    description: "Double-clicking the 'Submit Soil Test' button quickly posts two duplicate test entries to the database.",
    stepsToReproduce: '1. Enter soil test metrics.\n2. Double-click fast on Submit button.\n3. Check list of records.',
    actualResult: 'Two identical records appear in the list with sequential IDs.',
    expectedResult: 'Form submission button is disabled after first click, allowing only one submit.',
    environment: 'QA',
    browser: 'Microsoft Edge 123',
    os: 'Windows 11',
    appVersion: 'v2.2.9',
    status: 'Resolved',
    assignee: 'John Smith',
    dueDate: '2024-05-24',
    labels: ['UX', 'Database'],
    watchers: ['Sarah Johnson']
  },
  {
    id: 'BUG-00035',
    title: 'System logout automatically after 2 minutes',
    project: 'Authentication',
    module: 'Login',
    relatedTo: 'None',
    testCase: '',
    testExecution: '',
    testExecutionStatus: 'N/A',
    bugType: 'Functional',
    severity: 'Low',
    priority: 'Low',
    reportedBy: 'Sarah Johnson',
    reportedOn: '17/05/2024 05:40 PM',
    description: 'The session idle timeout triggers in 2 minutes instead of the configured 30 minutes, logging users out prematurely.',
    stepsToReproduce: '1. Login to CRM application.\n2. Leave app idle for exactly 2 minutes.\n3. Note redirection to Login screen.',
    actualResult: 'User is logged out with message "Session expired" after 2 minutes.',
    expectedResult: 'User session remains active for 30 minutes of idle time.',
    environment: 'Staging',
    browser: 'Google Chrome 124',
    os: 'Windows 11',
    appVersion: 'v2.3.0',
    status: 'Closed',
    assignee: 'Sarah Johnson',
    dueDate: '2024-05-20',
    labels: ['Auth', 'Session'],
    watchers: ['Mike Johnson']
  },
  {
    id: 'BUG-00034',
    title: 'Map not loading for field locations',
    project: 'Field Management',
    module: 'Map Integration',
    relatedTo: 'None',
    testCase: '',
    testExecution: '',
    testExecutionStatus: 'N/A',
    bugType: 'Functional',
    severity: 'Medium',
    priority: 'Medium',
    reportedBy: 'Mike Johnson',
    reportedOn: '16/05/2024 11:00 AM',
    description: 'Map layout shows a grey container instead of loading Mapbox layers. Browser console shows API auth restriction code 403.',
    stepsToReproduce: '1. Go to Fields view.\n2. Click on field map tab.\n3. Inspect browser console.',
    actualResult: "Grey area displays with message 'Map loading failed'. Console shows Mapbox API auth token rejected.",
    expectedResult: 'Map layers load correctly using valid client auth key.',
    environment: 'Production',
    browser: 'Google Chrome 124',
    os: 'macOS Sonoma',
    appVersion: 'v2.3.0',
    status: 'Closed',
    assignee: 'Mike Johnson',
    dueDate: '2024-05-22',
    labels: ['Maps', 'API'],
    watchers: ['Emily Davis']
  },
  {
    id: 'BUG-00033',
    title: 'Validation missing for phone number field',
    project: 'CRM Core',
    module: 'Leads',
    relatedTo: 'None',
    testCase: '',
    testExecution: '',
    testExecutionStatus: 'N/A',
    bugType: 'Functional',
    severity: 'Low',
    priority: 'Low',
    reportedBy: 'Emily Davis',
    reportedOn: '15/05/2024 09:30 AM',
    description: 'Users can enter letters and special characters into the Lead phone number field. Database saves invalid inputs directly.',
    stepsToReproduce: "1. Go to Create Lead form.\n2. In Phone field, type 'abc-def-g#$'.\n3. Click Save.\n4. Check lead details.",
    actualResult: "Save succeeds, database records 'abc-def-g#$' under phone number.",
    expectedResult: 'Form field validates and only permits numbers, plus sign, and hyphens.',
    environment: 'QA',
    browser: 'Google Chrome 124',
    os: 'Windows 11',
    appVersion: 'v2.3.1',
    status: 'Closed',
    assignee: 'Emily Davis',
    dueDate: '2024-05-18',
    labels: ['Validation', 'Leads'],
    watchers: ['David Wilson']
  }
];

export const useDefectStore = create<DefectState>((set) => ({
  defects: initialDefects,
  addDefect: (defect) => set((state) => ({ defects: [defect, ...state.defects] })),
  deleteDefect: (id) => set((state) => ({ defects: state.defects.filter((d) => d.id !== id) })),
  updateDefect: (id, updatedDefect) =>
    set((state) => ({
      defects: state.defects.map((d) => (d.id === id ? { ...d, ...updatedDefect } : d)),
    })),
}));
