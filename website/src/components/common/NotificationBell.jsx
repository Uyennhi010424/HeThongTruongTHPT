import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getMyNotifications, markRead, markAllRead } from "../../api/notificationApi.js";
import { getThongBao } from "../../api/thongbaoApi.js";
import { webSocketService } from "../../utils/websocket.js";
import { getRole } from "../../store/authStore.js";
import { getCurrentUsernameFromToken } from "../../utils/teacherProfile.js";
import axiosClient from "../../api/axiosClient.js";

const POLL_INTERVAL = 30000; // 30 seconds

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return "Vừa xong";
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return new Date(dateStr).toLocaleDateString("vi-VN");
}

const TYPE_CONFIG = {
  LEAVE_REQUEST: { nav: "/admin/nghi-day", label: "Đơn xin nghỉ" },
  LEAVE_RESULT:  { nav: "/teacher/xin-nghi", label: "Kết quả đơn nghỉ" },
  SUBSTITUTE_TEACHING: { nav: "/teacher/thoikhoabieu", label: "Phân công dạy thay" },
};

// Helper: check if a thongbao was created by current admin/vanthu user
function isAdminOwnBroadcast(notice, currentUsername) {
  if (!notice.tieuDe) return false; // not a thongbao
  const creatorRole = notice.nguoiTao?.role || notice.senderRole;
  const creatorUsername = notice.nguoiTao?.username;
  // Admin/vanthu sees only notices from others (leave requests etc.), not their own broadcasts
  if ((creatorRole === 'ADMIN' || creatorRole === 'VAN_THU') && creatorUsername === currentUsername) return true;
  return false;
}

