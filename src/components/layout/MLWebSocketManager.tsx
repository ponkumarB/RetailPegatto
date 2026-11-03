'use client';

import React, { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getTenantName } from '@/service/apiClient';

export function MLWebSocketManager() {
  const queryClient = useQueryClient();

  const showNativeNotification = useCallback((title: string, message: string) => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: message,
        icon: '/favicon.ico',
      });
    }
  }, []);

  const playNotificationChime = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      // Chime 1 (higher pitch)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, ctx.currentTime); // A5
      gain1.gain.setValueAtTime(0.3, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      
      // Chime 2 (harmonious lower pitch, slightly delayed)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
      gain2.gain.setValueAtTime(0.2, ctx.currentTime + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      
      osc1.start();
      osc1.stop(ctx.currentTime + 0.25);
      
      osc2.start(ctx.currentTime + 0.08);
      osc2.stop(ctx.currentTime + 0.35);
    } catch (e) {
      console.warn('Chime failed to play:', e);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let mlSocket: WebSocket | null = null;
    let reconnectTimeout: any = null;
    let reconnectDelay = 1000;
    const maxReconnectDelay = 30000;

    const connect = () => {
      const UserId = localStorage.getItem('userId') || localStorage.getItem('UserId');
      if (!UserId) {
        // Retry connection check after 2 seconds if user id is not in localStorage yet
        reconnectTimeout = setTimeout(connect, 2000);
        return;
      }

      const tenantName = getTenantName();

      const baseWsUrl = process.env.NEXT_PUBLIC_ML_WS_URL || 'wss://mlbackend.crmfarm.app/api/WS_Service/ws';
      const wsUrl = `${baseWsUrl}/${tenantName}/${UserId}`;
      console.log('Connecting to Global ML WebSocket:', wsUrl);
      
      mlSocket = new WebSocket(wsUrl);

      mlSocket.onopen = () => {
        console.log('✅ Global ML WebSocket connected.');
        reconnectDelay = 1000; // Reset delay
      };

      mlSocket.onmessage = (event) => {
        console.log('Global ML WebSocket message received:', event.data);
        try {
          const response = JSON.parse(event.data);

          // Dispatch custom event for Chat components to pick up typing status
          if (response.event_type === 'TYPING' || response.event_type === 'GROUP_TYPING') {
            window.dispatchEvent(new CustomEvent('ml-typing', { detail: response }));
          }

          if (response.event_type === 'USER_ONLINE' || response.event_type === 'USER_OFFLINE') {
            window.dispatchEvent(new CustomEvent('ml-user-status', { detail: response }));
          }

          if (response.event_type === 'DM_REACTION' || response.event_type === 'GROUP_REACTION') {
            window.dispatchEvent(new CustomEvent('ml-reaction', { detail: response }));
          }

          if (response.event_type === 'NEW_PROJECT_CREATED') {
            const msg = response.message || 'A new project has been created!';
            toast.success(msg);
            if (typeof document !== 'undefined' && document.hidden) {
              showNativeNotification('New Project', msg);
              playNotificationChime();
            }
          } else if (response.event_type === 'TASK_CREATED') {
            const msg = response.message || 'A new task has been assigned to you!';
            toast.success(msg);
            if (typeof document !== 'undefined' && document.hidden) {
              showNativeNotification('New Task Assigned', msg);
              playNotificationChime();
            }
          } else if (response.event_type === 'TASK_UPDATED') {
            const msg = response.message || 'A task has been updated!';
            toast.success(msg);
            if (typeof document !== 'undefined' && document.hidden) {
              showNativeNotification('Task Updated', msg);
              playNotificationChime();
            }
          } else if (response.event_type === 'DEFECT_CREATED') {
            const msg = response.message || 'A new defect has been created!';
            toast.success(msg);
            if (typeof document !== 'undefined' && document.hidden) {
              showNativeNotification('New Defect Created', msg);
              playNotificationChime();
            }
          } else if (response.event_type === 'DEFECT_UPDATED') {
            const msg = response.message || 'A defect has been updated!';
            toast.success(msg);
            if (typeof document !== 'undefined' && document.hidden) {
              showNativeNotification('Defect Updated', msg);
              playNotificationChime();
            }
          } else if (response.event_type === 'TICKET_CREATED') {
            const msg = response.message || 'A new ticket has been created!';
            toast.success(msg);
            if (typeof document !== 'undefined' && document.hidden) {
              showNativeNotification('New Ticket Created', msg);
              playNotificationChime();
            }
          } else if (response.event_type === 'TICKET_UPDATED') {
            const msg = response.message || 'A ticket has been updated!';
            toast.success(msg);
            if (typeof document !== 'undefined' && document.hidden) {
              showNativeNotification('Ticket Updated', msg);
              playNotificationChime();
            }
          } else if (response.event_type === 'REMINDER') {
            playNotificationChime();
            window.dispatchEvent(new CustomEvent('ml-reminder', { detail: response }));
            
            const moduleName = response.module || 'Meeting';
            const subjectText = response.subject ? `: ${response.subject}` : '';
            const title = `${moduleName} Reminder${subjectText}`;
            const timeInfo = [response.date, response.time].filter(Boolean).join(' at ');
            const stripHtml = (text?: string) => text ? text.replace(/<[^>]*>?/gm, '').trim() : '';
            const rawBodyMsg = response.message || (timeInfo ? `Reminder for ${moduleName} scheduled on ${timeInfo}` : `You have a ${moduleName} reminder.`);
            const bodyMsg = stripHtml(rawBodyMsg);
            const cleanDetails = stripHtml(response.details);
            const descriptionText = cleanDetails || (response.subject ? `Subject: ${response.subject}` : undefined);
            
            toast.info(bodyMsg, {
              description: descriptionText,
              duration: 8000,
            });

            if (typeof document !== 'undefined' && document.hidden) {
              showNativeNotification(title, bodyMsg);
            }

            if (response.module === 'Lead Meeting' || response.module === 'LeadMeeting') {
              queryClient.invalidateQueries({ queryKey: ['leadMeetings'] });
              queryClient.invalidateQueries({ queryKey: ['lead-meetings'] });
              queryClient.invalidateQueries({ queryKey: ['leads'] });
            } else if (response.module === 'Deal Meeting' || response.module === 'DealMeeting') {
              queryClient.invalidateQueries({ queryKey: ['dealMeetings'] });
              queryClient.invalidateQueries({ queryKey: ['deal-meetings'] });
              queryClient.invalidateQueries({ queryKey: ['deals'] });
            } else if (response.module === 'Company Meeting' || response.module === 'CompanyMeeting' || response.module === 'Account Meeting' || response.module === 'AccountMeeting') {
              queryClient.invalidateQueries({ queryKey: ['companyMeetings'] });
              queryClient.invalidateQueries({ queryKey: ['company-meetings'] });
              queryClient.invalidateQueries({ queryKey: ['companies'] });
              queryClient.invalidateQueries({ queryKey: ['accounts'] });
            }
          } else if (response.event_type === 'CHAT_ROOM_CREATED_SELF') {
            queryClient.invalidateQueries({ queryKey: ['chat', 'rooms'] });
            queryClient.invalidateQueries({ queryKey: ['chat', 'userChatList'] });
          } else if (response.event_type === 'CHAT_ROOM_JOINED') {
            queryClient.invalidateQueries({ queryKey: ['chat', 'rooms'] });
            queryClient.invalidateQueries({ queryKey: ['chat', 'userChatList'] });
          } else if (response.event_type === 'GROUP_CREATED') {
            queryClient.invalidateQueries({ queryKey: ['chat', 'rooms'] });
            queryClient.invalidateQueries({ queryKey: ['chat', 'userChatList'] });
          } else if (response.event_type === 'GROUP_JOINED') {
            queryClient.invalidateQueries({ queryKey: ['chat', 'rooms'] });
            queryClient.invalidateQueries({ queryKey: ['chat', 'userChatList'] });
          } else if (response.event_type === 'CHAT_ROOM_PARTICIPANT_UPDATED') {
            queryClient.invalidateQueries({ queryKey: ['chat', 'rooms'] });
            queryClient.invalidateQueries({ queryKey: ['chat', 'userChatList'] });
          } else if (response.event_type === 'CHAT_ROOM_LEFT') {
            queryClient.invalidateQueries({ queryKey: ['chat', 'rooms'] });
            queryClient.invalidateQueries({ queryKey: ['chat', 'userChatList'] });
          } else if (response.event_type === 'DM_MESSAGE') {
            queryClient.invalidateQueries({ queryKey: ['chat', 'rooms'] });
            queryClient.invalidateQueries({ queryKey: ['chat', 'userChatList'] });
            if (response.room_id) {
              queryClient.invalidateQueries({ queryKey: ['chat', 'roomMessages', response.room_id] });
            }
            window.dispatchEvent(new CustomEvent('ml-message', { detail: response }));
            
            playNotificationChime();
            const activeRoomId = localStorage.getItem('activeRoomId');
            const isChatOpen = window.location.pathname.includes('/chats');
            const isCurrentRoomOpen = isChatOpen && activeRoomId && Number(activeRoomId) === Number(response.room_id);
            
            if (!isCurrentRoomOpen) {
              toast.info(`${response.sender_name || 'New Message'}: ${response.message}`);
            }
            if (typeof document !== 'undefined' && document.hidden) {
              showNativeNotification(response.sender_name || 'New Message', response.message);
            }
          } else if (response.event_type === 'GROUP_MESSAGE') {
            queryClient.invalidateQueries({ queryKey: ['chat', 'rooms'] });
            queryClient.invalidateQueries({ queryKey: ['chat', 'userChatList'] });
            if (response.group_id) {
              queryClient.invalidateQueries({ queryKey: ['chat', 'roomMessages', response.group_id] });
            }
            window.dispatchEvent(new CustomEvent('ml-message', { detail: response }));
            
            playNotificationChime();
            const activeRoomId = localStorage.getItem('activeRoomId');
            const isChatOpen = window.location.pathname.includes('/chats');
            const isCurrentRoomOpen = isChatOpen && activeRoomId && Number(activeRoomId) === Number(response.group_id);
            
            if (!isCurrentRoomOpen) {
              toast.info(`${response.group_name || 'Group Message'}: ${response.message}`);
            }
            if (typeof document !== 'undefined' && document.hidden) {
              showNativeNotification(response.group_name || 'Group Message', response.message);
            }
          } else if (response.event_type === 'DM_MESSAGE_UPDATED') {
            queryClient.invalidateQueries({ queryKey: ['chat', 'rooms'] });
            queryClient.invalidateQueries({ queryKey: ['chat', 'userChatList'] });
            if (response.room_id) {
              queryClient.invalidateQueries({ queryKey: ['chat', 'roomMessages', response.room_id] });
            }
          } else if (response.event_type === 'GROUP_MESSAGE_UPDATED') {
            queryClient.invalidateQueries({ queryKey: ['chat', 'rooms'] });
            queryClient.invalidateQueries({ queryKey: ['chat', 'userChatList'] });
            if (response.group_id) {
              queryClient.invalidateQueries({ queryKey: ['chat', 'roomMessages', response.group_id] });
            }
          } else if (response.event_type === 'DM_MESSAGE_DELETED') {
            queryClient.invalidateQueries({ queryKey: ['chat', 'rooms'] });
            queryClient.invalidateQueries({ queryKey: ['chat', 'userChatList'] });
            if (response.room_id) {
              queryClient.invalidateQueries({ queryKey: ['chat', 'roomMessages', response.room_id] });
            }
          } else if (response.event_type === 'GROUP_MESSAGE_DELETED') {
            queryClient.invalidateQueries({ queryKey: ['chat', 'rooms'] });
            queryClient.invalidateQueries({ queryKey: ['chat', 'userChatList'] });
            if (response.group_id) {
              queryClient.invalidateQueries({ queryKey: ['chat', 'roomMessages', response.group_id] });
            }
          } else if (response.event_type === 'MESSAGE_READ' || response.event_type === 'GROUP_MESSAGE_READ') {
            queryClient.invalidateQueries({ queryKey: ['chat', 'rooms'] });
            queryClient.invalidateQueries({ queryKey: ['chat', 'userChatList'] });
            if (response.room_id) {
              queryClient.invalidateQueries({ queryKey: ['chat', 'roomMessages', response.room_id] });
            }
            window.dispatchEvent(new CustomEvent('ml-message-read', { detail: response }));
          }
        } catch (err) {
          console.error('Failed to parse ML WebSocket message:', err);
        }
      };

      mlSocket.onerror = () => {
        // Silently handled: ML WebSocket server is optional / offline
      };

      mlSocket.onclose = () => {
        reconnectTimeout = setTimeout(() => {
          reconnectDelay = Math.min(reconnectDelay * 2, maxReconnectDelay);
          connect();
        }, reconnectDelay);
      };
    };

    connect();

    return () => {
      if (mlSocket) {
        mlSocket.onclose = null;
        mlSocket.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [queryClient, playNotificationChime, showNativeNotification]);

  return null;
}
