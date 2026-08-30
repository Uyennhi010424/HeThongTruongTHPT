import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Bell, BellRing, Clock, User as UserIcon } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import axiosClient from '../../api/axiosClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThongBao {
  id: number;
  tieuDe: string;
  noiDung: string;
  ngayTao: string;
  loaiThongBao: string;
  nguoiTao: {
    hoTen: string;
  };
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<ThongBao[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [readIds, setReadIds] = useState<number[]>([]);

  const fetchReadIds = async () => {
    try {
      const stored = await AsyncStorage.getItem('readNotices');
      if (stored) {
        setReadIds(JSON.parse(stored));
      }
    } catch (e) {}
  };

  const markAsRead = async (id: number) => {
    if (!readIds.includes(id)) {
      const newIds = [...readIds, id];
      setReadIds(newIds);
      try {
        await AsyncStorage.setItem('readNotices', JSON.stringify(newIds));
      } catch (e) {}
    }
  };

  const fetchNotifications = async () => {
    try {
      setError(null);
      // Gọi API lấy danh sách thông báo
      const response = await axiosClient.get('/thongbao');
      if (response.data && response.data.data) {
        // Tạm thời sắp xếp mới nhất lên đầu
        const data = response.data.data.sort((a: ThongBao, b: ThongBao) => {
          return new Date(b.ngayTao).getTime() - new Date(a.ngayTao).getTime();
        });
        setNotifications(data);
      }
    } catch (err) {
      console.log('Fetch notifications error:', err);
      setError('Không thể tải thông báo. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReadIds();
    fetchNotifications();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const date = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return `${time} ${date}`;
  };

  const getSenderName = (item: any) => {
    if (item.senderRole === 'GIAO_VIEN') return 'Giáo viên';
    if (item.senderRole === 'PHU_HUYNH') {
      if (item.hocSinh?.hoTen) return `Phụ huynh em ${item.hocSinh.hoTen}`;
      return 'Phụ huynh';
    }
    return 'Hệ thống';
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'TOAN_TRUONG':
        return <BellRing size={20} color="#3B82F6" />;
      case 'GIAO_VIEN':
      case 'CA_NHAN':
      default:
        return <Bell size={20} color="#10B981" />;
    }
  };

  const getNotificationTypeLabel = (type: string) => {
    switch (type) {
      case 'TOAN_TRUONG': return 'Toàn trường';
      case 'GIAO_VIEN': return 'Lớp học';
      case 'CA_NHAN': return 'Cá nhân';
      default: return 'Khác';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông báo</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Đang tải thông báo...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchNotifications}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />
          }
        >
          {notifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Bell size={48} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>Chưa có thông báo</Text>
              <Text style={styles.emptyDesc}>Bạn không có thông báo nào vào lúc này.</Text>
            </View>
          ) : (
            notifications.map((item) => {
              const isExpanded = expandedId === item.id;
              return (
                <TouchableOpacity 
                  key={item.id} 
                  style={[styles.card, !readIds.includes(item.id) && { borderLeftWidth: 3, borderLeftColor: '#2563EB', backgroundColor: '#F8FAFC' }]}
                  activeOpacity={0.7}
                  onPress={() => {
                    setExpandedId(isExpanded ? null : item.id);
                    markAsRead(item.id);
                  }}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.typeBadge}>
                      {getNotificationIcon(item.loaiThongBao)}
                      <Text style={styles.typeText}>{getNotificationTypeLabel(item.loaiThongBao)}</Text>
                    </View>
                    <View style={styles.timeContainer}>
                      <Clock size={14} color="#94A3B8" />
                      <Text style={styles.timeText}>{formatDateTime(item.ngayTao)}</Text>
                    </View>
                  </View>

                  <Text style={styles.title}>{item.tieuDe}</Text>
                  
                  <Text 
                    style={styles.content}
                    numberOfLines={isExpanded ? undefined : 2}
                  >
                    {item.noiDung}
                  </Text>
                  
                  {!isExpanded && (
                    <Text style={{ color: '#2563EB', fontSize: 13, marginBottom: 12 }}>Xem thêm</Text>
                  )}

                  <View style={styles.footer}>
                    <View style={styles.senderContainer}>
                      <UserIcon size={16} color="#64748B" />
                      <Text style={styles.senderText}>{getSenderName(item)}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#64748B',
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
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#64748B',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    color: '#94A3B8',
    marginLeft: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 8,
  },
  content: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  senderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  senderText: {
    fontSize: 13,
    color: '#64748B',
    marginLeft: 6,
    fontWeight: '500',
  }
});
