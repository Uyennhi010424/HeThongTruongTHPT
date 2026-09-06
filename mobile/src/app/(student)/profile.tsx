import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { 
  ChevronLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar as CalendarIcon, 
  User as UserIcon, 
  Camera, 
  GraduationCap, 
  IdCard, 
  ShieldCheck, 
  BookOpen,
  UserCheck,
  Heart
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useDashboardStore } from '../../store/useDashboardStore';
import axiosClient from '../../api/axiosClient';
import { BASE_URL } from '@/constants/config';

export default function ProfileScreen() {
  const router = useRouter();
  const { data, fetchData } = useDashboardStore();
  const student = data?.student;
  const [uploading, setUploading] = useState(false);
  const [localAvatar, setLocalAvatar] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  const getAvatarUri = () => {
    if (localAvatar) return localAvatar;
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

  const handlePickAvatar = async () => {
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

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setImageError(false);
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

      const uploadRes = await axiosClient.post('/upload/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const newAvatarUrl = uploadRes.data?.data?.url;
      if (!newAvatarUrl) throw new Error('Không nhận được URL ảnh từ server');

      await axiosClient.patch('/hocsinh/me/avatar', { anhDaiDien: newAvatarUrl });
      await fetchData();
      Alert.alert('Thành công', 'Cập nhật ảnh đại diện thành công!');
    } catch (error: any) {
      console.log('Error uploading avatar:', error);
      Alert.alert('Thất bại', 'Không thể tải ảnh lên. Vui lòng thử lại.');
      setLocalAvatar(null);
    } finally {
      setUploading(false);
    }
  };

  const avatarUri = getAvatarUri();

  const InfoItem = ({ icon, label, value }: { icon: any; label: string; value: string | number | undefined | null }) => (
    <View style={styles.infoRow}>
      <View style={styles.iconContainer}>{icon}</View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value ? String(value) : 'Chưa cập nhật'}</Text>
      </View>
    </View>
  );

  const getGenderText = () => {
    if (student?.gioiTinh === 'NAM' || student?.gioiTinh === true) return 'Nam';
    if (student?.gioiTinh === 'NU' || student?.gioiTinh === false) return 'Nữ';
    return 'Chưa cập nhật';
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Chưa cập nhật';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('vi-VN');
    } catch {
      return dateStr;
    }
  };

  const gvcnName = student?.lop?.gvcn?.hoTen || student?.lop?.giaoVienChuNhiem?.hoTen;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Phần Avatar & Tên học sinh */}
        <View style={styles.avatarSection}>
          <TouchableOpacity 
            style={styles.avatarWrapper} 
            onPress={handlePickAvatar} 
            disabled={uploading}
            activeOpacity={0.85}
          >
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
            <View style={styles.cameraOverlay}>
              {uploading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Camera size={16} color="#FFFFFF" />
              )}
            </View>
          </TouchableOpacity>

          <Text style={styles.name}>{student?.hoTen || 'Học sinh'}</Text>
          <View style={styles.badgeRow}>
            <View style={styles.codeBadge}>
              <Text style={styles.codeText}>Mã: {student?.maHocSinh || 'N/A'}</Text>
            </View>
            {student?.lop?.tenLop && (
              <View style={styles.classBadge}>
                <Text style={styles.classText}>Lớp {student.lop.tenLop}</Text>
              </View>
            )}
          </View>
        </View>

        {/* 1. Thông tin học tập */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Thông tin học tập</Text>
          <InfoItem 
            icon={<IdCard size={18} color="#2563EB" />} 
            label="Mã số học sinh" 
            value={student?.maHocSinh} 
          />
          <InfoItem 
            icon={<GraduationCap size={18} color="#059669" />} 
            label="Lớp học hiện tại" 
            value={student?.lop?.tenLop ? `Lớp ${student.lop.tenLop} (Khối ${student.lop.khoi || ''})` : 'Chưa phân lớp'} 
          />
          {student?.lop?.namHoc && (
            <InfoItem 
              icon={<CalendarIcon size={18} color="#D97706" />} 
              label="Năm học" 
              value={student.lop.namHoc} 
            />
          )}
          {gvcnName && (
            <InfoItem 
              icon={<UserCheck size={18} color="#7C3AED" />} 
              label="Giáo viên chủ nhiệm" 
              value={gvcnName} 
            />
          )}
          <InfoItem 
            icon={<BookOpen size={18} color="#0891B2" />} 
            label="Năm nhập học" 
            value={student?.namNhapHoc ? `Năm ${student.namNhapHoc}` : ''} 
          />
          <InfoItem 
            icon={<ShieldCheck size={18} color="#16A34A" />} 
            label="Trạng thái học tập" 
            value={student?.trangThai === 1 ? 'Đang học' : student?.trangThai === 0 ? 'Đã nghỉ học / Chuyển trường' : 'Đang học'} 
          />
        </View>

        {/* 2. Thông tin cá nhân */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Thông tin cá nhân</Text>
          <InfoItem 
            icon={<CalendarIcon size={18} color="#8B5CF6" />} 
            label="Ngày sinh" 
            value={formatDate(student?.ngaySinh)} 
          />
          <InfoItem 
            icon={<UserIcon size={18} color="#EC4899" />} 
            label="Giới tính" 
            value={getGenderText()} 
          />
          <InfoItem 
            icon={<UserCheck size={18} color="#6366F1" />} 
            label="Dân tộc" 
            value={student?.danToc || 'Kinh'} 
          />
          <InfoItem 
            icon={<Heart size={18} color="#F43F5E" />} 
            label="Tôn giáo" 
            value={student?.tonGiao || 'Không'} 
          />
          <InfoItem 
            icon={<ShieldCheck size={18} color="#0D9488" />} 
            label="Mã thẻ BHYT" 
            value={student?.maBhyt || 'Chưa cập nhật'} 
          />
          <InfoItem 
            icon={<IdCard size={18} color="#EA580C" />} 
            label="Diện chính sách" 
            value={student?.dienChinhSach ? 'Thuộc diện chính sách' : 'Không'} 
          />
        </View>

        {/* 3. Thông tin liên hệ */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Thông tin liên hệ</Text>
          <InfoItem 
            icon={<Phone size={18} color="#10B981" />} 
            label="Số điện thoại" 
            value={student?.sdt || student?.soDienThoai} 
          />
          <InfoItem 
            icon={<Mail size={18} color="#3B82F6" />} 
            label="Địa chỉ Email" 
            value={student?.email} 
          />
          <InfoItem 
            icon={<MapPin size={18} color="#F59E0B" />} 
            label="Địa chỉ thường trú" 
            value={student?.diaChi} 
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 36,
  },
  avatarSection: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#E2E8F0',
    borderWidth: 3,
    borderColor: '#EFF6FF',
  },
  avatarFallback: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#143872',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#EFF6FF',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: 'bold',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  codeBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  codeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  classBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  classText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '500',
  },
});
