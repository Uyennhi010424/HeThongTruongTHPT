import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { getCurrentUsernameFromToken } from "../utils/teacherProfile.js";
import MainLayout from "./MainLayout.jsx";
import { ADMIN_NAV } from "../config/adminNav.js";

export default function AdminLayout() {
  const [userName, setUserName] = useState("Quản Trị Viên");

  useEffect(() => {
    const username = getCurrentUsernameFromToken();
    if (username) {
      setUserName(username.charAt(0).toUpperCase() + username.slice(1));
    }
  }, []);

  return (
    <MainLayout
      navItems={ADMIN_NAV}
      basePath="/admin"
      userName={userName}
      userRole="Admin"
    >
      <Outlet />
    </MainLayout>
  );
}
