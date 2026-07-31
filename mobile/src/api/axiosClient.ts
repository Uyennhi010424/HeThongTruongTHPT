import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '@/store/useAuthStore';

const axiosClient = axios.create({
  baseURL: 'http://192.168.110.210:8080/api', // IP máy tính
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

axiosClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.log('Error getting token', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

import { Alert } from 'react-native';

let isAlertShowing = false;

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      console.log('401 Unauthorized, clearing token');
      
      // Prevent multiple alerts if multiple APIs fail simultaneously
      if (!isAlertShowing) {
        isAlertShowing = true;
        Alert.alert(
          'Phiên đăng nhập hết hạn',
          'Vui lòng đăng nhập lại để tiếp tục sử dụng ứng dụng.',
          [
            {
              text: 'Đồng ý',
              onPress: async () => {
                isAlertShowing = false;
                await SecureStore.deleteItemAsync('userToken');
                await SecureStore.deleteItemAsync('userData');
                // Call Zustand store directly outside of React
                useAuthStore.getState().signOut();
              },
            },
          ],
          { cancelable: false }
        );
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
