import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Menu, Bell } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StudentInfo } from '../../models/dashboard.type';
import axiosClient from '../../api/axiosClient';
import { BASE_URL } from '@/constants/config';

interface HeaderSectionProps {
  student: StudentInfo | null;
  unreadCount: number;
  onNotificationPress: () => void;
  onMenuPress: () => void;
}

export const HeaderSection: React.FC<HeaderSectionProps> = ({
  student,
  unreadCount,
  onNotificationPress,
  onMenuPress
}) => {
  const [imageError, setImageError] = useState(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng ';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối ';
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
    <LinearGradient
      colors={['#143872', '#0A2652']}
      style={styles.headerGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView edges={['top']}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.iconBtn} onPress={onMenuPress}>
            <Menu size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <Image
            source={require('../../../assets/images/logo.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />

          <TouchableOpacity style={styles.iconBtn} onPress={onNotificationPress}>
            <Bell size={24} color="#FFFFFF" />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.headerInfo}>
          <View style={styles.infoText}>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.name}>{student?.hoTen || 'Học sinh'}</Text>
            <View style={styles.classBadge}>
              <Text style={styles.className}>Lớp: {student?.lop?.tenLop || 'Chưa phân lớp'}</Text>
            </View>
          </View>
          <View style={styles.avatarContainer}>
            {avatarUri && !imageError ? (
              <Image
                source={{ uri: avatarUri }}
                style={styles.avatar}
                onError={() => setImageError(true)}
              />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitial}>
                  {getInitials(student?.hoTen)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  headerGradient: {
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 24,
    zIndex: 100,
    shadowColor: '#0f3167ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
  },
  headerLogo: {
    height: 48,
    width: 160,
    tintColor: '#FFFFFF',
  },
  iconBtn: {
    padding: 8,
    position: 'relative',
    borderRadius: 12,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: '#143872',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  headerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  infoText: {
    flex: 1,
  },
  greeting: {
    color: '#E0E7FF',
    fontSize: 14,
    marginBottom: 4,
    fontWeight: '500',
  },
  name: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  classBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  className: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
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
    color: '#143872',
    fontSize: 22,
    fontWeight: 'bold',
  },
});
