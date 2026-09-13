import { useState, useRef, useEffect, useMemo } from "react";
import { Search, ChevronDown, Check, X, User } from "lucide-react";
import SimpleModal from "../../../components/modal/SimpleModal.jsx";
import { formatPhoneDisplay, buildStudentEmailPreview, validateStudentAgeAndYear, calculateAdmissionYear } from "./hocSinhUtils.js";
import { normalizeText } from "../../../utils/normalizeText.js";

function ParentSearchableCombobox({ parents = [], value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearch("");
    }
  }, [isOpen]);

  const uniqueParents = useMemo(() => {
    const seenIds = new Set();
    const seenKeys = new Set();
    const list = [];
    for (const p of parents || []) {
      if (!p || !p.id) continue;
      const idKey = String(p.id);
      const nameKey = normalizeText(p.hoTen || "");
      const phoneKey = String(p.soDienThoai || p.sdt || "").replace(/\D/g, "");
      const fullKey = `${nameKey}|${phoneKey}`;

      if (!seenIds.has(idKey) && (!fullKey || !seenKeys.has(fullKey))) {
        seenIds.add(idKey);
        if (fullKey && fullKey !== "|") seenKeys.add(fullKey);
        list.push(p);
      }
    }
    return list;
  }, [parents]);

  const selectedParent = useMemo(() => {
    if (!value) return null;
    return uniqueParents.find((p) => String(p.id) === String(value)) || null;
  }, [uniqueParents, value]);

  const filteredParents = useMemo(() => {
    if (!search.trim()) return uniqueParents;
    const normSearch = normalizeText(search);
    const digitsOnly = search.replace(/\D/g, "");

    return uniqueParents.filter((p) => {
      const normName = normalizeText(p.hoTen || "");
      const phoneDigits = String(p.soDienThoai || p.sdt || "").replace(/\D/g, "");
      const normEmail = normalizeText(p.email || "");

      const matchName = normName.includes(normSearch);
      const matchPhone = digitsOnly && phoneDigits.includes(digitsOnly);
      const matchEmail = normEmail.includes(normSearch);

      return matchName || matchPhone || matchEmail;
    });
  }, [uniqueParents, search]);

  return (
    <div style={{ position: "relative", width: "100%" }} ref={containerRef}>
      {/* Combobox Trigger */}
      <div
        tabIndex={0}
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsOpen((prev) => !prev);
          }
        }}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 12px",
          borderRadius: "10px",
          border: isOpen ? "1px solid #93c5fd" : "1px solid #cbd5e1",
          background: "#fcfdff",
          fontSize: "13px",
          minHeight: "42px",
          cursor: "pointer",
          userSelect: "none",
          boxShadow: isOpen ? "0 0 0 2px rgba(59, 130, 246, 0.15)" : "none",
          transition: "all 0.15s ease"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          <User style={{ width: "14px", height: "14px", color: "#94a3b8", flexShrink: 0 }} />
          {selectedParent ? (
            <span style={{ fontWeight: 600, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {selectedParent.hoTen || `Phụ huynh #${selectedParent.id}`}
              {selectedParent.soDienThoai && (
                <span style={{ color: "#64748b", fontWeight: 400, marginLeft: "4px" }}>
                  - {formatPhoneDisplay(selectedParent.soDienThoai)}
                </span>
              )}
            </span>
          ) : (
            <span style={{ color: "#94a3b8" }}>Chọn phụ huynh có sẵn...</span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0, marginLeft: "4px" }}>
          {selectedParent && (
            <span
              role="button"
              tabIndex={0}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onChange(null);
                setIsOpen(false);
              }}
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
                setIsOpen(false);
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "2px",
                borderRadius: "50%",
                color: "#94a3b8",
                cursor: "pointer"
              }}
              title="Bỏ chọn (nhập mới)"
            >
              <X style={{ width: "12px", height: "12px" }} />
            </span>
          )}
          <ChevronDown
            style={{
              width: "14px",
              height: "14px",
              color: isOpen ? "#2563eb" : "#94a3b8",
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease"
            }}
          />
        </div>
      </div>

      {/* Dropdown Menu - Exact width, compact, displayed ABOVE trigger */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            left: 0,
            width: "100%",
            bottom: "calc(100% + 4px)",
            background: "#ffffff",
            borderRadius: "8px",
            boxShadow: "0 -8px 25px -4px rgba(0, 0, 0, 0.12), 0 -4px 10px -4px rgba(0, 0, 0, 0.08)",
            border: "1px solid #e2e8f0",
            zIndex: 300,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            maxHeight: "260px"
          }}
        >
          {/* Top Search Input */}
          <div
            style={{
              padding: "6px 8px",
              borderBottom: "1px solid #f1f5f9",
              background: "#f8fafc",
              flexShrink: 0
            }}
          >
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <Search
                style={{
                  position: "absolute",
                  left: "8px",
                  width: "13px",
                  height: "13px",
                  color: "#94a3b8",
                  pointerEvents: "none"
                }}
              />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm tên hoặc SĐT..."
                style={{
                  width: "100%",
                  padding: "4px 22px 4px 26px",
                  height: "28px",
                  background: "#ffffff",
                  border: "1px solid #cbd5e1",
                  borderRadius: "6px",
                  fontSize: "12px",
                  color: "#1e293b",
                  outline: "none",
                  boxShadow: "none"
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#3b82f6";
                  e.target.style.boxShadow = "0 0 0 1px #3b82f6";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#cbd5e1";
                  e.target.style.boxShadow = "none";
                }}
              />
              {search && (
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setSearch("");
                  }}
                  onClick={() => setSearch("")}
                  style={{
                    position: "absolute",
                    right: "4px",
                    background: "none",
                    border: "none",
                    padding: "2px",
                    cursor: "pointer",
                    color: "#94a3b8",
                    display: "flex",
                    alignItems: "center"
                  }}
                >
                  <X style={{ width: "12px", height: "12px" }} />
                </button>
              )}
            </div>
          </div>

          {/* List items */}
          <div
            style={{
              overflowY: "auto",
              flex: 1,
              maxHeight: "180px",
              padding: "3px"
            }}
          >
            {/* Clear selection option */}
            <div
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(null);
                setIsOpen(false);
              }}
              onClick={() => {
                onChange(null);
                setIsOpen(false);
              }}
              style={{
                padding: "5px 8px",
                borderRadius: "5px",
                fontSize: "12px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: !selectedParent ? "#eff6ff" : "transparent",
                color: !selectedParent ? "#1d4ed8" : "#64748b",
                fontWeight: !selectedParent ? 600 : 400,
                marginBottom: "2px"
              }}
              onMouseEnter={(e) => {
                if (selectedParent) e.currentTarget.style.background = "#f1f5f9";
              }}
              onMouseLeave={(e) => {
                if (selectedParent) e.currentTarget.style.background = "transparent";
              }}
            >
              <span style={{ fontStyle: "italic" }}>-- Nhập phụ huynh mới --</span>
              {!selectedParent && <Check style={{ width: "13px", height: "13px", color: "#2563eb", flexShrink: 0 }} />}
            </div>

            {filteredParents.length === 0 ? (
              <div style={{ padding: "12px 8px", textAlign: "center", fontSize: "11px", color: "#94a3b8", fontStyle: "italic" }}>
                Không tìm thấy phụ huynh "{search}"
              </div>
            ) : (
              filteredParents.map((item) => {
                const isSelected = selectedParent && String(selectedParent.id) === String(item.id);
                return (
                  <div
                    key={item.id}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onChange(item);
                      setIsOpen(false);
                    }}
                    onClick={() => {
                      onChange(item);
                      setIsOpen(false);
                    }}
                    style={{
                      padding: "5px 8px",
                      borderRadius: "5px",
                      fontSize: "12px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      background: isSelected ? "#eff6ff" : "transparent",
                      color: isSelected ? "#1e3a8a" : "#334155",
                      marginBottom: "1px"
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = "#f8fafc";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: "6px" }}>
                      <span style={{ fontWeight: isSelected ? 700 : 500, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {item.hoTen || `Phụ huynh #${item.id}`}
                      </span>
                      <span style={{ fontSize: "10.5px", color: "#64748b" }}>
                        {item.soDienThoai ? formatPhoneDisplay(item.soDienThoai) : (item.sdt ? formatPhoneDisplay(item.sdt) : "Chưa có SĐT")}
                        {item.ngheNghiep ? ` • ${item.ngheNghiep}` : ""}
                      </span>
                    </div>
                    {isSelected && <Check style={{ width: "13px", height: "13px", color: "#2563eb", flexShrink: 0 }} />}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer count */}
          <div
            style={{
              padding: "3px 8px",
              background: "#f8fafc",
              borderTop: "1px solid #f1f5f9",
              fontSize: "10px",
              color: "#94a3b8",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexShrink: 0
            }}
          >
            <span>{filteredParents.length}/{parents.length} phụ huynh</span>
            {search && <span style={{ color: "#2563eb", fontWeight: 500 }}>Đang lọc</span>}
          </div>
        </div>
      )}
    </div>
  );
}

