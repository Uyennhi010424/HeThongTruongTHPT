import { useEffect, useMemo, useState } from "react";
import { getLichThi, getLichThiByLop } from "../../api/lichthiApi.js";
import { getCurrentHocSinh } from "../../api/hocsinhApi.js";
import { formatDate } from "../../utils/helpers.js";

export default function StudentLichThi() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("upcoming"); // "upcoming" | "all"

  useEffect(() => {
    let active = true;
    const fetchExams = async () => {
      try {
        setLoading(true);
        setError("");
        const studentRes = await getCurrentHocSinh();
        if (!active) return;
        const student = studentRes?.data?.data;
        const lopId = student?.lop?.id;

        const examRes = lopId ? await getLichThiByLop(lopId) : await getLichThi();
        if (!active) return;
        const allExams = examRes?.data?.data || [];
        setExams(allExams);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const hasUpcoming = allExams.some((e) => e.ngayThi && new Date(e.ngayThi) >= now);
        if (!hasUpcoming && allExams.length > 0) {
          setFilter("all");
        }
      } catch {
        if (!active) return;
        setError("Không thể tải lịch thi.");
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchExams();
    return () => { active = false; };
  }, []);

  const filteredExams = useMemo(() => {
    const sorted = [...exams].sort((a, b) => new Date(a.ngayThi) - new Date(b.ngayThi));
    if (filter === "upcoming") {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      return sorted.filter((e) => e.ngayThi && new Date(e.ngayThi) >= now);
    }
    return sorted;
  }, [exams, filter]);

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const upcomingCount = exams.filter((e) => e.ngayThi && new Date(e.ngayThi) >= now).length;

  return (
    <div className="student-page">
      <section className="student-hero card">
        <div className="student-hero-copy">
          <div className="student-hero-kicker">EduManager Pro</div>
          <h2 className="student-hero-title">Lịch thi</h2>
          <p className="student-hero-subtitle">Xem lịch thi sắp tới và đã qua.</p>
        </div>
        <div className="student-hero-metrics">
          <div className="student-hero-chip">{loading ? "..." : upcomingCount} lịch thi sắp tới</div>
        </div>
      </section>

      <div className="card users-toolbar">
        <div className="semester-switch">
          {[
            { value: "upcoming", label: "Sắp tới" },
            { value: "all", label: "Tất cả" }
          ].map((tab) => (
            <button
              key={tab.value}
              type="button"
              className={`semester-pill ${filter === tab.value ? "active" : ""}`}
              onClick={() => setFilter(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="card table-empty">{error}</div>}

      {!error && !loading && filteredExams.length === 0 && (
        <div className="card table-empty">
          {filter === "upcoming" ? "Không có lịch thi sắp tới." : "Chưa có lịch thi."}
        </div>
      )}

      {!error && filteredExams.length > 0 && (
        <div className="card users-table">
          <div className="table-header">
            <div>
              <div className="panel-title">
                {filter === "upcoming" ? "Lịch thi sắp tới" : "Tất cả lịch thi"}
              </div>
              <div className="panel-subtitle">Thông tin chi tiết các kỳ thi</div>
            </div>
            <div className="panel-pill">{filteredExams.length} lịch thi</div>
          </div>
          <div className="table-grid">
            <div className="table-row table-head">
              <div>STT</div>
              <div>Môn thi</div>
              <div>Ngày thi</div>
              <div>Giờ bắt đầu</div>
              <div>Thời gian (phút)</div>
              <div>Phòng thi</div>
              <div>Ghi chú</div>
            </div>
            {filteredExams.map((item, index) => (
              <div className="table-row" key={item.id}>
                <div className="table-id">{index + 1}</div>
                <div className="table-title">{item.monHoc?.tenMon || "--"}</div>
                <div className="table-title">{formatDate(item.ngayThi) || "--"}</div>
                <div className="table-title">{item.gioBatDau || "--"}</div>
                <div className="table-title">{item.thoiGianLamBai ?? "--"}</div>
                <div className="table-title">{item.phongThi || item.lop?.phongHoc || "--"}</div>
                <div className="table-meta">{item.ghiChu || "--"}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
