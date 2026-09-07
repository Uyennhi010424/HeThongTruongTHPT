import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Target, CheckCircle, BarChart2 } from 'lucide-react-native';
import { DashboardData } from '../../models/dashboard.type';
import { useRouter } from 'expo-router';

interface QuickFunctionsProps {
  data: DashboardData | null;
}

export const QuickFunctions: React.FC<QuickFunctionsProps> = ({ data }) => {
  const router = useRouter();
  
  const gpa = data?.gpa !== null && data?.gpa !== undefined ? data.gpa.toFixed(1) : '--';
  const gpaNum = gpa !== '--' ? parseFloat(gpa) : null;
  
  const getConductText = () => {
    if (!data?.conducts || data.conducts.length === 0) return 'Chưa có';

    const now = new Date();
    const curMonth = now.getMonth();
    const curYear = now.getFullYear();
    const currentNamHoc = data?.student?.lop?.namHoc || (curMonth >= 7 ? `${curYear}-${curYear + 1}` : `${curYear - 1}-${curYear}`);

    const currentYearConducts = data.conducts.filter((c: any) => {
      const yearStr = c.namHoc?.tenNamHoc || c.namHoc || c.tenNamHoc;
      return yearStr === currentNamHoc;
    });

    if (currentYearConducts.length === 0) {
      return 'Chưa có';
    }

    const latest = currentYearConducts.sort((a: any, b: any) => Number(b.hocKy || 0) - Number(a.hocKy || 0))[0];
    const type = latest?.xepLoai;

    switch (type) {
      case 'TOT': return 'Tốt';
      case 'KHA': return 'Khá';
      case 'TRUNG_BINH': return 'TB';
      case 'YEU': return 'Yếu';
      default: return type || 'Chưa có';
    }
  };

  const conduct = getConductText();

  const quickFunctions = [
    { 
      icon: <Target size={28} color="#2563EB" />, 
      name: 'Điểm TB', 
      value: gpa,
      onPress: () => router.push('/(student)/scores' as any) 
    },
    { 
      icon: <CheckCircle size={28} color="#10B981" />, 
      name: 'Hạnh kiểm', 
      value: conduct,
      onPress: () => router.push({ pathname: '/(student)/attendance', params: { tab: 'hanhkiem' } } as any) 
    },
    { 
      icon: <BarChart2 size={28} color="#F59E0B" />, 
      name: 'Học lực', 
      value: gpaNum === null ? 'Chưa có' : (gpaNum >= 8.0 ? 'Giỏi' : gpaNum >= 6.5 ? 'Khá' : gpaNum >= 5.0 ? 'TB' : 'Yếu'),
      onPress: () => router.push('/(student)/scores' as any) 
    }
  ];

  return (
    <View style={styles.quickFunctionsCard}>
      {quickFunctions.map((item, index) => (
        <TouchableOpacity 
          key={index} 
          style={styles.quickItem}
          onPress={item.onPress}
          activeOpacity={0.7}
        >
          <View style={styles.iconWrapper}>
            {item.icon}
          </View>
          {item.value !== null && <Text style={styles.quickValue}>{item.value}</Text>}
          <Text style={styles.quickLabel}>{item.name}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  quickFunctionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    paddingHorizontal: 10,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 24,
  },
  quickItem: {
    alignItems: 'center',
    flex: 1,
  },
  iconWrapper: {
    marginBottom: 8,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 16,
  },
  quickValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
  },
  quickLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
});
