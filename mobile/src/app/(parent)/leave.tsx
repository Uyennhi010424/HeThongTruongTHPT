import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, TextInput, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/axiosClient';
import { useParentStore } from '../../store/useParentStore';

export default function ParentLeaveScreen() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { selectedChild } = useParentStore();

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState({ ngayBatDau: '', ngayKetThuc: '', lyDo: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (selectedChild?.id) {
      fetchRequests();
    }
  }, [selectedChild?.id]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/don-xin-nghi/me');
      if (res.data?.data) {
        setRequests(res.data.data.filter((r: any) => r.hocSinhId === selectedChild?.id));
      }
    } catch (error) {
      console.error('Lỗi lấy đơn xin nghỉ:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async () => {
    if (!formData.ngayBatDau || !formData.ngayKetThuc || !formData.lyDo) {
      Alert.alert("Lỗi", "Vui lòng nhập đủ thông tin (Ngày định dạng YYYY-MM-DD)");
      return;
    }
    try {
      setSubmitting(true);
      await api.post('/don-xin-nghi', {
        ...formData,
        hocSinhId: selectedChild?.id
      });
      Alert.alert("Thành công", "Đã tạo đơn xin nghỉ");
      setModalVisible(false);
      setFormData({ ngayBatDau: '', ngayKetThuc: '', lyDo: '' });
      fetchRequests();
    } catch (error: any) {
      Alert.alert("Lỗi", error.response?.data?.message || "Không thể tạo đơn");
    } finally {
      setSubmitting(false);
    }
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
            } catch (e) {
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
              <Ionicons name="calendar-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>Chưa có đơn xin nghỉ nào</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Xin nghỉ cho {selectedChild?.hoTen}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Từ ngày (YYYY-MM-DD)</Text>
              <TextInput 
                style={styles.input} 
                placeholder="2026-05-20"
                value={formData.ngayBatDau}
                onChangeText={(t) => setFormData({...formData, ngayBatDau: t})}
              />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Đến ngày (YYYY-MM-DD)</Text>
              <TextInput 
                style={styles.input} 
                placeholder="2026-05-20"
                value={formData.ngayKetThuc}
                onChangeText={(t) => setFormData({...formData, ngayKetThuc: t})}
              />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Lý do nghỉ</Text>
              <TextInput 
                style={[styles.input, styles.textArea]} 
                placeholder="Nhập lý do..."
                multiline
                numberOfLines={4}
                value={formData.lyDo}
                onChangeText={(t) => setFormData({...formData, lyDo: t})}
              />
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={handleCreateRequest} disabled={submitting}>
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Gửi đơn</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  childSelector: { flexDirection: 'row', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  childBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f1f5f9', marginRight: 8 },
  childBtnActive: { backgroundColor: '#2563eb' },
  childBtnText: { color: '#64748b', fontWeight: 'bold' },
  childBtnTextActive: { color: '#fff' },
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
  formGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#475569', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: '#1e293b' },
  textArea: { height: 100, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: '#2563eb', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
