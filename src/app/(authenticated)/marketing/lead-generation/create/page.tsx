'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft,
  FileText,
  Upload,
  UserPlus,
  Compass,
  CheckCircle,
  HelpCircle,
  ChevronDown,
  X,
  Info,
  Calendar,
  Sparkles,
  ShieldCheck,
  Tag,
  User,
  SlidersHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from '@/components/ui/breadcrumb';
import { useStore } from '@/store/useStore';
import { useLeadListStore, LeadList } from '@/store/useLeadListStore';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { NavLink } from '@/components/layout/NavLink';

export default function CreateLeadListPage() {
  const router = useRouter();
  const { primaryColor } = useStore();
  const { addList } = useLeadListStore();

  // Form States
  const [listName, setListName] = useState('');
  const [listOwner, setListOwner] = useState('Aarav Rao');
  const [description, setDescription] = useState('');
  const [folder, setFolder] = useState('Select folder');
  const [leadSource, setLeadSource] = useState('Website');
  const [sourceDetails, setSourceDetails] = useState('');
  const [captureMethod, setCaptureMethod] = useState<'Form Submission' | 'File Upload' | 'Manual Entry'>('Form Submission');
  const [campaign, setCampaign] = useState('Select campaign');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [preventDuplicates, setPreventDuplicates] = useState(true);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Advanced settings state
  const [leadScoringRule, setLeadScoringRule] = useState('Default Score (+10)');
  const [webhookUrl, setWebhookUrl] = useState('');

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = tagInput.trim();
      if (trimmed && !tags.includes(trimmed)) {
        setTags([...tags, trimmed]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (t: string) => {
    setTags(tags.filter(item => item !== t));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!listName.trim()) {
      toast.error('List Name is required.');
      return;
    }

    const newList: LeadList = {
      id: `LST-${Math.floor(100 + Math.random() * 900)}`,
      name: listName,
      description: description || 'No description provided.',
      source: leadSource,
      sourceDetails: sourceDetails || 'N/A',
      captureMethod,
      campaign: campaign === 'Select campaign' ? 'None' : campaign,
      tags,
      preventDuplicates,
      totalLeads: 0,
      newLeads: 0,
      conversionRate: 0,
      status: 'Active',
      createdOn: new Date().toISOString().split('T')[0],
      createdBy: listOwner,
    };

    addList(newList);
    toast.success(`Lead generation list "${listName}" created successfully!`);
    router.push('/marketing/lead-generation');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-[1600px] mx-auto space-y-6 pb-28 text-left"
    >
      {/* Breadcrumbs */}
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="icon" 
          className="h-10 w-10 rounded-full border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 shrink-0"
          onClick={() => router.push('/marketing/lead-generation')}
        >
          <ArrowLeft className="h-4.5 w-4.5" />
        </Button>
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold mb-0.5">
            <NavLink to="/marketing/lead-generation" className="hover:text-slate-650 transition-colors">Lead Generation</NavLink>
            <span>&gt;</span>
            <NavLink to="/marketing/lead-generation" className="hover:text-slate-650 transition-colors">Lists</NavLink>
            <span>&gt;</span>
            <span>Create New List</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Create New Lead Generation List
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side Form Fields (2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card 1: List Information */}
          <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs overflow-hidden">
            <div className="p-5 border-b dark:border-slate-800">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">List Information</h3>
            </div>
            <CardContent className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-left">
                
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">List Name *</Label>
                  <Input 
                    placeholder="Enter list name" 
                    value={listName}
                    onChange={(e) => setListName(e.target.value)}
                    required
                    className="h-10 border-slate-200 dark:border-slate-800"
                  />
                  <p className="text-[10px] text-slate-400 font-medium">A unique name to identify this lead generation list.</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">List Owner *</Label>
                  <Select value={listOwner} onValueChange={(val) => val && setListOwner(val)}>
                    <SelectTrigger className="h-10 border-slate-200 dark:border-slate-800 text-xs font-semibold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Aarav Rao">Aarav Rao</SelectItem>
                      <SelectItem value="Sneha Sharma">Sneha Sharma</SelectItem>
                      <SelectItem value="Rohit Kumar">Rohit Kumar</SelectItem>
                      <SelectItem value="Deepa Patel">Deepa Patel</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-slate-400 font-medium">Select the owner of this list.</p>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description</Label>
                  <Textarea 
                    placeholder="Enter description (optional)" 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-[80px] border-slate-200 dark:border-slate-800 text-xs"
                  />
                  <p className="text-[10px] text-slate-400 font-medium">Describe the purpose of this list.</p>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Folder (Optional)</Label>
                  <Select value={folder} onValueChange={(val) => val && setFolder(val)}>
                    <SelectTrigger className="h-10 border-slate-200 dark:border-slate-800 text-xs font-semibold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Select folder">Select folder</SelectItem>
                      <SelectItem value="Q2 Campaigns">Q2 Campaigns</SelectItem>
                      <SelectItem value="Inbound Leads">Inbound Leads</SelectItem>
                      <SelectItem value="Partner Networks">Partner Networks</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-slate-400 font-medium">Organize this list in a folder.</p>
                </div>

              </div>
            </CardContent>
          </Card>

          {/* Card 2: Select Source */}
          <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs overflow-hidden">
            <div className="p-5 border-b dark:border-slate-800">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">Select Source</h3>
            </div>
            <CardContent className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-left">
                
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lead Source *</Label>
                  <Select value={leadSource} onValueChange={(val) => val && setLeadSource(val)}>
                    <SelectTrigger className="h-10 border-slate-200 dark:border-slate-800 text-xs font-semibold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Website">Website</SelectItem>
                      <SelectItem value="Google Ads">Google Ads</SelectItem>
                      <SelectItem value="LinkedIn Ads">LinkedIn Ads</SelectItem>
                      <SelectItem value="Cold Call">Cold Call</SelectItem>
                      <SelectItem value="Email">Email</SelectItem>
                      <SelectItem value="Referral">Referral</SelectItem>
                      <SelectItem value="Event">Event</SelectItem>
                      <SelectItem value="Social Media">Social Media</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-slate-400 font-medium">Choose the source from where leads will be generated.</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Source Details</Label>
                  <Input 
                    placeholder="e.g. www.yourwebsite.com/contact-us" 
                    value={sourceDetails}
                    onChange={(e) => setSourceDetails(e.target.value)}
                    className="h-10 border-slate-200 dark:border-slate-800"
                  />
                  <p className="text-[10px] text-slate-400 font-medium">Provide source specific details or link.</p>
                </div>

              </div>
            </CardContent>
          </Card>

          {/* Card 3: List Settings */}
          <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs overflow-hidden">
            <div className="p-5 border-b dark:border-slate-800">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">List Settings</h3>
            </div>
            <CardContent className="p-6 space-y-6 text-left">
              
              {/* Radio card capture methods */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lead Capture Method *</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  
                  {/* Method 1: Form Submission */}
                  <div 
                    onClick={() => setCaptureMethod('Form Submission')}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col gap-2 relative ${
                      captureMethod === 'Form Submission' 
                        ? 'border-blue-600 bg-blue-50/10 dark:border-blue-500 dark:bg-blue-950/10' 
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/20 hover:border-slate-350'
                    }`}
                  >
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border ${
                      captureMethod === 'Form Submission' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 border-blue-200' : 'bg-white dark:bg-slate-900 text-slate-400'
                    }`}>
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-850 dark:text-slate-100">Form Submission</h4>
                      <p className="text-[10px] text-slate-450 mt-1 leading-snug">Leads captured through web forms.</p>
                    </div>
                    {captureMethod === 'Form Submission' && (
                      <div className="absolute top-3 right-3 h-4 w-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-bold" style={{ backgroundColor: primaryColor }}>
                        ✓
                      </div>
                    )}
                  </div>

                  {/* Method 2: File Upload */}
                  <div 
                    onClick={() => setCaptureMethod('File Upload')}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col gap-2 relative ${
                      captureMethod === 'File Upload' 
                        ? 'border-blue-600 bg-blue-50/10 dark:border-blue-500 dark:bg-blue-950/10' 
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/20 hover:border-slate-350'
                    }`}
                  >
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border ${
                      captureMethod === 'File Upload' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 border-blue-200' : 'bg-white dark:bg-slate-900 text-slate-400'
                    }`}>
                      <Upload className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-850 dark:text-slate-100">File Import</h4>
                      <p className="text-[10px] text-slate-455 mt-1 leading-snug">Upload a file to import leads.</p>
                    </div>
                    {captureMethod === 'File Upload' && (
                      <div className="absolute top-3 right-3 h-4 w-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-bold" style={{ backgroundColor: primaryColor }}>
                        ✓
                      </div>
                    )}
                  </div>

                  {/* Method 3: Manual Entry */}
                  <div 
                    onClick={() => setCaptureMethod('Manual Entry')}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col gap-2 relative ${
                      captureMethod === 'Manual Entry' 
                        ? 'border-blue-600 bg-blue-50/10 dark:border-blue-500 dark:bg-blue-950/10' 
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/20 hover:border-slate-350'
                    }`}
                  >
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border ${
                      captureMethod === 'Manual Entry' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 border-blue-200' : 'bg-white dark:bg-slate-900 text-slate-400'
                    }`}>
                      <UserPlus className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-850 dark:text-slate-100">Manual Entry</h4>
                      <p className="text-[10px] text-slate-455 mt-1 leading-snug">Add leads manually to this list.</p>
                    </div>
                    {captureMethod === 'Manual Entry' && (
                      <div className="absolute top-3 right-3 h-4 w-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-bold" style={{ backgroundColor: primaryColor }}>
                        ✓
                      </div>
                    )}
                  </div>

                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Add to Campaign (Optional)</Label>
                  <Select value={campaign} onValueChange={(val) => val && setCampaign(val)}>
                    <SelectTrigger className="h-10 border-slate-200 dark:border-slate-800 text-xs font-semibold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Select campaign">Select campaign</SelectItem>
                      <SelectItem value="Q2 Enterprise Marketing">Q2 Enterprise Marketing</SelectItem>
                      <SelectItem value="Product Demo Outbound">Product Demo Outbound</SelectItem>
                      <SelectItem value="Affiliate Growth Bonus">Affiliate Growth Bonus</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-slate-400 font-medium">Associate this list with a campaign.</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tags (Optional)</Label>
                  <Input 
                    placeholder="Enter tags and press enter" 
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    className="h-10 border-slate-200 dark:border-slate-800"
                  />
                  <p className="text-[10px] text-slate-400 font-medium">Add tags to categorize this list.</p>
                  
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1.5">
                      {tags.map((tag) => (
                        <span key={tag} className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-[10px] font-bold px-2 py-0.5 rounded text-slate-650">
                          {tag}
                          <button type="button" onClick={() => handleRemoveTag(tag)} className="text-slate-450 hover:text-slate-600 font-bold ml-0.5">
                            &times;
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Deduplication checkbox */}
              <div className="flex items-start gap-3 pt-3 border-t dark:border-slate-800">
                <input 
                  type="checkbox" 
                  id="deduplication-cb"
                  checked={preventDuplicates} 
                  onChange={(e) => setPreventDuplicates(e.target.checked)}
                  className="mt-0.5 h-4.5 w-4.5 rounded border-slate-350 accent-primary cursor-pointer" 
                />
                <div>
                  <label htmlFor="deduplication-cb" className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer block">
                    Prevent duplicate leads
                  </label>
                  <span className="text-[10px] text-slate-450 block mt-0.5">
                    Skip or update leads that already exist in CRM.
                  </span>
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Card 4: Collapsible Advanced Settings */}
          <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs overflow-hidden">
            <button 
              type="button"
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              className="w-full p-5 flex items-center justify-between font-bold text-slate-850 dark:text-white"
            >
              <div className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider">
                <SlidersHorizontal className="h-4.5 w-4.5 text-slate-400" />
                Advanced Settings (Optional)
              </div>
              <ChevronDown className={`h-4.5 w-4.5 text-slate-400 transition-transform ${isAdvancedOpen ? 'rotate-180' : ''}`} />
            </button>
            
            <AnimatePresence>
              {isAdvancedOpen && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <CardContent className="p-6 border-t dark:border-slate-800 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-left">
                      
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Auto-Assign Scoring Rules</Label>
                        <Select value={leadScoringRule} onValueChange={(val) => val && setLeadScoringRule(val)}>
                          <SelectTrigger className="h-10 border-slate-200 dark:border-slate-800 text-xs font-semibold">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Default Score (+10)">Default Score (+10)</SelectItem>
                            <SelectItem value="High Priority Score (+25)">High Priority Score (+25)</SelectItem>
                            <SelectItem value="Low Priority Score (+5)">Low Priority Score (+5)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Notification Webhook URL</Label>
                        <Input 
                          placeholder="https://api.yourdomain.com/webhook" 
                          value={webhookUrl}
                          onChange={(e) => setWebhookUrl(e.target.value)}
                          className="h-10 border-slate-200 dark:border-slate-800"
                        />
                      </div>

                    </div>
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>

        </div>

        {/* Right Side Sidebar Widgets (1 column) */}
        <div className="space-y-6">
          
          {/* About Lead Generation Lists Widget */}
          <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs overflow-hidden text-left">
            <div className="p-5 border-b dark:border-slate-800 flex items-center gap-2">
              <Info className="h-4.5 w-4.5 text-blue-500 shrink-0" />
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">About Lead Generation Lists</h3>
            </div>
            <CardContent className="p-5 space-y-4 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              <p>Create a list to collect leads from various sources. You can use this list in campaigns, workflows, and reports.</p>
              
              <ul className="space-y-2.5 pt-1">
                {[
                  'Track leads by source and campaign',
                  'Monitor performance and conversion',
                  'Use in workflows and automation',
                  'Maintain data quality and deduplication'
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-slate-700 dark:text-slate-300 font-semibold">
                    <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* List Preview Widget */}
          <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs overflow-hidden text-left sticky top-6">
            <div className="p-5 border-b dark:border-slate-800 flex items-center gap-2">
              <Sparkles className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">List Preview</h3>
            </div>
            <CardContent className="p-5 space-y-4 text-xs font-bold text-slate-500">
              
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">List Name</span>
                <span className="text-sm font-extrabold text-slate-800 dark:text-white block">
                  {listName.trim() ? listName : '-'}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Source</span>
                <span className="text-slate-800 dark:text-white block">
                  {leadSource}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Lead Capture Method</span>
                <span className="text-slate-850 dark:text-white block">
                  {captureMethod}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Created By</span>
                <span className="text-slate-700 dark:text-slate-300 block">
                  {listOwner}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-1">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Creation Date</span>
                  <span className="text-slate-650 dark:text-slate-400 block font-mono">
                    {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Status</span>
                  <span className="inline-block bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400 text-[10px] py-0.5 px-2.5 rounded-md border border-blue-200 dark:border-blue-900/30 mt-0.5">
                    New
                  </span>
                </div>
              </div>

            </CardContent>
          </Card>

        </div>

      </form>

      {/* Cancel and Save controls at the bottom */}
      <div className="flex items-center justify-end gap-3.5 pt-4 border-t dark:border-slate-800">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => router.push('/marketing/lead-generation')}
          className="h-10 px-5 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 rounded-xl"
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          onClick={handleSubmit}
          className="h-10 px-8 text-white text-xs font-extrabold rounded-xl shadow-sm hover:opacity-90"
          style={{ backgroundColor: primaryColor }}
        >
          Save & Create List
        </Button>
      </div>

    </motion.div>
  );
}
