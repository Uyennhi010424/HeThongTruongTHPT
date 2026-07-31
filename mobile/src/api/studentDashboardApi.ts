import axiosClient from './axiosClient';
import { DashboardData } from '../models/dashboard.type';

export const getStudentDashboard = async (): Promise<DashboardData | null> => {
  try {
    const response = await axiosClient.get('/hocsinh/me/dashboard');
    if (response.data && response.data.data) {
      return response.data.data as DashboardData;
    }
    return null;
  } catch (error) {
    console.error('Error fetching student dashboard:', error);
    throw error;
  }
};

export const getUnreadNotificationCount = async (): Promise<number> => {
  try {
    const response = await axiosClient.get('/notification/unread-count');
    // Assuming API returns { data: { count: number } } or similar.
    // If not, we can fall back to mapping notices from the dashboard data.
    if (response.data && response.data.data) {
      // Backend might return a map, check the actual structure
      const count = response.data.data.unreadCount || response.data.data.count || 0;
      return count;
    }
    return 0;
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return 0; // Don't throw for notification count, just return 0
  }
};
