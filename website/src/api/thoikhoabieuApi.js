import axiosClient from "./axiosClient";

export const getThoiKhoaBieu = () => axiosClient.get("/thoikhoabieu");
export const createThoiKhoaBieu = (data) => axiosClient.post("/thoikhoabieu", data);
export const updateThoiKhoaBieu = (id, data) => axiosClient.put(`/thoikhoabieu/${id}`, data);
export const deleteThoiKhoaBieu = (id) => axiosClient.delete(`/thoikhoabieu/${id}`);