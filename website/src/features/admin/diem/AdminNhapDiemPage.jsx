import { Link } from "react-router-dom";
import MaterialIcon from "../../../components/edu/MaterialIcon.jsx";
import PageHeader from "../../../components/edu/PageHeader.jsx";

export default function AdminNhapDiemPage() {
  return (
    <div className="space-y-lg">
      <PageHeader
        title="Nhập / Quản lý Điểm"
        description="Theo dõi và quản lý điểm số toàn trường. Giáo viên nhập điểm qua portal giáo viên."
      />
      <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-xl text-center shadow-card">
        <MaterialIcon name="grade" className="mx-auto mb-md text-5xl text-secondary" />
        <p className="mb-lg font-body-md text-on-surface-variant">
          Chức năng nhập điểm chi tiết dùng giao diện giáo viên. Quản trị có thể xem báo cáo tổng hợp tại mục Báo cáo.
        </p>
        <div className="flex flex-wrap justify-center gap-md">
          <Link
            to="/admin/report"
            className="rounded-xl bg-primary px-lg py-md font-label-md text-on-primary shadow-md hover:brightness-110"
          >
            Xem báo cáo điểm
          </Link>
          <a
            href="/login/teacher"
            className="rounded-xl border border-secondary px-lg py-md font-label-md text-secondary hover:bg-secondary/5"
          >
            Mở portal giáo viên
          </a>
        </div>
      </section>
    </div>
  );
}
