import { create } from 'zustand';

export type VideoCallStatus = 'idle' | 'active' | 'minimized' | 'maximized';

interface VideoCallState {
  status: VideoCallStatus;
  roomCode: string | null;
  callingURI: string | null;
  isPremium: boolean;
  startCall: (customRoom?: string) => void;
  joinCall: (roomCodeOrUrl: string) => void;
  minimizeCall: () => void;
  restoreCall: () => void;
  maximizeCall: () => void;
  endCall: () => void;
  setPremium: (value: boolean) => void;
}

const APP_ID = 'vpaas-magic-cookie-13fe118289a147918e1607334b017ebf';

const generateRandomRoom = () => {
  const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let ran = '';
  for (let i = 0; i < 20; i++) {
    ran += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return ran;
};

export const useVideoCallStore = create<VideoCallState>((set, get) => ({
  status: 'idle',
  roomCode: null,
  callingURI: null,
  isPremium: true,

  startCall: (customRoom) => {
    const code = customRoom || generateRandomRoom();
    const isPremium = get().isPremium;
    const uri = isPremium
      ? `https://8x8.vc/${APP_ID}/FoyerTech_${code}`
      : `https://meet.jit.si/FoyerTech_${code}`;

    set({
      status: 'active',
      roomCode: code,
      callingURI: uri,
    });
  },

  joinCall: (roomCodeOrUrl) => {
    let code = roomCodeOrUrl.trim();
    let uri = '';

    if (code.startsWith('http://') || code.startsWith('https://')) {
      uri = code;
      // Extract code if possible
      const parts = code.split('/');
      code = parts[parts.length - 1] || 'Room';
    } else {
      const isPremium = get().isPremium;
      // Remove any unwanted prefixes if user pasted partial room name
      if (code.startsWith('FoyerTech_')) {
        code = code.replace('FoyerTech_', '');
      }
      uri = isPremium
        ? `https://8x8.vc/${APP_ID}/FoyerTech_${code}`
        : `https://meet.jit.si/FoyerTech_${code}`;
    }

    set({
      status: 'active',
      roomCode: code,
      callingURI: uri,
    });
  },

  minimizeCall: () => {
    set({ status: 'minimized' });
  },

  restoreCall: () => {
    set({ status: 'active' });
  },

  maximizeCall: () => {
    set({ status: 'maximized' });
  },

  endCall: () => {
    set({
      status: 'idle',
      roomCode: null,
      callingURI: null,
    });
  },

  setPremium: (value) => {
    set({ isPremium: value });
    // If there is an active call, update its URI dynamically
    const { status, roomCode } = get();
    if (status !== 'idle' && roomCode) {
      const uri = value
        ? `https://8x8.vc/${APP_ID}/FoyerTech_${roomCode}`
        : `https://meet.jit.si/FoyerTech_${roomCode}`;
      set({ callingURI: uri });
    }
  },
}));
