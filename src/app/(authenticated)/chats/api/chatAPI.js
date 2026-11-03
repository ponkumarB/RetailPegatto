// // all users list

// import { BASE_URL, socket } from "@/app/services/auth-services";
// import axios from "axios";
// import { toast } from "react-toastify";

// // headers
// const token = localStorage.getItem("accesstoken");
// const UserId = localStorage.getItem("UserId");
// const item = "crmuseradmin1";
// const header = {
//   headers: {
//     db: "crmuseradmin1",
//     Authorization: `Bearer ${token}`,
//     "Content-Type": "application/json",
//     Accept: "application/json",
//   },
// };

// // get all chat users list
// export const chatUsersList = async (id) => {
//   try {
//     const response = await axios.get(
//       `${BASE_URL}/user/ChatUserGroupList/?id=${id}`,
//       {
//         headers: {
//           db: "crmuseradmin1",
//           "Content-Type": "application/json",
//           Accept: "application/json",
//         },
//       }
//     );
//     if (response) {
//       // console.log(
//       //   "response ------------------------------------ : ",
//       //   response?.data
//       // );
//       return response.data[0];
//     }
//   } catch (error) {
//     toast.error(error?.message);
//   }
// };

// // get search users list
// export const searchUsersList = async (search) => {
//   try {
//     const response = await axios.get(
//       `${BASE_URL}/user/ChatUsersGroupSearchList/?User_Name=${search}&id=${UserId}`,
//       header
//     );
//     if (response) {
//       console.log("response : ", response?.data);
//       return response.data[0];
//     }
//   } catch (error) {
//     toast.error(error?.message);
//   }
// };

// // get messages list
// export const fetchMessages = async (id) => {
//   try {
//     const response = await axios.get(
//       `${BASE_URL}/user/UserChatMasterCRUD/?RecevierId=${id}&SenderId=${UserId}`,
//       {
//         headers: {
//           db: "crmuseradmin1",
//           "Content-Type": "application/json",
//           Accept: "application/json",
//         },
//       }
//     );
//     if (response) {
//       console.log("response : ", response?.data);
//       return response.data;
//     }
//   } catch (error) {
//     toast.error(error?.message);
//   }
// };

// // get messages list
// export const sendMessage = async (endpoint, payload) => {
//   try {
//     const response = await axios.post(
//       `${BASE_URL}/user/${endpoint}/`,
//       payload,
//       {
//         headers: {
//           db: "crmuseradmin1",
//           "Content-Type": "application/json",
//           Accept: "application/json",
//         },
//       }
//     );
//     console.log("send messages : ", payload, localStorage.getItem("UserId"));

//     if (response) {
//       if (socket) {
//         socket.emit("send_to_customer", {
//           message: {
//             db: "salesninja",
//             RecevierId: payload?.Receiver_Id,
//             SenderId: Number(localStorage.getItem("UserId")),
//           },
//         });
//       }
//     }
//   } catch (error) {
//     toast.error(error?.message);
//   }
// };
