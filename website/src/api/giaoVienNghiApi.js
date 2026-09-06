import axiosClient from "./axiosClient";

export const getNghiByNgay = (ngay, namHoc) =>
	axiosClient.get("/giao-vien-nghi", { params: { ngay, namHoc } });

export const getNghiByNamHoc = (namHoc) =>
	axiosClient.get("/giao-vien-nghi/nam-hoc", { params: { namHoc } });

export const getNghiByGiaoVien = (id, from, to, namHoc) =>
	axiosClient.get(`/giao-vien-nghi/giao-vien/${id}`, { params: { from, to, namHoc } });

export const getAllNghi = (namHoc) =>
	axiosClient.get("/giao-vien-nghi/all", { params: { namHoc } });

export const dangKyNghi = (data) =>
	axiosClient.post("/giao-vien-nghi", data);

export const huyNghi = (id) =>
	axiosClient.delete(`/giao-vien-nghi/${id}`);

export const duyetNghi = (id, data) =>
	axiosClient.put(`/giao-vien-nghi/${id}/duyet`, data);
