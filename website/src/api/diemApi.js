import axiosClient from "./axiosClient";

export const getDiem = (params = {}) => axiosClient.get("/diem", { params, skipCache: true, timeout: 60000 });
export const getDiemSummary = (params = {}) => axiosClient.get("/diem/summary", { params, timeout: 60000 });
export const getTeacherSummary = (params = {}) => axiosClient.get("/diem/teacher-summary", { params, timeout: 30000 });
export const getDiemAvgByGrade = (params = {}) => axiosClient.get("/diem/avg-by-grade", { params, timeout: 60000 });
export const getDiemDistribution = (params = {}) => axiosClient.get("/diem/distribution", { params, timeout: 300000 });
export const createDiem = (data) => axiosClient.post("/diem", data);
export const updateDiem = (id, data) => axiosClient.put(`/diem/${id}`, data);
export const deleteDiem = (id) => axiosClient.delete(`/diem/${id}`);
export const deleteDiemBulk = (params) => axiosClient.delete("/diem/bulk", { params });
export const saveAllDiem = (diemList) => axiosClient.post("/diem/batch", diemList);
export const getDiemProgressSummary = (params = {}) => axiosClient.get("/diem/progress/summary", { params, skipCache: true });
export const getClassScoreboard = (params = {}) => axiosClient.get("/diem/class-scoreboard", { params, skipCache: true });
export const exportStudentScorecard = (params = {}) => axiosClient.get("/diem/export-student", { params, responseType: "blob" });

/** Trigger gửi bảng điểm tự động cho phụ huynh (ADMIN only) */
export const guiBangDiemTuDong = (hocKy = 1) =>
  axiosClient.post("/bang-diem/gui-thu-cong", { hocKy });