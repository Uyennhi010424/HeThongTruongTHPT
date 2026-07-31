import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, Text, TouchableOpacity, Modal, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { User, KeyRound, LogOut, X } from 'lucide-react-native';
import { HeaderSection } from '../../components/dashboard/HeaderSection';
import { QuickFunctions } from '../../components/dashboard/QuickFunctions';
import { NextClassCard } from '../../components/dashboard/NextClassCard';
import { UtilitiesGrid } from '../../components/dashboard/UtilitiesGrid';
import { useDashboardStore } from '../../store/useDashboardStore';
import { useAuthStore } from '../../store/useAuthStore';

export default function StudentDashboard() {
  const router = useRouter();
  const { data, isLoading, isRefreshing, error, fetchData, refreshData } = useDashboardStore();
  const { signOut, userData } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const unreadCount = data?.notices?.length || 0; // Tạm thời dùng số lượng thông báo

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = React.useCallback(() => {
    refreshData();
  }, []);

  const handleLogout = async () => {
    setIsMenuOpen(false);
    await signOut();
    router.replace('/(auth)/login');
  };

  const menuItems = [
    {
      icon: <User size={22} color="#475569" />,
      label: 'Thông tin cá nhân',
      onPress: () => {
        setIsMenuOpen(false);
        router.push('/(student)/profile');
      }
    },
    {
      icon: <KeyRound size={22} color="#475569" />,
      label: 'Đổi mật khẩu',
      onPress: () => {
        setIsMenuOpen(false);
        router.push('/(student)/change-password' as any);
      }
    },
  ];

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#143872" />
        <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  if (error && !data) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchData}>
          <Text style={styles.retryText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <HeaderSection 
        student={data?.student || null}
        unreadCount={unreadCount}
        onMenuPress={() => setIsMenuOpen(true)} 
        onNotificationPress={() => router.push('/(student)/notifications' as any)}
      />

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false} 
        bounces={true}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#143872']} />
        }
      >
        <QuickFunctions data={data} />
        <NextClassCard timetable={data?.timetable || []} />
        <UtilitiesGrid />
      </ScrollView>

      {/* Menu Drawer */}
      <Modal visible={isMenuOpen} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackground} onPress={() => setIsMenuOpen(false)} />
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
                  <View style={styles.menuIconContainer}>
                    {item.icon}
                  </View>
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
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    color: '#6B7280',
    fontSize: 14,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  retryBtn: {
    backgroundColor: '#143872',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 16,
  },
  modalOverlay: {
    flex: 1,
    flexDirection: 'row',
  },
  modalBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  drawerContainer: {
    width: '75%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  drawerHeader: {
    backgroundColor: '#143872',
    paddingTop: 50,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  drawerHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
  },
  drawerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  closeBtn: {
    padding: 8,
  },
  drawerUserInfo: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  drawerUserName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  drawerUserRole: {
    fontSize: 15,
    color: '#BFDBFE',
    fontWeight: '500',
  },
  drawerMenuItems: {
    flex: 1,
    paddingTop: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  menuIconContainer: {
    width: 32,
    alignItems: 'flex-start',
  },
  menuItemText: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '500',
  },
  drawerFooter: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#EF4444',
    marginLeft: 12,
  },
});

