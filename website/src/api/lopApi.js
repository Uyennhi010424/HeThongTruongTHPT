import axiosClient from "./axiosClient";

export const getLop = () => axiosClient.get("/lophoc");
export const createLop = (data) => axiosClient.post("/lophoc", data);
export const updateLop = (id, data) => axiosClient.put(`/lophoc/${id}`, data);
export const deleteLop = (id) => axiosClient.delete(`/lophoc/${id}`);