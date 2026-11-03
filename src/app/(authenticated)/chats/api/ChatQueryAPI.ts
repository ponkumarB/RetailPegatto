'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

const getTenantName = () => {
  if (typeof window === 'undefined') return 'foyertech';
  const currentURL = window.location.href;
  const tenant = currentURL.split('.')[0].split('//')[1] || 'foyertech';
  if (tenant === 'localhost' || tenant === '127') {
    return 'foyertech';
  }
  return tenant;
};

const getHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accesstoken') : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    db: 'crmuseradmin1',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

async function chatFetch(url: string, options: RequestInit = {}) {
  const tenant = getTenantName();
  const baseUrl = `https://backend.crmfarm.app/${tenant}`;
  const headers = { ...getHeaders(), ...options.headers };
  const res = await fetch(`${baseUrl}${url}`, {
    ...options,
    headers,
  });
  if (!res.ok) {
    throw new Error(`Chat API error: ${res.statusText} (${res.status})`);
  }
  return res.json();
}

// Wrapper helper to return mutation in RTK query format [mutateAsync, { isLoading, error, isSuccess }]
// and injects custom .unwrap() method to the returned promise for call site compatibility.
function wrapMutation<TData = any, TVariables = any>(mutation: any) {
  const mutateAsync = mutation.mutateAsync;
  const trigger = useCallback((variables: TVariables) => {
    const promise = mutateAsync(variables);
    (promise as any).unwrap = () => promise;
    return promise;
  }, [mutateAsync]);

  return [
    trigger,
    {
      isLoading: mutation.isPending,
      error: mutation.error,
      isSuccess: mutation.isSuccess,
    }
  ] as const;
}

// --- QUERY HOOKS ---

export function useGetUserChatListQuery(userId: any, options?: any) {
  return useQuery({
    queryKey: ['chat', 'userChatList', userId],
    queryFn: async () => {
      const res = await chatFetch(`/user/UserChatList/?user_id=${userId}`);
      return res.status ? res.data : [];
    },
    enabled: options?.skip !== undefined ? !options.skip : !!userId,
  });
}

export function useGetUserDropdownListQuery(userId?: any, options?: any) {
  return useQuery({
    queryKey: ['chat', 'userDropdownList'],
    queryFn: () => chatFetch(`/user/UserDropdownAPI/`),
    enabled: options?.skip !== undefined ? !options.skip : true,
  });
}

export function useGetRoomMessagesQuery(params: { roomId: any; page?: number; userId: any }, options?: any) {
  const page = params.page ?? 1;
  return useQuery({
    queryKey: ['chat', 'roomMessages', params.roomId, page, params.userId],
    queryFn: async (): Promise<any> => {
      const response = await chatFetch(`/user/MessageList/?room=${params.roomId}&page=${page}&user_id=${params.userId}`);
      if (response === 'Blocked') return 'Blocked';
      const messages = Array.isArray(response) ? response : response?.results || [];
      const mapped = messages.map((msg: any) => {
        if (msg.message === 'This message was deleted') {
          return { ...msg, message_type: 'text' };
        }
        return msg;
      });
      return [...mapped].reverse();
    },
    enabled: options?.skip !== undefined ? !options.skip : (!!params.roomId && !!params.userId),
  });
}

export function useGetParticipantsQuery(roomId: any, options?: any) {
  return useQuery({
    queryKey: ['chat', 'participants', roomId],
    queryFn: async () => {
      const response = await chatFetch(`/user/ChatParticipantList/?room=${roomId}`);
      return Array.isArray(response) ? response : response?.results || [];
    },
    enabled: options?.skip !== undefined ? !options.skip : !!roomId,
  });
}

export function useGetChatNotificationSettingsQuery(userParam: any, options?: any) {
  const isObject = typeof userParam === 'object' && userParam !== null;
  const userId = isObject ? userParam.userId : userParam;
  const roomId = isObject ? userParam.roomId : null;

  return useQuery({
    queryKey: ['chat', 'notificationSettings', userId, roomId],
    queryFn: () => {
      let url = `/user/ChatNotificationSettingCRUD/?id=${userId}`;
      if (roomId) {
        url += `&Room=${roomId}`;
      }
      return chatFetch(url);
    },
    enabled: options?.skip !== undefined ? !options.skip : !!userId,
  });
}

// --- LAZY QUERY HOOKS ---

