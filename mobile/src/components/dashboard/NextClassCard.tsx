import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Clock, MapPin, ChevronRight, Book, User } from 'lucide-react-native';
import { TimetableEntry } from '../../models/dashboard.type';
import { useRouter } from 'expo-router';

interface NextClassCardProps {
  timetable: TimetableEntry[];
  studentClass?: string;
}

const getTietTimeStr = (tietBatDau: number, soTiet: number = 1) => {
  const times: Record<number, string> = {
    1: '07:00 - 07:45',
    2: '07:50 - 08:35',
    3: '08:50 - 09:35',
    4: '09:40 - 10:25',
    5: '10:30 - 11:15',
    6: '13:00 - 13:45',
    7: '13:50 - 14:35',
    8: '14:50 - 15:35',
    9: '15:40 - 16:25',
    10: '16:30 - 17:15',
  };
  const startStr = times[tietBatDau]?.split(' - ')[0] || '07:00';
  const endTiet = tietBatDau + Math.max(1, soTiet) - 1;
  const endStr = times[endTiet]?.split(' - ')[1] || '11:15';
  return `${startStr} - ${endStr}`;
};

export const NextClassCard: React.FC<NextClassCardProps> = ({ timetable, studentClass }) => {
  const router = useRouter();

  const { todayClasses } = useMemo(() => {
    const now = new Date();
    // Thu 2 -> 2, Thu 3 -> 3 ... Chu Nhat -> 8
    let currentDay = now.getDay() + 1; // 0=Sun->1, 1=Mon->2
    if (currentDay === 1) currentDay = 8;

    if (!timetable || timetable.length === 0) {
      return {
        todayClasses: [],
      };
    }

    const filtered = timetable
      .filter((t) => t.thu === currentDay)
      .sort((a, b) => a.tietBatDau - b.tietBatDau);

    return {
      todayClasses: filtered,
    };
  }, [timetable]);

  const renderContent = () => {
    if (todayClasses.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Hôm nay không có tiết học.</Text>
        </View>
      );
    }

    return (
      <View style={styles.classList}>
        {todayClasses.map((item, index) => {
          const rawRoom = studentClass || (item as any).lop?.tenLop || item.phongHoc || '';
          const room = rawRoom.replace(/^Phòng\s*/i, '').replace(/^P\.\s*/i, '') || 'Chưa xếp';
          const isLast = index === todayClasses.length - 1;

          return (
            <View
              key={item.id || `${item.thu}-${item.tietBatDau}-${index}`}
              style={[styles.classItem, !isLast && styles.classItemBorder]}
            >
              <View style={styles.classHeader}>
                <View style={styles.subjectTag}>
                  <Book size={14} color="#2563EB" />
                  <Text style={styles.subjectText}>
                    {item.monHoc?.tenMon || item.monHoc?.tenMonHoc || 'Môn học'}
                  </Text>
                </View>
                <View style={styles.tietBadge}>
                  <Text style={styles.tietText}>
                    Tiết {item.tietBatDau}
                    {item.soTiet > 1 ? ` - ${item.tietBatDau + item.soTiet - 1}` : ''}
                  </Text>
                </View>
              </View>

              <View style={styles.classTeacher}>
                <User size={15} color="#6B7280" />
                <Text style={styles.teacherText}>
                  GV: {item.giaoVien?.hoTen || 'Đang cập nhật'}
                </Text>
              </View>

              <View style={styles.classDetails}>
                <View style={styles.classDetailRow}>
                  <Clock size={15} color="#6B7280" />
                  <Text style={styles.classDetailText}>
                    {getTietTimeStr(item.tietBatDau, item.soTiet || 1)}
                  </Text>
                </View>
                <View style={styles.classDetailRow}>
                  <MapPin size={15} color="#6B7280" />
                  <Text style={styles.classDetailText}>Phòng {room}</Text>
                </View>
              </View>

              {item.ghiChu ? (
                <View style={styles.noteContainer}>
                  <Text style={styles.noteText}>📌 {item.ghiChu}</Text>
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.titleRow}>
          <Text style={styles.sectionTitle}>Lịch học hôm nay</Text>
          {todayClasses.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{todayClasses.length} tiết</Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={styles.seeMoreBtn}
          onPress={() => router.push('/(student)/calendar' as any)}
          activeOpacity={0.7}
        >
          <Text style={styles.seeMoreText}>Xem TKB</Text>
          <ChevronRight size={16} color="#2563EB" />
        </TouchableOpacity>
      </View>
      <View style={styles.card}>{renderContent()}</View>
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  countBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  countText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
  },
  seeMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeMoreText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
    marginRight: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  emptyContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  classList: {
    flexDirection: 'column',
  },
  classItem: {
    paddingVertical: 12,
  },
  classItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  subjectTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  subjectText: {
    color: '#1D4ED8',
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 14,
  },
  tietBadge: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tietText: {
    color: '#EF4444',
    fontWeight: 'bold',
    fontSize: 13,
  },
  classTeacher: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  teacherText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 6,
    fontWeight: '500',
  },
  classDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 2,
  },
  classDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  classDetailText: {
    marginLeft: 6,
    color: '#6B7280',
    fontSize: 13,
  },
  noteContainer: {
    marginTop: 8,
    flexDirection: 'row',
  },
  noteText: {
    fontSize: 12,
    color: '#D97706',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
    fontWeight: '500',
  },
});
