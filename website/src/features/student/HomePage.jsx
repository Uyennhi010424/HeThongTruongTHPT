import { useEffect, useMemo, useState } from "react";
import Header from "../../components/common/Header.jsx";
import { getThongBao } from "../../api/thongbaoApi.js";
import { getThoiKhoaBieu } from "../../api/thoikhoabieuApi.js";
import { getLichThi } from "../../api/lichthiApi.js";
import { getMonHoc } from "../../api/monhocApi.js";
import { getGiaoVien } from "../../api/giaovienApi.js";
import { getHocSinh } from "../../api/hocsinhApi.js";
import { getToken } from "../../store/authStore.js";

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

const getDayLabel = (value) => {
  switch (value) {
    case 2:
      return "Thứ 2";
    case 3:
      return "Thứ 3";
    case 4:
      return "Thứ 4";
    case 5:
      return "Thứ 5";
    case 6:
      return "Thứ 6";
    case 7:
      return "Thứ 7";
    case 8:
      return "Chủ nhật";
    default:
      return "--";
  }
};

const getCurrentUsername = () => {
  const token = getToken();
  if (!token) return "";

  try {
    const payloadPart = token.split(".")[1] || "";
    const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(window.atob(normalized));
    return String(payload?.sub || "").trim().toLowerCase();
  } catch {
    return "";
  }
};

export default function HomePage() {
  const currentUsername = useMemo(() => getCurrentUsername(), []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState({
    notices: [],
    timetable: [],
    exams: [],
    subjects: [],
    teachers: [],
    students: []
  });

  useEffect(() => {
    let active = true;

    const fetchAll = async () => {
      try {
        setLoading(true);
        setError("");
        const [noticesRes, timetableRes, examsRes, subjectsRes, teachersRes, studentsRes] =
          await Promise.all([
            getThongBao(),
            getThoiKhoaBieu(),
            getLichThi(),
            getMonHoc(),
            getGiaoVien(),
            getHocSinh()
          ]);
        if (!active) return;
        setData({
          notices: noticesRes?.data?.data || [],
          timetable: timetableRes?.data?.data || [],
          exams: examsRes?.data?.data || [],
          subjects: subjectsRes?.data?.data || [],
          teachers: teachersRes?.data?.data || [],
          students: studentsRes?.data?.data || []
        });
      } catch (err) {
        if (!active) return;
        setError("Không thể tải dữ liệu trang chủ.");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchAll();
    return () => {
      active = false;
    };
  }, []);

  const latestNotices = useMemo(() => {
    return [...data.notices]
      .filter((item) => item.doiTuong === "HOC_SINH" || item.doiTuong === "ALL")
      .sort((a, b) => new Date(b.ngayDang) - new Date(a.ngayDang))
      .slice(0, 3);
  }, [data.notices]);

  const upcomingExams = useMemo(() => {
    return [...data.exams]
      .filter((item) => item.ngayThi)
      .sort((a, b) => new Date(a.ngayThi) - new Date(b.ngayThi))
      .slice(0, 4);
  }, [data.exams]);

  const timetablePreview = useMemo(() => {
    return [...data.timetable]
      .sort((a, b) => (a.thu || 0) - (b.thu || 0) || (a.tietBatDau || 0) - (b.tietBatDau || 0))
      .slice(0, 5);
  }, [data.timetable]);

  const stats = useMemo(() => {
    return {
      notices: data.notices.length,
      subjects: data.subjects.length,
      exams: data.exams.length
    };
  }, [data]);

  const student = useMemo(() => {
    if (!data.students.length) return null;
    const matched = data.students.find(
      (item) => String(item?.email || "").trim().toLowerCase() === currentUsername
    );
    return matched || data.students[0];
  }, [data.students, currentUsername]);

  const homeroomTeacher = data.teachers[0];

  return (
    <div className="page users-page">
      <Header title="Trang chủ học sinh" />

      <div className="users-stats">
        <div className="stat-card stat-blue">
          <div className="stat-label">Thông báo</div>
          <div className="stat-value">{loading ? "..." : stats.notices}</div>
        </div>
        <div className="stat-card stat-sky">
          <div className="stat-label">Môn học</div>
          <div className="stat-value">{loading ? "..." : stats.subjects}</div>
        </div>
        <div className="stat-card stat-ice">
          <div className="stat-label">Lịch thi</div>
          <div className="stat-value">{loading ? "..." : stats.exams}</div>
        </div>
      </div>

      {error && <div className="card table-empty">{error}</div>}

      {!error && (
        <div className="grid-2">
          <div className="card">
            <div className="panel-title">Thông tin học sinh</div>
            <div className="panel-subtitle">Tổng quan hồ sơ cá nhân</div>
            <div className="profile-summary">
              <div>
                <div className="table-title">{student?.hoTen || "--"}</div>
                <div className="table-meta">Lớp: {student?.lopHoc?.tenLop || "--"}</div>
              </div>
              <div>
                <div className="table-title">GVCN</div>
                <div className="table-meta">{homeroomTeacher?.hoTen || "--"}</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="panel-title">Thông báo mới nhất</div>
            <div className="panel-subtitle">Từ nhà trường</div>
            {latestNotices.length === 0 && !loading ? (
              <div className="table-empty">Chưa có thông báo.</div>
            ) : (
              latestNotices.map((item) => (
                <div className="notice-item" key={item.id}>
                  <div>
                    <div className="table-title">{item.tieuDe}</div>
                    <div className="table-meta">{item.noiDung}</div>
                  </div>
                  <div className="table-date">{formatDate(item.ngayDang) || "--"}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {!error && (
        <div className="grid-2">
          <div className="card users-table">
            <div className="table-header">
              <div>
                <div className="panel-title">Lịch học tuần này</div>
                <div className="panel-subtitle">Một vài tiết sắp tới</div>
              </div>
              <div className="panel-pill">{data.timetable.length} tiết</div>
            </div>
            {timetablePreview.length === 0 && !loading ? (
              <div className="table-empty">Chưa có thời khóa biểu.</div>
            ) : (
              <div className="table-grid">
                <div className="table-row table-head">
                  <div>Thứ</div>
                  <div>Tiết</div>
                  <div>Số tiết</div>
                  <div>Ghi chú</div>
                </div>
                {timetablePreview.map((item) => (
                  <div className="table-row" key={item.id}>
                    <div className="table-title">{getDayLabel(item.thu)}</div>
                    <div className="table-title">{item.tietBatDau ?? "--"}</div>
                    <div className="table-title">{item.soTiet ?? "--"}</div>
                    <div className="table-meta">{item.ghiChu || "--"}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card users-table">
            <div className="table-header">
              <div>
                <div className="panel-title">Lịch thi sắp tới</div>
                <div className="panel-subtitle">Sắp xếp theo thời gian</div>
              </div>
              <div className="panel-pill">{data.exams.length} lịch thi</div>
            </div>
            {upcomingExams.length === 0 && !loading ? (
              <div className="table-empty">Chưa có lịch thi.</div>
            ) : (
              <div className="table-grid">
                <div className="table-row table-head">
                  <div>Ngày thi</div>
                  <div>Giờ</div>
                  <div>Phòng</div>
                  <div>Ghi chú</div>
                </div>
                {upcomingExams.map((item) => (
                  <div className="table-row" key={item.id}>
                    <div className="table-title">{formatDate(item.ngayThi) || "--"}</div>
                    <div className="table-title">{item.gioBatDau || "--"}</div>
                    <div className="table-title">{item.phongThi || "--"}</div>
                    <div className="table-meta">{item.ghiChu || "--"}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}