import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Calendar, FileText, Book, Award, Library, FileStack, MessageSquare } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export const UtilitiesGrid: React.FC = () => {
  const router = useRouter();

  const utilities = [
    { icon: <FileText size={24} color="#10B981" />, name: 'Xem điểm', route: '/(student)/scores' },
    { icon: <Book size={24} color="#8B5CF6" />, name: 'Bài tập', route: '/(student)/exam' },
    { icon: <Calendar size={24} color="#F59E0B" />, name: 'Chuyên cần', route: '/(student)/attendance' },
    { icon: <Library size={24} color="#EC4899" />, name: 'Thư viện', route: '/(student)/library' },
    { icon: <FileStack size={24} color="#14B8A6" />, name: 'Tài liệu', route: '/(student)/documents' },
    { icon: <MessageSquare size={24} color="#F43F5E" />, name: 'Góp ý', route: '/(student)/feedback' },
  ];

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Tiện ích</Text>
      <View style={styles.utilitiesGrid}>
        {utilities.map((item, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.utilityItem}
            onPress={() => item.route ? router.push(item.route as any) : null}
            activeOpacity={0.7}
          >
            <View style={styles.utilityIconBox}>
              {item.icon}
            </View>
            <Text style={styles.utilityText}>{item.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  utilitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    marginTop: 16,
  },
  utilityItem: {
    width: '30%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    marginBottom: 16,
  },
  utilityIconBox: {
    marginBottom: 8,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 14,
  },
  utilityText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
    textAlign: 'center',
  },
});
