import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Calendar as CalendarIcon, ChevronDown, Check } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useDashboardStore } from '../../store/useDashboardStore';

type FilterType = 1 | 2 | 'CA_NAM';

const calculateTBM = (scores: any[]) => {
  if (!scores || scores.length === 0) return null;
  const tx = scores.filter(s => s.loaiDiem === 'TX').map(s => s.giaTriDiem);
  const gk = scores.filter(s => s.loaiDiem === 'GK').map(s => s.giaTriDiem);
  const ck = scores.filter(s => s.loaiDiem === 'CK').map(s => s.giaTriDiem);

  let totalWeight = 0;
  let totalScore = 0;

  tx.forEach(s => { totalScore += s; totalWeight += 1; });
  gk.forEach(s => { totalScore += s * 2; totalWeight += 2; });
  ck.forEach(s => { totalScore += s * 3; totalWeight += 3; });

  if (totalWeight === 0) return null;
  return (totalScore / totalWeight).toFixed(1);
};

export default function ScoresScreen() {
  const router = useRouter();
  const { data } = useDashboardStore();
  const [filter, setFilter] = useState<FilterType>(1);
  const [showYearModal, setShowYearModal] = useState(false);

  const subjects = data?.subjects || [];
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

  useEffect(() => {
    if (availableYears.length > 0 && !availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0]);
    }
  }, [availableYears]);

  const yearScores = useMemo(() => {
    return allScores.filter((s: any) => !s.namHoc || s.namHoc === selectedYear);
  }, [allScores, selectedYear]);

  const renderSemesterView = () => {
    const enrichedSubjects = subjects.map((subject: any) => {
      const subjectScores = yearScores.filter((s: any) => s.monHoc?.id === subject.id && s.hocKy === filter);
      const isEval = subjectScores.some((s: any) => s.nhanXet === 'DAT' || s.nhanXet === 'CHUA_DAT');
      return { ...subject, subjectScores, isEval };
    }).filter(s => s.subjectScores.length > 0);

    // Sort: Graded first, Evaluated bottom
    enrichedSubjects.sort((a, b) => (a.isEval === b.isEval ? 0 : a.isEval ? 1 : -1));

    if (enrichedSubjects.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Chưa có điểm cho HK{filter} - Năm học {selectedYear}.</Text>
        </View>
      );
    }

    return enrichedSubjects.map((data: any) => {
      const subject = data;
      const subjectScores = data.subjectScores;

      if (data.isEval) {
        const latestNhanXet = subjectScores[subjectScores.length - 1]?.nhanXet === 'DAT' ? 'ĐẠT' : 'CHƯA ĐẠT';
        const badgeColor = latestNhanXet === 'ĐẠT' ? '#10B981' : '#EF4444';
        return (
          <View key={subject.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.subjectName}>{subject.tenMon}</Text>
              <View style={[styles.tbmBadge, { backgroundColor: badgeColor }]}>
                <Text style={styles.tbmValue}>{latestNhanXet}</Text>
              </View>
            </View>
            <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.colHeader}>Nhận xét</Text>
              <Text style={[styles.colValue, { color: badgeColor }]}>{latestNhanXet}</Text>
            </View>
          </View>
        );
      }

      const tx = subjectScores.filter((s: any) => s.loaiDiem === 'TX').map((s: any) => s.giaTriDiem).join(', ');
      const gk = subjectScores.filter((s: any) => s.loaiDiem === 'GK').map((s: any) => s.giaTriDiem).join(', ');
      const ck = subjectScores.filter((s: any) => s.loaiDiem === 'CK').map((s: any) => s.giaTriDiem).join(', ');
      const tbm = calculateTBM(subjectScores) || '--';

      return (
        <View key={subject.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.subjectName}>{subject.tenMon}</Text>
            <View style={styles.tbmBadge}>
              <Text style={styles.tbmValue}>{tbm}</Text>
            </View>
          </View>
          
          <View style={styles.tableRow}>
            <Text style={styles.colHeader}>Thường xuyên (TX)</Text>
            <Text style={styles.colValue}>{tx || '--'}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.colHeader}>Giữa kỳ (GK)</Text>
            <Text style={styles.colValue}>{gk || '--'}</Text>
          </View>
          <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.colHeader}>Cuối kỳ (CK)</Text>
            <Text style={styles.colValue}>{ck || '--'}</Text>
          </View>
        </View>
      );
    });
  };

  const renderYearView = () => {
    const enrichedSubjects = subjects.map((subject: any) => {
      const subjectScores = yearScores.filter((s: any) => s.monHoc?.id === subject.id);
      const isEval = subjectScores.some((s: any) => s.nhanXet === 'DAT' || s.nhanXet === 'CHUA_DAT');
      return { ...subject, subjectScores, isEval };
    }).filter(s => s.subjectScores.length > 0);

    // Sort: Graded first, Evaluated bottom
    enrichedSubjects.sort((a, b) => (a.isEval === b.isEval ? 0 : a.isEval ? 1 : -1));

    if (enrichedSubjects.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Chưa có điểm cho cả năm - Năm học {selectedYear}.</Text>
        </View>
      );
    }

    return enrichedSubjects.map((data: any) => {
      const subject = data;
      const subjectScores = data.subjectScores;

      const hk1 = subjectScores.filter((s: any) => s.hocKy === 1);
      const hk2 = subjectScores.filter((s: any) => s.hocKy === 2);
      
      if (data.isEval) {
        const nx1 = hk1[hk1.length - 1]?.nhanXet === 'DAT' ? 'ĐẠT' : (hk1.length > 0 ? 'CHƯA ĐẠT' : '--');
        const nx2 = hk2[hk2.length - 1]?.nhanXet === 'DAT' ? 'ĐẠT' : (hk2.length > 0 ? 'CHƯA ĐẠT' : '--');
        const nxCN = nx2 !== '--' ? nx2 : nx1;
        const badgeColor = nxCN === 'ĐẠT' ? '#10B981' : (nxCN === 'CHƯA ĐẠT' ? '#EF4444' : '#64748B');

        return (
          <View key={subject.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.subjectName}>{subject.tenMon}</Text>
              <View style={[styles.tbmBadge, { backgroundColor: badgeColor }]}>
                <Text style={styles.tbmValue}>{nxCN}</Text>
              </View>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.colHeader}>Nhận xét HK1</Text>
              <Text style={[styles.colValue, { color: nx1 === 'ĐẠT' ? '#10B981' : (nx1 === 'CHƯA ĐẠT' ? '#EF4444' : '#64748B') }]}>{nx1}</Text>
            </View>
            <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.colHeader}>Nhận xét HK2</Text>
              <Text style={[styles.colValue, { color: nx2 === 'ĐẠT' ? '#10B981' : (nx2 === 'CHƯA ĐẠT' ? '#EF4444' : '#64748B') }]}>{nx2}</Text>
            </View>
          </View>
        );
      }

      const tbm1 = calculateTBM(hk1);
      const tbm2 = calculateTBM(hk2);
      
      let tbmCN = '--';
      if (tbm1 && tbm2) {
        tbmCN = ((parseFloat(tbm1) + parseFloat(tbm2) * 2) / 3).toFixed(1);
      } else if (tbm1) {
        tbmCN = tbm1; // Tạm tính bằng HK1 nếu chưa có HK2
      } else if (tbm2) {
        tbmCN = tbm2;
      }

      return (
        <View key={subject.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.subjectName}>{subject.tenMon}</Text>
            <View style={styles.tbmBadge}>
              <Text style={styles.tbmValue}>{tbmCN}</Text>
            </View>
          </View>
          
          <View style={styles.tableRow}>
            <Text style={styles.colHeader}>Điểm TBM HK1</Text>
            <Text style={styles.colValue}>{tbm1 || '--'}</Text>
          </View>
          <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.colHeader}>Điểm TBM HK2</Text>
            <Text style={styles.colValue}>{tbm2 || '--'}</Text>
          </View>
        </View>
      );
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kết quả học tập</Text>
      </View>

      {/* Year & Semester Filter */}
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

        <View style={styles.filterContainer}>
          <TouchableOpacity 
            style={[styles.filterBtn, filter === 1 && styles.filterBtnActive]}
            onPress={() => setFilter(1)}
          >
            <Text style={[styles.filterText, filter === 1 && styles.filterTextActive]}>Học kỳ 1</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterBtn, filter === 2 && styles.filterBtnActive]}
            onPress={() => setFilter(2)}
          >
            <Text style={[styles.filterText, filter === 2 && styles.filterTextActive]}>Học kỳ 2</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterBtn, filter === 'CA_NAM' && styles.filterBtnActive]}
            onPress={() => setFilter('CA_NAM')}
          >
            <Text style={[styles.filterText, filter === 'CA_NAM' && styles.filterTextActive]}>Cả năm</Text>
          </TouchableOpacity>
        </View>
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

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {filter === 'CA_NAM' ? renderYearView() : renderSemesterView()}
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  filterWrapper: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 12,
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
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  filterBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  filterTextActive: {
    color: '#2563EB',
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#64748B',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1D4ED8',
    flex: 1,
    flexShrink: 1,
    marginRight: 8,
  },
  tbmBadge: {
    backgroundColor: '#1D4ED8',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tbmValue: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  colHeader: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
  colValue: {
    fontSize: 15,
    color: '#0F172A',
    fontWeight: 'bold',
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
