import { useEffect, useMemo, useState, useRef } from "react";
import PageHeader from "../../../components/edu/PageHeader.jsx";
import MaterialIcon from "../../../components/edu/MaterialIcon.jsx";
import SimpleModal from "../../../components/modal/SimpleModal.jsx";
import { createLop, createLopBulk, deleteLop, getLop, promoteStudents, syncSiSo, updateLop } from "../../../api/lopApi.js";
import { getToHopMon } from "../../../api/toHopMonApi.js";
import { notifyError, notifySuccess } from "../../../utils/notify.js";

const getApiErrorMessage = (err, fallback) => {
  const message = err?.response?.data?.message || err?.response?.data?.error;
  return message || fallback;
};

const extractGradeFromClassName = (tenLop) => {
  const match = String(tenLop || "").trim().match(/^(10|11|12)/);
  return match ? match[1] : null;
};

const getCurrentAcademicYear = () => {
  const now = new Date();
  const year = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  return `${year}-${year + 1}`;
};

// Dạo ra năm học tiếp theo từ năm học hiện tại (VD: 2025-2026 -> 2026-2027)
const getNextAcademicYear = (currentYear) => {
  const parts = String(currentYear || "").split("-");
  if (parts.length === 2) {
    const y1 = parseInt(parts[0], 10);
    const y2 = parseInt(parts[1], 10);
    if (!isNaN(y1) && !isNaN(y2)) return `${y1 + 1}-${y2 + 1}`;
  }
  // fallback
  const now = new Date();
  return `${now.getFullYear() + 1}-${now.getFullYear() + 2}`;
};

