import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { Bell, BellRing, Clock, User as UserIcon } from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuthStore } from '../../store/useAuthStore';
import { webSocketService } from '../../api/websocket';
import axiosClient from '../../api/axiosClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThongBao {
  id: number;
  tieuDe: string;
  noiDung: string;
  ngayTao?: string;
  ngayDang?: string;
  loaiThongBao?: string;
  doiTuong?: string;
  loai?: string;
  recipientId?: number;
  nguoiTao?: {
    hoTen: string;
  };
  senderRole?: string;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { userData } = useAuthStore();
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

  const fetchNotifications = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      // Gọi API lấy danh sách thông báo
      const response = await axiosClient.get('/thongbao');
      if (response.data && response.data.data) {
        // Tạm thời sắp xếp mới nhất lên đầu
        const data = response.data.data.sort((a: any, b: any) => {
          const timeA = new Date(a.ngayDang || a.ngayTao || 0).getTime();
          const timeB = new Date(b.ngayDang || b.ngayTao || 0).getTime();
          return timeB - timeA;
        });
        setNotifications(data);
      }
    } catch (err) {
      console.log('Fetch notifications error:', err);
      if (!silent) setError('Không thể tải thông báo. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchReadIds();
      fetchNotifications(true);
    }, [userData?.id])
  );

  useEffect(() => {
    webSocketService.connect(() => {
      const handleRealtimeNotif = () => {
        fetchNotifications(true);
      };

      webSocketService.subscribe('/topic/notifications', handleRealtimeNotif);
      if (userData?.id) {
        webSocketService.subscribe(`/topic/user/${userData.id}`, handleRealtimeNotif);
        webSocketService.subscribe(`/topic/notifications/${userData.id}`, handleRealtimeNotif);
      }
    });

    return () => {
      webSocketService.unsubscribe('/topic/notifications');
      if (userData?.id) {
        webSocketService.unsubscribe(`/topic/user/${userData.id}`);
        webSocketService.unsubscribe(`/topic/notifications/${userData.id}`);
      }
    };
  }, [userData?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications(true);
  };

  const formatDateTime = (dateString?: string | null) => {
    if (!dateString) return '--';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return String(dateString);
      const hh = d.getHours().toString().padStart(2, '0');
      const mm = d.getMinutes().toString().padStart(2, '0');
      const dd = d.getDate().toString().padStart(2, '0');
      const mo = (d.getMonth() + 1).toString().padStart(2, '0');
      const yy = d.getFullYear();
      return `${hh}:${mm} - ${dd}/${mo}/${yy}`;
    } catch {
      return String(dateString);
    }
  };

  const getSenderName = (item: any) => {
    if (item.senderRole === 'GIAO_VIEN') return 'Giáo viên';
    if (item.senderRole === 'PHU_HUYNH') {
      if (item.hocSinh?.hoTen) return `Phụ huynh em ${item.hocSinh.hoTen}`;
      return 'Phụ huynh';
    }
    return 'Hệ thống';
  };

  const getNotificationIcon = (type?: string) => {
    switch (type) {
      case 'TOAN_TRUONG':
        return <BellRing size={20} color="#3B82F6" />;
      case 'GIAO_VIEN':
      case 'CA_NHAN':
      default:
        return <Bell size={20} color="#10B981" />;
    }
  };

  const getNotificationTypeLabel = (type?: string) => {
    switch (type) {
      case 'TOAN_TRUONG': return 'Toàn trường';
      case 'GIAO_VIEN': return 'Lớp học';
      case 'CA_NHAN': return 'Cá nhân';
      default: return 'Khác';
    }
  };

  return (
    <View style={styles.container}>

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
                      {getNotificationIcon(item.doiTuong || item.loaiThongBao || item.loai)}
                      <Text style={styles.typeText}>{getNotificationTypeLabel(item.doiTuong || item.loaiThongBao || item.loai)}</Text>
                    </View>
                    <View style={styles.timeContainer}>
                      <Clock size={14} color="#94A3B8" />
                      <Text style={styles.timeText}>{formatDateTime(item.ngayDang || item.ngayTao)}</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
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
