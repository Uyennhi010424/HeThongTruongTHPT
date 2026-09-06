import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { ShieldCheck, FileText, Calendar, User } from 'lucide-react-native';
import { useParentStore } from '../../store/useParentStore';

const formatConduct = (val: string) => {
  if (val === 'TOT') return 'Tốt';
  if (val === 'KHA') return 'Khá';
  if (val === 'TRUNG_BINH') return 'Trung bình';
  if (val === 'YEU') return 'Yếu';
  return val || '--';
};

const getConductBadgeStyle = (val: string) => {
  switch (val) {
    case 'TOT':
      return { color: '#16a34a', bg: '#dcfce7', border: '#bbf7d0' };
    case 'KHA':
      return { color: '#2563eb', bg: '#dbeafe', border: '#bfdbfe' };
    case 'TRUNG_BINH':
      return { color: '#d97706', bg: '#fef3c7', border: '#fde68a' };
    case 'YEU':
      return { color: '#dc2626', bg: '#fee2e2', border: '#fecaca' };
    default:
      return { color: '#64748b', bg: '#f1f5f9', border: '#e2e8f0' };
  }
};

export default function ParentConduct() {
  const { dashboardData, selectedChild } = useParentStore();

  const groupedConducts = useMemo(() => {
    const conducts = dashboardData?.conducts || [];
    if (!conducts || conducts.length === 0) return [];

    const groups: Record<string, any[]> = {};

    conducts.forEach((record: any) => {
      const yearName =
        record.namHoc?.tenNamHoc ||
        record.tenNamHoc ||
        (typeof record.namHoc === 'string' ? record.namHoc : '') ||
        'Năm học hiện tại';
      if (!groups[yearName]) {
        groups[yearName] = [];
      }
      groups[yearName].push(record);
    });

    const sortedYears = Object.keys(groups).sort((a, b) => b.localeCompare(a));

    return sortedYears.map((year) => ({
      year,
      records: groups[year].sort((a: any, b: any) => Number(b.hocKy || 0) - Number(a.hocKy || 0)),
    }));
  }, [dashboardData?.conducts]);

  if (!selectedChild || !dashboardData) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {/* Child Header banner */}
        <View style={styles.studentBanner}>
          <View style={styles.bannerIconBox}>
            <ShieldCheck size={24} color="#2563eb" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>Đánh giá hạnh kiểm & rèn luyện</Text>
            <Text style={styles.bannerSubtitle}>
              Học sinh: <Text style={{ fontWeight: 'bold', color: '#1e293b' }}>{selectedChild.hoTen}</Text> • Lớp:{' '}
              <Text style={{ fontWeight: 'bold', color: '#1e293b' }}>{selectedChild.lop?.tenLop || '--'}</Text>
            </Text>
          </View>
        </View>

        {groupedConducts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FileText size={48} color="#94a3b8" />
            <Text style={styles.emptyText}>Chưa có dữ liệu đánh giá hạnh kiểm.</Text>
          </View>
        ) : (
          groupedConducts.map((group) => (
            <View key={group.year} style={styles.yearSection}>
              {/* Year Section Header */}
              <View style={styles.yearHeader}>
                <View style={styles.yearHeaderLeft}>
                  <Calendar size={18} color="#1d4ed8" />
                  <Text style={styles.yearTitle}>Năm học {group.year}</Text>
                </View>
                <View style={styles.yearBadge}>
                  <Text style={styles.yearBadgeText}>{group.records.length} kỳ đánh giá</Text>
                </View>
              </View>

              {/* Records in Year */}
              {group.records.map((record: any) => {
                const badgeStyle = getConductBadgeStyle(record.xepLoai);
                return (
                  <View key={record.id || `${group.year}-${record.hocKy}`} style={styles.card}>
                    <View style={styles.cardHeader}>
                      <View style={styles.semesterBox}>
                        <Text style={styles.semesterTitle}>
                          {record.hocKy ? `Học kỳ ${record.hocKy}` : 'Cả năm'}
                        </Text>
                        {record.ngayDanhGia && (
                          <Text style={styles.dateText}>
                            {new Date(record.ngayDanhGia).toLocaleDateString('vi-VN')}
                          </Text>
                        )}
                      </View>
                      <View
                        style={[
                          styles.badge,
                          {
                            backgroundColor: badgeStyle.bg,
                            borderColor: badgeStyle.border,
                          },
                        ]}
                      >
                        <Text style={[styles.badgeText, { color: badgeStyle.color }]}>
                          {formatConduct(record.xepLoai)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.cardBody}>
                      <Text style={styles.commentLabel}>Nhận xét của giáo viên:</Text>
                      <Text style={styles.contentText}>
                        {record.nhanXet && record.nhanXet.trim() !== ''
                          ? record.nhanXet
                          : 'Chưa có nhận xét chi tiết.'}
                      </Text>

                      {record.giaoVien && (
                        <View style={styles.teacherRow}>
                          <User size={14} color="#64748b" />
                          <Text style={styles.teacherText}>
                            GV đánh giá: <Text style={{ fontWeight: '600', color: '#334155' }}>{record.giaoVien.hoTen}</Text>
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
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
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#64748b',
    fontSize: 14,
  },
  list: {
    padding: 16,
    paddingBottom: 32,
  },
  studentBanner: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  bannerIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 2,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: '#64748b',
  },
  yearSection: {
    marginBottom: 20,
  },
  yearHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  yearHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  yearTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  yearBadge: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  yearBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3730a3',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  semesterBox: {
    flexDirection: 'column',
  },
  semesterTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  dateText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  cardBody: {
    padding: 16,
  },
  commentLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  contentText: {
    fontSize: 14,
    color: '#1e293b',
    lineHeight: 20,
    marginBottom: 12,
  },
  teacherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  teacherText: {
    fontSize: 12,
    color: '#64748b',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
});
