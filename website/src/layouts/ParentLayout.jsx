import { Outlet } from "react-router-dom";
import Sidebar from "../components/common/Sidebar.jsx";
import Footer from "../components/common/Footer.jsx";

const links = [
  { path: "/parent/home", label: "Trang chủ" },
  { path: "/parent/score", label: "Theo dõi điểm" },
  { path: "/parent/timetable", label: "Thời khóa biểu" }
];

export default function ParentLayout() {
  return (
    <div className="layout">
      <Sidebar title="Phụ huynh" links={links} />
      <main className="content">
        <Outlet />
        <Footer />
      </main>
    </div>
  );
}