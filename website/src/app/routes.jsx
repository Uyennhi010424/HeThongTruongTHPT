import { lazy, Suspense, Component } from "react";
import { Navigate } from "react-router-dom";
import LoginPage from "../features/auth/LoginPage.jsx";
import ResetPasswordPage from "../features/auth/ResetPasswordPage.jsx";
import PrivateRoute from "../components/common/PrivateRoute.jsx";

// Lazy-load layouts to reduce initial bundle size
const AdminLayout = lazy(() => import("../layouts/AdminLayout.jsx"));
const TeacherLayout = lazy(() => import("../layouts/TeacherLayout.jsx"));
const StudentLayout = lazy(() => import("../layouts/StudentLayout.jsx"));
const ParentLayout = lazy(() => import("../layouts/ParentLayout.jsx"));

// ─── Lazy-loaded page components (code splitting) ───

// Admin pages
const AdminDashboard = lazy(() => import("../features/admin/dashboard/AdminDashboard.jsx"));
const UserList = lazy(() => import("../features/admin/users/UserList.jsx"));
const HocSinhList = lazy(() => import("../features/admin/hocsinh/HocSinhList.jsx"));
const GiaoVienList = lazy(() => import("../features/admin/giaovien/GiaoVienList.jsx"));
const LopList = lazy(() => import("../features/admin/lop/LopList.jsx"));
const MonHocList = lazy(() => import("../features/admin/monhoc/MonHocList.jsx"));
const NamHocHocKyPage = lazy(() => import("../features/admin/namhoc-hocky/NamHocHocKyPage.jsx"));
const ThongBaoManager = lazy(() => import("../features/admin/thongbao/ThongBaoManager.jsx"));
const ReportPage = lazy(() => import("../features/admin/report/ReportPage.jsx"));
const SettingsPage = lazy(() => import("../features/admin/settings/SettingsPage.jsx"));
const PhanCongPage = lazy(() => import("../features/admin/phancong/PhanCongPage.jsx"));
const LichThiAdminPage = lazy(() => import("../features/admin/lichthi/LichThiAdminPage.jsx"));
const AdminThoiKhoaBieuPage = lazy(() => import("../features/admin/thoikhoabieu/AdminThoiKhoaBieuPage.jsx"));
const AdminNghiDayPage = lazy(() => import("../features/admin/nghiday/AdminNghiDayPage.jsx"));
const AdminNhapDiemPage = lazy(() => import("../features/admin/diem/AdminNhapDiemPage.jsx"));
const AdminProfile = lazy(() => import("../features/admin/profile/AdminProfile.jsx"));
const BackupPage = lazy(() => import("../features/admin/backup/BackupPage.jsx"));
const PhuHuynhList = lazy(() => import("../features/admin/phuhuynh/PhuHuynhList.jsx"));
const ToHopMonList = lazy(() => import("../features/admin/tohopmon/ToHopMonList.jsx"));
const AdminHanhKiemPage = lazy(() => import("../features/admin/hanhkiem/AdminHanhKiemPage.jsx"));

// Shared account pages
const ChangePassword = lazy(() => import("../features/account/ChangePassword.jsx"));

// Teacher pages
const TeacherProfile = lazy(() => import("../features/teacher/TeacherProfile.jsx"));
const TeacherDashboard = lazy(() => import("../features/teacher/dashboard/TeacherDashboard.jsx"));
const NhapDiem = lazy(() => import("../features/teacher/diem/NhapDiem.jsx"));
const TeacherBangDiem = lazy(() => import("../features/teacher/diem/TeacherBangDiem.jsx"));
const TeacherThongBao = lazy(() => import("../features/teacher/thongbao/TeacherThongBao.jsx"));
const TeacherLichThi = lazy(() => import("../features/teacher/lichthi/TeacherLichThi.jsx"));
const DiemDanhPage = lazy(() => import("../features/teacher/diemdanh/DiemDanhPage.jsx"));
const HanhKiemPage = lazy(() => import("../features/teacher/hanhkiem/HanhKiemPage.jsx"));
const LopChuNhiem = lazy(() => import("../features/teacher/lopchunhiem/LopChuNhiem.jsx"));
const TeacherRegisterPhanCong = lazy(() => import("../features/teacher/thoikhoabieu/TeacherRegisterPhanCong.jsx"));
const TeacherLeaveRequestPage = lazy(() => import("../features/teacher/TeacherLeaveRequestPage.jsx"));

