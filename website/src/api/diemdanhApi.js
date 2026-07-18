import axiosClient from "./axiosClient";

export const getDiemDanh = (params) => axiosClient.get("/diemdanh", { params, skipCache: true });
export const saveAllDiemDanh = (list) => axiosClient.post("/diemdanh/batch", list);
export const checkDiemDanhLock = (params) => axiosClient.get("/diemdanh/lock", { params, skipCache: true });
export const getDiemDanhStatistics = (lopId, from, to) =>
  axiosClient.get("/diemdanh/statistics", { params: { lopId, from, to }, skipCache: true });
export const getStudentStatistics = (hocSinhId, from, to) =>
  axiosClient.get("/diemdanh/statistics/student", { params: { hocSinhId, from, to }, skipCache: true });
