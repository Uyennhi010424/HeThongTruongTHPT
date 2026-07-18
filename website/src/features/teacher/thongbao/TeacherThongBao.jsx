import { useEffect, useMemo, useState } from "react";
import { getThongBao, getThread, replyThongBao, createThongBao } from "../../../api/thongbaoApi.js";
import { notifySuccess, notifyError } from "../../../utils/notify.js";

const formatDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
};

const getTargetLabel = (value) => {
  switch (value) {
    case "GIAO_VIEN": return "Giáo viên";
    case "ALL": return "Toàn trường";
    case "HOC_SINH": return "Học sinh";
    case "PHU_HUYNH": return "Phụ huynh";
    case "REPLY": return "Phản hồi";
    default: return value || "Khác";
  }
};

const getSenderLabel = (role) => {
  switch (role) {
    case "ADMIN": return "Quản trị";
    case "GIAO_VIEN": return "Giáo viên";
    case "HOC_SINH": return "Học sinh";
    case "PHU_HUYNH": return "Phụ huynh";
    default: return role || "Hệ thống";
  }
};

// Component thread/reply
function ThreadModal({ notice, onClose, onRefresh }) {
  const [thread, setThread] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!notice?.id) return;
    let active = true;
    setLoading(true);
    getThread(notice.id)
      .then((r) => { if (active) setThread(r?.data?.data || []); })
      .catch(() => { if (active) setThread([notice]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [notice?.id]);

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      await replyThongBao(notice.id, {
        tieuDe: `Re: ${notice.tieuDe}`,
        noiDung: replyText.trim(),
        loai: "REPLY"
      });
      notifySuccess("Đã gửi phản hồi!");
      setReplyText("");
      // Reload thread
      const r = await getThread(notice.id);
      setThread(r?.data?.data || []);
      onRefresh?.();
    } catch {
      notifyError("Không thể gửi phản hồi.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 24 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "#fff", borderRadius: 12, width: "min(640px, 95vw)", maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#111" }}>{notice.tieuDe}</div>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{formatDateTime(notice.ngayDang)}</div>
          </div>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#6b7280" }}>✕</button>
        </div>

        {/* Thread messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
          {loading ? (
            <div style={{ textAlign: "center", color: "#9ca3af", padding: 20 }}>Đang tải...</div>
          ) : thread.map((msg) => (
            <div
              key={msg.id}
              style={{
                padding: "10px 14px", borderRadius: 10,
                background: msg.isReply ? "#eff6ff" : "#f9fafb",
                borderLeft: `3px solid ${msg.isReply ? "#3b82f6" : "#e5e7eb"}`,
                alignSelf: msg.isReply ? "flex-end" : "flex-start",
                maxWidth: "85%"
              }}
            >
              <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>
                <strong>{getSenderLabel(msg.senderRole || (msg.nguoiTao?.role))}</strong>
                {" · "}{formatDateTime(msg.ngayDang)}
              </div>
              {msg.isReply && <div style={{ fontSize: 11, color: "#3b82f6", marginBottom: 2 }}>{msg.tieuDe}</div>}
              <div style={{ fontSize: 13, whiteSpace: "pre-wrap" }}>{msg.noiDung}</div>
            </div>
          ))}
        </div>

        {/* Reply form */}
        <div style={{ padding: "12px 20px", borderTop: "1px solid #e5e7eb" }}>
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Nhập phản hồi của bạn..."
            rows={3}
            style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, resize: "vertical", boxSizing: "border-box" }}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
            <button
              type="button"
              disabled={sending || !replyText.trim()}
              onClick={handleReply}
              className="btn-primary"
              style={{ opacity: (!replyText.trim() || sending) ? 0.5 : 1 }}
            >
              {sending ? "Đang gửi..." : "Gửi phản hồi"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TeacherThongBao() {
  const [activeTab, setActiveTab] = useState("inbox");
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");
  const [selectedNotice, setSelectedNotice] = useState(null);

  // Gửi cho Admin
  const [adminForm, setAdminForm] = useState({ tieuDe: "", noiDung: "" });
  const [sending, setSending] = useState(false);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getThongBao();
      const all = res?.data?.data || [];
      const filtered = all.filter((n) =>
        n.doiTuong === "GIAO_VIEN" || n.doiTuong === "ALL"
      );
      setNotices(filtered.sort((a, b) => new Date(b.ngayDang) - new Date(a.ngayDang)));
    } catch {
      setError("Không thể tải thông báo.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      await fetchNotices();
    })();
    return () => { active = false; };
  }, []);

  const filteredNotices = useMemo(() => {
    if (!keyword.trim()) return notices;
    const lower = keyword.toLowerCase();
    return notices.filter((n) =>
      (n.tieuDe || "").toLowerCase().includes(lower) ||
      (n.noiDung || "").toLowerCase().includes(lower)
    );
  }, [notices, keyword]);

  const handleSendToAdmin = async () => {
    if (!adminForm.tieuDe.trim() || !adminForm.noiDung.trim()) {
      notifyError("Vui lòng nhập đầy đủ tiêu đề và nội dung.");
      return;
    }
    setSending(true);
    try {
      await createThongBao({
        tieuDe: adminForm.tieuDe,
        noiDung: adminForm.noiDung,
        loai: "ADMIN",
        senderRole: "GIAO_VIEN"
      });
      notifySuccess("Đã gửi thông báo cho Admin!");
      setAdminForm({ tieuDe: "", noiDung: "" });
    } catch {
      notifyError("Không thể gửi. Vui lòng thử lại.");
    } finally {
      setSending(false);
    }
  };

  const tabs = [
    { key: "inbox", label: "Thông báo từ BGH" },
    { key: "send-admin", label: "Gửi cho Admin" },
  ];

  return (
    <div className="page users-page teacher-page">

      {/* Tab switcher */}
      <div className="card" style={{ padding: 0, marginBottom: 16 }}>
        <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb" }}>
          {tabs.map((t) => (
            <button
              key={t.key} type="button" onClick={() => setActiveTab(t.key)}
              style={{
                flex: 1, padding: "12px 16px", border: "none", fontWeight: 600, cursor: "pointer", fontSize: 13,
                background: activeTab === t.key ? "#1565c0" : "transparent",
                color: activeTab === t.key ? "#fff" : "#374151",
                borderRadius: 0
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* === TAB: INBOX === */}
      {activeTab === "inbox" && (
        <>
          <div className="card users-toolbar">
            <div>
              <div className="users-title">Thông báo từ Ban giám hiệu</div>
              <div className="users-subtitle">{notices.length} thông báo dành cho giáo viên</div>
            </div>
            <div className="users-actions">
              <div className="dash-search users-search">
                <span className="dot" />
                <input
                  placeholder="Tìm kiếm thông báo..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="users-stats">
            <div className="stat-card stat-blue">
              <div className="stat-label">Tổng thông báo</div>
              <div className="stat-value">{loading ? "..." : notices.length}</div>
            </div>
          </div>

          {error && <div className="card table-empty">{error}</div>}
          {!error && !loading && filteredNotices.length === 0 && (
            <div className="card table-empty">Không có thông báo nào.</div>
          )}

          {!error && filteredNotices.length > 0 && (
            <div className="card users-table">
              <div className="table-header">
                <div>
                  <div className="panel-title">Danh sách thông báo</div>
                  <div className="panel-subtitle">Click vào thông báo để xem chi tiết và phản hồi</div>
                </div>
                <div className="panel-pill">{filteredNotices.length} thông báo</div>
              </div>
              <div className="notice-list">
                {filteredNotices.map((item) => (
                  <div
                    key={item.id}
                    className="notice-item"
                    style={{ cursor: "pointer" }}
                    onClick={() => setSelectedNotice(item)}
                  >
                    <div className="notice-top">
                      <span className="notice-tag">{getTargetLabel(item.doiTuong)}</span>
                      <span className="notice-date">{formatDateTime(item.ngayDang)}</span>
                    </div>
                    <div className="notice-title">{item.tieuDe}</div>
                    <div className="notice-content" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 600 }}>
                      {item.noiDung}
                    </div>
                    <div style={{ marginTop: 6, fontSize: 12, color: "#3b82f6", display: "flex", alignItems: "center", gap: 4 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>reply</span>
                      Nhấn để xem & phản hồi
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* === TAB: GỬI CHO ADMIN === */}
      {activeTab === "send-admin" && (
        <div className="card" style={{ padding: 24, maxWidth: 640 }}>
          <div className="panel-title" style={{ marginBottom: 4 }}>Gửi báo cáo / phản ánh cho Admin</div>
          <div className="panel-subtitle" style={{ marginBottom: 20 }}>Gửi thông tin về lớp học, vấn đề giảng dạy hoặc yêu cầu hỗ trợ lên Ban giám hiệu.</div>

          <div className="form-field" style={{ marginBottom: 12 }}>
            <span>Tiêu đề</span>
            <input
              type="text"
              placeholder="VD: Báo cáo tình hình lớp 11A1..."
              value={adminForm.tieuDe}
              onChange={(e) => setAdminForm((p) => ({ ...p, tieuDe: e.target.value }))}
            />
          </div>
          <div className="form-field" style={{ marginBottom: 16 }}>
            <span>Nội dung</span>
            <textarea
              rows={6}
              placeholder="Mô tả chi tiết vấn đề hoặc yêu cầu..."
              value={adminForm.noiDung}
              onChange={(e) => setAdminForm((p) => ({ ...p, noiDung: e.target.value }))}
              style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, resize: "vertical", width: "100%", boxSizing: "border-box" }}
            />
          </div>
          <button
            type="button"
            className="btn-primary"
            onClick={handleSendToAdmin}
            disabled={sending}
            style={{ opacity: sending ? 0.6 : 1 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18, verticalAlign: "middle", marginRight: 6 }}>send</span>
            {sending ? "Đang gửi..." : "Gửi cho Admin"}
          </button>
        </div>
      )}

      {/* Thread Modal */}
      {selectedNotice && (
        <ThreadModal
          notice={selectedNotice}
          onClose={() => setSelectedNotice(null)}
          onRefresh={fetchNotices}
        />
      )}
    </div>
  );
}
