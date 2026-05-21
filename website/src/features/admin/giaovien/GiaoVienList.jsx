import { useEffect, useMemo, useState } from "react";
import Header from "../../../components/common/Header.jsx";
import SimpleModal from "../../../components/modal/SimpleModal.jsx";
import {
  createGiaoVien,
  deleteGiaoVien,
  getGiaoVien,
  updateGiaoVien
} from "../../../api/giaovienApi.js";
import { getLop } from "../../../api/lopApi.js";
import {
  clearChuNhiemByGiaoVien,
  getChuNhiem,
  updateChuNhiemByGiaoVien
} from "../../../api/chunhiemApi.js";
import { createUser, getUsers } from "../../../api/userApi.js";

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
};

const formatDateInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getGenderLabel = (value) => {
  if (value === true) return "Nam";
  if (value === false) return "Nữ";
  return "--";
};

const getApiErrorMessage = (err, fallback) => {
  const message = err?.response?.data?.message || err?.response?.data?.error;
  return message || fallback;
};

const normalizeEmailPart = (value) =>
  (value || "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const buildTeacherEmailPreview = (fullName) => {
  const normalized = normalizeEmailPart(fullName);
  if (!normalized) return "";

  const parts = normalized.split(" ").filter(Boolean);
  if (!parts.length) return "";

  const firstLetters = parts.slice(0, -1).map((part) => part[0]).join("");
  const lastName = parts[parts.length - 1];
  const localPart = `${firstLetters}${lastName}` || "giaovien";
  return `${localPart}c3@tdn.edu.vn`;
};

const notifyUsersUpdated = () => {
  window.dispatchEvent(new Event("users-updated"));
  window.localStorage.setItem("usersUpdatedAt", String(Date.now()));
};

