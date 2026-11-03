'use client';

import React, { useEffect, useRef, useState, memo } from "react";
import {
  MdOutlineEmojiEmotions,
  MdSend,
  MdMic,
  MdStop,
  MdDelete,
} from "react-icons/md";
import { ImAttachment } from "react-icons/im";
import { IoMdClose } from "react-icons/io";
import { FaFile } from "react-icons/fa";
import useResponsive from "../../hook/useResponsive";
import { useChatContext } from "../../context/Chatcontext";
import {
  useSendRoomMessageMutation,
  useAddMessageAttachmentMutation,
  useSendTypingStatusMutation,
} from "../../api/ChatQueryAPI";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

const Picker = dynamic(() => import("@emoji-mart/react"), { ssr: false });
import emojiData from "@emoji-mart/data";

interface Attachment {
  file: File;
  name: string;
  localURL: string;
  progress: number;
  base64: string;
}

const Footer = () => {
  const {
    selectedRoom,
    markRoomAsNotNew,
    replyToMessage,
    setReplyToMessage,
    playChatSound,
  } = useChatContext();

  const [sendRoomMessage] = useSendRoomMessageMutation();
  const [addMessageAttachment] = useAddMessageAttachmentMutation();
  const [sendTypingStatus] = useSendTypingStatusMutation();

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [message, setMessage] = useState("");
  const [openPicker, setOpenPicker] = useState(false);

  const [sendLoader, setSendLoader] = useState(false);
  const [openAlertDialog, setOpenAlertDialog] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const recordingTimerRef = useRef<any>(null);
  const typingTimeoutRef = useRef<any>(null);
  const isTypingSentRef = useRef(false);

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  const handleDrop = (e: any) => {
    const files = e.dataTransfer
      ? Array.from(e.dataTransfer.files)
      : Array.from(e.target.files);

    const validFiles = files.filter((file: any) => {
      if (file.size > MAX_FILE_SIZE) {
        setAlertMessage(
          `File "${file.name}" is too large. Maximum size is 10MB.`
        );
        setOpenAlertDialog(true);
        return false;
      }
      return true;
    });

    validFiles.forEach((file: any) => {
      const fileURL = URL.createObjectURL(file);
      const newAttachment: Attachment = {
        file,
        name: file.name,
        localURL: fileURL,
        progress: 0,
        base64: "",
      };

      setAttachments((prev) => [...prev, newAttachment]);

      const reader = new FileReader();
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentLoaded = (event.loaded / event.total) * 100;
          setAttachments((prev) =>
            prev.map((att) =>
              att.localURL === fileURL
                ? { ...att, progress: percentLoaded }
                : att
            )
          );
        }
      };

      reader.onload = () => {
        const resultStr = reader.result as string;
        setAttachments((prev) =>
          prev.map((att) =>
            att.localURL === fileURL
              ? { ...att, base64: resultStr.split(",")[1], progress: 100 }
              : att
          )
        );
      };
      reader.readAsDataURL(file);
    });

    if (e.target) {
      e.target.value = null;
    }
  };

  // Typing status logic
  useEffect(() => {
    if (!selectedRoom?.id) return;

    if (message.length > 0 && !isTypingSentRef.current) {
      sendTypingStatus({
        room: selectedRoom.id,
        sender: parseInt(localStorage.getItem("userId") || localStorage.getItem("UserId") || "0"),
        is_typing: true,
      });
      isTypingSentRef.current = true;
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingSentRef.current) {
        sendTypingStatus({
          room: selectedRoom.id,
          sender: parseInt(localStorage.getItem("userId") || localStorage.getItem("UserId") || "0"),
          is_typing: false,
        });
        isTypingSentRef.current = false;
      }
    }, 500);

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [message, selectedRoom?.id, sendTypingStatus]);

  // Audio recording timer logic
  useEffect(() => {
    if (isRecording) {
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(recordingTimerRef.current);
      setRecordingTime(0);
    }
    return () => clearInterval(recordingTimerRef.current);
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: "audio/webm" });
        const audioFile = new File(
          [audioBlob],
          `voice_message_${Date.now()}.webm`,
          { type: "audio/webm" }
        );

        handleAudioFile(audioFile);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setAudioChunks(chunks);
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      toast.error("Microphone access denied or not available.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.onstop = null;
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
      setAudioChunks([]);
    }
  };

  const handleAudioFile = (file: File) => {
    const fileURL = URL.createObjectURL(file);
    const newAttachment: Attachment = {
      file,
      name: file.name,
      localURL: fileURL,
      progress: 0,
      base64: "",
    };

    setAttachments((prev) => [...prev, newAttachment]);

    const reader = new FileReader();
    reader.onload = () => {
      const resultStr = reader.result as string;
      setAttachments((prev) =>
        prev.map((att) =>
          att.localURL === fileURL
            ? { ...att, base64: resultStr.split(",")[1], progress: 100 }
            : att
        )
      );
    };
    reader.readAsDataURL(file);
  };

  const isMobile = useResponsive("between", "md", "xs", "sm");

  const handleEmojiClick = (emoji: string) => {
    if (emoji && inputRef.current) {
      const input = inputRef.current;
      const start = input.selectionStart;
      const end = input.selectionEnd;
      const text = input.value;
      const before = text.substring(0, start);
      const after = text.substring(end);

      const newMessage = before + emoji + after;
      setMessage(newMessage);

      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + emoji.length, start + emoji.length);
      }, 0);
    } else {
      setMessage(message + emoji);
    }
  };

  const sendUserMessage = async (type?: string) => {
    if (sendLoader) return;
    if (message.trim() === "" && attachments.length === 0) return;
    if (!selectedRoom?.id) {
      toast.error("Please select a room first.");
      return;
    }

    setSendLoader(true);

    try {
      if (attachments.length > 0) {
        for (const att of attachments) {
          let msgType = "text";
          if (att.file.type.startsWith("image/")) msgType = "image";
          else if (att.file.type.startsWith("video/")) msgType = "video";
          else if (att.file.type.startsWith("audio/")) msgType = "audio";
          else msgType = "document";

          const messagePayload = {
            room: selectedRoom.id,
            sender: parseInt(localStorage.getItem("userId") || localStorage.getItem("UserId") || "0"),
            message: message || att.name,
            message_type: msgType,
            reply_to: replyToMessage?.id,
          };

          const messageResponse: any = await sendRoomMessage(messagePayload).unwrap();
          const messageId = messageResponse.id;

          if (messageId) {
            const attachmentPayload = {
              message: messageId,
              file: att.base64 || "",
              file_name: att.name || "",
              file_type: msgType,
              file_size: att.file.size,
              room: selectedRoom.id,
            };
            await addMessageAttachment(attachmentPayload).unwrap();
          }
        }
      } else {
        const payload = {
          room: selectedRoom.id,
          sender: parseInt(localStorage.getItem("userId") || localStorage.getItem("UserId") || "0"),
          message: message,
          message_type: type || "text",
          reply_to: replyToMessage?.id,
        };
        await sendRoomMessage(payload).unwrap();
      }

      setMessage("");
      setAttachments([]);
      setReplyToMessage(null);
      setSendLoader(false);

      if (isTypingSentRef.current) {
        sendTypingStatus({
          room: selectedRoom.id,
          sender: parseInt(localStorage.getItem("userId") || localStorage.getItem("UserId") || "0"),
          is_typing: false,
        });
        isTypingSentRef.current = false;
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      if (selectedRoom?.is_new) {
        markRoomAsNotNew();
      }

      playChatSound(null, null, selectedRoom?.id);
    } catch (error) {
      console.error("Error sending message:", error);
      setSendLoader(false);
      toast.error("Failed to send message.");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!sendLoader) {
        sendUserMessage();
      }
    }
  };

  return (
    <>
      <div className="p-3 bg-slate-100 dark:bg-slate-900 flex items-end gap-3 position-relative z-10 border-t border-slate-200/50 dark:border-slate-800/80 flex-shrink-0">
        {!isRecording && (
          <div className="flex items-center space-x-1 mb-0.5 flex-shrink-0">
            <Popover open={openPicker} onOpenChange={setOpenPicker}>
              <PopoverTrigger
                className="p-2 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                title="Insert Emoji"
              >
                <MdOutlineEmojiEmotions size={22} />
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 border-0 bg-transparent shadow-none mb-2" align="start">
                <div ref={pickerRef}>
                  <Picker
                    data={emojiData}
                    onEmojiSelect={(emoji: any) => handleEmojiClick(emoji.native)}
                  />
                </div>
              </PopoverContent>
            </Popover>

            <label className="p-2 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer transition-colors" title="Attach Files">
              <input
                type="file"
                className="hidden"
                onChange={handleDrop}
                accept="image/*,video/*,audio/*,.pdf,.zip"
                multiple
              />
              <ImAttachment size={18} />
            </label>
          </div>
        )}

        {isRecording ? (
          <div className="flex-1 flex items-center justify-between gap-3 bg-white dark:bg-slate-950 border border-red-200/40 rounded-2xl px-4 py-2 h-11 shadow-sm">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-bold text-red-500 leading-none">
                {formatTime(recordingTime)}
              </span>
            </div>
            <button
              onClick={cancelRecording}
              className="p-1 rounded-full text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Discard Recording"
            >
              <MdDelete size={18} />
            </button>
          </div>
        ) : (
          <div className="flex-1 relative min-w-0">
            {/* Reply Preview Card */}
            {replyToMessage && (
              <div className="absolute bottom-[calc(100%-4px)] left-0 right-0 bg-white dark:bg-slate-950 px-4 py-2 rounded-t-2xl border border-slate-200/60 dark:border-slate-800/80 border-b-0 flex items-center justify-between z-10 shadow-sm">
                <div className="overflow-hidden pr-2 flex-1">
                  <span className="block text-[10px] font-bold text-emerald-600 uppercase tracking-wide">
                    Replying to:
                  </span>
                  <p className="text-xs text-slate-655 dark:text-slate-350 truncate">
                    {replyToMessage.message || "File"}
                  </p>
                </div>
                <button
                  onClick={() => setReplyToMessage(null)}
                  className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
                >
                  <IoMdClose size={15} />
                </button>
              </div>
            )}

            {/* Attached files previews */}
            {attachments.length > 0 && (
              <div className="absolute bottom-[calc(100%-4px)] left-0 right-0 bg-white dark:bg-slate-950 px-4 py-2 border border-slate-200/60 dark:border-slate-800/80 border-b-0 rounded-t-2xl flex gap-2 overflow-x-auto z-10 shadow-sm scrollbar-thin">
                {attachments.map((att, index) => (
                  <div key={index} className="relative flex-shrink-0 p-0.5">
                    <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-hidden">
                      {att.file.type.startsWith("image/") ? (
                        <img
                          src={att.localURL}
                          alt="preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FaFile size={18} className="text-emerald-650" />
                      )}
                    </div>
                    <button
                      onClick={() =>
                        setAttachments((prev) =>
                          prev.filter((_, i) => i !== index)
                        )
                      }
                      className="absolute -top-1.5 -right-1.5 bg-white dark:bg-slate-800 text-red-500 rounded-full border border-slate-200 shadow p-0.5 hover:bg-red-50"
                    >
                      <IoMdClose size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <textarea
              ref={inputRef as any}
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              rows={1}
              className={`w-full bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 focus:border-emerald-650/40 dark:focus:border-emerald-500/40 text-sm text-slate-800 dark:text-slate-200 outline-none p-3 max-h-32 resize-none shadow-sm transition-all duration-200 ${
                replyToMessage || attachments.length > 0
                  ? "rounded-b-2xl border-t-slate-100 dark:border-t-slate-900"
                  : "rounded-2xl"
              }`}
            />
          </div>
        )}

        <button
          onClick={
            isRecording
              ? stopRecording
              : message.trim() || attachments.length
              ? () => sendUserMessage()
              : startRecording
          }
          className="w-10 h-10 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center flex-shrink-0 shadow-md hover:scale-102 transition-all"
        >
          {sendLoader ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : isRecording ? (
            <MdStop size={22} />
          ) : message.trim() || attachments.length ? (
            <MdSend size={18} className="translate-x-0.5" />
          ) : (
            <MdMic size={20} />
          )}
        </button>
      </div>

      <Dialog open={openAlertDialog} onOpenChange={setOpenAlertDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-slate-850 dark:text-slate-200">File Upload Warning</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-xs text-slate-500 dark:text-slate-400">{alertMessage}</p>
          </div>
          <DialogFooter>
            <Button size="sm" onClick={() => setOpenAlertDialog(false)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default memo(Footer);
