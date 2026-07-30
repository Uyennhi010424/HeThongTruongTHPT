import axiosClient from "./axiosClient";

export const getThongBao = () => axiosClient.get("/thongbao");
export const createThongBao = (data) => axiosClient.post("/thongbao", data);
export const updateThongBao = (id, data) => axiosClient.put(`/thongbao/${id}`, data);
export const deleteThongBao = (id) => axiosClient.delete(`/thongbao/${id}`);

/**
 * Tao thong bao va tuy chon gui SMS cho phu huynh.
 *
 * @param {object} data - Du lieu thong bao { tieuDe, noiDung, loai, ... }
 * @param {boolean} sendSms - Co gui SMS cho phu huynh hay khong
 * @returns {Promise} Axios promise
 */
export const createThongBaoWithSms = (data, sendSms = false) =>
  axiosClient.post(`/thongbao?sendSms=${sendSms}`, data);

// ─── Reply / Thread ───────────────────────────────────────────────────────
/** Phản hồi (reply) một thông báo theo parentId */
export const replyThongBao = (parentId, data) =>
  axiosClient.post(`/thongbao/reply/${parentId}`, data);

/** Lấy toàn bộ thread của một thông báo (root + replies) */
export const getThread = (thongBaoId) =>
  axiosClient.get(`/thongbao/thread/${thongBaoId}`, { skipCache: true });

/** Lấy inbox: thông báo gửi riêng cho user hiện tại */
export const getInbox = () => axiosClient.get("/thongbao/inbox");

/** Lấy danh sách phản hồi đã gửi bởi user hiện tại */
export const getSentReplies = () => axiosClient.get("/thongbao/sent-replies");

/** Lấy toàn bộ hội thoại (root + replies) theo học sinh ID */
export const getConversationByHocSinh = (hocSinhId) =>
  axiosClient.get(`/thongbao/hocsinh/${hocSinhId}`, { skipCache: true });