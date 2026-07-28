const fs = require('fs');

const path = './website/src/features/student/HomePage.jsx';
let content = fs.readFileSync(path, 'utf8');

// Replace imports
content = content.replace(
  `} from "recharts";`,
  `  RadialBarChart,
  RadialBar,
} from "recharts";
import {
  User,
  MapPin,
  Mail,
  Phone,
  Calendar,
  Lock,
  Users,
  MessageSquare,
  BookOpen,
  Clock,
  Award,
  CheckCircle,
  TrendingUp,
  FileText,
  CalendarDays,
  ListTodo,
  Bell,
  Star,
  Activity,
} from "lucide-react";`
);

// Replace error/loading views
content = content.replace(
  /if\s*\(loading\)\s*\{\s*return\s*\(\s*<div style=\{s\.page\}>\s*<div style=\{s\.loadingBox\}>[^<]*<\/div>\s*<\/div>\s*\);\s*\}/g,
  `if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500 font-medium">Đang tải dữ liệu...</div>
      </div>
    );
  }`
);

content = content.replace(
  /if\s*\(error\)\s*\{\s*return\s*\(\s*<div style=\{s\.page\}>\s*<div style=\{s\.errorBox\}>[^<]*<\/div>\s*<\/div>\s*\);\s*\}/g,
  `if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-red-500 font-medium">{error}</div>
      </div>
    );
  }`
);

