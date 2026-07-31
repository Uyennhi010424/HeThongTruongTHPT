import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, TouchableOpacity } from 'react-native';

export default function ParentLayout() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, paddingBottom: insets.bottom }}>
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
          headerTitleStyle: {
            fontWeight: 'bold',
            color: '#0f172a',
          },
          // Global header Right for selecting child
          headerRight: () => (
            <TouchableOpacity style={{ marginRight: 16, backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#334155', marginRight: 4 }}>Chọn bé</Text>
              <Ionicons name="chevron-down" size={14} color="#334155" />
            </TouchableOpacity>
          ),
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
            headerTitle: 'Thông tin học tập',
            tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="scores"
          options={{
            title: 'Bảng điểm',
            headerTitle: 'Chi tiết điểm',
            tabBarIcon: ({ color }) => <Ionicons name="school-outline" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="conduct"
          options={{
            title: 'Kỷ luật',
            headerTitle: 'Kỷ luật & Chuyên cần',
            tabBarIcon: ({ color }) => <Ionicons name="shield-checkmark-outline" size={24} color={color} />,
          }}
        />
      </Tabs>
    </View>
  );
}
