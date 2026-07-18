import { useEffect, useState } from "react";
import PageHeader from "../../../components/edu/PageHeader.jsx";
import MaterialIcon from "../../../components/edu/MaterialIcon.jsx";
import SimpleModal from "../../../components/modal/SimpleModal.jsx";
import axiosClient from "../../../api/axiosClient.js";
import { notifyError, notifySuccess } from "../../../utils/notify.js";
import { updateTkbNote } from "../../../api/thoikhoabieuApi.js";

const DAYS = [
  { value: 2, label: "Thứ Hai" },
  { value: 3, label: "Thứ Ba" },
  { value: 4, label: "Thứ Tư" },
  { value: 5, label: "Thứ Năm" },
  { value: 6, label: "Thứ Sáu" },
  { value: 7, label: "Thứ Bảy" }
];

const PERIODS = Array.from({ length: 10 }, (_, i) => ({
  value: i + 1,
  label: `Tiết ${i + 1}`,
  session: i < 5 ? "Sáng" : "Chiều"
}));

export default function TeacherRegisterPhanCong() {
  const [timetable, setTimetable] = useState([]);
  const [myClasses, setMyClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null); // { thu, tiet }
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [form, setForm] = useState({
    phanCongId: "",
    soTiet: 1
  });
  const [moveForm, setMoveForm] = useState({ targetThu: 2, targetTiet: 1 });
  const [swapTargetId, setSwapTargetId] = useState("");
  const [noteText, setNoteText] = useState("");

  const [namHoc, setNamHoc] = useState("2025-2026");
  const [hocKy, setHocKy] = useState(1);
  const [tuan, setTuan] = useState(1);

  const fetchData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const params = { namHoc, hocKy, tuan };
      const [resTkb, resClasses] = await Promise.all([
        axiosClient.get("/giaoviendangky/thoikhoabieu", { params, skipCache: true }),
        axiosClient.get("/giaoviendangky/lop-cua-toi", { params: { namHoc, hocKy }, skipCache: true })
      ]);
      const serverSlots = resTkb?.data?.data || [];
      if (silent) {
        setTimetable((prev) => {
          const merged = [...serverSlots];
          prev.forEach((optSlot) => {
            if (optSlot.isLocked) {
              const exists = serverSlots.some(
                (s) => s.id === optSlot.id || (s.thu === optSlot.thu && s.tietBatDau === optSlot.tietBatDau && s.tuan === optSlot.tuan)
              );
              if (!exists) {
                merged.push(optSlot);
              }
            }
          });
          return merged;
        });
      } else {
        setTimetable(serverSlots);
      }
      setMyClasses(resClasses?.data?.data || []);
    } catch (err) {
      notifyError("Không thể tải lịch dạy của giáo viên.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [namHoc, hocKy, tuan]);

  const findTkbEntry = (day, period) => {
    return timetable.find((t) => {
      const start = t.tietBatDau;
      const count = t.soTiet || 1;
      return t.thu === day && period >= start && period < start + count;
    });
  };

  const handleCellClick = (day, period) => {
    const entry = findTkbEntry(day, period);
    if (entry) {
      if (entry.isLocked) {
        setEditingEntry(entry);
        setNoteText(entry.ghiChu || "");
        setMoveForm({ targetThu: day, targetTiet: period });
        setSwapTargetId("");
        setEditModalOpen(true);
      } else {
        notifyError("Đây là tiết học do hệ thống xếp lịch tự động, không thể sửa đổi.");
      }
    } else {
      setSelectedSlot({ thu: day, tiet: period });
      setForm({ phanCongId: myClasses[0]?.phanCongId || "", soTiet: 1 });
      setRegisterModalOpen(true);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!form.phanCongId) {
      notifyError("Vui lòng chọn lớp học đăng ký dạy.");
      return;
    }
    const pc = myClasses.find((c) => c.phanCongId === parseInt(form.phanCongId));
    if (!pc) {
      notifyError("Phân công không hợp lệ.");
      return;
    }

    try {
      const payload = {
        lopId: pc.lopId,
        monHocId: pc.monHocId,
        thu: selectedSlot.thu,
        tietBatDau: selectedSlot.tiet,
        soTiet: parseInt(form.soTiet),
        namHoc,
        hocKy,
        tuan
      };
      const res = await axiosClient.post("/giaoviendangky/thoikhoabieu/dangky", payload);
      notifySuccess("Đăng ký tiết dạy thành công.");
      setRegisterModalOpen(false);
      
      // Optimistic update
      const newSlot = res?.data?.data;
      if (newSlot) {
        setTimetable((prev) => [...prev, newSlot]);
      }
      axiosClient.invalidateCache("/giaoviendangky/thoikhoabieu");
      setTimeout(() => {
        fetchData(true);
      }, 500);
    } catch (err) {
      notifyError(err?.response?.data?.message || "Lỗi khi đăng ký tiết dạy.");
    }
  };

  const handleSaveNote = async (e) => {
    e.preventDefault();
    if (!editingEntry) return;
    try {
      await updateTkbNote(editingEntry.id, noteText);
      notifySuccess("Lưu thông báo cho lớp thành công.");
      setTimetable((prev) =>
        prev.map((t) => (t.id === editingEntry.id ? { ...t, ghiChu: noteText } : t))
      );
      setEditModalOpen(false);
    } catch (err) {
      notifyError(err?.response?.data?.message || "Lỗi khi lưu thông báo.");
    }
  };

  const handleMove = async (e) => {
    e.preventDefault();
    try {
      const res = await axiosClient.post("/giaoviendangky/thoikhoabieu/doi-lich", null, {
        params: {
          sourceId: editingEntry.id,
          targetThu: moveForm.targetThu,
          targetTiet: moveForm.targetTiet
        }
      });
      notifySuccess("Di chuyển tiết dạy thành công.");
      setEditModalOpen(false);
      
      // Optimistic update
      const updatedSlot = res?.data?.data;
      if (updatedSlot) {
        setTimetable((prev) => prev.map((t) => t.id === updatedSlot.id ? updatedSlot : t));
      }
      axiosClient.invalidateCache("/giaoviendangky/thoikhoabieu");
      setTimeout(() => {
        fetchData(true);
      }, 500);
    } catch (err) {
      notifyError(err?.response?.data?.message || "Lỗi khi di chuyển tiết dạy.");
    }
  };

  const handleSwap = async (e) => {
    e.preventDefault();
    if (!swapTargetId) {
      notifyError("Vui lòng chọn tiết học muốn hoán đổi.");
      return;
    }
    try {
      await axiosClient.post("/giaoviendangky/thoikhoabieu/doi-lich", null, {
        params: {
          sourceId: editingEntry.id,
          targetId: swapTargetId
        }
      });
      notifySuccess("Hoán đổi tiết dạy thành công.");
      setEditModalOpen(false);
      axiosClient.invalidateCache("/giaoviendangky/thoikhoabieu");
      setTimeout(() => {
        fetchData(true);
      }, 500);
    } catch (err) {
      notifyError(err?.response?.data?.message || "Lỗi khi hoán đổi tiết dạy.");
    }
  };

  const handleDeleteCurrent = () => {
    setEditModalOpen(false);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await handleDelete(editingEntry.id);
      setDeleteConfirmOpen(false);
    } catch (err) {}
  };

  const handleDelete = async (id) => {
    try {
      await axiosClient.delete(`/giaoviendangky/thoikhoabieu/${id}`);
      notifyError("Đã hủy đăng ký tiết dạy thành công.");
      
      // Optimistic update
      setTimetable((prev) => prev.filter((t) => t.id !== id));
      axiosClient.invalidateCache("/giaoviendangky/thoikhoabieu");
      setTimeout(() => {
        fetchData(true);
      }, 500);
    } catch (err) {
      notifyError(err?.response?.data?.message || "Không thể hủy đăng ký tiết dạy.");
    }
  };

  return (
    <div className="page" style={{ padding: "24px" }}>
      <PageHeader
        title="Đăng ký lịch dạy theo tuần"
        actions={
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <select
              value={namHoc}
              onChange={(e) => setNamHoc(e.target.value)}
              style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #ccc", fontSize: 13 }}
            >
              <option value="2025-2026">Năm học 2025-2026</option>
              <option value="2024-2025">Năm học 2024-2025</option>
              <option value="2023-2024">Năm học 2023-2024</option>
            </select>
            <select
              value={hocKy}
              onChange={(e) => setHocKy(parseInt(e.target.value))}
              style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #ccc", fontSize: 13 }}
            >
              <option value={1}>Học kỳ I</option>
              <option value={2}>Học kỳ II</option>
            </select>
            <select
              value={tuan}
              onChange={(e) => setTuan(parseInt(e.target.value))}
              style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #ccc", fontSize: 13 }}
            >
              {Array.from({ length: 36 }, (_, i) => (
                <option key={i + 1} value={i + 1}>Tuần {i + 1}</option>
              ))}
            </select>
          </div>
        }
      />

      <div className="card" style={{ padding: 24, marginTop: 24 }}>

        {loading ? (
          <div style={{ padding: "40px 0", textAlign: "center", color: "#888" }}>Đang tải lịch dạy...</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
              <thead>
                <tr>
                  <th style={{ border: "1px solid var(--outline-variant, #eee)", padding: "12px", background: "#f8fafc", width: 100 }}>Buổi</th>
                  <th style={{ border: "1px solid var(--outline-variant, #eee)", padding: "12px", background: "#f8fafc", width: 100 }}>Tiết</th>
                  {DAYS.map((day) => (
                    <th key={day.value} style={{ border: "1px solid var(--outline-variant, #eee)", padding: "12px", background: "#f8fafc", fontWeight: 600 }}>
                      {day.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERIODS.map((period, pIndex) => {
                  const showSessionCell = pIndex === 0 || pIndex === 5;
                  return (
                    <tr key={period.value}>
                      {showSessionCell && (
                        <td
                          rowSpan={5}
                          style={{
                            border: "1px solid var(--outline-variant, #eee)",
                            textAlign: "center",
                            fontWeight: 700,
                            background: "#f1f5f9",
                            color: "var(--primary, #2563eb)",
                            fontSize: 14
                          }}
                        >
                          {period.session}
                        </td>
                      )}
                      <td style={{ border: "1px solid var(--outline-variant, #eee)", padding: "12px", textAlign: "center", background: "#fafafa", fontWeight: 500, fontSize: 13 }}>
                        {period.label}
                      </td>
                      {DAYS.map((day) => {
                        const entry = findTkbEntry(day.value, period.value);
                        const isStart = entry && entry.tietBatDau === period.value;
                        const isSpan = entry && entry.tietBatDau !== period.value;

                        if (isSpan) return null; // Let rowSpan handle the slot

                        return (
                          <td
                            key={day.value}
                            rowSpan={entry ? entry.soTiet || 1 : 1}
                            onClick={() => handleCellClick(day.value, period.value)}
                            style={{
                              border: "1px solid var(--outline-variant, #eee)",
                              padding: entry ? "12px" : "16px",
                              textAlign: "center",
                              background: entry ? (entry.isLocked ? "#eff6ff" : "#f1f5f9") : "transparent",
                              cursor: "pointer",
                              transition: "all 0.2s ease",
                              verticalAlign: "middle"
                            }}
                            onMouseEnter={(e) => {
                              if (!entry) e.currentTarget.style.background = "#f8fafc";
                            }}
                            onMouseLeave={(e) => {
                              if (!entry) e.currentTarget.style.background = "transparent";
                            }}
                          >
                            {entry ? (
                              <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "center" }}>
                                <div style={{ fontWeight: 700, color: entry.isLocked ? "#1e40af" : "#475569" }}>
                                  Lớp {entry.lop?.tenLop}
                                </div>
                                <div style={{ fontSize: 13, color: entry.isLocked ? "#2563eb" : "#64748b" }}>
                                  Môn: {entry.monHoc?.tenMon}
                                </div>
                                {entry.isLocked ? (
                                  <span style={{ display: "inline-block", background: "#dbeafe", color: "#1e40af", padding: "2px 6px", borderRadius: 4, fontSize: 10, fontWeight: 600, marginTop: 4 }}>
                                    Tự đăng ký
                                  </span>
                                ) : (
                                  <span style={{ display: "inline-block", background: "#e2e8f0", color: "#475569", padding: "2px 6px", borderRadius: 4, fontSize: 10, fontWeight: 500, marginTop: 4 }}>
                                    Hệ thống xếp
                                  </span>
                                )}
                                {entry.ghiChu && (
                                  <div style={{ marginTop: 4, padding: "2px 6px", borderRadius: 4, backgroundColor: "#fef3c7", color: "#d97706", fontSize: 11, fontWeight: 600, maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    📝 {entry.ghiChu}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span style={{ fontSize: 12, color: "#cbd5e1" }}>+ Đăng ký</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <SimpleModal
        open={registerModalOpen}
        title={`Đăng ký tiết dạy - Thứ ${selectedSlot?.thu} Tiết ${selectedSlot?.tiet}`}
        onClose={() => setRegisterModalOpen(false)}
      >
        <form onSubmit={handleRegister} className="form-grid" style={{ gap: 16 }}>
          <label className="form-field">
            <span>Chọn lớp phụ trách</span>
            <select
              value={form.phanCongId}
              onChange={(e) => setForm((prev) => ({ ...prev, phanCongId: e.target.value }))}
              style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #ccc" }}
            >
              <option value="">-- Chọn lớp học --</option>
              {myClasses.map((c) => (
                <option key={c.phanCongId} value={c.phanCongId}>
                  Lớp {c.tenLop} - Môn {c.tenMon}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field">
            <span>Số tiết học</span>
            <select
              value={form.soTiet}
              onChange={(e) => setForm((prev) => ({ ...prev, soTiet: parseInt(e.target.value) }))}
              style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #ccc" }}
            >
              <option value={1}>1 tiết</option>
              <option value={2}>2 tiết liền nhau (tiết đôi)</option>
              <option value={3}>3 tiết liền nhau</option>
            </select>
          </label>

          <div className="form-actions" style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 16 }}>
            <button type="button" className="btn-outline" onClick={() => setRegisterModalOpen(false)}>
              Hủy
            </button>
            <button type="submit" className="btn-primary">
              Xác nhận đăng ký
            </button>
          </div>
        </form>
      </SimpleModal>

      <SimpleModal
        open={editModalOpen}
        title={`Chỉnh sửa tiết dạy lớp ${editingEntry?.lop?.tenLop} - môn ${editingEntry?.monHoc?.tenMon}`}
        onClose={() => setEditModalOpen(false)}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Di chuyển */}
          <form onSubmit={handleMove} style={{ borderBottom: "1px solid #eee", paddingBottom: 16 }}>
            <span style={{ fontWeight: 600, fontSize: 13, color: "var(--primary, #2563eb)" }}>1. Di chuyển sang ô trống khác</span>
            <div style={{ display: "flex", gap: 12, marginTop: 8, alignItems: "flex-end" }}>
              <label className="form-field" style={{ flex: 1 }}>
                <span style={{ fontSize: 12 }}>Thứ</span>
                <select
                  value={moveForm.targetThu}
                  onChange={(e) => setMoveForm(prev => ({ ...prev, targetThu: parseInt(e.target.value) }))}
                  style={{ width: "100%", padding: "8px", borderRadius: 6, border: "1px solid #ccc", fontSize: 13 }}
                >
                  {DAYS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </label>
              <label className="form-field" style={{ flex: 1 }}>
                <span style={{ fontSize: 12 }}>Tiết bắt đầu</span>
                <select
                  value={moveForm.targetTiet}
                  onChange={(e) => setMoveForm(prev => ({ ...prev, targetTiet: parseInt(e.target.value) }))}
                  style={{ width: "100%", padding: "8px", borderRadius: 6, border: "1px solid #ccc", fontSize: 13 }}
                >
                  {PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </label>
              <button type="submit" className="btn-primary" style={{ padding: "8px 16px", height: 36, fontSize: 13 }}>
                Di chuyển
              </button>
            </div>
          </form>

          {/* Hoán đổi */}
          <form onSubmit={handleSwap} style={{ borderBottom: "1px solid #eee", paddingBottom: 16 }}>
            <span style={{ fontWeight: 600, fontSize: 13, color: "var(--primary, #2563eb)" }}>2. Hoán đổi vị trí với tiết dạy khác</span>
            <div style={{ display: "flex", gap: 12, marginTop: 8, alignItems: "flex-end" }}>
              <label className="form-field" style={{ flex: 1 }}>
                <span style={{ fontSize: 12 }}>Chọn tiết hoán đổi</span>
                <select
                  value={swapTargetId}
                  onChange={(e) => setSwapTargetId(e.target.value)}
                  style={{ width: "100%", padding: "8px", borderRadius: 6, border: "1px solid #ccc", fontSize: 13 }}
                >
                  <option value="">-- Chọn tiết học --</option>
                  {timetable
                    .filter(t => t.isLocked && t.id !== editingEntry?.id)
                    .map(t => (
                      <option key={t.id} value={t.id}>
                        Lớp {t.lop?.tenLop} - Thứ {t.thu} Tiết {t.tietBatDau}
                      </option>
                    ))}
                </select>
              </label>
              <button type="submit" className="btn-primary" style={{ padding: "8px 16px", height: 36, fontSize: 13 }} disabled={!swapTargetId}>
                Hoán đổi
              </button>
            </div>
          </form>

          {/* Ghi chú */}
          <form onSubmit={handleSaveNote} style={{ borderBottom: "1px solid #eee", paddingBottom: 16 }}>
            <span style={{ fontWeight: 600, fontSize: 13, color: "var(--primary, #2563eb)" }}>3. Ghi chú tiết học / Thông báo lớp</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Nhập thông báo, ghi chú lớp học (ví dụ: Kiểm tra 15p, Mang theo sách bài tập...)"
                rows={2}
                style={{ width: "100%", padding: "8px", borderRadius: 6, border: "1px solid #ccc", fontSize: 13, resize: "none" }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button type="submit" className="btn-primary" style={{ padding: "6px 16px", fontSize: 13 }}>
                  Lưu thông báo
                </button>
              </div>
            </div>
          </form>

          {/* Xóa */}
          <div>
            <span style={{ fontWeight: 600, fontSize: 13, color: "var(--error, #ef4444)" }}>4. Hủy đăng ký tiết học này</span>
            <div style={{ marginTop: 8 }}>
              <button type="button" className="btn-outline" onClick={handleDeleteCurrent} style={{ width: "100%", color: "#ef4444", borderColor: "#fca5a5", background: "#fef2f2", padding: "10px", borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
                Hủy đăng ký (Xóa tiết)
              </button>
            </div>
          </div>
        </div>
      </SimpleModal>

      <SimpleModal
        open={deleteConfirmOpen}
        title="Hủy đăng ký tiết dạy"
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "8px 0" }}>
          <div style={{ 
            width: 48, 
            height: 48, 
            borderRadius: "50%", 
            background: "#fee2e2", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            color: "#ef4444"
          }}>
            <MaterialIcon name="warning" style={{ fontSize: 28 }} />
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontWeight: 600, fontSize: 16, color: "#111827", marginBottom: 6 }}>Xác nhận hủy đăng ký</p>
            <p style={{ fontSize: 14, color: "#4b5563", lineHeight: "1.5" }}>
              Bạn có chắc chắn muốn hủy tiết dạy môn <strong style={{ color: "#ef4444" }}>{editingEntry?.monHoc?.tenMon}</strong> của lớp <strong>{editingEntry?.lop?.tenLop}</strong>?
            </p>
          </div>
          <div style={{ display: "flex", width: "100%", gap: 12, marginTop: 12 }}>
            <button 
              type="button" 
              className="btn-outline" 
              onClick={() => setDeleteConfirmOpen(false)}
              style={{ flex: 1 }}
            >
              Quay lại
            </button>
            <button 
              type="button" 
              className="btn-primary" 
              onClick={handleConfirmDelete}
              style={{ flex: 1, background: "#ef4444", borderColor: "#ef4444", color: "#fff" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#dc2626"}
              onMouseLeave={(e) => e.currentTarget.style.background = "#ef4444"}
            >
              Hủy tiết dạy
            </button>
          </div>
        </div>
      </SimpleModal>
    </div>
  );
}
