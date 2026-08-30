import React, { useEffect, useState, useCallback } from 'react';
import { Tabs, usePathname, useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { useParentStore } from '../../store/useParentStore';
import axiosClient from '../../api/axiosClient';

export default function ParentLayout() {
  const insets = useSafeAreaInsets();
  const { userData } = useAuthStore();
  const { children, selectedChild, setChildren, setSelectedChild, dashboardData, setDashboardData } = useParentStore();
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const pathname = usePathname();
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      const updateUnreadCount = async () => {
        try {
          const stored = await AsyncStorage.getItem('readNotices');
          const readIds = stored ? JSON.parse(stored) : [];
          const notices = dashboardData?.notices || [];
          const unread = notices.filter((n: any) => !readIds.includes(n.id)).length;
          setUnreadCount(unread);
        } catch (e) {}
      };
      updateUnreadCount();
    }, [dashboardData?.notices])
  );

  useEffect(() => {
    const fetchChildren = async () => {
      try {
        if (userData?.phuHuynhId) {
          const res = await axiosClient.get(`/phuhuynh/${userData.phuHuynhId}/hocsinh`);
          if (res.data?.success) {
            setChildren(res.data.data);
            if (res.data.data.length > 0 && !selectedChild) {
              setSelectedChild(res.data.data[0]);
            }
          }
        }
      } catch (error) {
        console.log("Failed to fetch children", error);
      } finally {
        setLoading(false);
      }
    };
    fetchChildren();
  }, [userData]);

  useEffect(() => {
    const fetchDashboard = async () => {
      if (selectedChild) {
        try {
          const res = await axiosClient.get(`/hocsinh/${selectedChild.id}/dashboard`);
          if (res.data?.success) {
            setDashboardData(res.data.data);
          }
        } catch (error) {
          console.log("Failed to fetch dashboard", error);
        }
      }
    };
    fetchDashboard();
  }, [selectedChild]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  const handleSelectChild = () => {
    if (children.length <= 1) return;
    Alert.alert(
      "Chọn học sinh",
      "Vui lòng chọn bé:",
      children.map((c) => ({
        text: c.hoTen,
        onPress: () => setSelectedChild(c),
      })),
      { cancelable: true }
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff', paddingBottom: insets.bottom }}>
      <Tabs
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: '#ffffff',
            borderBottomWidth: 1,
            borderBottomColor: '#f1f5f9',
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTitleAlign: 'center',
          headerTitle: () => (
            <Image 
              source={require('../../../assets/images/logo.png')} 
              style={{ width: 140, height: 40 }} 
              resizeMode="contain" 
            />
          ),
          headerLeft: () => {
            return (
              <TouchableOpacity 
                style={{ marginLeft: 16, position: 'relative' }}
                onPress={() => router.push('/(parent)/notifications')}
              >
                <Ionicons name="notifications-outline" size={24} color="#334155" />
                {unreadCount > 0 && (
                  <View style={{
                    position: 'absolute', top: -4, right: -4, backgroundColor: '#ef4444', 
                    borderRadius: 10, width: 18, height: 18, justifyContent: 'center', alignItems: 'center'
                  }}>
                    <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          },
          headerRight: () => {
            const isIndex = pathname === '/' || pathname === '/(parent)' || pathname === '/(parent)/index';
            return (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16 }}>
                {children.length > 1 && (
                  <TouchableOpacity onPress={handleSelectChild} style={{ backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, flexDirection: 'row', alignItems: 'center', marginRight: isIndex ? 12 : 0 }}>
                    <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#334155', marginRight: 4 }}>{selectedChild?.hoTen || 'Chọn bé'}</Text>
                    <Ionicons name="chevron-down" size={14} color="#334155" />
                  </TouchableOpacity>
                )}
                {isIndex && (
                  <TouchableOpacity onPress={async () => {
                    await useAuthStore.getState().signOut();
                  }} style={{ padding: 6, backgroundColor: '#fee2e2', borderRadius: 12 }}>
                    <Ionicons name="log-out-outline" size={20} color="#ef4444" />
                  </TouchableOpacity>
                )}
              </View>
            );
          },
          tabBarActiveTintColor: '#2563eb',
          tabBarInactiveTintColor: '#94a3b8',
          tabBarStyle: {
            backgroundColor: '#ffffff',
            borderTopWidth: 1,
            borderTopColor: '#f1f5f9',
            elevation: 0,
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Tổng quan',
            tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="scores"
          options={{
            title: 'Bảng điểm',
            tabBarIcon: ({ color }) => <Ionicons name="school-outline" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="conduct"
          options={{
            title: 'Kỷ luật',
            tabBarIcon: ({ color }) => <Ionicons name="shield-checkmark-outline" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="leave"
          options={{
            title: 'Xin nghỉ',
            tabBarIcon: ({ color }) => <Ionicons name="calendar-outline" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            href: null,
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            href: null,
            headerShown: false,
          }}
        />
      </Tabs>
    </View>
  );
}
