'use client';

import React, { memo, useEffect, useRef, useState, useCallback } from "react";
import ChatHeader from "../components/chatHeaderAndFooter/Header";
import ChatFooter from "../components/chatHeaderAndFooter/Footer";
import useResponsive from "../hook/useResponsive";
import {
  AudioMsg,
  CallMsg,
  DocMsg,
  ImageMsg,
  LinkMsg,
  MediaMsg,
  OthersMsg,
  TextMsg,
  Timeline,
  VideoMsg,
  EditDialog,
  DeleteConfirmDialog,
} from "./Conversation";
import { useChatContext } from "../context/Chatcontext";
import {
  useGetRoomMessagesQuery,
  useLazyGetRoomMessagesQuery,
  useMarkMessagesReadMutation,
} from "../api/ChatQueryAPI";
import { MessageSquareOff } from "lucide-react";

const Spinner = ({ className = "w-6 h-6 text-emerald-600" }: { className?: string }) => (
  <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

// File format constants
export const FileFormats = [
  "js", "pdf", "doc", "docx", "pptx", "xlsx", "csv", "txt", "html", "xml", "json", "zip", "rar", "7z", "tar", "gz", "exe", "msi"
];
export const VideoFormats = [
  "mp4", "avi", "mkv", "mov", "wmv", "flv", "webm", "m4v", "ogg", "mpeg", "mpg", "3gp", "ts", "vob", "swf", "rm", "asf"
];
export const ImageFormats = [
  "jfif", "jpg", "jpeg", "png", "gif", "bmp", "tiff", "svg", "ico", "heic", "apng", "raw"
];
export const AudioFormats = ["ogg", "amr", "aac", "mp3", "wav", "flac"];

const isTempId = (id: any) => id && Number(id) > 1000000000000;

const areDuplicates = (m1: any, m2: any) => {
  const id1 = m1.id ? String(m1.id) : null;
  const id2 = m2.id ? String(m2.id) : null;

  if (id1 && id2 && !isTempId(id1) && !isTempId(id2) && id1 === id2) {
    return true;
  }

  const msg1 = m1.message || m1.Participant_Message || m1.Meassage || "";
  const msg2 = m2.message || m2.Participant_Message || m2.Meassage || "";

  const sender1 = Number(m1.Participant_id || m1.sender?.id || m1.sender);
  const sender2 = Number(m2.Participant_id || m2.sender?.id || m2.sender);

  const time1 = new Date(m1.created_at || m1.Participant_Send_Date_Time || 0).getTime();
  const time2 = new Date(m2.created_at || m2.Participant_Send_Date_Time || 0).getTime();

  return msg1 === msg2 && sender1 === sender2 && Math.abs(time1 - time2) < 5000;
};

function ChatComponent() {
  const { selectedRoom, initialMessages, typingUsers, setTypingUsers } = useChatContext();
  const UserId = typeof window !== 'undefined' ? (localStorage.getItem("userId") || localStorage.getItem("UserId")) : null;
  const isMobile = useResponsive("between", "md", "xs", "sm");
  const messageListRef = useRef<HTMLDivElement>(null);

  // Pagination states
  const [messages, setMessages] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isPrepending, setIsPrepending] = useState(false);
  const [prevScrollHeight, setPrevScrollHeight] = useState(0);

  // Initial fetch for Page 1
  const {
    data: conversation,
    isLoading,
    isError,
    refetch: refetchMessages,
  } = useGetRoomMessagesQuery(
    { roomId: selectedRoom?.id, page: 1, userId: UserId },
    {
      skip: !selectedRoom?.id || selectedRoom?.is_new,
      refetchOnMountOrArgChange: true,
    }
  );

  const [triggerLazyMessages] = useLazyGetRoomMessagesQuery();
  const [markRead] = useMarkMessagesReadMutation();

  // Mark messages as read when room is opened or window gains focus
  useEffect(() => {
    if (!selectedRoom?.id || !UserId) return;

    const handleFocus = () => {
      markRead({ room_id: Number(selectedRoom.id), user_id: Number(UserId) });
    };

    // Trigger initially
    handleFocus();

    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [selectedRoom?.id, UserId, markRead]);

  // Reset state when room changes
  useEffect(() => {
    setMessages([]);
    setPage(1);
    setHasMore(true);
    setIsPrepending(false);
  }, [selectedRoom?.id]);

  // Socket listener for typing events
  useEffect(() => {
    if (!UserId) return;
    const handleNotification = (e: any) => {
      const data = e.detail;
      console.log("ChatComponent received typing event:", data);
      if (data.event_type === "TYPING" || data.event_type === "GROUP_TYPING") {
        const roomId = Number(data.room_id || data.group_id);
        const senderId = Number(data.sender);
        const senderName = data.sender_name;
        const isTyping = data.is_typing;

        if (senderId === Number(UserId)) return;

        setTypingUsers((prev: any) => {
          const roomTyping = { ...(prev[roomId] || {}) };
          if (isTyping) {
            roomTyping[senderId] = senderName;
          } else {
            delete roomTyping[senderId];
          }
          return { ...prev, [roomId]: roomTyping };
        });
      }
    };

    window.addEventListener("ml-typing", handleNotification);
    return () => {
      window.removeEventListener("ml-typing", handleNotification);
    };
  }, [UserId, setTypingUsers]);

  // Detect broken messages and refetch
  useEffect(() => {
    if (conversation && Array.isArray(conversation)) {
      const hasBrokenMessage = conversation.some((msg) => {
        const type = (msg.message_type || "").toLowerCase();
        if (
          type &&
          type !== "text" &&
          msg.message !== "This message was deleted"
        ) {
          return !msg.attachments || msg.attachments.length === 0;
        }
        return false;
      });

      if (hasBrokenMessage) {
        console.warn(
          "Broken message detected, refetching in 2s..."
        );
        const timer = setTimeout(() => {
          refetchMessages();
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [conversation, refetchMessages]);

  // Listen for real-time reactions
  useEffect(() => {
    const handleReaction = (e: any) => {
      const data = e.detail;
      const messageId = data.message_id;
      const reaction = data.reaction;
      const senderId = data.sender;

      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === messageId) {
            const existingReactions = [...(msg.reactions || [])];
            const userReactionIndex = existingReactions.findIndex(
              (r) => Number(r.user_id || r.User_id) === Number(senderId)
            );

            if (userReactionIndex > -1) {
              existingReactions[userReactionIndex] = {
                ...existingReactions[userReactionIndex],
                reaction: reaction,
              };
            } else {
              existingReactions.push({
                id: Date.now(),
                user_id: senderId,
                reaction: reaction,
              });
            }
            return { ...msg, reactions: existingReactions };
          }
          return msg;
        })
      );
    };

    window.addEventListener("ml-reaction", handleReaction);
    return () => window.removeEventListener("ml-reaction", handleReaction);
  }, []);

  // Listen for real-time messages from ML WebSocket bridge to append
  useEffect(() => {
    if (!selectedRoom?.id || !UserId) return;
    const handleNewWebsocketMessage = (e: any) => {
      const data = e.detail;
      const roomId = Number(data.room_id || data.group_id);

      if (roomId === Number(selectedRoom?.id)) {
        const newMessage = {
          id: data.id || data.message_id || Date.now(),
          room: roomId,
          sender: Number(data.sender),
          sender_name: data.sender_name,
          message: data.message,
          message_type: data.message_type || "text",
          created_at: data.created_at || new Date().toISOString(),
          is_unread: true,
          attachments: data.attachments || [],
          reactions: data.reactions || [],
        };

        setMessages((prev) => {
          const isDuplicate = prev.some((msg) => areDuplicates(msg, newMessage));
          if (isDuplicate) return prev;
          return [...prev, newMessage];
        });

        // Mark as read immediately if user is active in convo and message is from another user
        if (Number(data.sender) !== Number(UserId) && document.hasFocus()) {
          markRead({ room_id: Number(selectedRoom.id), user_id: Number(UserId) });
        }
      }
    };

    window.addEventListener("ml-message", handleNewWebsocketMessage);
    return () => {
      window.removeEventListener("ml-message", handleNewWebsocketMessage);
    };
  }, [selectedRoom?.id, UserId, markRead]);

  // Listen for real-time message read ticks from ML WebSocket bridge
  useEffect(() => {
    if (!selectedRoom?.id || !UserId) return;
    const handleMessageRead = (e: any) => {
      const data = e.detail;
      const roomId = Number(data.room_id);
      if (roomId === Number(selectedRoom?.id)) {
        const readerId = Number(data.reader_id);
        if (readerId !== Number(UserId)) {
          // Someone else read our messages, update read status
          const readMsgIds = Array.isArray(data.message_ids)
            ? data.message_ids.map(Number)
            : typeof data.message_ids === "number" || typeof data.message_ids === "string"
            ? [Number(data.message_ids)]
            : [];

          setMessages((prev) =>
            prev.map((msg) => {
              const msgId = Number(msg.id);
              if (readMsgIds.length > 0) {
                if (readMsgIds.includes(msgId)) {
                  return { ...msg, is_unread: false, is_seen: true };
                }
              } else {
                // Fallback: mark all older/current messages sent by us as read
                const msgSenderId = Number(
                  msg?.Participant_id ||
                  msg?.sender?.id ||
                  msg?.sender ||
                  msg?.SenderId ||
                  msg?.sender_id
                );
                if (msgSenderId === Number(UserId)) {
                  return { ...msg, is_unread: false, is_seen: true };
                }
              }
              return msg;
            })
          );
        }
      }
    };

    window.addEventListener("ml-message-read", handleMessageRead);
    return () => {
      window.removeEventListener("ml-message-read", handleMessageRead);
    };
  }, [selectedRoom?.id, UserId]);

  // Sync initialMessages/conversation into state
  useEffect(() => {
    if (conversation) {
      setMessages((prev) => {
        const roomChanged =
          prev.length > 0 &&
          (prev[0].room || prev[0].room_id) !== selectedRoom?.id;
        const baseContent = roomChanged ? [] : prev;

        const filteredConversation = conversation.filter((msg: any) => {
          const type = (msg.message_type || "").toLowerCase();
          if (
            type &&
            type !== "text" &&
            msg.message !== "This message was deleted"
          ) {
            return msg.attachments && msg.attachments.length > 0;
          }
          return true;
        });

        const uniqueMessages = [...baseContent];

        filteredConversation.forEach((apiMsg: any) => {
          const dupIndex = uniqueMessages.findIndex((stateMsg) => areDuplicates(stateMsg, apiMsg));
          if (dupIndex > -1) {
            uniqueMessages[dupIndex] = apiMsg;
          } else {
            uniqueMessages.push(apiMsg);
          }
        });

        uniqueMessages.sort(
          (a, b) =>
            new Date(a.created_at || a.Participant_Send_Date_Time).getTime() -
            new Date(b.created_at || b.Participant_Send_Date_Time).getTime()
        );

        return uniqueMessages;
      });

      if (conversation.length < 10 && page === 1) {
        setHasMore(false);
      }
    } else if (initialMessages?.length > 0 && messages.length === 0) {
      const firstMsg = initialMessages[0];
      const initialRoomId = firstMsg.room || firstMsg.room_id || selectedRoom?.id;

      if (initialRoomId === selectedRoom?.id) {
        const filteredInitial = initialMessages.filter((msg: any) => {
          const type = (msg.message_type || "").toLowerCase();
          if (
            type &&
            type !== "text" &&
            msg.message !== "This message was deleted"
          ) {
            return msg.attachments && msg.attachments.length > 0;
          }
          return true;
        });

        setMessages(filteredInitial);
        if (initialMessages.length < 10) {
          setHasMore(false);
        }
      }
    }
  }, [conversation, initialMessages]);

  // Handle scroll to fetch more
  const handleScroll = useCallback(
    async (e: any) => {
      const { scrollTop, scrollHeight } = e.target;

      if (
        scrollTop <= 10 &&
        hasMore &&
        !isPrepending &&
        messages.length >= 10 &&
        selectedRoom?.id &&
        UserId
      ) {
        setIsPrepending(true);
        setPrevScrollHeight(scrollHeight);

        const nextPage = page + 1;
        console.log(
          `Pagination: Fetching page ${nextPage} for room ${selectedRoom.id}`
        );

        try {
          const results: any = await triggerLazyMessages({
            roomId: selectedRoom.id,
            page: nextPage,
            userId: UserId,
          }).unwrap();

          if (results && results.length > 0) {
            console.log(
              `Pagination: Received ${results.length} messages for page ${nextPage}`
            );
            const filteredResults = results.filter((msg: any) => {
              const type = (msg.message_type || "").toLowerCase();
              if (
                type &&
                type !== "text" &&
                msg.message !== "This message was deleted"
              ) {
                return msg.attachments && msg.attachments.length > 0;
              }
              return true;
            });
            setMessages((prev) => {
              const uniqueMessages = [...prev];
              filteredResults.forEach((newMsg: any) => {
                const dupIndex = uniqueMessages.findIndex((stateMsg) => areDuplicates(stateMsg, newMsg));
                if (dupIndex > -1) {
                  uniqueMessages[dupIndex] = newMsg;
                } else {
                  uniqueMessages.push(newMsg);
                }
              });
              uniqueMessages.sort(
                (a, b) =>
                  new Date(a.created_at || a.Participant_Send_Date_Time).getTime() -
                  new Date(b.created_at || b.Participant_Send_Date_Time).getTime()
              );
              return uniqueMessages;
            });
            setPage(nextPage);
            if (results.length < 10) {
              setHasMore(false);
            }
          } else {
            console.log("Pagination: No more messages");
            setHasMore(false);
          }
        } catch (error) {
          console.error("Failed to fetch more messages:", error);
        } finally {
          setIsPrepending(false);
        }
      }
    },
    [
      hasMore,
      isPrepending,
      messages.length,
      page,
      selectedRoom?.id,
      triggerLazyMessages,
      UserId,
    ]
  );

  // Maintain scroll position after prepending
  useEffect(() => {
    if (
      isPrepending === false &&
      prevScrollHeight > 0 &&
      messageListRef.current
    ) {
      const newScrollHeight = messageListRef.current.scrollHeight;
      messageListRef.current.scrollTop = newScrollHeight - prevScrollHeight;
      setPrevScrollHeight(0);
    }
  }, [messages, isPrepending, prevScrollHeight]);

  const renderMessage = (msg: any) => {
    if (msg?.Jitci) {
      return (
        <React.Fragment key={msg.id || msg.created_at}>
          <CallMsg msg={msg} menu={true} />
          <Timeline msg={msg} />
        </React.Fragment>
      );
    }

    if (msg?.message_type) {
      const type = msg.message_type.toLowerCase();
      if (type === "text") {
        if (msg?.message?.startsWith("https://www.youtube.com"))
          return <MediaMsg msg={msg} menu={true} />;
        if (msg?.message?.startsWith("http"))
          return <LinkMsg msg={msg} menu={true} />;
        return <TextMsg msg={msg} menu={true} />;
      }
      if (type === "image") return <ImageMsg msg={msg} menu={true} />;
      if (type === "video") return <VideoMsg msg={msg} menu={true} />;
      if (type === "audio") return <AudioMsg msg={msg} menu={true} />;
      if (type === "file" || type === "document")
        return <DocMsg msg={msg} menu={true} />;
    }

    if (msg?.File) {
      const fileExtension = msg.File.split(".").pop()?.toLowerCase();
      if (fileExtension && ImageFormats.includes(fileExtension))
        return <ImageMsg msg={msg} menu={true} />;
      if (fileExtension && VideoFormats.includes(fileExtension))
        return <VideoMsg msg={msg} menu={true} />;
      if (fileExtension && AudioFormats.includes(fileExtension))
        return <AudioMsg msg={msg} menu={true} />;
      if (fileExtension && FileFormats.includes(fileExtension))
        return <DocMsg msg={msg} menu={true} />;
      return <OthersMsg msg={msg} menu={true} />;
    }

    const textContent = msg?.Participant_Message || msg?.message || msg?.Meassage;
    if (textContent) {
      if (textContent.startsWith("https://www.youtube.com"))
        return <MediaMsg msg={msg} menu={true} />;
      if (textContent.startsWith("http"))
        return <LinkMsg msg={msg} menu={true} />;
      return <TextMsg msg={msg} menu={true} />;
    }

    return <OthersMsg msg={msg} menu={true} />;
  };

  const renderMessages = () => {
    if (isLoading && (!messages || messages.length === 0)) {
      return (
        <div className="h-full flex items-center justify-center py-10">
          <Spinner className="w-8 h-8 text-emerald-600" />
        </div>
      );
    }

    if (isError) {
      return (
        <div className="h-full flex items-center justify-center text-red-500 py-10 text-sm font-semibold">
          Failed to load messages. Please try again.
        </div>
      );
    }

    if (conversation === "Blocked") {
      return (
        <div className="h-full flex items-center justify-center text-slate-500 text-center py-10 px-4 text-xs font-medium">
          {selectedRoom?.name || "This contact"} is not available right now.
          Please try chatting again later.
        </div>
      );
    }

    if (messages?.length > 0) {
      return (
        <div className="space-y-3.5">
          {isPrepending && (
            <div className="flex justify-center items-center py-1">
              <Spinner className="w-5 h-5 text-emerald-600" />
            </div>
          )}
          {messages.map((msg, idx) => (
            <React.Fragment key={msg.id ? `msg-${msg.id}-${idx}` : `idx-${idx}`}>
              {renderMessage(msg)}
            </React.Fragment>
          ))}
        </div>
      );
    }

    return (
      <div className="h-full flex flex-col items-center justify-center text-center py-12 space-y-3 text-slate-400 dark:text-slate-500 select-none">
        <MessageSquareOff className="w-16 h-16 stroke-[1.2]" />
        <div>
          <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300">No Messages Yet</h4>
          <p className="text-xs text-slate-500 max-w-[200px] mt-0.5">Start the conversation by typing a message below.</p>
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (messageListRef.current && page === 1 && !isPrepending) {
      const scrollToBottom = () => {
        if (messageListRef.current) {
          messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
        }
      };

      scrollToBottom();
      const timer1 = setTimeout(scrollToBottom, 50);
      const timer2 = setTimeout(scrollToBottom, 150);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [messages, page, isPrepending]);

  const hasTypingUsers = selectedRoom?.id &&
    typingUsers[Number(selectedRoom.id)] &&
    Object.keys(typingUsers[Number(selectedRoom.id)]).length > 0;

  return (
    <div
      className={`flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden relative ${
        isMobile ? "w-screen" : "w-full"
      }`}
    >
      <ChatHeader />

      <div
        ref={messageListRef}
        onScroll={handleScroll}
        className="flex-grow overflow-y-auto bg-slate-50 dark:bg-slate-950/60 p-4 min-h-0 scrollbar-thin"
      >
        <div className="w-full max-w-5xl mx-auto">{renderMessages()}</div>
      </div>

      {/* Typing Indicator Overlay */}
      {hasTypingUsers && (
        <div className="px-4 py-1.5 bg-slate-50 dark:bg-slate-955 flex items-center gap-1.5 flex-shrink-0">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 px-3 py-1 rounded-xl shadow-sm flex items-center gap-2">
            <span className="text-[10px] italic text-emerald-600 dark:text-emerald-400 font-bold">
              {Object.values(typingUsers[Number(selectedRoom.id)]).join(", ")} typing...
            </span>
            <div className="flex space-x-0.5 items-center mt-0.5">
              <span className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      )}

      <ChatFooter />
      <EditDialog />
      <DeleteConfirmDialog />
    </div>
  );
}

export default memo(ChatComponent);
