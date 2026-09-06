import React, { useState, useMemo } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Calendar, Sun, User, MapPin, MessageSquare } from 'lucide-react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { useParentStore } from '../../store/useParentStore';
import { useRouter } from 'expo-router';
import { BASE_URL } from '@/constants/config';

const formatConduct = (val: string) => {
  if (val === 'TOT') return 'Tốt';
  if (val === 'KHA') return 'Khá';
  if (val === 'TRUNG_BINH') return 'Trung bình';
  if (val === 'YEU') return 'Yếu';
  return val || '--';
};

const getInitials = (name?: string) => {
  if (!name) return 'HS';
  const parts = name.trim().split(/\s+/);
  return parts[parts.length - 1].charAt(0).toUpperCase();
};

const PERIOD_TIMES: Record<number, string> = {
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

const getPeriodTime = (start: number, count: number = 1) => {
  const startStr = PERIOD_TIMES[start]?.split(' - ')[0] || '07:00';
  const endPeriod = start + Math.max(1, count) - 1;
  const endStr = PERIOD_TIMES[endPeriod]?.split(' - ')[1] || '11:15';
  return `${startStr} - ${endStr}`;
};

const WEEK_DAYS = [
  { thu: 2, label: 'Thứ 2', offset: 0 },
  { thu: 3, label: 'Thứ 3', offset: 1 },
  { thu: 4, label: 'Thứ 4', offset: 2 },
  { thu: 5, label: 'Thứ 5', offset: 3 },
  { thu: 6, label: 'Thứ 6', offset: 4 },
  { thu: 7, label: 'Thứ 7', offset: 5 },
  { thu: 8, label: 'Chủ nhật', offset: 6 },
];

export default function ParentDashboard() {
  const { selectedChild, dashboardData } = useParentStore();
  const router = useRouter();
  const [imgError, setImgError] = useState(false);

  const [showPreview, setShowPreview] = useState(false);

  // Calculate current week dates (Monday to Sunday)
  const { monday, sunday, weekRangeStr, todayThu, isNotStartedYet } = useMemo(() => {
    const now = new Date();
    const day = now.getDay(); // 0 is Sunday, 1 is Monday...
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const mon = new Date(now);
    mon.setDate(now.getDate() + diffToMonday);
    mon.setHours(0, 0, 0, 0);

    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    sun.setHours(23, 59, 59, 999);

    const formatShort = (d: Date) =>
      `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;

    const thu = day === 0 ? 8 : day + 1;

    // Ngày bắt đầu năm học 2026-2027: Thứ Hai, 07/09/2026
    const schoolStartDate = new Date(2026, 8, 7, 0, 0, 0);
    const notStarted = sun.getTime() < schoolStartDate.getTime();

    return {
      monday: mon,
      sunday: sun,
      weekRangeStr: `từ ${formatShort(mon)} đến ${formatShort(sun)}`,
      todayThu: thu,
      isNotStartedYet: notStarted,
    };
  }, []);

  // Group timetable by day of week
  const weekSchedule = useMemo(() => {
    const timetable = dashboardData?.timetable || [];
    const scheduleByDay: Record<number, any[]> = {};

    WEEK_DAYS.forEach((d) => {
      scheduleByDay[d.thu] = [];
    });

    timetable.forEach((item: any) => {
      const thu = Number(item.thu);
      if (scheduleByDay[thu]) {
        scheduleByDay[thu].push(item);
      }
    });

    return WEEK_DAYS.map((d) => {
      // Nếu là xem trước tuần 1 (07/09 - 13/09)
      const baseMonday = (isNotStartedYet && showPreview)
        ? new Date(2026, 8, 7, 0, 0, 0)
        : monday;

      const dayDate = new Date(baseMonday);
      dayDate.setDate(baseMonday.getDate() + d.offset);
      const dateFormatted = `${String(dayDate.getDate()).padStart(2, '0')}/${String(
        dayDate.getMonth() + 1
      ).padStart(2, '0')}`;

      // Trước ngày 07/09/2026 thì hoàn toàn không có tiết học
      const schoolStartDate = new Date(2026, 8, 7, 0, 0, 0);
      const isBeforeStart = dayDate.getTime() < schoolStartDate.getTime();

      const lessons = isBeforeStart
        ? []
        : (scheduleByDay[d.thu] || []).sort(
            (a: any, b: any) => Number(a.tietBatDau || 1) - Number(b.tietBatDau || 1)
          );

      const isToday = isNotStartedYet && showPreview ? false : d.thu === todayThu;

      return {
        ...d,
        dateFormatted,
        isToday,
        lessons,
      };
    });
  }, [dashboardData?.timetable, monday, todayThu, isNotStartedYet, showPreview]);

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
  const latestConduct =
    dashboardData.conducts && dashboardData.conducts.length > 0
      ? formatConduct(dashboardData.conducts[dashboardData.conducts.length - 1].xepLoai)
      : '--';
  const attendance = dashboardData.attendanceStats;
  const absentDays = attendance ? (attendance.vangPhep || 0) + (attendance.vangKhongPhep || 0) : 0;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
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
            <View style={{ flex: 1 }}>
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
            <TouchableOpacity
              style={styles.overviewCard}
              onPress={() => router.push('/(parent)/conduct')}
              activeOpacity={0.7}
            >
              <Text style={[styles.overviewValue, { color: '#f59e0b' }]}>{latestConduct}</Text>
              <Text style={styles.overviewLabel}>Hạnh kiểm</Text>
            </TouchableOpacity>
            <View style={styles.overviewCard}>
              <Text style={[styles.overviewValue, { color: '#ef4444' }]}>{absentDays}</Text>
              <Text style={styles.overviewLabel}>Ngày nghỉ</Text>
            </View>
          </View>
        </View>

        {/* Lịch học tuần này */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Lịch học tuần này</Text>
              <Text style={styles.sectionSubtitle}>({weekRangeStr})</Text>
            </View>
            <View style={styles.weekBadge}>
              <Calendar size={14} color="#2563eb" />
              <Text style={styles.weekBadgeText}>TKB lớp {selectedChild.lop?.tenLop || ''}</Text>
            </View>
          </View>

          {/* Thông báo nếu chưa đến ngày bắt đầu năm học (07/09/2026) */}
          {isNotStartedYet && (
            <View style={styles.notStartedCard}>
              <View style={styles.notStartedIconBox}>
                <Calendar size={26} color="#2563EB" />
              </View>
              <Text style={styles.notStartedTitle}>Năm học mới bắt đầu từ 07/09/2026</Text>
              <Text style={styles.notStartedDesc}>
                Tuần này ({weekRangeStr}) là tuần chuẩn bị trước ngày khai giảng. Thời khóa biểu học tập sẽ chính thức áp dụng từ Thứ Hai, ngày 07/09/2026.
              </Text>
              <TouchableOpacity 
                style={styles.previewBtn}
                onPress={() => setShowPreview(!showPreview)}
                activeOpacity={0.8}
              >
                <Text style={styles.previewBtnText}>
                  {showPreview ? 'Thu gọn thời khóa biểu' : 'Xem trước thời khóa biểu (Áp dụng từ 07/09)'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Vertical scroll list of days */}
          {(!isNotStartedYet || showPreview) && (
          <View style={styles.weekContainer}>
            {weekSchedule.map((dayItem) => (
              <View
                key={dayItem.thu}
                style={[styles.dayCard, dayItem.isToday && styles.dayCardToday]}
              >
                {/* Day Card Header */}
                <View style={[styles.dayCardHeader, dayItem.isToday && styles.dayCardHeaderToday]}>
                  <View style={styles.dayHeaderLeft}>
                    <Text style={[styles.dayTitle, dayItem.isToday && styles.dayTitleToday]}>
                      {dayItem.label}
                    </Text>
                    <Text style={[styles.dayDate, dayItem.isToday && styles.dayDateToday]}>
                      ({dayItem.dateFormatted})
                    </Text>
                  </View>
                  {dayItem.isToday && (
                    <View style={styles.todayBadge}>
                      <Text style={styles.todayBadgeText}>Hôm nay</Text>
                    </View>
                  )}
                  <View style={styles.lessonCountBadge}>
                    <Text style={styles.lessonCountText}>
                      {dayItem.lessons.length > 0 ? `${dayItem.lessons.length} tiết` : 'Nghỉ'}
                    </Text>
                  </View>
                </View>

                {/* Lessons in this Day */}
                <View style={styles.dayCardBody}>
                  {dayItem.lessons.length === 0 ? (
                    <View style={styles.emptyDayBox}>
                      <Sun size={18} color="#94a3b8" />
                      <Text style={styles.emptyDayText}>Không có tiết học</Text>
                    </View>
                  ) : (
                    dayItem.lessons.map((lesson: any, lIndex: number) => {
                      const periodCount = Number(lesson.soTiet || 1);
                      const timeStr = getPeriodTime(Number(lesson.tietBatDau || 1), periodCount);
                      return (
                        <React.Fragment key={lesson.id || `${dayItem.thu}-${lesson.tietBatDau}-${lIndex}`}>
                          <View style={styles.lessonRow}>
                            {/* Time Block */}
                            <View style={styles.timeBlock}>
                              <Text style={styles.periodText}>
                                Tiết {lesson.tietBatDau}
                                {periodCount > 1 ? `-${Number(lesson.tietBatDau) + periodCount - 1}` : ''}
                              </Text>
                              <Text style={styles.timeSubText}>{timeStr}</Text>
                            </View>

                            {/* Lesson Info */}
                            <View style={styles.lessonInfo}>
                              <Text style={styles.subjectName}>
                                {lesson.monHoc?.tenMon || lesson.tenMon || 'Sinh hoạt'}
                              </Text>
                              <View style={styles.lessonMeta}>
                                {lesson.giaoVien?.hoTen && (
                                  <View style={styles.metaItem}>
                                    <User size={12} color="#64748b" />
                                    <Text style={styles.metaText}>GV: {lesson.giaoVien.hoTen}</Text>
                                  </View>
                                )}
                                {lesson.phongHoc && (
                                  <View style={styles.metaItem}>
                                    <MapPin size={12} color="#64748b" />
                                    <Text style={styles.metaText}>P. {lesson.phongHoc}</Text>
                                  </View>
                                )}
                              </View>
                            </View>
                          </View>
                          {lIndex < dayItem.lessons.length - 1 && <View style={styles.lessonDivider} />}
                        </React.Fragment>
                      );
                    })
                  )}
                </View>
              </View>
            ))}
          </View>
          )}
        </View>
      </ScrollView>

      {/* Chat FAB */}
      <TouchableOpacity
        style={styles.chatFab}
        onPress={() => router.push('/(parent)/chat')}
        activeOpacity={0.8}
      >
        <MessageSquare size={24} color="#ffffff" />
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
    padding: 16,
    paddingBottom: 90,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  childInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e0e7ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  weekBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  weekBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1d4ed8',
  },
  overviewGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 10,
  },
  overviewCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  overviewValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#10b981',
  },
  overviewLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    fontWeight: '500',
  },
  weekContainer: {
    gap: 12,
  },
  dayCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
    overflow: 'hidden',
  },
  dayCardToday: {
    borderColor: '#93c5fd',
    borderWidth: 1.5,
    shadowColor: '#2563eb',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  dayCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dayCardHeaderToday: {
    backgroundColor: '#eff6ff',
    borderBottomColor: '#dbeafe',
  },
  dayHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dayTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#334155',
  },
  dayTitleToday: {
    color: '#1d4ed8',
  },
  dayDate: {
    fontSize: 12,
    color: '#64748b',
  },
  dayDateToday: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  todayBadge: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 4,
  },
  todayBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  lessonCountBadge: {
    marginLeft: 'auto',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  lessonCountText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  dayCardBody: {
    padding: 12,
  },
  emptyDayBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  emptyDayText: {
    fontSize: 13,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  timeBlock: {
    width: 85,
    paddingRight: 10,
    borderRightWidth: 1.5,
    borderRightColor: '#e2e8f0',
    marginRight: 12,
    alignItems: 'flex-start',
  },
  periodText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  timeSubText: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  lessonInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  lessonMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 3,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 11,
    color: '#64748b',
  },
  lessonDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 6,
  },
  chatFab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 6,
  },
  notStartedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  notStartedIconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  notStartedTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
    textAlign: 'center',
  },
  notStartedDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  previewBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  previewBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },
});
