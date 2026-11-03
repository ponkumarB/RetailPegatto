'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { Super_Admin_URL } from "@/app/services/auth-services";
import { useChatNotificationSettingFilterMutation } from "../api/ChatQueryAPI";

const DEFAULT_RINGTONE_URL = "https://backend.crmfarm.app/media/Bell.mp3";

const ChatContext = createContext<any>(null);

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    console.warn("useChatContext must be used within a ChatProvider");
  }
  return context;
};

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectUser, setSelectUser] = useState({});
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editMessage, setEditMessage] = useState(null);
  const [deleteMessageItem, setDeleteMessageItem] = useState(null);
  const [replyToMessage, setReplyToMessage] = useState(null);
  const [reactionDetails, setReactionDetails] = useState<any>(null);
  const [initialMessages, setInitialMessages] = useState<any[]>([]);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [typingUsers, setTypingUsers] = useState<any>({});
  const [onlineUsers, setOnlineUsers] = useState<any>({});

  const [filterNotificationSettings] = useChatNotificationSettingFilterMutation();

  const [chatSettings, setChatSettings] = useState<any>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("chatNotificationSettings");
      if (saved) return JSON.parse(saved);
    }
    return {
      enabled: true,
      volume: 80,
      ringtone: null,
      ringtoneName: "Default (Bell)",
      isMuted: false,
    };
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "chatNotificationSettings",
        JSON.stringify(chatSettings)
      );
    }
  }, [chatSettings]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (selectedRoom?.id) {
        localStorage.setItem("activeRoomId", String(selectedRoom.id));
      } else {
        localStorage.removeItem("activeRoomId");
      }
    }
    return () => {
      if (typeof window !== "undefined") {
        localStorage.removeItem("activeRoomId");
      }
    };
  }, [selectedRoom?.id]);

  useEffect(() => {
    const handleStatusUpdate = (e: any) => {
      const data = e.detail;
      const userId = Number(data.user_id);
      const status = data.status;
      const lastSeen = data.last_seen;

      setOnlineUsers((prev: any) => ({
        ...prev,
        [userId]: { status, last_seen: lastSeen },
      }));
    };

    window.addEventListener("ml-user-status", handleStatusUpdate);
    return () =>
      window.removeEventListener("ml-user-status", handleStatusUpdate);
  }, []);

  const updateChatSettings = useCallback((newSettings: any) => {
    setChatSettings((prev: any) => ({ ...prev, ...newSettings }));
  }, []);

  const playChatSound = useCallback(
    async (customRingtone = null, customVolume = null, roomId = null) => {
      if (typeof window === "undefined") return;

      const volumeLevel = customVolume !== null ? customVolume : 80;

      // Play synthesized pleasant chime when remote audio resources fail to load/play
      const playSynthesizedFallback = (vol: number) => {
        try {
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          if (!AudioContext) return;
          const ctx = new AudioContext();
          
          // Chime 1 (higher pitch)
          const osc1 = ctx.createOscillator();
          const gain1 = ctx.createGain();
          osc1.type = "sine";
          osc1.frequency.setValueAtTime(880, ctx.currentTime); // A5
          gain1.gain.setValueAtTime(vol / 100, ctx.currentTime);
          gain1.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
          osc1.connect(gain1);
          gain1.connect(ctx.destination);
          
          // Chime 2 (harmonious lower pitch, slightly delayed)
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.type = "sine";
          osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
          gain2.gain.setValueAtTime((vol * 0.7) / 100, ctx.currentTime + 0.08);
          gain2.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          
          osc1.start();
          osc1.stop(ctx.currentTime + 0.25);
          
          osc2.start(ctx.currentTime + 0.08);
          osc2.stop(ctx.currentTime + 0.35);
        } catch (e) {
          console.warn("Synthesized fallback sound failed to play:", e);
        }
      };

      if (customRingtone !== null || customVolume !== null) {
        const audio = new Audio(customRingtone || DEFAULT_RINGTONE_URL);
        audio.volume = volumeLevel / 100;
        audio
          .play()
          .catch((err) => {
            console.warn("Failed to play custom/default chat sound, falling back to synthesized chime:", err);
            playSynthesizedFallback(volumeLevel);
          });
        return;
      }

      if (chatSettings.isMuted) return;

      const userId = localStorage.getItem("userId") || localStorage.getItem("UserId");
      let targetSettings = { ...chatSettings };

      try {
        const payload: any = { user_id: Number(userId) };
        if (roomId) {
          payload.room_id = Number(roomId);
        }

        const res: any = await filterNotificationSettings(payload).unwrap();
        if (res.status) {
          let settingsData;
          if (res.case === "ROOM_NOTIFICATION_SETTING") {
            settingsData = res.data;
          } else if (res.case === "GENERAL_NOTIFICATION_SETTING") {
            settingsData = Array.isArray(res.data) ? res.data[0] : res.data;
          }

          if (settingsData) {
            targetSettings = {
              enabled: settingsData.Enable_Notifications,
              volume:
                settingsData.Volume_Percent !== undefined
                  ? settingsData.Volume_Percent
                  : chatSettings.volume,
              ringtone: settingsData.Notification_Sound,
            };
          }
        }
      } catch (err) {
        console.warn(
          "Failed to fetch settings via filter, falling back to local:",
          err
        );
      }

      if (!targetSettings.enabled) return;

      const finalVolume = targetSettings.volume !== undefined ? targetSettings.volume : 80;

      try {
        let audioSource = targetSettings.ringtone;
        if (!audioSource) {
          audioSource = DEFAULT_RINGTONE_URL;
        } else if (
          typeof audioSource === "string" &&
          audioSource.startsWith("/media/")
        ) {
          audioSource = `${Super_Admin_URL}${audioSource}`;
        }

        const audio = new Audio(audioSource);
        audio.volume = finalVolume / 100;
        audio
          .play()
          .catch((err) => {
            console.warn("Failed to play chat sound, falling back to synthesized chime:", err);
            playSynthesizedFallback(finalVolume);
          });
      } catch (error) {
        console.warn("Failed to prepare chat sound, falling back to synthesized chime:", error);
        playSynthesizedFallback(finalVolume);
      }
    },
    [chatSettings, filterNotificationSettings]
  );

  const markRoomAsNotNew = useCallback(() => {
    setSelectedRoom((prev: any) => (prev ? { ...prev, is_new: false } : null));
  }, []);

  return (
    <ChatContext.Provider
      value={{
        selectUser,
        setSelectUser,
        selectedRoom,
        setSelectedRoom,
        sidebarOpen,
        setSidebarOpen,
        editMessage,
        setEditMessage,
        deleteMessageItem,
        setDeleteMessageItem,
        replyToMessage,
        setReplyToMessage,
        reactionDetails,
        setReactionDetails,
        initialMessages,
        setInitialMessages,
        unreadChatCount,
        setUnreadChatCount,
        markRoomAsNotNew,
        chatSettings,
        updateChatSettings,
        playChatSound,
        typingUsers,
        setTypingUsers,
        onlineUsers,
        setOnlineUsers,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
