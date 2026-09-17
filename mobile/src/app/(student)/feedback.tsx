import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  Alert, ActivityIndicator, Platform, Modal, Pressable, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  Send, Clock, CheckCircle, XCircle, MessageSquare,
  Calendar, ChevronLeft, Trash2, RefreshCw,
} from "lucide-react-native";
import { useRouter, useFocusEffect } from "expo-router";
import axiosClient from "../../api/axiosClient";
import { useAuthStore } from "../../store/useAuthStore";
import { webSocketService } from "../../api/websocket";

const formatDate = (date: any) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const formatDisplay = (str: any) => {
  if (!str) return "--";
  const p = str.split("-");
  return `${p[2]}/${p[1]}/${p[0]}`;
};

const STATUS: Record<string, { label: string; color: string; Icon: any }> = {
  PENDING:   { label: "Chờ duyệt", color: "#F59E0B", Icon: Clock },
  CHO_DUYET: { label: "Chờ duyệt", color: "#F59E0B", Icon: Clock },
  APPROVED:  { label: "Đã duyệt",  color: "#10B981", Icon: CheckCircle },
  DA_DUYET:  { label: "Đã duyệt",  color: "#10B981", Icon: CheckCircle },
  REJECTED:  { label: "Từ chối",   color: "#EF4444", Icon: XCircle },
  TU_CHOI:   { label: "Từ chối",   color: "#EF4444", Icon: XCircle },
};

