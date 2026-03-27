import axiosClient from "./axiosClient";

export const getLichThi = () => axiosClient.get("/lichthi");
export const createLichThi = (data) => axiosClient.post("/lichthi", data);
export const updateLichThi = (id, data) => axiosClient.put(`/lichthi/${id}`, data);
export const deleteLichThi = (id) => axiosClient.delete(`/lichthi/${id}`);