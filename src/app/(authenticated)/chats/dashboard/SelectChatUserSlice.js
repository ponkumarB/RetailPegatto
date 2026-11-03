import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { DBname, UserId, token } from "@/app/redux/auth/localStorage";
import { BASE_URL } from "@/app/services/auth-services";
import axios from "axios";

// fetch select user conversations
export const fetchSelectUserConversations = createAsyncThunk(
  "chat/fetchmessages",
  async (id) => {
    const response = await axios.get(
      `${BASE_URL}/user/UserChatMasterCRUD/?RecevierId=${id}&SenderId=${localStorage.getItem("userId") || localStorage.getItem("UserId")}`,
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          db: DBname,
        },
      }
    );

    return response.data;
  }
);

// fetch select user conversations
export const sendMessage = createAsyncThunk(
  "chat/sendmessages",
  async (state) => {
    const { id, endpoint, payload, dispatch } = state;
    console.log("message sent", state);
    try {
      const response = await axios.post(
        `${BASE_URL}/user/${endpoint}/`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
            db: DBname,
          },
        }
      );
      // if (Boolean(response.data)) {

      // }
    } catch (error) {
      console.error(error?.message);
      throw error?.message;
    }
  }
);

const initialState = {
  selectUser: {},
  messages: [],
  status: "idle",
  error: null,
};

export const selectUserSlice = createSlice({
  name: "selectuser",
  initialState,
  reducers: {
    setSelectChatUser(state, action) {
      state.selectUser = action.payload;
    },
    setMessages(state, action) {
      state.messages = action.payload;
    },
    setMsgStatus(state, action) {
      state.status = action.payload;
    },
  },
  // extraReducers(builder) {
  //   builder
  //     .addCase(fetchSelectUserConversations.pending, (state, action) => {
  //       state.status = "loading";
  //     })
  //     .addCase(fetchSelectUserConversations.fulfilled, (state, action) => {
  //       state.status = "succeeded";
  //       state.messages = action.payload
  //     })
  //     .addCase(fetchSelectUserConversations.rejected, (state, action) => {
  //       state.status = "failed";
  //       state.error = action.error.message;
  //     });
  //   // .addCase(sendMessage.fulfilled, (state, action) => {
  //   //  state.status = "succeeded";
  //   //    state.messages = action.payload;
  //   // });
  // },
});

export const getSelectChatUser = (state) => state.selectuser.selectUser;
export const getSelectChatUserMessages = (state) => state.selectuser.messages;
export const getMessagesUserStatus = (state) => state.selectuser?.status;
export const getMessagesError = (state) => state.selectuser?.error;

export const { setSelectChatUser, setMsgStatus, setMessages } =
  selectUserSlice.actions;
export default selectUserSlice.reducer;
