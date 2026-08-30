import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import axiosClient from '../api/axiosClient';

interface UserData {
  id: number;
  username: string;
  role: string;
  hocSinhId?: number;
  phuHuynhId?: number;
}

interface AuthState {
  userToken: string | null;
  userData: UserData | null;
  isLoading: boolean;
  signIn: (token: string, data: UserData, rememberMe?: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  restoreToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  userToken: null,
  userData: null,
  isLoading: true,

  signIn: async (token: string, data: UserData, rememberMe: boolean = true) => {
    // Luôn lưu token vào SecureStore để dùng được sau khi app reload
    // rememberMe chỉ kiểm soát việc lưu credentials (username/password) để auto-fill
    await SecureStore.setItemAsync('userToken', token);
    await SecureStore.setItemAsync('userData', JSON.stringify(data));
    set({ userToken: token, userData: data });
  },

  signOut: async () => {
    await SecureStore.deleteItemAsync('userToken');
    await SecureStore.deleteItemAsync('userData');
    set({ userToken: null, userData: null });
  },

  restoreToken: async () => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const dataStr = await SecureStore.getItemAsync('userData');
      if (token && dataStr) {
        set({ userToken: token, userData: JSON.parse(dataStr), isLoading: false });
        return;
      }
    } catch (e) {
      console.log('Failed to restore token', e);
    }
    set({ userToken: null, userData: null, isLoading: false });
  },
}));
