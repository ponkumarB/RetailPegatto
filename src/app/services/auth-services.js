import { io } from "socket.io-client";

const currentURL = typeof window !== 'undefined' ? window.location.href : 'https://backend.crmfarm.app/foyertech';
const Tenantname = typeof window !== 'undefined' ? (currentURL.split(".")[0].split("//")[1] || "foyertech") : "foyertech";

export const BASE_URL = `https://backend.crmfarm.app/${Tenantname}`;
export const Super_Admin_URL = `https://backend.crmfarm.app`;
export const BASE_URLIMAGE = `https://backend.crmfarm.app`;

export const socket = typeof window !== 'undefined' ? io("ws://69.30.247.77:8001/", {
  transports: ["websocket", "polling"],
}) : null;

const authService = {};
export default authService;