// Split at the main return block
const splitRegex = /return\s*\(\s*<div style=\{s\.page\}>\s*\{\/\* ── 2 CỘT/;
const parts = content.split(splitRegex);

if (parts.length < 2) {
  console.error("Could not find the main return block!");
  process.exit(1);
}

let logicCode = parts[0];
logicCode = logicCode.replace(/const s = styles;\s*/g, '');

const newJSX = `
  // Calculate attendance percentages
  const totalDays = 100; 
  const attendanceRate = data.attendanceStats ? Math.max(0, 100 - totalAbsent) : 100;
  
  const radialData = [
    {
      name: "Chuyên cần",
      value: attendanceRate,
      fill: "#22C55E"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6 pb-20">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">
        
        {/* === CỘT TRÁI (40%) === */}
        <div className="w-full lg:w-[40%] flex flex-col gap-6">
          
          {/* 1. Profile Card */}
          <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col gap-6 border border-slate-100">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 border border-slate-200 overflow-hidden">
                <User size={32} className="text-slate-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-slate-800 truncate">
                  {student?.hoTen || "Học sinh"}
                </h2>
                <div className="flex items-center gap-2 mt-1 text-sm text-slate-500 flex-wrap">
                  <span className="font-medium">{student?.maHocSinh || "--"}</span>
                  <span>•</span>
                  <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold text-xs">Đang học</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
              <div>
                <div className="text-slate-400 text-xs font-medium mb-1">Lớp</div>
                <div className="text-slate-700 font-semibold">{student?.lop?.tenLop || "--"}</div>
              </div>
              <div>
                <div className="text-slate-400 text-xs font-medium mb-1">GVCN</div>
                <div className="text-slate-700 font-semibold truncate" title={homeroomTeacher?.hoTen}>{homeroomTeacher?.hoTen || "--"}</div>
              </div>
              <div>
                <div className="text-slate-400 text-xs font-medium mb-1">Năm học</div>
                <div className="text-slate-700 font-semibold">{selectedNamHoc || "--"}</div>
              </div>
              <div>
                <div className="text-slate-400 text-xs font-medium mb-1">Học kỳ</div>
                <div className="text-slate-700 font-semibold">HK {selectedHK}</div>
              </div>
            </div>

            <div className="h-px bg-slate-100 w-full"></div>

            <div className="flex flex-col gap-3 text-sm">
              <div className="flex items-center gap-3 text-slate-600">
                <User size={16} className="text-slate-400" />
                <span>Giới tính: <span className="font-medium text-slate-800">{student?.gioiTinh === 1 ? "Nam" : student?.gioiTinh === 0 ? "Nữ" : "--"}</span></span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <Calendar size={16} className="text-slate-400" />
                <span>Ngày sinh: <span className="font-medium text-slate-800">{student?.ngaySinh ? new Date(student.ngaySinh).toLocaleDateString("vi-VN") : "--"}</span></span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <MapPin size={16} className="text-slate-400" />
                <span className="truncate">Địa chỉ: <span className="font-medium text-slate-800" title={student?.diaChi}>{student?.diaChi || "--"}</span></span>
              </div>
            </div>

            {/* Quick Actions (Profile) */}
            <div className="flex items-center justify-between mt-2 pt-4 border-t border-slate-100">
              <button onClick={() => navigate("/student/profile")} className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-slate-50 transition-colors text-slate-500 hover:text-blue-600 flex-1">
                <User size={18} />
                <span className="text-[11px] font-medium">Hồ sơ</span>
              </button>
              <button onClick={() => navigate("/student/profile")} className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-slate-50 transition-colors text-slate-500 hover:text-blue-600 flex-1">
                <Lock size={18} />
                <span className="text-[11px] font-medium">Mật khẩu</span>
              </button>
              <button onClick={() => navigate("/student/profile")} className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-slate-50 transition-colors text-slate-500 hover:text-blue-600 flex-1">
                <Users size={18} />
                <span className="text-[11px] font-medium">Phụ huynh</span>
              </button>
              <button className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-slate-50 transition-colors text-slate-500 hover:text-blue-600 flex-1">
                <MessageSquare size={18} />
                <span className="text-[11px] font-medium">L.hệ GVCN</span>
              </button>
            </div>
          </div>

          {/* 2. Lịch học hôm nay (Timeline) */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100 flex flex-col flex-1">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-bold text-slate-800">Lịch học hôm nay</h3>
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">{todayLabel}</span>
            </div>

            {todayTimetable.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center flex-1">
                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                  <CalendarDays size={28} className="text-slate-300" />
                </div>
                <div className="text-slate-500 font-medium text-sm">Không có tiết học hôm nay</div>
                <div className="text-slate-400 text-xs mt-1">Nghỉ ngơi thật tốt nhé!</div>
              </div>
            ) : (
              <div className="relative pl-3 border-l-2 border-slate-100 flex flex-col gap-6">
                {todayTimetable.map((t, idx) => {
                  const sName = getSubjectName(t.monHocId);
                  const color = subjectColorMap[t.monHocId] || "#2563EB";
                  return (
                    <div key={idx} className="relative">
                      {/* Timeline dot */}
                      <div 
                        className="absolute w-3 h-3 rounded-full -left-[19px] top-1.5 border-2 border-white"
                        style={{ backgroundColor: color, boxShadow: "0 0 0 1px #e2e8f0" }}
                      ></div>
                      
                      <div className="flex flex-col">
                        <div className="text-xs font-semibold text-slate-500 mb-1">
                          Tiết {t.tietBatDau}
                          {t.soTiet > 1 ? \` - \${t.tietBatDau + t.soTiet - 1}\` : ""}
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl rounded-tl-sm border border-slate-100">
                          <div className="font-bold text-slate-800 mb-1" style={{ color: color }}>{sName}</div>
                          <div className="flex items-center gap-4 text-xs text-slate-500 font-medium mt-2">
                            <span className="flex items-center gap-1.5">
                              <MapPin size={14} className="text-slate-400" />
                              Phòng {t.phongHoc || "--"}
                            </span>
                            <span className="flex items-center gap-1.5 truncate">
                              <User size={14} className="text-slate-400" />
                              GV. {t.giaoVien?.hoTen || "--"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* === CỘT PHẢI (60%) === */}
        <div className="w-full lg:w-[60%] flex flex-col gap-6">
          
          {/* 3. Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl shadow-sm p-4 border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all duration-200">
              <div className="absolute -right-2 -top-2 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                <BookOpen size={80} />
              </div>
              <div className="text-slate-500 text-xs font-semibold mb-1">Tiết học tuần này</div>
              <div className="text-3xl font-bold text-blue-600">{weekTimetable.reduce((acc, curr) => acc + curr.soTiet, 0)}</div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm p-4 border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all duration-200">
              <div className="absolute -right-2 -top-2 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                <Clock size={80} />
              </div>
              <div className="text-slate-500 text-xs font-semibold mb-1">Số môn học</div>
              <div className="text-3xl font-bold text-amber-500">{data.subjects.length}</div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-4 border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all duration-200">
              <div className="absolute -right-2 -top-2 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                <Award size={80} />
              </div>
              <div className="text-slate-500 text-xs font-semibold mb-1">Điểm trung bình</div>
              <div className="text-3xl font-bold text-green-500">{dtb !== null ? dtb.toFixed(2) : "--"}</div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-4 border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all duration-200">
              <div className="absolute -right-2 -top-2 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                <Star size={80} />
              </div>
              <div className="text-slate-500 text-xs font-semibold mb-1">Hạnh kiểm</div>
              <div className="text-2xl font-bold mt-1" style={{ color: hkColor.text }}>
                {hanhKiemLabel}
              </div>
            </div>
          </div>

          {/* 4. Widget Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button onClick={() => navigate("/student/score")} className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200 flex flex-col items-center justify-center gap-3 group">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp size={24} />
              </div>
              <span className="text-sm font-semibold text-slate-700">Kết quả học tập</span>
            </button>
            <button onClick={() => navigate("/student/timetable")} className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200 flex flex-col items-center justify-center gap-3 group">
              <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CalendarDays size={24} />
              </div>
              <span className="text-sm font-semibold text-slate-700">Thời khóa biểu</span>
            </button>
            <button onClick={() => navigate("/student/exams")} className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200 flex flex-col items-center justify-center gap-3 group">
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText size={24} />
              </div>
              <span className="text-sm font-semibold text-slate-700">Lịch thi</span>
            </button>
            <button onClick={() => navigate("/student/attendance")} className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200 flex flex-col items-center justify-center gap-3 group">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CheckCircle size={24} />
              </div>
              <span className="text-sm font-semibold text-slate-700">Điểm danh</span>
            </button>
          </div>

          {/* 5. Biểu đồ */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Activity size={20} className="text-blue-600" />
                <h3 className="text-base font-bold text-slate-800">Biểu đồ kết quả học tập</h3>
              </div>
              <div className="flex items-center gap-3">
                <select
                  className="bg-slate-50 border border-slate-200 text-sm font-medium text-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  value={selectedNamHoc}
                  onChange={(e) => setSelectedNamHoc(e.target.value)}
                >
                  {namHocList.length === 0 && <option value="">-- Năm học --</option>}
                  {namHocList.map((nh) => (
                    <option key={nh} value={nh}>{nh}</option>
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
                    <YAxis
                      domain={[0, 10]}
                      ticks={[0, 2, 4, 6, 8, 10]}
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ color: '#1e293b', fontWeight: 600 }}
                    />
                    <Bar dataKey="avg" barSize={24} radius={[6, 6, 0, 0]} animationDuration={1000}>
                      {chartData.map((entry, index) => (
                        <Cell key={\`cell-\${index}\`} fill={entry.fill} />
                      ))}
                      <LabelList dataKey="avg" position="top" fill="#64748b" fontSize={10} fontWeight={600} />
                    </Bar>
                    <Line type="monotone" dataKey="avg" stroke="#2563EB" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: "#fff" }} activeDot={{ r: 6 }} animationDuration={1500} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* 6. Hai Card ngang: Thông báo & Thành tích */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Thông báo */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100 flex flex-col">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Bell size={20} className="text-amber-500" />
                  <h3 className="text-base font-bold text-slate-800">Thông báo mới</h3>
                </div>
                <button onClick={() => navigate("/student/notices")} className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">Xem tất cả</button>
              </div>
              
              {unreadNotices.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-slate-500 text-sm font-medium py-8">
                  Không có thông báo mới.
                </div>
              ) : (
                <div className="flex flex-col gap-3 flex-1">
                  {unreadNotices.slice(0, 5).map((notice, idx) => (
                    <div key={idx} onClick={() => navigate("/student/notices")} className="group cursor-pointer flex gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
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

            {/* Thành tích */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100 flex flex-col">
              <div className="flex items-center gap-2 mb-6">
                <Award size={20} className="text-green-500" />
                <h3 className="text-base font-bold text-slate-800">Tổng quan thành tích</h3>
              </div>
              
              <div className="flex flex-col xl:flex-row items-center gap-8 flex-1">
                {/* Ring Chart Chuyên cần */}
                <div className="relative w-32 h-32 flex-shrink-0 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart 
                      cx="50%" cy="50%" 
                      innerRadius="75%" outerRadius="100%" 
                      barSize={12} data={radialData} 
                      startAngle={90} endAngle={-270}
                    >
                      <RadialBar minAngle={15} background={{ fill: '#f1f5f9' }} clockWise dataKey="value" cornerRadius={10} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-slate-800">{attendanceRate}%</span>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Chuyên cần</span>
                  </div>
                </div>

                {/* Progress bars / Stats */}
                <div className="flex-1 w-full flex flex-col gap-4">
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className="text-slate-600">Điểm Trung Bình</span>
                      <span className="text-blue-600">{dtb !== null ? dtb.toFixed(2) : "--"} / 10</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full transition-all duration-1000" style={{ width: \`\${(dtb || 0) * 10}%\` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className="text-slate-600">Hạnh kiểm</span>
                      <span style={{ color: hkColor.text }}>{hanhKiemLabel}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-1000" style={{ width: hanhKiemRaw === 'TOT' ? '100%' : hanhKiemRaw === 'KHA' ? '75%' : hanhKiemRaw === 'TRUNG_BINH' ? '50%' : '25%', backgroundColor: hkColor.text }}></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-xs font-semibold text-slate-600">Số buổi vắng</span>
                    <span className="text-sm font-bold text-red-500">{totalAbsent} buổi</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
`;

fs.writeFileSync(path, logicCode + newJSX);
console.log('Successfully updated HomePage.jsx');
