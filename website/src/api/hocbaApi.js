import axiosClient from "./axiosClient";

export const getHocBa = (params) => axiosClient.get("/hocba", { params });
export const getHocBaById = (id) => axiosClient.get(`/hocba/${id}`);
export const createHocBa = (data) => axiosClient.post("/hocba", data);
export const updateHocBa = (id, data) => axiosClient.put(`/hocba/${id}`, data);
export const deleteHocBa = (id) => axiosClient.delete(`/hocba/${id}`);
export const tinhHocLuc = (data) => axiosClient.post("/hocba/tinh", data);
export const tinhHocLucLop = (data) => axiosClient.post("/hocba/tinh-lop", data);
