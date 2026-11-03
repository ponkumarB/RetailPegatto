import axios from "axios";
import { BASE_URL } from "@/app/services/auth-services";
import { toast } from "sonner"; 

export const ProfileImageUpload = async (
  arg,
  setOpenProfile,
  endPoint,
  getData,
  domin = "user"
) => {
  const token = localStorage.getItem("accesstoken");
  const item = "crmuseradmin1";
  const header = {
    headers: {
      db: item,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  };

  let payload = {
    id: Number(arg?.id),
  };
  if (arg?.username) {
    payload.username = arg?.username;
    payload.User_Photo = arg?.base64;
    payload.User_Photo_Name = arg?.imageName;
  } else {
    payload.File = arg?.base64;
    payload.FileName = arg?.imageName;
  }
  try {
    const res = await axios.patch(
      `${BASE_URL}/${domin}/${endPoint}/`,
      payload,
      header
    );

    if (res?.data?.id) {
      toast.success("Upload successful");
      if (setOpenProfile) setOpenProfile(null);
      if (getData) getData();
    }
  } catch (error) {
    toast.error(error.message || "Upload failed");
  }
};
