import { useEffect, useMemo, useState, useRef } from "react";
import PageHeader from "../../../components/edu/PageHeader.jsx";
import SimpleModal from "../../../components/modal/SimpleModal.jsx";
import {
  getPhuHuynh,
  createPhuHuynh,
  updatePhuHuynh,
  getStudentsByPhuHuynhId
} from "../../../api/phuhuynhApi.js";
import { getLop } from "../../../api/lopApi.js";

const QUAN_HE_OPTIONS = [
  { value: "CHA", label: "Cha" },
  { value: "ME", label: "Mẹ" },
  { value: "NGUOI_GIAM_HO", label: "Người giám hộ" }
];

const getQuanHeLabel = (value) => {
  const found = QUAN_HE_OPTIONS.find((opt) => opt.value === value);
  return found ? found.label : value || "--";
};

const emptyForm = {
  hoTen: "",
  soDienThoai: "",
  email: "",
  quanHe: "CHA",
  ngheNghiep: "",
  isSmSActive: false
};

export default function PhuHuynhList() {
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  // Class filter
  const [classes, setClasses] = useState([]);
  const [gradeFilter, setGradeFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [parentClassMap, setParentClassMap] = useState({});
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef(null);

  // Close filter dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Add / Edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingParent, setEditingParent] = useState(null);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });

  // Detail modal
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailParent, setDetailParent] = useState(null);
  const [detailStudents, setDetailStudents] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  /* ---------- fetch ---------- */
  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");
        const [parentRes, classRes] = await Promise.all([
          getPhuHuynh(),
          getLop()
        ]);
        if (!active) return;
        const parentData = parentRes?.data?.data || [];
        setParents(parentData);
        setClasses(classRes?.data?.data || []);

        // Build parent -> classIds map
        const entries = await Promise.all(
          parentData.map(async (p) => {
            try {
              const res = await getStudentsByPhuHuynhId(p.id);
              const students = res?.data?.data || [];
              const classIds = students
                .map((s) => s.lopId || s.lop?.id)
                .filter(Boolean);
              return [p.id, classIds];
            } catch {
              return [p.id, []];
            }
          })
        );
        if (!active) return;
        setParentClassMap(Object.fromEntries(entries));
      } catch {
        if (!active) return;
        setError("Không thể tải danh sách phụ huynh.");
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchData();
    return () => {
      active = false;
    };
  }, []);

  /* ---------- stats ---------- */
  const stats = useMemo(() => {
    const total = parents.length;
    const smsActive = parents.filter((p) => p.isSmSActive).length;
    return { total, smsActive };
  }, [parents]);

  /* ---------- class filter helpers ---------- */
  const classesByGrade = useMemo(() => {
    const map = new Map();
    classes.forEach((item) => {
      const grade = item?.khoi ? String(item.khoi) : "Khác";
      if (!map.has(grade)) map.set(grade, []);
      map.get(grade).push(item);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([grade, items]) => ({ grade, items }));
  }, [classes]);

  const filteredClasses = useMemo(() => {
    if (gradeFilter === "all") return classes;
    return classes.filter((item) => String(item?.khoi || "") === gradeFilter);
  }, [classes, gradeFilter]);

  const handleGradeSelect = (khoi) => {
    setGradeFilter(khoi);
    setClassFilter("all");
    setPage(1);
  };

  const handleClassSelect = (classId) => {
    setClassFilter(classId);
    if (classId !== "all") {
      const found = classes.find((c) => String(c.id) === String(classId));
      if (found?.khoi !== undefined && found?.khoi !== null) {
        setGradeFilter(String(found.khoi));
      }
    }
    setPage(1);
  };

  const clearFilters = () => {
    setGradeFilter("all");
    setClassFilter("all");
    setPage(1);
  };

  const hasFilter = gradeFilter !== "all" || classFilter !== "all";

  /* ---------- filter ---------- */
  const filtered = useMemo(() => {
    let result = parents;

    // Filter by class
    if (classFilter !== "all") {
      const selectedClassId = Number(classFilter);
      result = result.filter((p) => {
        const classIds = parentClassMap[p.id] || [];
        return classIds.includes(selectedClassId);
      });
    } else if (gradeFilter !== "all") {
      const gradeClassIds = classes
        .filter((c) => String(c?.khoi || "") === gradeFilter)
        .map((c) => c.id);
      result = result.filter((p) => {
        const classIds = parentClassMap[p.id] || [];
        return classIds.some((id) => gradeClassIds.includes(id));
      });
    }

    // Filter by keyword
    if (keyword.trim()) {
      const lower = keyword.toLowerCase();
      result = result.filter((p) =>
        [p.hoTen, p.soDienThoai, p.email]
          .filter(Boolean)
          .some((f) => f.toLowerCase().includes(lower))
      );
    }

    return result;
  }, [keyword, parents, classFilter, gradeFilter, parentClassMap, classes]);

  /* ---------- pagination ---------- */
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filtered.length / pageSize)),
    [filtered.length, pageSize]
  );

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [keyword, pageSize]);

  /* ---------- open create ---------- */
  const openCreate = () => {
    setEditingParent(null);
    setForm({ ...emptyForm });
    setFormError("");
    setModalOpen(true);
  };

  /* ---------- open edit ---------- */
  const openEdit = (parent) => {
    setEditingParent(parent);
    setForm({
      hoTen: parent.hoTen || "",
      soDienThoai: parent.soDienThoai || "",
      email: parent.email || "",
      quanHe: parent.quanHe || "CHA",
      ngheNghiep: parent.ngheNghiep || "",
      isSmSActive: !!parent.isSmSActive
    });
    setFormError("");
    setModalOpen(true);
  };

  /* ---------- open detail ---------- */
  const openDetail = async (parent) => {
    setDetailParent(parent);
    setDetailStudents([]);
    setDetailLoading(true);
    setDetailOpen(true);
    try {
      const res = await getStudentsByPhuHuynhId(parent.id);
      setDetailStudents(res?.data?.data || []);
    } catch {
      setDetailStudents([]);
    } finally {
      setDetailLoading(false);
    }
  };

  /* ---------- submit ---------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!form.hoTen.trim()) {
      setFormError("Vui lòng nhập họ tên.");
      return;
    }
    if (!form.soDienThoai.trim()) {
      setFormError("Vui lòng nhập số điện thoại.");
      return;
    }

    const payload = {
      hoTen: form.hoTen.trim(),
      soDienThoai: form.soDienThoai.trim(),
      email: form.email.trim(),
      quanHe: form.quanHe,
      ngheNghiep: form.ngheNghiep.trim(),
      isSmSActive: form.isSmSActive
    };

    try {
      setSaving(true);
      if (editingParent) {
        const res = await updatePhuHuynh(editingParent.id, payload);
        const updated = res?.data?.data;
        setParents((prev) =>
          prev.map((p) => (p.id === editingParent.id ? updated : p))
        );
      } else {
        const res = await createPhuHuynh(payload);
        const created = res?.data?.data;
        setParents((prev) => [created, ...prev]);
      }
      setModalOpen(false);
    } catch {
      setFormError("Không thể lưu phụ huynh. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  /* ---------- render ---------- */
  return (
    <div className="page users-page">
      <PageHeader
        title="Quản lý phụ huynh"
        actions={
          <div className="users-actions" style={{ flexWrap: "nowrap" }}>
            <div className="dash-search users-search">
              <span className="dot" />
              <input
                placeholder="Tìm theo họ tên, SĐT, email"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>

            <div className="filter-dropdown-wrap" ref={filterRef}>
              <button
                type="button"
                className={`btn-outline filter-toggle ${hasFilter ? "filter-active" : ""}`}
                onClick={() => setFilterOpen((v) => !v)}
                title="Lọc theo lớp"
              >
                <span className="material-symbols-outlined">filter_list</span>
                {hasFilter && <span className="filter-dot" />}
              </button>

              {filterOpen && (
                <div className="filter-dropdown">
                  <div className="filter-dropdown-title">Lọc theo lớp</div>
                  <label className="filter-dropdown-label">
                    <span>Khối</span>
                    <select
                      value={gradeFilter}
                      onChange={(e) => handleGradeSelect(e.target.value)}
                    >
                      <option value="all">Tất cả khối</option>
                      {classesByGrade.map((group) => (
                        <option key={group.grade} value={group.grade}>
                          Khối {group.grade}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="filter-dropdown-label">
                    <span>Lớp</span>
                    <select
                      value={classFilter}
                      onChange={(e) => handleClassSelect(e.target.value)}
                    >
                      <option value="all">Tất cả lớp</option>
                      {filteredClasses.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.tenLop}
                        </option>
                      ))}
                    </select>
                  </label>
                  {hasFilter && (
                    <button
                      type="button"
                      className="filter-clear"
                      onClick={clearFilters}
                    >
                      Xóa bộ lọc
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        }
      />

      {/* Stats */}
      <div className="users-stats">
        <div className="stat-card stat-blue">
          <div className="stat-label">Tổng phụ huynh</div>
          <div className="stat-value">{loading ? "..." : stats.total}</div>
        </div>
        <div className="stat-card stat-sky">
          <div className="stat-label">Kích hoạt SMS</div>
          <div className="stat-value">{loading ? "..." : stats.smsActive}</div>
        </div>
        <div className="stat-card stat-ice">
          <div className="stat-label">Chưa kích hoạt SMS</div>
          <div className="stat-value">
            {loading ? "..." : stats.total - stats.smsActive}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card users-table">
        <div className="table-header">
          <div>
            <div className="panel-title">Danh sách phụ huynh</div>
          </div>
          <div className="panel-pill">{filtered.length} phụ huynh</div>
        </div>

        {error && <div className="table-empty">{error}</div>}
        {!error && !loading && filtered.length === 0 && (
          <div className="table-empty">
            Không tìm thấy phụ huynh phù hợp.
          </div>
        )}

        <div className="table-grid parent-list-grid">
          <div className="table-row table-head parent-list-row">
            <div>STT</div>
            <div>Họ tên</div>
            <div>SĐT</div>
            <div>Email</div>
            <div>Quan hệ</div>
            <div>SMS</div>
            <div>Thao tác</div>
          </div>

          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div className="table-row parent-list-row" key={`skeleton-${i}`}>
                  <div className="skeleton" />
                  <div className="skeleton" />
                  <div className="skeleton" />
                  <div className="skeleton" />
                  <div className="skeleton" />
                  <div className="skeleton" />
                  <div className="skeleton" />
                </div>
              ))
            : paged.map((parent, index) => (
                <div className="table-row parent-list-row" key={parent.id}>
                  <div className="table-id">
                    {(page - 1) * pageSize + index + 1}
                  </div>
                  <div className="table-main">
                    <div className="table-title">{parent.hoTen}</div>
                    {parent.ngheNghiep && (
                      <div className="table-meta">{parent.ngheNghiep}</div>
                    )}
                  </div>
                  <div>{parent.soDienThoai || "--"}</div>
                  <div>{parent.email || "--"}</div>
                  <div>
                    <span className="role-pill">
                      {getQuanHeLabel(parent.quanHe)}
                    </span>
                  </div>
                  <div>
                    <span
                      className={`status-pill ${
                        parent.isSmSActive
                          ? "status-active"
                          : "status-locked"
                      }`}
                    >
                      {parent.isSmSActive ? "Bật" : "Tắt"}
                    </span>
                  </div>
                  <div className="table-actions">
                    <button
                      className="btn-outline btn-sm"
                      onClick={() => openDetail(parent)}
                    >
                      Chi tiết
                    </button>
                    <button
                      className="btn-outline btn-sm"
                      onClick={() => openEdit(parent)}
                    >
                      Sửa
                    </button>
                  </div>
                </div>
              ))}
        </div>

        {/* Pagination */}
        <div className="pagination">
          <button
            className="btn-outline btn-sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Trước
          </button>
          <div className="pagination-info">
            Trang {page} / {totalPages}
          </div>
          <button
            className="btn-outline btn-sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Sau
          </button>
        </div>
      </div>

      {/* Add / Edit modal */}
      <SimpleModal
        open={modalOpen}
        title={editingParent ? "Cập nhật phụ huynh" : "Thêm phụ huynh"}
        onClose={() => setModalOpen(false)}
      >
        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="form-field">
            <span>Họ tên *</span>
            <input
              value={form.hoTen}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, hoTen: e.target.value }))
              }
              placeholder="vd: Nguyễn Văn A"
            />
          </label>

          <label className="form-field">
            <span>Số điện thoại *</span>
            <input
              value={form.soDienThoai}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, soDienThoai: e.target.value }))
              }
              placeholder="vd: 0901234567"
            />
          </label>

          <label className="form-field">
            <span>Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, email: e.target.value }))
              }
              placeholder="vd: email@example.com"
            />
          </label>

          <label className="form-field">
            <span>Quan hệ</span>
            <select
              value={form.quanHe}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, quanHe: e.target.value }))
              }
            >
              {QUAN_HE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field">
            <span>Nghề nghiệp</span>
            <input
              value={form.ngheNghiep}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, ngheNghiep: e.target.value }))
              }
              placeholder="vd: Giáo viên"
            />
          </label>

          <label className="form-field">
            <span>Kích hoạt SMS</span>
            <select
              value={form.isSmSActive ? "1" : "0"}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  isSmSActive: e.target.value === "1"
                }))
              }
            >
              <option value="1">Bật</option>
              <option value="0">Tắt</option>
            </select>
          </label>

          {formError && <div className="form-error">{formError}</div>}

          <div className="form-actions">
            <button
              type="button"
              className="btn-outline"
              onClick={() => setModalOpen(false)}
            >
              Hủy
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Đang lưu..." : "Lưu"}
            </button>
          </div>
        </form>
      </SimpleModal>

      {/* Detail modal */}
      <SimpleModal
        open={detailOpen}
        title="Chi tiết phụ huynh"
        onClose={() => setDetailOpen(false)}
        width={640}
      >
        {detailParent && (
          <div>
            {/* Parent info */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 18, color: "#1e3a5f", marginBottom: 12 }}>
                {detailParent.hoTen}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 20px" }}>
                <div style={{ display: "flex", gap: 8 }}>
                  <span style={{ color: "#666", minWidth: 90 }}>SĐT:</span>
                  <span style={{ fontWeight: 500 }}>{detailParent.soDienThoai || "--"}</span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <span style={{ color: "#666", minWidth: 90 }}>Email:</span>
                  <span style={{ fontWeight: 500 }}>{detailParent.email || "--"}</span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <span style={{ color: "#666", minWidth: 90 }}>Quan hệ:</span>
                  <span style={{ fontWeight: 500 }}>{getQuanHeLabel(detailParent.quanHe)}</span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <span style={{ color: "#666", minWidth: 90 }}>Nghề nghiệp:</span>
                  <span style={{ fontWeight: 500 }}>{detailParent.ngheNghiep || "--"}</span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <span style={{ color: "#666", minWidth: 90 }}>SMS:</span>
                  <span className={`status-pill ${detailParent.isSmSActive ? "status-active" : "status-locked"}`}>
                    {detailParent.isSmSActive ? "Bật" : "Tắt"}
                  </span>
                </div>
              </div>
            </div>

            {/* Linked students */}
            <div style={{ borderTop: "2px solid #e5edff", paddingTop: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#1e3a5f", marginBottom: 12 }}>
                Học sinh liên kết
              </div>
              {detailLoading && <div style={{ color: "#888" }}>Đang tải...</div>}
              {!detailLoading && detailStudents.length === 0 && (
                <div style={{ color: "#888", padding: "12px 0" }}>
                  Chưa có học sinh nào được liên kết.
                </div>
              )}
              {!detailLoading && detailStudents.length > 0 && (
                <div className="table-grid">
                  <div className="table-row table-head" style={{ gridTemplateColumns: "40px 1.5fr 0.8fr 1fr 0.8fr" }}>
                    <div>STT</div>
                    <div>Họ tên</div>
                    <div>Lớp</div>
                    <div>Ngày sinh</div>
                    <div>Giới tính</div>
                  </div>
                  {detailStudents.map((hs, i) => (
                    <div className="table-row" key={hs.id || i} style={{ gridTemplateColumns: "40px 1.5fr 0.8fr 1fr 0.8fr" }}>
                      <div className="table-id">{i + 1}</div>
                      <div>
                        <div className="table-title">{hs.hoTen || "--"}</div>
                      </div>
                      <div>{hs.lop?.tenLop || "--"}</div>
                      <div>{hs.ngaySinh || "--"}</div>
                      <div>{hs.gioiTinh === "NAM" || hs.gioiTinh === true ? "Nam" : hs.gioiTinh === "NU" || hs.gioiTinh === false ? "Nữ" : "--"}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-actions" style={{ marginTop: 16 }}>
              <button
                className="btn-outline"
                onClick={() => setDetailOpen(false)}
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </SimpleModal>
    </div>
  );
}
