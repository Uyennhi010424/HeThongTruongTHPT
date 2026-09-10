import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Calendar, Clock, MapPin, FileText } from "lucide-react";
import { getLichThi, getLichThiByLop } from "../../api/lichthiApi.js";
import { getCurrentHocSinh } from "../../api/hocsinhApi.js";
import { formatDate } from "../../utils/helpers.js";

export default function StudentLichThi() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("upcoming"); // "upcoming" | "all"
  const [expandedExamId, setExpandedExamId] = useState(null);

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

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto min-w-[700px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider w-14 text-center">STT</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Môn thi</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Ngày thi</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Giờ bắt đầu</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Thời gian</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Phòng thi</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExams.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 text-sm text-slate-500 text-center font-medium">{index + 1}</td>
                    <td className="px-4 py-3 text-sm font-bold text-slate-900">{item.monHoc?.tenMon || "--"}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{formatDate(item.ngayThi) || "--"}</td>
                    <td className="px-4 py-3 text-sm text-slate-700 font-semibold">{item.gioBatDau || "--"}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{item.thoiGianLamBai ? `${item.thoiGianLamBai} phút` : "--"}</td>
                    <td className="px-4 py-3 text-sm text-slate-700 font-medium">{item.phongThi || item.lop?.phongHoc || "--"}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{item.ghiChu || "--"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Collapsible Accordion View */}
          <div className="block md:hidden divide-y divide-slate-100">
            {filteredExams.map((item, index) => {
              const isExpanded = expandedExamId === item.id;
              return (
                <div key={item.id} className="p-4 hover:bg-slate-50/70 transition-colors">
                  <div
                    className="flex items-center justify-between cursor-pointer gap-2"
                    onClick={() => setExpandedExamId(isExpanded ? null : item.id)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-bold text-slate-400 w-6 text-center shrink-0">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 truncate">
                          {item.monHoc?.tenMon || "--"}
                        </h4>
                        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                          <span>{formatDate(item.ngayThi) || "--"}</span>
                          <span>•</span>
                          <span className="font-semibold text-blue-600">{item.gioBatDau || "--"}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="p-1 text-slate-400 hover:text-slate-600 rounded-lg shrink-0"
                      aria-label="Toggle details"
                    >
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-2 animate-in fade-in-50 duration-200">
                      <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl">
                        <div>
                          <span className="text-slate-400 block text-[11px]">Thời gian làm bài:</span>
                          <span className="font-semibold text-slate-800">{item.thoiGianLamBai ? `${item.thoiGianLamBai} phút` : "--"}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Phòng thi:</span>
                          <span className="font-semibold text-slate-800">{item.phongThi || item.lop?.phongHoc || "--"}</span>
                        </div>
                        {item.ghiChu && (
                          <div className="col-span-2">
                            <span className="text-slate-400 block text-[11px]">Ghi chú:</span>
                            <span className="text-slate-700">{item.ghiChu}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
