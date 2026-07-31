import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput } from 'react-native';

export default function ParentConduct() {
  const records = [
    { id: 1, date: '15/10/2024', type: 'Chuyên cần', content: 'Nghỉ học không phép', teacher: 'Lê Thị B' },
    { id: 2, date: '10/10/2024', type: 'Kỷ luật', content: 'Nói chuyện trong giờ học Toán', teacher: 'Nguyễn Văn A' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.list}>
        {records.map((record) => (
          <View key={record.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.dateText}>{record.date}</Text>
              <Text style={[styles.typeBadge, record.type === 'Kỷ luật' ? styles.typeDiscipline : styles.typeAttendance]}>
                {record.type}
              </Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.contentText}>{record.content}</Text>
              <Text style={styles.teacherText}>Giáo viên ghi nhận: {record.teacher}</Text>
            </View>
            
            {/* Phản hồi */}
            <View style={styles.feedbackSection}>
              <Text style={styles.feedbackLabel}>Phản hồi cho giáo viên:</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập nội dung phản hồi..."
                  placeholderTextColor="#94a3b8"
                />
                <TouchableOpacity style={styles.sendBtn}>
                  <Text style={styles.sendBtnText}>Gửi</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  list: {
    padding: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dateText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#334155',
  },
  typeBadge: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  typeDiscipline: {
    color: '#ef4444',
    backgroundColor: '#fee2e2',
  },
  typeAttendance: {
    color: '#f59e0b',
    backgroundColor: '#fef3c7',
  },
  cardBody: {
    padding: 16,
  },
  contentText: {
    fontSize: 16,
    color: '#0f172a',
    marginBottom: 8,
  },
  teacherText: {
    fontSize: 13,
    color: '#64748b',
  },
  feedbackSection: {
    padding: 16,
    backgroundColor: '#fafaf9',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  feedbackLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  sendBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  sendBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
