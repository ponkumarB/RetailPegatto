'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Puzzle,
  User,
  Ticket,
  Calendar,
  Sliders,
  Check,
  ChevronRight,
  UserPlus,
  Building,
  Handshake,
  SquarePen,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Plus,
  Eye,
  Database,
  Bell,
  Users,
  ChevronDown,
  Info,
  Clock,
  Sparkles,
  FileText,
  Mail,
  HelpCircle,
  Type,
  Hash,
  Phone,
  ListTodo,
  CheckSquare,
  CircleDot,
  Globe,
  UploadCloud,
  PenTool,
  Star,
  EyeOff,
  Split,
  Undo,
  Redo,
  Monitor,
  Save,
  X,
  Move,
  GripVertical,
  Smartphone,
  Slack,
  CheckCircle2,
  Code,
  Link2,
  QrCode,
  Copy,
  AlertCircle,
  Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/store/useStore';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { fetchCustomFormById, createCustomForm, updateCustomForm, fetchCustomForms } from '@/service/api/Customization/api';

// Stepper wizard steps definition
interface Step {
  number: number;
  title: string;
  subtext: string;
}

const STEPS: Step[] = [
  { number: 1, title: 'Form Details', subtext: 'Set basic information' },
  { number: 2, title: 'Add Fields', subtext: 'Choose and customize fields' },
  { number: 3, title: 'Layout & Logic', subtext: 'Arrange fields and set rules' },
  { number: 4, title: 'Notifications', subtext: 'Set email & alerts' },
  { number: 5, title: 'Review & Publish', subtext: 'Review and make it live' }
];

// Define Form Field Structure
interface CanvasField {
  id: string;
  type: string;
  label: string;
  placeholder: string;
  helpText: string;
  required: boolean;
  validation?: string;
  options?: string[];
  sectionPlacement?: string;
  customSectionName?: string;
  isStandard?: boolean;
  orderIndex?: number;
}



