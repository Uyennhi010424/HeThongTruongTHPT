import { Outlet } from "react-router-dom";
import Sidebar from "../components/common/Sidebar.jsx";
import Footer from "../components/common/Footer.jsx";

const links = [
  { path: "/student/home", label: "Trang chủ" },
  { path: "/student/timetable", label: "Thời khóa biểu" },
  { path: "/student/score", label: "Bảng điểm" },
  { path: "/student/conduct", label: "Hạnh kiểm" },
  { path: "/student/profile", label: "Hồ sơ" }
];

export default function StudentLayout() {
  return (
    <div className="layout">
      <Sidebar title="Học sinh" links={links} />
      <main className="content">
        <Outlet />
        <Footer />
      </main>
    </div>
  );
}