export default function NotificationBell({ role = "admin" }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const dropRef = useRef(null);
  const navigate = useNavigate();

  const fetchNotifications = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const [res, tbRes] = await Promise.all([
        getMyNotifications().catch(() => null),
        getThongBao().catch(() => null)
      ]);
      
      let appNotifs = res?.data?.data || [];
      let thongBaos = tbRes?.data?.data || [];
      
      const role = getRole();
      if (role === "GIAOVIEN" || role === "GIAO_VIEN") {
        thongBaos = thongBaos.filter(item => ["GIAO_VIEN", "ALL", "CA_NHAN", "REPLY", "PHU_HUYNH"].includes(item.doiTuong));
      } else if (role === "ADMIN" || role === "VAN_THU") {
        const currentUsername = getCurrentUsernameFromToken();
        thongBaos = thongBaos.filter(item => {
          const creatorRole = item.nguoiTao?.role;
          const creatorUsername = item.nguoiTao?.username;
          return creatorRole !== "ADMIN" && creatorRole !== "VAN_THU" && creatorUsername !== currentUsername;
        });
      }

      const mappedTb = thongBaos.map(tb => {
        let displayTitle = tb.tieuDe;
        if (tb.senderRole === "PHU_HUYNH" && tb.hocSinh?.hoTen) {
          displayTitle = `Trao đổi từ phụ huynh em ${tb.hocSinh.hoTen}`;
        }
        return {
          id: `tb_${tb.id}`,
          realId: tb.id,
          title: displayTitle,
          message: tb.noiDung,
          createdAt: tb.ngayDang,
          isRead: true, // Will be overridden if existing is unread
          type: 'THONG_BAO'
        };
      });

      setNotifications(prev => {
        const allNew = [...appNotifs, ...mappedTb];
        // Preserve isRead state from prev for ThongBao
        const merged = allNew.map(n => {
          if (n.type === 'THONG_BAO') {
            const existing = prev.find(p => p.id === n.id);
            if (existing && existing.isRead === false) {
              return { ...n, isRead: false };
            }
          }
          return n;
        });
        return merged.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      });
    } catch {
      // silently ignore
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const timer = setInterval(fetchNotifications, POLL_INTERVAL);
    
    let active = true;
    let userId = null;
    let subUser = null;
    let subAll = null;
    const setupWebSocket = async () => {
      try {
        const userRes = await axiosClient.get("/users/me");
        if (active && userRes.data?.data) {
          userId = userRes.data.data.id;
          webSocketService.connect(() => {
            if (userId) {
              subUser = webSocketService.subscribe(`/topic/user/${userId}`, (newNotice) => {
                // Admin/VanThu: skip own broadcast thongbao
                const curRole = getRole();
                if ((curRole === 'ADMIN' || curRole === 'VAN_THU') && isAdminOwnBroadcast(newNotice, getCurrentUsernameFromToken())) return;

                setNotifications(prev => {
                  // Phân biệt AppNotification (có title) và ThongBao (có tieuDe)
                  const isThongBao = !!newNotice.tieuDe;
                  const noticeId = isThongBao ? `tb_${newNotice.id}` : newNotice.id;
                  
                  if (prev.find(n => n.id === noticeId)) return prev;
                  
                  let displayTitle = newNotice.tieuDe;
                  if (isThongBao && newNotice.senderRole === "PHU_HUYNH" && newNotice.hocSinh?.hoTen) {
                    displayTitle = `Trao đổi từ phụ huynh em ${newNotice.hocSinh.hoTen}`;
                  }

                  const mapped = isThongBao ? {
                    id: noticeId,
                    realId: newNotice.id,
                    title: displayTitle,
                    message: newNotice.noiDung,
                    createdAt: newNotice.ngayDang,
                    isRead: false,
                    type: 'THONG_BAO'
                  } : {
                    ...newNotice,
                    isRead: false
                  };
                  return [mapped, ...prev];
                });
              });
            }
            subAll = webSocketService.subscribe('/topic/notifications', (newNotice) => {
              // Admin/VanThu: skip their own broadcast thongbao coming through the global topic
              const curRole = getRole();
              if ((curRole === 'ADMIN' || curRole === 'VAN_THU') && isAdminOwnBroadcast(newNotice, getCurrentUsernameFromToken())) return;

              setNotifications(prev => {
                const isThongBao = !!newNotice.tieuDe;
                const noticeId = isThongBao ? `tb_${newNotice.id}` : newNotice.id;
                
                if (prev.find(n => n.id === noticeId)) return prev;
                
                let displayTitle = newNotice.tieuDe;
                if (isThongBao && newNotice.senderRole === "PHU_HUYNH" && newNotice.hocSinh?.hoTen) {
                  displayTitle = `Trao đổi từ phụ huynh em ${newNotice.hocSinh.hoTen}`;
                }

                const mapped = isThongBao ? {
                  id: noticeId,
                  realId: newNotice.id,
                  title: displayTitle,
                  message: newNotice.noiDung,
                  createdAt: newNotice.ngayDang,
                  isRead: false,
                  type: 'THONG_BAO'
                } : {
                  ...newNotice,
                  isRead: false
                };
                return [mapped, ...prev];
              });
            });
          });
        }
      } catch {}
    };
    setupWebSocket();
    
    return () => {
      active = false;
      clearInterval(timer);
      if (userId && subUser) webSocketService.unsubscribe(`/topic/user/${userId}`, subUser);
      if (subAll) webSocketService.unsubscribe('/topic/notifications', subAll);
    };
  }, [fetchNotifications]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleClickNotif = async (n) => {
    if (!n.isRead) {
      await markRead(n.id);
      setNotifications((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x))
      );
    }
    if (n.type === 'THONG_BAO') {
      const role = getRole();
      if (role === "ADMIN" || role === "VAN_THU") {
        navigate("/admin/thongbao");
      } else {
        navigate("/teacher/thongbao");
      }
      setOpen(false);
      return;
    }
    const cfg = TYPE_CONFIG[n.type];
    if (cfg) navigate(cfg.nav, { state: { referenceId: n.referenceId } });
    setOpen(false);
  };

  const handleMarkAll = async () => {
    await markAllRead();
    setNotifications((prev) => prev.map((x) => ({ ...x, isRead: true })));
  };

  return (
    <div ref={dropRef} style={{ position: "relative" }}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          position: "relative", background: "transparent", border: "none",
          cursor: "pointer", padding: "8px", borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#64748b", transition: "background 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f5f9")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        title="Thông báo"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unreadCount > 0 && (
          <span style={{
            position: "absolute", top: 4, right: 4,
            background: "#ef4444", color: "#fff",
            borderRadius: "50%", minWidth: 18, height: 18,
            fontSize: 11, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
            lineHeight: 1, padding: "0 4px",
          }}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: "absolute", right: 0, top: "calc(100% + 8px)",
          width: 360, maxHeight: 480,
          background: "#fff", borderRadius: 12,
          border: "1px solid #e2e8f0",
          boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
          zIndex: 1000, overflow: "hidden",
          display: "flex", flexDirection: "column",
        }}>
          {/* Header */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "14px 16px", borderBottom: "1px solid #f1f5f9",
          }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>
              Thông báo {unreadCount > 0 && <span style={{ color: "#ef4444" }}>({unreadCount})</span>}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAll}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#3b82f6", fontWeight: 600 }}
              >
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ overflowY: "auto", flex: 1 }}>
            {notifications.length === 0 ? (
              <div style={{ padding: 32, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
                Không có thông báo nào.
              </div>
            ) : (
              notifications.slice(0, 30).map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleClickNotif(n)}
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid #f8fafc",
                    cursor: "pointer",
                    background: n.isRead ? "#fff" : "#eff6ff",
                    transition: "background 0.15s",
                    display: "flex", gap: 10, alignItems: "flex-start",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = n.isRead ? "#f8fafc" : "#dbeafe")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = n.isRead ? "#fff" : "#eff6ff")}
                >
                  {/* Dot */}
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%", flexShrink: 0, marginTop: 6,
                    background: n.isRead ? "#d1d5db" : "#3b82f6",
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: n.isRead ? 500 : 700, fontSize: 14, color: "#0f172a", marginBottom: 2 }}>
                      {n.title}
                    </div>
                    <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.5, marginBottom: 4 }}>
                      {n.message}
                    </div>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>
                      {timeAgo(n.createdAt)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
