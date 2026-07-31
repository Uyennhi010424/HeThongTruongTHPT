import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, BookOpen, Calendar as CalendarIcon, ChevronDown, Check } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useDashboardStore } from '../../store/useDashboardStore';

const DAYS = [
  { id: 2, name: 'Thứ 2' },
  { id: 3, name: 'Thứ 3' },
  { id: 4, name: 'Thứ 4' },
  { id: 5, name: 'Thứ 5' },
  { id: 6, name: 'Thứ 6' },
  { id: 7, name: 'Thứ 7' },
  { id: 8, name: 'CN' },
];

const getTietTimeStr = (tiet: number) => {
  const times: Record<number, string> = {
    1: '07:00 - 07:45', 2: '07:50 - 08:35', 3: '08:50 - 09:35', 4: '09:40 - 10:25', 5: '10:30 - 11:15',
    6: '13:00 - 13:45', 7: '13:50 - 14:35', 8: '14:50 - 15:35', 9: '15:40 - 16:25', 10: '16:30 - 17:15'
  };
  return times[tiet] || '00:00 - 00:00';
};

export default function CalendarScreen() {
  const { data } = useDashboardStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tempDate, setTempDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(2);
  const [tab, setTab] = useState<'HOC' | 'THI'>('HOC');
  const [viewMode, setViewMode] = useState<'Ngày' | 'Tuần' | 'Tháng'>('Ngày');
  const [showPicker, setShowPicker] = useState(false);
  const [showViewModeModal, setShowViewModeModal] = useState(false);

  useEffect(() => {
    // Automatically select the current day based on system date
    const jsDay = currentDate.getDay();
    const currentThu = jsDay === 0 ? 8 : jsDay + 1;
    setSelectedDay(currentThu);
  }, []);

  const exams = data?.exams || [];

  const handleOpenPicker = () => {
    setTempDate(currentDate);
    setShowPicker(true);
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      if (Platform.OS === 'android') {
        setShowPicker(false);
        setCurrentDate(selectedDate);
        const dayIndex = selectedDate.getDay();
        const mappedDay = dayIndex === 0 ? 8 : dayIndex + 1;
        setSelectedDay(mappedDay);
      } else {
        // iOS: update tempDate, don't close picker yet
        setTempDate(selectedDate);
      }
    } else if (Platform.OS === 'android') {
      setShowPicker(false);
    }
  };

  const handleDonePickerIOS = () => {
    setShowPicker(false);
    setCurrentDate(tempDate);
    const dayIndex = tempDate.getDay();
    const mappedDay = dayIndex === 0 ? 8 : dayIndex + 1;
    setSelectedDay(mappedDay);
  };

  const handleDayTabPress = (dayId: number) => {
    setSelectedDay(dayId);
    
    // Update currentDate to match the selected day within the current week
    const currentDayIndex = currentDate.getDay(); // 0 is Sunday, 1 is Monday
    const currentMappedDay = currentDayIndex === 0 ? 8 : currentDayIndex + 1;
    
    const diff = dayId - currentMappedDay;
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + diff);
    setCurrentDate(newDate);
  };

  const renderClassItem = (item: any, index: number) => (
    <View key={index} style={styles.classCard}>
      <View style={styles.classTimeCol}>
        <Text style={styles.tietText}>Tiết {item.tietBatDau}</Text>
        <Text style={styles.timeText}>{getTietTimeStr(item.tietBatDau)}</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.classInfoCol}>
        <Text style={styles.subjectName}>{item.monHoc?.tenMon}</Text>
        <View style={styles.detailRow}>
          <User size={16} color="#64748B" />
          <Text style={styles.detailText}>GV: {item.giaoVien?.hoTen}</Text>
        </View>
      </View>
    </View>
  );

  const renderNgàyView = () => {
    const isSummerBreak = currentDate.getMonth() >= 5 && currentDate.getMonth() <= 7;
    const todayClasses = isSummerBreak 
      ? []
      : data?.timetable
        ?.filter((item: any) => item.thu === selectedDay)
        .sort((a: any, b: any) => a.tietBatDau - b.tietBatDau) || [];

    return todayClasses.length > 0 ? (
      todayClasses.map((item: any, index: number) => renderClassItem(item, index))
    ) : (
      <View style={styles.emptyContainer}>
        <BookOpen size={48} color="#CBD5E1" style={{ marginBottom: 16 }} />
        <Text style={styles.emptyText}>{isSummerBreak ? 'Nghỉ hè!' : 'Trống lịch!'}</Text>
        <Text style={styles.emptySubtext}>
          {isSummerBreak ? 'Đang trong thời gian nghỉ hè, không có lịch học.' : 'Không có lịch học nào trong ngày này.'}
        </Text>
      </View>
    );
  };

  const renderTuầnView = () => {
    const isSummerBreak = currentDate.getMonth() >= 5 && currentDate.getMonth() <= 7;
    if (isSummerBreak || !data?.timetable || data.timetable.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <BookOpen size={48} color="#CBD5E1" style={{ marginBottom: 16 }} />
          <Text style={styles.emptyText}>{isSummerBreak ? 'Nghỉ hè!' : 'Tuần trống!'}</Text>
          <Text style={styles.emptySubtext}>
            {isSummerBreak ? 'Đang trong thời gian nghỉ hè, không có lịch học.' : 'Không có lịch học nào trong tuần này.'}
          </Text>
        </View>
      );
    }
    return DAYS.map((day) => {
      const dayClasses = data?.timetable
        ?.filter((item: any) => item.thu === day.id)
        .sort((a: any, b: any) => a.tietBatDau - b.tietBatDau) || [];
      if (dayClasses.length === 0) return null;
      return (
        <View key={day.id} style={styles.weekSection}>
          <Text style={styles.weekSectionHeader}>{day.name === 'CN' ? 'Chủ nhật' : day.name}</Text>
          {dayClasses.map((item: any, index: number) => renderClassItem(item, index))}
        </View>
      );
    });
  };

  const renderThángView = () => {
    return (
      <View style={styles.emptyContainer}>
        <CalendarIcon size={48} color="#CBD5E1" style={{ marginBottom: 16 }} />
        <Text style={styles.emptyText}>Lịch tháng</Text>
        <Text style={styles.emptySubtext}>Giao diện lịch tháng đang được cập nhật.</Text>
      </View>
    );
  };

  const getExamDateString = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const getWeekRange = (date: Date) => {
    const day = date.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() + diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    return { startOfWeek, endOfWeek };
  };

  const getFilteredExams = () => {
    if (!data?.exams) return [];
    const dateStr = getExamDateString(currentDate);
    if (viewMode === 'Ngày') {
      return data.exams.filter((exam: any) => exam.ngayThi === dateStr);
    } else if (viewMode === 'Tuần') {
      const { startOfWeek, endOfWeek } = getWeekRange(currentDate);
      return data.exams.filter((exam: any) => {
        if (!exam.ngayThi) return false;
        const examDate = new Date(exam.ngayThi);
        return examDate >= startOfWeek && examDate <= endOfWeek;
      });
    } else if (viewMode === 'Tháng') {
      const month = currentDate.getMonth();
      const year = currentDate.getFullYear();
      return data.exams.filter((exam: any) => {
        if (!exam.ngayThi) return false;
        const examDate = new Date(exam.ngayThi);
        return examDate.getMonth() === month && examDate.getFullYear() === year;
      });
    }
    return [];
  };

  const filteredExams = getFilteredExams();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topTabs}>
        <TouchableOpacity style={[styles.topTabBtn, tab === 'HOC' && styles.topTabBtnActive]} onPress={() => setTab('HOC')}>
          <Text style={[styles.topTabText, tab === 'HOC' && styles.topTabTextActive]}>Lịch học</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.topTabBtn, tab === 'THI' && styles.topTabBtnActive]} onPress={() => setTab('THI')}>
          <Text style={[styles.topTabText, tab === 'THI' && styles.topTabTextActive]}>Lịch thi</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.dateHeaderRow}>
        <TouchableOpacity style={styles.dateLeft} onPress={handleOpenPicker}>
          <CalendarIcon size={18} color="#2563EB" />
          <Text style={styles.dateText}>{DAYS.find(d => d.id === selectedDay)?.name}, {currentDate.toLocaleDateString('vi-VN')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.viewModeBtn} onPress={() => setShowViewModeModal(true)}>
          <Text style={styles.viewModeText}>{viewMode}</Text>
          <ChevronDown size={16} color="#64748B" />
        </TouchableOpacity>
      </View>

      {tab === 'HOC' && viewMode === 'Ngày' && (
        <View style={styles.daysWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daysContainer}>
            {DAYS.map((day) => {
              const isActive = selectedDay === day.id;
              return (
                <TouchableOpacity key={day.id} style={[styles.dayTab, isActive && styles.dayTabActive]} onPress={() => handleDayTabPress(day.id)}>
                  <Text style={[styles.dayText, isActive && styles.dayTextActive]}>{day.name}</Text>
                  {isActive && <View style={styles.activeDot} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {showPicker && (
        Platform.OS === 'ios' ? (
          <Modal visible={true} transparent={true} animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { paddingBottom: 20 }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 10 }}>
                  <TouchableOpacity onPress={handleDonePickerIOS}>
                    <Text style={{ color: '#2563EB', fontSize: 16, fontWeight: 'bold' }}>Xong</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker value={tempDate} mode="date" display="spinner" onChange={onDateChange} />
              </View>
            </View>
          </Modal>
        ) : (
          <DateTimePicker value={currentDate} mode="date" display="default" onChange={onDateChange} />
        )
      )}

      <Modal visible={showViewModeModal} transparent={true} animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowViewModeModal(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Chọn chế độ xem</Text>
            {['Ngày', 'Tuần', 'Tháng'].map((mode) => (
              <TouchableOpacity key={mode} style={styles.modalOptionRow} onPress={() => { setViewMode(mode); setShowViewModeModal(false); }}>
                <Text style={[styles.modalOptionText, viewMode === mode && styles.modalOptionTextActive]}>Xem theo {mode}</Text>
                {viewMode === mode && <Check size={20} color="#2563EB" />}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>

      <ScrollView contentContainerStyle={styles.classesContainer} showsVerticalScrollIndicator={false}>
        {tab === 'HOC' ? (
          viewMode === 'Ngày' ? renderNgàyView() : viewMode === 'Tuần' ? renderTuầnView() : renderThángView()
        ) : (
          filteredExams.length > 0 ? (
            filteredExams.map((exam: any, idx: number) => (
              <View key={idx} style={styles.classCard}>
                <View style={styles.classTimeCol}>
                  <Text style={styles.tietText}>{exam.loaiKiemTra}</Text>
                  <Text style={styles.timeText}>{exam.thoiGianLamBai} phút</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.classInfoCol}>
                  <Text style={styles.subjectName}>{exam.monHoc?.tenMon}</Text>
                  <Text style={styles.detailText}>Ngày thi: {exam.ngayThi}</Text>
                  <Text style={styles.detailText}>Giờ bắt đầu: {exam.gioBatDau ? exam.gioBatDau.substring(0, 5) : '--:--'}</Text>
                  <Text style={styles.detailText}>Phòng thi: {exam.phongThi || 'Chưa xếp'}</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <BookOpen size={48} color="#CBD5E1" style={{ marginBottom: 16 }} />
              <Text style={styles.emptyText}>Không có lịch thi!</Text>
              <Text style={styles.emptySubtext}>Bạn không có lịch thi nào trong {viewMode.toLowerCase()} này.</Text>
            </View>
          )
        )}
      </ScrollView>
    </SafeAreaView>
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
    paddingTop: 10,
  },
  topTabBtn: {
    flex: 1,
    paddingVertical: 12,
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
  },
  dateHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dateLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    marginLeft: 8,
  },
  viewModeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  viewModeText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
    marginRight: 4,
  },
  daysWrapper: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  daysContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  dayTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayTabActive: {
    backgroundColor: '#EFF6FF',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  dayTextActive: {
    color: '#2563EB',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#2563EB',
    marginTop: 4,
  },
  classesContainer: {
    padding: 20,
    gap: 16,
  },
  classCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  classTimeCol: {
    width: 110,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tietText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563EB',
    marginBottom: 4,
  },
  timeText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  divider: {
    width: 1,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 16,
  },
  classInfoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  subjectName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#475569',
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#64748B',
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
  weekSection: {
    marginBottom: 24,
  },
  weekSectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 12,
    marginLeft: 4,
  },
});
