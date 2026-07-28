import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  BookOpen, 
  Settings,
  BarChart3,
  School,
  User,
  UsersRound,
  UserCog,
  Book,
  Shapes,
  Component,
  PenTool,
  CheckCircle,
  CalendarDays,
  CalendarClock,
  ClipboardList,
  CalendarRange,
  BellRing,
  History,
  DatabaseBackup,
  Wrench,
  FileX
} from "lucide-react";

export const ADMIN_NAV = [
  {
    id: "dashboard",
    group: "Tổng quan",
    icon: LayoutDashboard,
    path: "/admin/dashboard"
  },
  {
    id: "people",
    group: "Quản lý nhân sự",
    icon: Users,
    children: [
      { path: "/admin/giaovien", label: "Giáo viên", icon: School },
      { path: "/admin/hocsinh", label: "Học sinh", icon: User },
      { path: "/admin/phuhuynh", label: "Phụ huynh", icon: UsersRound },
      { path: "/admin/users", label: "Tài khoản", icon: UserCog }
    ]
  },
  {
    id: "education",
    group: "Quản lý học tập",
    icon: GraduationCap,
    children: [
      { path: "/admin/monhoc", label: "Môn học", icon: Book },
      { path: "/admin/tohopmon", label: "Tổ hợp môn", icon: Shapes },
      { path: "/admin/lop", label: "Lớp học", icon: Component },
      { path: "/admin/diem", label: "Nhập điểm", icon: PenTool },
      { path: "/admin/hanhkiem", label: "Duyệt hạnh kiểm", icon: CheckCircle }
    ]
  },
  {
    id: "schedule",
    group: "Thời khóa biểu & Lịch",
    icon: BookOpen,
    children: [
      { path: "/admin/thoikhoabieu", label: "Thời khóa biểu", icon: CalendarDays },
      { path: "/admin/nghi-day", label: "Nghỉ dạy & Dạy thay", icon: FileX },
      { path: "/admin/lichthi", label: "Lịch thi", icon: CalendarClock },
      { path: "/admin/phancong", label: "Phân công", icon: ClipboardList },
      { path: "/admin/namhoc-hocky", label: "Năm học - Học kỳ", icon: CalendarRange }
    ]
  },
  {
    id: "settings",
    group: "Hệ thống",
    icon: Settings,
    children: [
      { path: "/admin/report", label: "Báo cáo - Thống kê", icon: BarChart3 },
      { path: "/admin/thongbao", label: "Thông báo", icon: BellRing },
      { path: "/admin/settings", label: "Cài đặt", icon: Settings }
    ]
  }
];
