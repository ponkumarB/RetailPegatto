'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useVideoCallStore } from '@/store/useVideoCallStore';
import { 
  Minimize2, 
  Maximize2, 
  X, 
  Copy, 
  Check, 
  PhoneOff, 
  ExternalLink,
  ChevronUp,
  Video,
  Volume2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function JitsiCallWidget() {
  const { 
    status, 
    roomCode, 
    callingURI, 
    minimizeCall, 
    restoreCall, 
    maximizeCall, 
    endCall 
  } = useVideoCallStore();

  const [copied, setCopied] = useState(false);

  if (status === 'idle' || !callingURI) return null;

  const handleCopyLink = () => {
    if (callingURI) {
      navigator.clipboard.writeText(callingURI);
      setCopied(true);
      toast.success('Meeting link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Render minimized state (Pill)
  if (status === 'minimized') {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          className="fixed bottom-6 right-6 z-[9999] flex items-center gap-3 p-3 rounded-full bg-slate-900/95 dark:bg-slate-950/95 text-white shadow-2xl border border-slate-700/50 backdrop-blur-md"
        >
          {/* Active Call Indicator */}
          <div className="flex items-center gap-2 pl-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold max-w-[120px] truncate text-slate-200">
              FoyerTech_{roomCode}
            </span>
          </div>

          <div className="flex items-center gap-1.5 border-l border-slate-700/60 pl-2">
            {/* Restore Button */}
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-full text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
              onClick={restoreCall}
              title="Restore call window"
            >
              <ChevronUp className="h-4.5 w-4.5" />
            </Button>

            {/* Quick Copy Link */}
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-full text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
              onClick={handleCopyLink}
              title="Copy meeting link"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            </Button>

            {/* End Call Button */}
            <Button
              size="icon"
              className="h-8 w-8 rounded-full bg-rose-500 hover:bg-rose-600 text-white cursor-pointer"
              onClick={endCall}
              title="Hang up"
            >
              <PhoneOff className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  const isMaximized = status === 'maximized';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "z-[9999] flex flex-col bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden rounded-2xl transition-all duration-300 ease-in-out",
          isMaximized 
            ? "fixed inset-4 w-auto h-auto" 
            : "fixed bottom-6 right-6 w-[560px] h-[420px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-8rem)]"
        )}
      >
        {/* Widget Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-950/80 border-b border-slate-800/80 backdrop-blur-xs select-none">
          {/* Left Title & Status */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Video className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-100">Live Video Conference</span>
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-[10px] text-slate-400 font-medium tracking-tight truncate max-w-[200px]">
                FoyerTech_{roomCode}
              </p>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-1">
            {/* Copy Link Button */}
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer rounded-lg transition-colors"
              onClick={handleCopyLink}
              title="Copy link to invite others"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            </Button>

            {/* External Link */}
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer rounded-lg transition-colors"
              onClick={() => window.open(callingURI, '_blank')}
              title="Open in new browser tab"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>

            {/* Minimize Button */}
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer rounded-lg transition-colors"
              onClick={minimizeCall}
              title="Minimize to floating pill"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>

            {/* Maximize / Restore Toggle */}
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer rounded-lg transition-colors"
              onClick={isMaximized ? restoreCall : maximizeCall}
              title={isMaximized ? "Restore window size" : "Maximize fullscreen"}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>

            {/* Close / End Call */}
            <Button
              size="icon"
              className="h-8 w-8 bg-rose-500 hover:bg-rose-600 text-white cursor-pointer rounded-lg ml-1"
              onClick={endCall}
              title="End call"
            >
              <PhoneOff className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Jitsi Iframe Video Feed */}
        <div className="flex-1 w-full h-full bg-slate-950 relative">
          <iframe
            title="Jitsi Video Meeting"
            src={callingURI}
            allow="camera; microphone; fullscreen; display-capture; autoplay"
            className="w-full h-full border-none"
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
