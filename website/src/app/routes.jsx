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
import NamHocList from "../features/admin/namhoc-hocky/NamHocList.jsx";
import HocKyList from "../features/admin/namhoc-hocky/HocKyList.jsx";
import ThongBaoManager from "../features/admin/thongbao/ThongBaoManager.jsx";
import ReportPage from "../features/admin/report/ReportPage.jsx";

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
  <div style={{ padding: 24 }}>
    <h2>Không tìm thấy trang</h2>
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
    element: <LoginPage title="Đăng nhập giáo viên" expectedRole="GIAOVIEN" />
  },
  {
    path: "/login/student",
    element: <LoginPage title="Đăng nhập học sinh" expectedRole="HOCSINH" />
  },
  {
    path: "/login/parent",
    element: <LoginPage title="Đăng nhập phụ huynh" expectedRole="PHUHUYNH" />
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
      { path: "users", element: <UserList /> },
      { path: "hocsinh", element: <HocSinhList /> },
      { path: "giaovien", element: <GiaoVienList /> },
      { path: "lop", element: <LopList /> },
      { path: "monhoc", element: <MonHocList /> },
      { path: "namhoc", element: <NamHocList /> },
      { path: "hocky", element: <HocKyList /> },
      { path: "thongbao", element: <ThongBaoManager /> },
      { path: "report", element: <ReportPage /> }
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