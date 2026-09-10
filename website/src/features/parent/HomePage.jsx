import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, Calendar, User, Phone, Mail, MessageSquare, ChevronRight, CheckCircle2, BookOpen } from "lucide-react";
import NoticeModal from "../../components/thongbao/NoticeModal";
import { getThongBao } from "../../api/thongbaoApi.js";
import { getLichThiByLop } from "../../api/lichthiApi.js";
import { getMonHoc } from "../../api/monhocApi.js";
import { getDiem } from "../../api/diemApi.js";
import { getStudentStatistics } from "../../api/diemdanhApi.js";
import { getNamHoc } from "../../api/namhocApi.js";
import { formatDate, getActiveAcademicYear, getVisibleAcademicYears } from "../../utils/helpers.js";
import useParentStudents from "../../hooks/useParentStudents.js";
import StudentSelector from "./StudentSelector.jsx";
import { webSocketService } from "../../utils/websocket.js";

const formatExamDate = (dateStr) => {
  if (!dateStr) return { fullDate: "--", dayOfWeek: "" };
  const parts = String(dateStr).split("T")[0].split("-");
  if (parts.length === 3) {
    const [y, m, d] = parts;
    const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
    const dayNames = ["Chủ Nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
    const dayOfWeek = dayNames[dateObj.getDay()];
    return {
      fullDate: `${d}/${m}/${y}`,
      shortDate: `${d}/${m}`,
      dayOfWeek: dayOfWeek
    };
  }
  return { fullDate: dateStr, shortDate: dateStr, dayOfWeek: "" };
};

const formatExamTime = (timeStr, duration) => {
  if (!timeStr) return "--";
  const cleanTime = String(timeStr).substring(0, 5);
  return duration ? `${cleanTime} (${duration} phút)` : cleanTime;
};

export default function HomePage() {
  const { students, currentStudent, selectStudent, loading: studentsLoading } = useParentStudents();
  const [selectedNotice, setSelectedNotice] = useState(null);
  const navigate = useNavigate();
  const [data, setData] = useState({
    notices: [],
    exams: [],
    subjects: [],
    scores: [],
    namHocs: [],
    attendanceStats: null,
  });
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    if (!currentStudent) return;
    let active = true;

    const fetchData = async () => {
      try {
        setDataLoading(true);
        const lopId = currentStudent?.lop?.id;
        const hocSinhId = currentStudent?.id;

        const now = new Date();
        const yearStart = now.getMonth() >= 8 ? `${now.getFullYear()}-09-01` : `${now.getFullYear() - 1}-09-01`;
        const today = now.toISOString().split("T")[0];

        const [
          noticesRes,
          subjectsRes,
          namHocsRes,
          examsRes,
          scoresRes,
          statsRes
        ] = await Promise.all([
          getThongBao().catch(() => ({ data: { data: [] } })),
          getMonHoc().catch(() => ({ data: { data: [] } })),
          getNamHoc().catch(() => ({ data: { data: [] } })),
          lopId ? getLichThiByLop(lopId).catch(() => ({ data: { data: [] } })) : Promise.resolve({ data: { data: [] } }),
          hocSinhId ? getDiem({ hocSinhId }).catch(() => ({ data: { data: [] } })) : Promise.resolve({ data: { data: [] } }),
          hocSinhId ? getStudentStatistics(hocSinhId, yearStart, today).catch(() => ({ data: { data: null } })) : Promise.resolve({ data: { data: null } })
        ]);

        if (!active) return;

        setData({
          notices: noticesRes?.data?.data || [],
          subjects: subjectsRes?.data?.data || [],
          namHocs: namHocsRes?.data?.data || [],
          exams: examsRes?.data?.data || [],
          scores: scoresRes?.data?.data || [],
          attendanceStats: statsRes?.data?.data || null,
        });
      } catch (error) {
        console.error("Lỗi tải dữ liệu trang chủ phụ huynh:", error);
      } finally {
        if (active) setDataLoading(false);
      }
    };

    fetchData();
    
    // Đăng ký nhận thông báo real-time
    webSocketService.connect(() => {
      webSocketService.subscribe('/topic/notifications', (newNotice) => {
        if ((newNotice.doiTuong === "PHU_HUYNH" || newNotice.doiTuong === "ALL") && 
            !newNotice.isReply && 
            newNotice.senderRole !== "PHU_HUYNH") {
          setData(prev => {
            if (prev.notices.find(n => n.id === newNotice.id)) return prev;
            return { ...prev, notices: [newNotice, ...prev.notices] };
          });
        }
      });
      
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user?.id) {
            webSocketService.subscribe(`/topic/user/${user.id}`, (newNotice) => {
              if (!newNotice.isReply) {
                setData(prev => {
                  if (prev.notices.find(n => n.id === newNotice.id)) return prev;
                  return { ...prev, notices: [newNotice, ...prev.notices] };
                });
              }
            });
          }
        } catch(e) {}
      }
    });

    return () => { 
      active = false; 
      webSocketService.unsubscribe('/topic/notifications');
    };
  }, [currentStudent]);

  const { upcomingExams, recentActivities, subjectsTodayCount } = useMemo(() => {
    const visibleYears = getVisibleAcademicYears(data.namHocs || []);
    const activeYearObj = getActiveAcademicYear(visibleYears) || visibleYears[0];
    const curNamHoc = activeYearObj?.tenNamHoc || "";

    // Lọc chỉ lấy các kỳ thi chính thức (GK - Giữa kỳ, CK - Cuối kỳ), loại bỏ bài kiểm tra 15p (TP15)
    const validExams = (data.exams || []).filter(ex => {
      const loai = (ex.loaiKiemTra || "").toUpperCase();
      if (loai === "TP15" || loai === "15P" || loai === "TX") return false;
      if (curNamHoc && ex.namHoc && ex.namHoc !== curNamHoc) return false;
      return true;
    });

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // Lọc các kỳ thi từ hôm nay trở đi
    const futureExams = validExams
      .filter(ex => {
        if (!ex.ngayThi) return false;
        const d = new Date(ex.ngayThi + "T00:00:00");
        return d >= now;
      })
      .sort((a, b) => {
        const da = new Date(a.ngayThi + "T" + (a.gioBatDau || "00:00:00"));
        const db = new Date(b.ngayThi + "T" + (b.gioBatDau || "00:00:00"));
        return da - db;
      });

    // Fallback: nếu hiện tại chưa tới đợt thi mới hoặc tất cả đã qua, hiển thị đợt thi gần nhất của học kỳ
    let upcomingExams = futureExams.slice(0, 4);
    if (upcomingExams.length === 0 && validExams.length > 0) {
      const sortedAll = [...validExams].sort((a, b) => {
        const da = new Date(a.ngayThi + "T" + (a.gioBatDau || "00:00:00"));
        const db = new Date(b.ngayThi + "T" + (b.gioBatDau || "00:00:00"));
        return db - da; // Mới nhất lên đầu
      });
      upcomingExams = sortedAll.slice(0, 4).reverse();
    }

    const activities = [];
    if (data.attendanceStats?.todayStatus) {
      activities.push({
        id: "att",
        time: new Date(),
        title: `Hôm nay ${data.attendanceStats.todayStatus.toLowerCase()}`,
        type: "attendance"
      });
    }
    
    (data.notices || []).slice(0, 3).forEach(n => {
      activities.push({
        id: `not_${n.id}`,
        time: new Date(n.createdAt || n.ngayTao),
        title: `Nhà trường gửi thông báo: ${n.tieuDe}`,
        type: "notice"
      });
    });

    (data.scores || []).slice(0, 3).forEach(s => {
      activities.push({
        id: `sco_${s.id}`,
        time: new Date(s.ngayTao || new Date()),
        title: `Điểm ${s.monHoc?.tenMon || "mới"} được cập nhật`,
        type: "score"
      });
    });

    activities.sort((a, b) => b.time - a.time);

    // Filter valid subjects for today count (not SHDC)
    const validSubjects = (data.subjects || []).filter(s => {
      const name = (s.tenMon || "").toLowerCase();
      return !name.includes("shdc") && !name.includes("sinh hoạt lớp");
    });
    // Just a placeholder calculation, realistically we'd need Timetable API. 
    // We'll just display a static number or base it on something if no timetable is loaded.
    const subjectsTodayCount = 5; // Placeholder since no Timetable API is called here

    return { upcomingExams, recentActivities: activities.slice(0, 5), subjectsTodayCount };
  }, [data]);

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center p-12 bg-white rounded-[16px] border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
      <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-4">
        <User size={40} className="text-slate-300" />
      </div>
      <h3 className="text-lg font-semibold text-slate-800 mb-1">Chưa chọn học sinh</h3>
      <p className="text-slate-500 text-center text-sm max-w-sm">
        Vui lòng chọn học sinh ở góc phải phía trên để bắt đầu theo dõi quá trình học tập.
      </p>
    </div>
  );

  if (studentsLoading) {
    return <div className="p-8 text-center text-slate-500">Đang tải dữ liệu...</div>;
  }

  const gvcn = currentStudent?.lop?.gvcn;

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-12 font-sans">
      {/* Banner */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-blue-900 tracking-tight">Trang chủ phụ huynh</h1>
          <p className="text-sm text-slate-500 mt-1">Theo dõi kết quả học tập và các thông báo của nhà trường.</p>
        </div>
        <div>
          <StudentSelector 
            students={students} 
            selectedStudent={currentStudent} 
            onSelect={selectStudent} 
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {!currentStudent ? (
          renderEmptyState()
        ) : (
          <>
            {/* 2. Thông tin học sinh - Ngang */}
            <div className="bg-white rounded-[16px] p-4 sm:p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col md:flex-row items-center gap-4 sm:gap-6">
              <img 
                src={currentStudent.anhDaiDien || "https://ui-avatars.com/api/?name=" + (currentStudent.hoTen || "HS") + "&background=random"} 
                alt="Avatar" 
                className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 aspect-square rounded-full object-cover border-2 border-slate-100"
              />
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-xl font-bold text-slate-900">{currentStudent.hoTen}</h2>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-2 mt-2 text-sm text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium">Lớp:</span> {currentStudent.lop?.tenLop || "--"}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium">Năm học:</span> {currentStudent.lop?.namHoc || "--"}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium">GVCN:</span> {gvcn?.hoTen || "--"}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium">Trạng thái:</span> 
                    <span className="text-emerald-600 font-semibold">{currentStudent.trangThai === 1 ? "Đang học" : "Tạm nghỉ"}</span>
                  </div>
                </div>
              </div>
              <Link 
                to="/parent/profile" 
                className="px-5 py-2.5 bg-blue-50 text-blue-700 font-semibold text-sm rounded-xl hover:bg-blue-100 transition-colors whitespace-nowrap"
              >
                Xem hồ sơ
              </Link>
            </div>

            {/* 3. Hai cột nội dung */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Cột trái (60%) */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                
                {/* Thông báo từ nhà trường */}
                <div className="bg-white rounded-[16px] p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-100">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Bell size={20} className="text-blue-500" />
                      Thông báo từ nhà trường
                    </h3>
                    <Link to="/parent/notices" className="text-sm font-medium text-blue-600 hover:text-blue-700">Xem tất cả</Link>
                  </div>
                  
                  {dataLoading ? (
                    <div className="text-sm text-slate-500">Đang tải...</div>
                  ) : data.notices.length === 0 ? (
                    <div className="text-sm text-slate-500 py-4 text-center">Không có thông báo mới.</div>
                  ) : (
                    <div className="space-y-4">
                      {data.notices.slice(0, 3).map((n) => (
                        <div key={n.id} onClick={() => setSelectedNotice(n)} className="flex gap-4 p-3 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-slate-100">
                          <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                          <div>
                            <h4 className="font-semibold text-slate-800 text-sm">{n.tieuDe}</h4>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{n.noiDung}</p>
                            <span className="text-[11px] text-slate-400 mt-2 block">{formatDate(n.createdAt || n.ngayDang)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Liên hệ giáo viên chủ nhiệm */}
                <div className="bg-white rounded-[16px] p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-100 flex-1 flex flex-col justify-between min-h-[300px]">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
                      <User size={20} className="text-emerald-500" />
                      Liên hệ giáo viên chủ nhiệm
                    </h3>
                    
                    {!gvcn ? (
                      <div className="text-sm text-slate-500 text-center py-8 bg-slate-50 rounded-xl border border-slate-100">
                        Chưa có thông tin giáo viên chủ nhiệm.
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50/80 border border-slate-100 rounded-xl mb-4">
                        <div>
                          <span className="font-bold text-slate-900 text-base">{gvcn.hoTen}</span>
                          <p className="text-xs font-medium text-slate-500 mt-0.5">Giáo viên chủ nhiệm lớp {currentStudent?.lop?.tenLop}</p>
                        </div>
                        <div className="space-y-1.5 text-sm text-slate-600">
                          <div className="flex items-center gap-2">
                            <Mail size={15} className="text-slate-400 flex-shrink-0" />
                            <span className="font-medium">{gvcn.email || "--"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone size={15} className="text-slate-400 flex-shrink-0" />
                            <span className="font-medium">{gvcn.sdt || "--"}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {gvcn && (
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <button 
                        onClick={() => navigate('/parent/thongbao')} 
                        className="flex-1 bg-emerald-50 hover:bg-emerald-100 active:scale-[0.99] text-emerald-700 text-sm font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        <MessageSquare size={16} /> Gửi tin nhắn
                      </button>
                      {gvcn.sdt && (
                        <a 
                          href={`tel:${gvcn.sdt}`}
                          className="flex-1 bg-blue-50 hover:bg-blue-100 active:scale-[0.99] text-blue-700 text-sm font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                          <Phone size={16} /> Gọi điện
                        </a>
                      )}
                    </div>
                  )}
                </div>

              </div>

              {/* Cột phải (40%) */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                
                {/* Thông tin nhanh */}
                <div className="bg-white rounded-[16px] p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-100">
                  <h3 className="text-lg font-bold text-slate-900 mb-5">Thông tin nhanh</h3>
                  <ul className="space-y-4">
                    <li className="flex justify-between items-center pb-4 border-b border-slate-100">
                      <span className="text-sm text-slate-500">Giáo viên chủ nhiệm</span>
                      <span className="text-sm font-semibold text-slate-800">{gvcn?.hoTen || "--"}</span>
                    </li>
                    <li className="flex justify-between items-center pb-4 border-b border-slate-100">
                      <span className="text-sm text-slate-500">Điểm danh hôm nay</span>
                      <span className={`text-sm font-semibold ${data.attendanceStats?.todayStatus === 'Có mặt' ? 'text-emerald-600' : 'text-slate-800'}`}>
                        {data.attendanceStats?.todayStatus || "Chưa cập nhật"}
                      </span>
                    </li>
                    <li className="flex justify-between items-center pb-4 border-b border-slate-100">
                      <span className="text-sm text-slate-500">Tiết học hôm nay</span>
                      <span className="text-sm font-semibold text-slate-800">{subjectsTodayCount} tiết</span>
                    </li>
                    <li className="flex justify-between items-center">
                      <span className="text-sm text-slate-500">Lần cập nhật gần nhất</span>
                      <span className="text-sm font-semibold text-slate-800">{new Date().toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}</span>
                    </li>
                  </ul>
                </div>

                {/* Lịch thi sắp tới */}
                <div className="bg-white rounded-[16px] p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-100 flex-1 flex flex-col min-h-[300px]">
                  <div className="flex items-center justify-between mb-4 flex-shrink-0">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Calendar size={20} className="text-purple-500" />
                      Lịch thi sắp tới
                    </h3>
                    <Link to="/parent/timetable?filter=exams" className="text-xs font-semibold text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-lg transition-colors">
                      Xem tất cả
                    </Link>
                  </div>
                  
                  {dataLoading ? (
                    <div className="text-sm text-slate-500 py-12 text-center flex-1 flex items-center justify-center">Đang tải lịch thi...</div>
                  ) : upcomingExams.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center text-slate-400 flex-1">
                      <BookOpen size={32} className="mb-2 opacity-50" />
                      <span className="text-sm font-medium">Chưa có lịch thi nào sắp tới</span>
                    </div>
                  ) : (
                    <div className="flex-1 min-h-0 overflow-y-auto pr-2 space-y-4 relative border-l-2 border-purple-100 ml-2.5">
                      {upcomingExams.map((exam, idx) => {
                        const { fullDate, dayOfWeek } = formatExamDate(exam.ngayThi);
                        const loaiKt = exam.loaiKiemTra === 'GK' ? 'Giữa kỳ' : exam.loaiKiemTra === 'CK' ? 'Cuối kỳ' : (exam.loaiKiemTra || '');
                        return (
                          <div key={exam.id || idx} className="relative pl-5">
                            <div className="absolute -left-[6.5px] top-1.5 w-2.5 h-2.5 rounded-full bg-purple-500 ring-4 ring-white shadow-sm"></div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold text-slate-900">{fullDate}</span>
                              {dayOfWeek && (
                                <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded bg-purple-50 text-purple-700">
                                  {dayOfWeek}
                                </span>
                              )}
                              {loaiKt && (
                                <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                  {loaiKt}
                                </span>
                              )}
                            </div>
                            <div className="bg-slate-50 hover:bg-purple-50/20 border border-slate-100 hover:border-purple-100 rounded-xl p-2.5 transition-all">
                              <div className="font-bold text-slate-800 text-sm">{exam.monHoc?.tenMon || "Bài thi"}</div>
                              <div className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                                <span>Phòng: <strong className="text-slate-800 font-semibold">{exam.phongThi || "--"}</strong></span>
                                <span>Giờ thi: <strong className="text-slate-800 font-semibold">{formatExamTime(exam.gioBatDau, exam.thoiGianLamBai)}</strong></span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* 4. Hoạt động gần đây */}
            <div className="bg-white rounded-[16px] p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 mb-5">Hoạt động gần đây</h3>
              
              {recentActivities.length === 0 ? (
                <div className="text-sm text-slate-500 text-center py-4">Chưa có hoạt động nào gần đây.</div>
              ) : (
                <div className="space-y-4">
                  {recentActivities.map((act) => (
                    <div key={act.id} className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <CheckCircle2 size={18} className="text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{act.title}</p>
                        <span className="text-xs text-slate-400">{act.time.toLocaleDateString("vi-VN")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </>
        )}
      </div>

      {selectedNotice && (
        <NoticeModal notice={selectedNotice} onClose={() => setSelectedNotice(null)} />
      )}
    </div>
  );
}

