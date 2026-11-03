import { createSlice } from "@reduxjs/toolkit";
import { BASE_URL } from "@/app/services/auth-services";
// import { socket } from "../../socket";
// import axios from "../../utils/axios";
import axios from "axios";

const initialState = {
  open_audio_dialog: false,
  open_audio_notification_dialog: false,
  call_queue: [], // can have max 1 call at any point of time
  incoming: false,
};

const slice = createSlice({
  name: "audioCall",
  initialState,
  reducers: {
    pushToAudioCallQueue(state, action) {
      // check audio_call_queue in redux store

      if (state.call_queue.length === 0) {
        state.call_queue.push(action.payload.call);
        if (action.payload.incoming) {
          state.open_audio_notification_dialog = true; // this will open up the call dialog
          state.incoming = true;
        }
        else {
          state.open_audio_dialog = true;
          state.incoming = false;
        }
      } else {
        // if queue is not empty then emit user_is_busy => in turn server will send this event to sender of call
        // socket.emit("user_is_busy_audio_call", { ...action.payload });
      }

      // Ideally queue should be managed on server side
    },
    resetAudioCallQueue(state, action) {
      state.call_queue = [];
      state.open_audio_notification_dialog = false;
      state.incoming = false;
    },
    closeNotificationDialog(state, action) {
      state.open_audio_notification_dialog = false;
    },
    updateCallDialog(state, action) {
      state.open_audio_dialog = action.payload.state;
      state.open_audio_notification_dialog = false;
    },
  },
});

// Reducer
export default slice.reducer;

// ----------------------------------------------------------------------
const item = "crmuseradmin1"

const generateURL = (type) => {
  let ran = '';
  const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let i = 0; i < 50; i++) {
    ran += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  let meetingUrl = ""
  if (type === 'audio') {
    meetingUrl =
      `https://meet.jit.si/FoyerTech/${ran}#config.prejoinPageEnabled=false&config.startWithAudioMuted=true&config.startWithVideoMuted=true&interfaceConfig.TOOLBAR_BUTTONS=["microphone"]`
      ;
  } else {
    meetingUrl = `https://meet.jit.si/FoyerTech/${ran}`;
  }
  return meetingUrl
};


export const StartAudioCall = (receiverinfo, callLink) => {
  let link = generateURL("audio")
  return async (dispatch, getState) => {
    dispatch(slice.actions.resetAudioCallQueue());
    const currentUserId = typeof window !== 'undefined' ? parseInt(localStorage.getItem("userId") || localStorage.getItem("UserId") || "0") : 0;
    const currentOrgId = typeof window !== 'undefined' ? parseInt(localStorage.getItem("Organization_Id") || localStorage.getItem("orgDetail") || localStorage.getItem("OrganizationId") || "0") : 0;
    try {
      const payload = {
        "RecevierName": receiverinfo?.username,
        "Meassage": "",
        "File": "",
        "Jitci": link,
        "Audio": "calling",
        "Video_Answer": "",
        "Audio_Answer": "",
        "File_Name": "",
        "Organization_Id": parseInt(currentOrgId),
        "SenderId": parseInt(currentUserId),
        "Receiver_Id": receiverinfo?.id,
      }
      await axios
        .post(`${BASE_URL}/user/UserChatMasterCRUD/`, payload, {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "db": item
          },
        })
        .then((res) => {
          dispatch(
            slice.actions.pushToAudioCallQueue({
              call: receiverinfo,
              incoming: false,
            })
          );
          console.log("userChats", initialState)
        })
    } catch (error) {
      console.log(error)
    }

  };
};



export const PushToAudioCallQueue = (call) => {
  return async (dispatch, getState) => {
    dispatch(slice.actions.pushToAudioCallQueue({ call, incoming: true }));
  };
};

export const ResetAudioCallQueue = () => {
  return async (dispatch, getState) => {
    dispatch(slice.actions.resetAudioCallQueue());
  };
};

export const CloseAudioNotificationDialog = () => {
  return async (dispatch, getState) => {
    dispatch(slice.actions.closeNotificationDialog());
  };
};

export const UpdateAudioCallDialog = ({ state }) => {
  return async (dispatch, getState) => {
    dispatch(slice.actions.updateCallDialog({ state }));
  };
};
