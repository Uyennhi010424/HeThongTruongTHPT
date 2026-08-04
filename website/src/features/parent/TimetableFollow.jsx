import { useEffect, useMemo, useRef, useState } from "react";
import { getThoiKhoaBieu } from "../../api/thoikhoabieuApi.js";
import { getNamHoc } from "../../api/namhocApi.js";
import { formatDate, getDayLabel, getCurrentSemesterWeek } from "../../utils/helpers.js";
import { getLichThi, getLichThiByLop } from "../../api/lichthiApi.js";
import useParentStudents from "../../hooks/useParentStudents.js";
import StudentSelector from "./StudentSelector.jsx";

export default function TimetableFollow() {
  const { students, currentStudent, selectedIndex, selectStudent, loading: studentsLoading, error: studentsError } = useParentStudents();
  const [timetable, setTimetable] = useState([]);
  const [exams, setExams] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [isExamWeek, setIsExamWeek] = useState(false);
  const [dataError, setDataError] = useState("");
  const [selectedTuan, setSelectedTuan] = useState(1);
  // Lưu thông tin năm học / học kỳ từ database để dùng khi chuyển tuần
  const [yearInfo, setYearInfo] = useState({ tenNamHoc: "", hocKy: 1, activeYearObj: null });

  const isInitialLoad = useRef(true);

  useEffect(() => {
    if (!currentStudent) return;
    let active = true;

    const fetchData = async () => {
      try {
        setDataLoading(true);
        setDataError("");

        const lopId = currentStudent?.lop?.id;

        // Lấy thông tin năm học từ database thay vì tính theo tháng hệ thống
        let curNamHoc = "";
        let curHocKy = 1;
        let activeYearObj = null;
        try {
          const namHocRes = await getNamHoc();
          const years = namHocRes?.data?.data || [];
          activeYearObj = years.find((y) => (y.trangThai || y.trang_thai) === "DANG_MO") || years[years.length - 1] || null;
          if (activeYearObj) {
            curNamHoc = activeYearObj.tenNamHoc || "";
            // Xác định học kỳ hiện tại bằng ngày bắt đầu HK2 từ database
            if (activeYearObj.ngayBatDauHk2) {
              const today = new Date().toISOString().slice(0, 10);
              if (today >= activeYearObj.ngayBatDauHk2) curHocKy = 2;
            }
          }
        } catch { /* ignore */ }

        // Tính tuần hiện tại từ ngayBatDauHk1 trong database
        const currentTuan = getCurrentSemesterWeek(activeYearObj);

        // Đánh dấu đang load lần đầu để useEffect tuần không trigger trùng lặp
        isInitialLoad.current = true;
        setYearInfo({ tenNamHoc: curNamHoc, hocKy: curHocKy, activeYearObj });
        setSelectedTuan(currentTuan);

        // Lấy TKB với đầy đủ filter: lopId + namHoc + hocKy + tuan (chỉ lấy đúng tuần hiện tại)
        const [tkbRes, examRes] = await Promise.all([
          lopId
            ? getThoiKhoaBieu({ lopId, namHoc: curNamHoc, hocKy: curHocKy, tuan: currentTuan })
            : getThoiKhoaBieu(),
          lopId ? getLichThiByLop(lopId) : getLichThi()
        ]);
        if (!active) return;
        setTimetable(tkbRes?.data?.data || []);
        setIsExamWeek(tkbRes?.data?.message === "TUAN_THI");
        setExams(examRes?.data?.data || []);
        // Hoàn thành load lần đầu
        isInitialLoad.current = false;
      } catch {
        if (!active) return;
        setDataError("Không thể tải lịch học hoặc lịch thi.");
        isInitialLoad.current = false;
      } finally {
        if (active) setDataLoading(false);
      }
    };

    fetchData();
    return () => { active = false; };
  }, [currentStudent?.id]);

  // Khi phụ huynh chuyển sang tuần khác, refetch TKB từ server với tuan mới
  // Bỏ qua lần trigger đầu tiên khi mới load (isInitialLoad.current = true)
  useEffect(() => {
    if (!yearInfo.tenNamHoc || !currentStudent?.lop?.id) return;
    if (isInitialLoad.current) return;
    let active = true;
    const lopId = currentStudent.lop.id;
    const refetchByWeek = async () => {
      try {
        setDataLoading(true);
        const res = await getThoiKhoaBieu({
          lopId,
          namHoc: yearInfo.tenNamHoc,
          hocKy: yearInfo.hocKy,
          tuan: selectedTuan
        });
        if (!active) return;
        setTimetable(res?.data?.data || []);
        setIsExamWeek(res?.data?.message === "TUAN_THI");
      } catch { /* ignore */ } finally {
        if (active) setDataLoading(false);
      }
    };
    refetchByWeek();
    return () => { active = false; };
  }, [selectedTuan, yearInfo.tenNamHoc, yearInfo.hocKy, currentStudent?.lop?.id]);

  const loading = studentsLoading || dataLoading;
  const error = studentsError || dataError;

  // Server đã lọc theo tuan nên không cần lọc client-side theo tuan nữa
  const filteredTimetable = useMemo(() => {
    return timetable;
  }, [timetable]);

  const stats = useMemo(() => {
    const totalLessons = filteredTimetable.length;
    const totalExams = exams.length;
    return { totalLessons, totalExams };
  }, [filteredTimetable, exams]);

  return (
    <div className="page users-page student-page">
      <div className="mb-6 shrink-0 border-b border-slate-200 pb-4">
        <h2 className="text-2xl font-extrabold text-blue-900 tracking-tight flex items-center gap-3">
          Thời khóa biểu
        </h2>
        <div className="flex items-center justify-between mt-2">
          <p className="text-slate-500 text-[14px]">
            Xem lịch học và lịch thi của con em.
          </p>
          <div className="flex items-center gap-2">
            <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold border border-blue-100">
              {loading ? "..." : stats.totalLessons} tiết học
            </div>
            <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold border border-blue-100">
              {loading ? "..." : stats.totalExams} lịch thi
            </div>
          </div>
        </div>
      </div>

      <StudentSelector students={students} selectedIndex={selectedIndex} onSelect={selectStudent} />

      <div className="users-stats student-stats">
        <div className="stat-card stat-blue">
          <div className="stat-label">Lịch học</div>
          <div className="stat-value">{loading ? "..." : stats.totalLessons}</div>
        </div>
        <div className="stat-card stat-sky">
          <div className="stat-label">Lịch thi</div>
          <div className="stat-value">{loading ? "..." : stats.totalExams}</div>
        </div>
      </div>

      {error && <div className="card table-empty">{error}</div>}

      <div className="card users-table student-card">
        <div className="table-header">
          <div>
            <div className="panel-title">Thời khóa biểu</div>
            <div className="panel-subtitle">Lịch học theo tuần</div>
          </div>
          <div className="panel-pill">Tuần {selectedTuan} · {filteredTimetable.length} tiết</div>
        </div>
        <div className="timetable-week-toolbar">
          <button className="btn-outline btn-sm" type="button" onClick={() => setSelectedTuan((prev) => Math.max(1, prev - 1))}>
            Tuần trước
          </button>
          <button className="btn-outline btn-sm" type="button" onClick={() => setSelectedTuan((prev) => prev + 1)}>
            Tuần sau
          </button>
        </div>
        {isExamWeek ? (
          <div style={{ padding: "40px", textAlign: "center", background: "#fef2f2", borderRadius: 8, margin: 16 }}>
            <h3 style={{ color: "#ef4444", fontSize: 20, margin: 0 }}>TUẦN NÀY LÀ TUẦN THI</h3>
            <p style={{ color: "#7f1d1d", marginTop: 8 }}>Vui lòng kiểm tra mục Lịch thi bên dưới để biết chi tiết.</p>
          </div>
        ) : !loading && filteredTimetable.length === 0 ? (
          <div className="table-empty">Chưa có lịch học.</div>
        ) : (
          <div className="table-grid">
            <div className="table-row table-head">
              <div>STT</div>
              <div>Thứ</div>
              <div>Tiết bắt đầu</div>
              <div>Số tiết</div>
              <div>Ghi chú</div>
            </div>
            {loading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div className="table-row" key={`skeleton-${index}`}>
                  <div className="skeleton" />
                  <div className="skeleton" />
                  <div className="skeleton" />
                  <div className="skeleton" />
                  <div className="skeleton" />
                </div>
              ))
            ) : (
              filteredTimetable.map((item, index) => (
                <div className="table-row" key={item.id}>
                  <div className="table-id">{index + 1}</div>
                  <div className="table-title">{getDayLabel(item.thu)}</div>
                  <div className="table-title">{item.tietBatDau ?? "--"}</div>
                  <div className="table-title">{item.soTiet ?? "--"}</div>
                  <div className="table-meta">{item.ghiChu || ""}</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="card users-table student-card">
        <div className="table-header">
          <div>
            <div className="panel-title">Lịch thi</div>
            <div className="panel-subtitle">Theo dõi các kỳ thi sắp tới</div>
          </div>
          <div className="panel-pill">{exams.length} lịch thi</div>
        </div>
        {!error && !loading && exams.length === 0 ? (
          <div className="table-empty">Chưa có lịch thi.</div>
        ) : (
          <div className="table-grid">
            <div className="table-row table-head">
              <div>STT</div>
              <div>Ngày thi</div>
              <div>Giờ bắt đầu</div>
              <div>Thời gian (phút)</div>
              <div>Phòng thi</div>
            </div>
            {loading
              ? Array.from({ length: 3 }).map((_, index) => (
                  <div className="table-row" key={`skeleton-${index}`}>
                    <div className="skeleton" />
                    <div className="skeleton" />
                    <div className="skeleton" />
                    <div className="skeleton" />
                    <div className="skeleton" />
                  </div>
                ))
              : exams.map((item, index) => (
                  <div className="table-row" key={item.id}>
                    <div className="table-id">{index + 1}</div>
                    <div className="table-title">{formatDate(item.ngayThi) || "--"}</div>
                    <div className="table-title">{item.gioBatDau || "--"}</div>
                    <div className="table-title">{item.thoiGianLamBai ?? "--"}</div>
                    <div className="table-title">{item.phongThi || "--"}</div>
                  </div>
                ))}
          </div>
        )}
      </div>
    </div>
  );
}
