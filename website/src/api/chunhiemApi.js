import axiosClient from "./axiosClient";

export const getChuNhiem = () => axiosClient.get("/chunhiem", { skipCache: true });
export const getChuNhiemByGiaoVien = (giaoVienId) =>
  axiosClient.get(`/chunhiem/giaovien/${giaoVienId}`);
export const updateChuNhiemByGiaoVien = (giaoVienId, data) =>
  axiosClient.put(`/chunhiem/giaovien/${giaoVienId}`, data);
export const clearChuNhiemByGiaoVien = (giaoVienId) =>
  axiosClient.delete(`/chunhiem/giaovien/${giaoVienId}`);
