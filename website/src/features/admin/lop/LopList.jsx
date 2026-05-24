import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../../components/edu/PageHeader.jsx";
import SimpleModal from "../../../components/modal/SimpleModal.jsx";
import { createLop, deleteLop, getLop, updateLop } from "../../../api/lopApi.js";

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

export default function LopList() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [keyword, setKeyword] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    tenLop: "",
    khoi: "10",
    namHoc: getCurrentAcademicYear()
  });

  useEffect(() => {
    let active = true;

    const fetchClasses = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await getLop();
        if (!active) return;
        setClasses(response?.data?.data || []);
      } catch (err) {
        if (!active) return;
        setError("Không thể tải danh sách lớp học.");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchClasses();

    return () => {
      active = false;
    };
  }, []);

  const normalize = (v) => String(v ?? "").trim();

  const stats = useMemo(() => {
    const total = classes.length;
    const grade10 = classes.filter((item) => normalize(item.khoi) === "10").length;
    const grade11 = classes.filter((item) => normalize(item.khoi) === "11").length;
    const grade12 = classes.filter((item) => normalize(item.khoi) === "12").length;
    return { total, grade10, grade11, grade12 };
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

      return matchKeyword && matchGrade;
    });
  }, [keyword, classes, gradeFilter]);

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
    setForm({ tenLop: "", khoi: "10", namHoc: getCurrentAcademicYear() });
    setFormError("");
    setSuccessMessage("");
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditingClass(item);
    setForm({
      tenLop: item.tenLop || "",
      khoi: String(item.khoi || "10"),
      namHoc: item.namHoc || getCurrentAcademicYear()
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
      namHoc: form.namHoc.trim()
    };

    try {
      if (editingClass) {
        const response = await updateLop(editingClass.id, payload);
        const updated = response?.data?.data;
        setClasses((prev) =>
          prev.map((row) => (row.id === editingClass.id ? updated : row))
        );
      } else {
        const response = await createLop(payload);
        const created = response?.data?.data;
        setClasses((prev) => [created, ...prev]);
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

  return (
    <div className="page users-page">
      <PageHeader
        title="Danh mục lớp"
        description="Theo dõi, cập nhật thông tin lớp và khối."
        actions={
          <div className="users-actions">
            <div className="dash-search users-search">
              <span className="dot" />
              <input
                placeholder="Tìm theo tên lớp hoặc khối"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
              />
            </div>
            <label className="form-field users-filter-field">
              <span>Khối</span>
              <select
                value={gradeFilter}
                onChange={(event) => setGradeFilter(event.target.value)}
              >
                <option value="all">Tất cả khối</option>
                <option value="10">Khối 10</option>
                <option value="11">Khối 11</option>
                <option value="12">Khối 12</option>
              </select>
            </label>
            <button className="btn-primary" onClick={openCreate}>
              Thêm lớp
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
            <div className="panel-subtitle">Dữ liệu lấy từ cơ sở dữ liệu</div>
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
                    {group.items.map((item) => (
                      <div
                        className="table-row"
                        key={item.id}
                        style={{ gridTemplateColumns: "80px 1fr 130px 160px" }}
                      >
                        <div className="table-id">#{item.id}</div>
                        <div className="table-main">
                          <div className="table-title">{item.tenLop}</div>
                          <div className="table-meta">ID: {item.id}</div>
                        </div>
                        <div>
                          <span className="role-pill">Khối {item.khoi || "--"}</span>
                        </div>
                        <div className="table-actions">
                          <button
                            className="btn-outline btn-sm"
                            onClick={() => openEdit(item)}
                          >
                            Sửa
                          </button>
                          <button
                            className="btn-danger btn-sm"
                            onClick={() => handleDelete(item)}
                          >
                            Xóa
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