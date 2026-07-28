import axiosClient from "./axiosClient.js";

export const getHolidays = () => {
  return axiosClient.get("/lichnamhoc/holidays");
};
