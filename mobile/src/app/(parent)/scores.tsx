import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useParentStore } from '../../store/useParentStore';

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

export default function ParentScores() {
  const { dashboardData, selectedChild } = useParentStore();
  const [filter, setFilter] = useState<FilterType>(1);

  if (!selectedChild || !dashboardData) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={{ marginTop: 12, color: '#64748b' }}>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  const subjects = dashboardData?.subjects || [];
  const allScores = dashboardData?.scores || [];

  const renderSemesterView = () => {
    const enrichedSubjects = subjects.map((subject: any) => {
      const subjectScores = allScores.filter((s: any) => s.monHoc?.id === subject.id && s.hocKy === filter);
      const isEval = subjectScores.some((s: any) => s.nhanXet === 'DAT' || s.nhanXet === 'CHUA_DAT');
      return { ...subject, subjectScores, isEval };
    }).filter(s => s.subjectScores.length > 0);

    // Sort: Graded first, Evaluated bottom
    enrichedSubjects.sort((a, b) => (a.isEval === b.isEval ? 0 : a.isEval ? 1 : -1));

    if (enrichedSubjects.length === 0) {
      return <Text style={{ textAlign: 'center', color: '#64748b', marginTop: 20 }}>Chưa có điểm.</Text>;
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
      const subjectScores = allScores.filter((s: any) => s.monHoc?.id === subject.id);
      const isEval = subjectScores.some((s: any) => s.nhanXet === 'DAT' || s.nhanXet === 'CHUA_DAT');
      return { ...subject, subjectScores, isEval };
    }).filter(s => s.subjectScores.length > 0);

    // Sort: Graded first, Evaluated bottom
    enrichedSubjects.sort((a, b) => (a.isEval === b.isEval ? 0 : a.isEval ? 1 : -1));

    if (enrichedSubjects.length === 0) {
      return <Text style={{ textAlign: 'center', color: '#64748b', marginTop: 20 }}>Chưa có điểm.</Text>;
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
    <View style={styles.container}>
      <View style={styles.filterWrapper}>
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

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {filter === 'CA_NAM' ? renderYearView() : renderSemesterView()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  filterWrapper: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
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
});
