'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  ThumbsUp,
  MessageSquare,
  Share2,
  MoreVertical,
  Send,
  Image as ImageIcon,
  Video as VideoIcon,
  Link as LinkIcon,
  Trash2,
  Edit2,
  X,
  ExternalLink,
  TrendingUp,
  Sparkles,
  Briefcase,
  Search,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import { useGetSocialMediaPromotionListQuery, usePostSocialUrlMutation } from '@/app/services/SocialMediaApis';

interface Comment {
  id: string;
  author: string;
  avatar: string;
  content: string;
  time: string;
}

interface Post {
  id: string;
  author: string;
  authorSubtext: string;
  authorAvatar: string;
  content: string;
  link?: string;
  image?: string;
  video?: string;
  likes: number;
  comments: Comment[];
  shares: number;
  liked: boolean;
  time: string;
}

const PRESET_IMAGES = [
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80', // Analytics Chart
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80', // Team Meeting
  'https://images.unsplash.com/photo-1542744094-3a31f103e35f?auto=format&fit=crop&w=600&q=80'  // Office Workshop
];

const DUMMY_POSTS: Post[] = [
  {
    id: '1',
    author: 'Foyer Technology',
    authorSubtext: 'B2B CRM Workspace • Just now',
    authorAvatar: '',
    content: 'We are thrilled to launch the new Retail Pegatto Social Integrations module! Now you can manage and sync campaigns across LinkedIn, Facebook, Instagram and Gmail directly from our unified CRM workspace. 🚀📈 👍',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80',
    likes: 24,
    shares: 6,
    liked: false,
    time: 'Just now',
    comments: [
      {
        id: 'c1',
        author: 'NR Patnaik',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
        content: 'This integration will save hours of work! LinkedIn campaign synchronization was highly requested. Excellent job team.',
        time: '2m ago'
      }
    ]
  },
  {
    id: '2',
    author: 'Foyer Technology',
    authorSubtext: 'B2B CRM Workspace • 2 hours ago',
    authorAvatar: '',
    content: 'B2B marketing success relies on building meaningful relationships. Scale your client engagement efforts with our automated CRM workflows and campaign planners. Check our resource guide for details.',
    link: 'https://foyertech.com/linkedin-campaigns',
    likes: 15,
    shares: 2,
    liked: true,
    time: '2h ago',
    comments: []
  },
  {
    id: '3',
    author: 'Foyer Technology',
    authorSubtext: 'B2B CRM Workspace • 5 hours ago',
    authorAvatar: '',
    content: 'Leadership is about empowering others to succeed. Very proud of our CRM Implementation team delivering 24/7 service desk support and outstanding implementation metrics this quarter! 🌟🙌',
    likes: 42,
    shares: 9,
    liked: false,
    time: '5h ago',
    comments: []
  }
];

