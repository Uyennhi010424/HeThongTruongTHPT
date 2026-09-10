import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { getKhenThuong, getViPham } from "../../api/khenThuongViPhamApi.js";
import { getCurrentHocSinh } from "../../api/hocsinhApi.js";

const MUC_DO_MAP = {
  NHE: { label: "Nhẹ", color: "text-yellow-700 bg-yellow-50" },
  TRUNG_BINH: { label: "Trung bình", color: "text-orange-700 bg-orange-50" },
  NGHIEM_TRONG: { label: "Nghiêm trọng", color: "text-red-700 bg-red-50" }
};

export default function KhenThuongPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [student, setStudent] = useState(null);
  const [khenThuong, setKhenThuong] = useState([]);
  const [viPham, setViPham] = useState([]);
  const [activeTab, setActiveTab] = useState("khen-thuong");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");
        const studentRes = await getCurrentHocSinh();
        if (!active) return;
        const currentStudent = studentRes?.data?.data || null;
        setStudent(currentStudent);

        if (!currentStudent) {
          setLoading(false);
          return;
        }

        const [ktRes, vpRes] = await Promise.all([
          getKhenThuong({ hocSinhId: currentStudent.id }),
          getViPham({ hocSinhId: currentStudent.id })
        ]);
        if (!active) return;
        setKhenThuong(ktRes?.data?.data || []);
        setViPham(vpRes?.data?.data || []);
      } catch {
        if (!active) return;
        setError("Không thể tải dữ liệu khen thưởng/vi phạm.");
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchData();
    return () => { active = false; };
  }, []);

  const currentList = activeTab === "khen-thuong" ? khenThuong : viPham;

  return (
    <div className="student-page">
      <section className="student-hero card">
        <div className="student-hero-copy">
          <div className="student-hero-kicker">EduManager Pro</div>
          <h2 className="student-hero-title">Khen thưởng & Vi phạm</h2>
          <p className="student-hero-subtitle">Xem các khen thưởng và vi phạm của bản thân.</p>
        </div>
        <div className="student-hero-metrics">
          <div className="student-hero-chip">{loading ? "..." : khenThuong.length} khen thưởng</div>
          <div className="student-hero-chip">{loading ? "..." : viPham.length} vi phạm</div>
        </div>
      </section>

      <div className="card users-toolbar">
        <div className="semester-switch">
          {[
            { value: "khen-thuong", label: "Khen thưởng", icon: "emoji_events" },
            { value: "vi-pham", label: "Vi phạm", icon: "warning" }
          ].map((tab) => (
            <button
              key={tab.value}
              type="button"
              className={`semester-pill ${activeTab === tab.value ? "active" : ""}`}
              onClick={() => { setActiveTab(tab.value); setExpandedId(null); }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="card table-empty">{error}</div>}

      {!error && !loading && currentList.length === 0 && (
        <div className="card table-empty">
          {activeTab === "khen-thuong"
            ? "Chưa có khen thưởng nào."
            : "Chưa có vi phạm nào. Tiếp tục phát huy!"}
        </div>
      )}

      {!error && currentList.length > 0 && (
        <div className="card users-table">
          <div className="table-header">
            <div>
              <div className="panel-title">
                {activeTab === "khen-thuong" ? "Danh sách khen thưởng" : "Danh sách vi phạm"}
              </div>
            </div>
            <div className="panel-pill">{currentList.length} bản ghi</div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto min-w-[600px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider w-14 text-center">STT</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Nội dung</th>
                  {activeTab === "vi-pham" && (
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider w-36">Mức độ</th>
                  )}
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider w-36">Ngày</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentList.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 text-sm text-slate-500 text-center font-medium">{idx + 1}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-800">{item.noiDung || "--"}</td>
                    {activeTab === "vi-pham" && (
                      <td className="px-4 py-3 text-sm">
                        {item.mucDo ? (
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-md text-xs font-semibold ${MUC_DO_MAP[item.mucDo]?.color || "text-gray-700 bg-gray-50"}`}
                          >
                            {MUC_DO_MAP[item.mucDo]?.label || item.mucDo}
                          </span>
                        ) : "--"}
                      </td>
                    )}
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {(item.ngayKhen || item.ngayViPham)
                        ? new Date(item.ngayKhen || item.ngayViPham).toLocaleDateString("vi-VN")
                        : "--"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Collapsible Accordion View */}
          <div className="block md:hidden divide-y divide-slate-100">
            {currentList.map((item, idx) => {
              const isExpanded = expandedId === item.id;
              const dateStr = (item.ngayKhen || item.ngayViPham)
                ? new Date(item.ngayKhen || item.ngayViPham).toLocaleDateString("vi-VN")
                : "--";
              return (
                <div key={item.id} className="p-4 hover:bg-slate-50/70 transition-colors">
                  <div
                    className="flex items-center justify-between cursor-pointer gap-2"
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-bold text-slate-400 w-6 text-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 line-clamp-1">
                          {item.noiDung || "--"}
                        </h4>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {dateStr}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {activeTab === "vi-pham" && item.mucDo && (
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${MUC_DO_MAP[item.mucDo]?.color || "text-gray-700 bg-gray-50"}`}>
                          {MUC_DO_MAP[item.mucDo]?.label || item.mucDo}
                        </span>
                      )}
                      <button
                        type="button"
                        className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                        aria-label="Toggle details"
                      >
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-2 animate-in fade-in-50 duration-200">
                      <div className="bg-slate-50 p-3 rounded-xl space-y-1.5">
                        <div>
                          <span className="text-slate-400 block text-[11px]">Nội dung chi tiết:</span>
                          <span className="font-medium text-slate-800">{item.noiDung || "--"}</span>
                        </div>
                        <div className="flex justify-between pt-1">
                          <span className="text-slate-400">Ngày ghi nhận:</span>
                          <span className="font-semibold text-slate-800">{dateStr}</span>
                        </div>
                        {activeTab === "vi-pham" && item.mucDo && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">Mức độ xử lý:</span>
                            <span className="font-semibold text-slate-800">{MUC_DO_MAP[item.mucDo]?.label || item.mucDo}</span>
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
