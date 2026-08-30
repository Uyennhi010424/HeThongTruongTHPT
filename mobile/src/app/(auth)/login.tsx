import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, 
  StyleSheet, Image, Dimensions, KeyboardAvoidingView, Platform, ScrollView 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/useAuthStore';
import axiosClient from '../../api/axiosClient';
import { useRouter } from 'expo-router';
import { User, Lock, Eye, EyeOff, RefreshCcw, CheckSquare, Square } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';

const { width, height } = Dimensions.get('window');

// Random captcha generator
const generateCaptcha = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  const [captchaText, setCaptchaText] = useState(generateCaptcha());
  const [captchaInput, setCaptchaInput] = useState('');
  
  const [loading, setLoading] = useState(false);
  
  const { signIn } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const loadCredentials = async () => {
      try {
        const saved = await SecureStore.getItemAsync('savedCredentials');
        if (saved) {
          const { u, p } = JSON.parse(saved);
          setUsername(u);
          setPassword(p);
          setRememberMe(true);
        }
      } catch (e) {}
    };
    loadCredentials();
  }, []);

  const handleRefreshCaptcha = () => {
    setCaptchaText(generateCaptcha());
    setCaptchaInput('');
  };

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Lỗi', 'Vui lòng nhập tài khoản và mật khẩu.');
      return;
    }
    
    if (captchaInput.toLowerCase() !== captchaText.toLowerCase()) {
      Alert.alert('Lỗi', 'Mã xác thực không chính xác.');
      handleRefreshCaptcha();
      return;
    }

    setLoading(true);
    try {
      const response = await axiosClient.post('/auth/login', { username, password, device: "mobile" });
      if (response.data && response.data.data) {
        const { token, role } = response.data.data;
        if (role === 'HOC_SINH' || role === 'PHU_HUYNH') {
          let userData: any = { id: 0, username: username, role: role };
          try {
            if (role === 'HOC_SINH') {
              const profileRes = await axiosClient.get('/hocsinh/me', { headers: { Authorization: `Bearer ${token}` } });
              const hsInfo = profileRes.data?.data;
              if (hsInfo) {
                userData = { ...userData, id: hsInfo.id, hocSinhId: hsInfo.id, username: hsInfo.hoTen || username };
              }
            } else if (role === 'PHU_HUYNH') {
              const profileRes = await axiosClient.get('/phuhuynh/me', { headers: { Authorization: `Bearer ${token}` } });
              const phInfo = profileRes.data?.data;
              if (phInfo) {
                userData = { ...userData, id: phInfo.id, phuHuynhId: phInfo.id, username: phInfo.hoTen || username };
              }
            }
          } catch (profileError) {
            console.log('Lỗi lấy thông tin profile:', profileError);
          }

          if (rememberMe) {
            await SecureStore.setItemAsync('savedCredentials', JSON.stringify({ u: username, p: password }));
          } else {
            await SecureStore.deleteItemAsync('savedCredentials');
          }

          await signIn(token, userData, rememberMe);
        } else {
          Alert.alert('Từ chối truy cập', 'Ứng dụng chỉ dành cho Học sinh và Phụ huynh.');
        }
      }
    } catch (error: any) {
      let msg = 'Không thể kết nối đến máy chủ.';
      if (error.response?.data?.message) {
        msg = error.response.data.message;
      }
      Alert.alert('Đăng nhập thất bại', msg);
      handleRefreshCaptcha();
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} bounces={false} showsVerticalScrollIndicator={false}>
          
          {/* Header Logo */}
          <SafeAreaView style={styles.header} edges={['top']}>
            <View style={styles.logoContainer}>
              <Image source={require('../../../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
            </View>
          </SafeAreaView>

          {/* Form Card */}
          <View style={styles.formContainer}>
            <View style={styles.card}>
              
              <View style={styles.titleContainer}>
                <Text style={styles.title}>Đăng nhập hệ thống</Text>
                <Text style={styles.subtitle}>Vui lòng đăng nhập để tiếp tục</Text>
              </View>

              {/* Username */}
              <View style={styles.inputWrapper}>
                <View style={styles.iconContainer}>
                  <User size={20} color="#6B7280" />
                </View>
                <TextInput
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  placeholder="Tên đăng nhập hoặc Email"
                  placeholderTextColor="#9CA3AF"
                  style={styles.input}
                />
              </View>

              {/* Password */}
              <View style={styles.inputWrapper}>
                <View style={styles.iconContainer}>
                  <Lock size={20} color="#6B7280" />
                </View>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholder="Mật khẩu"
                  placeholderTextColor="#9CA3AF"
                  style={styles.input}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  {showPassword ? <EyeOff size={20} color="#6B7280" /> : <Eye size={20} color="#6B7280" />}
                </TouchableOpacity>
              </View>

              {/* Captcha */}
              <View style={styles.captchaRow}>
                <View style={[styles.inputWrapper, { flex: 1, marginBottom: 0 }]}>
                  <TextInput
                    value={captchaInput}
                    onChangeText={setCaptchaInput}
                    autoCapitalize="none"
                    placeholder="Mã xác thực"
                    placeholderTextColor="#9CA3AF"
                    style={styles.input}
                  />
                </View>
                <View style={styles.captchaDisplay}>
                  <Text style={styles.captchaValue}>{captchaText}</Text>
                  {/* Fake noise lines */}
                  <View style={[styles.noiseLine, { top: '30%', transform: [{ rotate: '5deg' }] }]} />
                  <View style={[styles.noiseLine, { top: '60%', transform: [{ rotate: '-8deg' }] }]} />
                </View>
                <TouchableOpacity onPress={handleRefreshCaptcha} style={styles.refreshBtn}>
                  <RefreshCcw size={20} color="#2563EB" />
                </TouchableOpacity>
              </View>

              {/* Remember Me */}
              <View style={styles.rememberRow}>
                <TouchableOpacity 
                  style={styles.checkboxBtn} 
                  onPress={() => setRememberMe(!rememberMe)}
                  activeOpacity={0.7}
                >
                  {rememberMe ? (
                    <CheckSquare size={20} color="#2563EB" />
                  ) : (
                    <Square size={20} color="#9CA3AF" />
                  )}
                  <Text style={styles.rememberText}>Ghi nhớ đăng nhập</Text>
                </TouchableOpacity>
              </View>

              {/* Login Button */}
              <TouchableOpacity onPress={handleLogin} disabled={loading} activeOpacity={0.8}>
                <LinearGradient
                  colors={['#2563EB', '#1D4ED8']}
                  style={styles.loginBtn}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.loginBtnText}>Đăng nhập</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
              
            </View>
            
            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>© EduManager Pro</Text>
              <Text style={styles.footerSubText}>Hệ thống quản lý điểm học sinh THPT</Text>
            </View>
          </View>
          
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingTop: 40,
    paddingBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logo: {
    width: '90%',
    height: 150,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  iconContainer: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    height: '100%',
  },
  eyeIcon: {
    padding: 4,
  },
  captchaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  captchaDisplay: {
    backgroundColor: '#EFF6FF',
    height: 52,
    width: 100,
    borderRadius: 12,
    marginLeft: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    overflow: 'hidden',
  },
  captchaValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E3A8A',
    letterSpacing: 4,
    fontStyle: 'italic',
  },
  noiseLine: {
    position: 'absolute',
    width: '120%',
    height: 2,
    backgroundColor: 'rgba(37, 99, 235, 0.4)',
    left: '-10%',
  },
  refreshBtn: {
    height: 52,
    width: 52,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },
  checkboxBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rememberText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  loginBtn: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 40,
    marginBottom: 30,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  footerSubText: {
    fontSize: 13,
    color: '#9CA3AF',
  }
});
