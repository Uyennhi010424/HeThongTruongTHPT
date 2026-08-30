export const STUDENT_NAV = [
  { path: "/student/home", label: "Trang chủ", icon: "home" },
  {
    group: "Học tập",
    children: [
      { path: "/student/score", label: "Xem điểm", icon: "bar_chart" },
      { path: "/student/timetable", label: "Thời khóa biểu", icon: "calendar_month" },
      { path: "/student/lichthi", label: "Lịch thi", icon: "event" },
      { path: "/student/baikiemtra", label: "Bài kiểm tra", icon: "quiz" },
      { path: "/student/hocba", label: "Học bạ", icon: "menu_book" }
    ]
  }
];
