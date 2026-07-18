import axiosClient from "./axiosClient";

export const getDayThayByNgay = (ngay, namHoc) =>
	axiosClient.get("/tkb-day-thay", { params: { ngay, namHoc } });

export const getDayThayByRange = (from, to, namHoc) =>
	axiosClient.get("/tkb-day-thay/range", { params: { from, to, namHoc } });

export const getDayThayByTkb = (tkbId) =>
	axiosClient.get(`/tkb-day-thay/tkb/${tkbId}`);

export const getAllDayThay = () => axiosClient.get("/tkb-day-thay/all");

export const phanCongDayThay = (data) =>
	axiosClient.post("/tkb-day-thay", data);

export const huyDayThay = (id) =>
	axiosClient.delete(`/tkb-day-thay/${id}`);
