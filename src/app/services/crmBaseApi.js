import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const currentURL = typeof window !== 'undefined' ? window.location.href : 'https://backend.crmfarm.app/foyertech';
export const Tenantname = typeof window !== 'undefined' ? (currentURL.split(".")[0].split("//")[1] || "foyertech") : "foyertech";

export const crmBaseApi = createApi({
  reducerPath: "crmApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `https://backend.crmfarm.app/${Tenantname}`,
    prepareHeaders: (headers) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem("accesstoken") : null;
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: [
    "Project",
    "Tasks",
    "Messages",
    "Rooms",
    "ChatMessages",
    "ChatCount",
    "Defects",
    "TicketManagementCRUD",
    "Appointments",
    "Leads",
    "Meeting",
    "Agents",
    "Lookup",
    "CallLogs",
    "SocialMedia",
  ],
  endpoints: () => ({}),
});
