export const STUDENT_NAV = [
  { path: "/student/home", label: "Trang chủ", icon: "home" },
  {
    group: "Học tập",
    children: [
      { path: "/student/score", label: "Xem điểm", icon: "bar_chart" },
      { path: "/student/timetable", label: "Thời khóa biểu", icon: "calendar_month" },
      { path: "/student/lichthi", label: "Lịch thi", icon: "event" },
      { path: "/student/hocba", label: "Học bạ", icon: "menu_book" }
    ]
  },
  {
    group: "Cá nhân",
    children: [
      { path: "/student/diemdanh", label: "Điểm danh", icon: "fact_check" },
      { path: "/student/conduct", label: "Hạnh kiểm", icon: "verified" },
      { path: "/student/khen-thuong", label: "Khen thưởng", icon: "emoji_events" }
    ]
  }
];
