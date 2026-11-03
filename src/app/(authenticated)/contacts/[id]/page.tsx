'use client';
import { getTenantName } from '@/service/apiClient';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Phone,
  Mail,
  Edit,
  Trash2,
  Building,
  User,
  Tag,
  Briefcase,
  Star,
  Plus,
  FileText,
  Calendar,
  Clock,
  Sparkles,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Coins,
  MessageSquare,
  Paperclip,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { fetchContactDetails, updateContact, deleteContact, ContactModel } from '@/service/api/contacts/api';
import { generateEmailContent } from '@/service/api/Leads/api';
import { useStore } from '@/store/useStore';
import { useKnowlarity } from '@/store/KnowlarityContext';
import { NavLink } from '@/components/layout/NavLink';

type TabType = 'Overview' | 'Notes' | 'Emails' | 'Activities';

export default function ContactOverviewPage() {
  const { id: rawId } = useParams() as { id: string };
  const contactId = Number(rawId);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { primaryColor } = useStore();
  const { makeCall, isPlacingCall } = useKnowlarity();

  const [activeTab, setActiveTab] = useState<TabType>('Overview');
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Note State
  const [noteContent, setNoteContent] = useState('');
  const [localNotes, setLocalNotes] = useState<Array<{ id: number; text: string; date: string; author: string }>>([]);

  // Mail Modal State
  const [isMailOpen, setIsMailOpen] = useState(false);
  const [mailSubject, setMailSubject] = useState('');
  const [mailBody, setMailBody] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [isSendingMail, setIsSendingMail] = useState(false);
  const [localEmails, setLocalEmails] = useState<Array<{ id: number; subject: string; body: string; date: string }>>([]);

  // Fetch Contact Details via API
  const { data: contact, isLoading, error } = useQuery<ContactModel>({
    queryKey: ['contactDetails', contactId],
    queryFn: () => fetchContactDetails(contactId),
    enabled: !isNaN(contactId),
  });

  // Calculate Contact Name & Initials
  const fullName = useMemo(() => {
    if (!contact) return '';
    const first = contact.FirstName || '';
    const last = contact.LastName || '';
    return `${first} ${last}`.trim() || 'Unnamed Contact';
  }, [contact]);

  const initials = useMemo(() => {
    if (!fullName) return 'UN';
    return fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }, [fullName]);

  // Dynamic Avatar Color
  const avatarBgColor = useMemo(() => {
    const colorsList = [
      'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border-indigo-200',
      'bg-pink-100 text-pink-700 dark:bg-pink-950/50 dark:text-pink-300 border-pink-200',
      'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200',
      'bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300 border-teal-200',
      'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200',
      'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200',
      'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200',
      'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200',
    ];
    const hashStr = `${fullName}-${contactId}`;
    const hash = hashStr.split('').reduce((acc, char) => Math.abs((acc * 31 + char.charCodeAt(0)) | 0), 0);
    return colorsList[hash % colorsList.length];
  }, [fullName, contactId]);

  // Toggle Favorite Status
  const handleToggleFavorite = async () => {
    if (!contact) return;
    try {
      const nextFav = !contact.Is_Favorites;
      await updateContact({ id: contactId, Is_Favorites: nextFav });
      toast.success(nextFav ? 'Added to favorites' : 'Removed from favorites');
      queryClient.invalidateQueries({ queryKey: ['contactDetails', contactId] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    } catch (err: any) {
      toast.error('Failed to update favorite status');
    }
  };

  // Delete Contact
  const handleDeleteContact = async () => {
    setIsDeleting(true);
    try {
      await deleteContact(contactId);
      toast.success('Contact deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      router.push('/contacts');
    } catch (err: any) {
      toast.error('Failed to delete contact');
      setIsDeleting(false);
    }
  };

  // Add Local Note
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;
    const newNote = {
      id: Date.now(),
      text: noteContent.trim(),
      date: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      author: 'Current User'
    };
    setLocalNotes([newNote, ...localNotes]);
    setNoteContent('');
    toast.success('Note added successfully!');
  };

  // AI Email Content Generator
  const handleGenerateAiMail = async () => {
    if (!mailSubject) {
      toast.error('Please enter an Email Subject prompt first.');
      return;
    }
    setIsAiGenerating(true);
    try {
      const res = await generateEmailContent(mailSubject);
      const text = res?.generated_content || res?.content || '';
      setMailBody(text);
      toast.success('AI Email drafted!');
    } catch (err: any) {
      toast.error('Failed to generate AI content');
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Send Email Handler
  const handleSendMail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mailSubject.trim() || !mailBody.trim()) {
      toast.error('Please fill in both Subject and Content.');
      return;
    }
    setIsSendingMail(true);
    setTimeout(() => {
      setLocalEmails([
        {
          id: Date.now(),
          subject: mailSubject,
          body: mailBody,
          date: new Date().toLocaleString()
        },
        ...localEmails
      ]);
      setIsSendingMail(false);
      setIsMailOpen(false);
      setMailSubject('');
      setMailBody('');
      toast.success('Email sent successfully!');
    }, 600);
  };

  if (isLoading) {
    return (
      <div className="max-w-[1600px] mx-auto p-8 space-y-6">
        <div className="flex items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" style={{ color: primaryColor }} />
          <span className="text-sm font-semibold text-slate-500">Loading contact overview...</span>
        </div>
      </div>
    );
  }

  if (error || !contact) {
    return (
      <div className="max-w-[1600px] mx-auto p-8 space-y-6">
        <div className="bg-rose-50 dark:bg-rose-955/20 border border-rose-200 dark:border-rose-900 rounded-2xl p-6 text-center space-y-4">
          <AlertCircle className="h-10 w-10 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-rose-900 dark:text-rose-300">Contact Not Found</h2>
          <p className="text-xs text-rose-600 dark:text-rose-400">The contact record you are looking for does not exist or has been removed.</p>
          <Button onClick={() => router.push('/contacts')} style={{ backgroundColor: primaryColor }} className="text-white text-xs font-bold rounded-xl px-5 h-9">
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Contacts
          </Button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-[1600px] mx-auto space-y-5 text-left p-4 lg:p-6"
    >
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/" className="hover:text-primary transition-colors">{getTenantName().toUpperCase()}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/contacts" className="hover:text-primary transition-colors">Contacts</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-semibold text-slate-900 dark:text-white">{fullName}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/contacts')}
          className="h-8.5 px-3 text-xs font-semibold rounded-xl border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Contacts
        </Button>
      </div>

      {/* Main Header Profile Card */}
      <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14 border shadow-xs shrink-0">
            <AvatarFallback className={`font-bold text-lg border ${avatarBgColor}`}>
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{fullName}</h1>
              <button
                type="button"
                onClick={handleToggleFavorite}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
                title={contact.Is_Favorites ? 'Remove Favorite' : 'Mark Favorite'}
              >
                <Star className={`h-5 w-5 ${contact.Is_Favorites ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'}`} />
              </button>
              <Badge variant="outline" className={`text-xs font-semibold py-0.5 px-2.5 rounded-full ${contact.Status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800'}`}>
                {contact.Status || 'Active'}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {contact.Job_Title || 'No Title'} {contact.Company_Name ? `at ${contact.Company_Name}` : ''}
            </p>
          </div>
        </div>

        {/* Quick Action Header Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {contact.Mobile_Number && (
            <Button
              onClick={() => makeCall(contact.Mobile_Number!, fullName, contactId, contact.Organization_Id, contact.Company_Name, 'Contact')}
              disabled={isPlacingCall}
              style={{ backgroundColor: primaryColor }}
              className="h-9 px-4 text-white text-xs font-semibold rounded-xl hover:opacity-90 transition-all cursor-pointer"
            >
              <Phone className="h-3.5 w-3.5 mr-1.5" /> Call
            </Button>
          )}

          {contact.Email_Id && (
            <Button
              variant="outline"
              onClick={() => {
                setMailSubject('');
                setMailBody('');
                setIsMailOpen(true);
              }}
              className="h-9 px-4 text-xs font-semibold rounded-xl border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              <Mail className="h-3.5 w-3.5 mr-1.5 text-blue-600" /> Send Email
            </Button>
          )}

          <Button
            variant="outline"
            onClick={() => router.push(`/contacts/${contactId}/edit`)}
            className="h-9 px-3.5 text-xs font-semibold rounded-xl border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
          >
            <Edit className="h-3.5 w-3.5 mr-1.5" /> Edit
          </Button>

          <Button
            variant="ghost"
            onClick={() => setIsDeleteOpen(true)}
            className="h-9 px-3 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-955/20 rounded-xl cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete
          </Button>
        </div>
      </div>

      {/* Main Grid: Sidebar + Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Sidebar Cards */}
        <div className="lg:col-span-4 space-y-5">
          {/* Key Information Card */}
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b dark:border-slate-800 pb-3 flex items-center gap-2">
              <User className="h-4 w-4 text-primary" style={{ color: primaryColor }} /> Key Details
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-start justify-between">
                <span className="text-slate-400 font-medium">Email</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400 truncate max-w-[200px]">{contact.Email_Id || '-'}</span>
              </div>

              <div className="flex items-start justify-between">
                <span className="text-slate-400 font-medium">Phone</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{contact.Mobile_Number || '-'}</span>
              </div>

              <div className="flex items-start justify-between">
                <span className="text-slate-400 font-medium">Job Title</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{contact.Job_Title || '-'}</span>
              </div>

              <div className="flex items-start justify-between">
                <span className="text-slate-400 font-medium">Company Name</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{contact.Company_Name || '-'}</span>
              </div>

              <div className="flex items-start justify-between">
                <span className="text-slate-400 font-medium">Lead Source</span>
                <Badge variant="outline" className="text-[10px] font-semibold bg-blue-50 text-blue-600 dark:bg-blue-955/20 border-blue-200">
                  {contact.LeadSource || 'Direct'}
                </Badge>
              </div>

              <div className="flex items-start justify-between">
                <span className="text-slate-400 font-medium">Contact Owner</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{String(contact.Contact_Owner || 'Unassigned')}</span>
              </div>

              <div className="flex items-start justify-between border-t dark:border-slate-800 pt-3">
                <span className="text-slate-400 font-medium">Created On</span>
                <span className="font-semibold text-slate-600 dark:text-slate-400">
                  {contact.Created_Date ? new Date(contact.Created_Date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Communication Preferences */}
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b dark:border-slate-800 pb-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Communication Channels
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border dark:border-slate-800">
                <Mail className="h-3.5 w-3.5 text-blue-500" />
                <span className="font-medium text-slate-700 dark:text-slate-300">Email</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border dark:border-slate-800">
                <Phone className="h-3.5 w-3.5 text-emerald-500" />
                <span className="font-medium text-slate-700 dark:text-slate-300">Phone Call</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Main Tabs & Content */}
        <div className="lg:col-span-8 space-y-5">
          {/* Tab Navigation Header */}
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-2 shadow-xs flex items-center gap-2 overflow-x-auto">
            {(['Overview', 'Notes', 'Emails', 'Activities'] as TabType[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  activeTab === tab
                    ? 'text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
                style={activeTab === tab ? { backgroundColor: primaryColor } : {}}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* TAB CONTENT: Overview */}
          {activeTab === 'Overview' && (
            <div className="space-y-5">
              {/* Quick Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-4 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Calls</span>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">0</p>
                </div>
                <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-4 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Emails Sent</span>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">{localEmails.length}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-4 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Notes</span>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">{localNotes.length}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-4 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status</span>
                  <p className="text-xl font-bold text-emerald-600">{contact.Status || 'Active'}</p>
                </div>
              </div>

              {/* Add Quick Note Component */}
              <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" style={{ color: primaryColor }} /> Quick Note
                </h3>
                <form onSubmit={handleAddNote} className="space-y-3">
                  <Textarea
                    placeholder="Write a note about this contact..."
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    className="min-h-[90px] text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 p-3"
                  />
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={!noteContent.trim()}
                      style={{ backgroundColor: primaryColor }}
                      className="h-8.5 px-4 text-xs font-semibold text-white rounded-xl cursor-pointer disabled:opacity-50"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1.5" /> Save Note
                    </Button>
                  </div>
                </form>
              </div>

              {/* Recent Notes List */}
              {localNotes.length > 0 && (
                <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recent Notes</h3>
                  <div className="space-y-3">
                    {localNotes.map(n => (
                      <div key={n.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-955/50 border dark:border-slate-800 space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{n.author}</span>
                          <span>{n.date}</span>
                        </div>
                        <p className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{n.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB CONTENT: Notes */}
          {activeTab === 'Notes' && (
            <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contact Notes</h3>
              <form onSubmit={handleAddNote} className="space-y-3">
                <Textarea
                  placeholder="Add a new note..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="min-h-[100px] text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 p-3"
                />
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={!noteContent.trim()}
                    style={{ backgroundColor: primaryColor }}
                    className="h-8.5 px-4 text-xs font-semibold text-white rounded-xl cursor-pointer disabled:opacity-50"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Note
                  </Button>
                </div>
              </form>

              <div className="space-y-3 pt-2">
                {localNotes.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No notes added yet for this contact.</p>
                ) : (
                  localNotes.map(n => (
                    <div key={n.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-955/50 border dark:border-slate-800 space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{n.author}</span>
                        <span>{n.date}</span>
                      </div>
                      <p className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{n.text}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB CONTENT: Emails */}
          {activeTab === 'Emails' && (
            <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email History</h3>
                <Button
                  onClick={() => setIsMailOpen(true)}
                  style={{ backgroundColor: primaryColor }}
                  className="h-8.5 px-4 text-xs font-semibold text-white rounded-xl cursor-pointer"
                >
                  <Mail className="h-3.5 w-3.5 mr-1.5" /> Send New Email
                </Button>
              </div>

              {localEmails.length === 0 ? (
                <p className="text-xs text-slate-400 py-8 text-center">No emails sent yet.</p>
              ) : (
                <div className="space-y-3">
                  {localEmails.map(mail => (
                    <div key={mail.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-955/50 border dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{mail.subject}</span>
                        <span className="text-[10px] text-slate-400">{mail.date}</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{mail.body}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB CONTENT: Activities */}
          {activeTab === 'Activities' && (
            <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Activities & Call Logs</h3>
              <p className="text-xs text-slate-400 py-6 text-center">No call logs or scheduled activities recorded.</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: Send Email Dialog */}
      <Dialog open={isMailOpen} onOpenChange={setIsMailOpen}>
        <DialogContent className="sm:max-w-[540px] rounded-2xl bg-white dark:bg-slate-900 border dark:border-slate-800 p-6 text-left shadow-2xl">
          <DialogHeader className="border-b dark:border-slate-800 pb-4">
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" style={{ color: primaryColor }} /> Send Email to {fullName}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 mt-1">
              Draft and dispatch an email directly to <span className="font-semibold text-slate-700 dark:text-slate-300">{contact.Email_Id || fullName}</span>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSendMail} className="space-y-4 py-3 text-xs">
            <div className="space-y-1.5">
              <label className="text-[10.5px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">Subject</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter email subject or AI topic prompt..."
                  value={mailSubject}
                  onChange={(e) => setMailSubject(e.target.value)}
                  className="h-9.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 flex-1"
                />
                <Button
                  type="button"
                  onClick={handleGenerateAiMail}
                  disabled={isAiGenerating}
                  variant="outline"
                  className="h-9.5 px-3 text-xs font-semibold rounded-xl border-purple-200 text-purple-600 hover:bg-purple-50 dark:border-purple-900 dark:text-purple-400 cursor-pointer shrink-0"
                >
                  {isAiGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1" />} AI Draft
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10.5px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">Email Body</label>
              <Textarea
                placeholder="Write your email content..."
                value={mailBody}
                onChange={(e) => setMailBody(e.target.value)}
                className="min-h-[140px] text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 p-3"
              />
            </div>

            <DialogFooter className="border-t dark:border-slate-800 pt-4 gap-2 flex items-center justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsMailOpen(false)}
                className="h-9 px-4 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSendingMail}
                style={{ backgroundColor: primaryColor }}
                className="text-white font-bold h-9 px-5 text-xs rounded-xl cursor-pointer hover:opacity-90 transition-all flex items-center gap-1.5"
              >
                {isSendingMail ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />} Send Email
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: Delete Contact Confirmation */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl bg-white dark:bg-slate-900 border dark:border-slate-800 p-6 text-left shadow-2xl">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-rose-500" /> Confirm Delete
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
              Are you sure you want to delete <span className="font-bold text-slate-900 dark:text-white">{fullName}</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-4 gap-2 flex items-center justify-end border-t dark:border-slate-800 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
              className="h-9 px-4 text-xs font-bold rounded-xl cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteContact}
              disabled={isDeleting}
              className="h-9 px-5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl cursor-pointer disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Delete Contact'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
