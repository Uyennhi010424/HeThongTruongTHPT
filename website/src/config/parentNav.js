export const PARENT_NAV = [
  { path: "/parent/home", label: "Trang chủ", icon: "home" },
  {
    group: "Theo dõi con",
    children: [
      { path: "/parent/score", label: "Theo dõi điểm", icon: "bar_chart" },
      { path: "/parent/timetable", label: "Thời khóa biểu", icon: "calendar_month" },
      { path: "/parent/diemdanh", label: "Điểm danh", icon: "fact_check" },
      { path: "/parent/thongbao", label: "Thông báo", icon: "notifications" },
      { path: "/parent/profile", label: "Hồ sơ", icon: "person" }
    ]
  }
];
