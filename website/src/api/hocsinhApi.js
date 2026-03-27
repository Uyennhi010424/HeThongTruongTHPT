import axiosClient from "./axiosClient";

export const getHocSinh = () => axiosClient.get("/hocsinh");
export const createHocSinh = (data) => axiosClient.post("/hocsinh", data);
export const updateHocSinh = (id, data) => axiosClient.put(`/hocsinh/${id}`, data);
export const deleteHocSinh = (id) => axiosClient.delete(`/hocsinh/${id}`);