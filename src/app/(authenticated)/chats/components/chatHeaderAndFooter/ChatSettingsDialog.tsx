'use client';

import React, { useRef, useEffect, useState } from "react";
import {
  MdVolumeUp,
  MdNotifications,
  MdMusicNote,
  MdClose,
} from "react-icons/md";
import { useChatContext } from "../../context/Chatcontext";
import { toast } from "sonner";
import {
  useGetChatNotificationSettingsQuery,
  useCreateChatNotificationSettingMutation,
  usePatchChatNotificationSettingMutation,
} from "../../api/ChatQueryAPI";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ChatSettingsDialogProps {
  open: boolean;
  handleClose: () => void;
  roomId?: any;
}

const ChatSettingsDialog = ({ open, handleClose, roomId = null }: ChatSettingsDialogProps) => {
  const { playChatSound, selectedRoom } = useChatContext();
  const userId = typeof window !== 'undefined' ? (localStorage.getItem("userId") || localStorage.getItem("UserId")) : null;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isGroup = selectedRoom?.room_type === "group" || selectedRoom?.type === "group" || selectedRoom?.is_group;
  const targetUserId = !isGroup
    ? (selectedRoom?.Participant_id || selectedRoom?.receivers?.[0]?.id || selectedRoom?.id)
    : null;
  const activeUserId = targetUserId ? Number(targetUserId) : (userId ? Number(userId) : null);

  const { data: settingsData, isLoading } = useGetChatNotificationSettingsQuery(
    { userId: activeUserId, roomId },
    { skip: !open || !activeUserId }
  );

  const [createSetting] = useCreateChatNotificationSettingMutation();
  const [patchSetting] = usePatchChatNotificationSettingMutation();

  const [localSettings, setLocalSettings] = useState<any>({
    enabled: true,
    volume: 80,
    ringtone: null,
    ringtoneName: "Default (Bell)",
  });

  useEffect(() => {
    if (settingsData && settingsData.length > 0) {
      const serverSetting = settingsData[0];
      setLocalSettings({
        id: serverSetting.id,
        enabled: serverSetting.Enable_Notifications,
        volume: serverSetting.Volume_Percent || 80,
        ringtone: serverSetting.Notification_Sound,
        ringtoneName: serverSetting.File_Name || "Custom Sound",
      });
    } else {
      setLocalSettings({
        enabled: true,
        volume: 80,
        ringtone: null,
        ringtoneName: "Default (Bell)",
      });
    }
  }, [settingsData]);

  const handleToggleNotifications = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSettings((prev: any) => ({ ...prev, enabled: event.target.checked }));
  };

  const handleVolumeChange = (newValue: number) => {
    setLocalSettings((prev: any) => ({ ...prev, volume: newValue }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 900 * 1024) {
        toast.error("File is too large. Please select a file under 900KB.");
        return;
      }
      if (!file.type.startsWith("audio/")) {
        toast.error("Please select an audio file (mp3).");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e: any) => {
        setLocalSettings((prev: any) => ({
          ...prev,
          ringtone: e.target.result,
          ringtoneName: file.name,
        }));
        toast.success("Sound selected! Click Done to save.");
      };
      reader.readAsDataURL(file);
    }
  };

  const resetRingtone = () => {
    setLocalSettings((prev: any) => ({
      ...prev,
      ringtone: null,
      ringtoneName: "Default (Bell)",
    }));
  };

  const handleSave = async () => {
    if (!activeUserId) return;
    
    let ringtoneBase64 = localSettings.ringtone;
    if (ringtoneBase64 && ringtoneBase64.includes("base64,")) {
      ringtoneBase64 = ringtoneBase64.split("base64,")[1];
    }

    const payload = {
      User: Number(activeUserId),
      Room: roomId ? Number(roomId) : null,
      Enable_Notifications: localSettings.enabled,
      Volume_Percent: localSettings.volume,
      File_Name: localSettings.ringtoneName,
      Notification_Sound: ringtoneBase64,
    };

    try {
      if (localSettings.id) {
        await patchSetting({ ...payload, id: localSettings.id }).unwrap();
      } else {
        await createSetting(payload).unwrap();
      }
      toast.success("Settings saved successfully!");
      handleClose();
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("Failed to save settings.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
          <DialogTitle className="text-slate-800 dark:text-slate-200">
            {roomId && selectedRoom
              ? `${selectedRoom.name} - Chat Settings`
              : "General Settings"}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-10 text-center text-sm font-semibold text-slate-500">
            Loading settings...
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Enable Notifications Switch */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5 text-slate-700 dark:text-slate-350">
                <MdNotifications size={20} className="text-emerald-600 dark:text-emerald-500" />
                <span className="text-sm font-semibold">Enable Notifications</span>
              </div>
              
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={localSettings.enabled}
                  onChange={handleToggleNotifications}
                  className="sr-only peer"
                />
                <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
              </label>
            </div>

            {/* Volume range slider */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2.5 text-slate-700 dark:text-slate-350">
                <MdVolumeUp size={20} className="text-emerald-600 dark:text-emerald-500" />
                <span className="text-sm font-semibold">Volume ({localSettings.volume}%)</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={localSettings.volume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                disabled={!localSettings.enabled}
                className="w-full accent-emerald-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Ringtone selector */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2.5 text-slate-700 dark:text-slate-350">
                <MdMusicNote size={20} className="text-emerald-600 dark:text-emerald-500" />
                <span className="text-sm font-semibold">Notification Sound</span>
              </div>
              <div className="flex flex-col space-y-2.5 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200/50 dark:border-slate-800/80">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium italic">
                  Current: {localSettings.ringtoneName}
                </span>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="border-emerald-600 hover:border-emerald-700 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:border-emerald-900 text-xs font-semibold"
                  >
                    Change MP3
                  </Button>
                  {localSettings.ringtone && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetRingtone}
                      className="text-red-500 hover:text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs font-semibold"
                    >
                      Reset
                    </Button>
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="audio/mp3,audio/mpeg"
                  onChange={handleFileChange}
                />
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex flex-row justify-between items-center border-t border-slate-100 dark:border-slate-800 pt-3">
          <Button
            variant="ghost"
            onClick={() => playChatSound(localSettings.ringtone, localSettings.volume)}
            disabled={!localSettings.enabled || isLoading}
            className="text-emerald-600 dark:text-emerald-400 text-xs font-bold hover:bg-slate-50"
            size="sm"
          >
            Test Sound
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            size="sm"
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ChatSettingsDialog;

