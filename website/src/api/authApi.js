import axiosClient from "./axiosClient";

export const login = (payload) => axiosClient.post("/auth/login", payload);