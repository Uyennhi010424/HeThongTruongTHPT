import React, { useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/useAuthStore';
import { useParentStore } from '../../store/useParentStore';
import { useRouter } from 'expo-router';
import { BASE_URL } from '@/constants/config';

const formatConduct = (val: string) => {
  if (val === 'TOT') return 'Tốt';
  if (val === 'KHA') return 'Khá';
  if (val === 'TRUNG_BINH') return 'Trung bình';
  if (val === 'YEU') return 'Yếu';
  return val;
};

const getInitials = (name?: string) => {
  if (!name) return 'HS';
  const parts = name.trim().split(/\s+/);
  return parts[parts.length - 1].charAt(0).toUpperCase();
};

export default function ParentDashboard() {
  const { signOut } = useAuthStore();
  const { selectedChild, dashboardData } = useParentStore();
  const router = useRouter();
  const [imgError, setImgError] = useState(false);

  if (!selectedChild || !dashboardData) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={{ marginTop: 12, color: '#64748b' }}>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  const getAvatarUri = () => {
    if (!selectedChild?.anhDaiDien) return null;
    if (selectedChild.anhDaiDien.startsWith('http')) return selectedChild.anhDaiDien;
    return `${BASE_URL}${selectedChild.anhDaiDien.startsWith('/') ? '' : '/'}${selectedChild.anhDaiDien}`;
  };

  const avatarUri = getAvatarUri();

  // Calculate stats
  const gpa = dashboardData.gpa ?? '--';
  const latestConduct = dashboardData.conducts && dashboardData.conducts.length > 0
    ? formatConduct(dashboardData.conducts[dashboardData.conducts.length - 1].xepLoai)
    : '--';
  const attendance = dashboardData.attendanceStats;
  const absentDays = attendance ? (attendance.vangPhep || 0) + (attendance.vangKhongPhep || 0) : 0;

  // Filter timetable for today
  const today = new Date().getDay(); // 0 is Sunday
  const todayThu = today === 0 ? 8 : today + 1;
  const todaySchedule = dashboardData.timetable?.filter((t: any) => t.thu === todayThu).sort((a: any, b: any) => a.tietBatDau - b.tietBatDau) || [];

  const getDayName = (thu: number) => {
    if (thu === 8) return "Chủ nhật";
    return `Thứ ${thu}`;
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
      {/* Profile & Logout */}
      <View style={styles.header}>
        <View style={styles.childInfo}>
          <View style={styles.avatar}>
            {avatarUri && !imgError ? (
              <Image
                source={{ uri: avatarUri }}
                style={styles.avatarImg}
                onError={() => setImgError(true)}
              />
            ) : (
              <Text style={styles.avatarText}>{getInitials(selectedChild.hoTen)}</Text>
            )}
          </View>
          <View>
            <Text style={styles.childName}>{selectedChild.hoTen}</Text>
            <Text style={styles.childClass}>
              Lớp {selectedChild.lop?.tenLop || 'Chưa phân lớp'} 
              {selectedChild.lop?.gvcn ? ` - GVCN: ${selectedChild.lop.gvcn.hoTen}` : ''}
            </Text>
          </View>
        </View>
      </View>

      {/* Tình hình học tập */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tổng quan học tập</Text>
        <View style={styles.overviewGrid}>
          <View style={styles.overviewCard}>
            <Text style={styles.overviewValue}>{gpa}</Text>
            <Text style={styles.overviewLabel}>Điểm TB</Text>
          </View>
          <View style={styles.overviewCard}>
            <Text style={[styles.overviewValue, { color: '#f59e0b' }]}>{latestConduct}</Text>
            <Text style={styles.overviewLabel}>Hạnh kiểm</Text>
          </View>
          <View style={styles.overviewCard}>
            <Text style={[styles.overviewValue, { color: '#ef4444' }]}>{absentDays}</Text>
            <Text style={styles.overviewLabel}>Ngày nghỉ</Text>
          </View>
        </View>
      </View>

      {/* Lịch học hôm nay */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lịch học hôm nay ({getDayName(todayThu)})</Text>
        <View style={styles.card}>
          {todaySchedule.length === 0 ? (
             <Text style={{ textAlign: 'center', color: '#64748b', padding: 10 }}>Không có lịch học hôm nay.</Text>
          ) : (
            todaySchedule.map((item: any, index: number) => (
              <React.Fragment key={item.id}>
                <View style={styles.scheduleItem}>
                  <View style={styles.timeBlock}>
                    <Text style={styles.periodText}>Tiết {item.tietBatDau}</Text>
                    {item.soTiet > 1 && <Text style={{fontSize: 10, color: '#94a3b8'}}>(Đến tiết {item.tietBatDau + item.soTiet - 1})</Text>}
                  </View>
                  <View style={styles.scheduleInfo}>
                    <Text style={styles.subjectText}>{item.monHoc?.tenMon || 'Sinh hoạt'}</Text>
                    {item.giaoVien && <Text style={styles.teacherText}>GV: {item.giaoVien.hoTen}</Text>}
                  </View>
                </View>
                {index < todaySchedule.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            ))
          )}
        </View>
      </View>
      </ScrollView>
      {/* Chat FAB */}
      <TouchableOpacity 
        style={styles.chatFab}
        onPress={() => router.push('/(parent)/chat')}
      >
        <Ionicons name="chatbubble-ellipses" size={24} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 80, // Extra padding for FAB
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  childInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0e7ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4f46e5',
  },
  childName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  childClass: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 12,
  },
  overviewGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  overviewCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  overviewValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10b981',
  },
  overviewLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeBlock: {
    width: 60,
    alignItems: 'center',
    borderRightWidth: 2,
    borderRightColor: '#e2e8f0',
    paddingRight: 12,
    marginRight: 12,
  },
  timeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  periodText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  scheduleInfo: {
    flex: 1,
  },
  subjectText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  teacherText: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 12,
  },
  chatFab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
});