export default function LinkedInFeedPage() {
  const { user } = useStore();
  const router = useRouter();

  const { data: promotionData, isLoading: isPromotionsLoading } = useGetSocialMediaPromotionListQuery({
    SocialMedia_Type: 'linkedin',
    page: 1,
  });

  const [postSocialUrl, { isLoading: isPublishing }] = usePostSocialUrlMutation();

  // Dynamic profile statistics in LinkedIn style
  const [profileStats, setProfileStats] = useState({
    profileViews: 384,
    postImpressions: 4850,
    connections: 784,
    searchAppearances: 92
  });

  // State to manage feed posts
  const [posts, setPosts] = useState<Post[]>(DUMMY_POSTS);

  // Sync API data with posts state
  useEffect(() => {
    if (promotionData) {
      const postsList = promotionData.results || promotionData || [];
      if (postsList.length > 0) {
        const mappedPosts: Post[] = postsList.map((item: any, idx: number) => ({
          id: item.id?.toString() || `api-${idx}`,
          author: "Foyer Technology",
          authorSubtext: item.Created_Date
            ? new Date(item.Created_Date).toLocaleString("en-US", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
            : "Just now",
          authorAvatar: "",
          content: item.Promo_Content || "",
          link: item.Promo_URL || item.url || undefined,
          image: item.File || undefined,
          likes: 24,
          comments: [],
          shares: 5,
          liked: false,
          time: item.Created_Date ? new Date(item.Created_Date).toLocaleDateString() : "Just now"
        }));
        setPosts(mappedPosts);
      } else {
        setPosts(DUMMY_POSTS);
      }
    }
  }, [promotionData]);

  // State for creating a post
  const [postText, setPostText] = useState('');
  const [postLink, setPostLink] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showImagePicker, setShowImagePicker] = useState(false);

  // Native Uploader States & Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [attachedFileType, setAttachedFileType] = useState<'image' | 'video' | null>(null);
  const [attachedFileUrl, setAttachedFileUrl] = useState<string | null>(null);
  const [fileAccept, setFileAccept] = useState<string>('image/*');
  const [localCreatedPosts, setLocalCreatedPosts] = useState<Post[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (attachedFileUrl) {
      URL.revokeObjectURL(attachedFileUrl);
    }

    const type = file.type.startsWith('video/') ? 'video' : 'image';
    setAttachedFile(file);
    setAttachedFileType(type);
    setAttachedFileUrl(URL.createObjectURL(file));
    setSelectedImage(null);
    setShowImagePicker(false);
  };

  const triggerFileSelect = (type: 'image' | 'video') => {
    setFileAccept(type === 'video' ? 'video/*' : 'image/*');
    setTimeout(() => {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
        fileInputRef.current.click();
      }
    }, 50);
  };

  const handleRemoveAttachment = () => {
    if (attachedFileUrl) {
      URL.revokeObjectURL(attachedFileUrl);
    }
    setAttachedFile(null);
    setAttachedFileType(null);
    setAttachedFileUrl(null);
  };

  const displayPosts = [...localCreatedPosts, ...posts];

  // States for comment drawers, active edit, etc.
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [activeMenuPostId, setActiveMenuPostId] = useState<string | null>(null);

  // Trigger statistic increases on engagement
  const incrementEngagement = (type: 'views' | 'impressions' | 'connections' | 'searches', amount = 1) => {
    setProfileStats(prev => ({
      ...prev,
      profileViews: type === 'views' ? prev.profileViews + amount : prev.profileViews,
      postImpressions: type === 'impressions' ? prev.postImpressions + amount : prev.postImpressions,
      connections: type === 'connections' ? prev.connections + amount : prev.connections,
      searchAppearances: type === 'searches' ? prev.searchAppearances + amount : prev.searchAppearances,
    }));
  };

  // Close dropdown menu if user clicks outside
  useEffect(() => {
    const handleOutsideClick = () => setActiveMenuPostId(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Post Creator - Actions
  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postText.trim() && !attachedFileUrl && !selectedImage && !postLink.trim()) {
      toast.error('Post content cannot be empty.');
      return;
    }

    const payload = {
      url: postLink.trim() || "https://forms.gle/SxWF7P4RZzMKhuN68",
      message: postText,
      Organization_Id: Number(
        localStorage.getItem("Organization_Id") ||
        localStorage.getItem("orgDetail") ||
        localStorage.getItem("OrganizationId") ||
        localStorage.getItem("organizationId") ||
        "1"
      ),
      social_type: "linkedin"
    };

    try {
      await postSocialUrl(payload).unwrap();

      const localPost: Post = {
        id: `local-${Date.now()}`,
        author: user.name,
        authorSubtext: `${user.jobTitle || 'Team Member'} • Just now`,
        authorAvatar: user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
        content: postText,
        link: postLink.trim() || undefined,
        image: attachedFileType === 'image' ? (attachedFileUrl || undefined) : (selectedImage || undefined),
        video: attachedFileType === 'video' ? (attachedFileUrl || undefined) : undefined,
        likes: 0,
        shares: 0,
        liked: false,
        time: 'Just now',
        comments: []
      };

      setLocalCreatedPosts(prev => [localPost, ...prev]);

      toast.success('Campaign post published successfully to LinkedIn!');
      setPostText('');
      setPostLink('');
      handleRemoveAttachment();
      setSelectedImage(null);
      setShowImagePicker(false);

      // Auto increment impressions and views dynamically
      incrementEngagement('impressions', 25);
      incrementEngagement('views', 2);
    } catch (error) {
      console.error("LinkedIn post API error", error);
      toast.error("Failed to publish post to LinkedIn.");
    }
  };

  // Feed Post - Like Action
  const handleLike = (postId: string) => {
    const updatePost = (p: Post) => {
      if (p.id === postId) {
        const liked = !p.liked;
        const likes = liked ? p.likes + 1 : p.likes - 1;

        if (liked) {
          toast.info(`You liked ${p.author}'s post`);
          incrementEngagement('impressions', 5);
        }
        return { ...p, liked, likes };
      }
      return p;
    };
    setPosts(posts.map(updatePost));
    setLocalCreatedPosts(localCreatedPosts.map(updatePost));
  };

  // Feed Post - Share Action
  const handleShare = (postId: string) => {
    const updatePost = (p: Post) => {
      if (p.id === postId) {
        toast.success(`Post successfully shared! Link copied to clipboard.`);
        incrementEngagement('impressions', 12);
        return { ...p, shares: p.shares + 1 };
      }
      return p;
    };
    setPosts(posts.map(updatePost));
    setLocalCreatedPosts(localCreatedPosts.map(updatePost));
  };

  // Feed Post - Comment Add
  const handleAddComment = (postId: string) => {
    const commentText = commentTexts[postId];
    if (!commentText || !commentText.trim()) return;

    const updatePost = (p: Post) => {
      if (p.id === postId) {
        const newComment: Comment = {
          id: Date.now().toString(),
          author: user.name,
          avatar: user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
          content: commentText,
          time: 'Just now'
        };
        incrementEngagement('impressions', 8);
        return {
          ...p,
          comments: [...p.comments, newComment]
        };
      }
      return p;
    };
    setPosts(posts.map(updatePost));
    setLocalCreatedPosts(localCreatedPosts.map(updatePost));

    // Reset input
    setCommentTexts({
      ...commentTexts,
      [postId]: ''
    });
    toast.success('Comment added successfully.');
  };

  // Feed Post - Comment Delete
  const handleDeleteComment = (postId: string, commentId: string) => {
    const updatePost = (p: Post) => {
      if (p.id === postId) {
        return {
          ...p,
          comments: p.comments.filter(c => c.id !== commentId)
        };
      }
      return p;
    };
    setPosts(posts.map(updatePost));
    setLocalCreatedPosts(localCreatedPosts.map(updatePost));
    toast.success('Comment removed.');
  };

  // Feed Post - Delete Action
  const handleDeletePost = (postId: string) => {
    setPosts(posts.filter(p => p.id !== postId));
    setLocalCreatedPosts(localCreatedPosts.filter(p => p.id !== postId));
    toast.success('Post deleted successfully.');
  };

  // Feed Post - Edit Action Trigger
  const handleStartEdit = (post: Post) => {
    setEditingPostId(post.id);
    setEditingText(post.content);
  };

  // Feed Post - Save Edit
  const handleSaveEdit = (postId: string) => {
    if (!editingText.trim()) {
      toast.error('Post content cannot be empty.');
      return;
    }
    const updatePost = (p: Post) => {
      if (p.id === postId) {
        return { ...p, content: editingText };
      }
      return p;
    };
    setPosts(posts.map(updatePost));
    setLocalCreatedPosts(localCreatedPosts.map(updatePost));
    setEditingPostId(null);
    setEditingText('');
    toast.success('Post content updated.');
  };

  return (
    <div className="max-w-[1280px] mx-auto min-h-screen pb-12 transition-colors duration-300">

      {/* Upper Brand Info Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 bg-gradient-to-r from-blue-50 to-sky-50 dark:from-slate-900/60 dark:to-slate-900/40 p-6 rounded-2xl border dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <svg className="h-7 w-7 text-[#0A66C2] shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
            </svg>
            LinkedIn Campaign Manager
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Author and track interactive LinkedIn professional updates directly inside the Retail Pegatto portal.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3.5 py-1.5 rounded-full text-xs font-semibold self-start sm:self-center border border-emerald-500/20">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          LinkedIn Sync Active
        </div>
      </div>

      {/* Grid Layout (3 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* LEFT COLUMN: Profile Card & Stats */}
        <div className="lg:col-span-3 space-y-6 lg:sticky lg:top-[88px]">
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
            {/* Header banner - LinkedIn Blue Theme */}
            <div className="h-24 bg-gradient-to-r from-blue-700 to-[#0A66C2] relative" />

            {/* Avatar overlay */}
            <div className="px-5 pb-5 relative">
              <div className="absolute -top-10 left-5">
                <Avatar className="h-20 w-20 border-4 border-white dark:border-slate-900 shadow-md">
                  <AvatarImage src={user.avatarUrl} alt={user.name} />
                  <AvatarFallback className="bg-gradient-to-tr from-blue-600 to-sky-500 text-white font-bold text-xl uppercase">
                    {user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'RJ'}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Profile Meta */}
              <div className="pt-12 text-left">
                <h3 className="font-bold text-lg text-slate-850 dark:text-slate-105 leading-snug">{user.name}</h3>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">{user.jobTitle}</p>
                <p className="text-[10px] text-[#0A66C2] dark:text-[#378fe9] font-bold tracking-tight mt-1 bg-blue-500/5 dark:bg-blue-400/5 px-2.5 py-1 rounded-md inline-block">
                  {user.workspace || 'Enterprise CRM Portal'}
                </p>
              </div>

              <div className="border-t dark:border-slate-800 my-4" />

              {/* Stats Block */}
              <div className="space-y-3.5 text-sm text-left">
                <div className="flex justify-between items-center group cursor-pointer" onClick={() => incrementEngagement('views', 5)}>
                  <span className="text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">Profile views</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-950 px-2 py-0.5 rounded-md border dark:border-slate-800 text-xs">
                    {profileStats.profileViews}
                  </span>
                </div>
                <div className="flex justify-between items-center group cursor-pointer" onClick={() => incrementEngagement('impressions', 50)}>
                  <span className="text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">Post impressions</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-950 px-2 py-0.5 rounded-md border dark:border-slate-800 text-xs">
                    {profileStats.postImpressions}
                  </span>
                </div>
                <div className="flex justify-between items-center group cursor-pointer" onClick={() => incrementEngagement('connections', 1)}>
                  <span className="text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">Connections</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-950 px-2 py-0.5 rounded-md border dark:border-slate-800 text-xs">
                    {profileStats.connections}
                  </span>
                </div>
                <div className="flex justify-between items-center group cursor-pointer" onClick={() => incrementEngagement('searches', 3)}>
                  <span className="text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">Search appearances</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-950 px-2 py-0.5 rounded-md border dark:border-slate-800 text-xs">
                    {profileStats.searchAppearances}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* CENTER COLUMN: Create Post & Feed */}
        <div className="lg:col-span-6 space-y-6">

          {/* Post Creator Card */}
          <form onSubmit={handlePublish} className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-5 shadow-xs text-left">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Create Campaign Update</h3>

            {/* Input Text */}
            <textarea
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              placeholder="Share a professional update about your campaign..."
              className="w-full min-h-[105px] border-none resize-none focus:ring-0 focus:outline-none bg-slate-50/20 dark:bg-slate-955/20 rounded-xl p-3 text-slate-800 dark:text-slate-200 text-sm border dark:border-slate-800 mb-3.5 focus:border-slate-200 dark:focus:border-slate-700 transition-all placeholder:text-slate-400"
            />

            {/* Attached link element */}
            <div className="flex items-center gap-2 border dark:border-slate-800 rounded-xl px-3 py-2 text-xs bg-slate-50/50 dark:bg-slate-955/50 mb-4 transition-all focus-within:border-[#0A66C2] dark:focus-within:border-sky-500">
              <LinkIcon className="h-4 w-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={postLink}
                onChange={(e) => setPostLink(e.target.value)}
                placeholder="Attach external link (optional)"
                className="w-full bg-transparent border-none focus:ring-0 focus:outline-none text-slate-700 dark:text-slate-300 placeholder:text-slate-400"
              />
              {postLink.trim() && (
                <button type="button" onClick={() => setPostLink('')} className="p-0.5 text-slate-400 hover:text-slate-605">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Local Media / Preset Preview */}
            {(attachedFileUrl || selectedImage) && (
              <div className="relative rounded-xl overflow-hidden border dark:border-slate-800 mb-4 group max-h-60 bg-slate-100 dark:bg-slate-950 flex items-center justify-center">
                {attachedFileUrl ? (
                  attachedFileType === 'video' ? (
                    <video src={attachedFileUrl} controls className="w-full max-h-60 object-contain" />
                  ) : (
                    <img src={attachedFileUrl} alt="Attachment Preview" className="w-full h-full object-cover max-h-60" />
                  )
                ) : (
                  <img src={selectedImage!} alt="Preset Preview" className="w-full h-full object-cover max-h-60" />
                )}
                <button
                  type="button"
                  onClick={() => {
                    handleRemoveAttachment();
                    setSelectedImage(null);
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 rounded-full text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Hidden native file input */}
            <input
              type="file"
              ref={fileInputRef}
              accept={fileAccept}
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Toolbar Row */}
            <div className="flex items-center justify-between gap-3 flex-wrap border-t dark:border-slate-800 pt-4">
              <div className="flex items-center gap-1">
                {/* Photo Trigger */}
                <button
                  type="button"
                  onClick={() => triggerFileSelect('image')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-950 transition-colors cursor-pointer"
                >
                  <ImageIcon className="h-4.5 w-4.5 text-green-600" />
                  <span>Photo</span>
                </button>

                {/* Preset Banner Selector Trigger */}
                <button
                  type="button"
                  onClick={() => {
                    handleRemoveAttachment();
                    setShowImagePicker(!showImagePicker);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${showImagePicker ? 'bg-blue-500/10 text-[#0A66C2] dark:text-[#3891eb] border border-blue-500/20' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-955/40'}`}
                >
                  <Sparkles className="h-4.5 w-4.5 text-amber-500" />
                  <span>Presets</span>
                </button>

                {/* Video Trigger */}
                <button
                  type="button"
                  onClick={() => triggerFileSelect('video')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-955/40 transition-colors cursor-pointer"
                >
                  <VideoIcon className="h-4.5 w-4.5 text-blue-500" />
                  <span>Video</span>
                </button>
              </div>

              <Button
                type="submit"
                disabled={isPublishing || (!postText.trim() && !attachedFileUrl && !selectedImage && !postLink.trim())}
                className="px-5 py-2.5 rounded-xl font-bold bg-[#0A66C2] hover:bg-[#004b87] disabled:opacity-50 text-white shadow-sm flex items-center gap-1.5 cursor-pointer text-xs border-none"
              >
                {isPublishing ? (
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                <span>{isPublishing ? 'Publishing...' : 'Publish'}</span>
              </Button>
            </div>

            {/* Presets Image Picker Drawer */}
            {showImagePicker && (
              <div className="mt-4 p-3 bg-slate-50/50 dark:bg-slate-955/50 border dark:border-slate-800 rounded-xl animate-in fade-in slide-in-from-top-2 duration-200">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Select Professional Banner:</p>
                <div className="grid grid-cols-3 gap-2">
                  {PRESET_IMAGES.map((imgUrl, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setSelectedImage(imgUrl);
                        setShowImagePicker(false);
                      }}
                      className={`relative rounded-lg overflow-hidden border-2 aspect-video group cursor-pointer hover:border-blue-400 transition-all ${selectedImage === imgUrl ? 'border-[#0A66C2] ring-2 ring-blue-500/20' : 'border-transparent'}`}
                    >
                      <img src={imgUrl} alt={`Preset ${i}`} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/5 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </form>

          {/* Feed List Section */}
          <div className="space-y-5">
            {isPromotionsLoading && (
              <div className="flex justify-center items-center py-6 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-5 shadow-xs">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#0A66C2]"></div>
                <span className="ml-3 text-xs font-semibold text-slate-500">Loading B2B updates...</span>
              </div>
            )}
            {displayPosts.map((post) => (
              <div key={post.id} className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl shadow-xs p-5 text-left transition-all relative">

                {/* Header Post Info */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border dark:border-slate-805">
                      <AvatarImage src={post.authorAvatar} alt={post.author} />
                      <AvatarFallback className="bg-[#0A66C2] text-white font-bold text-sm uppercase">
                        {post.author.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="text-sm font-bold text-slate-850 dark:text-slate-105 leading-snug">{post.author}</h4>
                      <p className="text-[10px] text-slate-400 font-semibold leading-tight">{post.authorSubtext}</p>
                    </div>
                  </div>

                  {/* Actions Dropdown Toggle */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuPostId(activeMenuPostId === post.id ? null : post.id);
                      }}
                      className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-205 hover:bg-slate-50 dark:hover:bg-slate-950 rounded-full transition-all cursor-pointer"
                    >
                      <MoreVertical className="h-4.5 w-4.5" />
                    </button>

                    {/* Simple Dropdown Menu popup */}
                    {activeMenuPostId === post.id && (
                      <div className="absolute right-0 top-8 z-30 w-36 bg-white dark:bg-slate-950 border dark:border-slate-800 rounded-xl shadow-lg p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(post)}
                          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer"
                        >
                          <Edit2 className="h-3.5 w-3.5 text-[#0A66C2]" />
                          <span>Edit Post</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePost(post.id)}
                          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-500/5 cursor-pointer border border-transparent hover:border-rose-500/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Delete Post</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Post Text Content / Edit Box */}
                {editingPostId === post.id ? (
                  <div className="space-y-3 mb-4">
                    <textarea
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      className="w-full min-h-[90px] border dark:border-slate-800 rounded-xl p-3 text-sm focus:ring-0 focus:outline-none bg-slate-50/50 dark:bg-slate-955/30 text-slate-800 dark:text-slate-205"
                    />
                    <div className="flex gap-2 justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setEditingPostId(null)}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-950 cursor-pointer border dark:border-slate-800"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        onClick={() => handleSaveEdit(post.id)}
                        className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#0A66C2] hover:bg-[#004b87] text-white cursor-pointer"
                      >
                        Save changes
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed mb-4 whitespace-pre-wrap">
                    {post.content}
                  </p>
                )}

                {/* Attached Links in Post */}
                {post.link && !editingPostId && (
                  <a
                    href={post.link}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between gap-3 border dark:border-slate-800 rounded-xl p-3 mb-4 bg-slate-50/50 dark:bg-slate-955/40 hover:bg-slate-50 dark:hover:bg-slate-950 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <LinkIcon className="h-4 w-4 text-[#0A66C2] shrink-0" />
                      <span className="text-xs font-bold text-[#0A66C2] dark:text-[#3891eb] hover:underline truncate">
                        {post.link}
                      </span>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-slate-400 group-hover:text-[#0A66C2] transition-colors" />
                  </a>
                )}

                {/* Attached Photo Banner */}
                {post.image && !editingPostId && (
                  <div className="rounded-xl overflow-hidden border dark:border-slate-800 mb-4 max-h-[350px] bg-slate-55 flex items-center justify-center select-none">
                    <img src={post.image} alt="Campaign Graphic" className="w-full object-cover max-h-[350px]" />
                  </div>
                )}

                {/* Attached Video Player */}
                {post.video && !editingPostId && (
                  <div className="rounded-xl overflow-hidden border dark:border-slate-800 mb-4 max-h-[350px] bg-slate-55 flex items-center justify-center">
                    <video src={post.video} controls className="w-full max-h-[350px] object-cover" />
                  </div>
                )}

                {/* Post Footer metrics summary */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 font-semibold mb-3 border-b dark:border-slate-800/60 pb-2">
                  <div className="flex items-center gap-1 cursor-pointer hover:underline" onClick={() => handleLike(post.id)}>
                    <span>👍</span>
                    <span>{post.likes} {post.likes === 1 ? 'reaction' : 'reactions'}</span>
                  </div>
                  <div className="flex items-center gap-3.5">
                    <button
                      type="button"
                      onClick={() => setActiveCommentsPostId(activeCommentsPostId === post.id ? null : post.id)}
                      className="hover:underline cursor-pointer"
                    >
                      {post.comments.length} {post.comments.length === 1 ? 'comment' : 'comments'}
                    </button>
                    <span>{post.shares} {post.shares === 1 ? 'repost' : 'reposts'}</span>
                  </div>
                </div>

                {/* Interactive Action Bar */}
                <div className="grid grid-cols-3 gap-1 py-0.5 border-b dark:border-slate-800/60 pb-2 mb-2">
                  {/* Like Button */}
                  <button
                    type="button"
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-950 ${post.liked ? 'text-[#0A66C2]' : 'text-slate-500 dark:text-slate-400'}`}
                  >
                    <ThumbsUp className={`h-4 w-4 ${post.liked ? 'fill-[#0A66C2]/10' : ''}`} />
                    <span>Like</span>
                  </button>

                  {/* Comment Toggle Button */}
                  <button
                    type="button"
                    onClick={() => setActiveCommentsPostId(activeCommentsPostId === post.id ? null : post.id)}
                    className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-955/40 ${activeCommentsPostId === post.id ? 'text-[#0A66C2]' : 'text-slate-500 dark:text-slate-400'}`}
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>Comment</span>
                  </button>

                  {/* Share Button */}
                  <button
                    type="button"
                    onClick={() => handleShare(post.id)}
                    className="flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-colors text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-955/40 cursor-pointer"
                  >
                    <Share2 className="h-4 w-4" />
                    <span>Repost</span>
                  </button>
                </div>

                {/* Comments Section list/drawer */}
                {activeCommentsPostId === post.id && (
                  <div className="space-y-4 pt-3.5 animate-in fade-in duration-200">

                    {/* Add Comment Input Form */}
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 border dark:border-slate-800 shrink-0">
                        <AvatarImage src={user.avatarUrl} alt={user.name} />
                        <AvatarFallback className="bg-blue-600 text-white font-bold text-[11px] uppercase">
                          {user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'RJ'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 flex items-center gap-2 border dark:border-slate-800 rounded-xl px-3 py-2 bg-slate-50/50 dark:bg-slate-955/30">
                        <input
                          type="text"
                          value={commentTexts[post.id] || ''}
                          onChange={(e) => setCommentTexts({ ...commentTexts, [post.id]: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddComment(post.id);
                          }}
                          placeholder="Add a comment..."
                          className="w-full bg-transparent border-none focus:ring-0 focus:outline-none text-xs text-slate-850 dark:text-slate-205 placeholder:text-slate-400"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddComment(post.id)}
                          disabled={!(commentTexts[post.id] || '').trim()}
                          className="text-[#0A66C2] hover:text-[#004b87] disabled:opacity-30 cursor-pointer shrink-0"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Comments List */}
                    {post.comments.length > 0 && (
                      <div className="space-y-3 pl-2 border-l border-slate-100 dark:border-slate-800/80 ml-4 pt-2">
                        {post.comments.map((comment) => (
                          <div key={comment.id} className="flex items-start gap-3 group/comment">
                            <Avatar className="h-7 w-7 border dark:border-slate-805 shrink-0">
                              <AvatarImage src={comment.avatar} alt={comment.author} />
                              <AvatarFallback className="bg-slate-200 dark:bg-slate-800 text-slate-705 dark:text-slate-300 text-[10px] font-bold uppercase">
                                {comment.author.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 bg-slate-50/60 dark:bg-slate-900/60 p-2.5 rounded-xl border dark:border-slate-800/60 relative">
                              <div className="flex items-start justify-between gap-2.5">
                                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-snug">
                                  {comment.author}
                                </span>
                                <span className="text-[9px] text-slate-400 font-semibold leading-none pt-0.5">
                                  {comment.time}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-600 dark:text-slate-350 leading-relaxed mt-1">
                                {comment.content}
                              </p>

                              {/* Delete Comment button */}
                              {comment.author === user.name && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteComment(post.id, comment.id)}
                                  className="absolute right-2 bottom-2 text-slate-400 hover:text-rose-500 opacity-0 group-hover/comment:opacity-100 transition-opacity cursor-pointer p-0.5"
                                  title="Delete comment"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: Campaign Settings Widget */}
        <div className="lg:col-span-3 space-y-6 lg:sticky lg:top-[88px]">

          {/* Settings & Info Card */}
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-5 shadow-xs text-left">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#0A66C2]" />
              Campaign Sync Properties
            </h3>
            <div className="space-y-4">
              {[
                { label: 'Real-time post sync', desc: 'Auto-syncs professional updates to LinkedIn page.', active: true },
                { label: 'Engagement tracking', desc: 'Sync reactions, comments, and shares to CRM.', active: true },
                { label: 'LinkedIn Lead Capture', desc: 'Import profile views and engagements as CRM leads.', active: true },
                { label: 'Auto-contact conversion', desc: 'Convert connection requests into CRM Contacts.', active: false }
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-950 transition-colors">
                  <span className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${item.active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <div>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{item.label}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <Button
              onClick={() => router.push('/Settings/linkedin-setting')}
              variant="outline"
              className="w-full text-xs font-semibold gap-1.5 mt-4 border-[#0A66C2]/20 hover:bg-[#0A66C2]/5 text-[#0A66C2] bg-transparent hover:text-[#004b87]"
            >
              <Settings className="h-3.5 w-3.5" />
              Configure LinkedIn Settings
            </Button>
          </div>

          {/* Social Links Tips Card */}
          <div className="bg-gradient-to-br from-blue-500/5 to-indigo-600/5 border border-blue-550/10 dark:border-slate-800 rounded-2xl p-5 text-left">
            <h3 className="font-bold text-xs text-[#0A66C2] dark:text-sky-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4" />
              LinkedIn B2B Tip
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Posts containing industry research and visual charts (preset graphics) typically generate up to <strong>3.2x more comments and shares</strong> on LinkedIn. Start your posts with actionable takeaways to boost organic B2B reach!
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
