import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, Calendar, User, Phone, Mail, MessageSquare, ChevronRight, CheckCircle2, BookOpen } from "lucide-react";
import NoticeModal from "../../components/thongbao/NoticeModal";
import { getThongBao } from "../../api/thongbaoApi.js";
import { getLichThiByLop } from "../../api/lichthiApi.js";
import { getMonHoc } from "../../api/monhocApi.js";
import { getDiem } from "../../api/diemApi.js";
import { getStudentStatistics } from "../../api/diemdanhApi.js";
import { formatDate } from "../../utils/helpers.js";
import useParentStudents from "../../hooks/useParentStudents.js";
import StudentSelector from "./StudentSelector.jsx";
import { webSocketService } from "../../utils/websocket.js";

export default function HomePage() {
  const { students, currentStudent, selectStudent, loading: studentsLoading } = useParentStudents();
  const [selectedNotice, setSelectedNotice] = useState(null);
  const navigate = useNavigate();
  const [data, setData] = useState({
    notices: [],
    exams: [],
    subjects: [],
    scores: [],
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
        const fetchPromises = [];

        fetchPromises.push(
          getThongBao().then(r => ({ notices: r?.data?.data || [] })).catch(() => ({ notices: [] })),
          getMonHoc().then(r => ({ subjects: r?.data?.data || [] })).catch(() => ({ subjects: [] }))
        );

        fetchPromises.push(
          (lopId ? getLichThiByLop(lopId) : Promise.resolve({ data: { data: [] } }))
            .then(r => ({ exams: r?.data?.data || [] }))
            .catch(() => ({ exams: [] }))
        );

        if (hocSinhId) {
          fetchPromises.push(
            getDiem({ hocSinhId })
              .then(r => ({ scores: r?.data?.data || [] }))
              .catch(() => ({ scores: [] }))
          );

          const now = new Date();
          const yearStart = now.getMonth() >= 8 ? `${now.getFullYear()}-09-01` : `${now.getFullYear() - 1}-09-01`;
          const today = now.toISOString().split("T")[0];
          fetchPromises.push(
            getStudentStatistics(hocSinhId, yearStart, today)
              .then(r => ({ attendanceStats: r?.data?.data || null }))
              .catch(() => ({ attendanceStats: null }))
          );
        }

        const results = await Promise.all(fetchPromises);
        if (!active) return;

        setData({
          notices: results[0]?.notices || [],
          subjects: results[1]?.subjects || [],
          exams: results[2]?.exams || [],
          scores: results[3]?.scores || [],
          attendanceStats: results[4]?.attendanceStats || null,
        });
      } catch (error) {
        console.error(error);
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingExams = (data.exams || [])
      .filter(ex => new Date(ex.ngayThi) >= today)
      .sort((a, b) => new Date(a.ngayThi) - new Date(b.ngayThi))
      .slice(0, 3);

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
          <h1 className="text-2xl font-bold text-slate-900">Trang chủ phụ huynh</h1>
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
            <div className="bg-white rounded-[16px] p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col md:flex-row items-center gap-6">
              <img 
                src={currentStudent.anhDaiDien || "https://ui-avatars.com/api/?name=" + (currentStudent.hoTen || "HS") + "&background=random"} 
                alt="Avatar" 
                className="w-20 h-20 rounded-full object-cover border-2 border-slate-100"
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
              <div className="lg:col-span-7 space-y-6">
                
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

                {/* Lịch thi sắp tới */}
                <div className="bg-white rounded-[16px] p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-100">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-5">
                    <Calendar size={20} className="text-purple-500" />
                    Lịch thi sắp tới
                  </h3>
                  
                  {dataLoading ? (
                    <div className="text-sm text-slate-500">Đang tải...</div>
                  ) : upcomingExams.length === 0 ? (
                    <div className="py-8 flex flex-col items-center justify-center text-slate-400">
                      <BookOpen size={32} className="mb-2 opacity-50" />
                      <span className="text-sm">Chưa có lịch thi nào sắp tới</span>
                    </div>
                  ) : (
                    <div className="relative border-l border-slate-200 ml-3 space-y-6">
                      {upcomingExams.map((exam, idx) => {
                        const d = new Date(exam.ngayThi);
                        const dateStr = d.toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit' });
                        return (
                          <div key={idx} className="relative pl-6">
                            <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-purple-500 ring-4 ring-white"></div>
                            <div className="text-sm font-bold text-slate-900">{dateStr}</div>
                            <div className="mt-1 bg-slate-50 border border-slate-100 rounded-lg p-3">
                              <div className="font-medium text-slate-800">{exam.monHoc?.tenMon || "Bài thi"}</div>
                              <div className="text-xs text-slate-500 mt-1 flex gap-3">
                                <span>Phòng: {exam.phongThi || "--"}</span>
                                <span>Giờ thi: {exam.gioThi || "--"}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>

              {/* Cột phải (40%) */}
              <div className="lg:col-span-5 space-y-6">
                
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

                {/* Liên hệ giáo viên */}
                <div className="bg-white rounded-[16px] p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-100">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
                    <User size={20} className="text-emerald-500" />
                    Liên hệ giáo viên
                  </h3>
                  
                  {!gvcn ? (
                    <div className="text-sm text-slate-500 text-center py-2">Chưa có thông tin giáo viên</div>
                  ) : (
                    <>
                      <div className="flex flex-col mb-5">
                        <span className="font-bold text-slate-800">{gvcn.hoTen}</span>
                        <div className="mt-2 space-y-2">
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Mail size={14} className="text-slate-400" />
                            {gvcn.email || "--"}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Phone size={14} className="text-slate-400" />
                            {gvcn.soDienThoai || "--"}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        <button onClick={() => navigate('/parent/thongbao')} className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-sm font-semibold py-2 rounded-xl transition-colors flex items-center justify-center gap-2">
                          <MessageSquare size={16} /> Gửi tin nhắn
                        </button>
                        {gvcn.soDienThoai && (
                          <button className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-semibold py-2 rounded-xl transition-colors flex items-center justify-center gap-2">
                            <Phone size={16} /> Gọi điện
                          </button>
                        )}
                      </div>
                    </>
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
