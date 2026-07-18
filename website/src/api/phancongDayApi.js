import axiosClient from "./axiosClient";

export const getPhanCongDay = (params = {}) => axiosClient.get("/phancong-day", { params });
export const createPhanCongDay = (payload) => axiosClient.post("/phancong-day", payload);
export const deletePhanCongDayById = (id) => axiosClient.delete(`/phancong-day/${id}`);
export const deletePhanCongDay = async (namHoc, hocKy) => {
	try {
		// prefer POST delete endpoint (server may not accept DELETE)
		return await axiosClient.post("/phancong-day/delete", null, { params: { namHoc, hocKy } });
	} catch (e) {
		// fallback to HTTP DELETE if POST not available
		return axiosClient.delete("/phancong-day", { params: { namHoc, hocKy } });
	}
};
export const autoAssignAll = (namHoc, hocKy) => axiosClient.post(`/phancong-day/auto-assign`, null, { params: { namHoc, hocKy } });
