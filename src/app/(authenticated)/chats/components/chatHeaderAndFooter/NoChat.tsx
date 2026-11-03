'use client';

import React, { memo } from "react";
import { MessageSquare } from "lucide-react";

interface NoChatProps {
  [key: string]: any;
}

function NoChat({ ...other }: NoChatProps) {
  return (
    <div
      {...other}
      className="flex flex-col items-center justify-center p-6 text-center space-y-4 select-none"
    >
      <div className="p-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 animate-bounce duration-1000">
        <MessageSquare className="w-16 h-16 stroke-[1.5]" />
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
          No Chat Selected
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
          Select a conversation from the sidebar or start a new chat to begin messaging.
        </p>
      </div>
    </div>
  );
}

export default memo(NoChat);
