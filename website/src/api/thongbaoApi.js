import axiosClient from "./axiosClient";

export const getThongBao = () => axiosClient.get("/thongbao");
export const createThongBao = (data) => axiosClient.post("/thongbao", data);
export const updateThongBao = (id, data) => axiosClient.put(`/thongbao/${id}`, data);
export const deleteThongBao = (id) => axiosClient.delete(`/thongbao/${id}`);