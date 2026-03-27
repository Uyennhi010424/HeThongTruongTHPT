import axiosClient from "./axiosClient";

export const getDanToc = () => axiosClient.get("/dantoc");
export const createDanToc = (data) => axiosClient.post("/dantoc", data);
