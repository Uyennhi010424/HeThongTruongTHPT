import { useEffect, useMemo, useState } from "react";
import { getHocBa } from "../../api/hocbaApi.js";
import { getCurrentHocSinh } from "../../api/hocsinhApi.js";
import { getNamHoc } from "../../api/namhocApi.js";

const getHocLucLabel = (value) => {
  switch (value) {
    case "TOT":
    case "GIOI": return { label: "Tốt", color: "text-green-700 bg-green-50" };
    case "KHA": return { label: "Khá", color: "text-blue-700 bg-blue-50" };
    case "DAT":
    case "TRUNG_BINH": return { label: "Đạt", color: "text-yellow-700 bg-yellow-50" };
    case "CHUA_DAT":
    case "YEU":
    case "KEM": return { label: "Chưa đạt", color: "text-red-700 bg-red-50" };
    default: return { label: value || "--", color: "text-gray-700 bg-gray-50" };
  }
};

const getHanhKiemLabel = (value) => {
  switch (value) {
    case "TOT": return { label: "Tốt", color: "text-green-700 bg-green-50" };
    case "KHA": return { label: "Khá", color: "text-blue-700 bg-blue-50" };
    case "TRUNG_BINH": return { label: "Trung bình", color: "text-yellow-700 bg-yellow-50" };
    case "YEU": return { label: "Yếu", color: "text-red-700 bg-red-50" };
    default: return { label: value || "--", color: "text-gray-700 bg-gray-50" };
  }
};

export default function HocBaPage() {
  const [hocBaList, setHocBaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedNamHoc, setSelectedNamHoc] = useState("all");
  const [namHocList, setNamHocList] = useState([]);
  const [student, setStudent] = useState(null);

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");
        const [studentRes, namHocRes] = await Promise.all([
          getCurrentHocSinh(),
          getNamHoc()
        ]);
        if (!active) return;

        const currentStudent = studentRes?.data?.data || null;
        setStudent(currentStudent);

        if (!currentStudent) {
          setLoading(false);
          return;
        }

        const hocBaRes = await getHocBa({ hocSinhId: currentStudent.id });
        if (!active) return;
        setHocBaList(hocBaRes?.data?.data || []);

        const years = (namHocRes?.data?.data || [])
          .map((item) => item?.tenNamHoc || "")
          .filter(Boolean)
          .sort((a, b) => Number(b.match(/(\d{4})/)?.[1] || 0) - Number(a.match(/(\d{4})/)?.[1] || 0));
        setNamHocList(years);
      } catch {
        if (!active) return;
        setError("Không thể tải học bạ.");
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchData();
    return () => { active = false; };
  }, []);

  const filteredHocBa = useMemo(() => {
    if (selectedNamHoc === "all") return hocBaList;
    return hocBaList.filter((hb) => hb?.namHoc === selectedNamHoc || hb?.namHoc?.tenNamHoc === selectedNamHoc);
  }, [hocBaList, selectedNamHoc]);

  const latestHocBa = filteredHocBa.length > 0 ? filteredHocBa[0] : null;

  return (
    <div className="student-page">
      <section className="student-hero card">
        <div className="student-hero-copy">
          <div className="student-hero-kicker">EduManager Pro</div>
          <h2 className="student-hero-title">Học bạ</h2>
          <p className="student-hero-subtitle">Xem kết quả học tập và hạnh kiểm qua các năm học.</p>
        </div>
        <div className="student-hero-metrics">
          <div className="student-hero-chip">{loading ? "..." : hocBaList.length} năm học</div>
        </div>
      </section>

      <div className="card users-toolbar">
        <div className="users-actions">
          <label className="form-field">
            <span>Năm học</span>
            <select value={selectedNamHoc} onChange={(e) => setSelectedNamHoc(e.target.value)}>
              <option value="all">Tất cả</option>
              {namHocList.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </label>
        </div>
      </div>

      {error && <div className="card table-empty">{error}</div>}

      {!error && !loading && hocBaList.length === 0 && (
        <div className="card table-empty">Chưa có học bạ nào. Vui lòng liên hệ giáo viên chủ nhiệm.</div>
      )}

      {!error && latestHocBa && (
        <div className="card" style={{ padding: "20px 24px" }}>
          <div className="panel-title" style={{ marginBottom: 16 }}>Thông tin học bạ mới nhất</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            <div className="stat-card stat-blue">
              <div className="stat-label">Điểm TB cả năm</div>
              <div className="stat-value">{latestHocBa.diemTBCaNam ?? "--"}</div>
            </div>
            <div className="stat-card stat-sky">
              <div className="stat-label">Học lực</div>
              <div className="stat-value">
                <span className={getHocLucLabel(latestHocBa.hocLuc).color} style={{ padding: "2px 8px", borderRadius: 4 }}>
                  {getHocLucLabel(latestHocBa.hocLuc).label}
                </span>
              </div>
            </div>
            <div className="stat-card stat-ice">
              <div className="stat-label">Hạnh kiểm</div>
              <div className="stat-value">
                <span className={getHanhKiemLabel(latestHocBa.hanhKiem).color} style={{ padding: "2px 8px", borderRadius: 4 }}>
                  {getHanhKiemLabel(latestHocBa.hanhKiem).label}
                </span>
              </div>
            </div>
            <div className="stat-card stat-navy">
              <div className="stat-label">Năm học</div>
              <div className="stat-value">{latestHocBa.namHoc?.tenNamHoc || latestHocBa.namHoc || "--"}</div>
            </div>
          </div>
        </div>
      )}

      {!error && filteredHocBa.length > 0 && (
        <div className="card users-table">
          <div className="table-header">
            <div>
              <div className="panel-title">Lịch sử học bạ</div>
              <div className="panel-subtitle">Kết quả học tập qua các năm học</div>
            </div>
            <div className="panel-pill">{filteredHocBa.length} bản ghi</div>
          </div>
          <div className="table-grid">
            <div className="table-row table-head">
              <div>Năm học</div>
              <div>Điểm TB</div>
              <div>Học lực</div>
              <div>Hạnh kiểm</div>
              <div>Ngày xếp loại</div>
            </div>
            {filteredHocBa.map((hb) => {
              const hocLuc = getHocLucLabel(hb.hocLuc);
              const hanhKiem = getHanhKiemLabel(hb.hanhKiem);
              return (
                <div key={hb.id} className="table-row">
                  <div className="table-title">{hb.namHoc?.tenNamHoc || hb.namHoc || "--"}</div>
                  <div><strong>{hb.diemTBCaNam ?? "--"}</strong></div>
                  <div>
                    <span className={hocLuc.color} style={{ padding: "2px 8px", borderRadius: 4 }}>
                      {hocLuc.label}
                    </span>
                  </div>
                  <div>
                    <span className={hanhKiem.color} style={{ padding: "2px 8px", borderRadius: 4 }}>
                      {hanhKiem.label}
                    </span>
                  </div>
                  <div>{hb.ngayXepLoai ? new Date(hb.ngayXepLoai).toLocaleDateString("vi-VN") : "--"}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
