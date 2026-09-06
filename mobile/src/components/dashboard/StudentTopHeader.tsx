import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Menu, Bell } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDashboardStore } from '../../store/useDashboardStore';

export const StudentTopHeader: React.FC = () => {
  const router = useRouter();
  const { data, setIsMenuOpen } = useDashboardStore();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const updateUnreadCount = async () => {
      try {
        const stored = await AsyncStorage.getItem('readNotices');
        const readIds = stored ? JSON.parse(stored) : [];
        const notices = data?.notices || [];
        const unread = notices.filter((n: any) => !readIds.includes(n.id)).length;
        setUnreadCount(unread);
      } catch (e) {}
    };
    updateUnreadCount();
  }, [data?.notices]);

  return (
    <LinearGradient
      colors={['#143872', '#0A2652']}
      style={styles.headerGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView edges={['top']}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setIsMenuOpen(true)}>
            <Menu size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <Image
            source={require('../../../assets/images/logo.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />

          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/(student)/notifications')}>
            <Bell size={24} color="#FFFFFF" />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  headerGradient: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    backgroundColor: '#143872',
    zIndex: 100,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  headerLogo: {
    height: 44,
    width: 150,
    tintColor: '#FFFFFF',
  },
  iconBtn: {
    padding: 8,
    position: 'relative',
    borderRadius: 12,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
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
});
