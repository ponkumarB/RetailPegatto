'use client';

import React, { useState, useEffect, memo, useCallback, useMemo } from "react";
import { useDispatch } from "react-redux";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  MdBusiness,
  MdDateRange,
  MdEmail,
  MdGroupAdd,
  MdLocalPhone,
  MdMoreVert,
  MdPhotoCamera,
  MdAdd,
  MdArrowBack,
  MdSettings,
  MdClose,
} from "react-icons/md";
import { IoIosSearch } from "react-icons/io";
import CreateGroups from "../components/CreateGroups";
import ChatElement from "../components/ChatElement";
import ChatSettingsDialog from "../components/chatHeaderAndFooter/ChatSettingsDialog";
import { BASE_URL, socket } from "@/app/services/auth-services";
import { ProfileImageUpload } from "@/app/pages/contacts/extra-components/APIs";
import useResponsive from "../hook/useResponsive";
import {
  errorFilter,
  formatDate,
  htmlToText,
} from "@/app/pages/widgets/StylesComponents";
import { useChatContext } from "../context/Chatcontext";
import { toast } from "sonner";
import {
  useGetUserChatListQuery,
  useGetUserDropdownListQuery,
  useCheckPrivateRoomMutation,
  useCreateRoomMutation,
  useAddParticipantMutation,
} from "../api/ChatQueryAPI";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AvatarCircle } from "../components/ChatElement";

const Spinner = ({ className = "w-6 h-6 text-emerald-600" }: { className?: string }) => (
  <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const UserInfo = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-center space-x-3 py-1">
    <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center flex-shrink-0 text-emerald-600 dark:text-emerald-400">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <span className="block text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold leading-none mb-0.5">
        {label}
      </span>
      <span className="block text-sm font-semibold text-slate-700 dark:text-slate-300 truncate">
        {value}
      </span>
    </div>
  </div>
);

