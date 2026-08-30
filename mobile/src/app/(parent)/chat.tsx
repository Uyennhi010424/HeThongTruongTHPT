import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Vibration, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Send } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/useAuthStore';
import { useParentStore } from '../../store/useParentStore';
import axiosClient from '../../api/axiosClient';
import { webSocketService } from '../../api/websocket';

interface Message {
  id: number;
  noiDung: string;
  ngayDang: string;
  nguoiTao?: {
    id: number;
    hoTen: string;
  };
  parentId?: number;
  senderRole?: string;
}

export default function ChatScreen() {
  const router = useRouter();
  const { userData } = useAuthStore();
  const { selectedChild } = useParentStore();
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = async () => {
    if (!selectedChild) return;
    try {
      const res = await axiosClient.get(`/thongbao/hocsinh/${selectedChild.id}`);
      if (res.data?.success) {
        setMessages(res.data.data);
      }
    } catch (error) {
      console.log("Failed to fetch messages:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();

    // Kết nối WebSocket và nhận tin nhắn real-time
    webSocketService.connect(() => {
      if (selectedChild) {
        webSocketService.subscribe(`/topic/chat/${selectedChild.id}`, (newMessage: Message) => {
          setMessages(prev => {
            const exists = prev.some(m => m.id === newMessage.id);
            if (!exists) {
              if (newMessage.senderRole && newMessage.senderRole !== 'PHU_HUYNH') {
                // Remove Alert.alert and vibration when inside the chat
              }
              return [...prev, newMessage];
            }
            return prev;
          });
        });
      }
    });

    return () => {
      if (selectedChild) {
        webSocketService.unsubscribe(`/topic/chat/${selectedChild.id}`);
      }
    };
  }, [selectedChild]);

  const handleSend = async () => {
    if (!inputText.trim() || !selectedChild) return;
    
    const textToSend = inputText.trim();
    setInputText('');

    try {
      if (messages.length === 0) {
        // Start a new thread
        const gvcnId = selectedChild.lop?.gvcn?.id;
        const payload = {
          tieuDe: `Tin nhắn từ phụ huynh bé ${selectedChild.hoTen}`,
          noiDung: textToSend,
          doiTuong: 'CA_NHAN',
          hocSinh: { id: selectedChild.id },
          senderRole: 'PHU_HUYNH'
        };
        const res = await axiosClient.post('/thongbao', payload);
        if (res.data?.success) {
          setMessages([res.data.data]);
        }
      } else {
        // Reply to existing thread
        const rootId = messages[0].parentId || messages[0].id;
        const payload = {
          noiDung: textToSend,
          senderRole: 'PHU_HUYNH',
          hocSinh: { id: selectedChild.id },
          doiTuong: 'CA_NHAN'
        };
        const res = await axiosClient.post(`/thongbao/reply/${rootId}`, payload);
        if (res.data?.success) {
          // let WebSocket handle adding the message to avoid duplicate keys, 
          // but we also check if it exists just in case
          setMessages(prev => {
            if (prev.some(m => m.id === res.data.data.id)) return prev;
            return [...prev, res.data.data];
          });
        }
      }
    } catch (error) {
      console.log("Failed to send message:", error);
      Alert.alert("Lỗi", "Không thể gửi tin nhắn");
    }
  };

  const formatTime = (isoString: string) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>
            GVCN {selectedChild?.lop?.gvcn?.hoTen || 'Lớp'}
          </Text>
          <Text style={styles.headerSub}>
            Lớp {selectedChild?.lop?.tenLop || ''}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          contentContainerStyle={styles.chatContainer}
          showsVerticalScrollIndicator={false}
          ref={(ref) => ref?.scrollToEnd({ animated: true })}
        >
          {loading ? (
             <Text style={{ textAlign: 'center', marginTop: 20, color: '#64748B' }}>Đang tải tin nhắn...</Text>
          ) : messages.length === 0 ? (
             <Text style={{ textAlign: 'center', marginTop: 20, color: '#64748B' }}>Chưa có tin nhắn nào. Gửi tin nhắn đầu tiên cho GVCN!</Text>
          ) : (
            messages.map(msg => {
              // Cải thiện logic isMe: check id nếu có, nếu không thì fallback qua senderRole. 
              // Phụ huynh sẽ thấy tin nhắn của mình (hoặc người nhà) bên phải, GV bên trái.
              const isMe = (msg.nguoiTao && msg.nguoiTao.id === userData?.id) 
                            || msg.senderRole === userData?.role 
                            || msg.senderRole === 'PHU_HUYNH';

              return (
                <View key={msg.id} style={[styles.messageWrapper, isMe ? styles.messageWrapperMe : styles.messageWrapperThem]}>
                  <View style={[styles.messageBubble, isMe ? styles.messageBubbleMe : styles.messageBubbleThem]}>
                    <Text style={[styles.messageText, isMe ? styles.messageTextMe : styles.messageTextThem]}>
                      {msg.noiDung}
                    </Text>
                  </View>
                  <Text style={styles.timeText}>{formatTime(msg.ngayDang)}</Text>
                </View>
              );
            })
          )}
        </ScrollView>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Nhập tin nhắn..."
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity 
            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]} 
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Send size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  headerInfo: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  chatContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  messageWrapper: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  messageWrapperMe: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  messageWrapperThem: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  messageBubbleMe: {
    backgroundColor: '#2563EB',
    borderBottomRightRadius: 4,
  },
  messageBubbleThem: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  messageTextMe: {
    color: '#FFFFFF',
  },
  messageTextThem: {
    color: '#334155',
  },
  timeText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
    marginHorizontal: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  input: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  sendBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
});
