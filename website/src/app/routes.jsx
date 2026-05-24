import { Navigate } from "react-router-dom";
import LoginPage from "../features/auth/LoginPage.jsx";
import AdminLayout from "../layouts/AdminLayout.jsx";
import TeacherLayout from "../layouts/TeacherLayout.jsx";
import StudentLayout from "../layouts/StudentLayout.jsx";
import ParentLayout from "../layouts/ParentLayout.jsx";
import PrivateRoute from "../components/common/PrivateRoute.jsx";

import AdminDashboard from "../features/admin/dashboard/AdminDashboard.jsx";
import UserList from "../features/admin/users/UserList.jsx";
import HocSinhList from "../features/admin/hocsinh/HocSinhList.jsx";
import GiaoVienList from "../features/admin/giaovien/GiaoVienList.jsx";
import LopList from "../features/admin/lop/LopList.jsx";
import MonHocList from "../features/admin/monhoc/MonHocList.jsx";
import NamHocHocKyPage from "../features/admin/namhoc-hocky/NamHocHocKyPage.jsx";
import ThongBaoManager from "../features/admin/thongbao/ThongBaoManager.jsx";
import ReportPage from "../features/admin/report/ReportPage.jsx";
import AdminConfigPage from "../features/admin/config/AdminConfigPage.jsx";
import PhanCongPage from "../features/admin/phancong/PhanCongPage.jsx";
import LichThiAdminPage from "../features/admin/lichthi/LichThiAdminPage.jsx";
import AuditLogPage from "../features/admin/audit/AuditLogPage.jsx";
import AdminThoiKhoaBieuPage from "../features/admin/thoikhoabieu/AdminThoiKhoaBieuPage.jsx";
import AdminNhapDiemPage from "../features/admin/diem/AdminNhapDiemPage.jsx";

import TeacherDashboard from "../features/teacher/dashboard/TeacherDashboard.jsx";
import NhapDiem from "../features/teacher/diem/NhapDiem.jsx";
import DiemDanhPage from "../features/teacher/diemdanh/DiemDanhPage.jsx";
import HanhKiemPage from "../features/teacher/hanhkiem/HanhKiemPage.jsx";
import LopChuNhiem from "../features/teacher/lopchunhiem/LopChuNhiem.jsx";

import StudentHome from "../features/student/HomePage.jsx";
import TimetablePage from "../features/student/TimetablePage.jsx";
import ScorePage from "../features/student/ScorePage.jsx";
import ConductPage from "../features/student/ConductPage.jsx";
import ProfilePage from "../features/student/ProfilePage.jsx";

import ParentHome from "../features/parent/HomePage.jsx";
import ScoreFollow from "../features/parent/ScoreFollow.jsx";
import TimetableFollow from "../features/parent/TimetableFollow.jsx";

const NotFound = () => (
  <div className="p-6">
    <h2 className="text-headline-md font-bold text-primary">Không tìm thấy trang</h2>
  </div>
);

const routes = [
  { path: "/", element: <LoginPage title="Đăng nhập quản trị" expectedRole="ADMIN" /> },
  { path: "/login", element: <LoginPage title="Đăng nhập quản trị" expectedRole="ADMIN" /> },
  {
    path: "/login/admin",
    element: <LoginPage title="Đăng nhập quản trị" expectedRole="ADMIN" />
  },
  {
    path: "/login/teacher",
    element: <LoginPage title="Đăng nhập giáo viên" expectedRole="GIAO_VIEN" />
  },
  {
    path: "/login/student",
    element: <LoginPage title="Đăng nhập học sinh" expectedRole="HOC_SINH" />
  },
  {
    path: "/login/parent",
    element: <LoginPage title="Đăng nhập phụ huynh" expectedRole="PHU_HUYNH" />
  },
  {
    path: "/admin",
    element: (
      <PrivateRoute roles={["ADMIN"]}>
        <AdminLayout />
      </PrivateRoute>
    ),
    children: [
      { path: "dashboard", element: <AdminDashboard /> },
      { path: "namhoc-hocky", element: <NamHocHocKyPage /> },
      { path: "namhoc", element: <Navigate to="/admin/namhoc-hocky" replace /> },
      { path: "hocky", element: <Navigate to="/admin/namhoc-hocky" replace /> },
      { path: "lop", element: <LopList /> },
      { path: "hocsinh", element: <HocSinhList /> },
      { path: "giaovien", element: <GiaoVienList /> },
      { path: "monhoc", element: <MonHocList /> },
      { path: "phancong", element: <PhanCongPage /> },
      { path: "diem", element: <AdminNhapDiemPage /> },
      { path: "thoikhoabieu", element: <AdminThoiKhoaBieuPage /> },
      { path: "lichthi", element: <LichThiAdminPage /> },
      { path: "users", element: <UserList /> },
      { path: "config", element: <AdminConfigPage /> },
      { path: "report", element: <ReportPage /> },
      { path: "audit", element: <AuditLogPage /> },
      { path: "thongbao", element: <ThongBaoManager /> }
    ]
  },
  {
    path: "/teacher",
    element: (
      <PrivateRoute roles={["GIAOVIEN"]}>
        <TeacherLayout />
      </PrivateRoute>
    ),
    children: [
      { path: "dashboard", element: <TeacherDashboard /> },
      { path: "diem/nhap", element: <NhapDiem /> },
      { path: "diemdanh", element: <DiemDanhPage /> },
      { path: "hanhkiem", element: <HanhKiemPage /> },
      { path: "lopchunhiem", element: <LopChuNhiem /> }
    ]
  },
  {
    path: "/student",
    element: (
      <PrivateRoute roles={["HOCSINH"]}>
        <StudentLayout />
      </PrivateRoute>
    ),
    children: [
      { path: "home", element: <StudentHome /> },
      { path: "timetable", element: <TimetablePage /> },
      { path: "score", element: <ScorePage /> },
      { path: "conduct", element: <ConductPage /> },
      { path: "profile", element: <ProfilePage /> }
    ]
  },
  {
    path: "/parent",
    element: (
      <PrivateRoute roles={["PHUHUYNH"]}>
        <ParentLayout />
      </PrivateRoute>
    ),
    children: [
      { path: "home", element: <ParentHome /> },
      { path: "score", element: <ScoreFollow /> },
      { path: "timetable", element: <TimetableFollow /> }
    ]
  },
  { path: "*", element: <NotFound /> }
];

export default routes;
