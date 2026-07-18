import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { getChuNhiem } from "../api/chunhiemApi.js";
import { getGiaoVien, getCurrentGiaoVien } from "../api/giaovienApi.js";
import EduSidebar from "../components/edu/EduSidebar.jsx";
import EduTopBar from "../components/edu/EduTopBar.jsx";
import Toast from "../components/common/Toast.jsx";
import PasswordChangeBanner from "../components/common/PasswordChangeBanner.jsx";
import { TEACHER_NAV } from "../config/teacherNav.js";
import {
  findTeacherByUsername,
  getCurrentUsernameFromToken,
  getTeacherRoleLabel,
  getHomeroomAssignment
} from "../utils/teacherProfile.js";

const links = TEACHER_NAV;

export default function TeacherLayout() {
  const { pathname } = useLocation();
  const isDesktop = typeof window !== "undefined" && window.innerWidth >= 1024;
  const [menuOpen, setMenuOpen] = useState(isDesktop);
  const [profile, setProfile] = useState({ teacher: null, assignments: [] });

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    let active = true;

    const fetchProfile = async () => {
      try {
        const [teacherRes, assignmentRes, meRes] = await Promise.all([
          getGiaoVien(),
          getChuNhiem(),
          getCurrentGiaoVien().catch(() => null)
        ]);
        if (!active) return;

        const teachers = teacherRes?.data?.data || [];
        const assignments = assignmentRes?.data?.data || [];
        const currentUsername = getCurrentUsernameFromToken();
        const teacher = meRes?.data?.data || findTeacherByUsername(teachers, currentUsername);

        setProfile({ teacher, assignments });
      } catch {
        if (!active) return;
        setProfile({ teacher: null, assignments: [] });
      }
    };

    fetchProfile();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  return (
    <div className="min-h-screen overflow-hidden bg-background font-sans text-on-background">
      <EduSidebar
        links={links.filter(item => item.group !== "Chủ nhiệm" || getHomeroomAssignment(profile.teacher, profile.assignments) !== null)}
        title="Giáo viên"
        subtitle="Hệ thống quản lý giáo dục"
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
      />
      <EduTopBar
        searchPlaceholder="Tìm kiếm học sinh, lớp học, môn học..."
        userName={profile.teacher?.hoTen || "Giáo viên"}
        userRole={getTeacherRoleLabel(profile.teacher, profile.assignments)}
        onToggle={() => setMenuOpen((current) => !current)}
        isOpen={menuOpen}
      />
      <Toast />
      <main className={`mt-16 h-[calc(100vh-64px)] overflow-y-auto custom-scrollbar transition-all duration-200 ${menuOpen ? "lg:ml-[280px]" : "lg:ml-0"}`}>
        <PasswordChangeBanner />
        <div className="mx-auto max-w-container-max p-lg">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
