import axiosClient from "./axiosClient";

export const getParentsForStudent = (studentId) =>
  axiosClient.get(`/hocsinh/${studentId}/phuhuynh`);
