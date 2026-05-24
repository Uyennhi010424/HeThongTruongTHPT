import axiosClient from "./axiosClient";

export const getPhuHuynh = () => axiosClient.get("/phuhuynh");
export const createPhuHuynh = (data) => axiosClient.post("/phuhuynh", data);
export const updatePhuHuynh = (id, data) => axiosClient.put(`/phuhuynh/${id}`, data);
