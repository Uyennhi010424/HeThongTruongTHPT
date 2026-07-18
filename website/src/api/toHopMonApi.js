import axiosClient from "./axiosClient";

export const getToHopMon = () => axiosClient.get("/tohopmon");
export const getToHopMonById = (id) => axiosClient.get(`/tohopmon/${id}`);
export const createToHopMon = (data) => axiosClient.post("/tohopmon", data);
export const updateToHopMon = (id, data) => axiosClient.put(`/tohopmon/${id}`, data);
export const deleteToHopMon = (id) => axiosClient.delete(`/tohopmon/${id}`);
