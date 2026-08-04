import { create } from 'zustand';

interface ParentState {
  children: any[];
  selectedChild: any | null;
  dashboardData: any | null;
  setChildren: (children: any[]) => void;
  setSelectedChild: (child: any) => void;
  setDashboardData: (data: any) => void;
}

export const useParentStore = create<ParentState>((set) => ({
  children: [],
  selectedChild: null,
  dashboardData: null,
  setChildren: (children) => set({ children }),
  setSelectedChild: (child) => set({ selectedChild: child }),
  setDashboardData: (data) => set({ dashboardData: data }),
}));
