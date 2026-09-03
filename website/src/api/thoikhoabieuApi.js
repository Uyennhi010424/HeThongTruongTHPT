import axiosClient from "./axiosClient";

export const getThoiKhoaBieu = (params = {}, config = {}) => axiosClient.get("/thoikhoabieu", { params, skipCache: true, ...config });
export const getGiaoVienThoiKhoaBieu = (params = {}, config = {}) => axiosClient.get("/giaoviendangky/thoikhoabieu", { params, skipCache: true, ...config });
export const createThoiKhoaBieu = (data) => axiosClient.post("/thoikhoabieu", data);
export const updateThoiKhoaBieu = (id, data) => axiosClient.put(`/thoikhoabieu/${id}`, data);
export const deleteThoiKhoaBieu = (id) => axiosClient.delete(`/thoikhoabieu/${id}`);
export const generateThoiKhoaBieu = (namHoc, hocKy, tuan = 1) =>
	axiosClient.post(`/thoikhoabieu/generate`, null, { params: { namHoc, hocKy, tuan } });
export const generateThoiKhoaBieuAll = (namHoc, hocKy, soTuan) =>
	axiosClient.post(`/thoikhoabieu/generate-all`, null, { params: { namHoc, hocKy, soTuan } });
export const shuffleThoiKhoaBieu = (namHoc, hocKy, tuan) =>
	axiosClient.post(`/thoikhoabieu/shuffle`, null, { params: { namHoc, hocKy, tuan } });
export const moveThoiKhoaBieu = (id, thu, tietBatDau) =>
	axiosClient.put(`/thoikhoabieu/${id}/move`, null, { params: { thu, tietBatDau } });
export const swapThoiKhoaBieu = (id1, id2) =>
	axiosClient.post(`/thoikhoabieu/swap`, null, { params: { id1, id2 } });
export const deleteThoiKhoaBieuBulk = (params) =>
	axiosClient.delete("/thoikhoabieu/bulk", { params });
export const updateTkbNote = (id, ghiChu) => 
	axiosClient.put(`/giaoviendangky/thoikhoabieu/${id}/note`, { ghiChu });