'use client';

import React, { memo, useState } from "react";
import { RiCheckLine } from "react-icons/ri";
import { MdMoreVert, MdDelete } from "react-icons/md";
import useResponsive from "../hook/useResponsive";
import { BASE_URL } from "@/app/services/auth-services";
import { useChatContext } from "../context/Chatcontext";
import { toast } from "sonner";
import {
  useCheckPrivateRoomMutation,
  useUpdateRoomMutation,
  useDeleteRoomMutation,
  useUpdateChatReadFlagMutation,
} from "../api/ChatQueryAPI";
import moment from "moment";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const truncateText = (text: string, length: number) => {
  return text?.length > length ? `${text.slice(0, length)}...` : text;
};

// Reusable Tailwind AvatarCircle component to replace legacy MUI avatar components
export const AvatarCircle = ({
  size = "50px",
  title = "",
  image = "",
}: {
  size?: string | number;
  title?: string;
  image?: string;
}) => {
  const initials = title
    ? title
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  // Generate a consistent pastel color based on title hash
  const colors = [
    "bg-red-500 text-white",
    "bg-orange-500 text-white",
    "bg-amber-500 text-white",
    "bg-yellow-600 text-white",
    "bg-lime-600 text-white",
    "bg-green-600 text-white",
    "bg-emerald-600 text-white",
    "bg-teal-600 text-white",
    "bg-cyan-600 text-white",
    "bg-sky-600 text-white",
    "bg-blue-600 text-white",
    "bg-indigo-600 text-white",
    "bg-violet-600 text-white",
    "bg-purple-600 text-white",
    "bg-fuchsia-600 text-white",
    "bg-pink-600 text-white",
    "bg-rose-600 text-white",
  ];
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash) % colors.length;
  const colorClass = colors[colorIndex];

  const sizeStyle = typeof size === 'number' ? { width: size, height: size } : { width: size, height: size };

  return (
    <Avatar style={sizeStyle} className="rounded-full shadow-sm flex-shrink-0 border border-slate-200 dark:border-slate-800">
      {image && <AvatarImage src={image} alt={title} className="object-cover w-full h-full" />}
      <AvatarFallback className={`${colorClass} font-semibold text-xs flex items-center justify-center`}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
};

interface ChatElementProps {
  room?: any;
  user?: any;
  check?: boolean;
  createGroup?: string;
  online?: boolean;
  handleSelectPerson?: (user: any) => void;
  person?: any;
  HandleRefresh?: () => void;
  messageCount?: number;
  sendedDate?: string;
  avatarSize?: string | number;
}

