import { Outlet } from "react-router-dom";
import Sidebar from "../components/common/Sidebar.jsx";
import Footer from "../components/common/Footer.jsx";

const links = [
  { path: "/admin/dashboard", label: "Dashboard" },
  { path: "/admin/users", label: "Tài khoản" },
  { path: "/admin/hocsinh", label: "Học sinh" },
  { path: "/admin/giaovien", label: "Giáo viên" },
  { path: "/admin/lop", label: "Lớp" },
  { path: "/admin/monhoc", label: "Môn học" },
  { path: "/admin/namhoc", label: "Năm học" },
  { path: "/admin/hocky", label: "Học kỳ" },
  { path: "/admin/thongbao", label: "Thông báo" },
  { path: "/admin/report", label: "Báo cáo" }
];

export default function AdminLayout() {
  return (
    <div className="layout">
      <Sidebar title="Quản trị" links={links} />
      <main className="content">
        <Outlet />
        <Footer />
      </main>
    </div>
  );
}