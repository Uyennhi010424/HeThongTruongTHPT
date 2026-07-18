import { useEffect, useMemo, useState } from "react";
import { getThongBao, getThread, replyThongBao } from "../../api/thongbaoApi.js";
import { notifySuccess, notifyError } from "../../utils/notify.js";

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
    case "HOC_SINH": return "Học sinh";
    case "ALL": return "Toàn trường";
    case "GIAO_VIEN": return "Giáo viên";
    case "PHU_HUYNH": return "Phụ huynh";
    case "REPLY": return "Phản hồi";
    default: return value || "Khác";
  }
};

const getSenderLabel = (role) => {
  switch (role) {
    case "ADMIN": return "Quản trị";
    case "GIAO_VIEN": return "GVCN";
    case "HOC_SINH": return "Học sinh";
    case "PHU_HUYNH": return "Phụ huynh";
    default: return role || "Hệ thống";
  }
};

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
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#111" }}>{notice.tieuDe}</div>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{formatDateTime(notice.ngayDang)}</div>
          </div>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#6b7280" }}>✕</button>
        </div>
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
                <strong>{getSenderLabel(msg.senderRole || msg.nguoiTao?.role)}</strong>
                {" · "}{formatDateTime(msg.ngayDang)}
              </div>
              {msg.isReply && <div style={{ fontSize: 11, color: "#3b82f6", marginBottom: 2 }}>{msg.tieuDe}</div>}
              <div style={{ fontSize: 13, whiteSpace: "pre-wrap" }}>{msg.noiDung}</div>
            </div>
          ))}
        </div>
        <div style={{ padding: "12px 20px", borderTop: "1px solid #e5e7eb" }}>
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Nhập phản hồi của bạn cho GVCN / Nhà trường..."
            rows={3}
            style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, resize: "vertical", boxSizing: "border-box" }}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
            <button
              type="button" disabled={sending || !replyText.trim()} onClick={handleReply}
              className="btn-primary" style={{ opacity: (!replyText.trim() || sending) ? 0.5 : 1 }}
            >
              {sending ? "Đang gửi..." : "Gửi phản hồi"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StudentThongBao() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");
  const [selectedNotice, setSelectedNotice] = useState(null);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getThongBao();
      const all = res?.data?.data || [];
      const filtered = all.filter((n) => n.doiTuong === "HOC_SINH" || n.doiTuong === "ALL");
      setNotices(filtered.sort((a, b) => new Date(b.ngayDang) - new Date(a.ngayDang)));
    } catch {
      setError("Không thể tải thông báo.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const filteredNotices = useMemo(() => {
    if (!keyword.trim()) return notices;
    const lower = keyword.toLowerCase();
    return notices.filter((n) =>
      (n.tieuDe || "").toLowerCase().includes(lower) ||
      (n.noiDung || "").toLowerCase().includes(lower)
    );
  }, [notices, keyword]);

  return (
    <div className="student-page">
      <section className="student-hero card">
        <div className="student-hero-copy">
          <div className="student-hero-kicker">EduManager Pro</div>
          <h2 className="student-hero-title">Thông báo</h2>
          <p className="student-hero-subtitle">Thông báo từ nhà trường dành cho học sinh.</p>
        </div>
        <div className="student-hero-metrics">
          <div className="student-hero-chip">{loading ? "..." : notices.length} thông báo</div>
        </div>
      </section>

      <div className="card users-toolbar">
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
