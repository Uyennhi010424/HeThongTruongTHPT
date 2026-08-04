import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { FileText, Clock, CheckCircle, XCircle, AlertCircle, ChevronRight, BookOpen, X, Eye } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { getStudentExams, getExamResult, BaiKiemTra, BaiLamResult } from '../../api/examApi';

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
    label: 'Đã nộp',
    color: '#059669',
    bg: '#D1FAE5',
    icon: <CheckCircle size={14} color="#059669" />,
  },
  HET_LAN_LAM_BAI: {
    label: 'Hết lượt',
    color: '#DC2626',
    bg: '#FEE2E2',
    icon: <XCircle size={14} color="#DC2626" />,
  },
  CHUA_HET_LAN_LAM_BAI: {
    label: 'Còn lượt',
    color: '#7C3AED',
    bg: '#EDE9FE',
    icon: <CheckCircle size={14} color="#7C3AED" />,
  },
};

function getStatusConfig(status: string | null) {
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

    Alert.alert(
      exam.tieuDe,
      `Môn: ${exam.tenMonHoc || '--'}\nThời gian: ${exam.thoiGianLamBai} phút\n\nBạn có muốn làm bài không?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Làm bài',
          onPress: () => {
            Alert.alert('Thông báo', 'Chức năng làm bài trực tiếp đang được phát triển. Vui lòng sử dụng phiên bản web.');
          },
        },
      ]
    );
  };

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

  if (isLoading) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#143872" />
        <Text style={styles.loadingText}>Đang tải bài kiểm tra...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: 0 }]}>
      {/* Header */}
      <LinearGradient
        colors={['#143872', '#0A2652']}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <Text style={styles.headerTitle}>Bài Kiểm Tra</Text>
        <Text style={styles.headerSubtitle}>{exams.length} bài kiểm tra</Text>
      </LinearGradient>

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
          const statusCfg = getStatusConfig(exam.trangThaiLamBai);
          const hasResult = exam.trangThaiLamBai === 'HET_LAN_LAM_BAI' || exam.trangThaiLamBai === 'DA_NOP';
          const canTake = exam.trangThaiLamBai !== 'HET_LAN_LAM_BAI' && exam.trangThaiLamBai !== 'DA_NOP';
          
          return (
            <TouchableOpacity
              key={exam.id}
              style={styles.examCard}
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
                  {canTake ? (
                    <View style={styles.doExamBtn}>
                      <Text style={styles.doExamText}>Làm bài</Text>
                      <ChevronRight size={14} color="#2563EB" />
                    </View>
                  ) : (
                    <TouchableOpacity style={styles.viewResultBtn} onPress={() => handleViewResult(exam.id)}>
                      <Eye size={14} color="#2563EB" style={{ marginRight: 4 }} />
                      <Text style={styles.viewResultText}>Xem kết quả</Text>
                    </TouchableOpacity>
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
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#BFDBFE',
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
});

