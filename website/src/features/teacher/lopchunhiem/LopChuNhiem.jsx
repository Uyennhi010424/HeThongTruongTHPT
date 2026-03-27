import { useEffect, useMemo, useState } from "react";
import Header from "../../../components/common/Header.jsx";
import { getHocSinh } from "../../../api/hocsinhApi.js";
import { getLop } from "../../../api/lopApi.js";

const getGenderLabel = (value) => {
  if (value === true) return "Nam";
  if (value === false) return "Nữ";
  return "--";
};

const getStatusLabel = (status) => (status === 1 ? "Đang học" : "Ngừng học");

export default function LopChuNhiem() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(8);

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");
        const [hsRes, lopRes] = await Promise.all([getHocSinh(), getLop()]);
        if (!active) return;
        setStudents(hsRes?.data?.data || []);
        setClasses(lopRes?.data?.data || []);
      } catch (err) {
        if (!active) return;
        setError("Không thể tải dữ liệu lớp chủ nhiệm.");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchData();

    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    const total = students.length;
    const activeCount = students.filter((item) => item.trangThai === 1).length;
    const maleCount = students.filter((item) => item.gioiTinh === true).length;
    return { total, activeCount, maleCount };
  }, [students]);

  const filteredStudents = useMemo(() => {
    let filtered = students;
    if (selectedClass !== "all") {
      filtered = filtered.filter((item) =>
        item?.lopHoc?.id ? String(item.lopHoc.id) === selectedClass : false
      );
    }
    if (!keyword.trim()) return filtered;
    const lower = keyword.toLowerCase();
    return filtered.filter((student) =>
      [student.hoTen, student.sdt, student.email, student?.lopHoc?.tenLop]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(lower))
    );
  }, [students, selectedClass, keyword]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  }, [filteredStudents.length, pageSize]);

  const pagedStudents = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [keyword, pageSize, selectedClass]);

  return (
    <div className="page users-page">
      <Header title="Lớp chủ nhiệm" />

      <div className="card users-toolbar">
        <div>
          <div className="users-title">Theo dõi lớp chủ nhiệm</div>
          <div className="users-subtitle">Danh sách học sinh và trạng thái học tập</div>
        </div>
        <div className="users-actions">
          <div className="dash-search users-search">
            <span className="dot" />
            <input
              placeholder="Tìm theo tên, lớp, SĐT hoặc email"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
          </div>
          <select
            className="btn-outline"
            value={selectedClass}
            onChange={(event) => setSelectedClass(event.target.value)}
          >
            <option value="all">Tất cả lớp</option>
            {classes.map((lop) => (
              <option key={lop.id} value={String(lop.id)}>
                {lop.tenLop}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="users-stats">
        <div className="stat-card stat-blue">
          <div className="stat-label">Tổng học sinh</div>
          <div className="stat-value">{loading ? "..." : stats.total}</div>
        </div>
        <div className="stat-card stat-sky">
          <div className="stat-label">Đang học</div>
          <div className="stat-value">{loading ? "..." : stats.activeCount}</div>
        </div>
        <div className="stat-card stat-ice">
          <div className="stat-label">Nam</div>
          <div className="stat-value">{loading ? "..." : stats.maleCount}</div>
        </div>
      </div>

      <div className="card users-table">
        <div className="table-header">
          <div>
            <div className="panel-title">Danh sách học sinh</div>
            <div className="panel-subtitle">Dữ liệu lấy từ cơ sở dữ liệu</div>
          </div>
          <div className="panel-pill">{filteredStudents.length} học sinh</div>
        </div>
        {error && <div className="table-empty">{error}</div>}
        {!error && !loading && filteredStudents.length === 0 && (
          <div className="table-empty">Không tìm thấy học sinh phù hợp.</div>
        )}
        <div className="table-grid">
          <div className="table-row table-head">
            <div>ID</div>
            <div>Học sinh</div>
            <div>Lớp</div>
            <div>Liên hệ</div>
            <div>Trạng thái</div>
          </div>
          {loading
            ? Array.from({ length: 5 }).map((_, index) => (
                <div className="table-row" key={`skeleton-${index}`}>
                  <div className="skeleton" />
                  <div className="skeleton" />
                  <div className="skeleton" />
                  <div className="skeleton" />
                  <div className="skeleton" />
                </div>
              ))
            : pagedStudents.map((student) => (
                <div className="table-row" key={student.id}>
                  <div className="table-id">#{student.id}</div>
                  <div className="table-main">
                    <div className="table-title">{student.hoTen}</div>
                    <div className="table-meta">
                      {getGenderLabel(student.gioiTinh)}
                    </div>
                  </div>
                  <div>
                    <div className="table-title">
                      {student?.lopHoc?.tenLop || "--"}
                    </div>
                    <div className="table-meta">
                      {student?.lopHoc?.khoi ? `Khối ${student.lopHoc.khoi}` : ""}
                    </div>
                  </div>
                  <div className="table-email">
                    {student.sdt || "--"}
                    <div className="table-meta">{student.email || ""}</div>
                  </div>
                  <div>
                    <span
                      className={`status-pill ${
                        student.trangThai === 1 ? "status-active" : "status-locked"
                      }`}
                    >
                      {getStatusLabel(student.trangThai)}
                    </span>
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
    </div>
  );
}