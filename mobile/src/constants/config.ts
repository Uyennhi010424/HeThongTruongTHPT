// IP hiện tại của máy tính đang chạy backend Spring Boot
// Khi đổi mạng Wi-Fi, chỉ cần cập nhật IP tại đây
export const SERVER_IP = '192.168.112.210';
export const SERVER_PORT = '8080';

export const BASE_URL = `http://${SERVER_IP}:${SERVER_PORT}`;
export const API_BASE_URL = `${BASE_URL}/api`;
export const SOCKET_URL = `ws://${SERVER_IP}:${SERVER_PORT}/ws/websocket`;
