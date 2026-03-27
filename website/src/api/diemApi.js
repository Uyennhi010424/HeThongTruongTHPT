import axiosClient from "./axiosClient";

export const getDiem = () => axiosClient.get("/diem");
export const createDiem = (data) => axiosClient.post("/diem", data);
export const updateDiem = (id, data) => axiosClient.put(`/diem/${id}`, data);
export const deleteDiem = (id) => axiosClient.delete(`/diem/${id}`);