export default function FeedbackScreen() {
  const router = useRouter();
  const { userData } = useAuthStore();
  const [lyDo, setLyDo] = useState("");
  const [start, setStart] = useState(new Date());
  const [end, setEnd]     = useState(new Date());
  const [showStart, setShowStart] = useState(false);
  const [showEnd,   setShowEnd]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [list, setList]   = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchList = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await axiosClient.get("/don-xin-nghi/me");
      setList(res.data?.data || []);
    } catch (_) {}
    finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(
    useCallback(() => {
      fetchList(true);
    }, [])
  );

  useEffect(() => {
    webSocketService.connect(() => {
      const handleRealtimeUpdate = () => {
        fetchList(true);
      };

      webSocketService.subscribe('/topic/don-xin-nghi', handleRealtimeUpdate);
      if (userData?.id) {
        webSocketService.subscribe(`/topic/user/${userData.id}`, handleRealtimeUpdate);
        webSocketService.subscribe(`/topic/notifications/${userData.id}`, handleRealtimeUpdate);
      }
    });

    return () => {
      webSocketService.unsubscribe('/topic/don-xin-nghi');
      if (userData?.id) {
        webSocketService.unsubscribe(`/topic/user/${userData.id}`);
        webSocketService.unsubscribe(`/topic/notifications/${userData.id}`);
      }
    };
  }, [userData?.id]);

  const onRefresh = useCallback(() => { setRefreshing(true); fetchList(true); }, []);

  const handleSubmit = async () => {
    if (!lyDo.trim()) { Alert.alert("Lỗi", "Vui lòng nhập lý do xin nghỉ."); return; }
    if (end < start)  { Alert.alert("Lỗi", "Ngày kết thúc không được trước ngày bắt đầu."); return; }
    setSubmitting(true);
    try {
      await axiosClient.post("/don-xin-nghi", {
        ngayBatDau: formatDate(start),
        ngayKetThuc: formatDate(end),
        lyDo: lyDo.trim(),
      });
      Alert.alert("Thành công", "Đã gửi đơn xin nghỉ đến giáo viên chủ nhiệm!");
      setLyDo(""); setStart(new Date()); setEnd(new Date());
      fetchList(true);
    } catch (e: any) {
      Alert.alert("Lỗi", e?.response?.data?.message || "Không thể gửi đơn. Vui lòng thử lại.");
    } finally { setSubmitting(false); }
  };

  const handleDelete = (id: any) => {
    Alert.alert("Xác nhận hủy", "Bạn có chắc muốn hủy đơn xin nghỉ này?", [
      { text: "Không", style: "cancel" },
      { text: "Hủy đơn", style: "destructive", onPress: async () => {
        try { await axiosClient.delete(`/don-xin-nghi/${id}`); fetchList(true); }
        catch (e: any) { Alert.alert("Lỗi", e?.response?.data?.message || "Không thể hủy đơn."); }
      }},
    ]);
  };

  const renderItem = (item: any) => {
    const cfg = STATUS[item.trangThai as keyof typeof STATUS] || STATUS.CHO_DUYET;
    const { Icon } = cfg;
    return (
      <View key={item.id} style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.badge, { backgroundColor: cfg.color + "20", borderColor: cfg.color }]}>
            <Icon size={13} color={cfg.color} />
            <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
          {(item.trangThai === "CHO_DUYET" || item.trangThai === "PENDING") && (
            <TouchableOpacity onPress={() => handleDelete(item.id)} hitSlop={{ top:8,bottom:8,left:8,right:8 }}>
              <Trash2 size={18} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.dateRow}>
          <Calendar size={14} color="#6B7280" />
          <Text style={styles.dateText}>
            {formatDisplay(item.ngayBatDau)}
            {item.ngayBatDau !== item.ngayKetThuc ? ` → ${formatDisplay(item.ngayKetThuc)}` : ""}
          </Text>
        </View>
        <Text style={styles.lyDo} numberOfLines={3}>{item.lyDo}</Text>
        {item.phanHoiGv ? (
          <View style={styles.reply}>
            <MessageSquare size={13} color="#2563EB" />
            <Text style={styles.replyText}>GV phản hồi: {item.phanHoiGv}</Text>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <ChevronLeft size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gửi đơn xin nghỉ</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.iconBtn}>
          <RefreshCw size={20} color="#2563EB" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#2563EB"]} />}
      >
        {/* ── Form ── */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>📝 Đơn xin nghỉ mới</Text>
          <Text style={styles.formHint}>Đơn sẽ được gửi đến giáo viên chủ nhiệm để xét duyệt.</Text>

          <Text style={styles.label}>Ngày bắt đầu nghỉ</Text>
          <TouchableOpacity style={styles.dateBtn} onPress={() => setShowStart(true)}>
            <Calendar size={16} color="#2563EB" />
            <Text style={styles.dateTxt}>{formatDisplay(formatDate(start))}</Text>
          </TouchableOpacity>

          <Text style={styles.label}>Ngày kết thúc nghỉ</Text>
          <TouchableOpacity style={styles.dateBtn} onPress={() => setShowEnd(true)}>
            <Calendar size={16} color="#2563EB" />
            <Text style={styles.dateTxt}>{formatDisplay(formatDate(end))}</Text>
          </TouchableOpacity>

          <Text style={styles.label}>Lý do xin nghỉ *</Text>
          <TextInput
            style={styles.area}
            placeholder="Nhập lý do xin nghỉ (ví dụ: ốm, việc gia đình...)"
            placeholderTextColor="#9CA3AF"
            value={lyDo}
            onChangeText={setLyDo}
            multiline numberOfLines={4} textAlignVertical="top"
          />

          <TouchableOpacity
            style={[styles.submitBtn, submitting && { backgroundColor: "#93C5FD" }]}
            onPress={handleSubmit} disabled={submitting}
          >
            {submitting
              ? <ActivityIndicator color="#FFF" size="small" />
              : <><Send size={18} color="#FFF" /><Text style={styles.submitTxt}>Gửi đơn</Text></>
            }
          </TouchableOpacity>
        </View>

        {/* ── Lịch sử ── */}
        <Text style={styles.historyTitle}>📋 Lịch sử đơn đã gửi</Text>
        {loading
          ? <ActivityIndicator color="#2563EB" style={{ marginTop: 24 }} />
          : list.length === 0
            ? <View style={styles.empty}><MessageSquare size={40} color="#CBD5E1" /><Text style={styles.emptyTxt}>Chưa có đơn nào được gửi</Text></View>
            : list.map(renderItem)
        }
      </ScrollView>

      {/* Pickers */}
      {showStart && Platform.OS === "android" && (
        <DateTimePicker value={start} mode="date" display="default"
          onChange={(_, d) => { setShowStart(false); if (d) setStart(d); }} />
      )}
      {showEnd && Platform.OS === "android" && (
        <DateTimePicker value={end} mode="date" display="default" minimumDate={start}
          onChange={(_, d) => { setShowEnd(false); if (d) setEnd(d); }} />
      )}
      {showStart && Platform.OS === "ios" && (
        <Modal visible transparent animationType="slide">
          <Pressable style={styles.overlay} onPress={() => setShowStart(false)}>
            <View style={styles.sheet}>
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>Ngày bắt đầu</Text>
                <TouchableOpacity onPress={() => setShowStart(false)}><Text style={styles.done}>Xong</Text></TouchableOpacity>
              </View>
              <DateTimePicker value={start} mode="date" display="spinner" onChange={(_, d) => { if (d) setStart(d); }} />
            </View>
          </Pressable>
        </Modal>
      )}
      {showEnd && Platform.OS === "ios" && (
        <Modal visible transparent animationType="slide">
          <Pressable style={styles.overlay} onPress={() => setShowEnd(false)}>
            <View style={styles.sheet}>
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>Ngày kết thúc</Text>
                <TouchableOpacity onPress={() => setShowEnd(false)}><Text style={styles.done}>Xong</Text></TouchableOpacity>
              </View>
              <DateTimePicker value={end} mode="date" display="spinner" minimumDate={start} onChange={(_, d) => { if (d) setEnd(d); }} />
            </View>
          </Pressable>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  iconBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  scroll: { padding: 16, paddingBottom: 40 },
  formCard: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 20, marginBottom: 24, shadowColor: "#64748B", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 2 },
  formTitle: { fontSize: 17, fontWeight: "700", color: "#0F172A", marginBottom: 4 },
  formHint: { fontSize: 13, color: "#64748B", marginBottom: 20 },
  label: { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 8 },
  dateBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#EFF6FF", borderRadius: 10, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 16, borderWidth: 1, borderColor: "#BFDBFE" },
  dateTxt: { fontSize: 15, color: "#1D4ED8", fontWeight: "500" },
  area: { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 10, padding: 12, fontSize: 15, color: "#111827", backgroundColor: "#F9FAFB", minHeight: 110, marginBottom: 20 },
  submitBtn: { backgroundColor: "#2563EB", borderRadius: 12, paddingVertical: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  submitTxt: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  historyTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A", marginBottom: 12 },
  card: { backgroundColor: "#FFFFFF", borderRadius: 14, padding: 16, marginBottom: 12, shadowColor: "#64748B", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  badge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  badgeText: { fontSize: 12, fontWeight: "600" },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  dateText: { fontSize: 13, color: "#475569", fontWeight: "500" },
  lyDo: { fontSize: 14, color: "#1E293B", lineHeight: 20 },
  reply: { flexDirection: "row", alignItems: "flex-start", gap: 6, marginTop: 10, backgroundColor: "#EFF6FF", borderRadius: 8, padding: 10 },
  replyText: { fontSize: 13, color: "#1D4ED8", flex: 1, lineHeight: 18 },
  empty: { alignItems: "center", paddingVertical: 40 },
  emptyTxt: { marginTop: 12, fontSize: 14, color: "#94A3B8" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 30 },
  sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  sheetTitle: { fontSize: 16, fontWeight: "600", color: "#0F172A" },
  done: { fontSize: 16, fontWeight: "700", color: "#2563EB" },
});
