import axiosClient from "./axiosClient";

export const getHanhKiem = () => axiosClient.get("/hanhkiem");
export const createHanhKiem = (data) => axiosClient.post("/hanhkiem", data);
export const updateHanhKiem = (id, data) => axiosClient.put(`/hanhkiem/${id}`, data);
export const deleteHanhKiem = (id) => axiosClient.delete(`/hanhkiem/${id}`);