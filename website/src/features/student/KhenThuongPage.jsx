import { useEffect, useMemo, useState } from "react";
import { getKhenThuong, getViPham } from "../../api/khenThuongViPhamApi.js";
import { getCurrentHocSinh } from "../../api/hocsinhApi.js";

const MUC_DO_MAP = {
  NHE: { label: "Nhẹ", color: "text-yellow-700 bg-yellow-50" },
  TRUNG_BINH: { label: "Trung bình", color: "text-orange-700 bg-orange-50" },
  NGHIEM_TRONG: { label: "Nghiêm trọng", color: "text-red-700 bg-red-50" }
};

export default function KhenThuongPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [student, setStudent] = useState(null);
  const [khenThuong, setKhenThuong] = useState([]);
  const [viPham, setViPham] = useState([]);
  const [activeTab, setActiveTab] = useState("khen-thuong");

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");
        const studentRes = await getCurrentHocSinh();
        if (!active) return;
        const currentStudent = studentRes?.data?.data || null;
        setStudent(currentStudent);

        if (!currentStudent) {
          setLoading(false);
          return;
        }

        const [ktRes, vpRes] = await Promise.all([
          getKhenThuong({ hocSinhId: currentStudent.id }),
          getViPham({ hocSinhId: currentStudent.id })
        ]);
        if (!active) return;
        setKhenThuong(ktRes?.data?.data || []);
        setViPham(vpRes?.data?.data || []);
      } catch {
        if (!active) return;
        setError("Không thể tải dữ liệu khen thưởng/vi phạm.");
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchData();
    return () => { active = false; };
  }, []);

  const currentList = activeTab === "khen-thuong" ? khenThuong : viPham;

  return (
    <div className="student-page">
      <section className="student-hero card">
        <div className="student-hero-copy">
          <div className="student-hero-kicker">EduManager Pro</div>
          <h2 className="student-hero-title">Khen thưởng & Vi phạm</h2>
          <p className="student-hero-subtitle">Xem các khen thưởng và vi phạm của bản thân.</p>
        </div>
        <div className="student-hero-metrics">
          <div className="student-hero-chip">{loading ? "..." : khenThuong.length} khen thưởng</div>
          <div className="student-hero-chip">{loading ? "..." : viPham.length} vi phạm</div>
        </div>
      </section>

      <div className="card users-toolbar">
        <div className="semester-switch">
          {[
            { value: "khen-thuong", label: "Khen thưởng", icon: "emoji_events" },
            { value: "vi-pham", label: "Vi phạm", icon: "warning" }
          ].map((tab) => (
            <button
              key={tab.value}
              type="button"
              className={`semester-pill ${activeTab === tab.value ? "active" : ""}`}
              onClick={() => setActiveTab(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="card table-empty">{error}</div>}

      {!error && !loading && currentList.length === 0 && (
        <div className="card table-empty">
          {activeTab === "khen-thuong"
            ? "Chưa có khen thưởng nào."
            : "Chưa có vi phạm nào. Tiếp tục phát huy!"}
        </div>
      )}

      {!error && currentList.length > 0 && (
        <div className="card users-table">
          <div className="table-header">
            <div>
              <div className="panel-title">
                {activeTab === "khen-thuong" ? "Danh sách khen thưởng" : "Danh sách vi phạm"}
              </div>
            </div>
            <div className="panel-pill">{currentList.length} bản ghi</div>
          </div>
          <div className="table-grid">
            <div className="table-row table-head">
              <div>STT</div>
              <div>Nội dung</div>
              {activeTab === "vi-pham" && <div>Mức độ</div>}
              <div>Ngày</div>
            </div>
            {currentList.map((item, idx) => (
              <div key={item.id} className="table-row">
                <div>{idx + 1}</div>
                <div className="table-title">{item.noiDung || "--"}</div>
                {activeTab === "vi-pham" && (
                  <div>
                    {item.mucDo ? (
                      <span
                        className={MUC_DO_MAP[item.mucDo]?.color || "text-gray-700 bg-gray-50"}
                        style={{ padding: "2px 8px", borderRadius: 4 }}
                      >
                        {MUC_DO_MAP[item.mucDo]?.label || item.mucDo}
                      </span>
                    ) : "--"}
                  </div>
                )}
                <div>
                  {(item.ngayKhen || item.ngayViPham)
                    ? new Date(item.ngayKhen || item.ngayViPham).toLocaleDateString("vi-VN")
                    : "--"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
