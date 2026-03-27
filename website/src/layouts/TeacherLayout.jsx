import { Outlet } from "react-router-dom";
import Sidebar from "../components/common/Sidebar.jsx";
import Footer from "../components/common/Footer.jsx";

const links = [
  { path: "/teacher/dashboard", label: "Dashboard" },
  { path: "/teacher/diem/nhap", label: "Nhập điểm" },
  { path: "/teacher/diemdanh", label: "Điểm danh" },
  { path: "/teacher/hanhkiem", label: "Hạnh kiểm" },
  { path: "/teacher/lopchunhiem", label: "Lớp chủ nhiệm" }
];

export default function TeacherLayout() {
  return (
    <div className="layout">
      <Sidebar title="Giáo viên" links={links} />
      <main className="content">
        <Outlet />
        <Footer />
      </main>
    </div>
  );
}