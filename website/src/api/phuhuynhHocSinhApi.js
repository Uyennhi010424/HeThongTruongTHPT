import axiosClient from "./axiosClient";

export const getParentsForStudent = (studentId) =>
  axiosClient.get(`/phuhuynh-hocsinh/${studentId}/phuhuynh`);
