export const ADMIN_NAV = [
  { path: "/admin/dashboard", label: "Tổng quan", icon: "dashboard" },
  {
    group: "Quản lý nhân sự",
    children: [
      { path: "/admin/giaovien", label: "Giáo viên", icon: "school" },
      { path: "/admin/hocsinh", label: "Học sinh", icon: "person" },
      { path: "/admin/phuhuynh", label: "Phụ huynh", icon: "family_restroom" }
    ]
  },
  {
    group: "Quản lý học tập",
    children: [
      { path: "/admin/lop", label: "Lớp học", icon: "groups" },
      { path: "/admin/tohopmon", label: "Tổ hợp môn", icon: "category" },
      { path: "/admin/monhoc", label: "Môn học", icon: "book" },
      { path: "/admin/namhoc-hocky", label: "Năm học - Học kỳ", icon: "calendar_today" }
    ]
  },
  {
    group: "Quản lý giảng dạy",
    children: [
      { path: "/admin/phancong", label: "Phân công Giảng dạy", icon: "assignment_ind" },
      { path: "/admin/diem", label: "Nhập điểm", icon: "grade" },
      { path: "/admin/hanhkiem", label: "Duyệt hạnh kiểm", icon: "verified" },
      { path: "/admin/thoikhoabieu", label: "Thời khóa biểu", icon: "schedule" },
      { path: "/admin/lichthi", label: "Lịch thi", icon: "event" }
    ]
  },
  {
    group: "Hệ thống",
    children: [
      { path: "/admin/thongbao", label: "Thông báo", icon: "notifications" },
      { path: "/admin/report", label: "Báo cáo - Thống kê", icon: "analytics" },
      { path: "/admin/audit", label: "Audit Log", icon: "history" },
      { path: "/admin/users", label: "Tài khoản", icon: "manage_accounts" },
      { path: "/admin/config", label: "Cấu hình", icon: "settings_suggest" },
      { path: "/admin/backup", label: "Backup dữ liệu", icon: "backup" }
    ]
  }
];
