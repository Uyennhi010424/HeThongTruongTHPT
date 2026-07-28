import axiosClient from "./axiosClient";

export const uploadAvatar = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return axiosClient.post("/upload/avatar", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const uploadImage = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return axiosClient.post("/upload/image", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
