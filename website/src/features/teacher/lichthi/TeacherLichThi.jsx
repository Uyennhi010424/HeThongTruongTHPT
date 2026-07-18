import { useEffect, useMemo, useRef, useState } from "react";
import { getLichThi } from "../../../api/lichthiApi.js";
import { getLop } from "../../../api/lopApi.js";
import { getMonHoc } from "../../../api/monhocApi.js";
import { getNamHoc } from "../../../api/namhocApi.js";
import { getCurrentGiaoVien } from "../../../api/giaovienApi.js";
import { getPhanCongDay } from "../../../api/phancongDayApi.js";
import { getChuNhiem } from "../../../api/chunhiemApi.js";
import { exportLichThiPdf } from "../../../api/lichthiApi.js";
import MaterialIcon from "../../../components/edu/MaterialIcon.jsx";
import { notifyError } from "../../../utils/notify.js";

const formatDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("vi-VN", {
    weekday: "long", day: "2-digit", month: "2-digit", year: "numeric"
  });
};

export default function TeacherLichThi() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lichThi, setLichThi] = useState([]);
  const [lops, setLops] = useState([]);
  const [monHocs, setMonHocs] = useState([]);
  const [namHocList, setNamHocList] = useState([]);
  const [selectedNamHoc, setSelectedNamHoc] = useState("");
  const [selectedHocKy, setSelectedHocKy] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef(null);

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        const [ltRes, lopRes, monRes, namRes, pcRes, meRes, cnRes] = await Promise.all([
          getLichThi(),
          getLop(),
          getMonHoc(),
          getNamHoc(),
          getPhanCongDay(),
          getCurrentGiaoVien().catch(() => null),
          getChuNhiem().catch(() => null)
        ]);
        if (!active) return;

        const teacher = meRes?.data?.data || null;
        const allPhanCong = pcRes?.data?.data || [];
        const chuNhiem = cnRes?.data?.data || [];

        const teacherClassIds = new Set();
        if (teacher) {
          allPhanCong
            .filter((p) => Number(p?.giaoVienId ?? p?.giaoVien?.id) === Number(teacher.id))
            .forEach((p) => {
              const cid = p?.lopId ?? p?.lop?.id;
              if (cid) teacherClassIds.add(String(cid));
            });
          chuNhiem
            .filter((c) => Number(c.giaoVienId) === Number(teacher.id))
            .forEach((c) => teacherClassIds.add(String(c.lopId)));
        }

        const allLichThi = ltRes?.data?.data || [];
        const teacherLichThi = teacher ? allLichThi.filter((lt) => {
          const lopId = String(lt.lopId ?? lt.lop?.id ?? "");
          const isGiamThi1 = Number(lt.giamThi1Id ?? lt.giamThi1?.id) === Number(teacher.id);
          const isGiamThi2 = Number(lt.giamThi2Id ?? lt.giamThi2?.id) === Number(teacher.id);
          return teacherClassIds.has(lopId) || isGiamThi1 || isGiamThi2;
        }) : allLichThi;

        setLichThi(teacherLichThi);
        setLops(lopRes?.data?.data || []);
        setMonHocs(monRes?.data?.data || []);

        const years = (namRes?.data?.data || [])
          .map((i) => i?.tenNamHoc || "").filter(Boolean)
          .sort((a, b) => Number(b.match(/(\d{4})/)?.[1] || 0) - Number(a.match(/(\d{4})/)?.[1] || 0));
        setNamHocList(years);
        if (years.length > 0) setSelectedNamHoc(years[0]);
      } catch {
        if (!active) return;
        setError("Không thể tải lịch thi.");
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchData();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setFilterOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredLichThi = useMemo(() => {
    return lichThi.filter((lt) => {
      if (selectedNamHoc && lt.namHoc !== selectedNamHoc) return false;
      if (selectedHocKy && Number(lt.hocKy) !== Number(selectedHocKy)) return false;
      return true;
    }).sort((a, b) => new Date(a.ngayThi + "T" + (a.gioBatDau || "00:00")) - new Date(b.ngayThi + "T" + (b.gioBatDau || "00:00")));
  }, [lichThi, selectedNamHoc, selectedHocKy]);

  const getLopName = (lt) => lt.lop?.tenLop || lops.find((l) => l.id === (lt.lopId ?? lt.lop?.id))?.tenLop || "--";
  const getMonName = (lt) => lt.monHoc?.tenMon || monHocs.find((m) => m.id === (lt.monHocId ?? lt.monHoc?.id))?.tenMon || "--";

  const hasFilter = selectedNamHoc !== "" || selectedHocKy !== "";

  const handleExportPdf = async () => {
    if (!filteredLichThi.length) {
      notifyError("Không có dữ liệu để xuất.");
      return;
    }

    try {
      const res = await exportLichThiPdf(selectedNamHoc || namHocList[0] || "", selectedHocKy ? Number(selectedHocKy) : "");
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `lichthi_${selectedNamHoc || namHocList[0] || "tatca"}_${selectedHocKy || "all"}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      notifyError("Không thể xuất PDF lịch thi.");
    }
  };

  const stats = useMemo(() => ({
    total: filteredLichThi.length,
    upcoming: filteredLichThi.filter((lt) => new Date(lt.ngayThi) >= new Date(new Date().toISOString().slice(0, 10))).length
  }), [filteredLichThi]);

  return (
    <div className="page users-page teacher-page teacher-schedule-page">
      <div className="teacher-strip teacher-schedule-hero">
        <div className="teacher-strip-avatar">LT</div>
        <div className="teacher-strip-info">
          <div className="teacher-strip-name">
            Lịch thi và coi thi
            <span className="teacher-strip-badge">GIÁO VIÊN</span>
          </div>
          <div className="teacher-strip-subject">
            Xem lịch thi các lớp phụ trách và các buổi coi thi theo năm học, học kỳ đang chọn.
          </div>
        </div>
        <div className="teacher-schedule-actions">
          <div className="filter-dropdown-wrap" ref={filterRef}>
            <button
              type="button"
              className={`btn-outline filter-toggle ${hasFilter ? "filter-active" : ""}`}
              onClick={() => setFilterOpen((current) => !current)}
              title="Lọc"
              aria-label="Lọc lịch thi"
            >
              <MaterialIcon name="filter_list" />
              {hasFilter && <span className="filter-dot" />}
            </button>

            {filterOpen && (
              <div className="filter-dropdown teacher-schedule-filter-dropdown">
                <div className="filter-dropdown-title">Lọc lịch thi</div>
                <label className="filter-dropdown-label">
                  <span>Năm học</span>
                  <select
                    value={selectedNamHoc}
                    onChange={(e) => {
                      setSelectedNamHoc(e.target.value);
                      setFilterOpen(false);
                    }}
                  >
                    <option value="">Tất cả</option>
                    {namHocList.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </label>
                <label className="filter-dropdown-label">
                  <span>Học kỳ</span>
                  <select
                    value={selectedHocKy}
                    onChange={(e) => {
                      setSelectedHocKy(e.target.value);
                      setFilterOpen(false);
                    }}
                  >
                    <option value="">Tất cả</option>
                    <option value="1">Học kỳ I</option>
                    <option value="2">Học kỳ II</option>
                  </select>
                </label>
                {hasFilter && (
                  <button
                    type="button"
                    className="filter-clear"
                    onClick={() => {
                      setSelectedNamHoc("");
                      setSelectedHocKy("");
                      setFilterOpen(false);
                    }}
                  >
                    Xóa bộ lọc
                  </button>
                )}
              </div>
            )}
          </div>

          <button type="button" className="btn-outline flex items-center gap-sm" onClick={handleExportPdf}>
            <MaterialIcon name="picture_as_pdf" /> Xuất PDF
          </button>
        </div>
      </div>

      <div className="users-stats">
        <div className="stat-card stat-sky">
          <div className="stat-label">Sắp tới</div>
          <div className="stat-value">{loading ? "..." : stats.upcoming}</div>
        </div>
      </div>

      {error && <div className="card table-empty">{error}</div>}

      {!error && !loading && filteredLichThi.length === 0 && (
        <div className="card table-empty">Không có lịch thi nào.</div>
      )}

      {!error && filteredLichThi.length > 0 && (
        <div className="card users-table teacher-schedule-table">
          <div className="table-header">
            <div>
              <div className="panel-title">Danh sách lịch thi</div>
              <div className="panel-subtitle">Lịch thi và lịch coi thi</div>
            </div>
            <div className="panel-pill">{filteredLichThi.length} lịch thi</div>
          </div>
          <div className="table-grid">
            <div className="table-row table-head">
              <div>Ngày thi</div>
              <div>Môn</div>
              <div>Lớp</div>
              <div>Thời gian</div>
              <div>Học kỳ</div>
            </div>
            {filteredLichThi.map((lt) => (
              <div key={lt.id} className="table-row">
                <div className="table-title">{formatDateTime(lt.ngayThi)}</div>
                <div className="table-title">{getMonName(lt)}</div>
                <div>{getLopName(lt)}</div>
                <div>{lt.thoiGianLamBai ? `${lt.thoiGianLamBai} phút` : "--"}</div>
                <div>HK{lt.hocKy || "--"}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
