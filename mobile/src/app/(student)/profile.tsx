import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Mail, Phone, MapPin, Calendar as CalendarIcon, User as UserIcon, Camera } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useDashboardStore } from '../../store/useDashboardStore';
import axiosClient from '../../api/axiosClient';

export default function ProfileScreen() {
  const router = useRouter();
  const { data, fetchData } = useDashboardStore();
  const student = data?.student;
  const [uploading, setUploading] = useState(false);
  const [localAvatar, setLocalAvatar] = useState<string | null>(null);

  const getAvatarUri = () => {
    if (localAvatar) return localAvatar;
    if (!student?.anhDaiDien) return null;
    if (student.anhDaiDien.startsWith('http')) return student.anhDaiDien;
    const baseURL = axiosClient.defaults.baseURL?.replace('/api', '') || 'http://192.168.110.210:8080';
    return `${baseURL}${student.anhDaiDien.startsWith('/') ? '' : '/'}${student.anhDaiDien}`;
  };

  const handlePickAvatar = async () => {
    // Xin quyền truy cập thư viện ảnh
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Thông báo', 'Cần cấp quyền truy cập thư viện ảnh để thay đổi ảnh đại diện.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setLocalAvatar(asset.uri);
      await uploadAvatar(asset);
    }
  };

  const uploadAvatar = async (asset: ImagePicker.ImagePickerAsset) => {
    try {
      setUploading(true);

      const filename = asset.uri.split('/').pop() || 'avatar.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      const formData = new FormData();
      formData.append('file', {
        uri: asset.uri,
        name: filename,
        type,
      } as any);

      // Bước 1: Upload file lên server
      const uploadRes = await axiosClient.post('/upload/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const newAvatarUrl = uploadRes.data?.data?.url;
      if (!newAvatarUrl) throw new Error('Không nhận được URL ảnh từ server');

      // Bước 2: Cập nhật avatar qua endpoint chuyên dụng
      await axiosClient.patch('/hocsinh/me/avatar', { anhDaiDien: newAvatarUrl });

      // Bước 3: Làm mới dữ liệu dashboard
      await fetchData();

      Alert.alert('Thành công', 'Cập nhật ảnh đại diện thành công!');
    } catch (error: any) {
      setLocalAvatar(null);
      const msg = error?.response?.data?.message || error?.message || 'Không thể tải ảnh lên. Vui lòng thử lại.';
      Alert.alert('Lỗi', msg);
    } finally {
      setUploading(false);
    }
  };

  const InfoItem = ({ icon, label, value }: { icon: any, label: string, value: string }) => (
    <View style={styles.infoRow}>
      <View style={styles.iconContainer}>{icon}</View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || 'Chưa cập nhật'}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hồ sơ cá nhân</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarSection}>
          {/* Avatar có nút camera */}
          <TouchableOpacity style={styles.avatarWrapper} onPress={handlePickAvatar} disabled={uploading}>
            <Image
              source={getAvatarUri() ? { uri: getAvatarUri()! } : require('../../../assets/images/logo.png')}
              style={styles.avatar}
            />
            <View style={styles.cameraOverlay}>
              {uploading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Camera size={18} color="#FFFFFF" />
              )}
            </View>
          </TouchableOpacity>

          <Text style={styles.name}>{student?.hoTen}</Text>
          <Text style={styles.className}>Lớp {student?.lop?.tenLop}</Text>
          <TouchableOpacity style={styles.changeAvatarBtn} onPress={handlePickAvatar} disabled={uploading}>
            <Text style={styles.changeAvatarText}>
              {uploading ? 'Đang tải lên...' : 'Thay đổi ảnh đại diện'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Thông tin liên hệ</Text>
          <InfoItem icon={<Mail size={20} color="#3B82F6" />} label="Email" value={student?.email || ''} />
          <InfoItem icon={<Phone size={20} color="#10B981" />} label="Số điện thoại" value={(student as any)?.sdt || student?.soDienThoai || ''} />
          <InfoItem icon={<MapPin size={20} color="#F59E0B" />} label="Địa chỉ" value={student?.diaChi || ''} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Thông tin cơ bản</Text>
          <InfoItem 
            icon={<CalendarIcon size={20} color="#8B5CF6" />} 
            label="Ngày sinh" 
            value={student?.ngaySinh ? new Date(student.ngaySinh).toLocaleDateString('vi-VN') : ''} 
          />
          <InfoItem 
            icon={<UserIcon size={20} color="#EC4899" />} 
            label="Giới tính" 
            value={student?.gioiTinh === 'NAM' ? 'Nam' : student?.gioiTinh === 'NU' ? 'Nữ' : (student?.gioiTinh as any || '')} 
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  scrollContent: {
    padding: 20,
    gap: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#E2E8F0',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 4,
  },
  className: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 12,
  },
  changeAvatarBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  changeAvatarText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '500',
  },
});
