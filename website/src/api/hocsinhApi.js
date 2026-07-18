import axiosClient from "./axiosClient";

export const getHocSinh = (params = {}) => axiosClient.get("/hocsinh", { params, skipCache: true });
export const getCurrentHocSinh = () => axiosClient.get("/hocsinh/me", { skipCache: true });
export const getHocSinhStats = () => axiosClient.get("/hocsinh/stats", { skipCache: true });
export const createHocSinh = (data) => axiosClient.post("/hocsinh", data);
export const updateHocSinh = (id, data) => axiosClient.put(`/hocsinh/${id}`, data);
export const deleteHocSinh = (id) => axiosClient.delete(`/hocsinh/${id}`);
export const searchHocSinh = (params = {}) =>
  axiosClient.get("/hocsinh", { params, skipCache: true });