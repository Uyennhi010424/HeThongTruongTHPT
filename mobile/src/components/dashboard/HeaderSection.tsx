import React, { useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { StudentInfo } from '../../models/dashboard.type';
import axiosClient from '../../api/axiosClient';
import { BASE_URL } from '@/constants/config';

interface HeaderSectionProps {
  student: StudentInfo | null;
  unreadCount?: number;
  onNotificationPress?: () => void;
  onMenuPress?: () => void;
}

export const HeaderSection: React.FC<HeaderSectionProps> = ({
  student,
}) => {
  const [imageError, setImageError] = useState(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  const getAvatarUri = () => {
    if (!student?.anhDaiDien) return null;
    if (student.anhDaiDien.startsWith('http')) return student.anhDaiDien;
    const baseURL = axiosClient.defaults.baseURL?.replace('/api', '') || BASE_URL;
    return `${baseURL}${student.anhDaiDien.startsWith('/') ? '' : '/'}${student.anhDaiDien}`;
  };

  const getInitials = (name?: string) => {
    if (!name) return 'HS';
    const parts = name.trim().split(/\s+/);
    return parts[parts.length - 1].charAt(0).toUpperCase();
  };

  const avatarUri = getAvatarUri();

  return (
    <View style={styles.cardContainer}>
      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          {avatarUri && !imageError ? (
            <Image
              source={{ uri: avatarUri }}
              style={styles.avatar}
              onError={() => setImageError(true)}
            />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitial}>{getInitials(student?.hoTen)}</Text>
            </View>
          )}
        </View>

        <View style={styles.infoText}>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.name}>{student?.hoTen || 'Học sinh'}</Text>
          <View style={styles.classRow}>
            <View style={styles.classBadge}>
              <Text style={styles.className}>Lớp: {student?.lop?.tenLop || 'Chưa phân lớp'}</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EFF6FF',
    marginRight: 14,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#1E3A8A',
    fontSize: 20,
    fontWeight: 'bold',
  },
  infoText: {
    flex: 1,
  },
  greeting: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 2,
  },
  name: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  classRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  classBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  className: {
    color: '#1D4ED8',
    fontSize: 12,
    fontWeight: '600',
  },
});