// Student pages
const StudentHome = lazy(() => import("../features/student/HomePage.jsx"));
const TimetablePage = lazy(() => import("../features/student/TimetablePage.jsx"));
const ScorePage = lazy(() => import("../features/student/ScorePage.jsx"));
const ConductPage = lazy(() => import("../features/student/ConductPage.jsx"));
const ProfilePage = lazy(() => import("../features/student/ProfilePage.jsx"));
const HocBaPage = lazy(() => import("../features/student/HocBaPage.jsx"));
const StudentDiemDanhPage = lazy(() => import("../features/student/DiemDanhPage.jsx"));
const KhenThuongPage = lazy(() => import("../features/student/KhenThuongPage.jsx"));
const StudentThongBao = lazy(() => import("../features/student/StudentThongBao.jsx"));
const StudentLichThi = lazy(() => import("../features/student/StudentLichThi.jsx"));

// Parent pages
const ParentHome = lazy(() => import("../features/parent/HomePage.jsx"));
const ScoreFollow = lazy(() => import("../features/parent/ScoreFollow.jsx"));
const TimetableFollow = lazy(() => import("../features/parent/TimetableFollow.jsx"));
const ParentProfile = lazy(() => import("../features/parent/ParentProfile.jsx"));
const ParentDiemDanh = lazy(() => import("../features/parent/ParentDiemDanh.jsx"));
const ParentThongBao = lazy(() => import("../features/parent/ParentThongBao.jsx"));
const ParentXinNghi = lazy(() => import("../features/parent/ParentXinNghi.jsx"));

