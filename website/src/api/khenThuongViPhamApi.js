import axiosClient from "./axiosClient";

const BASE = "/khen-thuong-vi-pham";

export const getKhenThuong = () => axiosClient.get(`${BASE}/khen-thuong`);
export const getViPham = () => axiosClient.get(`${BASE}/vi-pham`);
export const createKhenThuong = (data) => axiosClient.post(`${BASE}/khen-thuong`, data);
export const createViPham = (data) => axiosClient.post(`${BASE}/vi-pham`, data);
export const importKhenThuong = (formData) =>
  axiosClient.post(`${BASE}/khen-thuong/import`, formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
export const importViPham = (formData) =>
  axiosClient.post(`${BASE}/vi-pham/import`, formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
export const downloadKhenThuongTemplate = () =>
  axiosClient.get(`${BASE}/khen-thuong/template`, { responseType: "blob" });
export const downloadViPhamTemplate = () =>
  axiosClient.get(`${BASE}/vi-pham/template`, { responseType: "blob" });