export const STANDARD_LAYOUTS: Record<string, CanvasField[]> = {
  Leads: [
    { id: 'std-sec-lead-info', type: 'section', label: 'Lead Information', placeholder: '', helpText: '', required: false, isStandard: true, orderIndex: 5 },
    { id: 'std-lead-first', type: 'text', label: 'First Name', placeholder: 'Enter first name', helpText: '', required: true, isStandard: true, orderIndex: 10 },
    { id: 'std-lead-last', type: 'text', label: 'Last Name', placeholder: 'Enter last name', helpText: '', required: true, isStandard: true, orderIndex: 20 },
    { id: 'std-lead-email', type: 'email', label: 'Email', placeholder: 'Enter email address', helpText: '', required: true, isStandard: true, orderIndex: 30 },
    { id: 'std-lead-phone', type: 'phone', label: 'Phone', placeholder: 'Enter phone number', helpText: '', required: true, isStandard: true, orderIndex: 40 },
    { id: 'std-lead-mobile', type: 'phone', label: 'Mobile', placeholder: 'Enter mobile number', helpText: '', required: false, isStandard: true, orderIndex: 50 },
    { id: 'std-lead-company', type: 'text', label: 'Company', placeholder: 'Enter company name', helpText: '', required: false, isStandard: true, orderIndex: 60 },
    { id: 'std-lead-job', type: 'text', label: 'Job Title', placeholder: 'Enter job title', helpText: '', required: false, isStandard: true, orderIndex: 70 },
    { id: 'std-lead-website', type: 'website', label: 'Website', placeholder: 'Enter website URL', helpText: '', required: false, isStandard: true, orderIndex: 80 },
    { id: 'std-lead-industry', type: 'text', label: 'Industry', placeholder: 'e.g. Technology', helpText: '', required: false, isStandard: true, orderIndex: 90 },
    { id: 'std-lead-status', type: 'dropdown', label: 'Lead Status', placeholder: '', helpText: '', required: true, isStandard: true, options: ['New', 'Open', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiation', 'Converted', 'Disqualified', 'Nurturing'], orderIndex: 100 },
    { id: 'std-lead-source', type: 'dropdown', label: 'Lead Source', placeholder: '', helpText: '', required: true, isStandard: true, options: ['Website', 'Referral', 'LinkedIn', 'Email Campaign', 'Cold Call'], orderIndex: 110 },
    { id: 'std-lead-rating', type: 'dropdown', label: 'Rating', placeholder: '', helpText: '', required: false, isStandard: true, options: ['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars'], orderIndex: 120 },
    { id: 'std-lead-address', type: 'textarea', label: 'Address', placeholder: 'Enter address...', helpText: '', required: false, isStandard: true, orderIndex: 130 },
    { id: 'std-sec-addtl-info', type: 'section', label: 'Additional Information', placeholder: '', helpText: '', required: false, isStandard: true, orderIndex: 135 },
    { id: 'std-lead-employees', type: 'dropdown', label: 'Number of Employees', placeholder: 'Select employees', helpText: '', required: false, isStandard: true, options: ['1-10', '11-50', '51-200', '201-500', '500+'], orderIndex: 140 },
    { id: 'std-lead-revenue', type: 'dropdown', label: 'Annual Revenue', placeholder: 'Select revenue range', helpText: '', required: false, isStandard: true, options: ['<$1M', '$1M-$10M', '$10M-$50M', '$50M+'], orderIndex: 150 },
    { id: 'std-lead-location', type: 'text', label: 'Location', placeholder: 'Enter city / state / country', helpText: '', required: false, isStandard: true, orderIndex: 160 },
    { id: 'std-lead-linkedin', type: 'website', label: 'LinkedIn Profile', placeholder: 'Enter LinkedIn profile URL', helpText: '', required: false, isStandard: true, orderIndex: 170 },
    { id: 'std-lead-twitter', type: 'website', label: 'Twitter Profile', placeholder: 'Enter Twitter profile URL', helpText: '', required: false, isStandard: true, orderIndex: 180 },
    { id: 'std-lead-fax', type: 'text', label: 'Fax', placeholder: 'Enter fax number', helpText: '', required: false, isStandard: true, orderIndex: 190 },
    { id: 'std-lead-dob', type: 'date', label: 'Date of Birth', placeholder: 'mm/dd/yyyy', helpText: '', required: false, isStandard: true, orderIndex: 200 },
    { id: 'std-lead-score', type: 'number', label: 'Lead Score', placeholder: '70', helpText: '', required: false, isStandard: true, orderIndex: 210 },
    { id: 'std-lead-contact-method', type: 'dropdown', label: 'Preferred Contact Method', placeholder: '', helpText: '', required: false, isStandard: true, options: ['Email', 'Phone', 'Any'], orderIndex: 220 }
  ],
  Deals: [
    { id: 'std-sec-basic', type: 'section', label: 'Basic Information', placeholder: '', helpText: '', required: false, isStandard: true, orderIndex: 5 },
    { id: 'std-deal-name', type: 'text', label: 'Deal Name', placeholder: 'Enter deal name', helpText: '', required: true, isStandard: true, orderIndex: 10 },
    { id: 'std-deal-stage', type: 'dropdown', label: 'Pipeline Stage', placeholder: '', helpText: '', required: true, isStandard: true, options: ['Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'], orderIndex: 20 },
    { id: 'std-deal-value', type: 'number', label: 'Deal Value', placeholder: '0.00', helpText: '', required: true, isStandard: true, orderIndex: 30 },
    { id: 'std-deal-close', type: 'date', label: 'Expected Close Date', placeholder: '', helpText: '', required: true, isStandard: true, orderIndex: 40 },
    { id: 'std-deal-prob', type: 'number', label: 'Probability (%)', placeholder: '10', helpText: '', required: false, isStandard: true, orderIndex: 50 },
    { id: 'std-deal-owner', type: 'dropdown', label: 'Deal Owner', placeholder: '', helpText: '', required: true, isStandard: true, orderIndex: 60 },
    { id: 'std-sec-related', type: 'section', label: 'Related Information', placeholder: '', helpText: '', required: false, isStandard: true, orderIndex: 65 },
    { id: 'std-deal-company', type: 'text', label: 'Company', placeholder: 'Search and select company', helpText: '', required: true, isStandard: true, orderIndex: 70 },
    { id: 'std-deal-contact', type: 'text', label: 'Contact', placeholder: 'Search and select contact', helpText: '', required: false, isStandard: true, orderIndex: 80 },
    { id: 'std-deal-phone', type: 'phone', label: 'Contact Number', placeholder: 'Enter contact number', helpText: '', required: false, isStandard: true, orderIndex: 90 },
    { id: 'std-deal-source', type: 'dropdown', label: 'Source', placeholder: '', helpText: '', required: false, isStandard: true, orderIndex: 100 },
    { id: 'std-sec-desc', type: 'section', label: 'Description / Notes', placeholder: '', helpText: '', required: false, isStandard: true, orderIndex: 105 },
    { id: 'std-deal-desc', type: 'textarea', label: 'Description / Notes', placeholder: 'Write deal description or any notes...', helpText: '', required: false, isStandard: true, orderIndex: 110 }
  ],
  Companies: [
    { id: 'std-sec-comp-info', type: 'section', label: 'Company Information', placeholder: '', helpText: '', required: false, isStandard: true, orderIndex: 5 },
    { id: 'std-comp-name', type: 'text', label: 'Company Name', placeholder: 'e.g. Acme Corporation', helpText: '', required: true, isStandard: true, orderIndex: 10 },
    { id: 'std-comp-status', type: 'dropdown', label: 'Status', placeholder: '', helpText: '', required: true, isStandard: true, options: ['Active', 'Inactive'], orderIndex: 20 },
    { id: 'std-comp-industry', type: 'dropdown', label: 'Industry', placeholder: '', helpText: '', required: true, isStandard: true, options: ['IT Services', 'Software', 'Digital Agency', 'Digital Marketing', 'SEO Services', 'E-commerce', 'Logistics', 'Education', 'Healthcare'], orderIndex: 30 },
    { id: 'std-comp-type', type: 'dropdown', label: 'Company Type', placeholder: '', helpText: '', required: true, isStandard: true, options: ['Private Limited', 'Public Limited', 'Partnership', 'Sole Proprietorship', 'Non-profit'], orderIndex: 40 },
    { id: 'std-comp-website', type: 'website', label: 'Website URL', placeholder: 'e.g. www.acme.com', helpText: '', required: true, isStandard: true, orderIndex: 50 },
    { id: 'std-comp-phone', type: 'phone', label: 'Phone Number', placeholder: 'e.g. +1 555-0199', helpText: '', required: true, isStandard: true, orderIndex: 60 },
    { id: 'std-comp-email', type: 'email', label: 'Email Address', placeholder: 'e.g. contact@acme.com', helpText: '', required: true, isStandard: true, orderIndex: 70 },
    { id: 'std-comp-emp', type: 'text', label: 'Employee Size', placeholder: 'e.g. 120', helpText: '', required: true, isStandard: true, orderIndex: 80 },
    { id: 'std-comp-rev', type: 'text', label: 'Annual Revenue', placeholder: 'e.g. $ 5,000,000', helpText: '', required: true, isStandard: true, orderIndex: 90 },
    { id: 'std-comp-currency', type: 'dropdown', label: 'Currency', placeholder: '', helpText: '', required: true, isStandard: true, options: ['USD ($)', 'EUR (€)', 'GBP (£)', 'INR (₹)', 'AUD ($)', 'CAD ($)', 'SGD ($)'], orderIndex: 100 },
    { id: 'std-sec-comp-address', type: 'section', label: 'Address Information', placeholder: '', helpText: '', required: false, isStandard: true, orderIndex: 110 },
    { id: 'std-comp-country', type: 'text', label: 'Country', placeholder: '', helpText: '', required: true, isStandard: true, orderIndex: 120 },
    { id: 'std-comp-city', type: 'text', label: 'City', placeholder: '', helpText: '', required: true, isStandard: true, orderIndex: 130 },
    { id: 'std-comp-postal', type: 'text', label: 'Postal Code', placeholder: '', helpText: '', required: true, isStandard: true, orderIndex: 140 },
    { id: 'std-comp-street', type: 'text', label: 'Street Address', placeholder: '', helpText: '', required: true, isStandard: true, orderIndex: 150 },
    { id: 'std-comp-location-tag', type: 'text', label: 'Location Tag (displayed in summary)', placeholder: '', helpText: '', required: true, isStandard: true, orderIndex: 160 },
    { id: 'std-sec-comp-addtl', type: 'section', label: 'Additional Information', placeholder: '', helpText: '', required: false, isStandard: true, orderIndex: 170 },
    { id: 'std-comp-source', type: 'dropdown', label: 'Source Channel', placeholder: '', helpText: '', required: true, isStandard: true, options: ['Website', 'Referral', 'LinkedIn', 'Cold Call', 'Event', 'Other'], orderIndex: 180 },
    { id: 'std-comp-owner', type: 'dropdown', label: 'Account Owner', placeholder: '', helpText: '', required: true, isStandard: true, orderIndex: 190 },
    { id: 'std-comp-notes', type: 'textarea', label: 'Internal Notes', placeholder: 'Enter notes about this company account...', helpText: '', required: false, isStandard: true, orderIndex: 200 }
  ]
};

// Left list basic items configuration
const BASIC_FIELDS_LIBRARY = [
  { type: 'text', label: 'Text', icon: Type },
  { type: 'textarea', label: 'Text Area', icon: FileText },
  { type: 'number', label: 'Number', icon: Hash },
  { type: 'email', label: 'Email', icon: Mail },
  { type: 'phone', label: 'Phone', icon: Phone },
  { type: 'dropdown', label: 'Dropdown', icon: ChevronDown },
  { type: 'multi-select', label: 'Multi Select', icon: ListTodo },
  { type: 'date', label: 'Date', icon: Calendar },
  { type: 'datetime', label: 'Date & Time', icon: Calendar },
  { type: 'time', label: 'Time', icon: Clock },
  { type: 'checkbox', label: 'Checkbox', icon: CheckSquare },
  { type: 'radio', label: 'Radio Button', icon: CircleDot },
  { type: 'website', label: 'Website', icon: Globe }
];

// Left list advanced items configuration
const ADVANCED_FIELDS_LIBRARY = [
  { type: 'file', label: 'File Upload', icon: UploadCloud },
  { type: 'signature', label: 'Signature', icon: PenTool },
  { type: 'rating', label: 'Rating', icon: Star },
  { type: 'hidden', label: 'Hidden Field', icon: EyeOff },
  { type: 'section', label: 'Section Break', icon: Split }
];

const DYNAMIC_ICONS = [
  { name: 'UserPlus', comp: UserPlus },
  { name: 'Building', comp: Building },
  { name: 'Handshake', comp: Handshake },
  { name: 'Ticket', comp: Ticket },
  { name: 'Calendar', comp: Calendar },
  { name: 'Sliders', comp: Sliders },
  { name: 'SquarePen', comp: SquarePen },
  { name: 'Clock', comp: Clock },
  { name: 'Mail', comp: Mail },
  { name: 'HelpCircle', comp: HelpCircle }
];

export default function CreateFormPage() {
  const router = useRouter();
  const { primaryColor } = useStore();

  // States
  const [isLoading, setIsLoading] = useState(true);
  const [activeStep, setActiveStep] = useState(1);
  const [selectedTemplateName, setSelectedTemplateName] = useState('Custom Process');
  const [apiTemplates, setApiTemplates] = useState<any[]>([]);

  // Secondary sub-header active tab state
  const [builderTab, setBuilderTab] = useState<'builder' | 'settings' | 'integrations' | 'share' | 'submissions'>('builder');

  // Form Details States (Step 1)
  const [formName, setFormName] = useState('');
  const [formModule, setFormModule] = useState<'' | 'Leads' | 'Contacts' | 'Deals' | 'Companies' | 'Support' | 'Events'>('');
  const [formDescription, setFormDescription] = useState('');
  const [selectedIconName, setSelectedIconName] = useState('UserPlus');
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);

  // Active form canvas fields list (Step 2 Drag and Drop Canvas)
  const [canvasFields, setCanvasFields] = useState<CanvasField[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);

  // Drag and Drop active states
  const [isDragging, setIsDragging] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Layout & Logic States (Step 3)
  const [logicRules, setLogicRules] = useState<any[]>([
    { id: 'l-1', ifField: 'Full Name', isCondition: 'empty', thenAction: 'hide', targetField: 'Phone Number' }
  ]);
  const [logicIfField, setLogicIfField] = useState('');
  const [logicCondition, setLogicCondition] = useState('empty');
  const [logicAction, setLogicAction] = useState('hide');
  const [logicTargetField, setLogicTargetField] = useState('');

  // Notifications States (Step 4)
  const [alertRecordOwner, setAlertRecordOwner] = useState(true);
  const [alertSlackFeed, setAlertSlackFeed] = useState(false);
  const [alertSysAdmin, setAlertSysAdmin] = useState(false);
  const [alertEmails, setAlertEmails] = useState('sales.team@crmfarmit.com');

  // Undo / Redo History stack states
  const [history, setHistory] = useState<CanvasField[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Section Order States (Form Settings)
  const [sectionOrder, setSectionOrder] = useState<string[]>([]);

  // Derived sectionOrder that guarantees all active sections (standard and custom) are present
  const computedSectionOrder = useMemo(() => {
    let standardPlacements: string[] = ['Basic Information', 'Related Information', 'Description / Notes'];
    if (formModule === 'Deals') {
      standardPlacements = ['Basic Information', 'Related Information', 'Description / Notes'];
    } else if (formModule === 'Companies') {
      standardPlacements = ['Company Information', 'Address Information', 'Additional Information'];
    } else if (formModule === 'Leads') {
      standardPlacements = ['Lead Information', 'Additional Information'];
    }
    const customSections = Array.from(new Set(
      canvasFields
        .map(f => f.sectionPlacement)
        .filter((sp): sp is string => typeof sp === 'string' && !standardPlacements.includes(sp) && sp !== 'New Section')
    ));

    const savedOrder = [...sectionOrder].filter(s => standardPlacements.includes(s) || customSections.includes(s));

    const missingStandards = standardPlacements.filter(s => !savedOrder.includes(s));
    const missingCustoms = customSections.filter(s => !savedOrder.includes(s));

    return [...savedOrder, ...missingStandards, ...missingCustoms];
  }, [sectionOrder, canvasFields, formModule]);

  // Responsive device view states
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  // Live Preview Sandbox States (Step 5)
  const [sandboxValues, setSandboxValues] = useState<Record<string, string>>({});
  const [isSandboxSubmitted, setIsSandboxSubmitted] = useState(false);
  const [submittedPayload, setSubmittedPayload] = useState<any>(null);
  const [sandboxErrors, setSandboxErrors] = useState<Record<string, string>>({});

  // Integration channel configurations
  const [slackWebhook, setSlackWebhook] = useState('https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX');
  const [slackChannel, setSlackChannel] = useState('#leads-alerts');
  const [webhookUrl, setWebhookUrl] = useState('https://api.yourdomain.com/crm-webhook');
  const [isSlackConnected, setIsSlackConnected] = useState(false);
  const [isWebhookConnected, setIsWebhookConnected] = useState(false);

  // Edit form query parameter tracker
  const [editingFormId, setEditingFormId] = useState<string | null>(null);

  // Merge standard fields for visual builder
  const getUnifiedFields = (module: string, customFlds: CanvasField[]) => {
    const stdFields = STANDARD_LAYOUTS[module] || [];
    // Only keep custom fields that are not standard, then merge
    const unified = [...stdFields, ...customFlds.filter(f => !f.isStandard)];
    unified.sort((a, b) => {
      const orderA = a.orderIndex !== undefined ? a.orderIndex : 999;
      const orderB = b.orderIndex !== undefined ? b.orderIndex : 999;
      return orderA - orderB;
    });
    return unified;
  };

  // Check query parameter on client load and fetch form details from API
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('id');
      if (id) {
        setEditingFormId(id);

        async function loadFormDetails() {
          try {
            setIsLoading(true);
            const found = await fetchCustomFormById(id as string);
            if (found) {
              setFormName(found.name);
              setFormModule(found.module);
              setFormDescription(found.description);

              // Load fields directly from API
              let loadedFields = found.fields || [];
              const unifiedFields = getUnifiedFields(found.module, loadedFields);
              setCanvasFields(unifiedFields);
              setHistory([unifiedFields]);
              setHistoryIndex(0);

              if (unifiedFields.length > 0) {
                setSelectedFieldId(unifiedFields[0].id);
              }

              // Load rules
              if (found.rules) {
                setLogicRules(found.rules);
              }

              // Load notifications
              if (found.notifications) {
                setAlertRecordOwner(found.notifications.alertRecordOwner !== false);
                setAlertSlackFeed(!!found.notifications.alertSlackFeed);
                setAlertSysAdmin(!!found.notifications.alertSysAdmin);
                setAlertEmails(found.notifications.alertEmails || '');
              }

              // Load section order
              if (found.sectionOrder && found.sectionOrder.length > 0) {
                setSectionOrder(found.sectionOrder);
              }

              // Jump directly to builder workspace step 2
              setActiveStep(2);
              toast.success(`Form "${found.name}" loaded for editing.`);
            }
          } catch (e) {
            console.error("Failed loading form details for editing", e);
            toast.error("Failed to load form details from backend.");
          } finally {
            setIsLoading(false);
          }
        }
        loadFormDetails();
      }
    }
  }, []);

  // Load templates list from API and load animation simulation
  useEffect(() => {
    async function loadTemplates() {
      try {
        const data = await fetchCustomForms();
        setApiTemplates(data);
      } catch (e) {
        console.error("Failed fetching API templates:", e);
      }
    }
    loadTemplates();

    const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    if (params && params.get('id')) {
      // Let the api request handle loading state
      return;
    }
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 850);
    return () => clearTimeout(timer);
  }, []);

  // Prepopulate step 1 inputs and canvas fields when template swaps
  useEffect(() => {
    if (selectedTemplateName === 'Custom Process') {
      // Start from scratch configuration
      setFormName('');
      setFormModule('Leads');
      setFormDescription('');
      setCanvasFields([]);
      setLogicRules([]);
      setHistory([]);
      setHistoryIndex(0);
      return;
    }
    const selectedTemplate = apiTemplates.find(t => t.id === selectedTemplateName);
    if (selectedTemplate) {
      setFormName(`${selectedTemplate.name} Copy`);
      setFormModule(selectedTemplate.module || 'Leads');
      setFormDescription(selectedTemplate.description || '');
      setCanvasFields(selectedTemplate.fields || []);
      setLogicRules(selectedTemplate.rules || []);
      setAlertRecordOwner(selectedTemplate.notifications?.alertRecordOwner !== false);
      setAlertSlackFeed(!!selectedTemplate.notifications?.alertSlackFeed);
      setAlertSysAdmin(!!selectedTemplate.notifications?.alertSysAdmin);
      setAlertEmails(selectedTemplate.notifications?.alertEmails || '');

      setHistory([selectedTemplate.fields || []]);
      setHistoryIndex(0);
      if (selectedTemplate.fields && selectedTemplate.fields.length > 0) {
        setSelectedFieldId(selectedTemplate.fields[0].id);
      }
    }
  }, [selectedTemplateName, apiTemplates]);

  // Sync logical rule selectors when canvas fields change
  useEffect(() => {
    if (canvasFields.length > 0) {
      setLogicIfField(canvasFields[0].label);
      setLogicTargetField(canvasFields[canvasFields.length - 1].label);
    }
  }, [canvasFields]);

  // Selected icon component resolver
  const getSelectedIconComponent = () => {
    const found = DYNAMIC_ICONS.find(i => i.name === selectedIconName);
    return found ? found.comp : UserPlus;
  };

  const currentIcon = getSelectedIconComponent();

  // Find selected field details for settings panel
  const getSelectedField = () => {
    return canvasFields.find(f => f.id === selectedFieldId) || null;
  };

  // Helper to update fields and record history for undo/redo
  const updateCanvasFields = (newFields: CanvasField[]) => {
    setCanvasFields(newFields);
    const slicedHistory = history.slice(0, historyIndex + 1);
    setHistory([...slicedHistory, newFields]);
    setHistoryIndex(slicedHistory.length);
  };

  // Undo click handler
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      setCanvasFields(history[prevIndex]);
      if (history[prevIndex].length > 0) {
        setSelectedFieldId(history[prevIndex][0].id);
      } else {
        setSelectedFieldId(null);
      }
      toast.info("Undo applied");
    }
  };

  // Redo click handler
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setCanvasFields(history[nextIndex]);
      if (history[nextIndex].length > 0) {
        setSelectedFieldId(history[nextIndex][0].id);
      } else {
        setSelectedFieldId(null);
      }
      toast.info("Redo applied");
    }
  };

  // Modify active field attributes in canvas array
  const handleUpdateFieldSettings = (updated: Partial<CanvasField>) => {
    if (!selectedFieldId) return;
    const updatedFields = canvasFields.map(f => (f.id === selectedFieldId ? { ...f, ...updated } : f));
    updateCanvasFields(updatedFields);
  };

  // Delete active field from canvas list
  const handleDeleteSelectedField = () => {
    if (!selectedFieldId) return;
    const remaining = canvasFields.filter(f => f.id !== selectedFieldId);
    updateCanvasFields(remaining);
    // Set next selection
    if (remaining.length > 0) {
      setSelectedFieldId(remaining[0].id);
    } else {
      setSelectedFieldId(null);
    }
    toast.success("Field removed from canvas.");
  };

  const handleAppendField = (type: string, label: string) => {
    const newId = `f-${Date.now()}`;
    const newField: CanvasField = {
      id: newId,
      type: type,
      label: label,
      placeholder: `Enter ${label.toLowerCase()}...`,
      helpText: '',
      required: false,
      sectionPlacement: 'Basic Information',
      customSectionName: ''
    };
    const updated = [...canvasFields, newField];
    const prevOrder = canvasFields.length > 0 ? (canvasFields[canvasFields.length - 1].orderIndex || 0) : 0;
    newField.orderIndex = prevOrder + 10;

    // Assign section placement based on closest section above
    let foundSection: string = 'Basic Information';
    for (let i = updated.length - 2; i >= 0; i--) {
      if (updated[i].type === 'section') {
        foundSection = updated[i].label;
        break;
      }
      if (updated[i].sectionPlacement) {
        foundSection = updated[i].sectionPlacement || 'Basic Information';
        break;
      }
    }
    newField.sectionPlacement = foundSection;

    updateCanvasFields(updated);
    setSelectedFieldId(newId);
    toast.success(`${label} field appended to canvas!`);
  };

  // HTML5 Drop Field Handler
  const handleDropField = (type: string, targetIndex: number | null) => {
    const libraryItem = [...BASIC_FIELDS_LIBRARY, ...ADVANCED_FIELDS_LIBRARY].find(
      i => i.type === type
    );
    if (!libraryItem) return;

    const newId = `f-${Date.now()}`;
    const newField: CanvasField = {
      id: newId,
      type: type,
      label: libraryItem.label,
      placeholder: `Enter ${libraryItem.label.toLowerCase()}...`,
      helpText: '',
      required: false,
      sectionPlacement: 'Basic Information',
      customSectionName: ''
    };

    let updated: CanvasField[];
    if (targetIndex === null) {
      updated = [...canvasFields, newField];
    } else {
      updated = [...canvasFields];
      updated.splice(targetIndex, 0, newField);
    }

    // Assign section placement based on closest section above, ONLY if no customSectionName is explicitly set
    const newIndex = updated.findIndex(f => f.id === newId);
    if (!updated[newIndex].customSectionName) {
      let foundSection: string = 'Basic Information';
      for (let i = newIndex - 1; i >= 0; i--) {
        if (updated[i].type === 'section') {
          foundSection = updated[i].label;
          break;
        }
        if (updated[i].sectionPlacement && !updated[i].customSectionName) {
          foundSection = updated[i].sectionPlacement || 'Basic Information';
          break;
        }
      }
      updated[newIndex].sectionPlacement = foundSection;
    }

    // Assign fractional orderIndex to preserve sparse layout
    const prevOrder = newIndex > 0 ? (updated[newIndex - 1].orderIndex || 0) : 0;
    const nextOrder = newIndex < updated.length - 1 ? (updated[newIndex + 1].orderIndex || prevOrder + 20) : prevOrder + 20;
    updated[newIndex].orderIndex = (prevOrder + nextOrder) / 2;

    updateCanvasFields(updated);
    setSelectedFieldId(newId);
    toast.success(`${libraryItem.label} field dropped into canvas!`);
  };

  // HTML5 Reorder Field Handler
  const handleReorderField = (fieldId: string, targetIndex: number) => {
    const fieldIndex = canvasFields.findIndex(f => f.id === fieldId);
    if (fieldIndex === -1) return;

    if (canvasFields[fieldIndex].isStandard) {
      toast.error("Standard system fields cannot be moved.");
      return;
    }

    const updatedFields = [...canvasFields];
    const [draggedField] = updatedFields.splice(fieldIndex, 1);

    let adjustedTarget = targetIndex;
    if (fieldIndex < targetIndex) {
      adjustedTarget = targetIndex - 1;
    }

    updatedFields.splice(adjustedTarget, 0, draggedField);

    // Assign section placement based on closest section above, ONLY if no customSectionName is explicitly set
    const newIndex = updatedFields.findIndex(f => f.id === fieldId);
    if (!updatedFields[newIndex].customSectionName) {
      let foundSection: string = 'Basic Information';
      for (let i = newIndex - 1; i >= 0; i--) {
        if (updatedFields[i].type === 'section') {
          foundSection = updatedFields[i].label;
          break;
        }
        if (updatedFields[i].sectionPlacement && !updatedFields[i].customSectionName) {
          foundSection = updatedFields[i].sectionPlacement || 'Basic Information';
          break;
        }
      }
      updatedFields[newIndex].sectionPlacement = foundSection;
    }

    // Assign fractional orderIndex to preserve sparse layout
    const prevOrder = newIndex > 0 ? (updatedFields[newIndex - 1].orderIndex || 0) : 0;
    const nextOrder = newIndex < updatedFields.length - 1 ? (updatedFields[newIndex + 1].orderIndex || prevOrder + 20) : prevOrder + 20;
    updatedFields[newIndex].orderIndex = (prevOrder + nextOrder) / 2;

    updateCanvasFields(updatedFields);
    toast.success("Field reordered");
  };

  // Handle reordering sections in Form Settings
  const handleReorderSection = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...computedSectionOrder];
    if (direction === 'up' && index > 0) {
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
      setSectionOrder(newOrder);
    } else if (direction === 'down' && index < newOrder.length - 1) {
      [newOrder[index + 1], newOrder[index]] = [newOrder[index], newOrder[index + 1]];
      setSectionOrder(newOrder);
    }
  };

  // Save logical rule
  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logicIfField || !logicTargetField) {
      toast.error("Verify condition and target fields.");
      return;
    }
    if (logicIfField === logicTargetField) {
      toast.error("If Field and Then Field must be different.");
      return;
    }
    setLogicRules([
      ...logicRules,
      {
        id: `l-${Date.now()}`,
        ifField: logicIfField,
        isCondition: logicCondition,
        thenAction: logicAction,
        targetField: logicTargetField
      }
    ]);
    toast.success("Conditional layout logic rule added!");
  };

  // Delete logical rule
  const handleDeleteRule = (id: string) => {
    setLogicRules(logicRules.filter(r => r.id !== id));
    toast.success("Logic rule removed.");
  };

  // Dynamic submissions data resolver
  const getMockSubmissions = () => {
    const mockData = [
      { id: 'SUB-4021', date: 'Jun 09, 2026 04:12 PM' },
      { id: 'SUB-4022', date: 'Jun 10, 2026 09:45 AM' },
      { id: 'SUB-4023', date: 'Jun 10, 2026 11:30 AM' }
    ];
    return mockData.map((sub, sIdx) => {
      const values: Record<string, string> = { id: sub.id, date: sub.date };
      canvasFields.forEach((f) => {
        if (f.type === 'text') {
          values[f.id] = sIdx === 0 ? 'Johnathan Doe' : sIdx === 1 ? 'Jane Smith' : 'Alex Mercer';
        } else if (f.type === 'email') {
          values[f.id] = sIdx === 0 ? 'john.doe@innovate.com' : sIdx === 1 ? 'jane.smith@design.io' : 'alex.mercer@cyber.net';
        } else if (f.type === 'phone') {
          values[f.id] = sIdx === 0 ? '+1 (201) 555-0123' : sIdx === 1 ? '+1 (305) 555-0199' : '+49 170 9876543';
        } else if (f.type === 'dropdown') {
          values[f.id] = f.options && f.options.length > 0 ? f.options[sIdx % f.options.length] : 'IT Consulting';
        } else if (f.type === 'textarea') {
          values[f.id] = sIdx === 0 ? 'Looking for premium CRM setup assistance.' : sIdx === 1 ? 'Need trial license codes for Events team.' : 'Need API sync with our custom lead feed.';
        } else {
          values[f.id] = 'Active';
        }
      });
      return values;
    });
  };

  // Sync Form to API Backend
  const saveFormToApi = async (status: 'Active' | 'Inactive'): Promise<boolean> => {
    if (!formName.trim()) {
      toast.error("Form Name is required.");
      return false;
    }

    let finalStatus = status;

    // Check duplicate active forms check
    if (finalStatus === 'Active') {
      try {
        const allForms = await fetchCustomForms();
        const activeDuplicate = allForms.find(
          (f: any) => f.module === formModule &&
            (f.status === 'Active' || f.Is_Active === true || f.status === true) &&
            f.id?.toString() !== editingFormId?.toString()
        );
        if (activeDuplicate) {
          toast.warning(`Saved as Inactive. An active form ("${activeDuplicate.name}") already exists for module "${formModule}".`);
          finalStatus = 'Inactive';
        }
      } catch (err) {
        console.error("Error validating active forms duplicate:", err);
      }
    }

    const toastId = toast.loading(editingFormId ? "Updating custom form..." : "Creating custom form...");
    try {
      // Auto-recalculate sectionPlacement based on visual canvas order
      const customFieldsClean: CanvasField[] = [];
      let currentSection = 'Basic Information';
      // canvasFields are already sorted by orderIndex in the builder UI
      for (const field of canvasFields) {
        if (field.type === 'section') {
          currentSection = field.label;
        }
        if (!field.isStandard) {
          // If the user has explicitly set a customSectionName via properties, preserve it!
          // Otherwise, auto-assign it to the current visual section.
          const finalPlacement = field.customSectionName ? field.customSectionName : currentSection;
          customFieldsClean.push({ ...field, sectionPlacement: finalPlacement });
        }
      }

      const payloadSTR = {
        fields: customFieldsClean,
        rules: logicRules,
        sectionOrder: computedSectionOrder,
        notifications: {
          alertRecordOwner,
          alertSlackFeed,
          alertSysAdmin,
          alertEmails
        },
        module: formModule,
        description: formDescription.trim() || `Custom form for collecting ${formModule} data.`
      };

      if (editingFormId) {
        await updateCustomForm(editingFormId, {
          FormName: formName.trim(),
          FormSTR: payloadSTR,
          Is_Active: finalStatus === 'Active'
        });
        toast.success(`Form "${formName}" updated successfully.`, { id: toastId });
      } else {
        await createCustomForm({
          FormName: formName.trim(),
          FormSTR: payloadSTR,
          Is_Active: finalStatus === 'Active'
        });
        toast.success(`New form "${formName}" created successfully.`, { id: toastId });
      }
      return true;
    } catch (e: any) {
      console.error("Failed saving form to backend:", e);
      toast.error(e?.message || "Failed saving form to backend.", { id: toastId });
      return false;
    }
  };

  // Handle Save and Continue workflow progress
  const handleSaveAndContinue = async () => {
    if (activeStep === 1) {
      if (!formName.trim()) {
        toast.error("Form Name is required.");
        return;
      }
      if (!formModule) {
        toast.error("Please choose a Module.");
        return;
      }

      const unified = getUnifiedFields(formModule, canvasFields);
      setCanvasFields(unified);

      setActiveStep(2);
    } else if (activeStep === 2) {
      // Validate field labels
      const labelsSet = new Set<string>();
      for (const field of canvasFields) {
        if (field.type === 'section') continue;

        const trimmedLabel = field.label.trim();
        if (!trimmedLabel) {
          toast.error("All fields must have a label.");
          return;
        }
        if (labelsSet.has(trimmedLabel.toLowerCase())) {
          toast.error(`Field labels must be unique. Duplicate label found: "${trimmedLabel}"`);
          return;
        }
        labelsSet.add(trimmedLabel.toLowerCase());
      }
      setActiveStep(3);
    } else if (activeStep < 5) {
      setActiveStep(activeStep + 1);
    } else {
      // Step 5: Publish
      const success = await saveFormToApi('Active');
      if (success) {
        router.push('/customization/customize-forms');
      }
    }
  };

  const selectedField = getSelectedField();

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">

        {/* ────────────────────────────────────────────────────────
            1. SKELETON LOADER STATE
            ──────────────────────────────────────────────────────── */}
        {isLoading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-[1600px] mx-auto space-y-6 p-1 animate-pulse"
          >
            <div className="flex justify-between items-center pb-2">
              <div className="space-y-2">
                <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-4 w-96 bg-slate-200 dark:bg-slate-800 rounded" />
              </div>
              <div className="h-10 w-40 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="col-span-1 lg:col-span-3 h-96 bg-white dark:bg-slate-900 border rounded-2xl" />
              <div className="col-span-1 lg:col-span-6 h-96 bg-white dark:bg-slate-900 border rounded-2xl" />
              <div className="col-span-1 lg:col-span-3 h-96 bg-white dark:bg-slate-900 border rounded-2xl" />
            </div>
          </motion.div>
        ) : (

          /* ────────────────────────────────────────────────────────
              2. REAL PAGE VIEW
              ──────────────────────────────────────────────────────── */
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-[1600px] mx-auto space-y-6 text-left p-1"
          >
            {/* Top Page Header (Only in Step 1) */}
            {activeStep === 1 && (
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 shrink-0 rounded-full border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800"
                    onClick={() => router.push('/customization/customize-forms')}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div>
                    <h1 className="text-2xl md:text-[1.65rem] font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                      Tailored Your Process
                    </h1>
                    <p className="text-muted-foreground text-xs md:text-sm mt-1 font-medium">
                      Build forms that match your unique workflow. Choose a template or start from scratch and customize every step.
                    </p>
                  </div>
                </div>

                <Button
                  onClick={() => {
                    setSelectedTemplateName('Custom Process');
                    toast.success("Template parameters cleared!");
                  }}
                  variant="outline"
                  className="flex items-center gap-2 h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer shadow-xs"
                >
                  <Plus className="h-4 w-4" />
                  Start From Scratch
                </Button>
              </div>
            )}

            {/* Template selector row (Only in Step 1) */}
            {activeStep === 1 && (
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.015)]">
                <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-50 dark:border-slate-850">
                  <div className="space-y-0.5">
                    <h2 className="text-sm font-extrabold text-slate-850 dark:text-slate-150">
                      Choose a Process Template
                    </h2>
                    <p className="text-[11px] text-slate-450 font-medium">Select a template that fits your business need and customize it.</p>
                  </div>
                  <span
                    onClick={() => toast.info('Advanced template library catalog.')}
                    className="text-xs font-extrabold text-blue-600 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    View All Templates <ArrowRight className="h-3 w-3" />
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                  {/* Start From Scratch Choice */}
                  <button
                    onClick={() => {
                      setSelectedTemplateName('Custom Process');
                      setFormName('');
                      setFormModule('');
                      setFormDescription('');
                      setCanvasFields([]);
                      setLogicRules([]);
                      setHistory([]);
                      setHistoryIndex(0);
                      toast.success("Starting with blank form canvas!");
                    }}
                    className={`p-4 rounded-xl border text-left flex flex-col justify-between h-38 transition-all hover:shadow-md cursor-pointer ${selectedTemplateName === 'Custom Process'
                      ? 'bg-slate-50/50 border-blue-500 shadow-sm ring-1 ring-blue-500 dark:bg-slate-900/50'
                      : 'bg-white border-slate-200 hover:border-slate-350 dark:bg-slate-900 dark:border-slate-800'
                      }`}
                  >
                    <div className="w-full">
                      <div className="flex justify-between items-start w-full">
                        <div className="h-8.5 w-8.5 rounded-lg flex items-center justify-center text-cyan-600 bg-cyan-50 dark:bg-cyan-950/20">
                          <Sliders className="h-4.5 w-4.5" />
                        </div>
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-2.5 leading-tight">
                        Blank Form
                      </h4>
                    </div>
                    <p className="text-[10px] font-semibold text-slate-450 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      Start from scratch and build a completely custom workflow.
                    </p>
                  </button>

                  {/* API Templates Choice */}
                  {apiTemplates.map((t) => {
                    const isSelected = selectedTemplateName === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => {
                          setSelectedTemplateName(t.id);
                          toast.info(`Preset template loaded: ${t.name}`);
                        }}
                        className={`p-4 rounded-xl border text-left flex flex-col justify-between h-38 transition-all hover:shadow-md cursor-pointer ${isSelected
                          ? 'bg-slate-50/50 border-blue-500 shadow-sm ring-1 ring-blue-500 dark:bg-slate-900/50'
                          : 'bg-white border-slate-200 hover:border-slate-350 dark:bg-slate-900 dark:border-slate-800'
                          }`}
                      >
                        <div className="w-full">
                          <div className="flex justify-between items-start w-full">
                            <div className="h-8.5 w-8.5 rounded-lg flex items-center justify-center text-blue-600 bg-blue-50 dark:bg-blue-950/20">
                              <Puzzle className="h-4.5 w-4.5" />
                            </div>
                            <Badge className="border-0 rounded-md font-bold uppercase text-[7.5px] px-1.5 py-0.2 hover:bg-inherit shadow-none bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400">
                              {t.module}
                            </Badge>
                          </div>
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-2.5 leading-tight truncate">
                            {t.name}
                          </h4>
                        </div>
                        <p className="text-[10px] font-semibold text-slate-450 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {t.description || `Template copied from dynamic schema "${t.name}"`}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 1 WIZARD DETAILS ROW */}
            {activeStep === 1 && (
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.015)] space-y-6">
                <div className="border-b border-slate-50 dark:border-slate-850 pb-4">
                  <h2 className="text-sm font-extrabold text-slate-850 dark:text-slate-150">
                    Tailor Your Process
                  </h2>
                  <p className="text-[11px] text-slate-450 font-medium">Customize the form steps, fields and actions to match your workflow.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                  {/* Stepper Navigation */}
                  <div className="col-span-1 lg:col-span-3 bg-slate-50/50 dark:bg-slate-950/20 border dark:border-slate-850 rounded-2xl p-4 space-y-1">
                    {STEPS.map((s) => (
                      <button
                        key={s.number}
                        disabled={s.number > activeStep}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all cursor-pointer border ${activeStep === s.number
                          ? 'bg-white dark:bg-slate-900 border-slate-150 dark:border-slate-800 shadow-xs'
                          : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-755'
                          }`}
                      >
                        <div
                          className={`h-6.5 w-6.5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${activeStep === s.number
                            ? 'bg-blue-600 text-white animate-pulse'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                            }`}
                          style={{
                            backgroundColor: activeStep === s.number ? primaryColor : undefined
                          }}
                        >
                          {s.number}
                        </div>
                        <div className="min-w-0 text-left">
                          <h4 className="text-xs font-bold leading-tight text-slate-800 dark:text-slate-200">
                            {s.title}
                          </h4>
                          <span className="text-[9.5px] font-bold text-slate-450 uppercase tracking-wide block mt-0.5">
                            {s.subtext}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Step 1 Details Form */}
                  <div className="col-span-1 lg:col-span-9 bg-white dark:bg-slate-900 border dark:border-slate-850 rounded-2xl p-6 min-h-[380px] flex flex-col justify-between shadow-xs">
                    <div className="space-y-5">
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-850 dark:text-slate-100">Form Details</h3>
                        <p className="text-[10px] text-slate-450 font-medium">Provide basic information about your form.</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase block">Form Name <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            value={formName}
                            onChange={(e) => setFormName(e.target.value)}
                            required
                            className="w-full text-xs h-9 px-3 rounded-xl border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-850 dark:text-slate-100 focus:outline-none"
                            placeholder="e.g. Lead Inbound Survey"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase block">Choose Module <span className="text-red-500">*</span></label>
                          <select
                            value={formModule}
                            onChange={(e) => setFormModule(e.target.value as any)}
                            className="w-full text-xs h-9 px-3 rounded-xl border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-850 dark:text-slate-100 focus:outline-none cursor-pointer"
                          >
                            <option value="" disabled hidden>Select Module...</option>
                            <option value="Leads" disabled={apiTemplates.some(f => f.module === 'Leads' && f.status === 'Active' && String(f.id) !== String(editingFormId))}>
                              Leads {apiTemplates.some(f => f.module === 'Leads' && f.status === 'Active' && String(f.id) !== String(editingFormId)) ? '(Already Created)' : ''}
                            </option>
                            <option value="Deals" disabled={apiTemplates.some(f => f.module === 'Deals' && f.status === 'Active' && String(f.id) !== String(editingFormId))}>
                              Deals {apiTemplates.some(f => f.module === 'Deals' && f.status === 'Active' && String(f.id) !== String(editingFormId)) ? '(Already Created)' : ''}
                            </option>
                            <option value="Companies" disabled={apiTemplates.some(f => f.module === 'Companies' && f.status === 'Active' && String(f.id) !== String(editingFormId))}>
                              Companies {apiTemplates.some(f => f.module === 'Companies' && f.status === 'Active' && String(f.id) !== String(editingFormId)) ? '(Already Created)' : ''}
                            </option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase block">Form Description</label>
                        <textarea
                          value={formDescription}
                          onChange={(e) => setFormDescription(e.target.value)}
                          rows={3}
                          className="w-full text-xs p-2.5 rounded-xl border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-850 dark:text-slate-100 focus:outline-none resize-none"
                          placeholder="Summarize form details..."
                        />
                      </div>

                      {/* Form Icon selector hidden as per request */}
                    </div>

                    {/* Step 1 Footer */}
                    <div className="border-t pt-4 mt-6 flex justify-between items-center dark:border-slate-850">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push('/customization/customize-forms')}
                        className="h-9 px-4 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSaveAndContinue}
                        style={{ backgroundColor: primaryColor }}
                        className="h-9 px-5 rounded-xl text-xs font-bold text-white shadow-sm flex items-center gap-1 cursor-pointer"
                      >
                        <span>Save & Continue</span>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* ────────────────────────────────────────────────────────
                CANVAS STEP 2-5: DRAG & DROP builder CANVAS
                ──────────────────────────────────────────────────────── */}
            {activeStep >= 2 && (
              <div className="space-y-5">

                {/* Visual breadcrumbs sub-header */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 shadow-sm">

                  {/* Left breadcrumb info */}
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 -ml-2"
                      onClick={() => router.push('/customization/customize-forms')}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-xs font-bold text-slate-400">Forms</span>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{formName || 'Lead Capture Form'}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
                    <span className="text-xs font-extrabold text-blue-600 bg-blue-50 dark:bg-blue-950/20 px-2 py-0.5 rounded uppercase tracking-wider text-[10px]">
                      {activeStep === 2 ? `Step 2: ${builderTab}` : activeStep === 3 ? 'Step 3: Logic' : activeStep === 4 ? 'Step 4: Notify' : 'Step 5: Review'}
                    </span>
                  </div>

                  {/* Secondary tabs selectors */}
                  <div className="flex border-b sm:border-0 overflow-x-auto gap-1">
                    {[
                      { id: 'builder', label: 'Builder', step: 2 },
                      { id: 'settings', label: 'Settings', step: 2 },
                      { id: 'integrations', label: 'Integrations', step: 2 },
                      { id: 'share', label: 'Share & Embed', step: 2 },
                      { id: 'submissions', label: 'Submissions', step: 2 }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setBuilderTab(tab.id as any);
                          setActiveStep(tab.step);
                        }}
                        className={`py-1.5 px-3 whitespace-nowrap text-xs font-bold rounded-lg transition-all cursor-pointer ${builderTab === tab.id && activeStep === 2
                          ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/30'
                          : 'text-slate-500 hover:text-slate-700'
                          }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Right options, preview and publish buttons */}
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {/* Device cogs */}
                    <button
                      onClick={() => setPreviewDevice('desktop')}
                      title="Desktop view"
                      className={`h-8.5 w-8.5 rounded-lg border flex items-center justify-center cursor-pointer transition-colors ${previewDevice === 'desktop' ? 'bg-slate-100 dark:bg-slate-800 text-blue-600' : 'text-slate-450 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                      <Monitor className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setPreviewDevice('mobile')}
                      title="Mobile view"
                      className={`h-8.5 w-8.5 rounded-lg border flex items-center justify-center cursor-pointer transition-colors ${previewDevice === 'mobile' ? 'bg-slate-100 dark:bg-slate-800 text-blue-600' : 'text-slate-450 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                      <Smartphone className="h-4 w-4" />
                    </button>
                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

                    {/* Undo / Redo */}
                    <button
                      onClick={handleUndo}
                      disabled={historyIndex === 0}
                      title="Undo"
                      className={`h-8.5 w-8.5 rounded-lg border flex items-center justify-center cursor-pointer transition-colors ${historyIndex === 0 ? 'opacity-30 cursor-not-allowed text-slate-300' : 'text-slate-450 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                      <Undo className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleRedo}
                      disabled={historyIndex >= history.length - 1}
                      title="Redo"
                      className={`h-8.5 w-8.5 rounded-lg border flex items-center justify-center cursor-pointer transition-colors ${historyIndex >= history.length - 1 ? 'opacity-30 cursor-not-allowed text-slate-300' : 'text-slate-450 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                      <Redo className="h-4 w-4" />
                    </button>
                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

                    <Button
                      onClick={() => {
                        setActiveStep(5);
                        toast.info("Viewing Live Interactive Preview Sandbox!");
                      }}
                      variant="outline"
                      size="sm"
                      className="text-xs font-bold h-8.5 rounded-lg border border-slate-250 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Preview Live
                    </Button>

                    <Button
                      onClick={async () => {
                        const success = await saveFormToApi('Inactive');
                        if (success) {
                          router.push('/customization/customize-forms');
                        }
                      }}
                      variant="outline"
                      size="sm"
                      className="text-xs font-bold h-8.5 rounded-lg border border-slate-250 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Save className="h-3.5 w-3.5" />
                      Save Draft
                    </Button>

                    <Button
                      onClick={async () => {
                        const success = await saveFormToApi('Active');
                        if (success) {
                          router.push('/customization/customize-forms');
                        }
                      }}
                      size="sm"
                      style={{ backgroundColor: primaryColor }}
                      className="text-xs font-bold h-8.5 text-white rounded-lg shadow-sm cursor-pointer hover:opacity-95"
                    >
                      Publish
                    </Button>
                  </div>

                </div>

                {/* 3-Column main layout grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                  {/* ────────────────────────────────────────────────────────
                      COLUMN 1: LEFT SIDEBAR
                      ──────────────────────────────────────────────────────── */}
                  <div className="col-span-1 lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.01)] space-y-4 text-left">

                    {/* Render Step 2 Library */}
                    {activeStep === 2 && builderTab === 'builder' && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b dark:border-slate-850">
                          <h3 className="text-xs font-extrabold text-slate-850 dark:text-slate-150 uppercase tracking-wider">
                            Add Fields
                          </h3>
                        </div>

                        {/* Field Category: Basic */}
                        <div className="space-y-2.5">
                          <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                            Basic Fields
                          </span>
                          <div className="grid grid-cols-1 gap-1.5 max-h-[260px] overflow-y-auto pr-1">
                            {BASIC_FIELDS_LIBRARY.map((item) => {
                              const FieldIcon = item.icon;
                              return (
                                <div
                                  key={item.type}
                                  draggable
                                  onDragStart={(e) => {
                                    e.dataTransfer.setData('fieldType', item.type);
                                    setIsDragging(true);
                                  }}
                                  onDragEnd={() => setIsDragging(false)}
                                  onClick={() => handleAppendField(item.type, item.label)}
                                  className="p-2 border border-slate-150 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/20 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl cursor-grab active:cursor-grabbing flex items-center gap-2.5 transition-colors select-none text-left"
                                >
                                  <div className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border dark:border-slate-800 text-slate-500 shrink-0">
                                    <FieldIcon className="h-4 w-4" />
                                  </div>
                                  <span className="text-xs font-bold text-slate-700 dark:text-slate-350">{item.label}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Field Category: Advanced */}
                        <div className="space-y-2.5 pt-2">
                          <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                            Advanced Fields
                          </span>
                          <div className="grid grid-cols-1 gap-1.5 max-h-[170px] overflow-y-auto pr-1">
                            {ADVANCED_FIELDS_LIBRARY.map((item) => {
                              const FieldIcon = item.icon;
                              return (
                                <div
                                  key={item.type}
                                  draggable
                                  onDragStart={(e) => {
                                    e.dataTransfer.setData('fieldType', item.type);
                                    setIsDragging(true);
                                  }}
                                  onDragEnd={() => setIsDragging(false)}
                                  onClick={() => handleAppendField(item.type, item.label)}
                                  className="p-2 border border-slate-150 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/20 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl cursor-grab flex items-center gap-2.5 transition-colors select-none text-left"
                                >
                                  <div className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border dark:border-slate-800 text-slate-550 shrink-0">
                                    <FieldIcon className="h-4 w-4" />
                                  </div>
                                  <span className="text-xs font-bold text-slate-700 dark:text-slate-350">{item.label}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Info notice */}
                        <div className="p-3 border border-dashed rounded-xl bg-blue-50/30 text-blue-700 dark:bg-blue-950/10 dark:text-blue-400 flex items-start gap-2 text-[10px] leading-relaxed">
                          <Move className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                          <span className="font-semibold text-left">Drag and drop fields or click to append to canvas workspace.</span>
                        </div>
                      </div>
                    )}

                    {/* Step 2, settings tab sidebar */}
                    {activeStep === 2 && builderTab === 'settings' && (
                      <div className="space-y-4">
                        <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase pb-2 border-b dark:border-slate-800">Swap Templates</h3>
                        <p className="text-[10px] text-slate-450 leading-relaxed font-semibold">Change current template preset to load static structured fields layout:</p>
                        <div className="space-y-2">
                          <button
                            onClick={() => {
                              setSelectedTemplateName('Custom Process');
                              toast.success("Loaded Blank Form configuration");
                            }}
                            className={`w-full p-2.5 text-xs font-bold rounded-xl border text-left transition-all ${selectedTemplateName === 'Custom Process'
                              ? 'bg-blue-50/50 border-blue-500 dark:bg-slate-850 text-slate-800 dark:text-white'
                              : 'bg-slate-50/20 border-slate-150 hover:bg-slate-50 dark:hover:bg-slate-800'
                              }`}
                          >
                            Blank Form
                          </button>
                          {apiTemplates.map((t) => (
                            <button
                              key={t.id}
                              onClick={() => {
                                setSelectedTemplateName(t.id);
                                toast.success(`Loaded preset template: ${t.name}`);
                              }}
                              className={`w-full p-2.5 text-xs font-bold rounded-xl border text-left transition-all ${selectedTemplateName === t.id
                                ? 'bg-blue-50/50 border-blue-500 dark:bg-slate-850 text-slate-800 dark:text-white'
                                : 'bg-slate-50/20 border-slate-150 hover:bg-slate-50 dark:hover:bg-slate-800'
                                }`}
                            >
                              {t.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Step 2, integrations tab sidebar */}
                    {activeStep === 2 && builderTab === 'integrations' && (
                      <div className="space-y-4">
                        <h3 className="text-xs font-extrabold text-slate-850 dark:text-slate-150 uppercase pb-2 border-b dark:border-slate-850">Connected Services</h3>
                        <div className="space-y-3 text-xs font-semibold">
                          <div className="p-3 bg-slate-50/50 dark:bg-slate-950/20 border dark:border-slate-800 rounded-xl flex items-center justify-between">
                            <span>Slack Alerts</span>
                            <Badge className={isSlackConnected ? "bg-emerald-500/10 text-emerald-600 border-0" : "bg-slate-250 text-slate-500 border-0 dark:bg-slate-800"}>
                              {isSlackConnected ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <div className="p-3 bg-slate-50/50 dark:bg-slate-950/20 border dark:border-slate-800 rounded-xl flex items-center justify-between">
                            <span>Outgoing Webhook</span>
                            <Badge className={isWebhookConnected ? "bg-emerald-500/10 text-emerald-600 border-0" : "bg-slate-250 text-slate-500 border-0 dark:bg-slate-800"}>
                              {isWebhookConnected ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">Customize alerts payload variables in the center canvas settings.</p>
                        </div>
                      </div>
                    )}

                    {/* Step 2, share tab sidebar */}
                    {activeStep === 2 && builderTab === 'share' && (
                      <div className="space-y-4 font-semibold">
                        <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase pb-2 border-b dark:border-slate-850">Sharing Guide</h3>
                        <div className="space-y-2 text-[11px] text-slate-500 leading-relaxed font-semibold">
                          <p className="p-2 border rounded-lg bg-slate-50/30 dark:border-slate-800"><strong>1. Direct Link:</strong> Best for emailing leads directly or adding to social bios.</p>
                          <p className="p-2 border rounded-lg bg-slate-50/30 dark:border-slate-800"><strong>2. Embed Portal:</strong> Use the HTML iframe embed to place forms directly into landing pages.</p>
                          <p className="p-2 border rounded-lg bg-slate-50/30 dark:border-slate-800"><strong>3. QR Scan code:</strong> Export vector or image QR codes for prints or cards.</p>
                        </div>
                      </div>
                    )}

                    {/* Step 2, submissions tab sidebar */}
                    {activeStep === 2 && builderTab === 'submissions' && (
                      <div className="space-y-4">
                        <h3 className="text-xs font-extrabold text-slate-850 dark:text-slate-150 uppercase pb-2 border-b dark:border-slate-850">Submissions Stats</h3>
                        <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                          <div className="p-3 border rounded-xl text-left dark:border-slate-800">
                            <span className="text-[10px] text-slate-400 uppercase font-bold">Total entries</span>
                            <div className="text-xl font-extrabold text-slate-800 dark:text-slate-100 mt-1">3</div>
                          </div>
                          <div className="p-3 border rounded-xl text-left dark:border-slate-800">
                            <span className="text-[10px] text-slate-400 uppercase font-bold">Conversion</span>
                            <div className="text-xl font-extrabold text-emerald-600 mt-1">100%</div>
                          </div>
                          <div className="p-3 border rounded-xl text-left col-span-2 dark:border-slate-800">
                            <span className="text-[10px] text-slate-400 uppercase font-bold">Avg response time</span>
                            <div className="text-sm font-extrabold mt-1 text-slate-800 dark:text-slate-100">45 seconds</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 3 (Logic) Sidebar */}
                    {activeStep === 3 && (
                      <div className="space-y-4">
                        <h3 className="text-xs font-extrabold text-slate-850 dark:text-slate-150 uppercase pb-2 border-b dark:border-slate-850">Active Rules ({logicRules.length})</h3>
                        <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                          {logicRules.length === 0 ? (
                            <div className="text-center py-6 text-slate-400 text-xs font-bold">
                              No conditional rules added.
                            </div>
                          ) : (
                            logicRules.map((rule, idx) => (
                              <div key={rule.id} className="p-3 border rounded-xl bg-slate-50/50 dark:bg-slate-950/20 border-slate-200 dark:border-slate-850 space-y-1.5 text-xs text-left relative group">
                                <div className="font-extrabold text-[10px] text-slate-400 uppercase">Rule {idx + 1}</div>
                                <div className="text-slate-650 dark:text-slate-350 leading-relaxed font-semibold">
                                  If <span className="font-bold text-blue-600 dark:text-blue-400">{rule.ifField}</span> is <span className="font-bold text-amber-600">{rule.isCondition}</span>, then <span className="font-bold text-emerald-600">{rule.thenAction}</span> <span className="font-bold text-slate-700 dark:text-slate-350">{rule.targetField}</span>.
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteRule(rule.id)}
                                  className="absolute right-2.5 top-2.5 p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded cursor-pointer"
                                  title="Delete rule"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}

                    {/* Step 4 (Notifications) Sidebar */}
                    {activeStep === 4 && (
                      <div className="space-y-4">
                        <h3 className="text-xs font-extrabold text-slate-850 dark:text-slate-150 uppercase pb-2 border-b dark:border-slate-850 font-bold">Alert Channels</h3>
                        <div className="space-y-2 text-xs font-semibold">
                          <div className={`p-3 border rounded-xl flex items-center justify-between cursor-pointer ${alertEmails.trim() !== '' ? 'border-emerald-500 bg-emerald-50/5 dark:border-emerald-950' : 'dark:border-slate-800'}`}>
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-blue-600 shrink-0" />
                              <span className="font-bold">Email Alerts</span>
                            </div>
                            <CheckCircle2 className={`h-4.5 w-4.5 ${alertEmails.trim() !== '' ? 'text-emerald-500' : 'text-slate-300'}`} />
                          </div>
                          <div className={`p-3 border rounded-xl flex items-center justify-between cursor-pointer ${alertSlackFeed ? 'border-emerald-500 bg-emerald-50/5 dark:border-emerald-950' : 'dark:border-slate-800'}`}>
                            <div className="flex items-center gap-2">
                              <Slack className="h-4 w-4 text-purple-600 shrink-0" />
                              <span className="font-bold">Slack Alerts</span>
                            </div>
                            <CheckCircle2 className={`h-4.5 w-4.5 ${alertSlackFeed ? 'text-emerald-500' : 'text-slate-300'}`} />
                          </div>
                          <div className={`p-3 border rounded-xl flex items-center justify-between cursor-pointer ${alertSysAdmin ? 'border-emerald-500 bg-emerald-50/5 dark:border-emerald-950' : 'dark:border-slate-800'}`}>
                            <div className="flex items-center gap-2">
                              <Database className="h-4 w-4 text-amber-600 shrink-0" />
                              <span className="font-bold">Admin Feed Alert</span>
                            </div>
                            <CheckCircle2 className={`h-4.5 w-4.5 ${alertSysAdmin ? 'text-emerald-500' : 'text-slate-300'}`} />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 5 (Review & Publish) Sidebar */}
                    {activeStep === 5 && (
                      <div className="space-y-4">
                        <h3 className="text-xs font-extrabold text-slate-850 dark:text-slate-150 uppercase pb-2 border-b dark:border-slate-850">Review Checklist</h3>
                        <div className="space-y-2.5 text-xs font-semibold">
                          <div className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <span className="font-bold block text-slate-700 dark:text-slate-350">Form Name Mapped</span>
                              <span className="text-[10px] text-slate-450 block truncate">{formName}</span>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <span className="font-bold block text-slate-700 dark:text-slate-350">CRM Module Configured</span>
                              <span className="text-[10px] text-slate-450 block">{formModule} module entries</span>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <span className="font-bold block text-slate-700 dark:text-slate-350">Fields Assigned</span>
                              <span className="text-[10px] text-slate-450 block">{canvasFields.length} mapped custom inputs</span>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <span className="font-bold block text-slate-700 dark:text-slate-350">Conditional Rules</span>
                              <span className="text-[10px] text-slate-450 block">{logicRules.length} visibility rules active</span>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <Check className={`h-4 w-4 shrink-0 mt-0.5 ${alertEmails.trim() !== '' ? 'text-emerald-500' : 'text-slate-300'}`} />
                            <div className="min-w-0">
                              <span className="font-bold block text-slate-700 dark:text-slate-350">Email alerts enabled</span>
                              <span className="text-[10px] text-slate-450 block truncate">{alertEmails || 'No emails mapped'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                  </div>

                  {/* ────────────────────────────────────────────────────────
                      COLUMN 2: CENTER CANVAS - MAIN BUILDER / DISPLAY AREA
                      ──────────────────────────────────────────────────────── */}
                  <div className="col-span-1 lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.015)] min-h-[550px] flex flex-col justify-between">

                    {/* Device Preview Wrapper */}
                    <div className={previewDevice === 'mobile' ? "max-w-[370px] mx-auto border-[10px] border-slate-800 dark:border-slate-750 rounded-[36px] p-4 bg-white dark:bg-slate-900 shadow-xl transition-all relative overflow-hidden ring-4 ring-slate-100 dark:ring-slate-950 w-full mb-3" : "w-full transition-all"}>

                      {previewDevice === 'mobile' && (
                        <div className="w-24 h-4.5 bg-slate-800 dark:bg-slate-750 mx-auto rounded-b-xl absolute top-0 left-1/2 -translate-x-1/2 z-10 flex items-center justify-center">
                          <div className="w-10 h-1 bg-slate-600 rounded-full" />
                        </div>
                      )}

                      <div className={previewDevice === 'mobile' ? "pt-5 min-h-[460px] max-h-[520px] overflow-y-auto pr-1 text-left" : "text-left"}>

                        {/* ──────────────────────────────────
                            A. BUILDER TAB CONTENT
                            ────────────────────────────────── */}
                        {activeStep === 2 && builderTab === 'builder' && (
                          <div>
                            {/* Active header info */}
                            <div className="pb-5 border-b border-slate-100 dark:border-slate-800 text-left">
                              <h2 className="text-xl font-extrabold text-slate-850 dark:text-slate-100">
                                {formName || 'Lead Capture Form'}
                              </h2>
                              <p className="text-xs text-slate-450 font-semibold mt-1">
                                {formDescription || 'Please fill in the details below and our team will contact you shortly.'}
                              </p>
                            </div>

                            {/* Drop fields zones & fields layouts */}
                            <div className="py-6 space-y-4 text-left">

                              {canvasFields.length === 0 ? (
                                <div
                                  onDragOver={(e) => { e.preventDefault(); setDragOverIndex(9999); }}
                                  onDragLeave={() => setDragOverIndex(null)}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    const type = e.dataTransfer.getData('fieldType');
                                    handleDropField(type, null);
                                    setDragOverIndex(null);
                                  }}
                                  className={`border-2 border-dashed py-16 text-center text-xs font-bold rounded-2xl transition-all flex flex-col items-center justify-center gap-2 ${dragOverIndex === 9999
                                    ? 'border-emerald-500 bg-emerald-50/10 text-emerald-600'
                                    : 'border-slate-200 text-slate-400 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/20'
                                    }`}
                                >
                                  <Move className="h-7 w-7 text-slate-350 dark:text-slate-600 animate-bounce" />
                                  <span>Drag and drop fields here to start building</span>
                                  <span className="text-[10px] text-slate-450">or click fields library elements on the left side</span>
                                </div>
                              ) : (
                                canvasFields.map((field, idx) => {
                                  const isSelected = selectedFieldId === field.id;

                                  return (
                                    <React.Fragment key={field.id}>

                                      <div
                                        className="relative group/field"
                                        draggable={!field.isStandard}
                                        onDragStart={(e) => {
                                          if (field.isStandard) return;
                                          e.dataTransfer.setData('draggedFieldId', field.id);
                                          setIsDragging(true);
                                        }}
                                        onDragEnd={() => setIsDragging(false)}
                                      >

                                        {/* Drag drop slot above */}
                                        {idx === 0 && (
                                          <div
                                            onDragOver={(e) => { e.preventDefault(); setDragOverIndex(0); }}
                                            onDragLeave={() => setDragOverIndex(null)}
                                            onDrop={(e) => {
                                              e.preventDefault();
                                              const type = e.dataTransfer.getData('fieldType');
                                              const draggedFieldId = e.dataTransfer.getData('draggedFieldId');
                                              if (draggedFieldId) {
                                                handleReorderField(draggedFieldId, 0);
                                              } else if (type) {
                                                handleDropField(type, 0);
                                              }
                                              setDragOverIndex(null);
                                            }}
                                            className={`transition-all duration-200 rounded-xl ${dragOverIndex === 0
                                              ? 'h-10 border-2 border-dashed border-emerald-500 bg-emerald-50/50 dark:bg-emerald-955/20 text-emerald-600 flex items-center justify-center text-xs font-bold my-1'
                                              : isDragging
                                                ? 'h-3 border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/20 my-1'
                                                : 'h-1'
                                              }`}
                                          >
                                            {dragOverIndex === 0 && <span>Drop here</span>}
                                          </div>
                                        )}

                                        {/* Live Field Card */}
                                        <div
                                          onClick={() => setSelectedFieldId(field.id)}
                                          className={`p-4 border rounded-xl relative transition-all cursor-pointer ${field.isStandard
                                            ? isSelected
                                              ? 'border-blue-500 shadow-sm ring-1 ring-blue-500 bg-blue-50/30 dark:bg-blue-900/20'
                                              : 'border-slate-200 bg-slate-100/60 dark:bg-slate-950/80 dark:border-slate-800 hover:border-slate-300'
                                            : isSelected
                                              ? 'border-emerald-500 shadow-sm ring-1 ring-emerald-500 bg-emerald-50/5 dark:bg-emerald-955/5'
                                              : 'border-slate-150 hover:border-slate-350 bg-white dark:bg-slate-900 dark:border-slate-800'
                                            }`}
                                        >
                                          {/* Standard Field Indicator */}
                                          {field.isStandard && (
                                            <div className="absolute top-3 right-3 flex items-center gap-1 pointer-events-none">
                                              <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 bg-slate-200/50 dark:bg-slate-800/50 px-2 py-0.5 rounded-md flex items-center gap-1">
                                                Default Field
                                              </span>
                                            </div>
                                          )}

                                          {/* Drag helper overlay indicator for Custom Fields */}
                                          {!field.isStandard && (
                                            <div className="absolute top-2 right-2 opacity-0 group-hover/field:opacity-40 transition-opacity pointer-events-none">
                                              <GripVertical className="h-4 w-4 text-slate-400" />
                                            </div>
                                          )}

                                          {field.type === 'section' ? (
                                            <div className="pt-2 pb-1 text-left">
                                              <h4 className="text-xs font-extrabold text-slate-850 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5 border-b pb-1 dark:border-slate-800">
                                                <Split className="h-3.5 w-3.5 text-blue-500" />
                                                {field.label || 'Section Break'}
                                              </h4>
                                              {field.helpText && (
                                                <p className="text-[10px] text-slate-450 dark:text-slate-500 font-semibold block mt-1">
                                                  {field.helpText}
                                                </p>
                                              )}
                                            </div>
                                          ) : (
                                            <div className="space-y-1">
                                              <div className="flex items-center gap-1">
                                                <span className="text-xs font-extrabold text-slate-750 dark:text-slate-200">
                                                  {field.label}
                                                </span>
                                                {field.required && <span className="text-red-500 font-bold">*</span>}
                                              </div>

                                              {/* Render input formats depending on types */}
                                              {field.type === 'text' && (
                                                <input
                                                  type="text"
                                                  disabled
                                                  placeholder={field.placeholder || 'Enter text...'}
                                                  className={`h-9 px-3 rounded-lg border text-xs w-full mt-1.5 dark:border-slate-805 dark:bg-slate-950 ${field.isStandard ? 'bg-white' : 'bg-slate-50/50'}`}
                                                />
                                              )}

                                              {field.type === 'email' && (
                                                <input
                                                  type="email"
                                                  disabled
                                                  placeholder={field.placeholder || 'name@example.com'}
                                                  className={`h-9 px-3 rounded-lg border text-xs w-full mt-1.5 dark:border-slate-805 dark:bg-slate-955 ${field.isStandard ? 'bg-white' : 'bg-slate-50/50'}`}
                                                />
                                              )}

                                              {field.type === 'phone' && (
                                                <div className="flex gap-2 mt-1.5">
                                                  <div className={`h-9 px-2 rounded-lg border flex items-center gap-1.5 text-xs text-slate-505 shrink-0 dark:border-slate-805 dark:bg-slate-955 ${field.isStandard ? 'bg-white' : 'bg-slate-50/50'}`}>
                                                    <span>🇺🇸</span>
                                                    <ChevronDown className="h-3 w-3" />
                                                  </div>
                                                  <input
                                                    type="text"
                                                    disabled
                                                    placeholder={field.placeholder || '(201) 555-0123'}
                                                    className={`h-9 px-3 rounded-lg border text-xs w-full dark:border-slate-805 dark:bg-slate-955 ${field.isStandard ? 'bg-white' : 'bg-slate-50/50'}`}
                                                  />
                                                </div>
                                              )}

                                              {field.type === 'dropdown' && (
                                                <div className="relative mt-1.5">
                                                  <div className={`h-9 px-3 rounded-lg border flex items-center justify-between text-xs text-slate-450 dark:border-slate-805 dark:bg-slate-955 ${field.isStandard ? 'bg-white' : 'bg-slate-50/50'}`}>
                                                    <span>{field.placeholder || 'Select an option'}</span>
                                                    <ChevronDown className="h-4 w-4" />
                                                  </div>
                                                </div>
                                              )}

                                              {field.type === 'textarea' && (
                                                <textarea
                                                  disabled
                                                  placeholder={field.placeholder || 'Type your message here...'}
                                                  rows={2}
                                                  className={`w-full text-xs p-2.5 rounded-lg border resize-none mt-1.5 dark:border-slate-805 dark:bg-slate-955 ${field.isStandard ? 'bg-white' : 'bg-slate-50/50'}`}
                                                />
                                              )}

                                              {(field.type === 'date' || field.type === 'datetime' || field.type === 'time') && (
                                                <div className="relative mt-1.5">
                                                  <input
                                                    type={field.type === 'time' ? 'time' : field.type === 'datetime' ? 'datetime-local' : 'date'}
                                                    disabled
                                                    className={`h-9 px-3 rounded-lg border text-xs w-full dark:border-slate-805 dark:bg-slate-955 ${field.isStandard ? 'bg-white' : 'bg-slate-50/50'}`}
                                                  />
                                                </div>
                                              )}

                                              {(field.type === 'checkbox' || field.type === 'radio') && (
                                                <div className="mt-2 space-y-2">
                                                  {(field.options && field.options.length > 0 ? field.options : ['Option 1']).map((opt, oIdx) => (
                                                    <div key={oIdx} className="flex items-center gap-2">
                                                      <input type={field.type} disabled className="h-3.5 w-3.5" />
                                                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{opt}</span>
                                                    </div>
                                                  ))}
                                                </div>
                                              )}

                                              {field.type === 'multi-select' && (
                                                <div className="relative mt-1.5">
                                                  <div className="min-h-[36px] p-1.5 rounded-lg border bg-slate-50/50 flex flex-wrap gap-1.5 items-center text-xs text-slate-450 dark:border-slate-805 dark:bg-slate-955">
                                                    {(field.options && field.options.length > 0 ? field.options : ['Option 1', 'Option 2']).slice(0, 3).map((opt, oIdx) => (
                                                      <div key={oIdx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 px-2 py-1 rounded text-[10px] font-bold">
                                                        {opt}
                                                      </div>
                                                    ))}
                                                  </div>
                                                </div>
                                              )}

                                              {field.type === 'number' && (
                                                <input
                                                  type="number"
                                                  disabled
                                                  placeholder={field.placeholder || '0.00'}
                                                  className={`h-9 px-3 rounded-lg border text-xs w-full mt-1.5 dark:border-slate-805 dark:bg-slate-950 ${field.isStandard ? 'bg-white' : 'bg-slate-50/50'}`}
                                                />
                                              )}

                                              {field.type !== 'text' && field.type !== 'email' && field.type !== 'phone' && field.type !== 'dropdown' && field.type !== 'textarea' && field.type !== 'section' && field.type !== 'date' && field.type !== 'datetime' && field.type !== 'time' && field.type !== 'checkbox' && field.type !== 'radio' && field.type !== 'multi-select' && field.type !== 'number' && (
                                                <div className="h-9.5 border border-dashed rounded-lg bg-slate-50/30 flex items-center justify-center text-slate-400 dark:text-slate-650 text-[11px] font-semibold mt-1.5 dark:border-slate-805">
                                                  [Interactive {field.label} Field Preview]
                                                </div>
                                              )}

                                              {field.helpText && (
                                                <span className="text-[10px] text-slate-450 dark:text-slate-500 font-semibold block mt-1">
                                                  {field.helpText}
                                                </span>
                                              )}
                                            </div>
                                          )}
                                        </div>

                                        {/* Drag drop slot below */}
                                        <div
                                          onDragOver={(e) => { e.preventDefault(); setDragOverIndex(idx + 1); }}
                                          onDragLeave={() => setDragOverIndex(null)}
                                          onDrop={(e) => {
                                            e.preventDefault();
                                            const type = e.dataTransfer.getData('fieldType');
                                            const draggedFieldId = e.dataTransfer.getData('draggedFieldId');
                                            if (draggedFieldId) {
                                              handleReorderField(draggedFieldId, idx + 1);
                                            } else if (type) {
                                              handleDropField(type, idx + 1);
                                            }
                                            setDragOverIndex(null);
                                          }}
                                          className={`transition-all duration-200 rounded-xl ${dragOverIndex === idx + 1
                                            ? 'h-10 border-2 border-dashed border-emerald-500 bg-emerald-50/50 dark:bg-emerald-955/20 text-emerald-600 flex items-center justify-center text-xs font-bold my-1'
                                            : isDragging
                                              ? 'h-3 border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/20 my-1'
                                              : 'h-1'
                                            }`}
                                        >
                                          {dragOverIndex === idx + 1 && <span>Drop here</span>}
                                        </div>

                                      </div>
                                    </React.Fragment>
                                  );
                                })
                              )}

                              {/* T&C checkbox block */}
                              <div className="flex items-start gap-2.5 pt-2 leading-relaxed">
                                <input type="checkbox" disabled id="tc-check" className="h-4 w-4 border rounded mt-0.5 dark:border-slate-800" />
                                <label htmlFor="tc-check" className="text-[11px] font-bold text-slate-500 cursor-pointer">
                                  I agree to the <span className="text-blue-500 underline">Terms & Conditions</span> and <span className="text-blue-500 underline">Privacy Policy</span> <span className="text-red-500">*</span>
                                </label>
                              </div>

                            </div>
                          </div>
                        )}

                        {/* ──────────────────────────────────
                            B. FORM SETTINGS TAB CONTENT
                            ────────────────────────────────── */}
                        {activeStep === 2 && builderTab === 'settings' && (
                          <div className="space-y-5">
                            <div className="pb-4 border-b">
                              <h2 className="text-base font-extrabold text-slate-850 dark:text-slate-100">Form Details Setup</h2>
                              <p className="text-xs text-slate-450 font-semibold mt-0.5">Edit general details associated with this form.</p>
                            </div>
                            <div className="space-y-4 text-xs font-semibold">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-slate-455 block text-left">Form Name</label>
                                <input
                                  type="text"
                                  value={formName}
                                  onChange={(e) => setFormName(e.target.value)}
                                  className="w-full text-xs h-9 px-3 border rounded-xl dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-slate-455 block text-left">Module</label>
                                <select
                                  value={formModule}
                                  onChange={(e) => setFormModule(e.target.value as any)}
                                  className="w-full text-xs h-9 px-3 border rounded-xl dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none"
                                >
                                  <option value="Leads">Leads</option>
                                  <option value="Contacts">Contacts</option>
                                  <option value="Deals">Deals</option>
                                  <option value="Support">Support</option>
                                  <option value="Events">Events</option>
                                </select>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-slate-455 block text-left">Description</label>
                                <textarea
                                  value={formDescription}
                                  onChange={(e) => setFormDescription(e.target.value)}
                                  rows={3}
                                  className="w-full text-xs p-2.5 border rounded-xl dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none resize-none"
                                />
                              </div>
                              {/* Form Icon selector grid hidden as per request */}

                              <div className="pt-4 border-t dark:border-slate-800 space-y-3">
                                <label className="text-[10px] font-bold uppercase text-slate-455 block text-left">Section Heading Order</label>
                                <p className="text-[10.5px] text-slate-500 font-semibold mb-2">Drag or use arrows to define the order in which sections appear when creating or editing a record.</p>
                                <div className="space-y-2">
                                  {computedSectionOrder.map((section, index) => (
                                    <div key={section} className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 border dark:border-slate-800 rounded-xl p-2.5 shadow-sm">
                                      <div className="flex items-center gap-2.5">
                                        <div className="text-[10px] font-black text-slate-400 w-4 text-center">{index + 1}</div>
                                        <div className="text-xs font-bold text-slate-700 dark:text-slate-200">{section}</div>
                                      </div>
                                      <div className="flex flex-col gap-0.5">
                                        <button
                                          onClick={() => handleReorderSection(index, 'up')}
                                          disabled={index === 0}
                                          className={`p-0.5 rounded ${index === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer text-slate-600 dark:text-slate-400'}`}
                                        >
                                          <ChevronDown className="h-3 w-3 rotate-180" />
                                        </button>
                                        <button
                                          onClick={() => handleReorderSection(index, 'down')}
                                          disabled={index === computedSectionOrder.length - 1}
                                          className={`p-0.5 rounded ${index === computedSectionOrder.length - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer text-slate-600 dark:text-slate-400'}`}
                                        >
                                          <ChevronDown className="h-3 w-3" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* ──────────────────────────────────
                            C. INTEGRATIONS TAB CONTENT
                            ────────────────────────────────── */}
                        {activeStep === 2 && builderTab === 'integrations' && (
                          <div className="space-y-5">
                            <div className="pb-4 border-b">
                              <h2 className="text-base font-extrabold text-slate-850 dark:text-slate-100">CRM Integration Channels</h2>
                              <p className="text-xs text-slate-450 font-semibold mt-0.5">Connect submissions to target webhook end-points or active workspace messaging pipelines.</p>
                            </div>
                            <div className="space-y-4">
                              {/* Slack Card */}
                              <div className="p-4 border dark:border-slate-800 rounded-2xl space-y-3">
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-2.5">
                                    <div className="h-9 w-9 rounded-xl bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                                      <Slack className="h-5 w-5" />
                                    </div>
                                    <div className="text-left font-semibold">
                                      <span className="font-extrabold text-xs block text-slate-850 dark:text-slate-150">Slack Submissions Feed</span>
                                      <span className="text-[10px] text-slate-400 font-semibold block">Post structured logs into teams channels.</span>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => {
                                      setIsSlackConnected(!isSlackConnected);
                                      setAlertSlackFeed(!isSlackConnected);
                                      toast.success(isSlackConnected ? "Slack disconnected." : "Slack integration configured.");
                                    }}
                                    className={`h-5 w-9 rounded-full p-0.5 transition-colors focus:outline-none ${isSlackConnected ? 'bg-purple-600' : 'bg-slate-250 dark:bg-slate-800'}`}
                                  >
                                    <div className={`h-4 w-4 rounded-full bg-white shadow transition-transform transform ${isSlackConnected ? 'translate-x-4' : 'translate-x-0'}`} />
                                  </button>
                                </div>
                                {isSlackConnected && (
                                  <div className="space-y-2 text-xs border-t pt-3 font-semibold text-left">
                                    <div className="space-y-1">
                                      <label className="text-[9.5px] uppercase font-bold text-slate-400">Slack Webhook URL</label>
                                      <input
                                        type="text"
                                        value={slackWebhook}
                                        onChange={(e) => setSlackWebhook(e.target.value)}
                                        className="w-full h-8 px-2.5 rounded-lg border text-xs bg-slate-50 dark:bg-slate-950 focus:outline-none dark:border-slate-800 text-slate-700 dark:text-slate-200"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[9.5px] uppercase font-bold text-slate-400">Target Channel</label>
                                      <input
                                        type="text"
                                        value={slackChannel}
                                        onChange={(e) => setSlackChannel(e.target.value)}
                                        className="w-full h-8 px-2.5 rounded-lg border text-xs bg-slate-50 dark:bg-slate-950 focus:outline-none dark:border-slate-800 text-slate-700 dark:text-slate-200"
                                      />
                                    </div>
                                    <Button
                                      onClick={() => toast.success(`Test message dispatched to Slack channel: ${slackChannel}!`)}
                                      variant="outline"
                                      size="sm"
                                      className="text-[10px] font-bold h-7.5 border-slate-250 cursor-pointer"
                                    >
                                      Test Payload
                                    </Button>
                                  </div>
                                )}
                              </div>

                              {/* Webhook Card */}
                              <div className="p-4 border dark:border-slate-800 rounded-2xl space-y-3">
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-2.5">
                                    <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                      <Globe className="h-5 w-5" />
                                    </div>
                                    <div className="text-left font-semibold">
                                      <span className="font-extrabold text-xs block text-slate-850 dark:text-slate-150">Outgoing Webhook URL</span>
                                      <span className="text-[10px] text-slate-400 font-semibold block">Post JSON datasets to external endpoints.</span>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => {
                                      setIsWebhookConnected(!isWebhookConnected);
                                      toast.success(isWebhookConnected ? "Webhook deactivated." : "Webhook connector activated.");
                                    }}
                                    className={`h-5 w-9 rounded-full p-0.5 transition-colors focus:outline-none ${isWebhookConnected ? 'bg-emerald-600' : 'bg-slate-250 dark:bg-slate-800'}`}
                                  >
                                    <div className={`h-4 w-4 rounded-full bg-white shadow transition-transform transform ${isWebhookConnected ? 'translate-x-4' : 'translate-x-0'}`} />
                                  </button>
                                </div>
                                {isWebhookConnected && (
                                  <div className="space-y-2 text-xs border-t pt-3 font-semibold text-left">
                                    <div className="space-y-1">
                                      <label className="text-[9.5px] uppercase font-bold text-slate-400">Endpoint Payload URL</label>
                                      <input
                                        type="text"
                                        value={webhookUrl}
                                        onChange={(e) => setWebhookUrl(e.target.value)}
                                        className="w-full h-8 px-2.5 rounded-lg border text-xs bg-slate-50 dark:bg-slate-950 focus:outline-none dark:border-slate-800 text-slate-700 dark:text-slate-200"
                                      />
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-[9.5px] uppercase font-bold text-slate-450">Content-Type</span>
                                      <select className="h-7 text-[10.5px] border rounded-md px-1 cursor-pointer dark:bg-slate-950 dark:border-slate-800 text-slate-700 dark:text-slate-200">
                                        <option>application/json</option>
                                        <option>application/x-www-form-urlencoded</option>
                                      </select>
                                    </div>
                                    <Button
                                      onClick={() => toast.success(`Simulated JSON payload POSTed to ${webhookUrl}!`)}
                                      variant="outline"
                                      size="sm"
                                      className="text-[10px] font-bold h-7.5 border-slate-250 cursor-pointer"
                                    >
                                      Test webhook URL
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* ──────────────────────────────────
                            D. SHARE & EMBED TAB CONTENT
                            ────────────────────────────────── */}
                        {activeStep === 2 && builderTab === 'share' && (
                          <div className="space-y-5">
                            <div className="pb-4 border-b">
                              <h2 className="text-base font-extrabold text-slate-850 dark:text-slate-100">Hosted Links & Embed Codes</h2>
                              <p className="text-xs text-slate-450 font-semibold mt-0.5">Expose this form online using direct web URLs or iframe source tags.</p>
                            </div>
                            <div className="space-y-4">

                              {/* Direct Link Widget */}
                              <div className="p-4 border dark:border-slate-800 rounded-xl space-y-2">
                                <label className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider text-left">Hosted Live Form Link</label>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    readOnly
                                    value={`http://localhost:3000/forms/live/${formName.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'lead-capture'}`}
                                    className="w-full h-9 px-3 rounded-lg border text-xs bg-slate-50 dark:bg-slate-950 dark:border-slate-800 font-mono text-slate-600 dark:text-slate-300 truncate focus:outline-none"
                                  />
                                  <Button
                                    onClick={() => {
                                      navigator.clipboard.writeText(`http://localhost:3000/forms/live/${formName.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'lead-capture'}`);
                                      toast.success("Link copied to clipboard!");
                                    }}
                                    variant="outline"
                                    className="h-9 px-3.5 rounded-lg border shrink-0 flex items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>

                              {/* Embed Frame Widget */}
                              <div className="p-4 border dark:border-slate-800 rounded-xl space-y-2">
                                <label className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider text-left">Embed Code (iFrame)</label>
                                <div className="flex gap-2">
                                  <textarea
                                    readOnly
                                    rows={2}
                                    value={`<iframe src="http://localhost:3000/forms/embed/${formName.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'lead-capture'}" width="100%" height="600" frameborder="0"></iframe>`}
                                    className="w-full p-2.5 rounded-lg border text-xs bg-slate-50 dark:bg-slate-950 dark:border-slate-800 font-mono text-slate-650 dark:text-slate-350 resize-none focus:outline-none"
                                  />
                                  <Button
                                    onClick={() => {
                                      navigator.clipboard.writeText(`<iframe src="http://localhost:3000/forms/embed/${formName.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'lead-capture'}" width="100%" height="600" frameborder="0"></iframe>`);
                                      toast.success("Embed tag copied!");
                                    }}
                                    variant="outline"
                                    className="h-9.5 px-3.5 rounded-lg border shrink-0 flex items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>

                              {/* Simulated QR Code SVG */}
                              <div className="p-4 border dark:border-slate-800 rounded-xl flex items-center gap-4 bg-slate-50/35 dark:bg-slate-950/20">
                                <div className="h-20 w-20 bg-white border rounded-lg flex items-center justify-center p-1.5 shrink-0 dark:bg-slate-900 dark:border-slate-800 shadow-sm">
                                  <QrCode className="h-16 w-16 text-slate-800 dark:text-slate-200" />
                                </div>
                                <div className="text-left font-semibold">
                                  <h4 className="text-xs font-bold text-slate-805 dark:text-slate-100">Simulated QR Code</h4>
                                  <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">Scan with mobile devices to verify styling behaviors immediately.</p>
                                  <Button
                                    onClick={() => toast.success("QR Code image downloaded successfully!")}
                                    variant="outline"
                                    size="sm"
                                    className="text-[9.5px] font-bold h-7.5 border-slate-250 mt-2 cursor-pointer hover:bg-white dark:hover:bg-slate-900"
                                  >
                                    Download Image
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* ──────────────────────────────────
                            E. SUBMISSIONS TAB CONTENT
                            ────────────────────────────────── */}
                        {activeStep === 2 && builderTab === 'submissions' && (
                          <div className="space-y-4">
                            <div className="pb-3 border-b flex justify-between items-center">
                              <div className="text-left">
                                <h2 className="text-base font-extrabold text-slate-850 dark:text-slate-100">Submissions Log</h2>
                                <p className="text-xs text-slate-450 font-semibold mt-0.5">View active incoming submissions mapped dynamically to fields.</p>
                              </div>
                            </div>

                            {/* Dynamic columns table */}
                            <div className="overflow-x-auto border rounded-xl bg-slate-50/20 dark:bg-slate-950/10 dark:border-slate-850">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                  <tr className="bg-slate-50 dark:bg-slate-900/60 border-b dark:border-slate-800 font-extrabold text-[10px] uppercase text-slate-455">
                                    <th className="py-2.5 px-3">Entry ID</th>
                                    {canvasFields.map(f => (
                                      <th key={f.id} className="py-2.5 px-3 whitespace-nowrap">{f.label}</th>
                                    ))}
                                    <th className="py-2.5 px-3 whitespace-nowrap">Submitted Date</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {canvasFields.length === 0 ? (
                                    <tr>
                                      <td colSpan={2} className="py-8 text-center text-slate-405">Add fields to see columns.</td>
                                    </tr>
                                  ) : (
                                    getMockSubmissions().map((row) => (
                                      <tr key={row.id} className="border-b dark:border-slate-850 hover:bg-slate-50/30 dark:hover:bg-slate-850/20 font-medium">
                                        <td className="py-3 px-3 font-bold text-slate-700 dark:text-slate-300">{row.id}</td>
                                        {canvasFields.map((f) => (
                                          <td key={f.id} className="py-3 px-3 truncate max-w-[150px] text-slate-600 dark:text-slate-300">{row[f.id]}</td>
                                        ))}
                                        <td className="py-3 px-3 whitespace-nowrap text-slate-400">{row.date}</td>
                                      </tr>
                                    ))
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* ──────────────────────────────────
                            F. STEP 3: LAYOUT & LOGIC CANVAS
                            ────────────────────────────────── */}
                        {activeStep === 3 && (
                          <div className="space-y-5">
                            <div className="pb-4 border-b">
                              <h2 className="text-base font-extrabold text-slate-850 dark:text-slate-100">Layout Rules Preview</h2>
                              <p className="text-xs text-slate-450 font-semibold mt-0.5">Visual representation of fields with applied rules.</p>
                            </div>
                            <div className="space-y-3">
                              {canvasFields.map((field) => {
                                const matchedRules = logicRules.filter(r => r.targetField === field.label);
                                return (
                                  <div key={field.id} className="p-3.5 border rounded-xl bg-slate-50/40 dark:bg-slate-950/20 dark:border-slate-850 flex justify-between items-center text-xs">
                                    <div className="text-left font-semibold">
                                      <div className="font-extrabold text-slate-700 dark:text-slate-300">{field.label}</div>
                                      <span className="text-[10px] text-slate-400">Type: {field.type}</span>
                                    </div>
                                    <div className="flex gap-1.5">
                                      {matchedRules.map(r => (
                                        <Badge key={r.id} className="bg-amber-500/10 text-amber-600 border-0 font-bold uppercase text-[9px] py-0.5 px-2">
                                          {r.thenAction === 'hide' ? 'Hidden conditionally' : 'Shown conditionally'}
                                        </Badge>
                                      ))}
                                      {matchedRules.length === 0 && (
                                        <Badge className="bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-0 text-[9px] py-0.5 px-2">
                                          No Rules
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* ──────────────────────────────────
                            G. STEP 4: NOTIFICATIONS CANVAS
                            ────────────────────────────────── */}
                        {activeStep === 4 && (
                          <div className="space-y-5">
                            <div className="pb-3 border-b">
                              <h2 className="text-base font-extrabold text-slate-850 dark:text-slate-100">Visual Email Template Preview</h2>
                              <p className="text-xs text-slate-450 font-semibold mt-0.5">Real-time binding layout of notifications dispatched upon form submit.</p>
                            </div>
                            <div className="border dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm text-xs font-semibold">
                              <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b dark:border-slate-800 space-y-1 text-left">
                                <div className="text-slate-400 font-bold uppercase text-[9px]">From:</div>
                                <div className="font-bold text-slate-700 dark:text-slate-350">Retail Notifications System &lt;notify@pegatto.system&gt;</div>
                                <div className="text-slate-400 font-bold uppercase text-[9px] pt-1">To:</div>
                                <div className="font-bold text-slate-805 dark:text-slate-100 bg-slate-250/50 dark:bg-slate-950 px-2 py-0.5 rounded-md inline-block">{alertEmails || 'Recipient List Empty'}</div>
                                <div className="text-slate-400 font-bold uppercase text-[9px] pt-1">Subject:</div>
                                <div className="font-bold text-slate-800 dark:text-slate-200">[New Submission Log] - {formName}</div>
                              </div>
                              <div className="p-5 text-left space-y-4">
                                <p className="text-slate-600 dark:text-slate-400">Hello team,</p>
                                <p className="text-slate-600 dark:text-slate-400">A new form entry has been submitted for CRM Module <strong>{formModule}</strong>. See fields details log:</p>

                                <div className="border rounded-xl overflow-hidden dark:border-slate-800">
                                  <table className="w-full text-left text-xs">
                                    <tbody>
                                      {canvasFields.map((f, fIdx) => (
                                        <tr key={f.id} className={`border-b dark:border-slate-800 ${fIdx % 2 === 0 ? 'bg-slate-50/50 dark:bg-slate-900' : ''}`}>
                                          <td className="py-2.5 px-4 font-bold text-slate-400 w-1/3">{f.label}</td>
                                          <td className="py-2.5 px-4 font-mono text-slate-750 dark:text-slate-300">{"{"}{f.label.toLowerCase().replace(/\s+/g, '_')}{"}"}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                                <p className="text-slate-405 text-[10px]">Submitted via hosted web endpoint. IP tracking logged.</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* ──────────────────────────────────
                            H. STEP 5: REVIEW & PUBLISH CANVAS
                            ────────────────────────────────── */}
                        {activeStep === 5 && (
                          <div className="space-y-5">
                            <div className="pb-3 border-b flex justify-between items-center">
                              <div className="text-left">
                                <h2 className="text-base font-extrabold text-slate-850 dark:text-slate-100">Live Interactive Sandbox Preview</h2>
                                <p className="text-xs text-slate-450 font-semibold mt-0.5">Test typing parameters and verify conditional logic behaviors live.</p>
                              </div>
                            </div>

                            {/* Active Sandbox Form */}
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();

                                const errors: Record<string, string> = {};
                                let hasErrors = false;

                                canvasFields.forEach((field) => {
                                  // check visibility rule
                                  let isHidden = false;
                                  const rules = logicRules.filter(r => r.targetField === field.label && r.thenAction === 'hide');
                                  for (const r of rules) {
                                    const sourceField = canvasFields.find(f => f.label === r.ifField);
                                    if (sourceField) {
                                      const sourceValue = sandboxValues[sourceField.id] || '';
                                      if (r.isCondition === 'empty' && sourceValue.trim() === '') {
                                        isHidden = true;
                                      } else if (r.isCondition === 'filled' && sourceValue.trim() !== '') {
                                        isHidden = true;
                                      }
                                    }
                                  }

                                  if (!isHidden && field.required && !(sandboxValues[field.id] || '').trim()) {
                                    errors[field.id] = `${field.label} is required.`;
                                    hasErrors = true;
                                  }
                                });

                                if (hasErrors) {
                                  setSandboxErrors(errors);
                                  toast.error("Please fill in all required fields.");
                                  return;
                                }

                                setSubmittedPayload({
                                  formId: 'MOCK-PREVIEW',
                                  formName,
                                  module: formModule,
                                  timestamp: new Date().toISOString(),
                                  fields: sandboxValues
                                });
                                setIsSandboxSubmitted(true);
                                toast.success("Form submission validation success!");
                              }}
                              className="p-5 border dark:border-slate-800 rounded-2xl space-y-4 bg-white dark:bg-slate-900 text-xs font-semibold text-left shadow-xs w-full"
                            >
                              <div className="pb-3 border-b dark:border-slate-800">
                                <h3 className="font-bold text-sm text-slate-850 dark:text-slate-100">{formName}</h3>
                                <p className="text-[11px] text-slate-500 font-medium mt-0.5">{formDescription}</p>
                              </div>

                              <div className="space-y-3.5">
                                {canvasFields.map((field) => {

                                  // Determine conditional rule hiding
                                  let isHidden = false;
                                  const rules = logicRules.filter(r => r.targetField === field.label && r.thenAction === 'hide');
                                  for (const r of rules) {
                                    const sourceField = canvasFields.find(f => f.label === r.ifField);
                                    if (sourceField) {
                                      const sourceValue = sandboxValues[sourceField.id] || '';
                                      if (r.isCondition === 'empty' && sourceValue.trim() === '') {
                                        isHidden = true;
                                      } else if (r.isCondition === 'filled' && sourceValue.trim() !== '') {
                                        isHidden = true;
                                      }
                                    }
                                  }

                                  if (isHidden) return null;

                                  if (field.type === 'section') {
                                    return (
                                      <div key={field.id} className="pt-4 pb-1 border-b border-slate-200 dark:border-slate-800 mt-6 first:mt-2 text-left">
                                        <h3 className="text-xs font-bold text-slate-850 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                                          <Split className="h-3.5 w-3.5 text-blue-500" />
                                          {field.label}
                                        </h3>
                                        {field.helpText && (
                                          <p className="text-[10px] text-slate-455 dark:text-slate-500 font-medium mt-0.5">
                                            {field.helpText}
                                          </p>
                                        )}
                                      </div>
                                    );
                                  }

                                  const hasError = sandboxErrors[field.id];

                                  return (
                                    <div key={field.id} className="space-y-1 text-left">
                                      <div className="flex justify-between items-center">
                                        <label className="text-[10px] font-bold text-slate-455 dark:text-slate-400 uppercase flex items-center gap-1">
                                          {field.label}
                                          {field.required && <span className="text-red-500 font-bold">*</span>}
                                        </label>
                                        {hasError && (
                                          <span className="text-[10px] text-red-500 font-bold flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3" />
                                            {hasError}
                                          </span>
                                        )}
                                      </div>

                                      {field.type === 'text' && (
                                        <input
                                          type="text"
                                          required={field.required}
                                          value={sandboxValues[field.id] || ''}
                                          onChange={(e) => {
                                            setSandboxValues({ ...sandboxValues, [field.id]: e.target.value });
                                            if (sandboxErrors[field.id]) {
                                              setSandboxErrors({ ...sandboxErrors, [field.id]: '' });
                                            }
                                          }}
                                          placeholder={field.placeholder}
                                          className={`w-full text-xs h-9 px-3 rounded-lg border bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none ${hasError ? 'border-red-500 focus:ring-red-400' : 'dark:border-slate-805'
                                            }`}
                                        />
                                      )}

                                      {field.type === 'email' && (
                                        <input
                                          type="email"
                                          required={field.required}
                                          value={sandboxValues[field.id] || ''}
                                          onChange={(e) => {
                                            setSandboxValues({ ...sandboxValues, [field.id]: e.target.value });
                                            if (sandboxErrors[field.id]) {
                                              setSandboxErrors({ ...sandboxErrors, [field.id]: '' });
                                            }
                                          }}
                                          placeholder={field.placeholder}
                                          className={`w-full text-xs h-9 px-3 rounded-lg border bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none ${hasError ? 'border-red-500 focus:ring-red-400' : 'dark:border-slate-805'
                                            }`}
                                        />
                                      )}

                                      {field.type === 'phone' && (
                                        <div className="flex gap-2">
                                          <div className="h-9 px-2.5 rounded-lg border dark:border-slate-805 bg-slate-50 dark:bg-slate-955 flex items-center gap-1 text-xs shrink-0 cursor-pointer text-slate-500">
                                            <span>🇺🇸</span>
                                            <ChevronDown className="h-3.5 w-3.5 text-slate-450" />
                                          </div>
                                          <input
                                            type="text"
                                            required={field.required}
                                            value={sandboxValues[field.id] || ''}
                                            onChange={(e) => {
                                              setSandboxValues({ ...sandboxValues, [field.id]: e.target.value });
                                              if (sandboxErrors[field.id]) {
                                                setSandboxErrors({ ...sandboxErrors, [field.id]: '' });
                                              }
                                            }}
                                            placeholder={field.placeholder}
                                            className={`w-full text-xs h-9 px-3 rounded-lg border bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none ${hasError ? 'border-red-500 focus:ring-red-400' : 'dark:border-slate-850'
                                              }`}
                                          />
                                        </div>
                                      )}

                                      {field.type === 'dropdown' && (
                                        <select
                                          value={sandboxValues[field.id] || ''}
                                          onChange={(e) => {
                                            setSandboxValues({ ...sandboxValues, [field.id]: e.target.value });
                                            if (sandboxErrors[field.id]) {
                                              setSandboxErrors({ ...sandboxErrors, [field.id]: '' });
                                            }
                                          }}
                                          required={field.required}
                                          className={`w-full text-xs h-9 px-3 rounded-lg border bg-white dark:bg-slate-955 text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer ${hasError ? 'border-red-500 focus:ring-red-400' : 'dark:border-slate-805'
                                            }`}
                                        >
                                          <option value="">Select option...</option>
                                          {field.options && field.options.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                          ))}
                                          {!field.options && (
                                            <>
                                              <option>Consulting Request</option>
                                              <option>Setup License Key</option>
                                              <option>Event Dinners Ticket</option>
                                            </>
                                          )}
                                        </select>
                                      )}

                                      {field.type === 'textarea' && (
                                        <textarea
                                          value={sandboxValues[field.id] || ''}
                                          onChange={(e) => {
                                            setSandboxValues({ ...sandboxValues, [field.id]: e.target.value });
                                            if (sandboxErrors[field.id]) {
                                              setSandboxErrors({ ...sandboxErrors, [field.id]: '' });
                                            }
                                          }}
                                          required={field.required}
                                          placeholder={field.placeholder}
                                          rows={3}
                                          className={`w-full text-xs p-2.5 rounded-lg border bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none resize-none ${hasError ? 'border-red-500 focus:ring-red-400' : 'dark:border-slate-850'
                                            }`}
                                        />
                                      )}

                                      {(field.type === 'date' || field.type === 'datetime' || field.type === 'time') && (
                                        <input
                                          type={field.type === 'time' ? 'time' : field.type === 'datetime' ? 'datetime-local' : 'date'}
                                          required={field.required}
                                          value={sandboxValues[field.id] || ''}
                                          onChange={(e) => {
                                            setSandboxValues({ ...sandboxValues, [field.id]: e.target.value });
                                            if (sandboxErrors[field.id]) {
                                              setSandboxErrors({ ...sandboxErrors, [field.id]: '' });
                                            }
                                          }}
                                          className={`w-full text-xs h-9 px-3 rounded-lg border bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none ${hasError ? 'border-red-500 focus:ring-red-400' : 'dark:border-slate-805'}`}
                                        />
                                      )}

                                      {(field.type === 'checkbox' || field.type === 'radio') && (
                                        <div className="space-y-2 mt-2">
                                          {(field.options && field.options.length > 0 ? field.options : ['Option 1']).map((opt, oIdx) => (
                                            <div key={oIdx} className="flex items-center gap-2">
                                              <input
                                                type={field.type}
                                                name={`sandbox-${field.id}`}
                                                value={opt}
                                                checked={field.type === 'radio' ? sandboxValues[field.id] === opt : (sandboxValues[field.id] || '').split(',').includes(opt)}
                                                onChange={(e) => {
                                                  if (field.type === 'radio') {
                                                    setSandboxValues({ ...sandboxValues, [field.id]: opt });
                                                  } else {
                                                    let current = (sandboxValues[field.id] || '').split(',').filter(Boolean);
                                                    if (e.target.checked) current.push(opt);
                                                    else current = current.filter(c => c !== opt);
                                                    setSandboxValues({ ...sandboxValues, [field.id]: current.join(',') });
                                                  }
                                                  if (sandboxErrors[field.id]) {
                                                    setSandboxErrors({ ...sandboxErrors, [field.id]: '' });
                                                  }
                                                }}
                                                className="h-3.5 w-3.5 cursor-pointer"
                                              />
                                              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{opt}</span>
                                            </div>
                                          ))}
                                        </div>
                                      )}

                                      {field.type === 'multi-select' && (
                                        <select
                                          multiple
                                          value={(sandboxValues[field.id] || '').split(',').filter(Boolean)}
                                          onChange={(e) => {
                                            const selected = Array.from(e.target.selectedOptions, option => option.value);
                                            setSandboxValues({ ...sandboxValues, [field.id]: selected.join(',') });
                                            if (sandboxErrors[field.id]) {
                                              setSandboxErrors({ ...sandboxErrors, [field.id]: '' });
                                            }
                                          }}
                                          required={field.required}
                                          className={`w-full text-xs p-2 rounded-lg border bg-white dark:bg-slate-955 text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer ${hasError ? 'border-red-500 focus:ring-red-400' : 'dark:border-slate-805'}`}
                                          style={{ minHeight: '80px' }}
                                        >
                                          {(field.options && field.options.length > 0 ? field.options : ['Option 1', 'Option 2']).map(opt => (
                                            <option key={opt} value={opt} className="p-1 mb-0.5">{opt}</option>
                                          ))}
                                        </select>
                                      )}

                                      {field.type === 'number' && (
                                        <input
                                          type="number"
                                          required={field.required}
                                          value={sandboxValues[field.id] || ''}
                                          onChange={(e) => {
                                            setSandboxValues({ ...sandboxValues, [field.id]: e.target.value });
                                            if (sandboxErrors[field.id]) {
                                              setSandboxErrors({ ...sandboxErrors, [field.id]: '' });
                                            }
                                          }}
                                          placeholder={field.placeholder}
                                          className={`w-full text-xs h-9 px-3 rounded-lg border bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none ${hasError ? 'border-red-500 focus:ring-red-400' : 'dark:border-slate-805'}`}
                                        />
                                      )}

                                      {field.type !== 'text' && field.type !== 'email' && field.type !== 'phone' && field.type !== 'dropdown' && field.type !== 'textarea' && field.type !== 'date' && field.type !== 'datetime' && field.type !== 'time' && field.type !== 'checkbox' && field.type !== 'radio' && field.type !== 'multi-select' && field.type !== 'number' && (
                                        <div className="p-3 border border-dashed rounded-lg bg-slate-50 dark:bg-slate-950 dark:border-slate-805 text-[10px] text-slate-400 text-center font-bold">
                                          Interactive {field.label} Simulator
                                        </div>
                                      )}

                                      {field.helpText && (
                                        <span className="text-[10px] text-slate-450 dark:text-slate-550 font-semibold block">
                                          {field.helpText}
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>

                              <div className="border-t pt-4 mt-6">
                                <Button
                                  type="submit"
                                  style={{ backgroundColor: primaryColor }}
                                  className="w-full text-xs font-bold text-white h-10 rounded-xl cursor-pointer shadow-sm hover:opacity-95"
                                >
                                  Submit Form Sandbox
                                </Button>
                              </div>
                            </form>
                          </div>
                        )}

                      </div>
                    </div>

                    {/* Submit Button preview (Only in Step 2 builder view) */}
                    {activeStep === 2 && builderTab === 'builder' && (
                      <div className="border-t pt-5 mt-6">
                        <Button
                          style={{ backgroundColor: primaryColor }}
                          className="w-full text-xs font-bold text-white h-10 rounded-xl cursor-default shadow-xs font-bold"
                        >
                          Submit
                        </Button>
                      </div>
                    )}

                  </div>

                  {/* ────────────────────────────────────────────────────────
                      COLUMN 3: RIGHT SIDEBAR
                      ──────────────────────────────────────────────────────── */}
                  <div className="col-span-1 lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.01)] min-h-[550px] flex flex-col justify-between text-left">

                    {/* Render Step 2 Settings Panel */}
                    {activeStep === 2 && builderTab === 'builder' && (
                      <div className="flex-1 flex flex-col justify-between h-full">
                        <div>
                          <div className="flex border-b dark:border-slate-800 pb-3 mb-4">
                            <button className="flex-1 text-center font-bold text-xs py-1 text-blue-600 border-b-2 border-blue-500">
                              Field Settings
                            </button>
                            <button
                              onClick={() => { setBuilderTab('settings'); }}
                              className="flex-1 text-center font-bold text-xs py-1 text-slate-450 hover:text-slate-655 cursor-pointer"
                            >
                              Form Settings
                            </button>
                          </div>

                          {selectedField ? (
                            selectedField.isStandard ? (
                              <div className="flex flex-col items-center justify-center h-64 text-center text-slate-500 p-6 border border-dashed rounded-xl bg-slate-50 dark:bg-slate-900/50 dark:border-slate-800">
                                <Lock className="h-10 w-10 mb-4 text-slate-300 dark:text-slate-600" />
                                <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">Default Field</h3>
                                <p className="text-xs mt-2 font-medium">This is a core system field. Its properties and settings cannot be modified or deleted to preserve system integrity.</p>
                              </div>
                            ) : (
                              <div className="space-y-4 text-xs text-left font-semibold">

                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-bold text-slate-450 dark:text-slate-450 uppercase block">Field Type</label>
                                  <div className="relative">
                                    <select
                                      value={selectedField.type}
                                      onChange={(e) => handleUpdateFieldSettings({ type: e.target.value })}
                                      className="w-full text-xs h-9 pl-3 pr-8 rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 focus:outline-none cursor-pointer appearance-none text-slate-850 dark:text-slate-200"
                                    >
                                      <option value="text">Text (First/Last)</option>
                                      <option value="textarea">Text Area</option>
                                      <option value="number">Number</option>
                                      <option value="email">Email</option>
                                      <option value="phone">Phone</option>
                                      <option value="dropdown">Dropdown</option>
                                      <option value="multi-select">Multi Select</option>
                                      <option value="date">Date</option>
                                      <option value="datetime">Date & Time</option>
                                      <option value="time">Time</option>
                                      <option value="checkbox">Checkbox</option>
                                      <option value="radio">Radio Button</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                                  </div>
                                </div>

                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-bold text-slate-450 dark:text-slate-450 uppercase block">Field Label</label>
                                  <input
                                    type="text"
                                    value={selectedField.label || ''}
                                    onChange={(e) => handleUpdateFieldSettings({ label: e.target.value })}
                                    className="w-full text-xs h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 focus:outline-none text-slate-855 dark:text-slate-200"
                                  />
                                </div>

                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-bold text-slate-450 dark:text-slate-450 uppercase block">Placeholder</label>
                                  <input
                                    type="text"
                                    value={selectedField.placeholder || ''}
                                    onChange={(e) => handleUpdateFieldSettings({ placeholder: e.target.value })}
                                    className="w-full text-xs h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 focus:outline-none text-slate-855 dark:text-slate-200"
                                  />

                                </div>

                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-bold text-slate-450 dark:text-slate-450 uppercase block">Help Text</label>
                                  <input
                                    type="text"
                                    value={selectedField.helpText || ''}
                                    onChange={(e) => handleUpdateFieldSettings({ helpText: e.target.value })}
                                    className="w-full text-xs h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 focus:outline-none text-slate-855 dark:text-slate-200"
                                  />
                                </div>

                                <div className="flex items-center justify-between pt-2.5 border-t dark:border-slate-850">
                                  <span className="text-[10px] font-bold text-slate-450 uppercase">Required Field</span>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateFieldSettings({ required: !selectedField.required })}
                                    className={`h-5 w-9 rounded-full p-0.5 transition-colors focus:outline-none ${selectedField.required ? 'bg-blue-600' : 'bg-slate-250 dark:bg-slate-800'}`}
                                  >
                                    <div className={`h-4 w-4 rounded-full bg-white shadow-md transition-transform transform ${selectedField.required ? 'translate-x-4' : 'translate-x-0'}`} />
                                  </button>
                                </div>

                                <div className="space-y-1.5 pt-2.5 border-t dark:border-slate-850">
                                  <label className="text-[10px] font-bold text-slate-450 dark:text-slate-450 uppercase block">Section Placement</label>
                                  <div className="relative">
                                    {/* Standard placements are module-specific */}
                                    {(() => {
                                      let standardPlacements = ['Basic Information', 'Related Information', 'Description / Notes'];
                                      if (formModule === 'Leads') {
                                        standardPlacements = ['Lead Information', 'Additional Information'];
                                      } else if (formModule === 'Deals') {
                                        standardPlacements = ['Deal Information', 'Additional Information'];
                                      } else if (formModule === 'Companies') {
                                        standardPlacements = ['Company Information', 'Address Information', 'Additional Information'];
                                      }

                                      // Extract unique custom headings that exist in the form
                                      const customSections = Array.from(new Set(
                                        canvasFields
                                          .map(f => f.sectionPlacement)
                                          .filter((sp): sp is string => typeof sp === 'string' && !standardPlacements.includes(sp) && sp !== 'New Section')
                                      ));

                                      const currentPlacement = selectedField.sectionPlacement || '';
                                      const isStandard = standardPlacements.includes(currentPlacement);
                                      const isCustom = customSections.includes(currentPlacement);

                                      // If it's a known standard or custom section, select it. Otherwise, it's 'New Section'
                                      const selectValue = (isStandard || isCustom) ? currentPlacement : 'New Section';

                                      return (
                                        <select
                                          value={selectValue}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === 'New Section') {
                                              handleUpdateFieldSettings({
                                                sectionPlacement: 'New Section',
                                                customSectionName: ''
                                              });
                                            } else {
                                              // By setting customSectionName, we mark this field as having a manual override,
                                              // preventing auto-sweeping logic from overwriting it.
                                              handleUpdateFieldSettings({
                                                sectionPlacement: val,
                                                customSectionName: val
                                              });
                                            }
                                          }}
                                          className="w-full text-xs h-9 pl-3 pr-8 rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 focus:outline-none cursor-pointer appearance-none text-slate-850 dark:text-slate-200"
                                        >
                                          {standardPlacements.map(sp => (
                                            <option key={sp} value={sp}>{sp}</option>
                                          ))}
                                          {customSections.length > 0 && (
                                            <optgroup label="Custom Sections">
                                              {customSections.map(cs => (
                                                <option key={cs as string} value={cs as string}>{cs as string}</option>
                                              ))}
                                            </optgroup>
                                          )}
                                          <option value="New Section">New Section (Custom Heading)</option>
                                        </select>
                                      );
                                    })()}
                                    <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                                  </div>
                                </div>

                                {(selectedField.sectionPlacement === 'New Section' ||
                                  (selectedField.sectionPlacement &&
                                    !['Basic Information', 'Related Information', 'Description / Notes', 'Lead Information', 'Deal Information', 'Company Information', 'Address Information', 'Additional Information'].includes(selectedField.sectionPlacement))) && (
                                    <div className="space-y-1.5">
                                      <label className="text-[10px] font-bold text-slate-450 dark:text-slate-450 uppercase block">Section Heading Name</label>
                                      <input
                                        type="text"
                                        placeholder="e.g. Financial Details"
                                        value={
                                          selectedField.customSectionName ||
                                          (['Basic Information', 'Related Information', 'Description / Notes', 'Lead Information', 'Deal Information', 'Company Information', 'Address Information', 'Additional Information'].includes(selectedField.sectionPlacement || '')
                                            ? ''
                                            : selectedField.sectionPlacement) ||
                                          ''
                                        }
                                        onChange={(e) => {
                                          const name = e.target.value;
                                          handleUpdateFieldSettings({
                                            customSectionName: name,
                                            sectionPlacement: name || 'New Section'
                                          });
                                        }}
                                        className="w-full text-xs h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 focus:outline-none text-slate-855 dark:text-slate-200"
                                      />
                                    </div>
                                  )}

                                {(selectedField.type === 'dropdown' || selectedField.type === 'radio' || selectedField.type === 'checkbox' || selectedField.type === 'multi-select') && (
                                  <div className="space-y-2 pt-2 border-t dark:border-slate-850 mt-4">
                                    <label className="text-[10px] font-bold text-slate-450 dark:text-slate-450 uppercase block">Field Options</label>
                                    <div className="space-y-1.5">
                                      {(selectedField.options || []).map((opt, idx) => (
                                        <div key={idx} className="flex gap-1.5 items-center">
                                          <input
                                            type="text"
                                            value={opt}
                                            onChange={(e) => {
                                              const newOpts = [...(selectedField.options || [])];
                                              newOpts[idx] = e.target.value;
                                              handleUpdateFieldSettings({ options: newOpts });
                                            }}
                                            className="flex-1 text-xs h-8 px-2 rounded border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 focus:outline-none text-slate-855 dark:text-slate-200"
                                          />
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-rose-500 hover:bg-rose-50 hover:text-rose-600 rounded"
                                            onClick={() => {
                                              const newOpts = [...(selectedField.options || [])];
                                              newOpts.splice(idx, 1);
                                              handleUpdateFieldSettings({ options: newOpts });
                                            }}
                                          >
                                            <X className="h-3.5 w-3.5" />
                                          </Button>
                                        </div>
                                      ))}
                                      <Button
                                        variant="outline"
                                        className="w-full h-8 mt-2 border-dashed border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 flex items-center justify-center gap-1 hover:bg-slate-50 dark:hover:bg-slate-800"
                                        onClick={() => {
                                          const newOpts = [...(selectedField.options || []), `Option ${(selectedField.options?.length || 0) + 1}`];
                                          handleUpdateFieldSettings({ options: newOpts });
                                        }}
                                      >
                                        <Plus className="h-3.5 w-3.5" />
                                        Add Option
                                      </Button>
                                    </div>
                                  </div>
                                )}

                                {selectedField.type === 'email' && (
                                  <div className="flex items-center gap-1.5 pt-2">
                                    <input
                                      type="checkbox"
                                      id="email-valid"
                                      checked={!!selectedField.validation}
                                      onChange={(e) => handleUpdateFieldSettings({ validation: e.target.checked ? 'Valid email address' : undefined })}
                                      className="h-3.5 w-3.5 border rounded cursor-pointer"
                                    />
                                    <label htmlFor="email-valid" className="text-[10.5px] font-bold text-slate-500 cursor-pointer">
                                      Valid email address
                                    </label>
                                  </div>
                                )}

                              </div>
                            )
                          ) : (
                            <div className="py-12 text-center text-slate-405 font-bold text-xs">
                              Select a field in the canvas to configure settings.
                            </div>
                          )}
                        </div>

                        {selectedField && !selectedField.isStandard && (
                          <div className="border-t pt-4 mt-6 dark:border-slate-850">
                            <Button
                              onClick={handleDeleteSelectedField}
                              variant="outline"
                              className="w-full h-9 rounded-xl border border-red-200 hover:bg-red-50 text-red-600 hover:text-red-700 flex items-center justify-center gap-1 text-xs font-bold cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete Field
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Step 2, settings tab sidebar settings */}
                    {activeStep === 2 && builderTab === 'settings' && (
                      <div className="space-y-4 text-xs text-left">
                        <h3 className="text-xs font-extrabold text-slate-850 dark:text-slate-150 uppercase pb-2 border-b dark:border-slate-850 font-bold">Settings Overview</h3>
                        <div className="space-y-2 font-semibold">
                          <div className="flex justify-between py-1 border-b dark:border-slate-800">
                            <span className="text-slate-400">Total Fields</span>
                            <span className="font-bold text-slate-800 dark:text-white">{canvasFields.length}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b dark:border-slate-800">
                            <span className="text-slate-400">CRM Module</span>
                            <span className="font-bold text-blue-600">{formModule}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 2, integrations tab sidebar right */}
                    {activeStep === 2 && builderTab === 'integrations' && (
                      <div className="space-y-4 text-xs font-semibold">
                        <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase pb-2 border-b dark:border-slate-850 font-bold">Configuration log</h3>
                        <div className="p-3 bg-slate-50/50 dark:bg-slate-950/20 border rounded-xl font-mono text-[9.5px] text-slate-400 space-y-1 leading-relaxed dark:border-slate-800">
                          <div>[10:30:15] API initialized.</div>
                          <div>[11:00:22] Slack channels fetched.</div>
                          <div>[12:15:00] Salesforce mapping verified.</div>
                        </div>
                      </div>
                    )}

                    {/* Step 2, share tab sidebar right */}
                    {activeStep === 2 && builderTab === 'share' && (
                      <div className="space-y-4 text-xs font-semibold">
                        <h3 className="text-xs font-extrabold text-slate-855 dark:text-slate-150 uppercase pb-2 border-b dark:border-slate-850">Share Security</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span>Private Access</span>
                            <button className="h-5 w-9 rounded-full bg-slate-250 dark:bg-slate-800 p-0.5"><div className="h-4 w-4 rounded-full bg-white transition-transform" /></button>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Enable Password</span>
                            <button className="h-5 w-9 rounded-full bg-slate-250 dark:bg-slate-800 p-0.5"><div className="h-4 w-4 rounded-full bg-white transition-transform" /></button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 2, submissions tab sidebar right */}
                    {activeStep === 2 && builderTab === 'submissions' && (
                      <div className="space-y-4 text-xs font-semibold">
                        <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase pb-2 border-b dark:border-slate-850">Export Options</h3>
                        <div className="space-y-2">
                          <Button
                            onClick={() => toast.success("Simulated CSV dataset downloaded.")}
                            variant="outline"
                            className="w-full text-xs font-bold h-9.5 rounded-xl border border-slate-250 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
                          >
                            Export to CSV
                          </Button>
                          <Button
                            onClick={() => toast.success("Simulated JSON payload downloaded.")}
                            variant="outline"
                            className="w-full text-xs font-bold h-9.5 rounded-xl border border-slate-250 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
                          >
                            Export to JSON
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Step 3 (Logic) Rule Builder Form */}
                    {activeStep === 3 && (
                      <form onSubmit={handleAddRule} className="space-y-4 text-xs font-semibold text-left">
                        <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase pb-2 border-b dark:border-slate-850">Rule Builder</h3>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-450 uppercase">If Field</label>
                          <select
                            value={logicIfField}
                            onChange={(e) => setLogicIfField(e.target.value)}
                            className="w-full text-xs h-9 px-3 border rounded-xl dark:border-slate-850 dark:bg-slate-955 text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                          >
                            {canvasFields.map(f => (
                              <option key={f.id} value={f.label}>{f.label}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-450 uppercase">Is Condition</label>
                          <select
                            value={logicCondition}
                            onChange={(e) => setLogicCondition(e.target.value)}
                            className="w-full text-xs h-9 px-3 border rounded-xl dark:border-slate-850 dark:bg-slate-955 text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                          >
                            <option value="empty">Is Empty</option>
                            <option value="filled">Is Filled / Typed</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-450 uppercase">Then Action</label>
                          <select
                            value={logicAction}
                            onChange={(e) => setLogicAction(e.target.value)}
                            className="w-full text-xs h-9 px-3 border rounded-xl dark:border-slate-850 dark:bg-slate-955 text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                          >
                            <option value="hide">Hide Target Field</option>
                            <option value="show">Show Target Field</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-450 uppercase">Target Field</label>
                          <select
                            value={logicTargetField}
                            onChange={(e) => setLogicTargetField(e.target.value)}
                            className="w-full text-xs h-9 px-3 border rounded-xl dark:border-slate-850 dark:bg-slate-955 text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                          >
                            {canvasFields.map(f => (
                              <option key={f.id} value={f.label}>{f.label}</option>
                            ))}
                          </select>
                        </div>

                        <div className="pt-2">
                          <Button
                            type="submit"
                            style={{ backgroundColor: primaryColor }}
                            className="w-full text-xs font-bold text-white h-9 rounded-xl cursor-pointer hover:opacity-95"
                          >
                            Add Rule Condition
                          </Button>
                        </div>
                      </form>
                    )}

                    {/* Step 4 (Notifications) Right Settings */}
                    {activeStep === 4 && (
                      <div className="space-y-4 text-xs font-semibold text-left">
                        <h3 className="text-xs font-extrabold text-slate-805 dark:text-slate-200 uppercase pb-2 border-b dark:border-slate-850">Settings</h3>

                        <div className="flex items-center justify-between">
                          <span>Alert Record Owner</span>
                          <button
                            onClick={() => setAlertRecordOwner(!alertRecordOwner)}
                            className={`h-5 w-9 rounded-full p-0.5 transition-colors focus:outline-none ${alertRecordOwner ? 'bg-blue-600' : 'bg-slate-250 dark:bg-slate-800'}`}
                          >
                            <div className={`h-4 w-4 rounded-full bg-white shadow-md transition-transform transform ${alertRecordOwner ? 'translate-x-4' : 'translate-x-0'}`} />
                          </button>
                        </div>

                        <div className="space-y-1 pt-2">
                          <label className="text-[10px] font-bold text-slate-450 uppercase block">Alert Emails (Comma delimited)</label>
                          <input
                            type="text"
                            value={alertEmails}
                            onChange={(e) => setAlertEmails(e.target.value)}
                            className="w-full text-xs h-9 px-3 border rounded-xl dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none"
                            placeholder="sales.team@crmfarmit.com"
                          />
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <span>Slack Feed Logging</span>
                          <button
                            onClick={() => setAlertSlackFeed(!alertSlackFeed)}
                            className={`h-5 w-9 rounded-full p-0.5 transition-colors focus:outline-none ${alertSlackFeed ? 'bg-blue-600' : 'bg-slate-250 dark:bg-slate-800'}`}
                          >
                            <div className={`h-4 w-4 rounded-full bg-white shadow-md transition-transform transform ${alertSlackFeed ? 'translate-x-4' : 'translate-x-0'}`} />
                          </button>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <span>System Inbox Notify</span>
                          <button
                            onClick={() => setAlertSysAdmin(!alertSysAdmin)}
                            className={`h-5 w-9 rounded-full p-0.5 transition-colors focus:outline-none ${alertSysAdmin ? 'bg-blue-600' : 'bg-slate-250 dark:bg-slate-800'}`}
                          >
                            <div className={`h-4 w-4 rounded-full bg-white shadow-md transition-transform transform ${alertSysAdmin ? 'translate-x-4' : 'translate-x-0'}`} />
                          </button>
                        </div>

                        <div className="border-t pt-4 mt-6 dark:border-slate-850">
                          <Button
                            onClick={() => toast.success(`Test email alert notification sent to: ${alertEmails}`)}
                            variant="outline"
                            className="w-full text-xs font-bold h-9 rounded-xl border border-slate-250 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
                          >
                            Send Test Notification
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Step 5 (Review & Publish) Right Summary Panel */}
                    {activeStep === 5 && (
                      <div className="space-y-4 text-xs text-left font-semibold flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="text-xs font-extrabold text-slate-855 dark:text-slate-150 uppercase pb-2 border-b dark:border-slate-850">Form Summary</h3>
                          <div className="space-y-2.5 pt-2">
                            <div className="flex justify-between py-1 border-b dark:border-slate-800">
                              <span className="text-slate-400">Name</span>
                              <span className="font-bold text-slate-800 dark:text-slate-150">{formName}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b dark:border-slate-800">
                              <span className="text-slate-400">Module</span>
                              <span className="font-bold text-blue-600">{formModule}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b dark:border-slate-800">
                              <span className="text-slate-400">Fields Count</span>
                              <span className="font-bold text-slate-800 dark:text-slate-150">{canvasFields.length}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b dark:border-slate-800">
                              <span className="text-slate-400">Logic Rules</span>
                              <span className="font-bold text-amber-600">{logicRules.length} rules</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 border-t pt-4 mt-6 dark:border-slate-850">
                          <Button
                            onClick={async () => {
                              const success = await saveFormToApi('Inactive');
                              if (success) {
                                router.push('/customization/customize-forms');
                              }
                            }}
                            variant="outline"
                            className="w-full text-xs font-bold h-9.5 rounded-xl border border-slate-250 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
                          >
                            Save as Draft
                          </Button>
                          <Button
                            onClick={async () => {
                              const success = await saveFormToApi('Active');
                              if (success) {
                                router.push('/customization/customize-forms');
                              }
                            }}
                            style={{ backgroundColor: primaryColor }}
                            className="w-full text-xs font-bold h-9.5 text-white rounded-xl shadow-sm cursor-pointer hover:opacity-95"
                          >
                            Publish and Activate
                          </Button>
                        </div>
                      </div>
                    )}

                  </div>

                </div>

                {/* Footer Controls step indicators */}
                <div className="bg-slate-50/40 dark:bg-slate-950/10 border dark:border-slate-850 p-4 rounded-xl flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-400">Step {activeStep} of 5:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-350">{STEPS[activeStep - 1].title}</span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => setActiveStep(activeStep - 1)}
                      variant="outline"
                      className="h-8.5 px-4 rounded-lg font-bold border-slate-200 text-slate-700 cursor-pointer dark:border-slate-800 dark:text-slate-300"
                    >
                      Back Step
                    </Button>
                    <Button
                      onClick={handleSaveAndContinue}
                      style={{ backgroundColor: primaryColor }}
                      className="h-8.5 px-4 rounded-lg font-bold text-white shadow-sm flex items-center gap-1 cursor-pointer hover:opacity-95"
                    >
                      <span>{activeStep === 5 ? 'Publish Form' : 'Save & Continue'}</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

              </div>
            )}

          </motion.div>
        )}
      </AnimatePresence>

      {/* Sandbox submission result modal */}
      <AnimatePresence>
        {isSandboxSubmitted && submittedPayload && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSandboxSubmitted(false)}
              className="absolute inset-0 bg-slate-950"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-[550px] bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl shadow-xl p-6 text-left z-50"
            >
              <div className="flex justify-between items-center pb-3 border-b dark:border-slate-850">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 animate-bounce" />
                  Submission Success Simulator
                </h3>
                <button onClick={() => setIsSandboxSubmitted(false)} className="p-1 rounded-full text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-855">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-4 space-y-3">
                <p className="text-xs text-slate-505">
                  Your simulated submission has been mapped to CRM records and integration pipelines successfully! Here is the JSON payload:
                </p>
                <pre className="p-4 bg-slate-50 dark:bg-slate-955 rounded-xl text-[10px] font-mono text-slate-700 dark:text-slate-300 overflow-x-auto max-h-60 border dark:border-slate-800">
                  {JSON.stringify(submittedPayload, null, 2)}
                </pre>
                <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/30 text-[10.5px] text-emerald-700 dark:text-emerald-400 flex items-start gap-2 leading-relaxed">
                  <Info className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Integration Pipeline Dispatched:</span>
                    {alertSlackFeed && <span className="block mt-0.5">• Dispatched to Slack: {slackChannel}</span>}
                    {alertRecordOwner && <span className="block">• Record owner email dispatch logged</span>}
                    <span className="block">• Saved to local storage database</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-end mt-5">
                <Button onClick={() => setIsSandboxSubmitted(false)} className="h-9 px-4 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 cursor-pointer">
                  Close Preview
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
