import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Calendar as CalendarIcon, AlertCircle, CheckCircle2, XCircle, ChevronDown, Check } from 'lucide-react-native';
import { useRouter } from 'expo-router';
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

export default function AttendanceScreen() {
  const router = useRouter();
  const { data } = useDashboardStore();
  const student = data?.student;
  const allScores = data?.scores || [];

  const currentStudentNamHoc = data?.student?.lop?.namHoc || '2026-2027';

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
    return arr.length > 0 ? arr : ['2026-2027', '2025-2026'];
  }, [allScores, currentStudentNamHoc]);

  const [selectedYear, setSelectedYear] = useState<string>(availableYears[0] || '2026-2027');
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

  const onRefresh = () => {
    setRefreshing(true);
    fetchAttendance(selectedYear);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const [y, m, d] = dateString.split('-');
    return `${d}/${m}/${y}`;
  };

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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chuyên cần</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Year Selector */}
      <View style={styles.filterWrapper}>
        <TouchableOpacity 
          style={styles.yearSelectorBtn} 
          onPress={() => setShowYearModal(true)}
          activeOpacity={0.8}
        >
          <CalendarIcon size={18} color="#2563EB" />
          <Text style={styles.yearSelectorText}>Năm học: {selectedYear}</Text>
          <ChevronDown size={16} color="#64748B" />
        </TouchableOpacity>
      </View>

      {/* Year Selection Modal */}
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
          {renderStatsCard()}
          {renderHistoryList()}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
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
    padding: 20,
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
    marginBottom: 24,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  titleWrapper: {
    flex: 1,
    marginRight: 12,
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
    gap: 16,
  },
  statBox: {
    flex: 1,
    minWidth: '40%',
    alignItems: 'center',
    padding: 12,
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
    padding: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
    marginTop: 16,
    marginBottom: 8,
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
    padding: 20,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 16,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  historyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  historyContent: {
    flex: 1,
  },
  historyDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  historyType: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  historyNote: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  filterWrapper: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  yearSelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  yearSelectorText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1D4ED8',
    flex: 1,
    marginLeft: 8,
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
