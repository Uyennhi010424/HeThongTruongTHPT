import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, BookOpen, Calendar as CalendarIcon, ChevronDown, Check, ChevronLeft, ChevronRight } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useDashboardStore } from '../../store/useDashboardStore';
import { getTimetableByDate } from '../../api/studentDashboardApi';

const DAYS = [
  { id: 2, name: 'Thứ 2' },
  { id: 3, name: 'Thứ 3' },
  { id: 4, name: 'Thứ 4' },
  { id: 5, name: 'Thứ 5' },
  { id: 6, name: 'Thứ 6' },
  { id: 7, name: 'Thứ 7' },
  { id: 8, name: 'CN' },
];

const getTietTimeStr = (tietBatDau: number, soTiet: number = 1) => {
  const times: Record<number, string> = {
    1: '07:00 - 07:45', 2: '07:50 - 08:35', 3: '08:50 - 09:35', 4: '09:40 - 10:25', 5: '10:30 - 11:15',
    6: '13:00 - 13:45', 7: '13:50 - 14:35', 8: '14:50 - 15:35', 9: '15:40 - 16:25', 10: '16:30 - 17:15'
  };
  const startStr = times[tietBatDau]?.split(' - ')[0] || '00:00';
  const endTiet = tietBatDau + soTiet - 1;
  const endStr = times[endTiet]?.split(' - ')[1] || '00:00';
  return `${startStr} - ${endStr}`;
};

