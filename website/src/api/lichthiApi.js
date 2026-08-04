import axiosClient from "./axiosClient";

export const getLichThi = (params) => axiosClient.get("/lichthi", { params });
export const getLichThiByLop = (lopId) => axiosClient.get("/lichthi/bylop", { params: { lopId } });
export const createLichThi = (data) => axiosClient.post("/lichthi", data);
export const updateLichThi = (id, data) => axiosClient.put(`/lichthi/${id}`, data);
export const deleteLichThi = (id) => axiosClient.delete(`/lichthi/${id}`);
export const autoGenerateLichThi = (data) => axiosClient.post("/lichthi/auto-generate", data);
export const exportLichThiPdf = (namHoc, hocKy) =>
  axiosClient.get("/lichthi/export/pdf", { params: { namHoc, hocKy }, responseType: "blob" });
export const checkExamWeek = (namHoc, tuan) => axiosClient.get("/lichthi/action/check-exam-week", { params: { namHoc, tuan } });