export default function HocSinhFormModal({ hooks }) {
  const {
    modalOpen, setModalOpen,
    editingStudent,
    form, setForm,
    formError, classesByGrade, parents,
    handleSubmit
  } = hooks;

  let selectedKhoi = null;
  let selectedClass = null;
  for (const group of classesByGrade) {
    const found = group.items.find(lop => String(lop.id) === String(form.lopHocId));
    if (found) {
      selectedKhoi = group.grade;
      selectedClass = found;
      break;
    }
  }

  const prevLopIdRef = useRef(form.lopHocId);
  useEffect(() => {
    if (prevLopIdRef.current !== form.lopHocId) {
      prevLopIdRef.current = form.lopHocId;
      if (selectedClass) {
        const computedYear = calculateAdmissionYear(selectedClass.namHoc, selectedClass.khoi);
        setForm((prev) => ({ ...prev, namNhapHoc: computedYear }));
      }
    }
  }, [form.lopHocId, selectedClass, setForm]);

  const recommendedYear = selectedClass
    ? calculateAdmissionYear(selectedClass.namHoc, selectedClass.khoi)
    : new Date().getFullYear();

  const yearOptions = useMemo(() => {
    const list = [];
    const maxYear = recommendedYear;

    for (let y = maxYear; y >= Math.max(2010, maxYear - 15); y--) {
      list.push({
        value: y,
        label: `${y}`
      });
    }

    if (form.namNhapHoc && !list.some(opt => opt.value === Number(form.namNhapHoc))) {
      list.push({
        value: Number(form.namNhapHoc),
        label: `${form.namNhapHoc}`
      });
      list.sort((a, b) => b.value - a.value);
    }

    return list;
  }, [recommendedYear, form.namNhapHoc]);

  const ageError = validateStudentAgeAndYear(form.ngaySinh, form.namNhapHoc, selectedKhoi, selectedClass?.namHoc);

  return (
    <SimpleModal
      open={modalOpen}
      title={editingStudent ? "Cập nhật học sinh" : "Thêm học sinh"}
      onClose={() => setModalOpen(false)}
      width={720}
    >
      <form className="form-grid form-grid-student" onSubmit={handleSubmit}>
        <label className="form-field">
          <span>Họ và tên <span style={{color: '#ef4444'}}>*</span></span>
          <input
            value={form.hoTen}
            onChange={(event) => {
              const newName = event.target.value;
              setForm((prev) => ({ 
                ...prev, 
                hoTen: newName,
                email: buildStudentEmailPreview(newName)
              }));
            }}
            placeholder="vd: Nguyễn Văn A"
          />
        </label>
        <label className="form-field">
          <span>Ngày sinh <span style={{color: '#ef4444'}}>*</span></span>
          <input
            type="date"
            value={form.ngaySinh}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, ngaySinh: event.target.value }))
            }
          />
          {ageError && <div className="field-error-text" style={{color: 'red', fontSize: '0.85rem', marginTop: '4px'}}>{ageError}</div>}
        </label>
        <label className="form-field">
          <span>Giới tính <span style={{color: '#ef4444'}}>*</span></span>
          <select
            value={form.gioiTinh}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, gioiTinh: event.target.value }))
            }
          >
            <option value="true">Nam</option>
            <option value="false">Nữ</option>
          </select>
        </label>
        <label className="form-field">
          <span>Lớp học <span style={{color: '#ef4444'}}>*</span></span>
          <select
            value={form.lopHocId}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, lopHocId: event.target.value }))
            }
          >
            <option value="">Chọn lớp</option>
            {classesByGrade.map((group) => (
              <optgroup key={group.grade} label={`Khối ${group.grade}`}>
                {group.items.map((lop) => (
                  <option key={lop.id} value={lop.id}>
                    {lop.tenLop}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <label className="form-field">
          <span>Dân tộc <span style={{color: '#ef4444'}}>*</span></span>
          <input
            value={form.danTocTen}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, danTocTen: event.target.value }))
            }
            placeholder="vd: Kinh, Tày, Nùng..."
          />
        </label>
        <label className="form-field">
          <span>Tôn giáo <span style={{color: '#ef4444'}}>*</span></span>
          <select
            value={form.tonGiao || "Không"}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, tonGiao: event.target.value }))
            }
          >
            <option value="Không">Không</option>
            <option value="Phật giáo">Phật giáo</option>
            <option value="Công giáo">Công giáo</option>
            <option value="Thiên Chúa giáo">Thiên Chúa giáo</option>
            <option value="Cao Đài">Cao Đài</option>
            <option value="Hòa Hảo">Hòa Hảo</option>
            <option value="Tin Lành">Tin Lành</option>
            <option value="Hồi giáo">Hồi giáo</option>
            <option value="Khác">Khác</option>
            {form.tonGiao && !["Không", "Phật giáo", "Công giáo", "Thiên Chúa giáo", "Cao Đài", "Hòa Hảo", "Tin Lành", "Hồi giáo", "Khác"].includes(form.tonGiao) && (
              <option value={form.tonGiao}>{form.tonGiao}</option>
            )}
          </select>
        </label>
        <label className="form-field">
          <span>Số điện thoại <span style={{color: '#ef4444'}}>*</span></span>
          <input
            value={form.sdt}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, sdt: event.target.value }))
            }
            placeholder="vd: 0901234567"
          />
        </label>
        <label className="form-field">
          <span>Email</span>
          <input
            value={
              editingStudent ? form.email : buildStudentEmailPreview(form.hoTen)
            }
            readOnly
            placeholder="Tự động tạo theo tên học sinh"
          />
        </label>
        <label className="form-field">
          <span>Địa chỉ <span style={{color: '#ef4444'}}>*</span></span>
          <input
            value={form.diaChi}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, diaChi: event.target.value }))
            }
            placeholder="vd: 12 Nguyễn Trãi"
          />
        </label>
        <label className="form-field">
          <span>Năm nhập học <span style={{color: '#ef4444'}}>*</span></span>
          <select
            value={form.namNhapHoc || ""}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                namNhapHoc: event.target.value ? Number(event.target.value) : ""
              }))
            }
          >
            <option value="">-- Chọn năm nhập học --</option>
            {yearOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label className="form-field">
          <span>Mã BHYT <span style={{color: '#ef4444'}}>*</span></span>
          <input
            value={form.maBhyt}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, maBhyt: event.target.value }))
            }
            placeholder="vd: BHYT1234"
          />
        </label>
        <label className="form-field">
          <span>Diện chính sách <span style={{color: '#ef4444'}}>*</span></span>
          <select
            value={form.dienChinhSach}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, dienChinhSach: event.target.value }))
            }
          >
            <option value="false">Không</option>
            <option value="true">Có</option>
          </select>
        </label>
        <label className="form-field">
          <span>Trạng thái <span style={{color: '#ef4444'}}>*</span></span>
          <select
            value={form.trangThai}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                trangThai: Number(event.target.value)
              }))
            }
          >
            <option value={1}>Đang học</option>
            <option value={0}>Ngừng học</option>
          </select>
        </label>
        
        <div className="form-section-title">Thông tin phụ huynh (Bắt buộc chọn hoặc nhập mới)</div>
        <div className="form-field">
          <span>Phụ huynh (đã có)</span>
          <ParentSearchableCombobox
            parents={parents}
            value={form.phuHuynhId}
            onChange={(selected) => {
              if (!selected) {
                setForm((prev) => ({
                  ...prev,
                  phuHuynhId: "",
                  phuHuynhHoTen: "",
                  phuHuynhSdt: "",
                  phuHuynhEmail: "",
                  phuHuynhNgheNghiep: ""
                }));
              } else {
                setForm((prev) => ({
                  ...prev,
                  phuHuynhId: String(selected.id),
                  phuHuynhHoTen: selected.hoTen || "",
                  phuHuynhSdt: formatPhoneDisplay(selected.soDienThoai || selected.sdt || ""),
                  phuHuynhEmail: selected.email || "",
                  phuHuynhNgheNghiep: selected.ngheNghiep || ""
                }));
              }
            }}
          />
        </div>
        <label className="form-field">
          <span>Họ tên phụ huynh {form.phuHuynhId ? <span style={{color: '#2563eb', fontWeight: 500, fontSize: '11px'}}>(Từ phụ huynh đã chọn)</span> : <span style={{color: '#ef4444'}}>*</span>}</span>
          <input
            value={form.phuHuynhHoTen}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, phuHuynhHoTen: event.target.value }))
            }
            placeholder="vd: Nguyễn Văn B"
          />
        </label>
        <label className="form-field">
          <span>SĐT phụ huynh {form.phuHuynhId ? <span style={{color: '#2563eb', fontWeight: 500, fontSize: '11px'}}>(Từ phụ huynh đã chọn)</span> : <span style={{color: '#ef4444'}}>*</span>}</span>
          <input
            value={form.phuHuynhSdt}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, phuHuynhSdt: event.target.value }))
            }
            placeholder="vd: 0901234567"
          />
        </label>
        <label className="form-field">
          <span>Email phụ huynh {form.phuHuynhId && form.phuHuynhEmail && <span style={{color: '#2563eb', fontWeight: 500, fontSize: '11px'}}>(Từ phụ huynh đã chọn)</span>}</span>
          <input
            value={form.phuHuynhEmail}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, phuHuynhEmail: event.target.value }))
            }
            placeholder="vd: phuhuynh@gmail.com"
          />
        </label>
        <label className="form-field">
          <span>Nghề nghiệp phụ huynh {form.phuHuynhId ? <span style={{color: '#2563eb', fontWeight: 500, fontSize: '11px'}}>(Từ phụ huynh đã chọn)</span> : <span style={{color: '#ef4444'}}>*</span>}</span>
          <input
            value={form.phuHuynhNgheNghiep}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                phuHuynhNgheNghiep: event.target.value
              }))
            }
            placeholder="vd: Kinh doanh"
          />
        </label>
        
        {formError && <div className="form-error" style={{ gridColumn: '1 / -1' }}>{formError}</div>}
        
        <div className="form-actions" style={{ gridColumn: '1 / -1' }}>
          <button
            type="button"
            className="btn-outline"
            onClick={() => setModalOpen(false)}
          >
            Hủy
          </button>
          <button type="submit" className="btn-primary" disabled={!!ageError}>
            {editingStudent ? "Cập nhật" : "Thêm học sinh"}
          </button>
        </div>
      </form>
    </SimpleModal>
  );
}
