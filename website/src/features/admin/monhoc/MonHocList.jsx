import { useEffect, useMemo, useState } from "react";
import Header from "../../../components/common/Header.jsx";
import SimpleModal from "../../../components/modal/SimpleModal.jsx";
import {
  createMonHoc,
  deleteMonHoc,
  getMonHoc,
  updateMonHoc
} from "../../../api/monhocApi.js";

const REMARK_ONLY_SUBJECTS = [
  { tenMon: "Giáo dục thể chất (GDTC)", heSo: 0 },
  { tenMon: "Âm nhạc", heSo: 0 },
  { tenMon: "Nội dung giáo dục địa phương (GDĐP)", heSo: 0 },
  { tenMon: "Hoạt động trải nghiệm, hướng nghiệp (HĐTN, HN)", heSo: 0 }
];

const SCORE_AND_REMARK_SUBJECTS = [
  { tenMon: "Toán", heSo: 2 },
  { tenMon: "Ngữ văn", heSo: 2 },
  { tenMon: "Tiếng Anh", heSo: 1 },
  { tenMon: "Vật lí", heSo: 1 },
  { tenMon: "Hóa học", heSo: 1 },
  { tenMon: "Sinh học", heSo: 1 },
  { tenMon: "Lịch sử", heSo: 1 },
  { tenMon: "Địa lí", heSo: 1 },
  { tenMon: "Giáo dục kinh tế và pháp luật (GDKT&PL)", heSo: 1 },
  { tenMon: "Tin học", heSo: 1 },
  { tenMon: "Công nghệ", heSo: 1 },
  { tenMon: "GDQP-AN", heSo: 1 }
];

const STANDARD_SUBJECTS = [...REMARK_ONLY_SUBJECTS, ...SCORE_AND_REMARK_SUBJECTS];

