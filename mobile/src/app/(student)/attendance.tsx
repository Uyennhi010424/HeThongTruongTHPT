import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl, Modal, Pressable } from 'react-native';
import { 
  Calendar as CalendarIcon, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  ChevronDown, 
  Check, 
  FileText, 
  User 
} from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import axiosClient from '../../api/axiosClient';
import { useDashboardStore } from '../../store/useDashboardStore';

interface AttendanceStats {
  tongNgayHoc: number;
  coMat: number;
  coPhep: number;
  khongPhep: number;
  tyLeChuyenCan: number;
  details: Array<{
    ngayDiemDanh: string;
    trangThai: string;
    ghiChu: string;
  }>;
}

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

export default function AttendanceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const { data, refreshData } = useDashboardStore();
  const student = data?.student;
  const allScores = data?.scores || [];

  const [activeTab, setActiveTab] = useState<'DIEM_DANH' | 'HANH_KIEM'>(
    params.tab === 'hanhkiem' ? 'HANH_KIEM' : 'DIEM_DANH'
  );

  useEffect(() => {
    if (params.tab === 'hanhkiem') {
      setActiveTab('HANH_KIEM');
    }
  }, [params.tab]);

  const currentStudentNamHoc = data?.student?.lop?.namHoc || '2025-2026';

  const availableYears = useMemo(() => {
    const yearsSet = new Set<string>();
    if (currentStudentNamHoc) yearsSet.add(currentStudentNamHoc);
    allScores.forEach((s: any) => {
      if (s.namHoc) yearsSet.add(s.namHoc);
    });
    const arr = Array.from(yearsSet).sort((a, b) => {
      const yA = Number(a.match(/(\d{4})/)?.[1] || 0);
      const yB = Number(b.match(/(\d{4})/)?.[1] || 0);
      return yB - yA;
    });
    return arr.length > 0 ? arr : [currentStudentNamHoc];
  }, [allScores, currentStudentNamHoc]);

  const [selectedYear, setSelectedYear] = useState<string>(availableYears[0] || currentStudentNamHoc);
  const [showYearModal, setShowYearModal] = useState(false);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAttendance = async (yearStr?: string) => {
    if (!student?.id) return;
    try {
      setError(null);
      const targetYear = yearStr || selectedYear;
      const match = targetYear.match(/(\d{4})-(\d{4})/);
      const startYear = match ? Number(match[1]) : 2026;
      const from = `${startYear}-09-01`;
      const to = `${startYear + 1}-06-30`;

      const response = await axiosClient.get('/diemdanh/statistics/student', {
        params: {
          hocSinhId: student.id,
          from,
          to
        }
      });
      
      if (response.data && response.data.data) {
        const d = response.data.data;
        setStats({
          tongNgayHoc: d.tongNgayHoc ?? d.totalDays ?? 0,
          coMat: d.coMat ?? d.present ?? 0,
          coPhep: d.coPhep ?? d.excusedAbsent ?? 0,
          khongPhep: d.khongPhep ?? d.unexcusedAbsent ?? 0,
          tyLeChuyenCan: d.tyLeChuyenCan ?? 100.0,
          details: Array.isArray(d.details) ? d.details : [],
        });
      }
    } catch (err: any) {
      console.log(err);
      setError('Không thể tải dữ liệu điểm danh. Vui lòng thử lại.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (student?.id) {
      fetchAttendance(selectedYear);
    } else {
      setLoading(false);
      setError('Không tìm thấy thông tin học sinh.');
    }
  }, [student?.id, selectedYear]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchAttendance(selectedYear),
      refreshData()
    ]);
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const [y, m, d] = dateString.split('-');
    return `${d}/${m}/${y}`;
  };

  const groupedConducts = useMemo(() => {
    const conducts = data?.conducts || [];
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
  }, [data?.conducts]);

  const renderStatsCard = () => {
    if (!stats) return null;
    
    return (
      <View style={styles.statsCard}>
        <View style={styles.statsHeader}>
          <View style={styles.titleWrapper}>
            <Text style={styles.statsTitle}>Tổng quan chuyên cần</Text>
            <Text style={styles.statsSubtitle}>Năm học {selectedYear}</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <CalendarIcon size={24} color="#3B82F6" />
            <Text style={styles.statNumber}>{stats.tongNgayHoc}</Text>
            <Text style={styles.statDesc}>Ngày học</Text>
          </View>
          <View style={styles.statBox}>
            <CheckCircle2 size={24} color="#10B981" />
            <Text style={styles.statNumber}>{stats.coMat}</Text>
            <Text style={styles.statDesc}>Có mặt</Text>
          </View>
          <View style={styles.statBox}>
            <AlertCircle size={24} color="#F59E0B" />
            <Text style={styles.statNumber}>{stats.coPhep}</Text>
            <Text style={styles.statDesc}>Có phép</Text>
          </View>
          <View style={styles.statBox}>
            <XCircle size={24} color="#EF4444" />
            <Text style={styles.statNumber}>{stats.khongPhep}</Text>
            <Text style={styles.statDesc}>Không phép</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderHistoryList = () => {
    if (!stats || !stats.details || stats.details.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <CheckCircle2 size={48} color="#10B981" />
          <Text style={styles.emptyTitle}>Rất tốt!</Text>
          <Text style={styles.emptyDesc}>Chưa có ngày nào bị ghi nhận vắng trong năm học {selectedYear}.</Text>
        </View>
      );
    }

    return (
      <View style={styles.historyContainer}>
        <Text style={styles.historyTitle}>Chi tiết ngày vắng ({stats.details.length})</Text>
        {stats.details.map((item, index) => (
          <View key={index} style={styles.historyItem}>
            <View style={[styles.historyIcon, { backgroundColor: item.trangThai === 'CO_PHEP' ? '#FEF3C7' : '#FEE2E2' }]}>
              {item.trangThai === 'CO_PHEP' ? (
                <AlertCircle size={24} color="#F59E0B" />
              ) : (
                <XCircle size={24} color="#EF4444" />
              )}
            </View>
            <View style={styles.historyContent}>
              <Text style={styles.historyDate}>Ngày {formatDate(item.ngayDiemDanh)}</Text>
              <Text style={[styles.historyType, { color: item.trangThai === 'CO_PHEP' ? '#D97706' : '#DC2626' }]}>
                {item.trangThai === 'CO_PHEP' ? 'Vắng có phép' : 'Vắng không phép'}
              </Text>
              {item.ghiChu ? (
                <Text style={styles.historyNote}>Lý do: {item.ghiChu}</Text>
              ) : null}
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderConductTab = () => {
    return (
      <View style={styles.conductWrapper}>
        {groupedConducts.length === 0 ? (
          <View style={styles.emptyConductContainer}>
            <FileText size={48} color="#94A3B8" />
            <Text style={styles.emptyConductTitle}>Chưa có dữ liệu đánh giá hạnh kiểm</Text>
            <Text style={styles.emptyConductDesc}>
              Kết quả hạnh kiểm sẽ được giáo viên chủ nhiệm cập nhật sau mỗi đợt sơ kết học kỳ hoặc tổng kết năm học.
            </Text>
          </View>
        ) : (
          groupedConducts.map((group) => (
            <View key={group.year} style={styles.yearSection}>
              <View style={styles.yearHeader}>
                <View style={styles.yearHeaderLeft}>
                  <CalendarIcon size={18} color="#1D4ED8" />
                  <Text style={styles.yearTitle}>Năm học {group.year}</Text>
                </View>
                <View style={styles.yearBadge}>
                  <Text style={styles.yearBadgeText}>{group.records.length} kỳ đánh giá</Text>
                </View>
              </View>

              {group.records.map((record: any) => {
                const badgeStyle = getConductBadgeStyle(record.xepLoai);
                return (
                  <View key={record.id || `${group.year}-${record.hocKy}`} style={styles.conductCard}>
                    <View style={styles.conductCardHeader}>
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

                    <View style={styles.conductCardBody}>
                      <Text style={styles.commentLabel}>Nhận xét của giáo viên:</Text>
                      <Text style={styles.contentText}>
                        {record.nhanXet && record.nhanXet.trim() !== ''
                          ? record.nhanXet
                          : 'Chưa có nhận xét chi tiết.'}
                      </Text>

                      {record.giaoVien && (
                        <View style={styles.teacherRow}>
                          <User size={14} color="#64748B" />
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
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.topTabs}>
        <TouchableOpacity
          style={[styles.topTabBtn, activeTab === 'DIEM_DANH' && styles.topTabBtnActive]}
          onPress={() => setActiveTab('DIEM_DANH')}
        >
          <Text style={[styles.topTabText, activeTab === 'DIEM_DANH' && styles.topTabTextActive]}>
            Điểm danh
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.topTabBtn, activeTab === 'HANH_KIEM' && styles.topTabBtnActive]}
          onPress={() => setActiveTab('HANH_KIEM')}
        >
          <Text style={[styles.topTabText, activeTab === 'HANH_KIEM' && styles.topTabTextActive]}>
            Hạnh kiểm
          </Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showYearModal} transparent={true} animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowYearModal(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Chọn năm học</Text>
            {availableYears.map((year) => (
              <TouchableOpacity 
                key={year} 
                style={styles.modalOptionRow} 
                onPress={() => { setSelectedYear(year); setShowYearModal(false); }}
              >
                <Text style={[styles.modalOptionText, selectedYear === year && styles.modalOptionTextActive]}>
                  Năm học {year}
                </Text>
                {selectedYear === year && <Check size={20} color="#2563EB" />}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchAttendance(selectedYear)}>
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
          {activeTab === 'DIEM_DANH' ? (
            <>
              <View style={styles.filterWrapper}>
                <TouchableOpacity 
                  style={styles.yearSelectorBtn} 
                  onPress={() => setShowYearModal(true)}
                  activeOpacity={0.8}
                >
                  <CalendarIcon size={18} color="#2563EB" />
                  <Text style={styles.yearSelectorText}>Năm học: {selectedYear}</Text>
                  <ChevronDown size={16} color="#64748B" style={{ marginLeft: 'auto' }} />
                </TouchableOpacity>
              </View>

              {renderStatsCard()}
              {renderHistoryList()}
            </>
          ) : (
            renderConductTab()
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topTabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  topTabBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  topTabBtnActive: {
    borderBottomColor: '#2563EB',
  },
  topTabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },
  topTabTextActive: {
    color: '#2563EB',
    fontWeight: 'bold',
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
    paddingBottom: 32,
  },
  filterWrapper: {
    marginBottom: 16,
  },
  yearSelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  yearSelectorText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E3A8A',
    marginLeft: 8,
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  titleWrapper: {
    flex: 1,
  },
  statsTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  statsSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statBox: {
    flex: 1,
    minWidth: '40%',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: 8,
    marginBottom: 4,
  },
  statDesc: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 36,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
    marginTop: 14,
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  historyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  historyTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 14,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  historyIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  historyContent: {
    flex: 1,
  },
  historyDate: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 3,
  },
  historyType: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 3,
  },
  historyNote: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  conductWrapper: {
    flex: 1,
  },
  yearSection: {
    marginBottom: 16,
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
    color: '#1E3A8A',
  },
  yearBadge: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  yearBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3730A3',
  },
  conductCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    overflow: 'hidden',
  },
  conductCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  semesterBox: {
    flexDirection: 'column',
  },
  semesterTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  dateText: {
    fontSize: 12,
    color: '#64748B',
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
  conductCardBody: {
    padding: 16,
  },
  commentLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  contentText: {
    fontSize: 14,
    color: '#1E293B',
    lineHeight: 20,
    marginBottom: 12,
  },
  teacherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  teacherText: {
    fontSize: 12,
    color: '#64748B',
  },
  emptyConductContainer: {
    padding: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyConductTitle: {
    marginTop: 14,
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
  },
  emptyConductDesc: {
    marginTop: 6,
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 290,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#475569',
  },
  modalOptionTextActive: {
    color: '#2563EB',
    fontWeight: 'bold',
  },
});
