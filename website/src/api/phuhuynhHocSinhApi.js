import axiosClient from "./axiosClient";

export const getParentsForStudent = (studentId) =>
  axiosClient.get(`/phuhuynh-hocsinh/${studentId}/phuhuynh`);

export const linkParentToStudent = (studentId, parentId) =>
  axiosClient.post(`/phuhuynh-hocsinh/${studentId}/phuhuynh/${parentId}`);