// ─── Loading fallback ───
const PageLoader = () => (
  <div className="flex h-64 items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

// ─── Error boundary for chunk loading failures ───
class ChunkErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-64 flex-col items-center justify-center gap-4">
          <p className="text-body-lg text-error">Không thể tải trang. Vui lòng thử lại.</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-primary px-4 py-2 text-on-primary"
          >
            Tải lại
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const withSuspense = (Component) => (
  <ChunkErrorBoundary>
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  </ChunkErrorBoundary>
);

const NotFound = () => (
  <div className="p-6">
    <h2 className="text-headline-md font-bold text-primary">Không tìm thấy trang</h2>
  </div>
);

const routes = [
  { path: "/", element: <LoginPage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/reset-password", element: <ResetPasswordPage /> },
  {
    path: "/admin",
    element: (
      <PrivateRoute roles={["ADMIN"]}>
        <ChunkErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <AdminLayout />
          </Suspense>
        </ChunkErrorBoundary>
      </PrivateRoute>
    ),
    children: [
      { path: "dashboard", element: withSuspense(AdminDashboard) },
      { path: "profile", element: withSuspense(AdminProfile) },
      { path: "profile/change-password", element: withSuspense(ChangePassword) },
      { path: "namhoc-hocky", element: withSuspense(NamHocHocKyPage) },
      { path: "namhoc", element: <Navigate to="/admin/namhoc-hocky" replace /> },
      { path: "hocky", element: <Navigate to="/admin/namhoc-hocky" replace /> },
      { path: "lop", element: withSuspense(LopList) },
      { path: "hocsinh", element: withSuspense(HocSinhList) },
      { path: "phuhuynh", element: withSuspense(PhuHuynhList) },
      { path: "giaovien", element: withSuspense(GiaoVienList) },
      { path: "monhoc", element: withSuspense(MonHocList) },
      { path: "tohopmon", element: withSuspense(ToHopMonList) },
      { path: "phancong", element: withSuspense(PhanCongPage) },
      { path: "diem", element: withSuspense(AdminNhapDiemPage) },
      { path: "diem/lop/:lopId", element: withSuspense(lazy(() => import("../features/admin/diem/AdminBangDiemLop.jsx"))) },
      { path: "hanhkiem", element: withSuspense(AdminHanhKiemPage) },
      { path: "thoikhoabieu", element: withSuspense(AdminThoiKhoaBieuPage) },
      { path: "nghi-day", element: withSuspense(AdminNghiDayPage) },
      { path: "lichthi", element: withSuspense(LichThiAdminPage) },
      { path: "users", element: withSuspense(UserList) },
      { path: "settings", element: withSuspense(SettingsPage) },
      { path: "report", element: withSuspense(ReportPage) },
      { path: "thongbao", element: withSuspense(ThongBaoManager) }
    ]
  },
  {
    path: "/teacher",
    element: (
      <PrivateRoute roles={["GIAOVIEN"]}>
        <ChunkErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <TeacherLayout />
          </Suspense>
        </ChunkErrorBoundary>
      </PrivateRoute>
    ),
    children: [
      { path: "dashboard", element: withSuspense(TeacherDashboard) },
      { path: "profile", element: withSuspense(TeacherProfile) },
      { path: "profile/change-password", element: withSuspense(ChangePassword) },
      { path: "diem/nhap", element: withSuspense(NhapDiem) },
      { path: "diem/bangdiem", element: withSuspense(TeacherBangDiem) },
      { path: "thongbao", element: withSuspense(TeacherThongBao) },
      { path: "lichthi", element: withSuspense(TeacherLichThi) },
      { path: "diemdanh", element: withSuspense(DiemDanhPage) },
      { path: "hanhkiem", element: withSuspense(HanhKiemPage) },
      { path: "lopchunhiem", element: withSuspense(LopChuNhiem) },
      { path: "dangky-lop", element: withSuspense(TeacherRegisterPhanCong) },
      { path: "xin-nghi", element: withSuspense(TeacherLeaveRequestPage) },
      { path: "duyet-nghi", element: withSuspense(lazy(() => import("../features/teacher/TeacherDuyetNghi.jsx"))) },
      { path: "baikiemtra", element: withSuspense(lazy(() => import("../features/teacher/baikiemtra/TeacherBaiKiemTra.jsx"))) }
    ]
  },
  {
    path: "/student",
    element: (
      <PrivateRoute roles={["HOCSINH"]}>
        <ChunkErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <StudentLayout />
          </Suspense>
        </ChunkErrorBoundary>
      </PrivateRoute>
    ),
    children: [
      { path: "home", element: withSuspense(StudentHome) },
      { path: "timetable", element: withSuspense(TimetablePage) },
      { path: "score", element: withSuspense(ScorePage) },
      { path: "hocba", element: withSuspense(HocBaPage) },
      { path: "diemdanh", element: withSuspense(StudentDiemDanhPage) },
      { path: "khen-thuong", element: withSuspense(KhenThuongPage) },
      { path: "conduct", element: withSuspense(ConductPage) },
      { path: "thongbao", element: withSuspense(StudentThongBao) },
      { path: "lichthi", element: withSuspense(StudentLichThi) },
      { path: "baikiemtra", element: withSuspense(lazy(() => import("../features/student/baikiemtra/StudentBaiKiemTra.jsx"))) },
      { path: "profile", element: withSuspense(ProfilePage) },
      { path: "profile/change-password", element: withSuspense(ChangePassword) }
    ]
  },
  {
    path: "/parent",
    element: (
      <PrivateRoute roles={["PHUHUYNH"]}>
        <ChunkErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <ParentLayout />
          </Suspense>
        </ChunkErrorBoundary>
      </PrivateRoute>
    ),
    children: [
      { path: "home", element: withSuspense(ParentHome) },
      { path: "score", element: withSuspense(ScoreFollow) },
      { path: "timetable", element: withSuspense(TimetableFollow) },
      { path: "profile", element: withSuspense(ParentProfile) },
      { path: "diemdanh", element: withSuspense(ParentDiemDanh) },
      { path: "thongbao", element: withSuspense(ParentThongBao) },
      { path: "xinnghi", element: withSuspense(ParentXinNghi) },
      { path: "profile/change-password", element: withSuspense(ChangePassword) }
    ]
  },
  { path: "*", element: <NotFound /> }
];

export default routes;
