import { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useAdminSearch } from "../../../contexts/AdminSearchContext.jsx";
import { getAllNghi, duyetNghi, huyNghi } from "../../../api/giaoVienNghiApi.js";
import { getGiaoVien } from "../../../api/giaovienApi.js";
import { notifySuccess, notifyError } from "../../../utils/notify.js";

const STATUS = {
  PENDING:  { label: "Chờ duyệt",  bg: "#fef9c3", color: "#a16207" },
  APPROVED: { label: "Đã duyệt",   bg: "#dcfce7", color: "#15803d" },
  REJECTED: { label: "Từ chối",    bg: "#fee2e2", color: "#dc2626" },
};

function StatusBadge({ status }) {
  const cfg = STATUS[status] || STATUS.PENDING;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700,
      background: cfg.bg, color: cfg.color,
    }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: cfg.color, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

function fmtDate(d) {
  if (!d) return "--";
  try { return new Date(d).toLocaleDateString("vi-VN"); } catch { return d; }
}
function fmtDateTime(d) {
  if (!d) return "--";
  try {
    const dt = new Date(d);
    return dt.toLocaleDateString("vi-VN") + " " + dt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  } catch { return d; }
}

// ─── Approve Dialog ───
function ApproveDialog({ record, onClose, onDone }) {
  const [adminMessage, setAdminMessage] = useState("Đơn của bạn đã được phê duyệt.");
  const [giaoVienThayId, setGiaoVienThayId] = useState("");
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getGiaoVien()
      .then(res => setTeachers(res?.data?.data || []))
      .catch(() => {});
  }, []);

  const submit = async () => {
    setLoading(true);
    try {
      const payload = { trangThai: "APPROVED", adminMessage };
      if (giaoVienThayId) payload.giaoVienThayId = Number(giaoVienThayId);
      
      const res = await duyetNghi(record.id, payload);
      notifySuccess("Đã duyệt đơn xin nghỉ thành công.");
      onDone(res?.data?.data);
    } catch {
      notifyError("Không thể duyệt đơn. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={overlayStyle}>
      <div style={{ ...dialogStyle, maxWidth: 520 }}>
        <div style={dlgHeader("#16a34a")}>
          <span style={{ fontSize: 16, fontWeight: 700 }}>Duyệt đơn xin nghỉ</span>
          <button onClick={onClose} style={closeBtn}>✕</button>
        </div>
        <div style={{ padding: "20px 24px 8px" }}>
          <InfoRow label="Giáo viên" value={record.giaoVien?.hoTen || "--"} />
          <InfoRow label="Mã GV" value={record.giaoVien?.maGiaoVien || "--"} />
          <InfoRow label="Ngày nghỉ" value={fmtDate(record.ngay)} />
          <InfoRow label="Lý do" value={record.lyDo || "--"} />
          <InfoRow label="Ghi chú" value={record.ghiChu || "--"} />
        </div>
        <div style={{ padding: "0 24px 20px" }}>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Phân công giáo viên dạy thay (Không bắt buộc)</label>
            <select
              value={giaoVienThayId}
              onChange={(e) => setGiaoVienThayId(e.target.value)}
              style={{ ...textareaStyle, padding: "8px 12px", cursor: "pointer", appearance: "auto" }}
            >
              <option value="">-- Không phân công (để trống) --</option>
              {teachers
                .filter(t => t.id !== record.giaoVien?.id) // Bỏ qua giáo viên đang xin nghỉ
                .map(t => (
                  <option key={t.id} value={t.id}>
                    {t.hoTen} ({t.maGiaoVien})
                  </option>
              ))}
            </select>
          </div>

          <label style={labelStyle}>Ghi chú gửi giáo viên</label>
          <textarea
            rows={2}
            value={adminMessage}
            onChange={(e) => setAdminMessage(e.target.value)}
            style={textareaStyle}
            placeholder="Nhập lời nhắn..."
          />
        </div>
        <div style={dlgFooter}>
          <button onClick={onClose} style={btnSecondary} disabled={loading}>Hủy</button>
          <button onClick={submit} style={{ ...btnPrimary, background: "#16a34a" }} disabled={loading}>
            {loading ? "Đang xử lý..." : "Xác nhận duyệt"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Reject Dialog ───
function RejectDialog({ record, onClose, onDone }) {
  const [reason, setReason] = useState("");
  const [adminMessage, setAdminMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!reason.trim()) { notifyError("Vui lòng nhập lý do từ chối."); return; }
    setLoading(true);
    try {
      const res = await duyetNghi(record.id, {
        trangThai: "REJECTED",
        lyDoTuChoi: reason,
        adminMessage: adminMessage || ("Đơn xin nghỉ đã bị từ chối. Lý do: " + reason),
      });
      notifySuccess("Đã từ chối đơn xin nghỉ.");
      onDone(res?.data?.data);
    } catch {
      notifyError("Không thể từ chối đơn. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={overlayStyle}>
      <div style={{ ...dialogStyle, maxWidth: 520 }}>
        <div style={dlgHeader("#dc2626")}>
          <span style={{ fontSize: 16, fontWeight: 700 }}>Từ chối đơn xin nghỉ</span>
          <button onClick={onClose} style={closeBtn}>✕</button>
        </div>
        <div style={{ padding: "20px 24px 8px" }}>
          <InfoRow label="Giáo viên" value={record.giaoVien?.hoTen || "--"} />
          <InfoRow label="Ngày nghỉ" value={fmtDate(record.ngay)} />
          <InfoRow label="Lý do GV" value={record.lyDo || "--"} />
        </div>
        <div style={{ padding: "0 24px 20px" }}>
          <label style={{ ...labelStyle, color: "#dc2626" }}>Lý do từ chối <span style={{ color: "#dc2626" }}>*</span></label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            style={{ ...textareaStyle, borderColor: reason ? "#e2e8f0" : "#fca5a5" }}
            placeholder="Ví dụ: Trùng lịch thi, chưa bố trí được người dạy thay..."
          />
          <label style={{ ...labelStyle, marginTop: 12 }}>Ghi chú gửi giáo viên (tuỳ chọn)</label>
          <textarea
            rows={2}
            value={adminMessage}
            onChange={(e) => setAdminMessage(e.target.value)}
            style={textareaStyle}
            placeholder="Nhập thêm lời nhắn nếu cần..."
          />
        </div>
        <div style={dlgFooter}>
          <button onClick={onClose} style={btnSecondary} disabled={loading}>Hủy</button>
          <button onClick={submit} style={{ ...btnPrimary, background: "#dc2626" }} disabled={loading}>
            {loading ? "Đang xử lý..." : "Xác nhận từ chối"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Detail Dialog ───
function DetailDialog({ record, onClose }) {
  const timeline = [];
  if (record.createdAt) timeline.push({ label: "Giáo viên gửi đơn", time: fmtDateTime(record.createdAt), color: "#3b82f6" });
  if (record.approvedAt) {
    const approved = record.trangThai === "APPROVED";
    timeline.push({
      label: approved ? "Ban giám hiệu đã duyệt" : "Ban giám hiệu từ chối",
      time: fmtDateTime(record.approvedAt),
      color: approved ? "#16a34a" : "#dc2626",
    });
  }

  return (
    <div style={overlayStyle}>
      <div style={{ ...dialogStyle, maxWidth: 560 }}>
        <div style={dlgHeader("#3b82f6")}>
          <span style={{ fontSize: 16, fontWeight: 700 }}>Chi tiết đơn xin nghỉ</span>
          <button onClick={onClose} style={closeBtn}>✕</button>
        </div>
        <div style={{ padding: "20px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20, padding: "14px 16px", background: "#f8fafc", borderRadius: 10 }}>
            <div style={{ width: 42, height: 42, borderRadius: "50%", background: "linear-gradient(135deg,#3b82f6,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
              {(record.giaoVien?.hoTen || "?").charAt(0)}
            </div>
            <div>
              <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 15 }}>{record.giaoVien?.hoTen || "--"}</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>{record.giaoVien?.maGiaoVien || ""}</div>
            </div>
            <div style={{ marginLeft: "auto" }}><StatusBadge status={record.trangThai} /></div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 20px", marginBottom: 16 }}>
            <InfoRow label="Ngày nghỉ" value={fmtDate(record.ngay)} />
            <InfoRow label="Năm học" value={record.namHoc || "--"} />
            <InfoRow label="Lý do" value={record.lyDo || "--"} />
            <InfoRow label="Ghi chú" value={record.ghiChu || "--"} />
            {record.giaoVienThay && <InfoRow label="Người dạy thay" value={record.giaoVienThay?.hoTen || "--"} />}
            {record.lyDoTuChoi && <InfoRow label="Lý do từ chối" value={record.lyDoTuChoi} />}
          </div>

          {record.adminMessage && (
            <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "12px 14px", marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1d4ed8", marginBottom: 4 }}>Phản hồi từ Ban giám hiệu</div>
              <div style={{ fontSize: 14, color: "#1e40af" }}>{record.adminMessage}</div>
              {record.approvedBy && <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>Bởi: {record.approvedBy.username} — {fmtDateTime(record.approvedAt)}</div>}
            </div>
          )}

          {/* Timeline */}
          {timeline.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Tiến trình xử lý</div>
              {timeline.map((t, i) => (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: i < timeline.length - 1 ? 12 : 0 }}>
                  <div style={{ width: 12, height: 12, borderRadius: "50%", background: t.color, flexShrink: 0, marginTop: 3 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{t.label}</div>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>{t.time}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ ...dlgFooter, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={btnSecondary}>Đóng</button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 14, color: "#0f172a" }}>{value}</div>
    </div>
  );
}

// ─── Shared Styles ───
const overlayStyle = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 };
const dialogStyle = { background: "#fff", borderRadius: 16, width: "100%", boxShadow: "0 25px 60px rgba(0,0,0,0.2)", overflow: "hidden" };
const dlgHeader = (color) => ({ background: color, color: "#fff", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" });
const closeBtn = { background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", borderRadius: 6, width: 28, height: 28, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" };
const dlgFooter = { display: "flex", justifyContent: "flex-end", gap: 10, padding: "12px 24px 20px", borderTop: "1px solid #f1f5f9" };
const labelStyle = { display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 };
const textareaStyle = { width: "100%", padding: "10px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, resize: "vertical", outline: "none", boxSizing: "border-box", fontFamily: "inherit" };
const btnPrimary = { padding: "9px 20px", borderRadius: 8, border: "none", color: "#fff", background: "#3b82f6", fontWeight: 700, fontSize: 14, cursor: "pointer" };
const btnSecondary = { padding: "9px 20px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#475569", fontWeight: 600, fontSize: 14, cursor: "pointer" };

// ─── Main Page ───
export default function AdminNghiDayPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL"); // ALL | PENDING | APPROVED | REJECTED
  const { searchQuery, setSearchPlaceholder, setIsSearchVisible } = useAdminSearch();
  const [approveTarget, setApproveTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [detailTarget, setDetailTarget] = useState(null);
  const location = useLocation();

  const fetchAll = useCallback(async () => {
    try {
      const res = await getAllNghi();
      const data = (res?.data?.data || []).sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );
      setRecords(data);
    } catch {
      notifyError("Không thể tải danh sách đơn xin nghỉ.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    setSearchPlaceholder("Tìm giáo viên, lý do...");
    setIsSearchVisible(true);
    return () => {
      setSearchPlaceholder("Tìm kiếm...");
      setIsSearchVisible(true);
    };
  }, [setSearchPlaceholder, setIsSearchVisible]);

  // Auto-focus record coming from a Notification click
  useEffect(() => {
    const refId = location.state?.referenceId;
    if (refId && records.length > 0) {
      const target = records.find((r) => r.id === Number(refId));
      if (target) setDetailTarget(target);
    }
  }, [location.state, records]);

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (filter !== "ALL" && r.trangThai !== filter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          r.giaoVien?.hoTen?.toLowerCase().includes(q) ||
          r.giaoVien?.maGiaoVien?.toLowerCase().includes(q) ||
          r.lyDo?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [records, filter, searchQuery]);

  const counts = useMemo(() => ({
    ALL: records.length,
    PENDING: records.filter((r) => r.trangThai === "PENDING").length,
    APPROVED: records.filter((r) => r.trangThai === "APPROVED").length,
    REJECTED: records.filter((r) => r.trangThai === "REJECTED").length,
  }), [records]);

  const onDone = (updatedRecord) => { 
    setApproveTarget(null); 
    setRejectTarget(null); 
    if (updatedRecord) {
      setRecords(prev => prev.map(r => r.id === updatedRecord.id ? updatedRecord : r));
    } else {
      fetchAll();
    }
  };

  return (
    <div style={{ padding: "28px 32px", background: "#f8fafc", minHeight: "100vh" }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: 0 }}>Quản lý Nghỉ dạy &amp; Dạy thay</h1>
        <p style={{ fontSize: 14, color: "#64748b", margin: "4px 0 0" }}>Xem xét và xử lý các đơn xin nghỉ của giáo viên.</p>
      </div>

      {/* Stat Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { key: "ALL", label: "Tất cả" },
          { key: "PENDING", label: "Chờ duyệt" },
          { key: "APPROVED", label: "Đã duyệt" },
          { key: "REJECTED", label: "Từ chối" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            style={{
              padding: "7px 16px", borderRadius: 8, border: "1px solid",
              fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
              borderColor: filter === tab.key ? "#3b82f6" : "#e2e8f0",
              background: filter === tab.key ? "#eff6ff" : "#fff",
              color: filter === tab.key ? "#1d4ed8" : "#64748b",
            }}
          >
            {tab.label} <span style={{ marginLeft: 4, background: filter === tab.key ? "#bfdbfe" : "#f1f5f9", color: filter === tab.key ? "#1d4ed8" : "#94a3b8", padding: "1px 7px", borderRadius: 12, fontSize: 12 }}>{counts[tab.key]}</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900, fontSize: 14 }}>
            <thead style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
              <tr>
                {["Giáo viên", "Ngày nghỉ", "Lý do", "Thời gian gửi", "Trạng thái", "Thao tác"].map((h) => (
                  <th key={h} style={{ padding: "13px 16px", textAlign: "left", fontWeight: 700, fontSize: 12, color: "#475569", textTransform: "uppercase", letterSpacing: 0.5, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Đang tải...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Không có đơn nào.</td></tr>
              ) : (
                filtered.map((r, idx) => (
                  <tr
                    key={r.id}
                    style={{ borderBottom: "1px solid #f1f5f9", background: idx % 2 === 0 ? "#fff" : "#fafafa", transition: "background 0.15s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f9ff")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = idx % 2 === 0 ? "#fff" : "#fafafa")}
                  >
                    {/* Teacher */}
                    <td style={{ padding: "13px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#3b82f6,#6366f1)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                          {(r.giaoVien?.hoTen || "?").charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: "#0f172a" }}>{r.giaoVien?.hoTen || "--"}</div>
                          <div style={{ fontSize: 12, color: "#94a3b8" }}>{r.giaoVien?.maGiaoVien || ""}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "13px 16px", fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap" }}>{fmtDate(r.ngay)}</td>
                    <td style={{ padding: "13px 16px", color: "#334155", maxWidth: 220 }}><div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.lyDo || "--"}</div></td>
                    <td style={{ padding: "13px 16px", color: "#64748b", whiteSpace: "nowrap", fontSize: 13 }}>{fmtDateTime(r.createdAt)}</td>
                    <td style={{ padding: "13px 16px" }}><StatusBadge status={r.trangThai} /></td>
                    {/* Actions */}
                    <td style={{ padding: "13px 16px" }}>
                      <div style={{ display: "flex", gap: 6, flexWrap: "nowrap" }}>
                        <button onClick={() => setDetailTarget(r)} style={{ ...actionBtn, color: "#3b82f6", borderColor: "#bfdbfe", background: "#eff6ff" }}>Xem</button>
                        {r.trangThai === "PENDING" && (
                          <>
                            <button onClick={() => setApproveTarget(r)} style={{ ...actionBtn, color: "#15803d", borderColor: "#bbf7d0", background: "#f0fdf4" }}>Duyệt</button>
                            <button onClick={() => setRejectTarget(r)} style={{ ...actionBtn, color: "#dc2626", borderColor: "#fecaca", background: "#fef2f2" }}>Từ chối</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div style={{ padding: "10px 16px", borderTop: "1px solid #f1f5f9", fontSize: 13, color: "#94a3b8", textAlign: "right" }}>
          {filtered.length} / {records.length} đơn
        </div>
      </div>

      {/* Dialogs */}
      {approveTarget && <ApproveDialog record={approveTarget} onClose={() => setApproveTarget(null)} onDone={onDone} />}
      {rejectTarget && <RejectDialog record={rejectTarget} onClose={() => setRejectTarget(null)} onDone={onDone} />}
      {detailTarget && <DetailDialog record={detailTarget} onClose={() => setDetailTarget(null)} />}
    </div>
  );
}

const actionBtn = { padding: "5px 12px", borderRadius: 6, border: "1px solid", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" };
