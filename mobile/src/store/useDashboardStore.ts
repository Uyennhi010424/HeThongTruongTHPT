import { create } from 'zustand';
import { DashboardData } from '../models/dashboard.type';
import { getStudentDashboard } from '../api/studentDashboardApi';

interface DashboardState {
  data: DashboardData | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
  fetchData: () => Promise<void>;
  refreshData: () => Promise<void>;
  clearData: () => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  data: null,
  isLoading: false,
  isRefreshing: false,
  error: null,
  isMenuOpen: false,
  setIsMenuOpen: (open: boolean) => set({ isMenuOpen: open }),

  fetchData: async () => {
    // Only show loading if we don't have data yet
    if (!get().data) {
      set({ isLoading: true, error: null });
    }
    try {
      const data = await getStudentDashboard();
      set({ data, isLoading: false, error: null });
    } catch (error: any) {
      set({ isLoading: false, error: error.message || 'Không thể kết nối đến máy chủ.' });
    }
  },

  refreshData: async () => {
    set({ isRefreshing: true, error: null });
    try {
      const data = await getStudentDashboard();
      set({ data, isRefreshing: false, error: null });
    } catch (error: any) {
      set({ isRefreshing: false, error: error.message || 'Không thể kết nối đến máy chủ.' });
    }
  },

  clearData: () => set({ data: null, error: null, isLoading: false, isRefreshing: false, isMenuOpen: false }),
}));
