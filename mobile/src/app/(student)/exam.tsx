import React, { useState, useEffect, useCallback } from 'react';
import { TextInput,

  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { FileText, Clock, CheckCircle, XCircle, AlertCircle, ChevronRight, BookOpen, X, Eye } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { getStudentExams, getExamResult, startExam, getExamDetail, submitExam, checkExamSession, BaiKiemTra, BaiLamResult, ExamDetail } from '../../api/examApi';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  CHUA_LAM: {
    label: 'Chưa làm',
    color: '#2563EB',
    bg: '#DBEAFE',
    icon: <AlertCircle size={14} color="#2563EB" />,
  },
  DANG_LAM: {
    label: 'Đang làm',
    color: '#D97706',
    bg: '#FEF3C7',
    icon: <Clock size={14} color="#D97706" />,
  },
  DA_NOP: {
    label: 'Đã nộp bài',
    color: '#059669',
    bg: '#D1FAE5',
    icon: <CheckCircle size={14} color="#059669" />,
  },
  HET_LAN_LAM_BAI: {
    label: 'Đã nộp bài',
    color: '#059669',
    bg: '#D1FAE5',
    icon: <CheckCircle size={14} color="#059669" />,
  },
  CHUA_HET_LAN_LAM_BAI: {
    label: 'Còn lượt',
    color: '#7C3AED',
    bg: '#EDE9FE',
    icon: <CheckCircle size={14} color="#7C3AED" />,
  },
  DA_KET_THUC: {
    label: 'Đã kết thúc',
    color: '#64748B',
    bg: '#F1F5F9',
    icon: <XCircle size={14} color="#64748B" />,
  },
  CHUA_DEN_GIO: {
    label: 'Chưa mở',
    color: '#D97706',
    bg: '#FEF3C7',
    icon: <AlertCircle size={14} color="#D97706" />,
  },
};

function getStatusConfig(status: string | null, isEnded: boolean = false, isUpcoming: boolean = false) {
  if (isEnded && status !== 'HET_LAN_LAM_BAI' && status !== 'DA_NOP') {
    return STATUS_CONFIG['DA_KET_THUC'];
  }
  if (isUpcoming && status !== 'HET_LAN_LAM_BAI' && status !== 'DA_NOP') {
    return STATUS_CONFIG['CHUA_DEN_GIO'];
  }
  if (!status) return STATUS_CONFIG['CHUA_LAM'];
  return STATUS_CONFIG[status] || STATUS_CONFIG['CHUA_LAM'];
}

function formatDateTime(dt: string | null): string {
  if (!dt) return '--';
  try {
    const d = new Date(dt);
    const hh = d.getHours().toString().padStart(2, '0');
    const mm = d.getMinutes().toString().padStart(2, '0');
    const dd = d.getDate().toString().padStart(2, '0');
    const mo = (d.getMonth() + 1).toString().padStart(2, '0');
    const yy = d.getFullYear();
    return `${hh}:${mm} ${dd}/${mo}/${yy}`;
  } catch {
    return dt;
  }
}

