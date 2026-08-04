import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  Settings,
  PenTool,
  BarChart2,
  CalendarPlus,
  ClipboardCheck,
  CheckCircle,
  CalendarDays,
  UserMinus,
  UsersRound,
  BellRing,
  BarChart3
} from "lucide-react";

export const TEACHER_NAV = [
  { id: "dashboard", group: "Trang chủ", icon: LayoutDashboard, path: "/teacher/dashboard" },
  {
    id: "teaching",
    group: "Giảng dạy",
    icon: BookOpen,
    children: [
      { path: "/teacher/diem/nhap", label: "Nhập điểm", icon: PenTool },
      { path: "/teacher/dangky-lop", label: "Đăng ký lịch dạy", icon: CalendarPlus },
      { path: "/teacher/diemdanh", label: "Điểm danh", icon: ClipboardCheck },
      { path: "/teacher/baikiemtra", label: "Bài kiểm tra", icon: BookOpen },
      { path: "/teacher/lichthi", label: "Lịch thi", icon: CalendarDays },
      { path: "/teacher/xin-nghi", label: "Xin nghỉ dạy", icon: UserMinus }
    ]
  },
  {
    id: "homeroom",
    group: "Chủ nhiệm",
    icon: Users,
    children: [
      { path: "/teacher/lopchunhiem", label: "Lớp chủ nhiệm", icon: UsersRound },
      { path: "/teacher/diem/bangdiem", label: "Bảng điểm", icon: BarChart2 },
      { path: "/teacher/hanhkiem", label: "Hạnh kiểm", icon: CheckCircle },
      { path: "/teacher/duyet-nghi", label: "Duyệt xin nghỉ", icon: ClipboardCheck }
    ]
  },
  { id: "thongbao", group: "Thông báo", icon: BellRing, path: "/teacher/thongbao" }
];