const ChatElement = ({
  room,
  user: userProp,
  check,
  createGroup,
  online,
  handleSelectPerson,
  person,
  HandleRefresh,
  messageCount = 0,
  sendedDate,
  avatarSize = "50px",
}: ChatElementProps) => {
  const user = room || userProp;
  const UserId = typeof window !== 'undefined' ? parseInt(localStorage.getItem("userId") || localStorage.getItem("UserId") || "0") : 0;

  const { setSelectedRoom, setInitialMessages, typingUsers, onlineUsers } = useChatContext();
  const [checkPrivateRoom] = useCheckPrivateRoomMutation();
  const [updateRoom] = useUpdateRoomMutation();
  const [deleteRoom] = useDeleteRoomMutation();
  const [updateChatReadFlag] = useUpdateChatReadFlagMutation();

  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openInfoDialog, setOpenInfoDialog] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [editName, setEditName] = useState("");

  const handleEditClose = (event?: any) => {
    if (event) event.stopPropagation();
    setOpenEditDialog(false);
  };

  const handleUpdateRoom = async (event: any) => {
    event.stopPropagation();
    const roomId = room?.room_id || room?.id;
    if (!roomId) return;

    try {
      await updateRoom({
        id: roomId,
        name: editName,
      }).unwrap();
      toast.success(
        `${room?.room_type === "group" ? "Group" : "Chat"} updated successfully!`
      );
      handleEditClose();
    } catch (err) {
      console.error("Failed to update room:", err);
      toast.error(
        `Failed to update ${room?.room_type === "group" ? "group" : "chat"}.`
      );
    }
  };

  const handleDeleteRoom = (event: any) => {
    event.stopPropagation();
    setOpenDeleteDialog(true);
    setDropdownOpen(false);
  };

  const handleConfirmDelete = async () => {
    const roomId = room?.room_id || room?.id;
    if (!roomId) return;

    try {
      await deleteRoom(roomId).unwrap();
      toast.success(
        `${room?.room_type === "group" ? "Group" : "Chat"} deleted successfully!`
      );
      if (typeof HandleRefresh === "function") HandleRefresh();
    } catch (err) {
      console.error("Failed to delete room:", err);
      toast.error(
        `Failed to delete ${room?.room_type === "group" ? "group" : "chat"}.`
      );
    }
  };

  const handleInfoClose = (event?: any) => {
    if (event) event.stopPropagation();
    setOpenInfoDialog(false);
  };

  const handleSelectUser = async () => {
    if (createGroup !== "create group") {
      if (room) {
        const normalizedRoom = {
          ...room,
          id: room.room_id || room.id,
          name: room.Participant_Name || room.name || "Unknown",
        };

        const isGroup = room.room_type === "group" || room.type === "group";
        if (!isGroup) {
          const targetUserId = room.Participant_id || room.receivers?.[0]?.id || room.id;
          if (targetUserId && Number(targetUserId) !== Number(UserId)) {
            checkPrivateRoom({
              participant_1: UserId,
              participant_2: Number(targetUserId),
            })
              .unwrap()
              .then((res: any) => {
                console.log("CheckPrivateRoom Response:", res);
              })
              .catch((err: any) => {
                console.error("CheckPrivateRoom Error:", err);
              });
          }
        }

        const otherId = room.Participant_id || room.id;
        if (otherId) {
          updateChatReadFlag({
            receiverId: UserId,
            senderId: otherId,
          });
        }

        setSelectedRoom(normalizedRoom);
        setInitialMessages(room.Participant_Conversation || []);
      }
    } else if (!person && typeof handleSelectPerson === 'function') {
      handleSelectPerson(user);
    }
  };

  const renderBadge = () => {
    if (check === true) {
      return (
        <div className="relative">
          <AvatarCircle
            size={avatarSize}
            title={
              !user?.User_Photo
                ? user?.username ||
                  (user?.first_name || user?.last_name
                    ? `${user?.first_name || ""} ${user?.last_name || ""}`
                    : "") ||
                  user?.Group_Name
                : ""
            }
            image={
              (room?.User_Photo || user?.User_Photo)
                ? `${BASE_URL}${room?.User_Photo || user?.User_Photo}`
                : ""
            }
          />
          <div className="absolute bottom-0 right-0 transform translate-x-1 translate-y-0.5 bg-green-600 rounded-full p-0.5 border border-white text-white">
            <RiCheckLine size={10} />
          </div>
        </div>
      );
    }

    const targetUserId = Number(room?.Participant_id || room?.id || userProp?.id || user?.id);
    const isOnline = onlineUsers[targetUserId]?.status === "online";

    return (
      <div className="relative">
        <AvatarCircle
          size={avatarSize}
          title={
            room?.Participant_Name ||
            room?.room_name ||
            room?.name ||
            user?.username ||
            (user?.first_name || user?.last_name
              ? `${user?.first_name || ""} ${user?.last_name || ""}`
              : "") ||
            user?.Group_Name
          }
          image={
            (room?.Participant_Photo || room?.User_Photo || user?.User_Photo)
              ? `${BASE_URL}${room?.Participant_Photo || room?.User_Photo || user?.User_Photo}`
              : ""
          }
        />
        {room?.room_type !== "group" && targetUserId && (
          <div className="absolute bottom-0.5 right-0.5">
            <span className="relative flex h-3 w-3">
              {isOnline && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-3 w-3 border-2 border-white ${
                  isOnline ? "bg-green-500" : "bg-slate-400"
                }`}
              />
            </span>
          </div>
        )}
      </div>
    );
  };

  const isUnread = room?.unread_count > 0 || messageCount > 0;
  const roomUnreadCount = room?.unread_count || messageCount;

  return (
    <>
      <div
        onClick={handleSelectUser}
        className="group relative flex items-center justify-between p-3.5 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-xl cursor-pointer transition-colors duration-200 mb-1"
      >
        {isUnread && (
          <div className="absolute bottom-3.5 right-3.5 min-w-[20px] h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-semibold px-1.5 z-10 shadow-sm animate-pulse">
            {roomUnreadCount}
          </div>
        )}
        
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          {!online ? (
            renderBadge()
          ) : (
            <AvatarCircle
              size={avatarSize}
              title={
                user?.username ||
                (user?.first_name || user?.last_name
                  ? `${user?.first_name || ""} ${user?.last_name || ""}`
                  : "") ||
                user?.Group_Name
              }
              image={user?.User_Photo ? `${BASE_URL}${user?.User_Photo}` : ""}
            />
          )}
          
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
              {room?.room_type === "group"
                ? room?.room_name || room?.name
                : room?.Participant_Name ||
                  room?.name ||
                  user?.username ||
                  (user?.first_name || user?.last_name
                    ? `${user?.first_name || ""} ${user?.last_name || ""}`
                    : "") ||
                  user?.Group_Name}
            </span>
            
            {!createGroup && (
              <div className="flex items-center space-x-1 mt-0.5">
                {/* Last message sender feedback check ticks */}
                {room?.Participant_Conversation?.[
                  room.Participant_Conversation.length - 1
                ]?.Participant_id === UserId && (
                  <div className="flex items-center">
                    <RiCheckLine
                      size={14}
                      className={
                        room.Participant_Conversation[
                          room.Participant_Conversation.length - 1
                        ].is_unread === false ||
                        room.Participant_Conversation[
                          room.Participant_Conversation.length - 1
                        ].is_unread === "false"
                          ? "text-sky-500"
                          : "text-slate-400"
                      }
                    />
                  </div>
                )}
                
                <span
                  className={`text-xs truncate max-w-[180px] ${
                    room &&
                    typingUsers[Number(room.room_id || room.id)] &&
                    Object.keys(typingUsers[Number(room.room_id || room.id)]).length > 0
                      ? "text-emerald-600 font-semibold"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {room &&
                  typingUsers[Number(room.room_id || room.id)] &&
                  Object.keys(typingUsers[Number(room.room_id || room.id)]).length > 0
                    ? "Typing..."
                    : truncateText(
                        room?.last_message ||
                          room?.Participant_Conversation?.[
                            room.Participant_Conversation.length - 1
                          ]?.message ||
                          room?.Participant_Conversation?.[
                            room.Participant_Conversation.length - 1
                          ]?.Participant_Message ||
                          user?.Designation ||
                          "",
                        30
                      )}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end justify-between self-stretch pl-2">
          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium whitespace-nowrap">
            {room?.last_message_time
              ? moment(room.last_message_time).format("h:mm A")
              : ""}
          </span>
          
          {room && !createGroup && (
            <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
              <DropdownMenuTrigger
                onClick={(e) => e.stopPropagation()}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/80 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
              >
                <MdMoreVert size={16} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-28" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem
                  onClick={handleDeleteRoom}
                  className="text-red-600 focus:text-red-600 dark:focus:text-red-400 flex items-center gap-2 cursor-pointer text-xs"
                >
                  <MdDelete size={16} />
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
        <DialogContent onClick={(e) => e.stopPropagation()} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-800 dark:text-slate-200">Edit Group Name</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              autoFocus
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Group Name"
              className="w-full"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleEditClose} size="sm">
              Cancel
            </Button>
            <Button onClick={handleUpdateRoom} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Info Dialog */}
      <Dialog open={openInfoDialog} onOpenChange={setOpenInfoDialog}>
        <DialogContent onClick={(e) => e.stopPropagation()} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-800 dark:text-slate-200">Group Information</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="font-semibold text-sm text-slate-700 dark:text-slate-300">
              Participants: {room?.Participant_List?.length || 0}
            </p>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {room?.Participant_List?.map((p: any, index: number) => (
                <div key={index} className="flex items-center space-x-2.5 py-1">
                  <AvatarCircle size={28} title={p.Participant_Name} />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {p.Participant_Name}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleInfoClose} size="sm">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-800 dark:text-slate-200">Delete Chat</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 dark:text-slate-400">
              Are you sure you want to delete this room? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel size="sm">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white font-medium size-sm"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default memo(ChatElement);
