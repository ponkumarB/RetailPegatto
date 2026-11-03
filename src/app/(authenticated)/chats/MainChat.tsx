'use client';

import React, { memo } from "react";
import GeneralApp from "./dashboard/GeneralApp";
import { ChatProvider } from "./context/Chatcontext";

function MainChat() {
  return (
    <ChatProvider>
      <div className="flex flex-1 flex-col h-full min-w-0 bg-white dark:bg-slate-900 overflow-hidden">
        <GeneralApp />
      </div>
    </ChatProvider>
  );
}

export default memo(MainChat);
