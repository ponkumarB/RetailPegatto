'use client';

import React, { useState, useEffect } from "react";
import { IoMdClose, IoMdCheckmark, IoMdArrowDropdown } from "react-icons/io";
import { BsCheckAll } from "react-icons/bs";
import { MdOutlineEmojiEmotions, MdDelete, MdPhoneMissed } from "react-icons/md";
import { VscCallIncoming, VscCallOutgoing } from "react-icons/vsc";
import { SlCallEnd } from "react-icons/sl";
import {
  FaFileArchive,
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFilePowerpoint,
  FaFileAlt,
  FaFileCode,
} from "react-icons/fa";
import { AiOutlineCloudDownload } from "react-icons/ai";
import { BASE_URL } from "@/app/services/auth-services";
import useResponsive from "../hook/useResponsive";
import {
  useUpdateRoomMessageMutation,
  useAddReactionMutation,
  useGetUserDropdownListQuery,
  useDeleteRoomMessageMutation,
  useDeleteMessageVisibilityMutation,
  useDeleteReactionMutation,
  useGetParticipantsQuery,
} from "../api/ChatQueryAPI";
import { useChatContext } from "../context/Chatcontext";
import { toast } from "sonner";
import moment from "moment";
import dynamic from "next/dynamic";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Dynamically import emoji-mart to safeguard against SSR window mismatches
const Picker = dynamic(() => import("@emoji-mart/react"), { ssr: false });
import emojiData from "@emoji-mart/data";

// Helper to resolve filenames
export const getFileName = (fileUrl: string) => {
  if (!fileUrl) return "";
  return fileUrl.split("/").pop() || "";
};

// Helper to format endpoints and paths
export const getMediaUrl = (fileUrl: string, msg?: any) => {
  const attachment =
    msg?.attachments && msg.attachments.length > 0 ? msg.attachments[0] : null;
  const path = attachment ? attachment.file : fileUrl;

  if (!path) return "";
  if (path.startsWith("http")) return path;

  const baseUrl = BASE_URL.endsWith("/") ? BASE_URL.slice(0, -1) : BASE_URL;
  const file = path.startsWith("/") ? path : "/" + path;
  return baseUrl + file;
};

// File download function utilizing fetch
const handleDownload = async (msg: any) => {
  try {
    const attachment =
      msg?.attachments && msg.attachments.length > 0
        ? msg.attachments[0]
        : null;
    let url = "";
    let fileName = "";

    if (attachment) {
      const rawFile = attachment.file || "";
      const name = rawFile.split("/").pop();
      const baseUrl = BASE_URL.endsWith("/") ? BASE_URL.slice(0, -1) : BASE_URL;
      url = `${baseUrl}/user/${name}/`;
      fileName = name;
    } else {
      url = getMediaUrl(msg?.File, msg);
      fileName = getFileName(url);
    }

    const token = localStorage.getItem("token") || localStorage.getItem("accesstoken");
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        db: "crmuseradmin1",
      },
    });
    const blob = await response.blob();

    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Error downloading file:", error);
    toast.error("Failed to download file.");
  }
};

const ViewImage = (msg: any) => {
  window.open(getMediaUrl(msg?.File || msg?.attachments?.[0]?.file, msg), "_blank");
};

// Get react-icon based on file extension
const getFileIcon = (fileName: string) => {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  switch (ext) {
    case "pdf":
      return <FaFilePdf className="w-10 h-10 text-rose-500" />;
    case "doc":
    case "docx":
      return <FaFileWord className="w-10 h-10 text-blue-500" />;
    case "xls":
    case "xlsx":
    case "csv":
      return <FaFileExcel className="w-10 h-10 text-emerald-600" />;
    case "ppt":
    case "pptx":
      return <FaFilePowerpoint className="w-10 h-10 text-orange-500" />;
    case "zip":
    case "rar":
    case "7z":
    case "tar":
    case "gz":
      return <FaFileArchive className="w-10 h-10 text-amber-500" />;
    case "js":
    case "html":
    case "xml":
    case "json":
    case "css":
      return <FaFileCode className="w-10 h-10 text-violet-500" />;
    default:
      return <FaFileAlt className="w-10 h-10 text-slate-400" />;
  }
};

