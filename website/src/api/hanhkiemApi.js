import axiosClient from "./axiosClient";

export const getHanhKiem = (params) => axiosClient.get("/hanhkiem", { params, skipCache: true });
export const createHanhKiem = (data) => axiosClient.post("/hanhkiem", data);
export const updateHanhKiem = (id, data) => axiosClient.put(`/hanhkiem/${id}`, data);
export const deleteHanhKiem = (id) => axiosClient.delete(`/hanhkiem/${id}`);
export const saveAllHanhKiem = (list) => axiosClient.post("/hanhkiem/batch", list);