export default function ExamScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [exams, setExams] = useState<BaiKiemTra[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Exam taking states
  const [isTakingExam, setIsTakingExam] = useState(false);
  const [currentExam, setCurrentExam] = useState<ExamDetail | null>(null);
  const [currentAttemptId, setCurrentAttemptId] = useState<number | null>(null);
  const sessionTokenRef = React.useRef<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [timeLeft, setTimeLeft] = useState(0);

  // Result details states
  const [resultModalVisible, setResultModalVisible] = useState(false);
  const [examResult, setExamResult] = useState<BaiLamResult | null>(null);
  const [isLoadingResult, setIsLoadingResult] = useState(false);

  const fetchExams = useCallback(async () => {
    try {
      const data = await getStudentExams();
      setExams(data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching exams:', err);
      setError('Không thể tải danh sách bài kiểm tra. Vui lòng thử lại.');
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetchExams().finally(() => setIsLoading(false));
  }, []);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchExams();
    setIsRefreshing(false);
  }, [fetchExams]);

  const handlePressExam = (exam: BaiKiemTra) => {
    const status = exam.trangThaiLamBai;
    const hasResult = status === 'HET_LAN_LAM_BAI' || status === 'DA_NOP';

    if (hasResult) {
      handleViewResult(exam.id);
      return;
    }
    
    const now = new Date().getTime();
    const start = exam.thoiGianBatDau ? new Date(exam.thoiGianBatDau).getTime() : 0;
    const end = exam.thoiGianKetThuc ? new Date(exam.thoiGianKetThuc).getTime() : Infinity;
    
    if (start && now < start) {
      Alert.alert('Thông báo', 'Chưa đến giờ làm bài!');
      return;
    }
    if (end && now > end) {
      Alert.alert('Thông báo', 'Bài kiểm tra đã kết thúc!');
      return;
    }

    Alert.alert(
      exam.tieuDe,
      `Môn: ${exam.tenMonHoc || '--'}\nThời gian: ${exam.thoiGianLamBai} phút\n\nBạn đã sẵn sàng? Thời gian sẽ bắt đầu tính ngay khi bạn vào.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Bắt đầu',
          onPress: () => handleStart(exam),
        },
      ]
    );
  };

  const handleStart = async (exam: BaiKiemTra) => {
    try {
      setIsLoading(true);
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      sessionTokenRef.current = token;
      
      const res = await startExam(exam.id, token);
      if (res?.success) {
        setCurrentAttemptId(res.data.id);
        const detailRes = await getExamDetail(exam.id);
        if (detailRes) {
          setCurrentExam(detailRes);
          setAnswers({});
          setIsTakingExam(true);
          setTimeLeft(detailRes.thoiGianLamBai * 60);
        } else {
          Alert.alert('Lỗi', 'Không thể lấy thông tin chi tiết bài làm');
        }
      } else {
         Alert.alert('Lỗi', res?.message || 'Không thể bắt đầu làm bài');
      }
    } catch (err: any) {
      Alert.alert('Lỗi', err?.response?.data?.message || 'Lỗi khi bắt đầu làm bài');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (isAuto = false) => {
    if (!currentAttemptId || !currentExam) return;
    
    const submitCall = async () => {
      try {
        setIsLoading(true);
        const payload = Object.keys(answers).map(cauHoiId => {
          const qId = parseInt(cauHoiId);
          const question = currentExam.cauHois.find(q => q.id === qId);
          
          if (question?.loaiCauHoi === 'TU_LUAN') {
            return {
              cauHoiId: qId,
              cauTraLoiTuLuan: answers[qId]
            };
          }
          
          return {
            cauHoiId: qId,
            dapAnId: answers[qId]
          };
        });
        
        const res = await submitExam(currentAttemptId, payload);
        if (res?.success) {
          if (isAuto) {
             Alert.alert('Thông báo', 'Hết giờ hoặc vi phạm! Bài thi của bạn đã được nộp tự động.');
          } else {
             Alert.alert('Thành công', 'Nộp bài thành công!');
          }
          setIsTakingExam(false);
          setCurrentAttemptId(null);
          setCurrentExam(null);
          fetchExams();
        }
      } catch (err: any) {
        Alert.alert('Lỗi', err?.response?.data?.message || 'Lỗi khi nộp bài');
      } finally {
        setIsLoading(false);
      }
    };

    if (!isAuto) {
      Alert.alert('Xác nhận', 'Bạn có chắc chắn muốn nộp bài?', [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Nộp bài', onPress: submitCall }
      ]);
    } else {
      await submitCall();
    }
  };

  useEffect(() => {
    let timer: any;
    let sessionCheckTimer: any;
    
    if (isTakingExam && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      
      sessionCheckTimer = setInterval(async () => {
        if (!currentAttemptId || !sessionTokenRef.current) return;
        try {
          const isValid = await checkExamSession(currentAttemptId, sessionTokenRef.current);
          if (!isValid) {
             clearInterval(timer);
             clearInterval(sessionCheckTimer);
             setIsTakingExam(false);
             Alert.alert('Cảnh báo', 'Có thiết bị khác đang làm bài kiểm tra này. Bạn đã bị thoát ra.');
             fetchExams();
          }
        } catch (e) {
          console.error(e);
        }
      }, 5000);
      
    } else if (isTakingExam && timeLeft <= 0) {
      handleSubmit(true);
    }
    
    return () => {
      if (timer) clearInterval(timer);
      if (sessionCheckTimer) clearInterval(sessionCheckTimer);
    };
  }, [isTakingExam, timeLeft, currentAttemptId]);


  const handleViewResult = async (examId: number) => {
    try {
      setIsLoadingResult(true);
      const res = await getExamResult(examId);
      if (res) {
        setExamResult(res);
        setResultModalVisible(true);
      } else {
        Alert.alert('Thông báo', 'Không thể tải chi tiết kết quả.');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Lỗi', 'Không thể tải chi tiết kết quả.');
    } finally {
      setIsLoadingResult(false);
    }
  };


  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (isTakingExam && currentExam) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.examTakingHeader}>
          <Text style={styles.examTakingTitle} numberOfLines={1}>{currentExam.tieuDe}</Text>
          <View style={styles.timerBadge}>
            <Clock size={16} color="#DC2626" />
            <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.examTakingContent} showsVerticalScrollIndicator={false}>
          {currentExam.cauHois?.length > 0 ? (
            currentExam.cauHois.map((q, idx) => (
              <View key={q.id} style={styles.questionContainer}>
                <Text style={styles.questionTitle}>Câu {idx + 1} ({q.diem}đ): {q.noiDung}</Text>
                
                {q.loaiCauHoi === 'TRAC_NGHIEM' ? (
                  <View style={styles.optionsContainer}>
                    {q.dapAns?.map((da, i) => {
                      const isSelected = answers[q.id] === da.id;
                      return (
                        <TouchableOpacity
                          key={da.id}
                          style={[styles.optionItem, isSelected && styles.optionItemSelected]}
                          onPress={() => setAnswers(prev => ({ ...prev, [q.id]: da.id }))}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                            {String.fromCharCode(65 + i)}. {da.noiDung}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : (
                  <View style={styles.textInputContainer}>
                    <TextInput
                      style={styles.textInput}
                      multiline={true}
                      numberOfLines={4}
                      placeholder="Nhập câu trả lời tự luận..."
                      value={answers[q.id] || ''}
                      onChangeText={(text) => setAnswers(prev => ({ ...prev, [q.id]: text }))}
                    />
                  </View>
                )}
              </View>
            ))
          ) : (
            <Text style={styles.emptyDetailText}>Chưa có câu hỏi nào.</Text>
          )}

          <TouchableOpacity style={styles.submitBtn} onPress={() => handleSubmit(false)}>
            <Text style={styles.submitBtnText}>Nộp bài</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#143872" />
        <Text style={styles.loadingText}>Đang tải bài kiểm tra...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Bài kiểm tra</Text>
        <Text style={styles.sectionSubtitle}>Danh sách {exams.length} bài kiểm tra</Text>
      </View>

      {isLoadingResult && (
        <View style={styles.fullscreenOverlay}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.overlayText}>Đang tải kết quả...</Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={['#143872']}
          />
        }
      >
        {error && (
          <View style={styles.errorBox}>
            <AlertCircle size={20} color="#DC2626" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {!error && exams.length === 0 && (
          <View style={styles.emptyState}>
            <BookOpen size={64} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>Chưa có bài kiểm tra</Text>
            <Text style={styles.emptySubtitle}>Giáo viên chưa tạo bài kiểm tra nào cho lớp bạn.</Text>
          </View>
        )}

        {exams.map((exam) => {
          const now = new Date().getTime();
          const start = exam.thoiGianBatDau ? new Date(exam.thoiGianBatDau).getTime() : 0;
          const end = exam.thoiGianKetThuc ? new Date(exam.thoiGianKetThuc).getTime() : Infinity;
          const isEnded = end < now;
          const isUpcoming = start > now;

          const hasResult = exam.trangThaiLamBai === 'HET_LAN_LAM_BAI' || exam.trangThaiLamBai === 'DA_NOP';
          const statusCfg = getStatusConfig(exam.trangThaiLamBai, isEnded, isUpcoming);
          const canTake = !hasResult && !isEnded && !isUpcoming;
          
          return (
            <TouchableOpacity
              key={exam.id}
              style={[styles.examCard, isEnded && !hasResult && { opacity: 0.85 }]}
              onPress={() => handlePressExam(exam)}
              activeOpacity={0.75}
            >
              {/* Left accent bar */}
              <View style={[styles.accentBar, { backgroundColor: statusCfg.color }]} />

              <View style={styles.cardBody}>
                <View style={styles.cardTop}>
                  <Text style={styles.examTitle} numberOfLines={2}>{exam.tieuDe}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
                    {statusCfg.icon}
                    <Text style={[styles.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
                  </View>
                </View>

                <View style={styles.metaRow}>
                  <FileText size={13} color="#6B7280" />
                  <Text style={styles.metaText}>{exam.tenMonHoc || 'Chưa rõ môn'}</Text>
                </View>

                <View style={styles.metaRow}>
                  <Clock size={13} color="#6B7280" />
                  <Text style={styles.metaText}>{exam.thoiGianLamBai} phút</Text>
                </View>

                {exam.thoiGianBatDau && (
                  <View style={styles.metaRow}>
                    <AlertCircle size={13} color="#6B7280" />
                    <Text style={styles.metaText}>Bắt đầu: {formatDateTime(exam.thoiGianBatDau)}</Text>
                  </View>
                )}

                {hasResult && exam.diemDatDuoc !== null && (
                  <View style={styles.scoreRow}>
                    <CheckCircle size={14} color="#059669" />
                    <Text style={styles.scoreText}>Điểm: <Text style={styles.scoreValue}>{exam.diemDatDuoc?.toFixed(1)}</Text>/10</Text>
                  </View>
                )}

                <View style={styles.cardFooter}>
                  <Text style={styles.giaoVienText}>GV: {exam.tenGiaoVien || '--'}</Text>
                  {hasResult ? (
                    <TouchableOpacity style={styles.viewResultBtn} onPress={() => handleViewResult(exam.id)}>
                      <Eye size={14} color="#2563EB" style={{ marginRight: 4 }} />
                      <Text style={styles.viewResultText}>Xem kết quả</Text>
                    </TouchableOpacity>
                  ) : isEnded ? (
                    <View style={styles.endedBtn}>
                      <Text style={styles.endedText}>Đã kết thúc</Text>
                    </View>
                  ) : isUpcoming ? (
                    <View style={styles.upcomingBtn}>
                      <Text style={styles.upcomingText}>Chưa mở</Text>
                    </View>
                  ) : (
                    <View style={styles.doExamBtn}>
                      <Text style={styles.doExamText}>
                        {exam.trangThaiLamBai === 'DANG_LAM' ? 'Tiếp tục làm' : 'Làm bài'}
                      </Text>
                      <ChevronRight size={14} color="#2563EB" />
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Result Modal */}
      <Modal
        visible={resultModalVisible}
        animationType="slide"
        onRequestClose={() => setResultModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Chi tiết kết quả làm bài</Text>
            <TouchableOpacity onPress={() => setResultModalVisible(false)} style={styles.closeBtn}>
              <X size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>

          {examResult && (
            <ScrollView contentContainerStyle={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
              {/* Summary card */}
              <View style={styles.summaryCard}>
                <View style={styles.summaryInfo}>
                  <Text style={styles.summaryStudentName}>Học sinh: {examResult.tenHocSinh}</Text>
                  <Text style={styles.summaryMetaText}>Bắt đầu: {formatDateTime(examResult.thoiGianBatDau)}</Text>
                  <Text style={styles.summaryMetaText}>Nộp bài: {formatDateTime(examResult.thoiGianNop)}</Text>
                  <Text style={styles.summaryMetaText}>
                    Trạng thái:{' '}
                    <Text style={examResult.trangThai === 'VI_PHAM_QUY_CHE' ? styles.viPhamText : styles.daNopText}>
                      {examResult.trangThai === 'VI_PHAM_QUY_CHE' ? 'Vi phạm quy chế' : 'Đã nộp bài'}
                    </Text>
                  </Text>
                </View>
                <View style={styles.scoreBadgeContainer}>
                  <Text style={styles.scoreBadgeLabel}>TỔNG ĐIỂM</Text>
                  <Text style={styles.scoreBadgeValue}>
                    {examResult.tongDiem}
                    <Text style={styles.scoreBadgeMax}> /10</Text>
                  </Text>
                </View>
              </View>

              <Text style={styles.detailSectionTitle}>Chi tiết từng câu:</Text>

              {/* Questions list */}
              {examResult.chiTietBaiLams?.map((ct, idx) => (
                <View key={ct.id} style={styles.questionResultCard}>
                  <View style={styles.questionCardHeader}>
                    <Text style={styles.questionCardIdx}>Câu {idx + 1}:</Text>
                    {ct.loaiCauHoi === 'TRAC_NGHIEM' ? (
                      <Text style={ct.diemDatDuoc > 0 ? styles.correctScoreText : styles.wrongScoreText}>
                        {ct.diemDatDuoc} / {ct.diemToiDa}đ
                      </Text>
                    ) : (
                      <Text style={styles.essayScoreText}>Chưa chấm điểm</Text>
                    )}
                  </View>

                  <Text style={styles.questionContentText}>{ct.noiDungCauHoi}</Text>

                  {ct.loaiCauHoi === 'TRAC_NGHIEM' ? (
                    <View style={styles.detailWrapper}>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Trạng thái:</Text>
                        {ct.diemDatDuoc > 0 ? (
                          <View style={styles.inlineStatus}>
                            <CheckCircle size={14} color="#10B981" style={{ marginRight: 4 }} />
                            <Text style={styles.correctInlineText}>Đúng</Text>
                          </View>
                        ) : (
                          <View style={styles.inlineStatus}>
                            <XCircle size={14} color="#EF4444" style={{ marginRight: 4 }} />
                            <Text style={styles.wrongInlineText}>Sai hoặc Chưa làm</Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Bạn đã chọn:</Text>
                        <Text style={ct.diemDatDuoc > 0 ? styles.correctAnswerText : styles.wrongAnswerText}>
                          {ct.dapAnDaChon || 'Bỏ trống'}
                        </Text>
                      </View>

                      {ct.diemDatDuoc === 0 && (
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Đáp án đúng:</Text>
                          <Text style={styles.correctAnswerText}>{ct.dapAnDung || '--'}</Text>
                        </View>
                      )}
                    </View>
                  ) : (
                    <View style={styles.essayAnswerWrapper}>
                      <Text style={styles.essayAnswerLabel}>Câu trả lời của bạn:</Text>
                      <View style={styles.essayAnswerBox}>
                        <Text style={ct.cauTraLoiTuLuan ? styles.essayAnswerText : styles.essayEmptyText}>
                          {ct.cauTraLoiTuLuan || 'Không có câu trả lời'}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              ))}

              {(!examResult.chiTietBaiLams || examResult.chiTietBaiLams.length === 0) && (
                <Text style={styles.emptyDetailText}>Không có dữ liệu chi tiết câu hỏi.</Text>
              )}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    color: '#6B7280',
    fontSize: 14,
  },
  sectionHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  errorText: {
    flex: 1,
    color: '#DC2626',
    fontSize: 13,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  examCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: 'row',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  accentBar: {
    width: 4,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  cardBody: {
    flex: 1,
    padding: 14,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 8,
  },
  examTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
    flexShrink: 0,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    marginBottom: 4,
  },
  scoreText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  scoreValue: {
    fontWeight: '700',
    color: '#059669',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  giaoVienText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  doExamBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  doExamText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
  },
  viewResultBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
  viewResultText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
  },
  endedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
  },
  endedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  upcomingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
  },
  upcomingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
  },
  fullscreenOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  overlayText: {
    color: '#ffffff',
    marginTop: 10,
    fontSize: 15,
    fontWeight: '600',
  },
  // Modal layout
  modalContainer: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  closeBtn: {
    padding: 4,
  },
  modalScrollContent: {
    padding: 16,
  },
  summaryCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 20,
  },
  summaryInfo: {
    flex: 1,
    paddingRight: 8,
  },
  summaryStudentName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E3A8A',
    marginBottom: 6,
  },
  summaryMetaText: {
    fontSize: 12,
    color: '#1E40AF',
    marginBottom: 2,
  },
  viPhamText: {
    color: '#DC2626',
    fontWeight: '700',
  },
  daNopText: {
    color: '#059669',
    fontWeight: '700',
  },
  scoreBadgeContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    minWidth: 80,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  scoreBadgeLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#93C5FD',
    marginBottom: 4,
  },
  scoreBadgeValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#2563EB',
  },
  scoreBadgeMax: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
  },
  questionResultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  questionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  questionCardIdx: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4B5563',
  },
  correctScoreText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
  },
  wrongScoreText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
  },
  essayScoreText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  questionContentText: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: 12,
  },
  detailWrapper: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailLabel: {
    width: 90,
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  inlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  correctInlineText: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '600',
  },
  wrongInlineText: {
    fontSize: 13,
    color: '#EF4444',
    fontWeight: '600',
  },
  correctAnswerText: {
    fontSize: 13,
    color: '#065F46',
    fontWeight: '600',
  },
  wrongAnswerText: {
    fontSize: 13,
    color: '#991B1B',
    fontWeight: '600',
  },
  essayAnswerWrapper: {
    marginTop: 8,
  },
  essayAnswerLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 4,
  },
  essayAnswerBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 60,
  },
  essayAnswerText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  essayEmptyText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  emptyDetailText: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontStyle: 'italic',
    paddingVertical: 20,
  },

  examTakingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  examTakingTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#1E3A8A',
    marginRight: 10,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timerText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#DC2626',
    marginLeft: 4,
  },
  examTakingContent: {
    padding: 16,
    paddingBottom: 40,
  },
  questionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  questionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
    lineHeight: 22,
  },
  optionsContainer: {
    gap: 8,
  },
  optionItem: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#F9FAFB',
  },
  optionItemSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  optionText: {
    fontSize: 14,
    color: '#374151',
  },
  optionTextSelected: {
    color: '#1D4ED8',
    fontWeight: '500',
  },
  textInputContainer: {
    marginTop: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#F9FAFB',
    fontSize: 14,
    color: '#111827',
    textAlignVertical: 'top',
    minHeight: 100,
  },
  submitBtn: {
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
