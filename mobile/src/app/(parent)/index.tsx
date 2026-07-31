import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/useAuthStore';

export default function ParentDashboard() {
  const { signOut } = useAuthStore();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Profile & Logout */}
      <View style={styles.header}>
        <View style={styles.childInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>A</Text>
          </View>
          <View>
            <Text style={styles.childName}>Học sinh: Nguyễn Văn A</Text>
            <Text style={styles.childClass}>Lớp 10A1 - GVCN: Lê Thị B</Text>
          </View>
        </View>
        <TouchableOpacity onPress={signOut} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>

      {/* Tình hình học tập */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tổng quan học tập</Text>
        <View style={styles.overviewGrid}>
          <View style={styles.overviewCard}>
            <Text style={styles.overviewValue}>8.6</Text>
            <Text style={styles.overviewLabel}>Điểm TB</Text>
          </View>
          <View style={styles.overviewCard}>
            <Text style={[styles.overviewValue, { color: '#f59e0b' }]}>Tốt</Text>
            <Text style={styles.overviewLabel}>Hạnh kiểm</Text>
          </View>
          <View style={styles.overviewCard}>
            <Text style={[styles.overviewValue, { color: '#ef4444' }]}>2</Text>
            <Text style={styles.overviewLabel}>Ngày nghỉ</Text>
          </View>
        </View>
      </View>

      {/* Lịch học hôm nay */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lịch học hôm nay</Text>
        <View style={styles.card}>
          <View style={styles.scheduleItem}>
            <View style={styles.timeBlock}>
              <Text style={styles.timeText}>07:00</Text>
              <Text style={styles.periodText}>Tiết 1</Text>
            </View>
            <View style={styles.scheduleInfo}>
              <Text style={styles.subjectText}>Toán Học</Text>
              <Text style={styles.teacherText}>GV: Nguyễn Văn A</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.scheduleItem}>
            <View style={styles.timeBlock}>
              <Text style={styles.timeText}>07:50</Text>
              <Text style={styles.periodText}>Tiết 2</Text>
            </View>
            <View style={styles.scheduleInfo}>
              <Text style={styles.subjectText}>Ngữ Văn</Text>
              <Text style={styles.teacherText}>GV: Trần Thị B</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 20,
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
  logoutBtn: {
    padding: 8,
    backgroundColor: '#fee2e2',
    borderRadius: 12,
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
});
