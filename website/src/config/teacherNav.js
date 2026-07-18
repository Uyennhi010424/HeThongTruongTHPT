export const TEACHER_NAV = [
  { path: "/teacher/dashboard", label: "Trang chủ", icon: "dashboard" },
  {
    group: "Giảng dạy",
    children: [
      { path: "/teacher/diem/nhap", label: "Nhập điểm", icon: "edit_note" },
      { path: "/teacher/diem/bangdiem", label: "Bảng điểm", icon: "assessment" },
      { path: "/teacher/dangky-lop", label: "Đăng ký lịch dạy", icon: "edit_calendar" },
      { path: "/teacher/diemdanh", label: "Điểm danh", icon: "how_to_reg" },
      { path: "/teacher/hanhkiem", label: "Hạnh kiểm", icon: "verified" },
      { path: "/teacher/lichthi", label: "Lịch thi", icon: "event" },
      { path: "/teacher/xin-nghi", label: "Xin nghỉ dạy", icon: "person_off" }
    ]
  },
  {
    group: "Chủ nhiệm",
    children: [
      { path: "/teacher/lopchunhiem", label: "Lớp chủ nhiệm", icon: "groups" }
    ]
  },
  {
    group: "Khác",
    children: [
      { path: "/teacher/thongbao", label: "Thông báo", icon: "notifications" },
      { path: "/teacher/report", label: "Thống kê", icon: "analytics" }
    ]
  }
];
