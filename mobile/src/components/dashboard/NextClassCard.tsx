import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Clock, MapPin, ChevronRight, Book, User } from 'lucide-react-native';
import { DashboardData, TimetableEntry } from '../../models/dashboard.type';
import { useRouter } from 'expo-router';

interface NextClassCardProps {
  timetable: TimetableEntry[];
}

export const NextClassCard: React.FC<NextClassCardProps> = ({ timetable }) => {
  const router = useRouter();

  const nextClass = useMemo(() => {
    if (!timetable || timetable.length === 0) return null;
    
    const now = new Date();
    // Ngày bắt đầu năm học 2026-2027: 07/09/2026
    const schoolStartDate = new Date(2026, 8, 7, 0, 0, 0);
    if (now.getTime() < schoolStartDate.getTime()) {
      return 'NOT_STARTED_YET';
    }

    // Thu 2 -> 2, Thu 3 -> 3. JavaScript getDay(): 0 is Sunday, 1 is Monday.
    // In our system, Thu might be 2, 3, 4, 5, 6, 7, 8 (Sunday).
    let currentDay = now.getDay() + 1; // getDay: 0=Sun->1, 1=Mon->2. So Sun is 1, Mon is 2.
    if (currentDay === 1) currentDay = 8; // Adjust Sunday to 8 if system uses 8 for Sunday
    
    const todayClasses = timetable.filter(t => t.thu === currentDay);
    if (todayClasses.length === 0) return 'DAY_OFF';

    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTotalMinutes = currentHour * 60 + currentMinute;

    // Tiet 1: 7:00 -> 420
    // Tiet 2: 7:45 -> 465
    // Tiet 3: 8:40 -> 520
    // Tiet 4: 9:25 -> 565
    // Tiet 5: 10:10 -> 610
    // Afternoon: Tiet 6: 13:00 -> 780 ...
    const tietStartMinutes: Record<number, number> = {
      1: 420, 2: 465, 3: 520, 4: 565, 5: 610,
      6: 780, 7: 825, 8: 880, 9: 925, 10: 970
    };

    const upcomingClasses = todayClasses.filter(c => {
      const startMin = tietStartMinutes[c.tietBatDau] || 0;
      // Class duration is typically 45 mins. If current time is before the end of the class, it is ongoing/upcoming
      return startMin + c.soTiet * 45 > currentTotalMinutes; 
    });

    if (upcomingClasses.length === 0) return 'NO_MORE_CLASSES';

    // Sort by tietBatDau
    upcomingClasses.sort((a, b) => a.tietBatDau - b.tietBatDau);
    return upcomingClasses[0];
  }, [timetable]);

  const getTietTimeStr = (tiet: number) => {
    const times: Record<number, string> = {
      1: '07:00 - 07:45',
      2: '07:45 - 08:30',
      3: '08:40 - 09:25',
      4: '09:25 - 10:10',
      5: '10:10 - 10:55',
      6: '13:00 - 13:45',
      7: '13:45 - 14:30',
      8: '14:40 - 15:25',
      9: '15:25 - 16:10',
      10: '16:10 - 16:55'
    };
    return times[tiet] || `Tiết ${tiet}`;
  };

  const renderContent = () => {
    if (nextClass === 'NOT_STARTED_YET') {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Năm học mới bắt đầu từ 07/09/2026. Chưa có tiết học.</Text>
        </View>
      );
    }

    if (nextClass === 'DAY_OFF') {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Hôm nay nghỉ học.</Text>
        </View>
      );
    }
    
    if (nextClass === 'NO_MORE_CLASSES') {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Hôm nay không còn tiết học.</Text>
        </View>
      );
    }

    if (!nextClass) return null;

    const classData = nextClass as TimetableEntry;

    return (
      <TouchableOpacity 
        style={styles.nextClassContainer}
        onPress={() => router.push('/(student)/calendar' as any)}
        activeOpacity={0.8}
      >
        <View style={styles.nextClassHeader}>
          <View style={styles.subjectTag}>
            <Book size={14} color="#2563EB" />
            <Text style={styles.subjectText}>{classData.monHoc?.tenMon || classData.monHoc?.tenMonHoc || 'Môn học'}</Text>
          </View>
          <Text style={styles.tietText}>Tiết {classData.tietBatDau}</Text>
        </View>
        <View style={styles.nextClassTeacher}>
          <User size={16} color="#6B7280" />
          <Text style={styles.teacherText}>GV: {classData.giaoVien?.hoTen || 'Đang cập nhật'}</Text>
        </View>
        <View style={styles.nextClassDetails}>
          <View style={styles.nextClassDetailRow}>
            <Clock size={16} color="#6B7280" />
            <Text style={styles.nextClassDetailText}>{getTietTimeStr(classData.tietBatDau)}</Text>
          </View>
          <View style={styles.nextClassDetailRow}>
            <MapPin size={16} color="#6B7280" />
            <Text style={styles.nextClassDetailText}>Phòng {classData.phongHoc || 'Chưa xếp'}</Text>
          </View>
        </View>
        {classData.ghiChu ? (
          <View style={{ marginTop: 12, flexDirection: 'row' }}>
            <Text style={{ fontSize: 13, color: '#D97706', backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, overflow: 'hidden', fontWeight: '500' }}>
              📌 {classData.ghiChu}
            </Text>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Lịch học hôm nay</Text>
        <TouchableOpacity style={styles.seeMoreBtn} onPress={() => router.push('/(student)/calendar' as any)}>
          <Text style={styles.seeMoreText}>Xem thời khóa biểu</Text>
          <ChevronRight size={16} color="#6B7280" />
        </TouchableOpacity>
      </View>
      <View style={styles.card}>
        {renderContent()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  seeMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeMoreText: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  nextClassContainer: {},
  nextClassHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subjectTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  subjectText: {
    color: '#1D4ED8',
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 15,
  },
  tietText: {
    color: '#EF4444',
    fontWeight: 'bold',
    fontSize: 14,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  nextClassTeacher: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  teacherText: {
    fontSize: 15,
    color: '#374151',
    marginLeft: 8,
    fontWeight: '500',
  },
  nextClassDetails: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  nextClassDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  nextClassDetailText: {
    marginLeft: 6,
    color: '#6B7280',
    fontSize: 14,
  },
});
