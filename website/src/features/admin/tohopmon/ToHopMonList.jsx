import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../../components/edu/PageHeader.jsx";
import MaterialIcon from "../../../components/edu/MaterialIcon.jsx";
import SimpleModal from "../../../components/modal/SimpleModal.jsx";
import {
  getToHopMon,
  createToHopMon,
  updateToHopMon,
  deleteToHopMon
} from "../../../api/toHopMonApi.js";
import { getMonHoc } from "../../../api/monhocApi.js";
import { notifyError, notifySuccess } from "../../../utils/notify.js";

const BAN_OPTIONS = ["Tự nhiên", "Xã hội", "Kết hợp"];

const DEFAULT_COMBINATIONS = [
  // Nhóm Tự nhiên (định hướng khối A, B)
  { maToHop: "TN1", tenToHop: "Tự nhiên 1", ban: "Tự nhiên", monHoc: ["Vật lí", "Hóa học", "Sinh học", "Tin học"] },
  { maToHop: "TN2", tenToHop: "Tự nhiên 2", ban: "Tự nhiên", monHoc: ["Vật lí", "Hóa học", "Sinh học", "Công nghệ - Định hướng công nghiệp"] },
  { maToHop: "TN3", tenToHop: "Tự nhiên 3", ban: "Tự nhiên", monHoc: ["Vật lí", "Hóa học", "Tin học", "Công nghệ - Định hướng công nghiệp"] },
  { maToHop: "TN4", tenToHop: "Tự nhiên 4", ban: "Tự nhiên", monHoc: ["Vật lí", "Sinh học", "Tin học", "Địa lí"] },
  // Nhóm Xã hội (định hướng khối C, D)
  { maToHop: "XH1", tenToHop: "Xã hội 1", ban: "Xã hội", monHoc: ["Địa lí", "Giáo dục kinh tế và pháp luật", "Âm nhạc", "Tin học"] },
  { maToHop: "XH2", tenToHop: "Xã hội 2", ban: "Xã hội", monHoc: ["Địa lí", "Giáo dục kinh tế và pháp luật", "Âm nhạc", "Mỹ thuật"] },
  { maToHop: "XH3", tenToHop: "Xã hội 3", ban: "Xã hội", monHoc: ["Địa lí", "Giáo dục kinh tế và pháp luật", "Tin học", "Công nghệ - Định hướng công nghiệp"] },
  // Nhóm Kết hợp (định hướng khối D, thi năng khiếu)
  { maToHop: "KH1", tenToHop: "Kết hợp 1", ban: "Kết hợp", monHoc: ["Vật lí", "Hóa học", "Địa lí", "Giáo dục kinh tế và pháp luật"] },
  { maToHop: "KH2", tenToHop: "Kết hợp 2", ban: "Kết hợp", monHoc: ["Vật lí", "Tin học", "Địa lí", "Giáo dục kinh tế và pháp luật"] }
];

const getApiErrorMessage = (err, fallback) => {
  const message = err?.response?.data?.message || err?.response?.data?.error;
  return message || fallback;
};

