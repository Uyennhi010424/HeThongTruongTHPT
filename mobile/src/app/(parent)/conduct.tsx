import React from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useParentStore } from '../../store/useParentStore';

const formatConduct = (val: string) => {
  if (val === 'TOT') return 'Tốt';
  if (val === 'KHA') return 'Khá';
  if (val === 'TRUNG_BINH') return 'Trung bình';
  if (val === 'YEU') return 'Yếu';
  return val;
};

export default function ParentConduct() {
  const { dashboardData, selectedChild } = useParentStore();

  if (!selectedChild || !dashboardData) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={{ marginTop: 12, color: '#64748b' }}>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  const conducts = dashboardData.conducts || [];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.list}>
        {conducts.length === 0 ? (
          <Text style={{ textAlign: 'center', color: '#64748b', marginTop: 20 }}>Chưa có đánh giá hạnh kiểm.</Text>
        ) : (
          conducts.map((record: any) => (
            <View key={record.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.dateText}>
                  {record.ngayDanhGia ? new Date(record.ngayDanhGia).toLocaleDateString('vi-VN') : `Học kỳ ${record.hocKy || ''}`}
                </Text>
                <Text style={[styles.typeBadge, record.xepLoai === 'YEU' || record.xepLoai === 'TRUNG_BINH' ? styles.typeDiscipline : styles.typeAttendance]}>
                  {formatConduct(record.xepLoai)}
                </Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.contentText}>{record.nhanXet || 'Không có nhận xét'}</Text>
                {record.giaoVien && <Text style={styles.teacherText}>Giáo viên đánh giá: {record.giaoVien.hoTen}</Text>}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  list: {
    padding: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dateText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#334155',
  },
  typeBadge: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  typeDiscipline: {
    color: '#ef4444',
    backgroundColor: '#fee2e2',
  },
  typeAttendance: {
    color: '#f59e0b',
    backgroundColor: '#fef3c7',
  },
  cardBody: {
    padding: 16,
  },
  contentText: {
    fontSize: 16,
    color: '#0f172a',
    marginBottom: 8,
  },
  teacherText: {
    fontSize: 13,
    color: '#64748b',
  },
  feedbackSection: {
    padding: 16,
    backgroundColor: '#fafaf9',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  feedbackLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  sendBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  sendBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
