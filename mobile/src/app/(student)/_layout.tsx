import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, TouchableOpacity, Modal, Pressable, StyleSheet, Alert } from 'react-native';
import { Home, CalendarDays, CheckCircle, GraduationCap, ClipboardList, User, KeyRound, LogOut, X } from 'lucide-react-native';
import { StudentTopHeader } from '../../components/dashboard/StudentTopHeader';
import { useDashboardStore } from '../../store/useDashboardStore';
import { useAuthStore } from '../../store/useAuthStore';

export default function StudentLayout() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data, isMenuOpen, setIsMenuOpen } = useDashboardStore();
  const { signOut } = useAuthStore();

  const handleLogout = () => {
    setIsMenuOpen(false);
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const menuItems = [
    {
      icon: <User size={22} color="#475569" />,
      label: 'Thông tin cá nhân',
      onPress: () => {
        setIsMenuOpen(false);
        router.push('/(student)/profile');
      },
    },
    {
      icon: <KeyRound size={22} color="#475569" />,
      label: 'Đổi mật khẩu',
      onPress: () => {
        setIsMenuOpen(false);
        router.push('/(student)/change-password' as any);
      },
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF', paddingBottom: insets.bottom }}>
      <Tabs
        screenOptions={{
          headerShown: true,
          header: () => <StudentTopHeader />,
          tabBarActiveTintColor: '#2563EB',
          tabBarInactiveTintColor: '#94A3B8',
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopWidth: 1,
            borderTopColor: '#F1F5F9',
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
            title: 'Trang chủ',
            tabBarIcon: ({ color }) => <Home size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="calendar"
          options={{
            title: 'Lịch học',
            tabBarIcon: ({ color }) => <CalendarDays size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="scores"
          options={{
            title: 'Xem điểm',
            tabBarIcon: ({ color }) => <GraduationCap size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="exam"
          options={{
            title: 'Bài tập',
            tabBarIcon: ({ color }) => <ClipboardList size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="attendance"
          options={{
            title: 'Chuyên cần',
            tabBarIcon: ({ color }) => <CheckCircle size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="change-password"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="feedback"
          options={{
            href: null,
          }}
        />
      </Tabs>

      {/* Global Menu Drawer Modal */}
      <Modal visible={isMenuOpen} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.drawerContainer}>
            <View style={styles.drawerHeader}>
              <View style={styles.drawerHeaderTop}>
                <View style={{ flex: 1 }} />
                <TouchableOpacity onPress={() => setIsMenuOpen(false)} style={styles.closeBtn}>
                  <X size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <View style={styles.drawerUserInfo}>
                <Text style={styles.drawerUserName}>{data?.student?.hoTen || 'Học sinh'}</Text>
                {data?.student?.lop?.tenLop && (
                  <Text style={styles.drawerUserRole}>Lớp {data.student.lop.tenLop}</Text>
                )}
              </View>
            </View>

            <View style={styles.drawerMenuItems}>
              {menuItems.map((item, index) => (
                <TouchableOpacity key={index} style={styles.menuItem} onPress={item.onPress}>
                  <View style={styles.menuIconContainer}>{item.icon}</View>
                  <Text style={styles.menuItemText}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.drawerFooter}>
              <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <LogOut size={22} color="#EF4444" />
                <Text style={styles.logoutText}>Đăng xuất</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Pressable style={styles.modalBackground} onPress={() => setIsMenuOpen(false)} />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalBackground: {
    flex: 1,
  },
  drawerContainer: {
    width: '78%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  drawerHeader: {
    backgroundColor: '#143872',
    padding: 24,
    paddingTop: 48,
  },
  drawerHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  closeBtn: {
    padding: 4,
  },
  drawerUserInfo: {
    marginTop: 8,
  },
  drawerUserName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  drawerUserRole: {
    color: '#93C5FD',
    fontSize: 14,
    marginTop: 4,
  },
  drawerMenuItems: {
    paddingVertical: 16,
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  menuIconContainer: {
    marginRight: 16,
  },
  menuItemText: {
    fontSize: 16,
    color: '#334155',
    fontWeight: '600',
  },
  drawerFooter: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 12,
  },
});