function ChatLeftSide() {
  const {
    setUnreadChatCount,
    selectedRoom,
    playChatSound,
    setInitialMessages,
    setSelectedRoom,
    setTypingUsers,
    setOnlineUsers,
  } = useChatContext();

  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const UserId = typeof window !== 'undefined' ? (localStorage.getItem("userId") || localStorage.getItem("UserId")) : null;
  const {
    data: chatList,
    isLoading: isChatListLoading,
    refetch: fetchChatList,
  } = useGetUserChatListQuery(UserId, { skip: !UserId });

  const [filteredRooms, setFilteredRooms] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const dispatch = useDispatch();
  const isDesktop = useResponsive("up", "md");
  const [openProfile, setOpenProfile] = useState<any>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);
  const [currentTab, setCurrentTab] = useState(0); // 0: All, 1: Unread, 2: Groups

  const [base64, setBase64] = useState("");
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

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const paramRoomId = searchParams.get("roomId");

  // Listen for roomId in searchParams to automatically select a room (Next.js routing)
  useEffect(() => {
    if (paramRoomId && chatList) {
      const targetRoomId = Number(paramRoomId);

      let rawRooms: any[] = [];
      if (Array.isArray(chatList)) {
        rawRooms = chatList;
      } else if (chatList?.data && Array.isArray(chatList.data)) {
        rawRooms = chatList.data;
      }

      const targetRoom = rawRooms.find(
        (room: any) => Number(room.room_id || room.id) === targetRoomId
      );

      if (targetRoom) {
        const normalizedRoom = {
          ...targetRoom,
          id: targetRoom.room_id || targetRoom.id,
          name: targetRoom.Participant_Name || targetRoom.name || "Unknown",
        };
        setSelectedRoom(normalizedRoom);
        setInitialMessages(targetRoom.Participant_Conversation || []);

        // Clear query param to prevent re-selection loop
        const params = new URLSearchParams(searchParams.toString());
        params.delete("roomId");
        router.replace(`${pathname}?${params.toString()}`);
      }
    }
  }, [
    paramRoomId,
    chatList,
    setSelectedRoom,
    setInitialMessages,
    router,
    pathname,
    searchParams,
  ]);

  const [showAllUsers, setShowAllUsers] = useState(false);
  const { data: userDropdownList, isLoading: isUsersLoading } =
    useGetUserDropdownListQuery(undefined, { skip: !showAllUsers });

  useEffect(() => {
    let rawRooms: any[] = [];
    if (Array.isArray(chatList)) {
      rawRooms = chatList;
    } else if (chatList?.data && Array.isArray(chatList.data)) {
      rawRooms = chatList.data;
    }

    const processedRooms = rawRooms.map((room: any) => {
      if (selectedRoom?.id === (room.room_id || room.id)) {
        return { ...room, unread_count: 0 };
      }

      const lastMessage =
        room.Participant_Conversation?.[
          room.Participant_Conversation.length - 1
        ];

      const lastSenderId = lastMessage?.Participant_id || lastMessage?.sender;

      if (lastSenderId && Number(lastSenderId) === Number(UserId)) {
        return { ...room, unread_count: 0 };
      }
      return room;
    });

    setFilteredRooms(processedRooms);

    const statuses: Record<number, { status: string; last_seen: string }> = {};
    rawRooms.forEach((room: any) => {
      if (room.room_type !== "group") {
        const uId = Number(room.Participant_id || room.id);
        if (uId) {
          statuses[uId] = {
            status: room.is_online ? "online" : "offline",
            last_seen: room.last_seen,
          };
        }
      }
    });
    setOnlineUsers((prev: any) => ({ ...prev, ...statuses }));
  }, [chatList, UserId, selectedRoom?.id, setOnlineUsers]);

  // Sync WebSocket messages
  useEffect(() => {
    if (!UserId) return;
    const handleNewMessage = (data: any) => {
      if (
        Number(data?.receiverId) === Number(UserId) ||
        Number(data?.senderId) === Number(UserId)
      ) {
        fetchChatList();

        if (Number(data?.receiverId) === Number(UserId)) {
          playChatSound(null, null, data?.room_id || data?.roomId);
        }
      }
    };

    socket?.on("receive_notification_message", handleNewMessage);

    return () => {
      socket?.off("receive_notification_message", handleNewMessage);
    };
  }, [UserId, fetchChatList, playChatSound]);

  // Sync ML bridge messages
  useEffect(() => {
    if (!UserId) return;
    const handleNewWebsocketMessage = (e: any) => {
      const data = e.detail;
      const userIds = data.user_ids || [];
      const senderId = Number(data.sender);
      const currentUserId = Number(UserId);

      if (
        senderId === currentUserId ||
        userIds.map(Number).includes(currentUserId)
      ) {
        fetchChatList();

        if (senderId !== currentUserId && userIds.map(Number).includes(currentUserId)) {
          playChatSound(null, null, data.room_id || data.group_id);
        }
      }
    };

    window.addEventListener("ml-message", handleNewWebsocketMessage);
    return () => {
      window.removeEventListener("ml-message", handleNewWebsocketMessage);
    };
  }, [UserId, fetchChatList, playChatSound]);

  // Sync typing status
  useEffect(() => {
    if (!UserId) return;
    const handleTyping = (e: any) => {
      const data = e.detail;
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

    window.addEventListener("ml-typing", handleTyping);
    return () => {
      window.removeEventListener("ml-typing", handleTyping);
    };
  }, [UserId, setTypingUsers]);

  const sortedChats = useMemo(() => {
    return [...filteredRooms].sort((a, b) => {
      const lastA =
        a.last_message_time ||
        a.Participant_Conversation?.[a.Participant_Conversation.length - 1]
          ?.created_at;
      const lastB =
        b.last_message_time ||
        b.Participant_Conversation?.[b.Participant_Conversation.length - 1]
          ?.created_at;
      if (lastA && lastB) return new Date(lastB).getTime() - new Date(lastA).getTime();
      return 0;
    });
  }, [filteredRooms]);

  const displayChats = useMemo(() => {
    let list = sortedChats;

    if (currentTab === 1) {
      list = list.filter((c) => c.unread_count > 0);
    } else if (currentTab === 2) {
      list = list.filter((c) => c.room_type === "group");
    }

    if (!search) return list;
    const term = search.toLowerCase();
    return list.filter((c) => {
      const name = c.room_name || c.Participant_Name || c.name || "";
      return name.toLowerCase().includes(term);
    });
  }, [sortedChats, search, currentTab]);

  const displayAllUsers = useMemo(() => {
    if (!userDropdownList) return [];

    const existingPrivateChatUserIds = new Set(
      Array.isArray(chatList)
        ? chatList
            .filter((chat) => chat.room_type?.toLowerCase() === "private")
            .map((chat) => Number(chat.Participant_id))
            .filter((id) => !isNaN(id) && id > 0)
        : []
    );

    const currentUserId = Number(UserId);

    let list = userDropdownList.filter((u: any) => {
      const uId = Number(u.id);
      return (
        uId !== currentUserId &&
        !existingPrivateChatUserIds.has(uId) &&
        !u.Group_Name
      );
    });

    if (!search) return list;
    const term = search.toLowerCase();
    return list.filter((u: any) => {
      const name = u.username || "";
      return name.toLowerCase().includes(term);
    });
  }, [userDropdownList, chatList, search, UserId]);

  const HandleRefresh = async () => {
    await fetchChatList();
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      console.error("No file selected");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event: any) => {
      const base = btoa(event.target.result);
      const imageName = `${file.lastModified}${file.name}`;
      const payload = {
        base64: base,
        imageName,
        id: localStorage.getItem("userId") || localStorage.getItem("UserId"),
        username: (() => {
          try {
            const data = localStorage.getItem("userData");
            if (data) {
              const parsed = JSON.parse(data);
              return parsed.name || parsed.username || "";
            }
          } catch(e) {}
          return localStorage.getItem("Username") || "";
        })(),
      };

      const errors = errorFilter(payload);
      if (!Object.keys(errors).length) {
        setBase64(base);
        ProfileImageUpload(
          payload,
          setOpenProfile,
          "UserCRUD",
          refreshUserData,
          "useradmin"
        );
      } else {
        toast.error("Error in payload: " + JSON.stringify(errors));
        console.error("Error in payload:", errors);
      }
    };
    reader.readAsBinaryString(file);
  };

  const refreshUserData = async (res: any) => {
    fetchChatList();
  };

  const profile = () => (
    <div className="w-full relative flex flex-col bg-white dark:bg-slate-900">
      {/* Gradient Header */}
      <div className="h-28 bg-gradient-to-r from-emerald-600 to-teal-700 w-full" />

      <div className="flex flex-col items-center -mt-10 px-5 pb-5">
        <div className="relative group">
          <label htmlFor="profile_pics" className="cursor-pointer block relative">
            <AvatarCircle
              title={htmlToText(currentUser?.username || "")?.[0]}
              image={currentUser?.User_Photo ? BASE_URL + currentUser.User_Photo : undefined}
              size={85}
            />
            <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <MdPhotoCamera size={20} className="text-white" />
            </div>
            <div className="absolute bottom-0 right-0 bg-white dark:bg-slate-800 rounded-full p-1.5 shadow-md border border-slate-100 dark:border-slate-700 pointer-events-none">
              <MdPhotoCamera size={14} className="text-emerald-600 dark:text-emerald-400" />
            </div>
          </label>
          <input
            type="file"
            id="profile_pics"
            className="hidden"
            onChange={handleImageUpload}
          />
        </div>

        <h4 className="font-bold text-slate-800 dark:text-slate-100 text-lg mt-3 text-center truncate w-full">
          {htmlToText(currentUser?.username || currentUser?.Group_Name || "")}
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-0.5 truncate w-full">
          {currentUser?.Designation || "No Designation"}
        </p>

        <div className="w-full space-y-2.5 mt-5">
          {currentUser?.email && (
            <UserInfo
              icon={<MdEmail size={18} />}
              label="E-mail"
              value={currentUser.email}
            />
          )}
          {currentUser?.PhoneNo && (
            <UserInfo
              icon={<MdLocalPhone size={18} />}
              label="Phone Number"
              value={currentUser.PhoneNo}
            />
          )}
          <UserInfo
            icon={<MdBusiness size={18} />}
            label="Designation"
            value={currentUser?.Designation || "No Designation"}
          />
          <UserInfo
            icon={<MdDateRange size={18} />}
            label="Joined"
            value={formatDate(currentUser?.date_joined) || "-"}
          />
          
          <div className="border-t border-slate-100 dark:border-slate-800/80 my-3" />
          
          <button
            onClick={() => {
              setOpenSettings(true);
              setOpenProfile(null);
            }}
            className="w-full flex items-center space-x-3 px-3 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-all text-left font-medium text-sm"
          >
            <MdSettings size={18} className="text-slate-400 dark:text-slate-500" />
            <span>Settings</span>
          </button>
        </div>
      </div>
    </div>
  );

  const [checkPrivateRoom] = useCheckPrivateRoomMutation();
  const [createRoom] = useCreateRoomMutation();
  const [addParticipant] = useAddParticipantMutation();

  const handleUserClick = async (selectedUser: any) => {
    if (!selectedUser?.id) return;
    setIsCreatingChat(true);

    try {
      const res: any = await checkPrivateRoom({
        participant_1: Number(UserId),
        participant_2: Number(selectedUser.id),
      }).unwrap();

      console.log("CheckPrivateRoom Response:", res);

      if (res.status === false) {
        const roomPayload = {
          name: selectedUser.username || "Private Chat",
          room_type: "private",
          created_by: Number(UserId),
          is_active: true,
        };

        const newRoom: any = await createRoom({
          ...roomPayload,
          skipInvalidate: true,
        }).unwrap();
        console.log("New Room Created:", newRoom);

        if (newRoom && newRoom.id) {
          await addParticipant({
            room: newRoom.id,
            user: Number(UserId),
            is_admin: true,
            is_muted: false,
            skipInvalidate: true,
          }).unwrap();

          await addParticipant({
            room: newRoom.id,
            user: Number(selectedUser.id),
            is_admin: false,
            is_muted: false,
          }).unwrap();

          setSelectedRoom({
            ...newRoom,
            id: newRoom.id,
            name: selectedUser.username,
            room_type: "private",
            is_new: true,
          });
          setShowAllUsers(false);
        }
      } else if (res.status === true && res.room_id) {
        setSelectedRoom({
          id: res.room_id,
          name: selectedUser.username,
          room_type: "private",
        });
        setShowAllUsers(false);
        toast.info("Room already exists");
      }
    } catch (err) {
      console.error("Error in handleUserClick:", err);
      toast.error("Failed to start chat.");
    } finally {
      setIsCreatingChat(false);
    }
  };

  return (
    <>
      {isCreatingChat && (
        <div className="fixed inset-0 bg-black/30 dark:bg-black/55 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center gap-3">
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-xl flex flex-col items-center gap-2">
            <Spinner className="w-8 h-8 text-emerald-600" />
            <p className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
              Opening Chat...
            </p>
          </div>
        </div>
      )}
      
      {!openDialog ? (
        <div className="relative flex flex-col h-full w-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900">
            <span className="text-lg font-bold text-slate-800 dark:text-slate-100">
              CRM Chat System
            </span>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setOpenDialog(true)}
                className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Create Group"
              >
                <MdGroupAdd size={20} />
              </button>
              <Popover open={Boolean(openProfile)} onOpenChange={(open) => {
                if (!open) {
                  setOpenProfile(null);
                  setBase64("");
                }
              }}>
                <PopoverTrigger
                  onClick={(e) => setOpenProfile(e.currentTarget)}
                  className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Profile Info"
                >
                  <MdMoreVert size={20} />
                </PopoverTrigger>
                <PopoverContent className="w-[340px] p-0 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xl" align="end">
                  {profile()}
                </PopoverContent>
              </Popover>
              <button
                onClick={() => router.push('/')}
                className="p-2 rounded-full text-slate-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-600 dark:hover:text-rose-400 transition-colors ml-0.5"
                title="Close Chat"
              >
                <MdClose size={20} />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="px-4 mb-2">
            <div className="flex items-center px-3 bg-slate-100 dark:bg-slate-800/80 rounded-full h-9 w-full">
              <IoIosSearch className="text-slate-500 dark:text-slate-400 mr-2 flex-shrink-0" size={18} />
              <input
                type="text"
                value={search}
                onChange={handleSearch}
                placeholder="Search chats..."
                className="bg-transparent border-none outline-none text-xs text-slate-700 dark:text-slate-300 w-full placeholder-slate-400"
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center space-x-5 px-4 border-b border-slate-100 dark:border-slate-800">
            {["All", "Unread", "Groups"].map((label, index) => (
              <button
                key={label}
                onClick={() => setCurrentTab(index)}
                className={`pb-2 text-xs font-semibold relative transition-colors ${
                  currentTab === index
                    ? "text-emerald-600 dark:text-emerald-500"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                {label}
                {currentTab === index && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-emerald-600 dark:bg-emerald-500 rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* Chat List Scroll Container */}
          <div className="flex-1 overflow-y-auto px-2 py-2 min-h-0 scrollbar-thin">
            {isChatListLoading || (showAllUsers && isUsersLoading) ? (
              <div className="flex justify-center items-center py-8">
                <Spinner className="w-6 h-6 text-emerald-600" />
              </div>
            ) : showAllUsers ? (
              <>
                <button
                  onClick={() => setShowAllUsers(false)}
                  className="flex items-center space-x-2 px-2 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg w-full mb-2 transition-colors text-left"
                >
                  <MdArrowBack size={18} />
                  <span className="font-semibold text-xs">Back to Chats</span>
                </button>
                {displayAllUsers.length > 0 ? (
                  displayAllUsers.map((user: any, index: number) => (
                    <ChatElement
                      key={`user-${index}`}
                      user={user}
                      HandleRefresh={HandleRefresh}
                      createGroup="create group"
                      handleSelectPerson={handleUserClick}
                    />
                  ))
                ) : (
                  <p className="text-center text-xs text-slate-400 dark:text-slate-500 py-6">
                    No users found
                  </p>
                )}
              </>
            ) : (
              <>
                {displayChats.length > 0 ? (
                  displayChats.map((room: any, index: number) => (
                    <ChatElement
                      key={`chat-${index}`}
                      room={room}
                      HandleRefresh={HandleRefresh}
                    />
                  ))
                ) : (
                  <p className="text-center text-xs text-slate-400 dark:text-slate-500 py-6">
                    No chats found
                  </p>
                )}
              </>
            )}
          </div>

          {/* New Chat Button */}
          <div className="absolute bottom-5 right-5 z-20">
            <button
              onClick={() => setShowAllUsers(true)}
              className="w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
              title="Start New Chat"
            >
              <MdAdd size={24} />
            </button>
          </div>
        </div>
      ) : (
        <CreateGroups
          open={openDialog}
          handleClose={() => setOpenDialog(false)}
        />
      )}

      <ChatSettingsDialog
        open={openSettings}
        handleClose={() => setOpenSettings(false)}
        roomId={null}
      />
    </>
  );
}

export default memo(ChatLeftSide);
