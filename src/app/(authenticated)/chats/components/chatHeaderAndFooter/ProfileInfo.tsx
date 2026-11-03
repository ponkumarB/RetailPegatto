'use client';

import React, { memo, useState, useEffect, useMemo, useRef } from "react";
import { MdGroups, MdEdit, MdCameraAlt } from "react-icons/md";
import { IoMdClose } from "react-icons/io";
import ChatElement, { AvatarCircle } from "../ChatElement";
import { useChatContext } from "../../context/Chatcontext";
import {
  useGetParticipantsQuery,
  useDeleteParticipantMutation,
  usePatchParticipantMutation,
  usePatchRoomMutation,
} from "../../api/ChatQueryAPI";
import { toast } from "sonner";
import axios from "axios";
import { BASE_URL } from "@/app/services/auth-services";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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

interface ProfileInfoProps {
  open: any;
  setOpen: (el: any) => void;
}

const ProfileInfo = ({ open, setOpen }: ProfileInfoProps) => {
  const { selectedRoom } = useChatContext();
  const [deleteParticipant] = useDeleteParticipantMutation();
  const [patchParticipant] = usePatchParticipantMutation();
  const [patchRoom] = usePatchRoomMutation();
  const { data: participantsList, isLoading: isParticipantsLoading } =
    useGetParticipantsQuery(selectedRoom?.id, { skip: !selectedRoom?.id });

  const UserId = typeof window !== 'undefined' ? (localStorage.getItem("userId") || localStorage.getItem("UserId")) : null;

  // Check if current user is admin
  const isCurrentUserAdmin = useMemo(() => {
    if (!participantsList) return Number(selectedRoom?.created_by) === Number(UserId);
    const p = participantsList.find((p: any) => {
      const pUserId = typeof p.user === 'object' ? p.user?.id : p.user;
      return Number(p.Participant_id || pUserId || p.id) === Number(UserId);
    });
    return p?.is_admin === true || String(p?.is_admin).toLowerCase() === "true" || Number(selectedRoom?.created_by) === Number(UserId);
  }, [participantsList, selectedRoom, UserId]);

  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editName, setEditName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [participantToRemove, setParticipantToRemove] = useState<any>(null);

  const [openAdminDialog, setOpenAdminDialog] = useState(false);
  const [participantToAdmin, setParticipantToAdmin] = useState<any>(null);
  const [isAdminAction, setIsAdminAction] = useState(true);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [privateUserDetails, setPrivateUserDetails] = useState<any>(null);

  const token = typeof window !== 'undefined' ? (localStorage.getItem("token") || localStorage.getItem("accesstoken")) : null;
  const header = useMemo(() => ({
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  }), [token]);

  useEffect(() => {
    if (selectedRoom?.room_type !== "group" && open) {
      const username = selectedRoom?.name || selectedRoom?.Participant_Name;
      if (username) {
        axios.get(`${BASE_URL}/useradmin/UserCRUD/?username=${username}`, header)
          .then((res) => {
            const data = Array.isArray(res.data) ? res.data[0] : res.data;
            if (data) {
              setPrivateUserDetails(data);
            }
          })
          .catch((err) => console.error(err));
      }
    }
  }, [selectedRoom, open, header]);

  const avatarSrc =
    Boolean(privateUserDetails?.User_Photo || selectedRoom?.Participant_Photo || selectedRoom?.User_Photo) &&
    BASE_URL + (privateUserDetails?.User_Photo || selectedRoom?.Participant_Photo || selectedRoom?.User_Photo);

  const profile = () => {
    return (
      <div className="p-4 w-full flex flex-col bg-white dark:bg-slate-900">
        <div className="flex flex-col items-center justify-center mt-4">
          <AvatarCircle
            title={selectedRoom?.room_name || selectedRoom?.name || "Unknown"}
            image={avatarSrc || undefined}
            size={90}
          />
          {avatarSrc && (
            <button
              onClick={() => setLightboxOpen(true)}
              className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1.5 hover:underline"
            >
              Zoom Image
            </button>
          )}

          <span className="text-base font-bold mt-2 text-slate-800 dark:text-slate-250 text-center w-full truncate">
            {privateUserDetails
              ? `${privateUserDetails.first_name || ""} ${privateUserDetails.last_name || ""}`.trim() || privateUserDetails.username
              : selectedRoom?.room_name || selectedRoom?.name}
          </span>
        </div>

        <div className="mt-5 space-y-3.5">
          {(Boolean(privateUserDetails?.email) || Boolean(selectedRoom?.email)) && (
            <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800/80">
              <span className="block text-[10px] font-bold text-slate-450 uppercase tracking-wide">E-mail</span>
              <span className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mt-0.5 break-all select-all">
                {privateUserDetails?.email || selectedRoom?.email}
              </span>
            </div>
          )}
          {Boolean(selectedRoom?.PhoneNo) && (
            <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800/80">
              <span className="block text-[10px] font-bold text-slate-450 uppercase tracking-wide">Phone Number</span>
              <span className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mt-0.5 select-all">
                {selectedRoom?.PhoneNo}
              </span>
            </div>
          )}
          <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800/80">
            <span className="block text-[10px] font-bold text-slate-450 uppercase tracking-wide">Designation</span>
            <span className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mt-0.5 truncate">
              {privateUserDetails?.Designation || selectedRoom?.Designation || "No Designation"}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const handleUpdateRoomName = async () => {
    if (!editName.trim() || !selectedRoom?.id) return;
    try {
      await patchRoom({ id: selectedRoom.id, name: editName }).unwrap();
      toast.success("Group name updated");
      setOpenEditDialog(false);
    } catch (err) {
      toast.error("Failed to update group name");
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedRoom?.id) {
      try {
        const formData = new FormData();
        formData.append("id", selectedRoom.id);
        formData.append("User_Photo", file);
        await patchRoom(formData).unwrap();
        toast.success("Group photo updated");
      } catch (err) {
        toast.error("Failed to update photo");
      }
    }
  };

  const groupMembers = () => {
    return (
      <div className="w-full flex flex-col h-full bg-white dark:bg-slate-900">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex flex-col items-center">
          <div className="relative group">
            <AvatarCircle
              title={selectedRoom?.room_name || selectedRoom?.name || "Unknown"}
              image={avatarSrc || undefined}
              size={75}
            />
            {isCurrentUserAdmin && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-white dark:bg-slate-850 p-1.5 rounded-full shadow border border-slate-200/50 dark:border-slate-800"
                title="Change Photo"
              >
                <MdCameraAlt size={14} className="text-slate-500" />
              </button>
            )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handlePhotoChange}
          />

          <div className="flex items-center space-x-1.5 mt-3 justify-center w-full min-w-0">
            <span className="text-base font-bold text-slate-800 dark:text-slate-150 truncate max-w-[200px]">
              {selectedRoom?.room_name || selectedRoom?.name}
            </span>
            {isCurrentUserAdmin && (
              <button
                onClick={() => {
                  setEditName(selectedRoom?.room_name || selectedRoom?.name || "");
                  setOpenEditDialog(true);
                }}
                className="p-1 text-slate-400 hover:text-slate-655 dark:hover:text-slate-300"
                title="Edit Group Name"
              >
                <MdEdit size={15} />
              </button>
            )}
          </div>
        </div>

        <div className="p-4 flex-1 overflow-y-auto min-h-0 scrollbar-thin">
          <span className="text-[11px] font-bold text-slate-450 uppercase tracking-wider block mb-2.5">
            Total Members ({selectedRoom?.Participant_List?.length || 1})
          </span>
          <div className="space-y-1">
            {!isParticipantsLoading && participantsList?.length > 0 ? (
              participantsList.map((participant: any) => {
                const userId = typeof participant.user === 'object' ? participant.user?.id : participant.user;
                const participantId = participant.Participant_id || userId || participant.id;
                const isCurrentUser = Number(participantId) === Number(UserId);

                const roomParticipantDetails = selectedRoom?.Participant_List?.find(
                  (p: any) => Number(p.Participant_id) === Number(participantId)
                );

                const participantName =
                  roomParticipantDetails?.Participant_Name ||
                  participant.Participant_Name ||
                  participant.user?.username ||
                  participant.username ||
                  "Unknown";

                const participantDesignation =
                  roomParticipantDetails?.Designation ||
                  participant.Designation ||
                  participant.user?.Designation ||
                  "";

                const participantPhoto =
                  roomParticipantDetails?.Participant_Photo ||
                  participant.Participant_Photo ||
                  participant.User_Photo ||
                  participant.user?.User_Photo ||
                  "";

                return (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between py-1 px-1.5 hover:bg-slate-50 dark:hover:bg-slate-850/50 rounded-xl transition-colors duration-150"
                  >
                    <div className="flex items-center space-x-2 min-w-0 flex-1 pr-2">
                      <AvatarCircle
                        size={32}
                        title={participantName}
                        image={participantPhoto ? BASE_URL + participantPhoto : undefined}
                      />
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {participantName}
                        </span>
                        {participantDesignation && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                            {participantDesignation}
                          </span>
                        )}
                      </div>
                      {participant.is_admin && (
                        <span className="text-[9px] text-blue-600 dark:text-blue-400 font-bold border border-blue-200 dark:border-blue-900/50 rounded px-1 py-0.2 select-none flex-shrink-0">
                          Admin
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 flex-shrink-0">
                      {isCurrentUserAdmin && !isCurrentUser && (
                        <button
                          onClick={() => {
                            setParticipantToAdmin(participant);
                            setIsAdminAction(!participant.is_admin);
                            setOpenAdminDialog(true);
                          }}
                          className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline select-none"
                        >
                          {participant.is_admin ? "Dismiss Admin" : "Make Admin"}
                        </button>
                      )}
                      {isCurrentUserAdmin && !isCurrentUser && (
                        <button
                          onClick={() => {
                            setParticipantToRemove(participant);
                            setOpenDeleteDialog(true);
                          }}
                          className="p-1 rounded-full text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <IoMdClose size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-center text-xs text-slate-400 py-6">
                {isParticipantsLoading ? "Loading members..." : "No members found"}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Popover open={Boolean(open)} onOpenChange={(val) => !val && setOpen(null)}>
        <PopoverContent className="w-[340px] p-0 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xl max-h-[500px]" align="end">
          <div className="w-full h-full max-h-[500px] flex flex-col">
            {selectedRoom?.room_type === "group" ? groupMembers() : profile()}
          </div>
        </PopoverContent>
      </Popover>

      {/* Remove Participant Dialog */}
      <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-850 dark:text-slate-200">Remove Member</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 dark:text-slate-400">
              Are you sure you want to remove {participantToRemove?.user?.username || "this member"} from the group?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel size="sm">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (participantToRemove) {
                  try {
                    await deleteParticipant(participantToRemove.id).unwrap();
                    toast.success("Member removed");
                  } catch (err) {
                    toast.error("Failed to remove member");
                  }
                }
                setOpenDeleteDialog(false);
                setParticipantToRemove(null);
              }}
              className="bg-red-600 hover:bg-red-700 text-white font-medium size-sm"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Assign / Dismiss Admin Dialog */}
      <AlertDialog open={openAdminDialog} onOpenChange={setOpenAdminDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-850 dark:text-slate-200">
              {isAdminAction ? "Assign Admin" : "Dismiss Admin"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 dark:text-slate-400">
              Are you sure you want to {isAdminAction ? "make" : "dismiss"}{" "}
              {participantToAdmin?.user?.username || participantToAdmin?.Participant_Name || participantToAdmin?.username || "this member"}{" "}
              {isAdminAction ? "an admin?" : "as an admin?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel size="sm">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (participantToAdmin) {
                  try {
                    await patchParticipant({ id: participantToAdmin.id, is_admin: isAdminAction }).unwrap();
                    toast.success(`Member is ${isAdminAction ? "now an admin" : "no longer an admin"}`);
                  } catch (err) {
                    toast.error("Failed to update admin status");
                  }
                }
                setOpenAdminDialog(false);
                setParticipantToAdmin(null);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium size-sm"
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Group Name Dialog */}
      <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-850 dark:text-slate-200">Edit Group Name</DialogTitle>
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
            <Button variant="outline" onClick={() => setOpenEditDialog(false)} size="sm">
              Cancel
            </Button>
            <Button onClick={handleUpdateRoomName} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Zoom lightbox dialog */}
      {avatarSrc && (
        <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
          <DialogContent className="max-w-md p-1 border-0 bg-transparent flex items-center justify-center shadow-none focus-visible:outline-none">
            <img
              src={avatarSrc}
              alt="Zoom avatar"
              className="max-w-full max-h-[80vh] rounded-xl object-contain shadow-2xl border border-white/10"
              onClick={() => setLightboxOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default memo(ProfileInfo);