function LopFilterDropdown({ gradeFilter, setGradeFilter, namHocFilter, setNamHocFilter, availableNamHoc }) {
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef(null);
  const hasFilter = gradeFilter !== "all" || namHocFilter !== "";

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="filter-dropdown-wrap" ref={filterRef}>
      <button
        type="button"
        className={`btn-outline filter-toggle ${hasFilter ? "filter-active" : ""}`}
        onClick={() => setFilterOpen((v) => !v)}
        title="Lọc"
      >
        <span className="material-symbols-outlined">filter_list</span>
        {hasFilter && <span className="filter-dot" />}
      </button>
      {filterOpen && (
        <div className="filter-dropdown">
          <div className="filter-dropdown-title">Lọc danh sách</div>
          <label className="filter-dropdown-label">
            <span>Khối</span>
            <select value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)}>
              <option value="all">Tất cả khối</option>
              <option value="10">Khối 10</option>
              <option value="11">Khối 11</option>
              <option value="12">Khối 12</option>
            </select>
          </label>
          <label className="filter-dropdown-label">
            <span>Năm học</span>
            <select value={namHocFilter} onChange={(e) => setNamHocFilter(e.target.value)}>
              <option value="">Tất cả năm</option>
              {availableNamHoc.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </label>
          {hasFilter && (
            <button type="button" className="filter-clear" onClick={() => { setGradeFilter("all"); setNamHocFilter(""); }}>
              Xóa bộ lọc
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function LopList() {
  const notifyClassesUpdated = () => {
    try {
      window.dispatchEvent(new Event("classes-updated"));
      window.localStorage.setItem("classesUpdatedAt", String(Date.now()));
    } catch (e) {
      // ignore
    }
  };
  const [classes, setClasses] = useState([]);
  const [toHopList, setToHopList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [keyword, setKeyword] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [namHocFilter, setNamHocFilter] = useState(getCurrentAcademicYear());
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    tenLop: "",
    khoi: "10",
    namHoc: getCurrentAcademicYear(),
    toHopId: ""
  });
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkForm, setBulkForm] = useState({
    namHoc: getCurrentAcademicYear(),
    soLop10: 5,
    soLop11: 5,
    soLop12: 5
  });
  const [bulkLoading, setBulkLoading] = useState(false);
  const [promoteModalOpen, setPromoteModalOpen] = useState(false);
  const [promoteForm, setPromoteForm] = useState({
    currentNamHoc: getCurrentAcademicYear(),
    nextNamHoc: getNextAcademicYear(getCurrentAcademicYear())
  });
  const [promoteLoading, setPromoteLoading] = useState(false);
  const [promoteResult, setPromoteResult] = useState(null);

  const [syncingAll, setSyncingAll] = useState(false);

  const handleSyncAllSiSo = async () => {
    try {
      setSyncingAll(true);
      await syncSiSo();
      // Reload after sync
      const refreshed = await getLop();
      setClasses(refreshed?.data?.data || []);
      notifySuccess("Đồng bộ sĩ số thành công.");
      notifyClassesUpdated();
    } catch (err) {
      notifyError("Không thể đồng bộ sĩ số.");
    } finally {
      setSyncingAll(false);
    }
  };

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");
        const [lopRes, toHopRes] = await Promise.all([
          getLop(),
          getToHopMon()
        ]);
        if (!active) return;
        setClasses(lopRes?.data?.data || []);
        setToHopList(toHopRes?.data?.data || []);
      } catch (err) {
        if (!active) return;
        setError("Không thể tải dữ liệu.");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchData();

    return () => {
      active = false;
    };
  }, []);

  const normalize = (v) => String(v ?? "").trim();

  const availableNamHoc = useMemo(() => {
    const years = [...new Set(classes.map((item) => item.namHoc).filter(Boolean))];
    return years.sort().reverse();
  }, [classes]);

  const filteredClasses = useMemo(() => {
    const lower = keyword.toLowerCase();
    return classes.filter((item) => {
      const matchKeyword = !keyword.trim()
        ? true
        : [item.tenLop, item.khoi]
            .filter((field) => field !== null && field !== undefined)
            .some((field) => String(field).toLowerCase().includes(lower));

      const matchGrade = gradeFilter === "all" ? true : String(item.khoi || "") === gradeFilter;
      const matchNamHoc = !namHocFilter || item.namHoc === namHocFilter;

      return matchKeyword && matchGrade && matchNamHoc;
    });
  }, [keyword, classes, gradeFilter, namHocFilter]);

  const stats = useMemo(() => {
    const total = filteredClasses.length;
    const grade10 = filteredClasses.filter((item) => normalize(item.khoi) === "10").length;
    const grade11 = filteredClasses.filter((item) => normalize(item.khoi) === "11").length;
    const grade12 = filteredClasses.filter((item) => normalize(item.khoi) === "12").length;
    return { total, grade10, grade11, grade12 };
  }, [filteredClasses]);

  const groupedClasses = useMemo(() => {
    const map = new Map();

    filteredClasses.forEach((item) => {
      const grade = item?.khoi ? String(item.khoi) : "Khác";
      if (!map.has(grade)) map.set(grade, []);
      map.get(grade).push(item);
    });

    return Array.from(map.entries())
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([grade, items]) => ({
        grade,
        items: items.sort((x, y) => String(x.tenLop || "").localeCompare(String(y.tenLop || "")))
      }));
  }, [filteredClasses]);

  useEffect(() => {
    if (!successMessage) return undefined;
    const timer = window.setTimeout(() => setSuccessMessage(""), 2500);
    return () => window.clearTimeout(timer);
  }, [successMessage]);

  const openCreate = () => {
    setEditingClass(null);
    setForm({ tenLop: "", khoi: "10", namHoc: getCurrentAcademicYear(), toHopId: "" });
    setFormError("");
    setSuccessMessage("");
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditingClass(item);
    setForm({
      tenLop: item.tenLop || "",
      khoi: String(item.khoi || "10"),
      namHoc: item.namHoc || getCurrentAcademicYear(),
      toHopId: item.toHopId ? String(item.toHopId) : ""
    });
    setFormError("");
    setSuccessMessage("");
    setModalOpen(true);
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Xóa lớp ${item.tenLop}?`)) return;
    try {
      await deleteLop(item.id);
      setClasses((prev) => prev.filter((row) => row.id !== item.id));
      setError("");
      setSuccessMessage("Xóa lớp học thành công.");
      notifyClassesUpdated();
    } catch (err) {
      setError("Không thể xóa lớp học.");
      setSuccessMessage("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    if (!form.tenLop.trim()) {
      setFormError("Vui lòng nhập tên lớp.");
      return;
    }
    if (!form.khoi) {
      setFormError("Vui lòng chọn khối.");
      return;
    }
    if (!form.namHoc.trim()) {
      setFormError("Vui lòng nhập năm học.");
      return;
    }

    const gradeInName = extractGradeFromClassName(form.tenLop);
    if (!gradeInName) {
      setFormError("Tên lớp phải bắt đầu bằng 10, 11 hoặc 12. Ví dụ: 10A1.");
      return;
    }
    if (gradeInName !== String(form.khoi)) {
      setFormError(`Tên lớp ${form.tenLop.trim()} không thuộc khối ${form.khoi}.`);
      return;
    }

    const payload = {
      tenLop: form.tenLop.trim(),
      khoi: form.khoi,
      namHoc: form.namHoc.trim(),
      toHopId: form.toHopId ? Number(form.toHopId) : null
    };

    try {
      if (editingClass) {
        const response = await updateLop(editingClass.id, payload);
        const updated = response?.data?.data;
        setClasses((prev) =>
          prev.map((row) => (row.id === editingClass.id ? updated : row))
        );
        notifyClassesUpdated();
      } else {
        const response = await createLop(payload);
        const created = response?.data?.data;
        setClasses((prev) => [created, ...prev]);
        notifyClassesUpdated();
      }
      setError("");
      setSuccessMessage(
        editingClass ? "Cập nhật lớp học thành công." : "Thêm lớp học thành công."
      );
      setModalOpen(false);
    } catch (err) {
      setFormError(getApiErrorMessage(err, "Không thể lưu lớp học. Vui lòng thử lại."));
      setSuccessMessage("");
    }
  };

  const handleBulkCreate = async () => {
    if (!bulkForm.namHoc.trim()) {
      notifyError("Vui lòng nhập năm học.");
      return;
    }
    const total = bulkForm.soLop10 + bulkForm.soLop11 + bulkForm.soLop12;
    if (total === 0) {
      notifyError("Phải có ít nhất 1 lớp.");
      return;
    }

    try {
      setBulkLoading(true);
      const response = await createLopBulk(bulkForm);
      const created = response?.data?.data || [];
      setClasses((prev) => [...created, ...prev]);
      setBulkModalOpen(false);
      notifySuccess(`Đã tạo ${created.length} lớp cho năm học ${bulkForm.namHoc}.`);
      notifyClassesUpdated();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Không thể tạo lớp hàng loạt."));
    } finally {
      setBulkLoading(false);
    }
  };

  const handlePromote = async () => {
    if (!promoteForm.currentNamHoc.trim()) {
      notifyError("Vui lòng nhập năm học hiện tại.");
      return;
    }
    if (!promoteForm.nextNamHoc.trim()) {
      notifyError("Vui lòng nhập năm học mới.");
      return;
    }
    if (promoteForm.currentNamHoc === promoteForm.nextNamHoc) {
      notifyError("Năm học mới phải khác năm học hiện tại.");
      return;
    }

    try {
      setPromoteLoading(true);
      setPromoteResult(null);
      const response = await promoteStudents(promoteForm);
      const result = response?.data?.data || {};
      setPromoteResult(result);
      const teacherMsg = result.teacherMoved > 0 ? `, ${result.teacherMoved} GV chủ nhiệm theo lớp` : "";
      notifySuccess(`Lên lớp thành công! ${result.promoted || 0} học sinh lên lớp, ${result.graduated || 0} tốt nghiệp${teacherMsg}.`);
      // Reload classes
      const refreshed = await getLop();
      setClasses(refreshed?.data?.data || []);
      notifyClassesUpdated();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Không thể lên lớp."));
    } finally {
      setPromoteLoading(false);
    }
  };

  return (
    <div className="page users-page">
      <PageHeader
        title="Danh mục lớp"
        description="Theo dõi, cập nhật thông tin lớp và khối."
        actions={
          <div className="users-actions" style={{ flexWrap: "nowrap" }}>
            <div className="dash-search users-search">
              <span className="dot" />
              <input
                placeholder="Tìm theo tên lớp hoặc khối"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
              />
            </div>

            <LopFilterDropdown
              gradeFilter={gradeFilter}
              setGradeFilter={setGradeFilter}
              namHocFilter={namHocFilter}
              setNamHocFilter={setNamHocFilter}
              availableNamHoc={availableNamHoc}
            />

            <button className="btn-primary" onClick={openCreate}>
              Thêm lớp
            </button>
            <button className="btn-outline" style={{ background: "#10b981", color: "#fff", borderColor: "#10b981" }} onClick={() => {
              const curYear = getCurrentAcademicYear();
              setPromoteForm({ currentNamHoc: curYear, nextNamHoc: getNextAcademicYear(curYear) });
              setPromoteResult(null);
              setPromoteModalOpen(true);
            }}>
              Lên lớp
            </button>
          </div>
        }
      />

      <div className="users-stats">
        <div className="stat-card stat-blue">
          <div className="stat-label">Tổng lớp</div>
          <div className="stat-value">{loading ? "..." : stats.total}</div>
        </div>
        <div className="stat-card stat-sky">
          <div className="stat-label">Khối 10</div>
          <div className="stat-value">{loading ? "..." : stats.grade10}</div>
        </div>
        <div className="stat-card stat-ice">
          <div className="stat-label">Khối 11</div>
          <div className="stat-value">{loading ? "..." : stats.grade11}</div>
        </div>
        <div className="stat-card stat-ice">
          <div className="stat-label">Khối 12</div>
          <div className="stat-value">{loading ? "..." : stats.grade12}</div>
        </div>
      </div>

      <div className="card users-table">
        <div className="table-header">
          <div>
            <div className="panel-title">Danh sách lớp học</div>
          </div>
          <div className="panel-pill">{filteredClasses.length} lớp</div>
        </div>
        {error && <div className="table-empty">{error}</div>}
        {!error && successMessage && <div className="table-success">{successMessage}</div>}
        {!error && !loading && filteredClasses.length === 0 && (
          <div className="table-empty">Không tìm thấy lớp phù hợp.</div>
        )}
        <div className="grade-group-wrap">
          {loading
            ? Array.from({ length: 5 }).map((_, index) => (
                <div className="table-row" key={`skeleton-${index}`}>
                  <div className="skeleton" />
                  <div className="skeleton" />
                  <div className="skeleton" />
                  <div className="skeleton" />
                </div>
              ))
            : groupedClasses.map((group) => (
                <div className="grade-group" key={group.grade}>
                  <div className="grade-group-title">Khối {group.grade}</div>
                  <div className="table-grid">
                    {group.items.map((item, idx) => (
                      <div
                        className="table-row"
                        key={item.id}
                        style={{ gridTemplateColumns: "80px 1fr 130px 180px 160px" }}
                      >
                        <div className="table-id">{idx + 1}</div>
                        <div className="table-main">
                          <div className="table-title">{item.tenLop}</div>
                          <div className="table-meta">Sĩ số: {item.siSo || 0}</div>
                        </div>
                        <div>
                          <span className="role-pill">Khối {item.khoi || "--"}</span>
                        </div>
                        <div>
                          {item.toHopId ? (
                            <span className="role-pill" style={{ background: "#dbeafe", color: "#1e40af" }}>
                              {toHopList.find((th) => th.id === item.toHopId)?.maToHop || "?"} - {toHopList.find((th) => th.id === item.toHopId)?.tenToHop || "?"}
                            </span>
                          ) : (
                            <span style={{ color: "#999", fontSize: 13 }}>Chưa gán</span>
                          )}
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
        title={editingClass ? "Cập nhật lớp" : "Thêm lớp"}
        onClose={() => setModalOpen(false)}
      >
        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="form-field">
            <span>Tên lớp</span>
            <input
              value={form.tenLop}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, tenLop: event.target.value }))
              }
              placeholder="vd: 10A1"
            />
          </label>
          <label className="form-field">
            <span>Khối</span>
            <select
              value={form.khoi}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, khoi: event.target.value }))
              }
            >
              <option value="10">Khối 10</option>
              <option value="11">Khối 11</option>
              <option value="12">Khối 12</option>
            </select>
          </label>
          <label className="form-field">
            <span>Năm học</span>
            <input
              value={form.namHoc}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, namHoc: event.target.value }))
              }
              placeholder="vd: 2025-2026"
            />
          </label>
          <label className="form-field">
            <span>Tổ hợp môn</span>
            <select
              value={form.toHopId}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, toHopId: event.target.value }))
              }
            >
              <option value="">-- Chưa gán --</option>
              {toHopList.map((th) => (
                <option key={th.id} value={th.id}>
                  {th.maToHop} - {th.tenToHop} ({th.ban})
                </option>
              ))}
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
            <button type="submit" className="btn-primary">
              Lưu
            </button>
          </div>
        </form>
      </SimpleModal>

      {/* Bulk Create Modal */}
      {bulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl bg-surface-container-lowest p-lg shadow-xl">
            <h3 className="text-headline-sm font-semibold text-primary mb-md">Tạo lớp hàng loạt</h3>
            <p className="text-body-sm text-on-surface-variant mb-lg">
              Tạo nhanh các lớp cho năm học mới. Nhập số lớp mỗi khối.
            </p>

            <div className="space-y-sm mb-lg">
              <label className="form-field">
                <span>Năm học</span>
                <input
                  value={bulkForm.namHoc}
                  onChange={(e) => setBulkForm((prev) => ({ ...prev, namHoc: e.target.value }))}
                  placeholder="vd: 2026-2027"
                />
              </label>

              <div className="grid grid-cols-3 gap-sm">
                <label className="form-field">
                  <span>Khối 10</span>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={bulkForm.soLop10}
                    onChange={(e) => setBulkForm((prev) => ({ ...prev, soLop10: Math.max(0, Math.min(20, Number(e.target.value) || 0)) }))}
                  />
                </label>
                <label className="form-field">
                  <span>Khối 11</span>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={bulkForm.soLop11}
                    onChange={(e) => setBulkForm((prev) => ({ ...prev, soLop11: Math.max(0, Math.min(20, Number(e.target.value) || 0)) }))}
                  />
                </label>
                <label className="form-field">
                  <span>Khối 12</span>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={bulkForm.soLop12}
                    onChange={(e) => setBulkForm((prev) => ({ ...prev, soLop12: Math.max(0, Math.min(20, Number(e.target.value) || 0)) }))}
                  />
                </label>
              </div>

              <div className="text-body-sm text-on-surface-variant">
                Sẽ tạo: {bulkForm.soLop10} lớp khối 10, {bulkForm.soLop11} lớp khối 11, {bulkForm.soLop12} lớp khối 12
                <br />
                Tổng: <strong>{bulkForm.soLop10 + bulkForm.soLop11 + bulkForm.soLop12} lớp</strong>
              </div>
            </div>

            <div className="flex justify-end gap-sm">
              <button
                type="button"
                className="btn-outline"
                onClick={() => setBulkModalOpen(false)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleBulkCreate}
                disabled={bulkLoading}
              >
                {bulkLoading ? "Đang tạo..." : "Tạo lớp"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Promote Modal */}
      {promoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl bg-surface-container-lowest p-lg shadow-xl">
            <h3 className="text-headline-sm font-semibold text-primary mb-md">Lên lớp</h3>
            <p className="text-body-sm text-on-surface-variant mb-lg">
              Chuyển học sinh từ năm học cũ sang năm học mới.<br />
              Khối 10 → 11, Khối 11 → 12, Khối 12 → Tốt nghiệp.<br />
              GV chủ nhiệm sẽ theo lớp 3 năm. Khối 12 tốt nghiệp → GV thôi chủ nhiệm.
            </p>

            <div className="space-y-sm mb-lg">
              <label className="form-field">
                <span>Năm học hiện tại</span>
                <select
                  value={promoteForm.currentNamHoc}
                  onChange={(e) => {
                    const selected = e.target.value;
                    setPromoteForm((prev) => ({
                      ...prev,
                      currentNamHoc: selected,
                      nextNamHoc: getNextAcademicYear(selected)
                    }));
                  }}
                >
                  {availableNamHoc.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </label>

              <label className="form-field">
                <span>Năm học mới (tự động tính)</span>
                <input
                  value={promoteForm.nextNamHoc}
                  onChange={(e) => setPromoteForm((prev) => ({ ...prev, nextNamHoc: e.target.value }))}
                  placeholder="vd: 2026-2027"
                />
              </label>

              {promoteResult && (
                <div className="rounded-lg bg-green-50 p-md text-body-sm">
                  <div className="font-semibold text-green-700 mb-xs">Kết quả:</div>
                  <div>Lên lớp: <strong>{promoteResult.promoted}</strong> học sinh</div>
                  <div>Tốt nghiệp: <strong>{promoteResult.graduated}</strong> học sinh</div>
                  {promoteResult.teacherMoved > 0 && (
                    <div>GV chủ nhiệm theo lớp: <strong>{promoteResult.teacherMoved}</strong></div>
                  )}
                  {promoteResult.createdClasses?.length > 0 && (
                    <div>Lớp mới tạo: <strong>{promoteResult.createdClasses.join(", ")}</strong></div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-sm">
              <button
                type="button"
                className="btn-outline"
                onClick={() => setPromoteModalOpen(false)}
              >
                Đóng
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{ background: "#10b981", borderColor: "#10b981" }}
                onClick={handlePromote}
                disabled={promoteLoading}
              >
                {promoteLoading ? "Đang xử lý..." : "Xác nhận lên lớp"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}