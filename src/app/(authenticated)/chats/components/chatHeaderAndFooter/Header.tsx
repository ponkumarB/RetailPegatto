'use client';

import React, { useState, memo } from "react";
import {
  MdChevronLeft,
  MdMoreVert,
} from "react-icons/md";
import useResponsive from "../../hook/useResponsive";
import { BASE_URL } from "@/app/services/auth-services";
import { AvatarCircle } from "../ChatElement";
import ProfileInfo from "./ProfileInfo";
import { useChatContext } from "../../context/Chatcontext";
import ChatSettingsDialog from "./ChatSettingsDialog";

const ChatHeader = () => {
  const {
    selectedRoom,
    setSelectedRoom,
    onlineUsers,
  } = useChatContext();
  const [toggleProfileInfo, setToggleProfileInfo] = useState<any>(null);
  const [openSettings, setOpenSettings] = useState(false);

  const isMobile = useResponsive("down", "md");

  const targetUserId = Number(selectedRoom?.Participant_id || selectedRoom?.id);
  const isOnline = onlineUsers[targetUserId]?.status === "online";
  const lastSeen = onlineUsers[targetUserId]?.last_seen;

  return (
    <>
      <div className="py-2 px-4 w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-10 flex-shrink-0">
        <div className="flex items-center justify-between h-full w-full">
          <div className="flex items-center space-x-3 min-w-0">
            {isMobile && (
              <button
                onClick={() => setSelectedRoom(null)}
                className="p-1 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors mr-0.5"
                title="Back to Chats"
              >
                <MdChevronLeft size={24} />
              </button>
            )}
            
            <div
              onClick={(e) => setToggleProfileInfo(e.currentTarget)}
              className="cursor-pointer transition-transform hover:scale-102 flex-shrink-0"
              title="View Chat Details"
            >
              <AvatarCircle
                size="42px"
                title={selectedRoom?.room_name || selectedRoom?.name || "Unknown"}
                image={
                  (selectedRoom?.Participant_Photo || selectedRoom?.User_Photo)
                    ? BASE_URL + (selectedRoom?.Participant_Photo || selectedRoom?.User_Photo)
                    : undefined
                }
              />
            </div>
            
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                {selectedRoom?.room_name || selectedRoom?.name}
              </span>

              {selectedRoom?.room_type === "group" ? (
                selectedRoom?.Participant_List && (
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    {selectedRoom.Participant_List.length} participants
                  </span>
                )
              ) : (
                <span
                  className={`text-[11px] font-medium leading-none mt-0.5 ${
                    isOnline ? "text-green-600 dark:text-green-500" : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {isOnline ? (
                    "Online"
                  ) : lastSeen ? (
                    `Last seen ${lastSeen}`
                  ) : (
                    "Offline"
                  )}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-1 flex-shrink-0">
            <button
              onClick={() => setOpenSettings(true)}
              className="p-2 rounded-full text-slate-500 hover:bg-slate-105 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              title="Chat Settings"
            >
              <MdMoreVert size={20} />
            </button>
          </div>
        </div>
      </div>

      <ProfileInfo open={toggleProfileInfo} setOpen={setToggleProfileInfo} />
      
      <ChatSettingsDialog
        open={openSettings}
        handleClose={() => setOpenSettings(false)}
        roomId={selectedRoom?.id}
      />
    </>
  );
};

export default memo(ChatHeader);