const Timestamp = ({
  date,
  isSender,
  readStatus,
  isEdited,
  seenBy,
  isSeen,
}: {
  date: string;
  isSender: boolean;
  readStatus: any;
  isEdited?: boolean;
  seenBy?: any[];
  isSeen?: boolean;
  isGroup?: boolean;
}) => {
  const isRead =
    isSeen ||
    (seenBy && seenBy.length > 0) ||
    readStatus === "read" ||
    readStatus === false ||
    readStatus === "false";

  return (
    <div className="flex items-center space-x-1 justify-end mt-1 text-[10px] text-slate-500 select-none">
      {isEdited && <span className="italic">edited</span>}
      <span>
        {new Date(date).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </span>
      {isSender && (
        <div className="flex items-center">
          {isRead ? (
            <BsCheckAll size={16} className="text-sky-500" />
          ) : readStatus === "delivered" ? (
            <BsCheckAll size={16} className="text-slate-400" />
          ) : (
            <IoMdCheckmark size={12} className="text-slate-400" />
          )}
        </div>
      )}
    </div>
  );
};

const ReplyMessage = ({ reply }: { reply: any }) => {
  if (!reply) return null;
  return (
    <div className="bg-slate-100/80 dark:bg-slate-800/80 border-l-4 border-emerald-600 rounded p-1.5 mb-1.5 text-xs">
      <span className="font-bold text-emerald-700 dark:text-emerald-500 block mb-0.5">
        Replying to:
      </span>
      <p className="text-slate-600 dark:text-slate-350 truncate">
        {reply.message}
      </p>
    </div>
  );
};

const Reactions = ({ reactions }: { reactions: any[] }) => {
  const { setReactionDetails } = useChatContext();
  if (!reactions || reactions.length === 0) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setReactionDetails({ reactions, open: true });
  };

  const uniqueEmojis = Array.from(new Set(reactions.map((r) => r.reaction))).slice(0, 3);

  return (
    <div
      className="absolute -bottom-2.5 right-3 flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-full px-2 py-0.5 gap-1 shadow-md hover:scale-105 transition-all duration-200 cursor-pointer select-none z-10"
      onClick={handleClick}
    >
      <div className="flex items-center gap-0.5">
        {uniqueEmojis.map((emoji, i) => (
          <span key={i} className="text-[13px] leading-none">
            {emoji}
          </span>
        ))}
      </div>
      {reactions.length > 1 && (
        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-none pl-0.5 pr-0.5">
          {reactions.length}
        </span>
      )}
    </div>
  );
};

const useSender = (msg: any) => {
  const { selectedRoom } = useChatContext();
  const UserId = typeof window !== 'undefined' ? (localStorage.getItem("userId") || localStorage.getItem("UserId")) : null;
  const msgSenderId = Number(
    msg?.Participant_id ||
    msg?.sender?.id ||
    msg?.sender ||
    msg?.SenderId ||
    msg?.sender_id
  );

  const { data: participants } = useGetParticipantsQuery(selectedRoom?.id, {
    skip:
      !(
        selectedRoom?.room_type === "group" ||
        selectedRoom?.type === "group" ||
        selectedRoom?.is_group
      ) || !selectedRoom?.id,
  });

  const getSenderData = () => {
    if (msgSenderId === Number(UserId)) {
      const currentUser = typeof window !== 'undefined' ? (() => {
        try {
          const data = localStorage.getItem("userData");
          if (data) {
            const parsed = JSON.parse(data);
            return {
              ...parsed,
              username: parsed.name || parsed.username || "",
              User_Photo: parsed.avatarUrl || parsed.User_Photo || "",
              Designation: parsed.jobTitle || parsed.Designation || "",
            };
          }
        } catch(e) {}
        return JSON.parse(localStorage.getItem("UserDetails") || "{}");
      })() : {};
      return {
        username: currentUser?.username || "Me",
        photo: currentUser?.User_Photo,
        isMe: true,
      };
    }

    if (msg?.sender && typeof msg.sender === "object") {
      return {
        username: msg.sender.username || "Unknown",
        photo: msg.sender.User_Photo,
        isMe: false,
      };
    }

    if (msg?.Participant_Name || msg?.Participant_Photo) {
      return {
        username: msg.Participant_Name || "Unknown",
        photo: msg.Participant_Photo,
        isMe: msgSenderId === Number(UserId),
      };
    }

    if (msg?.senderDetails) {
      return {
        username: msg.senderDetails.username || "Unknown",
        photo: msg.senderDetails.User_Photo,
        isMe: false,
      };
    }

    if (participants && participants.length > 0) {
      const participant = participants.find(
        (p: any) =>
          Number(p.user?.id || p.user) === msgSenderId ||
          Number(p.UserId) === msgSenderId
      );
      if (participant) {
        return {
          username:
            participant.user_name ||
            participant.user?.username ||
            "Unknown User",
          photo: participant.user?.User_Photo || participant.User_Photo,
          isMe: false,
        };
      }
    }

    return { username: "Unknown User", photo: null, isMe: false };
  };

  const isGroup = !!(
    selectedRoom?.room_type === "group" ||
    selectedRoom?.type === "group" ||
    selectedRoom?.is_group
  );

  return { ...getSenderData(), isGroup };
};

const SenderName = ({ sender }: { sender: any }) => {
  if (!sender.isGroup) return null;
  return (
    <span className="block text-[10px] font-bold text-emerald-700 dark:text-emerald-500 mb-0.5 truncate max-w-[150px]">
      {sender.username === "Me" ? "~ You" : `~ ${sender.username}`}
    </span>
  );
};