export const getExamDateString = (date: Date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export const getWeekRange = (date: Date) => {
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

export const getWeekInfo = (date: Date) => {
  const day = date.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const formatShort = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;

  const month = date.getMonth(); // 0 - 11
  const startYear = month >= 7 ? date.getFullYear() : date.getFullYear() - 1;

  // Lấy ngày thứ 2 của tuần đầu tiên tháng 9
  const sep5 = new Date(startYear, 8, 5);
  const sep5Day = sep5.getDay();
  const diffToSep5Monday = sep5Day === 0 ? -6 : 1 - sep5Day;
  const startHk1 = new Date(sep5);
  startHk1.setDate(sep5.getDate() + diffToSep5Monday);
  startHk1.setHours(0, 0, 0, 0);

  if (monday.getTime() < startHk1.getTime()) {
    return {
      weekNum: 1,
      monday,
      sunday,
      weekStr: `Tuần hè / Chuẩn bị (${formatShort(monday)} - ${formatShort(sunday)})`,
    };
  }

  const diffMs = monday.getTime() - startHk1.getTime();
  const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
  const weekNum = diffWeeks + 1;

  return {
    weekNum,
    monday,
    sunday,
    weekStr: `Tuần ${weekNum} (${formatShort(monday)} - ${formatShort(sunday)})`,
  };
};

export default function CalendarScreen() {
  const { data } = useDashboardStore();
  
  const getInitialDate = () => {
    return new Date();
  };

  const [currentDate, setCurrentDate] = useState(getInitialDate());
  const [tempDate, setTempDate] = useState(getInitialDate());
  const [selectedDay, setSelectedDay] = useState(2);
  const [tab, setTab] = useState<'HOC' | 'THI'>('HOC');
  const [viewMode, setViewMode] = useState<'Ngày' | 'Tuần' | 'Tháng'>('Ngày');
  const [showPicker, setShowPicker] = useState(false);
  const [showViewModeModal, setShowViewModeModal] = useState(false);
  const [timetable, setTimetable] = useState<any[]>([]);

  useEffect(() => {
    const fetchTimetable = async () => {
      // Offset by timezone to get correct local date string YYYY-MM-DD
      const localDate = new Date(currentDate.getTime() - (currentDate.getTimezoneOffset() * 60000));
      const dateStr = localDate.toISOString().split('T')[0];
      const result = await getTimetableByDate(dateStr);
      setTimetable(result);
    };
    fetchTimetable();
  }, [currentDate]);

  useEffect(() => {
    // Automatically select the current day based on currentDate
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

  const isDateInExamWeek = (date: Date) => {
    if (!data?.exams || data.exams.length === 0) return false;
    const { startOfWeek, endOfWeek } = getWeekRange(date);
    return data.exams.some((exam: any) => {
      if (!exam.ngayThi) return false;
      const examDate = new Date(exam.ngayThi);
      return examDate >= startOfWeek && examDate <= endOfWeek;
    });
  };

  const isExamWeek = isDateInExamWeek(currentDate);

  const renderClassItem = (item: any, index: number) => (
    <View key={index} style={styles.classCard}>
      <View style={styles.classTimeCol}>
        <Text style={styles.tietText}>
          Tiết {item.tietBatDau}{item.soTiet > 1 ? ` - ${item.tietBatDau + item.soTiet - 1}` : ''}
        </Text>
        <Text style={styles.timeText}>{getTietTimeStr(item.tietBatDau, item.soTiet || 1)}</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.classInfoCol}>
        <Text style={styles.subjectName}>{item.monHoc?.tenMon || item.monHoc?.tenMonHoc}</Text>
        <View style={styles.detailRow}>
          <User size={16} color="#64748B" />
          <Text style={styles.detailText}>GV: {item.giaoVien?.hoTen}</Text>
        </View>
        {item.ghiChu ? (
          <View style={[styles.detailRow, { marginTop: 4 }]}>
            <Text style={{ fontSize: 12, color: '#D97706', backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: 'hidden' }}>
              📝 {item.ghiChu}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );

  const renderNgàyView = () => {
    const todayClasses = isExamWeek
      ? []
      : timetable
        ?.filter((item: any) => item.thu === selectedDay)
        .sort((a: any, b: any) => a.tietBatDau - b.tietBatDau) || [];

    return todayClasses.length > 0 ? (
      todayClasses.map((item: any, index: number) => renderClassItem(item, index))
    ) : (
      <View style={styles.emptyContainer}>
        <BookOpen size={48} color={isExamWeek ? '#FCA5A5' : '#CBD5E1'} style={{ marginBottom: 16 }} />
        <Text style={[styles.emptyText, isExamWeek && { color: '#EF4444' }]}>
          {isExamWeek ? 'Tuần Thi!' : 'Trống lịch!'}
        </Text>
        <Text style={styles.emptySubtext}>
          {isExamWeek ? 'Tuần này là tuần thi. Lịch học tạm dừng. Chúc bạn thi tốt!' : 'Không có lịch học nào trong ngày này.'}
        </Text>
      </View>
    );
  };

  const renderTuầnView = () => {
    if (isExamWeek || !timetable || timetable.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <BookOpen size={48} color={isExamWeek ? '#FCA5A5' : '#CBD5E1'} style={{ marginBottom: 16 }} />
          <Text style={[styles.emptyText, isExamWeek && { color: '#EF4444' }]}>
            {isExamWeek ? 'Tuần Thi!' : 'Tuần trống!'}
          </Text>
          <Text style={styles.emptySubtext}>
            {isExamWeek ? 'Tuần này là tuần thi. Lịch học tạm dừng. Chúc bạn thi tốt!' : 'Không có lịch học nào trong tuần này.'}
          </Text>
        </View>
      );
    }
    return DAYS.map((day) => {
      const dayClasses = timetable
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

  const handlePrevMonth = () => {
    const prev = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    setCurrentDate(prev);
    const jsDay = prev.getDay();
    setSelectedDay(jsDay === 0 ? 8 : jsDay + 1);
  };

  const handleNextMonth = () => {
    const next = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    setCurrentDate(next);
    const jsDay = next.getDay();
    setSelectedDay(jsDay === 0 ? 8 : jsDay + 1);
  };

  const handleSelectMonthDate = (cellDate: Date) => {
    setCurrentDate(cellDate);
    const jsDay = cellDate.getDay();
    setSelectedDay(jsDay === 0 ? 8 : jsDay + 1);
  };

  const renderThángView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sunday, 1 = Monday
    const firstDayOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1; // 0 = Monday ... 6 = Sunday

    const prevMonthDays = new Date(year, month, 0).getDate();

    const cells: {
      day: number;
      date: Date;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
      hasClasses: boolean;
      hasExams: boolean;
    }[] = [];

    const today = new Date();
    const isSameDate = (d1: Date, d2: Date) =>
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();

    // Previous month padding
    for (let i = firstDayOffset - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthDays - i);
      cells.push({
        day: prevMonthDays - i,
        date: d,
        isCurrentMonth: false,
        isToday: isSameDate(d, today),
        isSelected: isSameDate(d, currentDate),
        hasClasses: false,
        hasExams: false,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const cellDate = new Date(year, month, d);
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayOfWeek = cellDate.getDay() === 0 ? 8 : cellDate.getDay() + 1; // 2..8

      const isCellExamWeek = isDateInExamWeek(cellDate);
      const hasClasses = !isCellExamWeek && dayOfWeek !== 8 && timetable && timetable.some((t: any) => t.thu === dayOfWeek);
      const hasExams = (data?.exams || []).some((e: any) => e.ngayThi === dateStr);

      cells.push({
        day: d,
        date: cellDate,
        isCurrentMonth: true,
        isToday: isSameDate(cellDate, today),
        isSelected: isSameDate(cellDate, currentDate),
        hasClasses,
        hasExams,
      });
    }

    // Next month padding
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      cells.push({
        day: i,
        date: d,
        isCurrentMonth: false,
        isToday: isSameDate(d, today),
        isSelected: isSameDate(d, currentDate),
        hasClasses: false,
        hasExams: false,
      });
    }

    // Filter classes or exams for the selected date in Month view
    const selectedDateStr = getExamDateString(currentDate);
    const selectedDateClasses = isExamWeek
      ? []
      : timetable?.filter((item: any) => item.thu === selectedDay).sort((a: any, b: any) => a.tietBatDau - b.tietBatDau) || [];

    const selectedDateExams = (data?.exams || []).filter((e: any) => e.ngayThi === selectedDateStr);

    const weekHeaderDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

    return (
      <View style={styles.monthViewWrapper}>
        {/* Month Navigation */}
        <View style={styles.monthHeaderRow}>
          <TouchableOpacity style={styles.monthNavBtn} onPress={handlePrevMonth}>
            <ChevronLeft size={20} color="#334155" />
          </TouchableOpacity>
          <Text style={styles.monthTitleText}>
            Tháng {month + 1}, {year}
          </Text>
          <TouchableOpacity style={styles.monthNavBtn} onPress={handleNextMonth}>
            <ChevronRight size={20} color="#334155" />
          </TouchableOpacity>
        </View>

        {/* Month Calendar Card */}
        <View style={styles.monthCard}>
          {/* Weekday headers */}
          <View style={styles.monthWeekdaysRow}>
            {weekHeaderDays.map((w, idx) => (
              <Text key={idx} style={[styles.monthWeekdayText, idx === 6 && { color: '#EF4444' }]}>
                {w}
              </Text>
            ))}
          </View>

          {/* Month grid */}
          <View style={styles.monthGrid}>
            {cells.map((cell, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.monthCell,
                  cell.isSelected && styles.monthCellSelected,
                  cell.isToday && !cell.isSelected && styles.monthCellToday,
                ]}
                onPress={() => handleSelectMonthDate(cell.date)}
              >
                <Text
                  style={[
                    styles.monthCellText,
                    !cell.isCurrentMonth && styles.monthCellTextDimmed,
                    cell.isSelected && styles.monthCellTextSelected,
                    cell.isToday && !cell.isSelected && styles.monthCellTextToday,
                  ]}
                >
                  {cell.day}
                </Text>
                <View style={styles.dotRow}>
                  {cell.hasClasses && <View style={[styles.eventDot, { backgroundColor: cell.isSelected ? '#FFFFFF' : '#3B82F6' }]} />}
                  {cell.hasExams && <View style={[styles.eventDot, { backgroundColor: cell.isSelected ? '#FDE047' : '#EF4444' }]} />}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Legend */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
              <Text style={styles.legendText}>Có lịch học</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
              <Text style={styles.legendText}>Có lịch thi</Text>
            </View>
          </View>
        </View>

        {/* Details Section for Selected Date */}
        <View style={styles.selectedDaySection}>
          <Text style={styles.selectedDayHeader}>
            {tab === 'HOC' ? 'Lịch học ngày' : 'Lịch thi ngày'}{' '}
            {DAYS.find(d => d.id === selectedDay)?.name}, {currentDate.toLocaleDateString('vi-VN')}
          </Text>

          {tab === 'HOC' ? (
            selectedDateClasses.length > 0 ? (
              selectedDateClasses.map((item: any, index: number) => renderClassItem(item, index))
            ) : (
              <View style={styles.emptyContainerSmall}>
                <BookOpen size={36} color={isExamWeek ? '#FCA5A5' : '#CBD5E1'} style={{ marginBottom: 8 }} />
                <Text style={[styles.emptyTextSmall, isExamWeek && { color: '#EF4444' }]}>
                  {isExamWeek ? 'Tuần Thi!' : 'Không có tiết học'}
                </Text>
                <Text style={styles.emptySubtext}>
                  {isExamWeek ? 'Tuần này là tuần thi. Lịch học tạm dừng. Chúc bạn thi tốt!' : 'Ngày này không có lịch học.'}
                </Text>
              </View>
            )
          ) : (
            selectedDateExams.length > 0 ? (
              selectedDateExams.map((exam: any, idx: number) => (
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
              <View style={styles.emptyContainerSmall}>
                <BookOpen size={36} color="#CBD5E1" style={{ marginBottom: 8 }} />
                <Text style={styles.emptyTextSmall}>Không có lịch thi</Text>
                <Text style={styles.emptySubtext}>Không có môn thi nào trong ngày này.</Text>
              </View>
            )
          )}
        </View>
      </View>
    );
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
    <View style={styles.container}>
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
          <CalendarIcon size={20} color="#2563EB" />
          <View style={{ marginLeft: 8 }}>
            <Text style={styles.dateText}>{DAYS.find(d => d.id === selectedDay)?.name}, {currentDate.toLocaleDateString('vi-VN')}</Text>
            <Text style={styles.weekSubText}>{getWeekInfo(currentDate).weekStr}</Text>
          </View>
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
              <TouchableOpacity key={mode} style={styles.modalOptionRow} onPress={() => { setViewMode(mode as any); setShowViewModeModal(false); }}>
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
  },
  weekSubText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
    marginTop: 2,
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
  monthViewWrapper: {
    gap: 16,
  },
  monthHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  monthNavBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  monthTitleText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  monthCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  monthWeekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 8,
  },
  monthWeekdayText: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  monthCell: {
    width: '14.28%',
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    marginVertical: 2,
  },
  monthCellSelected: {
    backgroundColor: '#2563EB',
  },
  monthCellToday: {
    borderWidth: 1.5,
    borderColor: '#2563EB',
  },
  monthCellText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  monthCellTextDimmed: {
    color: '#CBD5E1',
  },
  monthCellTextSelected: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  monthCellTextToday: {
    color: '#2563EB',
    fontWeight: 'bold',
  },
  dotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    marginTop: 2,
    height: 5,
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  selectedDaySection: {
    marginTop: 8,
  },
  selectedDayHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 12,
    marginLeft: 4,
  },
  emptyContainerSmall: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  emptyTextSmall: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 4,
  },
});
