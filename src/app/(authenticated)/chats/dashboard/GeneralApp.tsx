'use client';

import React from "react";
import NoChat from "../components/chatHeaderAndFooter/NoChat";
import ChatComponent from "./ChatComponent";
import ChatLeftSide from "./ChatLeftSide";
import { useChatContext } from "../context/Chatcontext";
import useResponsive from "../hook/useResponsive";
import { ReactionDetailsDialog } from "./Conversation";
import { fetchFromApi } from "@/service/apiClient";

function GeneralApp() {
  const { selectedRoom, sidebarOpen, setSidebarOpen } = useChatContext();
  
  const updateUserStatus = React.useCallback(async (isOffline = false) => {
    const UserId = typeof window !== 'undefined'
      ? localStorage.getItem("userId") || localStorage.getItem("UserId")
      : null;
    if (!UserId) return;
    try {
      await fetchFromApi(`/user/UserChatList/?user_id=${UserId}${isOffline ? "&offline=true" : ""}`, {
        method: 'GET'
      });
    } catch {
      // Quietly ignore heartbeat/status errors so they do not pollute console
    }
  }, []);

  React.useEffect(() => {
    const UserId = localStorage.getItem("userId") || localStorage.getItem("UserId");
    if (!UserId) return;

    // Set online when entering chat
    updateUserStatus(false);

    // Heartbeat every 50 seconds
    const interval = setInterval(() => updateUserStatus(false), 50000);

    // Set offline when leaving or closing tab
    const handleUnload = () => updateUserStatus(true);
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", handleUnload);
      updateUserStatus(true); // Call offline API on unmount
    };
  }, [updateUserStatus]);

  const isMobile = useResponsive("down", "md");
  const [sidebarWidth, setSidebarWidth] = React.useState(350);
  const [isResizing, setIsResizing] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const startResizing = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = React.useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = React.useCallback((e: MouseEvent) => {
    if (isResizing && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = e.clientX - containerRect.left;
      if (newWidth >= 250 && newWidth <= 600) {
        setSidebarWidth(newWidth);
      }
    }
  }, [isResizing]);

  React.useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);

  const hasSelectedChat = Boolean(selectedRoom);

  return (
    <div
      ref={containerRef}
      className="w-full relative overflow-hidden flex flex-col h-full"
    >
      <div className="flex h-full w-full">
        {/* Mobile View */}
        {isMobile ? (
          <div className="flex-1 h-full">
            {hasSelectedChat ? <ChatComponent /> : <ChatLeftSide />}
          </div>
        ) : (
          /* Desktop View */
          <>
            {/* Left Side */}
            {sidebarOpen && (
              <>
                <div style={{ width: sidebarWidth }} className="h-full flex-shrink-0">
                  <ChatLeftSide />
                </div>
                {/* Resizer Handle */}
                <div
                  onMouseDown={startResizing}
                  className={`w-[4px] cursor-col-resize h-full z-10 transition-colors duration-200 ${
                    isResizing ? "bg-emerald-600" : "bg-slate-200 dark:bg-slate-800 hover:bg-emerald-600"
                  }`}
                />
              </>
            )}

            {/* Right Side */}
            <div className="flex-1 h-full min-w-0 relative">
              {hasSelectedChat ? (
                <ChatComponent />
              ) : (
                <div className="h-full w-full flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-900/40">
                  <NoChat />
                </div>
              )}
            </div>
          </>
        )}
      </div>
      <ReactionDetailsDialog />
    </div>
  );
}

export default GeneralApp;
