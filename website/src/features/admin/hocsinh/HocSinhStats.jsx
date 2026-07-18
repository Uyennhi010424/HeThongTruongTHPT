export default function HocSinhStats({ loading, stats }) {
  return (
    <div className="users-stats">
      <div className="stat-card stat-blue">
        <div className="stat-label">Tổng học sinh</div>
        <div className="stat-value">{loading ? "..." : stats.total}</div>
      </div>
      <div className="stat-card stat-sky">
        <div className="stat-label">Đang học</div>
        <div className="stat-value">{loading ? "..." : stats.activeCount}</div>
      </div>
      <div className="stat-card stat-ice">
        <div className="stat-label">Ngừng học</div>
        <div className="stat-value">{loading ? "..." : stats.pausedCount}</div>
      </div>
    </div>
  );
}