export default function ToHopMonList() {
  const [toHopList, setToHopList] = useState([]);
  const [allMonHoc, setAllMonHoc] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [keyword, setKeyword] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    maToHop: "",
    tenToHop: "",
    ban: "Tự nhiên",
    moTa: "",
    monHocIds: []
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const [toHopRes, monHocRes] = await Promise.all([
        getToHopMon(),
        getMonHoc()
      ]);
      setToHopList(toHopRes?.data?.data || []);
      setAllMonHoc(monHocRes?.data?.data || []);
    } catch {
      setError("Không thể tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!active) return;
      await fetchData();
    };
    load();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!successMessage) return undefined;
    const timer = window.setTimeout(() => setSuccessMessage(""), 2500);
    return () => window.clearTimeout(timer);
  }, [successMessage]);

  const stats = useMemo(() => {
    const total = toHopList.length;
    const active = toHopList.filter((item) => item.isActive).length;
    const totalLop = toHopList.reduce((sum, item) => sum + (item.soLopSuDung || 0), 0);
    return { total, active, totalLop };
  }, [toHopList]);

  const filteredList = useMemo(() => {
    if (!keyword.trim()) return toHopList;
    const lower = keyword.toLowerCase();
    return toHopList.filter((item) =>
      [item.maToHop, item.tenToHop, item.ban, ...(item.tenMonHocs || [])]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(lower))
    );
  }, [keyword, toHopList]);

  const groupedByBan = useMemo(() => {
    const map = new Map();
    filteredList.forEach((item) => {
      const ban = item.ban || "Khác";
      if (!map.has(ban)) map.set(ban, []);
      map.get(ban).push(item);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredList]);

  const openCreate = () => {
    setEditingItem(null);
    setForm({ maToHop: "", tenToHop: "", ban: "Tự nhiên", moTa: "", monHocIds: [], soTiets: [] });
    setFormError("");
    setSuccessMessage("");
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setForm({
      maToHop: item.maToHop || "",
      tenToHop: item.tenToHop || "",
      ban: item.ban || "Tự nhiên",
      moTa: item.moTa || "",
      monHocIds: item.monHocIds || [],
      soTiets: item.soTiets || []
    });
    setFormError("");
    setSuccessMessage("");
    setModalOpen(true);
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Xóa tổ hợp ${item.maToHop} - ${item.tenToHop}?`)) return;
    try {
      await deleteToHopMon(item.id);
      setToHopList((prev) => prev.filter((row) => row.id !== item.id));
      setError("");
      setSuccessMessage("Xóa tổ hợp môn thành công.");
    } catch (err) {
      setError(getApiErrorMessage(err, "Không thể xóa tổ hợp môn."));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    if (!form.maToHop.trim()) {
      setFormError("Vui lòng nhập mã tổ hợp.");
      return;
    }
    if (!form.tenToHop.trim()) {
      setFormError("Vui lòng nhập tên tổ hợp.");
      return;
    }
    if (!form.ban) {
      setFormError("Vui lòng chọn ban.");
      return;
    }
    if (form.monHocIds.length !== 4) {
      setFormError("Tổ hợp môn phải có đúng 4 môn tự chọn.");
      return;
    }

    const finalSoTiets = form.monHocIds.map((_, index) => form.soTiets?.[index] ?? 2);

    const payload = {
      maToHop: form.maToHop.trim().toUpperCase(),
      tenToHop: form.tenToHop.trim(),
      ban: form.ban,
      moTa: form.moTa.trim(),
      monHocIds: form.monHocIds,
      soTiets: finalSoTiets
    };

    try {
      if (editingItem) {
        const response = await updateToHopMon(editingItem.id, payload);
        const updated = response?.data?.data;
        setToHopList((prev) =>
          prev.map((row) => (row.id === editingItem.id ? updated : row))
        );
      } else {
        const response = await createToHopMon(payload);
        const created = response?.data?.data;
        setToHopList((prev) => [created, ...prev]);
      }
      setError("");
      setSuccessMessage(editingItem ? "Cập nhật tổ hợp môn thành công." : "Thêm tổ hợp môn thành công.");
      setModalOpen(false);
    } catch (err) {
      setFormError(getApiErrorMessage(err, "Không thể lưu tổ hợp môn."));
    }
  };

  const handleMonHocToggle = (monHocId) => {
    setForm((prev) => {
      const ids = prev.monHocIds.includes(monHocId)
        ? prev.monHocIds.filter((id) => id !== monHocId)
        : [...prev.monHocIds, monHocId];
      return { ...prev, monHocIds: ids };
    });
  };

  const handleSeedDefaults = async () => {
    try {
      setError("");
      setSuccessMessage("");
      const existingMaSet = new Set(toHopList.map((item) => item.maToHop));

      const monHocMap = new Map();
      allMonHoc.forEach((m) => {
        monHocMap.set(m.tenMon, m.id);
      });

      let createdCount = 0;
      for (const combo of DEFAULT_COMBINATIONS) {
        if (existingMaSet.has(combo.maToHop)) continue;

        const monHocIds = combo.monHoc
          .map((ten) => monHocMap.get(ten))
          .filter(Boolean);

        if (monHocIds.length !== 4) {
          notifyError(`Thiếu môn học cho tổ hợp ${combo.maToHop}. Vui lòng thêm đủ môn trước.`);
          continue;
        }

        await createToHopMon({
          maToHop: combo.maToHop,
          tenToHop: combo.tenToHop,
          ban: combo.ban,
          monHocIds
        });
        createdCount++;
      }

      await fetchData();
      if (createdCount > 0) {
        notifySuccess(`Đã tạo ${createdCount} tổ hợp môn theo quy định.`);
      } else {
        setSuccessMessage("Danh mục tổ hợp đã đủ theo quy định.");
      }
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Không thể tạo tổ hợp môn."));
    }
  };

  // Nhóm môn học theo loại (bắt buộc vs tự chọn) để hiển thị trong form
  const monHocByType = useMemo(() => {
    const batBuoc = ["Toán", "Ngữ văn", "Tiếng Anh", "Lịch sử", "Giáo dục thể chất",
      "Giáo dục QP&AN", "Hoạt động trải nghiệm", "Nội dung giáo dục địa phương"];
    const batBuocList = [];
    const tuChonList = [];
    allMonHoc.forEach((m) => {
      if (batBuoc.some((bb) => m.tenMon?.includes(bb) || bb.includes(m.tenMon))) {
        batBuocList.push(m);
      } else {
        tuChonList.push(m);
      }
    });
    return { batBuocList, tuChonList };
  }, [allMonHoc]);

  return (
    <div className="page users-page">
      <PageHeader
        title="Tổ hợp môn tự chọn"
        actions={
          <div className="users-actions">
            <div className="dash-search users-search">
              <span className="dot" />
              <input
                placeholder="Tìm theo mã, tên tổ hợp hoặc môn học"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
              />
            </div>
            <button className="btn-primary" onClick={openCreate}>
              Thêm tổ hợp
            </button>
          </div>
        }
      />

      <div className="users-stats">
        <div className="stat-card stat-blue">
          <div className="stat-label">Tổng tổ hợp</div>
          <div className="stat-value">{loading ? "..." : stats.total}</div>
        </div>
        <div className="stat-card stat-sky">
          <div className="stat-label">Đang hoạt động</div>
          <div className="stat-value">{loading ? "..." : stats.active}</div>
        </div>
        <div className="stat-card stat-ice">
          <div className="stat-label">Lớp đang sử dụng</div>
          <div className="stat-value">{loading ? "..." : stats.totalLop}</div>
        </div>
      </div>

      <div className="card users-table">
        <div className="table-header">
          <div>
            <div className="panel-title">Danh sách tổ hợp môn</div>
            <div className="panel-subtitle">Mỗi tổ hợp gồm 4 môn tự chọn</div>
          </div>
          <div className="panel-pill">{filteredList.length} tổ hợp</div>
        </div>
        {error && <div className="table-empty">{error}</div>}
        {!error && successMessage && <div className="table-success">{successMessage}</div>}
        {!error && !loading && filteredList.length === 0 && (
          <div className="table-empty">Không tìm thấy tổ hợp phù hợp.</div>
        )}
        <div className="grade-group-wrap">
          {loading
            ? Array.from({ length: 3 }).map((_, index) => (
                <div className="table-row" key={`skeleton-${index}`}>
                  <div className="skeleton" />
                  <div className="skeleton" />
                  <div className="skeleton" />
                </div>
              ))
            : groupedByBan.map(([ban, items]) => (
                <div className="grade-group" key={ban}>
                  <div className="grade-group-title">{ban}</div>
                  <div className="table-grid">
                    {items.map((item) => (
                      <div
                        className="table-row"
                        key={item.id}
                        style={{ gridTemplateColumns: "70px 1fr 1fr 100px 140px" }}
                      >
                        <div className="table-id">
                          <span className="role-pill" style={{ fontWeight: 700 }}>{item.maToHop}</span>
                        </div>
                        <div className="table-main">
                          <div className="table-title">{item.tenToHop}</div>
                          <div className="table-meta">{item.ban}</div>
                        </div>
                        <div>
                          <div className="text-body-sm" style={{ color: "var(--on-surface-variant, #666)" }}>
                            {(item.tenMonHocs || []).map((ten, index) => {
                              const soTiet = item.soTiets?.[index] ?? 2;
                              return `${ten} (${soTiet}t)`;
                            }).join(", ") || "Chưa có môn"}
                          </div>
                        </div>
                        <div>
                          <span className="role-pill">{item.soLopSuDung || 0} lớp</span>
                        </div>
                        <div className="table-actions">
                          <button
                            className="btn-outline btn-sm"
                            onClick={() => openEdit(item)}
                          >
                            Sửa
                          </button>
                          <button
                            className="rounded-lg p-sm text-outline hover:bg-red-50 hover:text-red-600"
                            onClick={() => handleDelete(item)}
                            title="Xóa"
                          >
                            <MaterialIcon name="delete" className="text-[20px]" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
        </div>
      </div>

      <SimpleModal
        open={modalOpen}
        title={editingItem ? "Cập nhật tổ hợp môn" : "Thêm tổ hợp môn"}
        onClose={() => setModalOpen(false)}
      >
        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="form-field">
            <span>Mã tổ hợp</span>
            <input
              value={form.maToHop}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, maToHop: event.target.value.toUpperCase() }))
              }
              placeholder="vd: A1"
              maxLength={10}
              disabled={!!editingItem}
            />
          </label>
          <label className="form-field">
            <span>Tên tổ hợp</span>
            <input
              value={form.tenToHop}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, tenToHop: event.target.value }))
              }
              placeholder="vd: KHTN 1"
            />
          </label>
          <label className="form-field">
            <span>Ban</span>
            <select
              value={form.ban}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, ban: event.target.value }))
              }
            >
              {BAN_OPTIONS.map((ban) => (
                <option key={ban} value={ban}>{ban}</option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Mô tả</span>
            <input
              value={form.moTa}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, moTa: event.target.value }))
              }
              placeholder="Mô tả tổ hợp (tùy chọn)"
            />
          </label>

          <div className="form-field">
            <span>Môn tự chọn (chọn đúng 4 môn)</span>
            <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 8 }}>
              {monHocByType.tuChonList.map((mon) => {
                const selected = form.monHocIds.includes(mon.id);
                return (
                  <button
                    key={mon.id}
                    type="button"
                    onClick={() => handleMonHocToggle(mon.id)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 8,
                      border: selected ? "2px solid var(--primary, #2563eb)" : "1px solid var(--outline, #ccc)",
                      background: selected ? "var(--primary-container, #dbeafe)" : "transparent",
                      color: selected ? "var(--on-primary-container, #1e40af)" : "inherit",
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: selected ? 600 : 400
                    }}
                  >
                    {mon.tenMon}
                  </button>
                );
              })}
            </div>
            <div style={{ marginTop: 6, fontSize: 12, color: "var(--on-surface-variant, #888)" }}>
              Đã chọn: {form.monHocIds.length}/4 môn
            </div>

            {form.monHocIds.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--on-surface, #333)" }}>Cấu hình số tiết học của các môn tự chọn:</span>
                <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 8 }}>
                  {form.monHocIds.map((id, index) => {
                    const mon = allMonHoc.find((m) => m.id === id);
                    if (!mon) return null;
                    const currentPeriod = form.soTiets?.[index] ?? 2;
                    return (
                      <div key={id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 12px", border: "1px solid var(--outline-variant, #eee)", borderRadius: 8, background: "#fcfcfc" }}>
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{mon.tenMon}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 12, color: "#666" }}>Số tiết/tuần:</span>
                          <input
                            type="number"
                            min={1}
                            max={5}
                            value={currentPeriod}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 2;
                              setForm((prev) => {
                                const newSoTiets = [...(prev.soTiets || [])];
                                while (newSoTiets.length < prev.monHocIds.length) newSoTiets.push(2);
                                newSoTiets[index] = val;
                                return { ...prev, soTiets: newSoTiets };
                              });
                            }}
                            style={{ width: 60, padding: "4px 8px", borderRadius: 6, border: "1px solid #ccc", textAlign: "center", fontSize: 13 }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {formError && <div className="form-error">{formError}</div>}
          <div className="form-actions">
            <button
              type="button"
              className="btn-outline"
              onClick={() => setModalOpen(false)}
            >
              Hủy
            </button>
            <button type="submit" className="btn-primary">
              Lưu
            </button>
          </div>
        </form>
      </SimpleModal>
    </div>
  );
}