export default function GiaoVienList() {
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [homeroomAssignments, setHomeroomAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(8);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    hoTen: "",
    ngaySinh: "",
    gioiTinh: "true",
    boMon: "",
    trinhDo: "",
    sdt: "",
    email: "",
    chuNhiem: false,
    lopChuNhiemId: ""
  });

  const ensureTeacherUserAccount = async (teacher, fallbackFullName = "") => {
    const candidate =
      String(teacher?.email || "").trim() || buildTeacherEmailPreview(fallbackFullName);

    if (!candidate) return;

    try {
      const usersResponse = await getUsers();
      const users = usersResponse?.data?.data || [];
      const normalizedCandidate = candidate.toLowerCase();

      const exists = users.some((user) => {
        const username = String(user?.username || "").trim().toLowerCase();
        const email = String(user?.email || "").trim().toLowerCase();
        return username === normalizedCandidate || email === normalizedCandidate;
      });

      if (exists) return;

      await createUser({
        username: candidate,
        email: candidate,
        password: "Abc1234@",
        status: 1,
        role: "GIAOVIEN"
      });
    } catch {
      // Keep teacher creation successful even if fallback account creation fails.
    }
  };

  const classNameById = useMemo(() => {
    return classes.reduce((acc, item) => {
      acc[item.id] = item.tenLop;
      return acc;
    }, {});
  }, [classes]);

  const homeroomByTeacherId = useMemo(() => {
    return homeroomAssignments.reduce((acc, item) => {
      if (!item?.giaoVienId) return acc;
      acc[item.giaoVienId] = {
        lopId: item.lopId,
        tenLop: classNameById[item.lopId] || `Lớp #${item.lopId}`
      };
      return acc;
    }, {});
  }, [homeroomAssignments, classNameById]);

  const isHomeroomTeacher = (teacher) => Boolean(homeroomByTeacherId[teacher?.id]);

  const loadHomeroomAssignments = async () => {
    try {
      const assignmentRes = await getChuNhiem();
      setHomeroomAssignments(assignmentRes?.data?.data || []);
    } catch (err) {
      setHomeroomAssignments([]);
    }
  };

  useEffect(() => {
    let active = true;

    const fetchTeachers = async () => {
      try {
        setLoading(true);
        setError("");
        const [teacherResult, classResult, assignmentResult] = await Promise.allSettled([
          getGiaoVien(),
          getLop(),
          getChuNhiem()
        ]);
        if (!active) return;

        if (teacherResult.status !== "fulfilled") {
          setError("Không thể tải danh sách giáo viên.");
          setTeachers([]);
          return;
        }

        setTeachers(teacherResult.value?.data?.data || []);
        setClasses(
          classResult.status === "fulfilled" ? classResult.value?.data?.data || [] : []
        );
        setHomeroomAssignments(
          assignmentResult.status === "fulfilled"
            ? assignmentResult.value?.data?.data || []
            : []
        );
      } catch (err) {
        if (!active) return;
        setError("Không thể tải danh sách giáo viên.");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchTeachers();

    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    const total = teachers.length;
    const maleCount = teachers.filter((item) => item.gioiTinh === true).length;
    const femaleCount = teachers.filter((item) => item.gioiTinh === false).length;
    const homeroomCount = teachers.filter((item) => isHomeroomTeacher(item)).length;
    return { total, maleCount, femaleCount, homeroomCount };
  }, [teachers]);

  const filteredTeachers = useMemo(() => {
    if (!keyword.trim()) return teachers;
    const lower = keyword.toLowerCase();
    return teachers.filter((teacher) =>
      [teacher.hoTen, teacher.boMon, teacher.trinhDo, teacher.sdt, teacher.email]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(lower))
    );
  }, [keyword, teachers]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredTeachers.length / pageSize));
  }, [filteredTeachers.length, pageSize]);

  const pagedTeachers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredTeachers.slice(start, start + pageSize);
  }, [filteredTeachers, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [keyword, pageSize]);

  useEffect(() => {
    if (!successMessage) return undefined;
    const timer = window.setTimeout(() => setSuccessMessage(""), 2500);
    return () => window.clearTimeout(timer);
  }, [successMessage]);

  const openCreate = () => {
    setEditingTeacher(null);
    setForm({
      hoTen: "",
      ngaySinh: "",
      gioiTinh: "true",
      boMon: "",
      trinhDo: "",
      sdt: "",
      email: "",
      chuNhiem: false,
      lopChuNhiemId: ""
    });
    setFormError("");
    setSuccessMessage("");
    setModalOpen(true);
  };

  const openEdit = (teacher) => {
    const homeroomInfo = homeroomByTeacherId[teacher.id];
    setEditingTeacher(teacher);
    setForm({
      hoTen: teacher.hoTen || "",
      ngaySinh: formatDateInput(teacher.ngaySinh),
      gioiTinh: String(teacher.gioiTinh ?? true),
      boMon: teacher.boMon || "",
      trinhDo: teacher.trinhDo || "",
      sdt: teacher.sdt || "",
      email: teacher.email || "",
      chuNhiem: Boolean(homeroomInfo),
      lopChuNhiemId: homeroomInfo?.lopId ? String(homeroomInfo.lopId) : ""
    });
    setFormError("");
    setSuccessMessage("");
    setModalOpen(true);
  };

  const handleDelete = async (teacher) => {
    if (!window.confirm(`Xóa giáo viên ${teacher.hoTen}?`)) return;
    try {
      await deleteGiaoVien(teacher.id);
      setTeachers((prev) => prev.filter((item) => item.id !== teacher.id));
      setError("");
      setSuccessMessage("Xóa giáo viên thành công.");
    } catch (err) {
      setError("Không thể xóa giáo viên.");
      setSuccessMessage("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    if (!form.hoTen.trim()) {
      setFormError("Vui lòng nhập họ tên.");
      return;
    }

    if (form.chuNhiem && !form.lopChuNhiemId) {
      setFormError("Vui lòng chọn lớp chủ nhiệm.");
      return;
    }

    const payload = {
      hoTen: form.hoTen.trim(),
      ngaySinh: form.ngaySinh || null,
      gioiTinh: form.gioiTinh === "true",
      boMon: form.boMon.trim() || null,
      trinhDo: form.trinhDo.trim() || null,
      sdt: form.sdt.trim() || null,
      email: editingTeacher
        ? form.email.trim() || null
        : buildTeacherEmailPreview(form.hoTen) || null
    };

    try {
      let savedTeacher = null;
      if (editingTeacher) {
        const response = await updateGiaoVien(editingTeacher.id, payload);
        const updated = response?.data?.data;
        savedTeacher = updated;
        setTeachers((prev) =>
          prev.map((item) => (item.id === editingTeacher.id ? updated : item))
        );
      } else {
        const response = await createGiaoVien(payload);
        const created = response?.data?.data;
        const normalizedCreated = {
          ...created,
          email: created?.email || buildTeacherEmailPreview(form.hoTen)
        };
        savedTeacher = normalizedCreated;
        setTeachers((prev) => [normalizedCreated, ...prev]);
        await ensureTeacherUserAccount(normalizedCreated, form.hoTen);
        notifyUsersUpdated();
      }

      if (savedTeacher?.id) {
        try {
          if (form.chuNhiem && form.lopChuNhiemId) {
            await updateChuNhiemByGiaoVien(savedTeacher.id, {
              lopId: Number(form.lopChuNhiemId)
            });
          } else {
            await clearChuNhiemByGiaoVien(savedTeacher.id);
          }
        } catch (assignmentError) {
          setFormError(
            "Đã lưu thông tin giáo viên, nhưng chưa cập nhật được chủ nhiệm."
          );
        }
      }

      await loadHomeroomAssignments();

      setError("");
      setSuccessMessage(
        editingTeacher ? "Cập nhật giáo viên thành công." : "Thêm giáo viên thành công."
      );
      setModalOpen(false);
    } catch (err) {
      setFormError(
        getApiErrorMessage(err, "Không thể lưu hồ sơ giáo viên. Vui lòng thử lại.")
      );
      setSuccessMessage("");
    }
  };

  return (
    <div className="page users-page">
      <Header title="Danh mục giáo viên" />

      <div className="card users-toolbar">
        <div>
          <div className="users-title">Quản lý hồ sơ giáo viên</div>
          <div className="users-subtitle">
            Theo dõi, cập nhật thông tin và bộ môn giảng dạy
          </div>
        </div>
        <div className="users-actions">
          <div className="dash-search users-search">
            <span className="dot" />
            <input
              placeholder="Tìm theo tên, bộ môn, trình độ, SĐT hoặc email"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
          </div>
          <button className="btn-primary" onClick={openCreate}>
            Thêm giáo viên
          </button>
        </div>
      </div>

      <div className="users-stats">
        <div className="stat-card stat-blue">
          <div className="stat-label">Tổng giáo viên</div>
          <div className="stat-value">{loading ? "..." : stats.total}</div>
        </div>
        <div className="stat-card stat-sky">
          <div className="stat-label">Nam</div>
          <div className="stat-value">{loading ? "..." : stats.maleCount}</div>
        </div>
        <div className="stat-card stat-ice">
          <div className="stat-label">Nữ</div>
          <div className="stat-value">{loading ? "..." : stats.femaleCount}</div>
        </div>
        <div className="stat-card stat-navy">
          <div className="stat-label">GV chủ nhiệm</div>
          <div className="stat-value">{loading ? "..." : stats.homeroomCount}</div>
        </div>
      </div>

      <div className="card users-table">
        <div className="table-header">
          <div>
            <div className="panel-title">Danh sách giáo viên</div>
            <div className="panel-subtitle">Dữ liệu lấy từ cơ sở dữ liệu</div>
          </div>
          <div className="panel-pill">{filteredTeachers.length} giáo viên</div>
        </div>
        {error && <div className="table-empty">{error}</div>}
        {!error && successMessage && <div className="table-success">{successMessage}</div>}
        {!error && !loading && filteredTeachers.length === 0 && (
          <div className="table-empty">Không tìm thấy giáo viên phù hợp.</div>
        )}
        <div className="table-grid">
          <div className="table-row table-head">
            <div>STT</div>
            <div>Giáo viên</div>
            <div>Bộ môn</div>
            <div>Trình độ</div>
            <div>Liên hệ</div>
            <div>Chủ nhiệm</div>
            <div>Thao tác</div>
          </div>
          {loading
            ? Array.from({ length: 5 }).map((_, index) => (
                <div
                  className="table-row"
                  key={`skeleton-${index}`}
                  style={{ gridTemplateColumns: "80px 1.2fr 1fr 1fr 1.2fr 140px 160px" }}
                >
                  <div className="skeleton" />
                  <div className="skeleton" />
                  <div className="skeleton" />
                  <div className="skeleton" />
                  <div className="skeleton" />
                  <div className="skeleton" />
                  <div className="skeleton" />
                </div>
              ))
            : pagedTeachers.map((teacher, index) => (
                <div
                  className="table-row"
                  key={teacher.id}
                  style={{ gridTemplateColumns: "80px 1.2fr 1fr 1fr 1.2fr 140px 160px" }}
                >
                  <div className="table-id">{(page - 1) * pageSize + index + 1}</div>
                  <div className="table-main">
                    <div className="table-title">{teacher.hoTen}</div>
                    <div className="table-meta">
                      {formatDate(teacher.ngaySinh) || "--"} • {getGenderLabel(teacher.gioiTinh)}
                    </div>
                  </div>
                  <div>
                    <div className="table-title">{teacher.boMon || "--"}</div>
                  </div>
                  <div>
                    <div className="table-title">{teacher.trinhDo || "--"}</div>
                  </div>
                  <div className="table-email">
                    {teacher.sdt || "--"}
                    <div className="table-meta">{teacher.email || ""}</div>
                  </div>
                  <div>
                    <span className={`status-pill ${isHomeroomTeacher(teacher) ? "status-active" : ""}`}>
                      {isHomeroomTeacher(teacher) ? "Có" : "Không"}
                    </span>
                    {isHomeroomTeacher(teacher) && (
                      <div className="table-meta">
                        {homeroomByTeacherId[teacher.id]?.tenLop || "--"}
                      </div>
                    )}
                  </div>
                  <div className="table-actions">
                    <button
                      className="btn-outline btn-sm"
                      onClick={() => openEdit(teacher)}
                    >
                      Sửa
                    </button>
                    <button
                      className="btn-danger btn-sm"
                      onClick={() => handleDelete(teacher)}
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
        title={editingTeacher ? "Cập nhật giáo viên" : "Thêm giáo viên"}
        onClose={() => setModalOpen(false)}
      >
        <form className="form-grid form-grid-teacher" onSubmit={handleSubmit}>
          <div className="form-section-title">Thông tin cá nhân</div>
          <label className="form-field">
            <span>Họ và tên</span>
            <input
              value={form.hoTen}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  hoTen: event.target.value,
                  email: editingTeacher ? prev.email : buildTeacherEmailPreview(event.target.value)
                }))
              }
              placeholder="vd: Nguyễn Văn A"
              required
            />
          </label>
          <label className="form-field">
            <span>Ngày sinh</span>
            <input
              type="date"
              value={form.ngaySinh}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, ngaySinh: event.target.value }))
              }
            />
          </label>
          <label className="form-field">
            <span>Giới tính</span>
            <select
              value={form.gioiTinh}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, gioiTinh: event.target.value }))
              }
            >
              <option value="true">Nam</option>
              <option value="false">Nữ</option>
            </select>
          </label>

          <div className="form-section-title">Thông tin chuyên môn</div>
          <label className="form-field">
            <span>Bộ môn</span>
            <input
              value={form.boMon}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, boMon: event.target.value }))
              }
              placeholder="vd: Toán"
            />
          </label>
          <label className="form-field">
            <span>Trình độ</span>
            <input
              value={form.trinhDo}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, trinhDo: event.target.value }))
              }
              placeholder="vd: Cử nhân"
            />
          </label>

          <div className="form-section-title">Thông tin liên hệ</div>
          <label className="form-field">
            <span>Số điện thoại</span>
            <input
              type="tel"
              value={form.sdt}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, sdt: event.target.value }))
              }
              placeholder="vd: 0901234567"
            />
          </label>
          <label className="form-field">
            <span>Email</span>
            <input
              type="email"
              value={editingTeacher ? form.email : buildTeacherEmailPreview(form.hoTen)}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, email: event.target.value }))
              }
              placeholder="vd: nvanc3@tdn.edu.vn"
              readOnly={!editingTeacher}
            />
          </label>

          <div className="form-section-title">Thông tin chủ nhiệm</div>
          <label className="form-field checkbox-field form-field-wide">
            <span>
              <input
                type="checkbox"
                checked={Boolean(form.chuNhiem)}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    chuNhiem: event.target.checked,
                    lopChuNhiemId: event.target.checked ? prev.lopChuNhiemId : ""
                  }))
                }
              />
              Giáo viên chủ nhiệm
            </span>
          </label>
          <label className="form-field form-field-wide">
            <span>Chủ nhiệm lớp</span>
            <select
              value={form.lopChuNhiemId}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, lopChuNhiemId: event.target.value }))
              }
              disabled={!form.chuNhiem}
            >
              <option value="">Chọn lớp chủ nhiệm</option>
              {classes.map((lop) => (
                <option key={lop.id} value={String(lop.id)}>
                  {lop.tenLop}
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
    </div>
  );
}