export function useLazyGetRoomMessagesQuery() {
  const trigger = useCallback((params: { roomId: any; page?: number; userId: any }) => {
    const page = params.page ?? 1;
    const promise = chatFetch(`/user/MessageList/?room=${params.roomId}&page=${page}&user_id=${params.userId}`).then((response) => {
      const messages = Array.isArray(response) ? response : response?.results || [];
      const mapped = messages.map((msg: any) => {
        if (msg.message === 'This message was deleted') {
          return { ...msg, message_type: 'text' };
        }
        return msg;
      });
      return [...mapped].reverse();
    });

    (promise as any).unwrap = () => promise;
    return promise as any;
  }, []);

  return [trigger, { isLoading: false, isError: false, error: null }] as const;
}

// --- MUTATION HOOKS ---

export function useCheckPrivateRoomMutation() {
  const mutation = useMutation({
    mutationFn: (payload: any) => chatFetch(`/user/CheckPrivateRoom/`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  });
  return wrapMutation(mutation);
}

export function useCreateRoomMutation() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (payload: any) => chatFetch(`/user/ChatRoomCRUD/`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
    onSuccess: (data, variables) => {
      if (!variables?.skipInvalidate) {
        queryClient.invalidateQueries({ queryKey: ['chat', 'rooms'] });
        queryClient.invalidateQueries({ queryKey: ['chat', 'userChatList'] });
      }
    },
  });
  return wrapMutation(mutation);
}

export function useAddParticipantMutation() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (payload: any) => chatFetch(`/user/ChatParticipantCRUD/`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
    onSuccess: (data, variables) => {
      const roomId = variables?.room;
      if (roomId) {
        queryClient.invalidateQueries({ queryKey: ['chat', 'participants', roomId] });
      }
      if (!variables?.skipInvalidate) {
        queryClient.invalidateQueries({ queryKey: ['chat', 'rooms'] });
        queryClient.invalidateQueries({ queryKey: ['chat', 'userChatList'] });
      }
    },
  });
  return wrapMutation(mutation);
}

export function useMarkMessagesReadMutation() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (payload: any) => chatFetch(`/user/MarkMessagesRead/`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'rooms'] });
      queryClient.invalidateQueries({ queryKey: ['chat', 'userChatList'] });
    },
  });
  return wrapMutation(mutation);
}

export function useUpdateRoomMessageMutation() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (payload: any) => chatFetch(`/user/MessageCRUD/`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
    onSuccess: (data, variables) => {
      const roomId = variables?.room || variables?.Room;
      if (roomId) {
        queryClient.invalidateQueries({ queryKey: ['chat', 'roomMessages', roomId] });
      }
    },
  });
  return wrapMutation(mutation);
}

export function useAddReactionMutation() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (payload: any) => chatFetch(`/user/MessageReactionCRUD/`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
    onSuccess: (data, variables) => {
      const roomId = variables?.room || variables?.Room;
      if (roomId) {
        queryClient.invalidateQueries({ queryKey: ['chat', 'roomMessages', roomId] });
      }
    },
  });
  return wrapMutation(mutation);
}

export function useDeleteRoomMessageMutation() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ id, deleteType }: { id: any; deleteType: string }) => chatFetch(`/user/MessageCRUD/?id=${id}&deleteType=${deleteType}`, {
      method: 'DELETE',
    }),
    onSuccess: (data, variables: any) => {
      const roomId = variables?.room || variables?.Room;
      if (roomId) {
        queryClient.invalidateQueries({ queryKey: ['chat', 'roomMessages', roomId] });
      }
    },
  });
  return wrapMutation(mutation);
}

export function useDeleteMessageVisibilityMutation() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ id }: { id: any }) => chatFetch(`/user/MessageVisibilityCRUD/?id=${id}`, {
      method: 'DELETE',
    }),
    onSuccess: (data, variables: any) => {
      const roomId = variables?.room || variables?.Room;
      if (roomId) {
        queryClient.invalidateQueries({ queryKey: ['chat', 'roomMessages', roomId] });
      }
    },
  });
  return wrapMutation(mutation);
}

export function useDeleteReactionMutation() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ id }: { id: any }) => chatFetch(`/user/MessageReactionCRUD/?id=${id}`, {
      method: 'DELETE',
    }),
    onSuccess: (data, variables: any) => {
      const roomId = variables?.room || variables?.Room;
      if (roomId) {
        queryClient.invalidateQueries({ queryKey: ['chat', 'roomMessages', roomId] });
      }
    },
  });
  return wrapMutation(mutation);
}

