'use client';

import React, { useCallback, useEffect, useState } from "react";
import useResponsive from "../hook/useResponsive";
import { IoIosSearch } from "react-icons/io";
import { PiCheck } from "react-icons/pi";
import { IoCloseOutline } from "react-icons/io5";
import ChatElement, { AvatarCircle } from "./ChatElement";
import { toast } from "sonner";
import { BASE_URL, socket } from "@/app/services/auth-services";
import {
  useCreateRoomMutation,
  useAddParticipantMutation,
  useGetUserDropdownListQuery,
} from "../api/ChatQueryAPI";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface CreateGroupsProps {
  open: boolean;
  handleClose: () => void;
}

const CreateGroups = ({ open, handleClose }: CreateGroupsProps) => {
  const { data: userDropdownList, isLoading: isUsersLoading } =
    useGetUserDropdownListQuery(undefined);
  const [createRoom] = useCreateRoomMutation();
  const [addParticipant] = useAddParticipantMutation();
  const [filteredParticipants, setFilteredParticipants] = useState<any[]>([]);

  const [groupName, setGroupName] = useState("New Group");
  const [searchValue, setSearchValue] = useState("");
  const [selectPeople, setSelectPeople] = useState<any[]>([]);
  const [isOpenDialog, setIsOpenDialog] = useState(false);

  const isDesktop = useResponsive("up", "md");

  const handleSelectPerson = useCallback(
    (select: any) => {
      const isDuplicate = selectPeople?.some(
        (group) => group?.id === select?.id
      );
      if (select !== "") {
        if (isDuplicate) {
          setSelectPeople(
            selectPeople?.filter((group) => group?.id !== select?.id)
          );
        } else {
          setSelectPeople([...selectPeople, select]);
        }
        setSearchValue("");
        setFilteredParticipants(userDropdownList || []);
      }
    },
    [selectPeople, userDropdownList]
  );

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchValue(val);
    const searchTerm = val?.trim()?.toLowerCase();
    if (searchTerm) {
      const filtered = userDropdownList?.filter(
        (item: any) =>
          item?.username?.toLowerCase()?.includes(searchTerm) ||
          item?.Group_Name?.toLowerCase()?.includes(searchTerm)
      );
      setFilteredParticipants(filtered || []);
    } else {
      setFilteredParticipants(userDropdownList || []);
    }
  };

  useEffect(() => {
    if (userDropdownList) setFilteredParticipants(userDropdownList);
  }, [userDropdownList]);

  const UserId = typeof window !== 'undefined' ? (localStorage.getItem("userId") || localStorage.getItem("UserId")) : null;

  const handleSubmit = async () => {
    if (!UserId) return;
    
    const isSelfSelected = selectPeople.some(
      (person) => String(person.id) === String(UserId)
    );
    if (isSelfSelected) {
      toast.error("You cannot select yourself as a participant. You are automatically added as the group creator.");
      return;
    }
    
    const roomPayload = {
      name: groupName,
      room_type: "group",
      created_by: UserId,
      is_active: true,
    };

    try {
      const roomResponse: any = await createRoom(roomPayload).unwrap();

      if (roomResponse && roomResponse.id) {
        const participantPromises = selectPeople.map((person) => {
          return addParticipant({
            room: roomResponse.id,
            user: person.id,
            is_admin: false,
            is_muted: false,
          }).unwrap();
        });

        participantPromises.push(
          addParticipant({
            room: roomResponse.id,
            user: UserId,
            is_admin: true,
            is_muted: false,
          }).unwrap()
        );

        await Promise.all(participantPromises);

        socket?.emit("ChatUserGroupList", {
          db: BASE_URL,
          id: UserId,
        });

        handleClose();
      }
    } catch (error) {
      console.error("Error creating room/participants:", error);
      toast.error("Failed to create group.");
    }
  };

  return (
    <>
      <div className="relative flex flex-col h-full w-full bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800">
        <div className="flex flex-col h-full px-4 pb-4 space-y-4 pt-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate max-w-[200px]">
              {groupName || "New Group"}
            </span>

            <div className="flex items-center space-x-1">
              <button
                disabled={groupName === ""}
                onClick={() => {
                  if (selectPeople?.length > 0) {
                    const isSelfSelected = selectPeople.some(
                      (person) => String(person.id) === String(UserId)
                    );
                    if (isSelfSelected) {
                      toast.error("Please do not select yourself as a participant. You will be added automatically.");
                      return;
                    }
                    setIsOpenDialog(true);
                  } else {
                    toast.error(
                      "At least one participant must be selected to create a group."
                    );
                  }
                }}
                className={`p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors ${
                  groupName === "" ? "opacity-50 cursor-not-allowed" : ""
                }`}
                title="Confirm Group Details"
              >
                <PiCheck
                  className={groupName === "" ? "text-slate-400" : "text-emerald-600 dark:text-emerald-500"}
                  size={20}
                />
              </button>

              <button
                onClick={handleClose}
                className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                title="Cancel Group Creation"
              >
                <IoCloseOutline size={21} className="text-red-500 hover:text-red-600" />
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="w-full">
            <div className="flex items-center px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-lg h-9 w-full shadow-sm">
              <IoIosSearch className="text-slate-400 mr-2 flex-shrink-0" size={18} />
              <input
                type="text"
                onChange={handleSearch}
                value={searchValue}
                placeholder="Search participants..."
                className="bg-transparent border-none outline-none text-xs text-slate-700 dark:text-slate-300 w-full placeholder-slate-400"
              />
            </div>
          </div>

          {/* Selected participants horizontal list */}
          {selectPeople?.length > 0 && (
            <div className="flex items-center space-x-3 py-2 overflow-x-auto scrollbar-thin max-w-full flex-shrink-0 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/80">
              {selectPeople.map((items: any, idx: number) => (
                <div key={idx} className="flex flex-col items-center flex-shrink-0 relative">
                  <div className="relative">
                    <AvatarCircle size={36} title={items.username} />
                    <button
                      onClick={() => handleSelectPerson(items)}
                      className="absolute -bottom-0.5 -right-0.5 bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5 border border-white dark:border-slate-900 shadow-sm"
                    >
                      <IoCloseOutline size={10} />
                    </button>
                  </div>
                  <span className="text-[9px] text-center text-slate-500 dark:text-slate-400 mt-1 max-w-[50px] truncate">
                    {items.username}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col min-h-0 flex-1">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              All People
            </span>
            
            {/* Scrollable list of available users */}
            <div className="flex-grow overflow-y-auto pr-1 space-y-1 scrollbar-thin">
              {isUsersLoading ? (
                <p className="text-center text-xs text-slate-400 py-4">Loading users...</p>
              ) : filteredParticipants.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-4">No users found</p>
              ) : (
                filteredParticipants.map((user: any) => {
                  const isChecked = selectPeople?.some((che) => che?.id === user?.id);
                  if (!user?.Group_Name) {
                    return (
                      <div key={user.id} className="py-0.5">
                        <ChatElement
                          user={user}
                          check={isChecked}
                          createGroup="create group"
                          handleSelectPerson={handleSelectPerson}
                        />
                      </div>
                    );
                  }
                  return null;
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog to create group */}
      <Dialog open={isOpenDialog} onOpenChange={setIsOpenDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-800 dark:text-slate-200">Create New Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wide">
                Group Name
              </label>
              <Input
                value={groupName}
                onChange={(e) => {
                  const val = e.target.value;
                  const wordCount = val.trim() === '' ? 0 : val.trim().split(/\s+/).length;
                  if (wordCount <= 5) {
                    setGroupName(val);
                  } else {
                    toast.error("Group name cannot exceed 5 words");
                  }
                }}
                placeholder="Enter group name"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-455 uppercase tracking-wide">
                Group Participants ({selectPeople.length})
              </label>
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl max-h-48 overflow-y-auto p-2 space-y-1 scrollbar-thin">
                {selectPeople.map((use: any) => (
                  <div key={use.id} className="flex items-center space-x-2 py-1 px-1.5 hover:bg-slate-50 dark:hover:bg-slate-850/50 rounded-lg">
                    <AvatarCircle size={24} title={use.username} />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {use.username}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="sm:justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpenDialog(false)} size="sm">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={groupName === ""}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              Create Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CreateGroups;
