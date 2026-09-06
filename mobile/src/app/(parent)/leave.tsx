import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, TextInput, Modal, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { Calendar, Plus, X, AlertTriangle } from 'lucide-react-native';
import api from '../../api/axiosClient';
import { useParentStore } from '../../store/useParentStore';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function ParentLeaveScreen() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { selectedChild } = useParentStore();

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [leaveType, setLeaveType] = useState<'single' | 'multiple'>('single');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [lyDo, setLyDo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isSundaySelected = useMemo(() => {
    if (leaveType === 'single') {
      return startDate ? startDate.getDay() === 0 : false;
    } else {
      const startIsSun = startDate ? startDate.getDay() === 0 : false;
      const endIsSun = endDate ? endDate.getDay() === 0 : false;
      return startIsSun || endIsSun;
    }
  }, [leaveType, startDate, endDate]);

  useEffect(() => {
    if (selectedChild?.id) {
      fetchRequests();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChild?.id]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/don-xin-nghi/me');
      if (res.data?.data) {
        setRequests(res.data.data.filter((r: any) => r.hocSinhId === selectedChild?.id));
      }
    } catch (error) {
      console.log('Lỗi lấy đơn xin nghỉ:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách đơn xin nghỉ.');
    } finally {
      setLoading(false);
    }
  };

  const formatYMD = (d: Date | null) => {
    if (!d) return '';
    const tzOffset = d.getTimezoneOffset() * 60000;
    return (new Date(d.getTime() - tzOffset)).toISOString().split('T')[0];
  };

  const formatDateDisplay = (d: Date | null) => d ? formatYMD(d).split('-').reverse().join('/') : 'Chọn ngày...';

  const handleCreateRequest = async () => {
    const ngayBatDau = formatYMD(startDate);
    const ngayKetThuc = leaveType === 'single' ? ngayBatDau : formatYMD(endDate);
    
    if (!ngayBatDau || !ngayKetThuc || !lyDo) {
      Alert.alert("Lỗi", "Vui lòng nhập đủ thông tin ngày và lý do");
      return;
    }
    if (leaveType === 'multiple' && startDate && endDate && startDate > endDate) {
      Alert.alert("Lỗi", "Ngày kết thúc phải sau ngày bắt đầu");
      return;
    }
    try {
      setSubmitting(true);
      await api.post('/don-xin-nghi', {
        ngayBatDau,
        ngayKetThuc,
        lyDo,
        hocSinhId: selectedChild?.id
      });
      Alert.alert("Thành công", "Đã tạo đơn xin nghỉ");
      setModalVisible(false);
      fetchRequests();
    } catch (error: any) {
      Alert.alert("Lỗi", error.response?.data?.message || "Không thể tạo đơn");
    } finally {
      setSubmitting(false);
    }
  };

  const openModal = () => {
    setLeaveType('single');
    setStartDate(null);
    setEndDate(null);
    setLyDo('');
    setModalVisible(true);
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      "Xác nhận",
      "Bạn muốn hủy đơn này?",
      [
        { text: "Hủy", style: "cancel" },
        { text: "Đồng ý", onPress: async () => {
            try {
              await api.delete(`/don-xin-nghi/${id}`);
              fetchRequests();
            } catch {
              Alert.alert("Lỗi", "Không thể hủy đơn");
            }
          } 
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: any }) => {
    const isPending = item.trangThai === 'PENDING';
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardDate}>
            {item.ngayBatDau.split('-').reverse().join('/')} {item.ngayBatDau !== item.ngayKetThuc && `- ${item.ngayKetThuc.split('-').reverse().join('/')}`}
          </Text>
          <View style={[styles.statusBadge, 
            item.trangThai === 'APPROVED' ? styles.statusApproved : 
            item.trangThai === 'REJECTED' ? styles.statusRejected : styles.statusPending]}>
            <Text style={[styles.statusText, 
              item.trangThai === 'APPROVED' ? styles.statusApprovedText : 
              item.trangThai === 'REJECTED' ? styles.statusRejectedText : styles.statusPendingText]}>
              {item.trangThai === 'APPROVED' ? 'Đã duyệt' : item.trangThai === 'REJECTED' ? 'Từ chối' : 'Chờ duyệt'}
            </Text>
          </View>
        </View>
        <Text style={styles.lyDo} numberOfLines={2}>{item.lyDo}</Text>
        {item.phanHoiGv && (
          <View style={styles.feedbackBox}>
            <Text style={styles.feedbackLabel}>GV Phản hồi:</Text>
            <Text style={styles.feedbackText}>{item.phanHoiGv}</Text>
          </View>
        )}
        {isPending && (
          <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
            <Text style={styles.deleteBtnText}>Hủy đơn</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>

      {loading ? (
        <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Calendar size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>Chưa có đơn xin nghỉ nào</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={openModal}>
        <Plus size={24} color="#fff" />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Xin nghỉ cho {selectedChild?.hoTen}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.typeSelector}>
              <TouchableOpacity 
                style={[styles.typeBtn, leaveType === 'single' && styles.typeBtnActive]} 
                onPress={() => setLeaveType('single')}
              >
                <Text style={[styles.typeBtnText, leaveType === 'single' && styles.typeBtnTextActive]}>1 Ngày</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.typeBtn, leaveType === 'multiple' && styles.typeBtnActive]} 
                onPress={() => setLeaveType('multiple')}
              >
                <Text style={[styles.typeBtnText, leaveType === 'multiple' && styles.typeBtnTextActive]}>Nhiều ngày</Text>
              </TouchableOpacity>
            </View>
            
            {leaveType === 'single' ? (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Ngày nghỉ</Text>
                <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowStartPicker(true)}>
                  <Calendar size={20} color="#64748b" style={{ marginRight: 8 }} />
                  <Text style={[styles.dateText, !startDate && { color: '#94a3b8' }]}>{formatDateDisplay(startDate)}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Từ ngày</Text>
                  <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowStartPicker(true)}>
                    <Calendar size={20} color="#64748b" style={{ marginRight: 4 }} />
                    <Text style={[styles.dateText, !startDate && { color: '#94a3b8' }]}>{formatDateDisplay(startDate)}</Text>
                  </TouchableOpacity>
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Đến ngày</Text>
                  <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowEndPicker(true)}>
                    <Calendar size={20} color="#64748b" style={{ marginRight: 4 }} />
                    <Text style={[styles.dateText, !endDate && { color: '#94a3b8' }]}>{formatDateDisplay(endDate)}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {isSundaySelected && (
              <View style={styles.sundayWarningBox}>
                <AlertTriangle size={16} color="#d97706" style={{ marginRight: 6 }} />
                <Text style={styles.sundayWarningText}>
                  Lưu ý: Ngày đã chọn là Chủ nhật (ngày nghỉ của trường).
                </Text>
              </View>
            )}

            <View style={styles.formGroup}>
              <Text style={styles.label}>Lý do nghỉ</Text>
              <TextInput 
                style={[styles.input, styles.textArea]} 
                placeholder="Nhập lý do..."
                multiline
                numberOfLines={4}
                value={lyDo}
                onChangeText={setLyDo}
              />
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={handleCreateRequest} disabled={submitting}>
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Gửi đơn</Text>
              )}
            </TouchableOpacity>

            {/* iOS Pickers - Rendered absolute inside main modal to avoid double-modal crash */}
            {showStartPicker && Platform.OS === "ios" && (
              <Pressable style={styles.iosAbsoluteOverlay} onPress={() => setShowStartPicker(false)}>
                <View style={styles.pickerSheet}>
                  <View style={styles.pickerHeader}>
                    <Text style={styles.pickerTitle}>Chọn ngày</Text>
                    <TouchableOpacity onPress={() => setShowStartPicker(false)}><Text style={styles.pickerDone}>Xong</Text></TouchableOpacity>
                  </View>
                  <DateTimePicker value={startDate || new Date()} mode="date" display="spinner" minimumDate={new Date()} onChange={(_, d) => { if (d) setStartDate(d); }} />
                </View>
              </Pressable>
            )}

            {showEndPicker && Platform.OS === "ios" && (
              <Pressable style={styles.iosAbsoluteOverlay} onPress={() => setShowEndPicker(false)}>
                <View style={styles.pickerSheet}>
                  <View style={styles.pickerHeader}>
                    <Text style={styles.pickerTitle}>Đến ngày</Text>
                    <TouchableOpacity onPress={() => setShowEndPicker(false)}><Text style={styles.pickerDone}>Xong</Text></TouchableOpacity>
                  </View>
                  <DateTimePicker value={endDate || new Date()} mode="date" display="spinner" minimumDate={startDate || new Date()} onChange={(_, d) => { if (d) setEndDate(d); }} />
                </View>
              </Pressable>
            )}

          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Date Pickers Android */}
      {showStartPicker && Platform.OS === "android" && (
        <DateTimePicker value={startDate || new Date()} mode="date" display="default" minimumDate={new Date()}
          onChange={(_, d) => { setShowStartPicker(false); if (d) setStartDate(d); }} />
      )}
      {showEndPicker && Platform.OS === "android" && (
        <DateTimePicker value={endDate || new Date()} mode="date" display="default" minimumDate={startDate || new Date()}
          onChange={(_, d) => { setShowEndPicker(false); if (d) setEndDate(d); }} />
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  listContent: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardDate: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: {},
  statusPending: { backgroundColor: '#fef3c7' },
  statusPendingText: { color: '#b45309', fontSize: 12, fontWeight: 'bold' },
  statusApproved: { backgroundColor: '#dcfce7' },
  statusApprovedText: { color: '#15803d', fontSize: 12, fontWeight: 'bold' },
  statusRejected: { backgroundColor: '#fee2e2' },
  statusRejectedText: { color: '#b91c1c', fontSize: 12, fontWeight: 'bold' },
  lyDo: { fontSize: 14, color: '#475569', marginBottom: 12 },
  feedbackBox: { backgroundColor: '#f8fafc', padding: 10, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#f1f5f9' },
  feedbackLabel: { fontSize: 12, fontWeight: 'bold', color: '#64748b', marginBottom: 4 },
  feedbackText: { fontSize: 13, color: '#334155' },
  deleteBtn: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#fee2e2', borderRadius: 8 },
  deleteBtnText: { color: '#dc2626', fontSize: 13, fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 64 },
  emptyText: { marginTop: 12, color: '#94a3b8', fontSize: 15 },
  fab: { position: 'absolute', right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  
  typeSelector: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 12, padding: 4, marginBottom: 16 },
  typeBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  typeBtnActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  typeBtnText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  typeBtnTextActive: { color: '#2563eb' },
  
  formGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#475569', marginBottom: 8 },
  datePickerBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: '#f8fafc' },
  dateText: { fontSize: 15, color: '#1e293b' },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: '#1e293b' },
  textArea: { height: 100, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: '#2563eb', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  
  sundayWarningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  sundayWarningText: {
    fontSize: 12,
    color: '#b45309',
    fontWeight: '600',
    flex: 1,
  },
  pickerOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  iosAbsoluteOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end', borderRadius: 24, overflow: 'hidden' },
  pickerSheet: { backgroundColor: '#fff', paddingBottom: 20 },
  pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  pickerTitle: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  pickerDone: { fontSize: 16, fontWeight: 'bold', color: '#2563eb' },
});
