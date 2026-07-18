import Header from "../../components/common/Header.jsx";

export default function ProfileView() {
  return (
    <div className="page users-page">
      <Header title="Thông tin cá nhân" />
      <div className="card">
        <div className="panel-title">Hồ sơ</div>
        <div className="panel-subtitle">Xem thông tin cá nhân của bạn.</div>
        <div className="mt-4">Nội dung hồ sơ sẽ hiển thị ở đây.</div>
      </div>
    </div>
  );
}
