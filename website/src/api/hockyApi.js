import axiosClient from "./axiosClient";

export const getHocKy = () => axiosClient.get("/hocky");
export const createHocKy = (data) => axiosClient.post("/hocky", data);
export const updateHocKy = (id, data) => axiosClient.put(`/hocky/${id}`, data);
export const deleteHocKy = (id) => axiosClient.delete(`/hocky/${id}`);
