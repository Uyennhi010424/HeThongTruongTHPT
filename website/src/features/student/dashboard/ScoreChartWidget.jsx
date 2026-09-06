import React, { useMemo } from "react";
import { Activity } from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  Cell,
  LabelList,
  Line,
} from "recharts";

const EXCLUDED_SUBJECTS = ["chào cờ", "sinh hoạt lớp", "hướng nghiệp", "ngoài giờ lên lớp", "giáo dục thể chất", "giáo dục quốc phòng"];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.1)] border border-slate-100">
        <p className="font-semibold text-slate-800 mb-1">{label}</p>
        <p className="text-sm font-medium text-blue-600">
          Điểm trung bình: <span className="font-bold">{payload[0].value}</span>
        </p>
      </div>
    );
  }
  return null;
};


const ScoreChartWidget = ({ 
  subjectScores, 
  subjectMap, 
  subjectColorMap, 
  namHocList, 
  activeYearName,
  selectedNamHoc, 
  setSelectedNamHoc, 
  selectedHK, 
  setSelectedHK 
}) => {
  const chartData = useMemo(() => {
    if (!subjectScores || !subjectScores.length) return [];
    return subjectScores
      .filter((item) => {
        if (item.avgScore == null) return false;
        const name = (subjectMap[item.monHocId] || "").toLowerCase();
        return !EXCLUDED_SUBJECTS.some((ex) => name.includes(ex));
      })
      .map((item) => ({
        name: subjectMap[item.monHocId] || `Môn ${item.monHocId}`,
        avg: item.avgScore,
        fill: subjectColorMap[item.monHocId] || "#94a3b8",
      }));
  }, [subjectScores, subjectColorMap, subjectMap]);

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Activity size={20} className="text-blue-600" />
          <h3 className="text-base font-bold text-slate-800">Biểu đồ kết quả học tập</h3>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="bg-slate-50 border border-slate-200 text-sm font-medium text-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
            value={selectedNamHoc}
            onChange={(e) => setSelectedNamHoc(e.target.value)}
          >
            {namHocList.length === 0 && <option value="">-- Năm học --</option>}
            {namHocList.map((nh) => (
              <option key={nh} value={nh}>
                {nh}
              </option>
            ))}
          </select>
          <select
            className="bg-slate-50 border border-slate-200 text-sm font-medium text-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            value={selectedHK}
            onChange={(e) => setSelectedHK(Number(e.target.value))}
          >
            <option value={1}>Học kỳ 1</option>
            <option value={2}>Học kỳ 2</option>
          </select>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="flex items-center justify-center h-[350px] text-slate-500 font-medium">
          Chưa có dữ liệu điểm cho khoảng thời gian này.
        </div>
      ) : (
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
              <CartesianGrid stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "#64748b", fontWeight: 500 }}
                axisLine={{ stroke: "#e2e8f0" }}
                tickLine={false}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "rgba(241, 245, 249, 0.5)" }}
              />
              <Bar dataKey="avg" barSize={24} radius={[6, 6, 0, 0]} animationDuration={1000}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
                <LabelList dataKey="avg" position="top" fill="#64748b" fontSize={10} fontWeight={600} />
              </Bar>
              <Line
                type="monotone"
                dataKey="avg"
                stroke="#2563EB"
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
                activeDot={{ r: 6 }}
                animationDuration={1500}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default ScoreChartWidget;
