import axiosClient from "./axiosClient";

export const getAuditLogs = (params = {}) =>
  axiosClient.get("/audit-log", { params, skipCache: true });
export const getAuditLogsByDiemId = (diemId) =>
  axiosClient.get(`/audit-log/diem/${diemId}`, { skipCache: true });
export const getAuditLogsByHocSinh = (hocSinhId, params = {}) =>
  axiosClient.get(`/audit-log/hocsinh/${hocSinhId}`, { params, skipCache: true });
export const getAuditLogsByGiaoVien = (giaoVienId) =>
  axiosClient.get(`/audit-log/giaovien/${giaoVienId}`, { skipCache: true });
