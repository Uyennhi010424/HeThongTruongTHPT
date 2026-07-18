import axiosClient from "./axiosClient";

export const getPhuHuynh = () => axiosClient.get("/phuhuynh");
export const getCurrentPhuHuynh = () => axiosClient.get("/phuhuynh/me");
export const getStudentsByPhuHuynhId = (id) => axiosClient.get(`/phuhuynh/${id}/hocsinh`);
export const createPhuHuynh = (data) => axiosClient.post("/phuhuynh", data);
export const updatePhuHuynh = (id, data) => axiosClient.put(`/phuhuynh/${id}`, data);
export const deletePhuHuynh = (id) => axiosClient.delete(`/phuhuynh/${id}`);