const MessageOption = ({ msg }: { msg: any }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [reactionOpen, setReactionOpen] = useState(false);
  
  const {
    setEditMessage,
    setDeleteMessageItem,
    setReplyToMessage,
    selectedRoom,
  } = useChatContext();
  const [addReaction] = useAddReactionMutation();

  const onSelectReaction = async (emoji: string) => {
    try {
      await addReaction({
        message: msg.id,
        user: parseInt(localStorage.getItem("userId") || localStorage.getItem("UserId") || "0"),
        reaction: emoji,
        room: selectedRoom?.id,
      }).unwrap();
    } catch (error) {
      console.error("Failed to add reaction:", error);
      toast.error("Failed to add reaction");
    }
    setReactionOpen(false);
  };

  const handleReply = () => {
    setReplyToMessage(msg);
    setDropdownOpen(false);
  };

  const handleEdit = () => {
    if (msg?.message || msg?.Meassage || msg?.file || msg?.File) {
      setEditMessage(msg);
    }
    setDropdownOpen(false);
  };

  const handleDelete = () => {
    setDeleteMessageItem(msg);
    setDropdownOpen(false);
  };

  const UserId = typeof window !== 'undefined' ? (localStorage.getItem("userId") || localStorage.getItem("UserId")) : null;
  const msgSenderId = Number(
    msg?.Participant_id ||
    msg?.sender?.id ||
    msg?.sender ||
    msg?.SenderId ||
    msg?.sender_id
  );
  const isMe = msgSenderId === Number(UserId);

  const emojis = ["👍", "❤️", "😂", "😮", "😢", "🙏"];
  const content = msg?.message || msg?.Participant_Message || msg?.Meassage;
  const isMessageDeleted = content === "This message was deleted";

  return (
    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity ml-1 z-10 self-center">
      {!isMessageDeleted && (
        <Popover open={reactionOpen} onOpenChange={setReactionOpen}>
          <PopoverTrigger className="p-1 rounded-full text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800">
            <MdOutlineEmojiEmotions size={18} />
          </PopoverTrigger>
          <PopoverContent className="w-auto p-1 rounded-full flex space-x-1 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md" side="top" align="center">
            {emojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => onSelectReaction(emoji)}
                className="w-7 h-7 flex items-center justify-center text-base hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-transform active:scale-125 hover:scale-115"
              >
                {emoji}
              </button>
            ))}
          </PopoverContent>
        </Popover>
      )}

      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger className="p-1 rounded-full text-slate-400 hover:text-slate-650 hover:bg-slate-100 dark:hover:bg-slate-800">
          <IoMdArrowDropdown size={18} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-24">
          <DropdownMenuItem onClick={handleReply} className="cursor-pointer text-xs">
            Reply
          </DropdownMenuItem>
          {!isMessageDeleted && isMe && (
            <DropdownMenuItem onClick={handleEdit} className="cursor-pointer text-xs">
              Edit
            </DropdownMenuItem>
          )}
          {!isMessageDeleted && isMe && (
            <DropdownMenuItem onClick={handleDelete} className="text-red-600 focus:text-red-600 dark:focus:text-red-400 cursor-pointer text-xs">
              Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export const ReactionDetailsDialog = () => {
  const { reactionDetails, setReactionDetails } = useChatContext();
  const { data: userList } = useGetUserDropdownListQuery(undefined);
  const [deleteReaction] = useDeleteReactionMutation();
  const currentUserId = typeof window !== 'undefined' ? Number(localStorage.getItem("userId") || localStorage.getItem("UserId")) : 0;

  if (!reactionDetails) return null;

  const handleClose = () => {
    setReactionDetails(null);
  };

  const getUserName = (userId: any) => {
    if (!userList) return `User ${userId}`;
    const user = userList.find((u: any) => u.id == userId);
    return user ? user.username : `User ${userId}`;
  };

  const getUserPhoto = (userId: any) => {
    if (!userList) return "";
    const user = userList.find((u: any) => u.id == userId);
    return user
      ? user.user_photo || user.Participant_Photo || ""
      : "";
  };

  const handleDeleteReaction = async (reactionId: any) => {
    try {
      await deleteReaction(reactionId).unwrap();
      toast.success("Reaction removed");

      const updatedReactions = reactionDetails.reactions.filter(
        (r: any) => r.id !== reactionId
      );
      if (updatedReactions.length === 0) {
        handleClose();
      } else {
        setReactionDetails({
          ...reactionDetails,
          reactions: updatedReactions,
        });
      }
    } catch (error) {
      console.error("Failed to delete reaction:", error);
      toast.error("Failed to delete reaction");
    }
  };

  return (
    <Dialog open={reactionDetails.open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-slate-800 dark:text-slate-200">Reactions</DialogTitle>
        </DialogHeader>
        <div className="py-2 max-h-60 overflow-y-auto pr-1 space-y-1.5 scrollbar-thin">
          {reactionDetails.reactions.map((r: any, index: number) => {
            const userId = r.user_id || r.User_id;
            const userName = r.user_name || r.Participant_Name || getUserName(userId);
            const userPhoto = r.user_photo || r.Participant_Photo || getUserPhoto(userId);
            const isMyReaction = Number(userId) === currentUserId;

            return (
              <div
                key={index}
                onClick={isMyReaction ? () => handleDeleteReaction(r.id) : undefined}
                className={`flex items-center justify-between p-2 rounded-xl border border-transparent transition-colors ${
                  isMyReaction ? "hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer hover:border-slate-200/50" : ""
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Avatar className="w-8 h-8 rounded-full border border-slate-100">
                    {userPhoto && <AvatarImage src={userPhoto} alt={userName} />}
                    <AvatarFallback className="text-[10px] font-semibold bg-emerald-600 text-white">
                      {userName.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-250 truncate">{userName}</span>
                    {isMyReaction && <span className="text-[9px] text-slate-400">Tap to remove</span>}
                  </div>
                </div>
                <span className="text-lg pr-1.5">{r.reaction}</span>
              </div>
            );
          })}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} size="sm">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const TextMsg = ({ msg, menu }: { msg: any; menu: boolean }) => {
  const sender = useSender(msg);
  const content = msg?.message || msg?.Participant_Message || msg?.Meassage;
  const msgDate = msg?.created_at || msg?.SendedDate;
  const hasReactions = msg?.reactions && msg.reactions.length > 0;

  return (
    <div className={`flex items-end px-1 group ${hasReactions ? "mb-3.5 mt-1" : "my-1"} ${sender.isMe ? "justify-end" : "justify-start"}`}>
      <div
        className={`relative p-2.5 rounded-2xl shadow-sm border ${hasReactions ? "min-w-[80px]" : ""} max-w-[75%] ${
          sender.isMe
            ? "bg-emerald-50 border-emerald-100/50 dark:bg-emerald-950/20 dark:border-emerald-900/40 text-slate-800 dark:text-slate-150 rounded-br-sm"
            : "bg-white border-slate-200/60 dark:bg-slate-900 dark:border-slate-800/80 text-slate-800 dark:text-slate-200 rounded-bl-sm"
        }`}
      >
        <SenderName sender={sender} />
        <ReplyMessage reply={msg?.reply_message} />
        <p className="text-xs md:text-sm font-medium leading-relaxed whitespace-pre-wrap break-words">
          {content}
        </p>
        <Reactions reactions={msg?.reactions} />
        <Timestamp
          date={msgDate}
          isSender={sender.isMe}
          readStatus={msg?.is_unread}
          seenBy={msg?.seen_by}
          isSeen={msg?.is_seen}
          isEdited={msg?.is_edited || msg?.isEdited}
        />
      </div>
      {menu && <MessageOption msg={msg} />}
    </div>
  );
};

export const MediaMsg = ({ msg, menu }: { msg: any; menu: boolean }) => {
  const sender = useSender(msg);
  const content = msg?.message || msg?.Meassage;
  const hasReactions = msg?.reactions && msg.reactions.length > 0;

  const getEmbedUrl = (url: string) => {
    const videoID = url?.split("v=")[1]?.split("&")[0];
    return videoID ? `https://www.youtube.com/embed/${videoID}` : "";
  };

  return (
    <div className={`flex items-end px-1 group ${hasReactions ? "mb-4 mt-1.5" : "my-1.5"} ${sender.isMe ? "justify-end" : "justify-start"}`}>
      <div
        className={`relative p-2.5 rounded-2xl shadow-sm border w-full max-w-[340px] ${
          sender.isMe
            ? "bg-emerald-50 border-emerald-100/50 dark:bg-emerald-950/20 dark:border-emerald-900/40 rounded-br-sm"
            : "bg-white border-slate-200/60 dark:bg-slate-900 dark:border-slate-800/80 rounded-bl-sm"
        }`}
      >
        <SenderName sender={sender} />
        <ReplyMessage reply={msg?.reply_message} />
        <div className="rounded-xl overflow-hidden mt-1 bg-slate-100 dark:bg-slate-800">
          <iframe
            className="w-full h-44 border-0"
            src={getEmbedUrl(content) || ""}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <Reactions reactions={msg?.reactions} />
        <Timestamp
          date={msg?.created_at || msg?.SendedDate}
          isSender={sender.isMe}
          readStatus={msg?.is_unread}
          seenBy={msg?.seen_by}
          isSeen={msg?.is_seen}
          isEdited={msg?.is_edited || msg?.isEdited}
        />
      </div>
      {menu && <MessageOption msg={msg} />}
    </div>
  );
};

export const ImageMsg = ({ msg, menu }: { msg: any; menu: boolean }) => {
  const sender = useSender(msg);
  const url = getMediaUrl(msg?.File, msg);
  const fileName = getFileName(msg?.File);
  const hasReactions = msg?.reactions && msg.reactions.length > 0;

  return (
    <div className={`flex items-end px-1 group ${hasReactions ? "mb-4 mt-1.5" : "my-1.5"} ${sender.isMe ? "justify-end" : "justify-start"}`}>
      <div
        className={`relative p-2 rounded-2xl shadow-sm border max-w-[75%] ${
          sender.isMe
            ? "bg-emerald-50 border-emerald-100/50 dark:bg-emerald-950/20 dark:border-emerald-900/40 rounded-br-sm"
            : "bg-white border-slate-200/60 dark:bg-slate-900 dark:border-slate-800/80 rounded-bl-sm"
        }`}
      >
        <SenderName sender={sender} />
        <ReplyMessage reply={msg?.reply_message} />
        <div className="rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-950/40 border border-slate-200/30 p-1 flex flex-col items-center">
          <img
            src={url}
            alt={fileName}
            className="rounded-lg object-cover max-w-[200px] max-h-[200px] cursor-pointer hover:opacity-95 transition-opacity"
            onClick={() => ViewImage(msg)}
          />
          <div className="flex justify-between items-center w-full px-1.5 mt-2 bg-slate-100 dark:bg-slate-800/60 py-1.5 rounded-lg border border-slate-200/40">
            <span className="text-[10px] truncate max-w-[130px] font-semibold text-slate-700 dark:text-slate-350">
              {fileName.length > 15 ? fileName.substring(0, 15) + "..." : fileName}
            </span>
            <button
              onClick={() => handleDownload(msg)}
              className="p-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center justify-center transition-all"
            >
              <AiOutlineCloudDownload size={13} />
            </button>
          </div>
        </div>
        {Boolean(msg?.message || msg?.Meassage) && (
          <p className="text-xs md:text-sm font-medium mt-2 px-1 text-slate-850 dark:text-slate-200">
            {msg?.message || msg?.Meassage}
          </p>
        )}
        <Reactions reactions={msg?.reactions} />
        <Timestamp
          date={msg?.created_at || msg?.SendedDate}
          isSender={sender.isMe}
          readStatus={msg?.is_unread}
          seenBy={msg?.seen_by}
          isSeen={msg?.is_seen}
          isEdited={msg?.is_edited || msg?.isEdited}
        />
      </div>
      {menu && <MessageOption msg={msg} />}
    </div>
  );
};

export const VideoMsg = ({ msg, menu }: { msg: any; menu: boolean }) => {
  const sender = useSender(msg);
  const url = getMediaUrl(msg?.File, msg);
  const fileName = getFileName(msg?.File);
  const hasReactions = msg?.reactions && msg.reactions.length > 0;

  return (
    <div className={`flex items-end px-1 group ${hasReactions ? "mb-4 mt-1.5" : "my-1.5"} ${sender.isMe ? "justify-end" : "justify-start"}`}>
      <div
        className={`relative p-2 rounded-2xl shadow-sm border max-w-[75%] ${
          sender.isMe
            ? "bg-emerald-50 border-emerald-100/50 dark:bg-emerald-950/20 dark:border-emerald-900/40 rounded-br-sm"
            : "bg-white border-slate-200/60 dark:bg-slate-900 dark:border-slate-800/80 rounded-bl-sm"
        }`}
      >
        <SenderName sender={sender} />
        <ReplyMessage reply={msg?.reply_message} />
        <div className="rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-950/40 border border-slate-200/30 p-1 flex flex-col items-center">
          <video
            className="rounded-lg object-cover max-w-[200px] max-h-[200px] bg-black"
            controls
            src={url}
          />
          <div className="flex justify-between items-center w-full px-1.5 mt-2 bg-slate-100 dark:bg-slate-800/60 py-1.5 rounded-lg border border-slate-200/40">
            <span className="text-[10px] truncate max-w-[130px] font-semibold text-slate-700 dark:text-slate-350">
              {fileName.length > 15 ? fileName.substring(0, 15) + "..." : fileName}
            </span>
            <button
              onClick={() => handleDownload(msg)}
              className="p-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center justify-center transition-all"
            >
              <AiOutlineCloudDownload size={13} />
            </button>
          </div>
        </div>
        {Boolean(msg?.message || msg?.Meassage) && (
          <p className="text-xs md:text-sm font-medium mt-2 px-1 text-slate-850 dark:text-slate-200">
            {msg?.message || msg?.Meassage}
          </p>
        )}
        <Reactions reactions={msg?.reactions} />
        <Timestamp
          date={msg?.created_at || msg?.SendedDate}
          isSender={sender.isMe}
          readStatus={msg?.is_unread}
          seenBy={msg?.seen_by}
          isSeen={msg?.is_seen}
          isEdited={msg?.is_edited || msg?.isEdited}
        />
      </div>
      {menu && <MessageOption msg={msg} />}
    </div>
  );
};

export const AudioMsg = ({ msg, menu }: { msg: any; menu: boolean }) => {
  const sender = useSender(msg);
  const url = getMediaUrl(msg?.File, msg);
  const fileName = getFileName(msg?.File);
  const hasReactions = msg?.reactions && msg.reactions.length > 0;

  return (
    <div className={`flex items-end px-1 group ${hasReactions ? "mb-4 mt-1.5" : "my-1.5"} ${sender.isMe ? "justify-end" : "justify-start"}`}>
      <div
        className={`relative p-2 rounded-2xl shadow-sm border max-w-[75%] ${
          sender.isMe
            ? "bg-emerald-50 border-emerald-100/50 dark:bg-emerald-950/20 dark:border-emerald-900/40 rounded-br-sm"
            : "bg-white border-slate-200/60 dark:bg-slate-900 dark:border-slate-800/80 rounded-bl-sm"
        }`}
      >
        <SenderName sender={sender} />
        <ReplyMessage reply={msg?.reply_message} />
        <div className="rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-950/40 border border-slate-200/30 p-1.5 flex flex-col items-center">
          <audio className="max-w-[200px]" controls src={url} />
          <div className="flex justify-between items-center w-full px-1.5 mt-2 bg-slate-100 dark:bg-slate-800/60 py-1.5 rounded-lg border border-slate-200/40">
            <span className="text-[10px] truncate max-w-[130px] font-semibold text-slate-700 dark:text-slate-350">
              {fileName.length > 15 ? fileName.substring(0, 15) + "..." : fileName}
            </span>
            <button
              onClick={() => handleDownload(msg)}
              className="p-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center justify-center transition-all"
            >
              <AiOutlineCloudDownload size={13} />
            </button>
          </div>
        </div>
        {Boolean(msg?.message || msg?.Meassage) && (
          <p className="text-xs md:text-sm font-medium mt-2 px-1 text-slate-850 dark:text-slate-200">
            {msg?.message || msg?.Meassage}
          </p>
        )}
        <Reactions reactions={msg?.reactions} />
        <Timestamp
          date={msg?.created_at || msg?.SendedDate}
          isSender={sender.isMe}
          readStatus={msg?.is_unread}
          seenBy={msg?.seen_by}
          isSeen={msg?.is_seen}
          isEdited={msg?.is_edited || msg?.isEdited}
        />
      </div>
      {menu && <MessageOption msg={msg} />}
    </div>
  );
};

export const DocMsg = ({ msg, menu }: { msg: any; menu: boolean }) => {
  const sender = useSender(msg);
  const fileUrl = msg?.File || msg?.attachments?.[0]?.file || "";
  const fileName = getFileName(fileUrl);
  const hasReactions = msg?.reactions && msg.reactions.length > 0;

  return (
    <div className={`flex items-end px-1 group ${hasReactions ? "mb-3.5 mt-1" : "my-1"} ${sender.isMe ? "justify-end" : "justify-start"}`}>
      <div
        className={`relative p-2.5 rounded-2xl shadow-sm border max-w-[75%] ${
          sender.isMe
            ? "bg-emerald-50 border-emerald-100/50 dark:bg-emerald-950/20 dark:border-emerald-900/40 rounded-br-sm"
            : "bg-white border-slate-200/60 dark:bg-slate-900 dark:border-slate-800/80 rounded-bl-sm"
        }`}
      >
        <SenderName sender={sender} />
        <ReplyMessage reply={msg?.reply_message} />
        <div className="flex items-center space-x-3 p-2 bg-slate-50 dark:bg-slate-950/30 rounded-xl border border-slate-250/20 min-w-[200px]">
          {getFileIcon(fileName)}
          <div className="flex-1 min-w-0">
            <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 truncate select-all">
              {fileName}
            </span>
            <span className="block text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wide font-medium mt-0.5">
              {fileName.split(".").pop() || "doc"}
            </span>
          </div>
          <button
            onClick={() => handleDownload(msg)}
            className="p-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center justify-center transition-all flex-shrink-0"
          >
            <AiOutlineCloudDownload size={15} />
          </button>
        </div>
        {Boolean(msg?.message || msg?.Meassage) && (
          <p className="text-xs md:text-sm font-medium mt-2 px-1 text-slate-850 dark:text-slate-200">
            {msg?.message || msg?.Meassage}
          </p>
        )}
        <Reactions reactions={msg?.reactions} />
        <Timestamp
          date={msg?.created_at || msg?.SendedDate}
          isSender={sender.isMe}
          readStatus={msg?.is_unread}
          seenBy={msg?.seen_by}
          isSeen={msg?.is_seen}
          isEdited={msg?.is_edited || msg?.isEdited}
        />
      </div>
      {menu && <MessageOption msg={msg} />}
    </div>
  );
};

export const OthersMsg = ({ msg, menu }: { msg: any; menu: boolean }) => {
  const sender = useSender(msg);
  const fileUrl = msg?.File || "";
  const fileName = getFileName(fileUrl);
  const hasReactions = msg?.reactions && msg.reactions.length > 0;

  return (
    <div className={`flex items-end px-1 group ${hasReactions ? "mb-3.5 mt-1" : "my-1"} ${sender.isMe ? "justify-end" : "justify-start"}`}>
      <div
        className={`relative p-2.5 rounded-2xl shadow-sm border max-w-[75%] ${
          sender.isMe
            ? "bg-emerald-50 border-emerald-100/50 dark:bg-emerald-950/20 dark:border-emerald-900/40 rounded-br-sm"
            : "bg-white border-slate-200/60 dark:bg-slate-900 dark:border-slate-800/80 rounded-bl-sm"
        }`}
      >
        <SenderName sender={sender} />
        <ReplyMessage reply={msg?.reply_message} />
        <div className="flex items-center space-x-3 p-2 bg-slate-50 dark:bg-slate-950/30 rounded-xl border border-slate-250/20 min-w-[200px]">
          {getFileIcon(fileName)}
          <div className="flex-1 min-w-0">
            <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 truncate select-all">
              {fileName || "File"}
            </span>
          </div>
          <button
            onClick={() => handleDownload(msg)}
            className="p-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center justify-center transition-all flex-shrink-0"
          >
            <AiOutlineCloudDownload size={15} />
          </button>
        </div>
        {Boolean(msg?.message || msg?.Meassage) && (
          <p className="text-xs md:text-sm font-medium mt-2 px-1 text-slate-850 dark:text-slate-200">
            {msg?.message || msg?.Meassage}
          </p>
        )}
        <Reactions reactions={msg?.reactions} />
        <Timestamp
          date={msg?.created_at || msg?.SendedDate}
          isSender={sender.isMe}
          readStatus={msg?.is_unread}
          seenBy={msg?.seen_by}
          isSeen={msg?.is_seen}
          isEdited={msg?.is_edited || msg?.isEdited}
        />
      </div>
      {menu && <MessageOption msg={msg} />}
    </div>
  );
};

export const LinkMsg = ({ msg, menu }: { msg: any; menu: boolean }) => {
  const sender = useSender(msg);
  const content = msg?.message || msg?.Meassage;
  const hasReactions = msg?.reactions && msg.reactions.length > 0;

  return (
    <div className={`flex items-end px-1 group ${hasReactions ? "mb-3.5 mt-1" : "my-1"} ${sender.isMe ? "justify-end" : "justify-start"}`}>
      <div
        className={`relative p-2.5 rounded-2xl shadow-sm border ${hasReactions ? "min-w-[80px]" : ""} max-w-[75%] ${
          sender.isMe
            ? "bg-emerald-50 border-emerald-100/50 dark:bg-emerald-950/20 dark:border-emerald-900/40 rounded-br-sm"
            : "bg-white border-slate-200/60 dark:bg-slate-900 dark:border-slate-800/80 rounded-bl-sm"
        }`}
      >
        <SenderName sender={sender} />
        <ReplyMessage reply={msg?.reply_message} />
        <a
          href={content}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs md:text-sm font-semibold underline break-all block py-1 text-sky-655 dark:text-sky-400"
        >
          {content}
        </a>
        <Reactions reactions={msg?.reactions} />
        <Timestamp
          date={msg?.created_at || msg?.SendedDate}
          isSender={sender.isMe}
          readStatus={msg?.is_unread}
          seenBy={msg?.seen_by}
          isSeen={msg?.is_seen}
          isEdited={msg?.is_edited || msg?.isEdited}
        />
      </div>
      {menu && <MessageOption msg={msg} />}
    </div>
  );
};

export const CallMsg = ({ msg, menu }: { msg: any; menu: boolean }) => {
  const sender = useSender(msg);
  const isDeclined = msg?.Audio_Answer === "declined" || msg?.Video_Answer === "declined";
  const isCallEnd = msg?.Audio_Answer === "callend" || msg?.Video_Answer === "callend";
  const hasReactions = msg?.reactions && msg.reactions.length > 0;

  return (
    <div className={`flex items-end px-1 group ${hasReactions ? "mb-3.5 mt-1" : "my-1"} ${sender.isMe ? "justify-end" : "justify-start"}`}>
      <div
        className={`relative p-2.5 rounded-2xl shadow-sm border max-w-[75%] ${
          sender.isMe
            ? "bg-emerald-50 border-emerald-100/50 dark:bg-emerald-950/20 dark:border-emerald-900/40 rounded-br-sm"
            : "bg-white border-slate-200/60 dark:bg-slate-900 dark:border-slate-800/80 rounded-bl-sm"
        }`}
      >
        <SenderName sender={sender} />
        <ReplyMessage reply={msg?.reply_message} />
        
        <div className="flex items-center space-x-3 p-2 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/40">
          <div className="p-2 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-full flex-shrink-0 shadow-sm">
            {isDeclined && <MdPhoneMissed size={16} className="text-red-500 animate-pulse" />}
            {isCallEnd && <SlCallEnd size={16} className="text-slate-500" />}
          </div>
          <div className="flex-1">
            <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">
              {msg?.Audio_Answer !== "" ? "Voice Call" : "Video Call"}
            </span>
            {isDeclined && (
              <span className="block text-[10px] text-slate-500 mt-0.5 font-semibold">
                {sender.isMe ? "No Answer" : "Missed Call"}
              </span>
            )}
          </div>
        </div>

        <Reactions reactions={msg?.reactions} />
        <Timestamp
          date={msg?.created_at || msg?.SendedDate}
          isSender={sender.isMe}
          readStatus={msg?.is_unread}
          seenBy={msg?.seen_by}
          isSeen={msg?.is_seen}
          isEdited={msg?.is_edited || msg?.isEdited}
        />
      </div>
      {menu && <MessageOption msg={msg} />}
    </div>
  );
};

export const Timeline = ({ msg }: { msg: any; trans?: any }) => {
  const UserId = typeof window !== 'undefined' ? (localStorage.getItem("userId") || localStorage.getItem("UserId")) : null;
  const msgSender = msg?.sender || msg?.SenderId;
  const time = new Date(msg?.created_at || msg?.SendedDate).toLocaleTimeString([], {
    hour12: true,
    hour: "numeric",
    minute: "numeric",
  });

  return (
    <div className={`flex items-center mt-[-2px] mb-1 px-4 text-[9px] text-slate-400 select-none ${
      Number(msgSender) === Number(UserId) ? "justify-end" : "justify-start"
    }`}>
      {time}
    </div>
  );
};

export const EditDialog = () => {
  const { editMessage, setEditMessage } = useChatContext();
  const [updateRoomMessage] = useUpdateRoomMessageMutation();
  const [message, setMessage] = useState("");
  const [openPicker, setOpenPicker] = useState(false);

  useEffect(() => {
    if (editMessage) {
      setMessage(
        editMessage?.Participant_Message ||
        editMessage?.message ||
        editMessage?.Meassage ||
        ""
      );
    }
  }, [editMessage]);

  const handleClose = () => {
    setEditMessage(null);
    setOpenPicker(false);
  };

  const handleUpdate = async () => {
    if (!message.trim() || !editMessage) return;
    try {
      const payload = {
        id: editMessage?.id,
        room: editMessage?.room,
        sender: parseInt(localStorage.getItem("userId") || localStorage.getItem("UserId") || "0"),
        message: message,
        message_type: editMessage?.message_type || "text",
        is_edited: true,
      };

      await updateRoomMessage(payload).unwrap();
      toast.success("Message updated");
      handleClose();
    } catch (error) {
      console.error("Error updating message:", error);
      toast.error("Failed to update message");
    }
  };

  const handleEmojiSelect = (emoji: any) => {
    setMessage((prev) => prev + emoji.native);
    setOpenPicker(false);
  };

  if (!editMessage) return null;

  return (
    <Dialog open={Boolean(editMessage)} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-slate-800 dark:text-slate-200">Edit Message</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Original preview */}
          <div className="bg-slate-50 dark:bg-slate-900 border-l-4 border-emerald-600 rounded-lg p-2.5">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wide">
              Original Message:
            </span>
            <p className="text-xs italic text-slate-600 dark:text-slate-350 mt-0.5 break-words">
              {editMessage?.message || editMessage?.Participant_Message || editMessage?.Meassage}
            </p>
          </div>

          {/* Edit form */}
          <div className="flex flex-col border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden focus-within:border-emerald-600/70 transition-colors p-2 bg-white dark:bg-slate-950">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your changes here..."
              rows={4}
              className="resize-none border-0 outline-none text-sm text-slate-700 dark:text-slate-300 w-full p-1 bg-transparent"
              autoFocus
            />
            <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <Popover open={openPicker} onOpenChange={setOpenPicker}>
                <PopoverTrigger className="p-1 text-slate-400 hover:text-emerald-600 transition-colors">
                  <MdOutlineEmojiEmotions size={20} />
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 border-0 bg-transparent shadow-none mt-2" align="start">
                  <Picker
                    data={emojiData}
                    onEmojiSelect={handleEmojiSelect}
                    theme="light"
                  />
                </PopoverContent>
              </Popover>

              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdate}
                  disabled={!message.trim()}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  Update
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const DeleteConfirmDialog = () => {
  const { deleteMessageItem, setDeleteMessageItem } = useChatContext();
  const [deleteRoomMessage] = useDeleteRoomMessageMutation();
  const [deleteMessageVisibility] = useDeleteMessageVisibilityMutation();

  const handleClose = () => {
    setDeleteMessageItem(null);
  };

  const handleConfirmDelete = async (deleteType: "me" | "everyone") => {
    if (deleteMessageItem) {
      try {
        if (deleteType === "everyone") {
          await deleteRoomMessage({
            id: deleteMessageItem?.id,
            room: deleteMessageItem?.room || deleteMessageItem?.Receiver_Id,
            deleteType: "everyone",
          }).unwrap();
        } else {
          await deleteMessageVisibility({
            id: deleteMessageItem?.id,
            room: deleteMessageItem?.room || deleteMessageItem?.Receiver_Id,
          }).unwrap();
        }
        toast.success(
          `Message deleted for ${deleteType === "everyone" ? "everyone" : "me"}`
        );
        handleClose();
      } catch (error) {
        toast.error("Failed to delete message");
      }
    }
  };

  return (
    <Dialog open={Boolean(deleteMessageItem)} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-slate-800 dark:text-slate-200">Delete Message?</DialogTitle>
        </DialogHeader>
        <div className="py-2">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Are you sure you want to delete this message? This action cannot be undone.
          </p>
        </div>
        <DialogFooter className="flex-col sm:flex-col gap-1.5">
          <div className="flex justify-end space-x-2 w-full">
            <Button variant="outline" size="sm" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleConfirmDelete("me")}
              className="text-red-655 hover:text-red-750 dark:hover:text-red-400 border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/20"
            >
              Delete for Me
            </Button>
            <Button
              onClick={() => handleConfirmDelete("everyone")}
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              Delete for All
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
