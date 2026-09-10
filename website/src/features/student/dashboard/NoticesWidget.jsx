import React from "react";
import { Bell, Award } from "lucide-react";
import { RadialBarChart, RadialBar, ResponsiveContainer } from "recharts";
import { useNavigate } from "react-router-dom";

const NoticesWidget = ({ unreadNotices, attendanceRate, dtb }) => {
  const navigate = useNavigate();
  const radialData = [
    {
      name: "Chuyên cần",
      value: attendanceRate,
      fill: "#22C55E",
    },
  ];

  return (
    <div className="flex flex-col md:flex-row items-stretch gap-6">
      <div className="w-full md:w-1/2 bg-white rounded-2xl shadow-sm p-6 border border-slate-100 flex flex-col">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Bell size={20} className="text-amber-500" />
            <h3 className="text-base font-bold text-slate-800">Thông báo mới</h3>
          </div>
          <button
            onClick={() => navigate("/student/thongbao")}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            Xem tất cả
          </button>
        </div>

        {unreadNotices.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-slate-500 text-sm font-medium py-8">
            Không có thông báo mới.
          </div>
        ) : (
          <div className="flex flex-col gap-3 flex-1">
            {unreadNotices.slice(0, 5).map((notice, idx) => (
              <div
                key={idx}
                onClick={() => navigate("/student/thongbao", { state: { selectedNotice: notice } })}
                className="group cursor-pointer flex gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
              >
                <div className="mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                    {notice.tieuDe || notice.title || "Thông báo"}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 truncate">
                    {notice.ngayDang ? new Date(notice.ngayDang).toLocaleDateString("vi-VN") : "--"}
                  </div>
                </div>
                {idx < 2 && (
                  <div className="flex-shrink-0">
                    <span className="bg-red-100 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded">NEW</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="w-full md:w-1/2 bg-white rounded-2xl shadow-sm p-6 border border-slate-100 flex flex-col">
        <div className="flex items-center gap-2 mb-6">
          <Award size={20} className="text-green-500" />
          <h3 className="text-base font-bold text-slate-800">Tổng quan thành tích</h3>
        </div>

        <div className="flex flex-col xl:flex-row items-center gap-8 flex-1">
          <div className="relative w-32 h-32 flex-shrink-0 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="75%"
                outerRadius="100%"
                barSize={12}
                data={radialData}
                startAngle={90}
                endAngle={-270}
              >
                <RadialBar minAngle={15} background={{ fill: "#f1f5f9" }} clockWise dataKey="value" cornerRadius={10} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-extrabold text-blue-900 tracking-tight">{attendanceRate}%</span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Chuyên cần</span>
            </div>
          </div>

          <div className="flex-1 w-full flex flex-col gap-4">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-slate-600">Điểm Trung Bình</span>
                <span className="text-blue-600">{dtb !== null ? dtb.toFixed(1) : "--"} / 10</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(dtb / 10) * 100}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoticesWidget;

