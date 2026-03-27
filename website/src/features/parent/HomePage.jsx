import { useEffect, useMemo, useState } from "react";
import Header from "../../components/common/Header.jsx";
import { getHocSinh } from "../../api/hocsinhApi.js";
import { getThongBao } from "../../api/thongbaoApi.js";
import { getLichThi } from "../../api/lichthiApi.js";
import { getDiem } from "../../api/diemApi.js";
import { getHanhKiem } from "../../api/hanhkiemApi.js";

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

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState({
    student: null,
    notices: [],
    exams: [],
    scores: [],
    conducts: []
  });

  useEffect(() => {
    let active = true;

    const fetchAll = async () => {
      try {
        setLoading(true);
        setError("");
        const [studentsRes, noticesRes, examsRes, scoresRes, conductsRes] = await Promise.all([
          getHocSinh(),
          getThongBao(),
          getLichThi(),
          getDiem(),
          getHanhKiem()
        ]);
        if (!active) return;
        const students = studentsRes?.data?.data || [];
        setData({
          student: students[0] || null,
          notices: noticesRes?.data?.data || [],
          exams: examsRes?.data?.data || [],
          scores: scoresRes?.data?.data || [],
          conducts: conductsRes?.data?.data || []
        });
      } catch (err) {
        if (!active) return;
        setError("Không thể tải dữ liệu phụ huynh.");
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
      .filter((item) => item.doiTuong === "PHU_HUYNH" || item.doiTuong === "ALL")
      .sort((a, b) => new Date(b.ngayDang) - new Date(a.ngayDang))
      .slice(0, 3);
  }, [data.notices]);

  const upcomingExams = useMemo(() => {
    return [...data.exams]
      .filter((item) => item.ngayThi)
      .sort((a, b) => new Date(a.ngayThi) - new Date(b.ngayThi))
      .slice(0, 3);
  }, [data.exams]);

  const stats = useMemo(() => {
    return {
      scores: data.scores.length,
      conducts: data.conducts.length,
      exams: data.exams.length
    };
  }, [data]);

  return (
    <div className="page users-page">
      <Header title="Trang chủ phụ huynh" />

      <div className="users-stats">
        <div className="stat-card stat-blue">
          <div className="stat-label">Bài điểm</div>
          <div className="stat-value">{loading ? "..." : stats.scores}</div>
        </div>
        <div className="stat-card stat-sky">
          <div className="stat-label">Hạnh kiểm</div>
          <div className="stat-value">{loading ? "..." : stats.conducts}</div>
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
            <div className="panel-subtitle">Theo dõi con em trong năm học</div>
            <div className="profile-summary">
              <div>
                <div className="table-title">{data.student?.hoTen || "--"}</div>
                <div className="table-meta">Lớp: {data.student?.lopHoc?.tenLop || "--"}</div>
              </div>
              <div>
                <div className="table-title">Năm nhập học</div>
                <div className="table-meta">{data.student?.namNhapHoc || "--"}</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="panel-title">Thông báo nhà trường</div>
            <div className="panel-subtitle">Dành cho phụ huynh</div>
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
                <div className="panel-title">Lịch thi sắp tới</div>
                <div className="panel-subtitle">Cập nhật theo tuần</div>
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

          <div className="card users-table">
            <div className="table-header">
              <div>
                <div className="panel-title">Gợi ý theo dõi</div>
                <div className="panel-subtitle">Điểm và hạnh kiểm gần đây</div>
              </div>
              <div className="panel-pill">{data.scores.length} điểm</div>
            </div>
            <div className="table-grid">
              <div className="table-row table-head">
                <div>Chỉ số</div>
                <div>Giá trị</div>
              </div>
              <div className="table-row">
                <div className="table-title">Tổng bài điểm</div>
                <div className="table-title">{loading ? "..." : data.scores.length}</div>
              </div>
              <div className="table-row">
                <div className="table-title">Số lần đánh giá hạnh kiểm</div>
                <div className="table-title">{loading ? "..." : data.conducts.length}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}