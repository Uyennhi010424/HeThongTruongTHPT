import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { getCurrentGiaoVien } from "../api/giaovienApi.js";
import { TEACHER_NAV } from "../config/teacherNav.js";
import {
  getCurrentUsernameFromToken,
} from "../utils/teacherProfile.js";
import MainLayout from "./MainLayout.jsx";

export default function TeacherLayout() {
  const [profile, setProfile] = useState({ teacher: null, assignments: [] });

  useEffect(() => {
    let active = true;

    const fetchProfile = async () => {
      try {
        const meRes = await getCurrentGiaoVien().catch(() => null);
        if (!active) return;

        const teacher = meRes?.data?.data || null;
        setProfile({ teacher, assignments: [] });
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

  const navItems = TEACHER_NAV.filter(
    (item) => item.group !== "Chủ nhiệm" || profile.teacher?.isGvcn === true
  );

  return (
    <MainLayout
      navItems={navItems}
      basePath="/teacher"
      userName={profile.teacher?.hoTen || "Giáo viên"}
      userRole={profile.teacher?.isGvcn ? "Giáo viên chủ nhiệm" : "Giáo viên bộ môn"}
    >
      <Outlet />
    </MainLayout>
  );
}
