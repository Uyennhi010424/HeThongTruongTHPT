import { useEffect, useMemo, useState } from "react";
import Header from "../../../components/common/Header.jsx";
import { getGiaoVien } from "../../../api/giaovienApi.js";
import { getHocSinh } from "../../../api/hocsinhApi.js";
import { getLop } from "../../../api/lopApi.js";
import { getMonHoc } from "../../../api/monhocApi.js";
import { getNamHoc } from "../../../api/namhocApi.js";
import { getHocKy } from "../../../api/hockyApi.js";
import { getUsers } from "../../../api/userApi.js";
import { getThongBao } from "../../../api/thongbaoApi.js";

export default function ReportPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState({
    teachers: [],
    students: [],
    classes: [],
    subjects: [],
    years: [],
    semesters: [],
    users: [],
    notices: []
  });

  useEffect(() => {
    let active = true;

    const fetchAll = async () => {
      try {
        setLoading(true);
        setError("");
        const [
          teacherRes,
          studentRes,
          classRes,
          subjectRes,
          yearRes,
          semesterRes,
          userRes,
          noticeRes
        ] = await Promise.all([
          getGiaoVien(),
          getHocSinh(),
          getLop(),
          getMonHoc(),
          getNamHoc(),
          getHocKy(),
          getUsers(),
          getThongBao()
        ]);

        if (!active) return;
        setData({
          teachers: teacherRes?.data?.data || [],
          students: studentRes?.data?.data || [],
          classes: classRes?.data?.data || [],
          subjects: subjectRes?.data?.data || [],
          years: yearRes?.data?.data || [],
          semesters: semesterRes?.data?.data || [],
          users: userRes?.data?.data || [],
          notices: noticeRes?.data?.data || []
        });
      } catch (err) {
        if (!active) return;
        setError("Không thể tải dữ liệu báo cáo.");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchAll();

    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    const activeStudents = data.students.filter((s) => s.trangThai === 1).length;
    const activeUsers = data.users.filter((u) => u.status === 1).length;
    const activeNotices = data.notices.filter((n) => n.trangThai === 1).length;
    return {
      teachers: data.teachers.length,
      students: data.students.length,
      activeStudents,
      classes: data.classes.length,
      subjects: data.subjects.length,
      years: data.years.length,
      semesters: data.semesters.length,
      users: data.users.length,
      activeUsers,
      notices: data.notices.length,
      activeNotices
    };
  }, [data]);

  return (
    <div className="page users-page">
      <Header title="Báo cáo & thống kê" />

      <div className="card users-toolbar">
        <div>
          <div className="users-title">Tổng quan nhà trường</div>
          <div className="users-subtitle">
            Số liệu tổng hợp từ các danh mục đang quản lý
          </div>
        </div>
      </div>

      {error && <div className="card table-empty">{error}</div>}

      <div className="users-stats">
        <div className="stat-card stat-blue">
          <div className="stat-label">Giáo viên</div>
          <div className="stat-value">{loading ? "..." : stats.teachers}</div>
        </div>
        <div className="stat-card stat-sky">
          <div className="stat-label">Học sinh</div>
          <div className="stat-value">{loading ? "..." : stats.students}</div>
        </div>
        <div className="stat-card stat-ice">
          <div className="stat-label">Đang học</div>
          <div className="stat-value">{loading ? "..." : stats.activeStudents}</div>
        </div>
        <div className="stat-card stat-ice">
          <div className="stat-label">Lớp học</div>
          <div className="stat-value">{loading ? "..." : stats.classes}</div>
        </div>
      </div>

      <div className="users-stats">
        <div className="stat-card stat-blue">
          <div className="stat-label">Môn học</div>
          <div className="stat-value">{loading ? "..." : stats.subjects}</div>
        </div>
        <div className="stat-card stat-sky">
          <div className="stat-label">Năm học</div>
          <div className="stat-value">{loading ? "..." : stats.years}</div>
        </div>
        <div className="stat-card stat-ice">
          <div className="stat-label">Học kỳ</div>
          <div className="stat-value">{loading ? "..." : stats.semesters}</div>
        </div>
        <div className="stat-card stat-ice">
          <div className="stat-label">Thông báo</div>
          <div className="stat-value">{loading ? "..." : stats.notices}</div>
        </div>
      </div>

      <div className="card users-table">
        <div className="table-header">
          <div>
            <div className="panel-title">Tình trạng tài khoản</div>
            <div className="panel-subtitle">Theo dõi số lượng tài khoản hoạt động</div>
          </div>
        </div>
        <div className="table-grid">
          <div className="table-row table-head">
            <div>Chỉ số</div>
            <div>Giá trị</div>
          </div>
          <div className="table-row">
            <div className="table-title">Tổng tài khoản</div>
            <div>{loading ? "..." : stats.users}</div>
          </div>
          <div className="table-row">
            <div className="table-title">Tài khoản hoạt động</div>
            <div>{loading ? "..." : stats.activeUsers}</div>
          </div>
          <div className="table-row">
            <div className="table-title">Thông báo đang hiển thị</div>
            <div>{loading ? "..." : stats.activeNotices}</div>
          </div>
        </div>
      </div>
    </div>
  );
}