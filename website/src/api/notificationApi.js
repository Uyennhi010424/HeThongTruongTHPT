import axiosClient from "./axiosClient";

export const getMyNotifications = () => axiosClient.get("/notifications");
export const getUnreadCount = () => axiosClient.get("/notifications/unread-count");
export const markRead = (id) => axiosClient.put(`/notifications/${id}/read`);
export const markAllRead = () => axiosClient.put("/notifications/read-all");