export function useChatNotificationSettingFilterMutation() {
  const mutation = useMutation({
    mutationFn: (payload: any) => chatFetch(`/user/ChatNotificationSettingFilter/`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  });
  return wrapMutation(mutation);
}

export function useUpdateRoomMutation() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (payload: any) => chatFetch(`/user/ChatRoomCRUD/`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
    onSuccess: (data, variables: any) => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'rooms'] });
      queryClient.invalidateQueries({ queryKey: ['chat', 'userChatList'] });
      if (variables?.id) {
        queryClient.invalidateQueries({ queryKey: ['chat', 'roomMessages', variables.id] });
      }
    },
  });
  return wrapMutation(mutation);
}

export function usePatchRoomMutation() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (payload: any) => chatFetch(`/user/ChatRoomCRUD/`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
    onSuccess: (data, variables: any) => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'rooms'] });
      queryClient.invalidateQueries({ queryKey: ['chat', 'userChatList'] });
      if (variables?.id) {
        queryClient.invalidateQueries({ queryKey: ['chat', 'roomMessages', variables.id] });
      }
    },
  });
  return wrapMutation(mutation);
}

export function useDeleteRoomMutation() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (roomId: any) => chatFetch(`/user/ChatRoomCRUD/?id=${roomId}`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'rooms'] });
      queryClient.invalidateQueries({ queryKey: ['chat', 'userChatList'] });
    },
  });
  return wrapMutation(mutation);
}

export function useUpdateChatReadFlagMutation() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ receiverId, senderId }: { receiverId: any; senderId: any }) => chatFetch(`/user/Chatreadflagchange/?RecevierId=${receiverId}&SenderId=${senderId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'rooms'] });
      queryClient.invalidateQueries({ queryKey: ['chat', 'userChatList'] });
    },
  });
  return wrapMutation(mutation);
}

export function useCreateChatNotificationSettingMutation() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (payload: any) => chatFetch(`/user/ChatNotificationSettingCRUD/`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
    onSuccess: (data, variables: any) => {
      const userId = variables?.User || variables?.user;
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ['chat', 'notificationSettings', userId] });
      }
    },
  });
  return wrapMutation(mutation);
}

export function usePatchChatNotificationSettingMutation() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (payload: any) => chatFetch(`/user/ChatNotificationSettingCRUD/`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
    onSuccess: (data, variables: any) => {
      const userId = variables?.User || variables?.user;
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ['chat', 'notificationSettings', userId] });
      }
    },
  });
  return wrapMutation(mutation);
}

export function useDeleteParticipantMutation() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (participantId: any) => chatFetch(`/user/ChatParticipantCRUD/?id=${participantId}`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'rooms'] });
      queryClient.invalidateQueries({ queryKey: ['chat', 'userChatList'] });
    },
  });
  return wrapMutation(mutation);
}

export function usePatchParticipantMutation() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (payload: any) => chatFetch(`/user/ChatParticipantCRUD/`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
    onSuccess: (data, variables: any) => {
      const roomId = variables?.room;
      if (roomId) {
        queryClient.invalidateQueries({ queryKey: ['chat', 'participants', roomId] });
      }
      queryClient.invalidateQueries({ queryKey: ['chat', 'rooms'] });
      queryClient.invalidateQueries({ queryKey: ['chat', 'userChatList'] });
    },
  });
  return wrapMutation(mutation);
}

export function useSendRoomMessageMutation() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (payload: any) => chatFetch(`/user/MessageCRUD/`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
    onSuccess: (data, variables: any) => {
      const roomId = variables?.room;
      if (roomId) {
        queryClient.invalidateQueries({ queryKey: ['chat', 'roomMessages', roomId] });
      }
      queryClient.invalidateQueries({ queryKey: ['chat', 'rooms'] });
      queryClient.invalidateQueries({ queryKey: ['chat', 'userChatList'] });
    },
  });
  return wrapMutation(mutation);
}

export function useAddMessageAttachmentMutation() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (payload: any) => chatFetch(`/user/MessageAttachmentCRUD/`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
    onSuccess: (data, variables: any) => {
      const roomId = variables?.room;
      if (roomId) {
        queryClient.invalidateQueries({ queryKey: ['chat', 'roomMessages', roomId] });
      }
    },
  });
  return wrapMutation(mutation);
}

export function useSendTypingStatusMutation() {
  const mutation = useMutation({
    mutationFn: (payload: any) => chatFetch(`/user/MessageCRUD/`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  });
  return wrapMutation(mutation);
}