const normalizeSubjectName = (value) =>
  (value || "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]/g, "")
    .trim();

const REMARK_ONLY_KEYWORDS = new Set(REMARK_ONLY_SUBJECTS.map((item) => normalizeSubjectName(item.tenMon)));

const getEvaluationLabel = (subject) => {
  const key = normalizeSubjectName(subject?.tenMon);
  if (REMARK_ONLY_KEYWORDS.has(key) || Number(subject?.heSo) === 0) {
    return "Nhận xét (Đạt/Chưa đạt)";
  }
  return "Nhận xét + điểm số";
};

export default function MonHocList() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(8);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({ tenMon: "" });

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getMonHoc();
      const data = response?.data?.data || [];
      const sorted = [...data].sort((a, b) => {
        const aScore = getEvaluationLabel(a) === "Nhận xét + điểm số" ? 0 : 1;
        const bScore = getEvaluationLabel(b) === "Nhận xét + điểm số" ? 0 : 1;
        if (aScore !== bScore) return aScore - bScore;
        return String(a?.tenMon || "").localeCompare(String(b?.tenMon || ""), "vi", {
          sensitivity: "base"
        });
      });
      setSubjects(sorted);
    } catch (err) {
      setError("Không thể tải danh sách môn học.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    const fetchSubjectsSafe = async () => {
      if (!active) return;
      await fetchSubjects();
    };

    fetchSubjectsSafe();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!successMessage) return undefined;
    const timer = window.setTimeout(() => setSuccessMessage(""), 2500);
    return () => window.clearTimeout(timer);
  }, [successMessage]);

  const stats = useMemo(() => {
    const total = subjects.length;
    const scoreAndRemark = subjects.filter(
      (item) => getEvaluationLabel(item) === "Nhận xét + điểm số"
    ).length;
    const remarkOnly = total - scoreAndRemark;
    return { total, scoreAndRemark, remarkOnly };
  }, [subjects]);

  const filteredSubjects = useMemo(() => {
    if (!keyword.trim()) return subjects;
    const lower = keyword.toLowerCase();
    return subjects.filter((item) =>
      [item.tenMon, getEvaluationLabel(item)]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(lower))
    );
  }, [keyword, subjects]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredSubjects.length / pageSize));
  }, [filteredSubjects.length, pageSize]);

  const pagedSubjects = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredSubjects.slice(start, start + pageSize);
  }, [filteredSubjects, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [keyword, pageSize]);

  const openCreate = () => {
    setEditingSubject(null);
    setForm({ tenMon: "" });
    setFormError("");
    setSuccessMessage("");
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditingSubject(item);
    setForm({ tenMon: item.tenMon || "" });
    setFormError("");
    setSuccessMessage("");
    setModalOpen(true);
  };

  const handleAddStandardSubjects = async () => {
    try {
      setError("");
      setSuccessMessage("");

      const existingMap = new Map(
        subjects.map((item) => [normalizeSubjectName(item.tenMon), item])
      );

      const missing = STANDARD_SUBJECTS.filter(
        (item) => !existingMap.has(normalizeSubjectName(item.tenMon))
      );

      if (!missing.length) {
        setSuccessMessage("Danh mục môn học đã đủ theo quy định.");
        return;
      }

      const createdResults = await Promise.allSettled(
        missing.map((item) => createMonHoc({ tenMon: item.tenMon, heSo: item.heSo }))
      );

      const createdCount = createdResults.filter((item) => item.status === "fulfilled").length;
      const failedCount = createdResults.length - createdCount;

      await fetchSubjects();
      if (failedCount > 0) {
        setError(`Đã thêm ${createdCount} môn, ${failedCount} môn chưa thêm được.`);
      } else {
        setSuccessMessage(`Đã thêm đủ ${createdCount} môn theo quy định.`);
      }
    } catch {
      setError("Không thể bổ sung danh mục môn học.");
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Xóa môn học ${item.tenMon}?`)) return;
    try {
      await deleteMonHoc(item.id);
      setSubjects((prev) => prev.filter((row) => row.id !== item.id));
      setError("");
      setSuccessMessage("Xóa môn học thành công.");
    } catch (err) {
      setError("Không thể xóa môn học.");
      setSuccessMessage("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    if (!form.tenMon.trim()) {
      setFormError("Vui lòng nhập tên môn.");
      return;
    }

    const normalizedName = normalizeSubjectName(form.tenMon);
    const isRemarkOnly = REMARK_ONLY_KEYWORDS.has(normalizedName);
    const inferredHeSo = editingSubject?.heSo ?? (isRemarkOnly ? 0 : 1);

    const payload = {
      tenMon: form.tenMon.trim(),
      heSo: inferredHeSo
    };

    try {
      if (editingSubject) {
        const response = await updateMonHoc(editingSubject.id, payload);
        const updated = response?.data?.data;
        setSubjects((prev) =>
          prev.map((row) => (row.id === editingSubject.id ? updated : row))
        );
      } else {
        const response = await createMonHoc(payload);
        const created = response?.data?.data;
        setSubjects((prev) => [created, ...prev]);
      }
      setError("");
      setSuccessMessage(editingSubject ? "Cập nhật môn học thành công." : "Thêm môn học thành công.");
      await fetchSubjects();
      setModalOpen(false);
    } catch (err) {
      setFormError("Không thể lưu môn học. Vui lòng thử lại.");
      setSuccessMessage("");
    }
  };

  return (
    <div className="page users-page">
      <Header title="Danh mục môn học" />

      <div className="card users-toolbar">
        <div>
          <div className="users-title">Quản lý môn học</div>
          <div className="users-subtitle">
            Theo dõi, cập nhật thông tin và hình thức đánh giá môn
          </div>
        </div>
        <div className="users-actions">
          <div className="dash-search users-search">
            <span className="dot" />
            <input
              placeholder="Tìm theo tên môn hoặc hình thức đánh giá"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
          </div>
          <button className="btn-primary" onClick={openCreate}>
            Thêm môn học
          </button>
          <button className="btn-outline" onClick={handleAddStandardSubjects}>
            Bổ sung đủ môn theo quy định
          </button>
        </div>
      </div>

      <div className="users-stats">
        <div className="stat-card stat-blue">
          <div className="stat-label">Tổng môn</div>
          <div className="stat-value">{loading ? "..." : stats.total}</div>
        </div>
        <div className="stat-card stat-sky">
          <div className="stat-label">Nhận xét + điểm số</div>
          <div className="stat-value">{loading ? "..." : stats.scoreAndRemark}</div>
        </div>
        <div className="stat-card stat-ice">
          <div className="stat-label">Nhận xét (Đạt/Chưa đạt)</div>
          <div className="stat-value">{loading ? "..." : stats.remarkOnly}</div>
        </div>
      </div>

      <div className="card users-table">
        <div className="table-header">
          <div>
            <div className="panel-title">Danh sách môn học</div>
            <div className="panel-subtitle">Dữ liệu lấy từ cơ sở dữ liệu</div>
          </div>
          <div className="panel-pill">{filteredSubjects.length} môn</div>
        </div>
        {error && <div className="table-empty">{error}</div>}
        {!error && successMessage && <div className="table-success">{successMessage}</div>}
        {!error && !loading && filteredSubjects.length === 0 && (
          <div className="table-empty">Không tìm thấy môn học phù hợp.</div>
        )}
        <div className="table-grid">
          <div className="table-row table-head">
            <div>STT</div>
            <div>Tên môn</div>
            <div>Đánh giá</div>
            <div>Thao tác</div>
          </div>
          {loading
            ? Array.from({ length: 5 }).map((_, index) => (
                <div className="table-row" key={`skeleton-${index}`}>
                  <div className="skeleton" />
                  <div className="skeleton" />
                  <div className="skeleton" />
                  <div className="skeleton" />
                </div>
              ))
            : pagedSubjects.map((item, index) => (
                <div className="table-row" key={item.id}>
                  <div className="table-id">{(page - 1) * pageSize + index + 1}</div>
                  <div className="table-main">
                    <div className="table-title">{item.tenMon}</div>
                    <div className="table-meta">ID: {item.id}</div>
                  </div>
                  <div>
                    <span className="role-pill">{getEvaluationLabel(item)}</span>
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
        <div className="pagination">
          <button
            className="btn-outline btn-sm"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page === 1}
          >
            Trước
          </button>
          <div className="pagination-info">
            Trang {page} / {totalPages}
          </div>
          <button
            className="btn-outline btn-sm"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page === totalPages}
          >
            Sau
          </button>
        </div>
      </div>

      <SimpleModal
        open={modalOpen}
        title={editingSubject ? "Cập nhật môn học" : "Thêm môn học"}
        onClose={() => setModalOpen(false)}
      >
        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="form-field">
            <span>Tên môn</span>
            <input
              value={form.tenMon}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, tenMon: event.target.value }))
              }
              placeholder="vd: Toán"
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