import { useEffect, useMemo, useState } from "react";
import { Calendar, CheckCircle2, AlertTriangle, XCircle, Clock, Filter, Percent } from "lucide-react";
import { getStudentStatistics } from "../../api/diemdanhApi.js";
import { getNamHoc } from "../../api/namhocApi.js";
import useParentStudents from "../../hooks/useParentStudents.js";
import StudentSelector from "./StudentSelector.jsx";

const STATUS_MAP = {
  CO_MAT: { label: "Có mặt", color: "text-emerald-700 bg-emerald-50 border border-emerald-200", icon: CheckCircle2 },
  CO_PHEP: { label: "Vắng có phép", color: "text-amber-700 bg-amber-50 border border-amber-200", icon: AlertTriangle },
  KHONG_PHEP: { label: "Vắng không phép", color: "text-rose-700 bg-rose-50 border border-rose-200", icon: XCircle },
};

export default function ParentDiemDanh() {
  const { students, currentStudent, selectedIndex, selectStudent, loading: studentsLoading } = useParentStudents();
  const [statistics, setStatistics] = useState(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState("");
  const [namHocList, setNamHocList] = useState([]);
  const [selectedNamHoc, setSelectedNamHoc] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [activePreset, setActivePreset] = useState("all");

  // Fetch danh sách năm học
  useEffect(() => {
    const fetchYears = async () => {
      try {
        const res = await getNamHoc();
        const years = (res?.data?.data || [])
          .map((item) => item?.tenNamHoc || "")
          .filter(Boolean)
          .sort((a, b) => Number(b.match(/(\d{4})/)?.[1] || 0) - Number(a.match(/(\d{4})/)?.[1] || 0));
        setNamHocList(years);
        const curYear = currentStudent?.lop?.namHoc || years[0] || "2026-2027";
        setSelectedNamHoc(curYear);

        const match = curYear.match(/(\d{4})-(\d{4})/);
        const startYear = match ? Number(match[1]) : 2026;
        setFromDate(`${startYear}-09-01`);
        setToDate(`${startYear + 1}-05-31`);
      } catch (err) {
        console.error("Lỗi tải năm học:", err);
      }
    };
    fetchYears();
  }, [currentStudent?.id]);

  const handleYearChange = (year) => {
    setSelectedNamHoc(year);
    setActivePreset("all");
    const match = year.match(/(\d{4})-(\d{4})/);
    const startYear = match ? Number(match[1]) : 2026;
    setFromDate(`${startYear}-09-01`);
    setToDate(`${startYear + 1}-05-31`);
  };

  const handlePresetChange = (preset) => {
    setActivePreset(preset);
    const match = selectedNamHoc.match(/(\d{4})-(\d{4})/);
    const startYear = match ? Number(match[1]) : 2026;

    if (preset === "hk1") {
      setFromDate(`${startYear}-09-01`);
      setToDate(`${startYear + 1}-01-04`);
    } else if (preset === "hk2") {
      setFromDate(`${startYear + 1}-01-05`);
      setToDate(`${startYear + 1}-05-31`);
    } else if (preset === "all") {
      setFromDate(`${startYear}-09-01`);
      setToDate(`${startYear + 1}-05-31`);
    } else if (preset === "recent") {
      const now = new Date();
      const from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      setFromDate(from.toISOString().slice(0, 10));
      setToDate(now.toISOString().slice(0, 10));
    }
  };

  useEffect(() => {
    if (!currentStudent?.id || !fromDate || !toDate) return;
    let active = true;

    const fetchStats = async () => {
      try {
        setDataLoading(true);
        setError("");
        const statsRes = await getStudentStatistics(currentStudent.id, fromDate, toDate);
        if (!active) return;
        setStatistics(statsRes?.data?.data || null);
      } catch {
        if (!active) return;
        setError("Không thể tải dữ liệu điểm danh.");
      } finally {
        if (active) setDataLoading(false);
      }
    };

    fetchStats();
    return () => { active = false; };
  }, [currentStudent?.id, fromDate, toDate]);

  const loading = studentsLoading || dataLoading;

  const stats = useMemo(() => {
    if (!statistics) {
      return { total: 0, coMat: 0, vangCoPhep: 0, vangKhongPhep: 0, diTre: 0, rate: "100.0" };
    }

    const coPhep = statistics.excusedAbsent ?? statistics.vangCoPhep ?? statistics.coPhep ?? 0;
    const khongPhep = statistics.unexcusedAbsent ?? statistics.vangKhongPhep ?? statistics.khongPhep ?? 0;
    const totalAbsent = coPhep + khongPhep;
    const total = statistics.tongNgayHoc || statistics.totalDays || totalAbsent;
    const coMat = statistics.present ?? statistics.coMat ?? Math.max(0, total - totalAbsent);
    const rate = total > 0 ? ((coMat / total) * 100).toFixed(1) : "100.0";

    return {
      total,
      coMat,
      vangCoPhep: coPhep,
      vangKhongPhep: khongPhep,
      diTre: statistics.late ?? statistics.diTre ?? 0,
      rate
    };
  }, [statistics]);

  return (
    <div className="flex-1 bg-slate-50/50 min-h-screen pb-12">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-blue-900 tracking-tight flex items-center gap-2.5">
            <CheckCircle2 className="text-emerald-600" size={26} />
            Theo dõi điểm danh
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Quản lý và theo dõi chi tiết chuyên cần, số buổi vắng học của con.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <StudentSelector students={students} selectedIndex={selectedIndex} onSelect={selectStudent} />
        </div>
      </div>

      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Bộ lọc thời gian */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {namHocList.length > 0 && (
              <div className="flex items-center gap-1.5 mr-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Năm học:</span>
                <select
                  value={selectedNamHoc}
                  onChange={(e) => handleYearChange(e.target.value)}
                  className="bg-blue-50 border border-blue-200 text-blue-700 font-bold rounded-xl text-xs px-3 py-1.5 outline-none cursor-pointer hover:bg-blue-100 transition-colors"
                >
                  {namHocList.map((y) => (
                    <option key={y} value={y}>Năm học {y}</option>
                  ))}
                </select>
              </div>
            )}
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Lọc nhanh:</span>
            <button
              onClick={() => handlePresetChange("all")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activePreset === "all"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
              }`}
            >
              Cả năm học
            </button>
            <button
              onClick={() => handlePresetChange("hk1")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activePreset === "hk1"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
              }`}
            >
              Học kỳ 1
            </button>
            <button
              onClick={() => handlePresetChange("hk2")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activePreset === "hk2"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
              }`}
            >
              Học kỳ 2
            </button>
            <button
              onClick={() => handlePresetChange("recent")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activePreset === "recent"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
              }`}
            >
              30 ngày gần đây
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80 inline-flex items-center gap-2 text-xs">
              <span className="font-medium text-slate-500">Từ</span>
              <input
                type="date"
                className="bg-transparent border-none outline-none font-bold text-slate-700 cursor-pointer"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setActivePreset("custom");
                }}
              />
              <span className="text-slate-300">|</span>
              <span className="font-medium text-slate-500">Đến</span>
              <input
                type="date"
                className="bg-transparent border-none outline-none font-bold text-slate-700 cursor-pointer"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setActivePreset("custom");
                }}
              />
            </div>
          </div>
        </div>

        {/* Khối thống kê tổng quan (Cards) */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
              <Calendar size={24} />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500">Tổng ngày học</div>
              <div className="text-2xl font-black text-slate-900 mt-0.5">{stats.total} <span className="text-xs font-semibold text-slate-400">ngày</span></div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500">Số ngày có mặt</div>
              <div className="text-2xl font-black text-emerald-600 mt-0.5">{stats.coMat} <span className="text-xs font-semibold text-slate-400">buổi</span></div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={24} />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500">Vắng có phép</div>
              <div className="text-2xl font-black text-amber-600 mt-0.5">{stats.vangCoPhep} <span className="text-xs font-semibold text-slate-400">buổi</span></div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
              <XCircle size={24} />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500">Vắng không phép</div>
              <div className="text-2xl font-black text-rose-600 mt-0.5">{stats.vangKhongPhep} <span className="text-xs font-semibold text-slate-400">buổi</span></div>
            </div>
          </div>
        </div>

        {error ? (
          <div className="bg-red-50 text-red-600 p-6 rounded-2xl text-center border border-red-100 font-medium">
            {error}
          </div>
        ) : loading && !statistics ? (
          <div className="p-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-100">
            Đang tải dữ liệu điểm danh...
          </div>
        ) : (
          /* Bảng chi tiết điểm danh */
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Chi tiết các ngày vắng học</h3>
                <p className="text-xs text-slate-500 mt-0.5">Ghi nhận các buổi nghỉ học và lý do tương ứng</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Tỷ lệ chuyên cần:</span>
                <span className="text-sm font-extrabold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                  {stats.rate}%
                </span>
              </div>
            </div>

            {statistics?.details && statistics.details.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50/80 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-3.5 font-bold text-slate-700 text-xs uppercase tracking-wider">STT</th>
                      <th className="px-6 py-3.5 font-bold text-slate-700 text-xs uppercase tracking-wider">Ngày vắng</th>
                      <th className="px-6 py-3.5 font-bold text-slate-700 text-xs uppercase tracking-wider">Trạng thái</th>
                      <th className="px-6 py-3.5 font-bold text-slate-700 text-xs uppercase tracking-wider">Ghi chú & Lý do</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {statistics.details.map((item, idx) => {
                      const status = STATUS_MAP[item.trangThai] || STATUS_MAP.CO_PHEP;
                      const Icon = status.icon;
                      return (
                        <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-6 py-4 text-sm font-medium text-slate-500">
                            {idx + 1}
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-800 text-sm">
                            {item.ngayDiemDanh ? new Date(item.ngayDiemDanh + "T00:00:00").toLocaleDateString("vi-VN") : "--"}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 ${status.color} px-3 py-1 rounded-full text-xs font-semibold`}>
                              <Icon size={14} />
                              {status.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                            {item.ghiChu || "--"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-16 flex flex-col items-center justify-center text-slate-400 gap-3">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-1">
                  <CheckCircle2 size={32} />
                </div>
                <p className="font-bold text-slate-700 text-base">Không có ngày nghỉ nào trong khoảng thời gian này</p>
                <p className="text-xs text-slate-400">Học sinh tham gia đi học đầy đủ 100% chuyên cần.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
